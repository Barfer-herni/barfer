import 'server-only';
import { getCollection } from '@repo/database';

/**
 * Obtiene estadísticas de órdenes agrupadas por mes (TODAS las órdenes: pending + confirmed)
 * 
 * Raw MongoDB result:
 * {
 *   "_id": { "year": 2024, "month": 9 },
 *   "totalOrders": 1331,
 *   "totalRevenue": 60861917.050000004,
 *   "uniqueCustomers": 1044
 * }
 * 
 * Formatted result:
 * {
 *   "month": "2024-09",
 *   "orders": 1331,
 *   "revenue": 60861917.050000004,
 *   "uniqueCustomers": 1044
 * }
 */
export async function getOrdersByMonth(startDate?: Date, endDate?: Date) {
    try {
        const collection = await getCollection('orders');
        const pipeline: any[] = [];

        const matchCondition: any = {};
        if (startDate || endDate) {
            matchCondition.createdAt = {};
            if (startDate) matchCondition.createdAt.$gte = startDate;
            if (endDate) matchCondition.createdAt.$lte = endDate;
        }

        if (Object.keys(matchCondition).length > 0) {
            pipeline.push({ $match: matchCondition });
        }

        pipeline.push(
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    totalOrders: { $sum: 1 },
                    totalRevenue: { $sum: '$total' },
                    uniqueCustomers: { $addToSet: '$user' }
                }
            },
            {
                $project: {
                    _id: 1,
                    totalOrders: 1,
                    totalRevenue: 1,
                    uniqueCustomers: { $size: '$uniqueCustomers' }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        );

        const result = await collection.aggregate(pipeline).toArray();

        const formattedResult = result.map((item: any) => ({
            month: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
            orders: item.totalOrders,
            revenue: item.totalRevenue,
            uniqueCustomers: item.uniqueCustomers
        }));

        return formattedResult;
    } catch (error) {
        console.error('Error fetching orders by month:', error);
        throw error;
    }
}

/**
 * Obtiene estadísticas de órdenes confirmadas agrupadas por mes
 */
export async function getConfirmedOrdersByMonth() {
    try {
        const collection = await getCollection('orders');
        const result = await collection.aggregate([
            { $match: { status: 'confirmed' } },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    totalOrders: { $sum: 1 },
                    uniqueCustomers: { $addToSet: '$user._id' },
                    revenue: { $sum: '$total' }
                }
            },
            {
                $project: {
                    _id: 1,
                    totalOrders: 1,
                    uniqueCustomers: { $size: '$uniqueCustomers' },
                    revenue: 1
                }
            },
            { $sort: { '_id.year': -1, '_id.month': -1 } }
        ]).toArray();

        const formattedResult = result.map((item: any) => ({
            month: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
            orders: item.totalOrders,
            uniqueCustomers: item.uniqueCustomers,
            revenue: item.revenue
        }));
        return formattedResult;
    } catch (error) {
        console.error('Error fetching confirmed orders by month:', error);
        throw error;
    }
}

// EJEMPLO DE DATOS QUE RETORNA ESTA FUNCIÓN
export const EXAMPLE_DATA = {
    description: "Estadísticas de órdenes agrupadas por mes usando MongoDB aggregation",
    rawAggregationResult: [
        {
            _id: {
                year: 2024,
                month: 1
            },
            totalOrders: 150,
            uniqueCustomers: ['user1', 'user2', 'user3'],
            revenue: 3500000
        },
        {
            _id: {
                year: 2024,
                month: 2
            },
            totalOrders: 180,
            uniqueCustomers: ['user1', 'user4', 'user5'],
            revenue: 4200000
        }
    ],
    formattedResult: [
        {
            month: "2024-01",
            orders: 150,
            uniqueCustomers: 3,
            revenue: 3500000
        },
        {
            month: "2024-02",
            orders: 180,
            uniqueCustomers: 3,
            revenue: 4200000
        }
    ],
    aggregationPipeline: `
        [
            // Opcional: Filtrar solo órdenes confirmadas
            { $match: { status: 'confirmed' } },
            
            // Agrupar por año y mes
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    totalOrders: { $sum: 1 },
                    uniqueCustomers: { $addToSet: '$user._id' }, // Array de IDs únicos
                    revenue: { $sum: '$total' }
                }
            },
            
            // Convertir array de IDs únicos a count
            {
                $project: {
                    _id: 1,
                    totalOrders: 1,
                    uniqueCustomers: { $size: '$uniqueCustomers' },
                    revenue: 1
                }
            },
            
            // Ordenar por fecha (más reciente primero)
            { $sort: { '_id.year': -1, '_id.month': -1 } }
        ]
    `,
    howToUse: `
        // Obtener datos de todos los meses
        const monthlyStats = await getOrdersByMonth();
        
        // Encontrar el mejor mes
        const bestMonth = monthlyStats.reduce((max, month) => 
            month.revenue > max.revenue ? month : max
        );
        
        // Calcular promedio mensual
        const avgOrdersPerMonth = monthlyStats.reduce((sum, month) => sum + month.orders, 0) / monthlyStats.length;
        const avgRevenuePerMonth = monthlyStats.reduce((sum, month) => sum + month.revenue, 0) / monthlyStats.length;
        
        // Comparar mes actual vs anterior
        const currentMonth = monthlyStats[0];
        const previousMonth = monthlyStats[1];
        const growthRate = previousMonth ? ((currentMonth.revenue - previousMonth.revenue) / previousMonth.revenue * 100) : 0;
        
        // Para gráficos
        const chartData = monthlyStats.map(month => ({
            x: month.month,
            orders: month.orders,
            customers: month.uniqueCustomers,
            revenue: month.revenue
        }));
    `
}; 