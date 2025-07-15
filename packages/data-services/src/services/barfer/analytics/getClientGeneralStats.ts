'use server';

import 'server-only';
import { getCollection } from '@repo/database';

export interface ClientGeneralStats {
    totalClients: number;
    averageOrderValue: number;
    repeatCustomerRate: number;
    averageOrdersPerCustomer: number;
    averageMonthlySpending: number;
}

/**
 * Obtiene estadísticas generales de clientes de forma optimizada
 * Solo calcula agregados sin procesar clientes individuales
 */
export async function getClientGeneralStats(): Promise<ClientGeneralStats> {
    try {
        const collection = await getCollection('orders');

        // Pipeline optimizado para obtener solo estadísticas agregadas
        const pipeline = [
            {
                $match: {
                    status: { $in: ['pending', 'confirmed', 'delivered', 'cancelled'] }
                }
            },
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
                    totalOrders: { $sum: 1 },
                    totalSpent: { $sum: '$total' },
                    firstOrderDate: { $min: '$createdAt' },
                    lastOrderDate: { $max: '$createdAt' }
                }
            },
            {
                $addFields: {
                    daysSinceFirstOrder: {
                        $divide: [
                            { $subtract: ['$$NOW', '$firstOrderDate'] },
                            1000 * 60 * 60 * 24
                        ]
                    },
                    monthsSinceFirstOrder: {
                        $divide: [
                            { $subtract: ['$$NOW', '$firstOrderDate'] },
                            1000 * 60 * 60 * 24 * 30
                        ]
                    }
                }
            },
            {
                $addFields: {
                    monthlySpending: {
                        $divide: [
                            '$totalSpent',
                            { $max: ['$monthsSinceFirstOrder', 1] }
                        ]
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    totalClients: { $sum: 1 },
                    totalOrders: { $sum: '$totalOrders' },
                    totalSpent: { $sum: '$totalSpent' },
                    repeatCustomers: {
                        $sum: {
                            $cond: [{ $gt: ['$totalOrders', 1] }, 1, 0]
                        }
                    },
                    avgMonthlySpending: { $avg: '$monthlySpending' }
                }
            },
            {
                $addFields: {
                    averageOrderValue: { $divide: ['$totalSpent', '$totalOrders'] },
                    repeatCustomerRate: {
                        $multiply: [
                            { $divide: ['$repeatCustomers', '$totalClients'] },
                            100
                        ]
                    },
                    averageOrdersPerCustomer: { $divide: ['$totalOrders', '$totalClients'] }
                }
            }
        ];

        const [result] = await collection.aggregate(pipeline, { allowDiskUse: true }).toArray();

        if (!result) {
            return {
                totalClients: 0,
                averageOrderValue: 0,
                repeatCustomerRate: 0,
                averageOrdersPerCustomer: 0,
                averageMonthlySpending: 0
            };
        }

        return {
            totalClients: result.totalClients || 0,
            averageOrderValue: Math.round(result.averageOrderValue || 0),
            repeatCustomerRate: Math.round((result.repeatCustomerRate || 0) * 100) / 100,
            averageOrdersPerCustomer: Math.round((result.averageOrdersPerCustomer || 0) * 10) / 10,
            averageMonthlySpending: Math.round(result.avgMonthlySpending || 0)
        };

    } catch (error) {
        console.error('Error getting client general stats:', error);
        throw error;
    }
} 