import 'server-only';
import { getCollection } from '@repo/database';
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

        // Pipeline para obtener datos de clientes con sus estadísticas
        const pipeline = [
            { $match: { status: { $in: ['confirmed', 'delivered'] } } },
            { $sort: { createdAt: 1 } }, // Ordenar por fecha para obtener el último domicilio
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
                    _id: { $ifNull: ['$user.id', '$user.email'] }, // Prioritize user.id, fallback to email
                    user: { $first: '$user' },
                    lastAddress: { $last: '$address' }, // Obtener la dirección del último pedido
                    totalOrders: { $sum: 1 },
                    totalSpent: { $sum: '$total' },
                    firstOrderDate: { $min: '$createdAt' },
                    lastOrderDate: { $max: '$createdAt' },
                    orders: { $push: { items: '$items', date: '$createdAt' } }
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

        const clientsData = await collection.aggregate(pipeline).toArray();

        // Procesar cada cliente para asignar categorías
        const categorizedClients: ClientCategorization[] = clientsData.map(client => {
            const behaviorCategory = categorizeBehavior(client);
            const totalWeight = calculateTotalWeightFromOrders(client.orders);

            // Calcular el peso del último mes
            const oneMonthAgo = new Date();
            oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
            const lastMonthOrders = client.orders.filter((order: any) => new Date(order.date) > oneMonthAgo);
            const monthlyWeight = calculateTotalWeightFromOrders(lastMonthOrders);

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
    const { daysSinceLastOrder, daysSinceFirstOrder, orders, totalOrders } = client;

    // 1. Cliente recuperado: Prioridad alta. Volvió a comprar después de 4 meses de inactividad.
    if (totalOrders > 1) {
        const sortedOrders = [...orders].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const lastOrderDate = new Date(sortedOrders[0].date);
        const secondLastOrderDate = new Date(sortedOrders[1].date);
        const diffTime = lastOrderDate.getTime() - secondLastOrderDate.getTime();
        const diffDays = diffTime / (1000 * 60 * 60 * 24);

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
 * Categoriza el nivel de gasto del cliente basado en el peso total comprado en el último mes
 */
function categorizeSpending(monthlyWeight: number): ClientSpendingCategory {
    // Premium: >15kg en el último mes
    if (monthlyWeight > 15) return 'premium';

    // Standard: >5kg y <=15kg en el último mes
    if (monthlyWeight > 5) return 'standard';

    // Basic: <=5kg en el último mes
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
                    const match = option.name.match(/(\d+)\s*KG/i);
                    if (match && match[1]) {
                        totalWeight += parseInt(match[1], 10);
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