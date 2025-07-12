import 'server-only';
import { getCollection } from '@repo/database';
import { subMonths, differenceInDays, compareDesc } from 'date-fns';
import type {
    ClientCategorization,
    ClientBehaviorCategory,
    ClientSpendingCategory,
    ClientAnalytics,
    ClientCategoryStats
} from '../../../types/barfer';

/**
 * Categoriza clientes basado en su comportamiento de compra y gasto mensual
 */
export async function getClientCategorization(): Promise<ClientAnalytics> {
    try {
        const collection = await getCollection('orders');

        // Pipeline simplificado para evitar problemas de memoria
        const pipeline = [
            { $match: { status: { $in: ['pending', 'confirmed', 'delivered', 'cancelled'] } } },
            {
                $addFields: {
                    createdAt: {
                        $cond: [
                            { $eq: [{ $type: "$createdAt" }, "string"] },
                            { $toDate: "$createdAt" },
                            "$createdAt"
                        ]
                    }
                }
            },
            {
                $group: {
                    _id: { $ifNull: ['$user.id', '$user.email'] },
                    user: { $first: '$user' },
                    lastAddress: { $last: '$address' },
                    totalOrders: { $sum: 1 },
                    totalSpent: { $sum: '$total' },
                    firstOrderDate: { $min: '$createdAt' },
                    lastOrderDate: { $max: '$createdAt' },
                    // Solo guardar información esencial de órdenes para reducir memoria
                    orderDates: { $push: '$createdAt' },
                    orderItems: { $push: '$items' }
                }
            },
            {
                $addFields: {
                    averageOrderValue: { $divide: ['$totalSpent', '$totalOrders'] },
                    daysSinceFirstOrder: {
                        $divide: [
                            { $subtract: ['$$NOW', '$firstOrderDate'] },
                            1000 * 60 * 60 * 24
                        ]
                    },
                    daysSinceLastOrder: {
                        $divide: [
                            { $subtract: ['$$NOW', '$lastOrderDate'] },
                            1000 * 60 * 60 * 24
                        ]
                    }
                }
            }
        ];

        const clientsData = await collection.aggregate(pipeline, { allowDiskUse: true }).toArray();

        // Procesar cada cliente para asignar categorías
        const categorizedClients: ClientCategorization[] = clientsData.map(client => {
            const behaviorCategory = categorizeBehavior(client);

            // Reconstruir órdenes para compatibilidad con funciones existentes
            const orders = client.orderDates.map((date: Date, index: number) => ({
                date: date,
                items: client.orderItems[index] || []
            }));

            const totalWeight = calculateTotalWeightFromOrders(orders);

            // Calcular el peso del último mes
            const oneMonthAgo = subMonths(new Date(), 1);
            const lastMonthOrders = orders.filter((order: any) => new Date(order.date) > oneMonthAgo);

            // Si no hay órdenes en el último mes, usar el peso promedio mensual de todo el historial
            let monthlyWeight = calculateTotalWeightFromOrders(lastMonthOrders);

            if (monthlyWeight === 0 && orders.length > 0) {
                // FIX: Muchos clientes no compraron en el último mes → peso = 0 → todos van a Basic (C)
                // Ahora usamos el peso promedio mensual de todo el historial para una categorización más justa
                const totalHistoryWeight = calculateTotalWeightFromOrders(orders);
                const monthsSinceFirstOrder = Math.max(client.daysSinceFirstOrder / 30, 1);
                monthlyWeight = totalHistoryWeight / monthsSinceFirstOrder;
            }

            const spendingCategory = categorizeSpending(monthlyWeight);
            const monthlySpending = calculateMonthlySpending(client.totalSpent, client.daysSinceFirstOrder);

            return {
                _id: client._id,
                user: client.user,
                lastAddress: client.lastAddress,
                behaviorCategory,
                spendingCategory,
                totalOrders: client.totalOrders,
                totalSpent: client.totalSpent,
                totalWeight,
                monthlyWeight,
                monthlySpending,
                firstOrderDate: client.firstOrderDate,
                lastOrderDate: client.lastOrderDate,
                daysSinceFirstOrder: Math.round(client.daysSinceFirstOrder),
                daysSinceLastOrder: Math.round(client.daysSinceLastOrder),
                averageOrderValue: Math.round(client.averageOrderValue)
            };
        });

        // Calcular estadísticas por categoría
        const behaviorStats = calculateCategoryStats(categorizedClients, 'behavior');
        const spendingStats = calculateCategoryStats(categorizedClients, 'spending');

        // Calcular resumen general
        const summary = {
            averageOrderValue: Math.round(
                categorizedClients.reduce((sum, c) => sum + c.averageOrderValue, 0) / categorizedClients.length
            ),
            repeatCustomerRate: (categorizedClients.filter(c => c.totalOrders > 1).length / categorizedClients.length) * 100,
            averageOrdersPerCustomer: categorizedClients.reduce((sum, c) => sum + c.totalOrders, 0) / categorizedClients.length,
            averageMonthlySpending: Math.round(
                categorizedClients.reduce((sum, c) => sum + c.monthlySpending, 0) / categorizedClients.length
            )
        };

        return {
            totalClients: categorizedClients.length,
            behaviorCategories: behaviorStats,
            spendingCategories: spendingStats,
            clients: categorizedClients,
            summary
        };

    } catch (error) {
        console.error('Error categorizing clients:', error);
        throw error;
    }
}

/**
 * Categoriza el comportamiento de compra del cliente
 */
function categorizeBehavior(client: any): ClientBehaviorCategory {
    const { daysSinceLastOrder, daysSinceFirstOrder, orderDates, totalOrders } = client;

    // 1. Cliente recuperado: Prioridad alta. Volvió a comprar después de 4 meses de inactividad.
    if (totalOrders > 1) {
        const sortedDates = [...orderDates].sort((a: Date, b: Date) => compareDesc(a, b));
        const lastOrderDate = new Date(sortedDates[0]);
        const secondLastOrderDate = new Date(sortedDates[1]);
        const diffDays = differenceInDays(lastOrderDate, secondLastOrderDate);

        if (diffDays > 120 && daysSinceLastOrder <= 90) {
            return 'recovered';
        }
    }

    // 2. Flujo para clientes con una sola compra.
    if (totalOrders === 1) {
        if (daysSinceFirstOrder <= 7) return 'new';
        if (daysSinceFirstOrder > 7 && daysSinceFirstOrder <= 30) return 'tracking';
        // Si ha pasado más de un mes, se les aplican las reglas generales de actividad.
    }

    // 3. Categorías generales por inactividad.
    if (daysSinceLastOrder > 120) return 'lost';
    if (daysSinceLastOrder > 90) return 'possible-inactive';

    // 4. Cliente activo: Si no cumple ninguna de las condiciones anteriores, se considera activo.
    // Esto cubre a todos los clientes con una compra en los últimos 90 días.
    return 'active';
}

/**
 * Categoriza el nivel de gasto del cliente basado en el peso total comprado
 * 
 * CATEGORÍAS SIN SUPERPOSICIÓN:
 * - Premium (A): > 15kg
 * - Standard (B): > 5kg y ≤ 15kg  
 * - Basic (C): ≤ 5kg
 */
function categorizeSpending(monthlyWeight: number): ClientSpendingCategory {
    // Premium (A): Mayor a 15kg
    if (monthlyWeight > 15) return 'premium';

    // Standard (B): Mayor a 5kg (pero menor o igual a 15kg por la condición anterior)
    if (monthlyWeight > 5) return 'standard';

    // Basic (C): Menor o igual a 5kg (incluyendo exactamente 5kg)
    return 'basic';
}

/**
 * Calcula el peso total de los productos en los pedidos de un cliente
 */
function calculateTotalWeightFromOrders(orders: any[]): number {
    let totalWeight = 0;

    if (!orders) return 0;

    for (const order of orders) {
        if (!order.items) continue;

        for (const item of order.items) {
            if (!item.name) continue;

            const itemName = item.name.toLowerCase();

            if (itemName.includes('complemento')) {
                continue; // Los complementos no suman peso
            }

            if (itemName.includes('big dog')) {
                totalWeight += 15;
                continue; // Se asume 15kg y se pasa al siguiente item
            }

            if (!item.options) continue;

            for (const option of item.options) {
                if (option.name) {
                    const match = option.name.match(/(\d+(?:\.\d+)?)\s*KG/i);
                    if (match && match[1]) {
                        totalWeight += parseFloat(match[1]);
                    }
                }
            }
        }
    }

    return totalWeight;
}

/**
 * Calcula el gasto mensual promedio
 */
function calculateMonthlySpending(totalSpent: number, daysSinceFirstOrder: number): number {
    const monthsSinceFirstOrder = Math.max(daysSinceFirstOrder / 30, 1);
    return Math.round(totalSpent / monthsSinceFirstOrder);
}

/**
 * Calcula estadísticas por categoría
 */
function calculateCategoryStats(
    clients: ClientCategorization[],
    type: 'behavior' | 'spending'
): ClientCategoryStats[] {
    const categoryField = type === 'behavior' ? 'behaviorCategory' : 'spendingCategory';
    const categoryMap = new Map<string, { count: number; totalSpent: number }>();

    clients.forEach(client => {
        const category = client[categoryField];
        if (!categoryMap.has(category)) {
            categoryMap.set(category, { count: 0, totalSpent: 0 });
        }
        const stats = categoryMap.get(category)!;
        stats.count++;
        stats.totalSpent += client.totalSpent;
    });

    return Array.from(categoryMap.entries()).map(([category, stats]) => ({
        category: category as ClientBehaviorCategory | ClientSpendingCategory,
        count: stats.count,
        totalSpent: stats.totalSpent,
        averageSpending: Math.round(stats.totalSpent / stats.count),
        percentage: Math.round((stats.count / clients.length) * 100)
    }));
} 