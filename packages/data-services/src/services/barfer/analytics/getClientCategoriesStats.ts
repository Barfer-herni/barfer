'use server';

import 'server-only';
import { getCollection } from '@repo/database';
import type { ClientCategoryStats, ClientBehaviorCategory, ClientSpendingCategory } from '../../../types/barfer';

export interface ClientCategoriesStats {
    behaviorCategories: ClientCategoryStats[];
    spendingCategories: ClientCategoryStats[];
}

/**
 * Obtiene estadísticas de categorías de clientes de forma optimizada
 * Solo calcula conteos y promedios por categoría sin procesar clientes individuales
 */
export async function getClientCategoriesStats(): Promise<ClientCategoriesStats> {
    try {
        const collection = await getCollection('orders');

        // Pipeline simplificado para obtener solo los datos necesarios de cada cliente
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
                    daysSinceLastOrder: {
                        $divide: [
                            { $subtract: ['$$NOW', '$lastOrderDate'] },
                            1000 * 60 * 60 * 24
                        ]
                    }
                }
            }
        ];

        // Agregar categorización directamente en el pipeline de MongoDB
        // Solo para calcular conteos, no clientes individuales
        const categorizationPipeline = [
            ...pipeline,
            {
                $addFields: {
                    // Categorización de comportamiento
                    behaviorCategory: {
                        $switch: {
                            branches: [
                                // Cliente nuevo: 1 sola compra en últimos 7 días
                                {
                                    case: {
                                        $and: [
                                            { $eq: ['$totalOrders', 1] },
                                            { $lte: ['$daysSinceFirstOrder', 7] }
                                        ]
                                    },
                                    then: 'new'
                                },
                                // En seguimiento: 1 sola compra entre 8-30 días
                                {
                                    case: {
                                        $and: [
                                            { $eq: ['$totalOrders', 1] },
                                            { $gt: ['$daysSinceFirstOrder', 7] },
                                            { $lte: ['$daysSinceFirstOrder', 30] }
                                        ]
                                    },
                                    then: 'tracking'
                                },
                                // Cliente perdido: no compra en +120 días
                                {
                                    case: { $gt: ['$daysSinceLastOrder', 120] },
                                    then: 'lost'
                                },
                                // Posible inactivo: última compra entre 90-120 días
                                {
                                    case: {
                                        $and: [
                                            { $gt: ['$daysSinceLastOrder', 90] },
                                            { $lte: ['$daysSinceLastOrder', 120] }
                                        ]
                                    },
                                    then: 'possible-inactive'
                                }
                            ],
                            default: 'active'
                        }
                    },
                    // Categorización de gasto (estimación simple basada en gasto promedio)
                    spendingCategory: {
                        $let: {
                            vars: {
                                avgOrderValue: { $divide: ['$totalSpent', '$totalOrders'] },
                                monthsSinceFirst: { $max: [{ $divide: ['$daysSinceFirstOrder', 30] }, 1] }
                            },
                            in: {
                                $let: {
                                    vars: {
                                        weightPerOrder: {
                                            $switch: {
                                                branches: [
                                                    { case: { $gte: ['$$avgOrderValue', 15000] }, then: 20 },
                                                    { case: { $gte: ['$$avgOrderValue', 8000] }, then: 12 },
                                                    { case: { $gte: ['$$avgOrderValue', 3000] }, then: 8 }
                                                ],
                                                default: 5
                                            }
                                        }
                                    },
                                    in: {
                                        $let: {
                                            vars: {
                                                monthlyWeight: {
                                                    $divide: [
                                                        { $multiply: ['$totalOrders', '$$weightPerOrder'] },
                                                        '$$monthsSinceFirst'
                                                    ]
                                                }
                                            },
                                            in: {
                                                $switch: {
                                                    branches: [
                                                        { case: { $gt: ['$$monthlyWeight', 15] }, then: 'premium' },
                                                        { case: { $gt: ['$$monthlyWeight', 5] }, then: 'standard' }
                                                    ],
                                                    default: 'basic'
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            // Solo agrupar por categorías para obtener conteos
            {
                $group: {
                    _id: '$behaviorCategory',
                    count: { $sum: 1 },
                    totalSpent: { $sum: '$totalSpent' }
                }
            }
        ];

        const spendingPipeline = [
            ...pipeline,
            {
                $addFields: {
                    // Solo categorización de gasto
                    spendingCategory: {
                        $let: {
                            vars: {
                                avgOrderValue: { $divide: ['$totalSpent', '$totalOrders'] },
                                monthsSinceFirst: { $max: [{ $divide: ['$daysSinceFirstOrder', 30] }, 1] }
                            },
                            in: {
                                $let: {
                                    vars: {
                                        weightPerOrder: {
                                            $switch: {
                                                branches: [
                                                    { case: { $gte: ['$$avgOrderValue', 15000] }, then: 20 },
                                                    { case: { $gte: ['$$avgOrderValue', 8000] }, then: 12 },
                                                    { case: { $gte: ['$$avgOrderValue', 3000] }, then: 8 }
                                                ],
                                                default: 5
                                            }
                                        }
                                    },
                                    in: {
                                        $let: {
                                            vars: {
                                                monthlyWeight: {
                                                    $divide: [
                                                        { $multiply: ['$totalOrders', '$$weightPerOrder'] },
                                                        '$$monthsSinceFirst'
                                                    ]
                                                }
                                            },
                                            in: {
                                                $switch: {
                                                    branches: [
                                                        { case: { $gt: ['$$monthlyWeight', 15] }, then: 'premium' },
                                                        { case: { $gt: ['$$monthlyWeight', 5] }, then: 'standard' }
                                                    ],
                                                    default: 'basic'
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            {
                $group: {
                    _id: '$spendingCategory',
                    count: { $sum: 1 },
                    totalSpent: { $sum: '$totalSpent' }
                }
            }
        ];

        // Ejecutar ambos pipelines para obtener solo conteos
        const [behaviorResults, spendingResults, totalClientsResult] = await Promise.all([
            collection.aggregate(categorizationPipeline, { allowDiskUse: true }).toArray(),
            collection.aggregate(spendingPipeline, { allowDiskUse: true }).toArray(),
            collection.aggregate([...pipeline, { $count: "total" }], { allowDiskUse: true }).toArray()
        ]);

        const totalClients = totalClientsResult[0]?.total || 0;

        if (totalClients === 0) {
            return {
                behaviorCategories: [],
                spendingCategories: []
            };
        }

        // Convertir resultados a formato esperado
        const behaviorCategories: ClientCategoryStats[] = behaviorResults.map(result => ({
            category: result._id as ClientBehaviorCategory,
            count: result.count,
            totalSpent: result.totalSpent,
            averageSpending: Math.round(result.totalSpent / result.count),
            percentage: Math.round((result.count / totalClients) * 100)
        }));

        const spendingCategories: ClientCategoryStats[] = spendingResults.map(result => ({
            category: result._id as ClientSpendingCategory,
            count: result.count,
            totalSpent: result.totalSpent,
            averageSpending: Math.round(result.totalSpent / result.count),
            percentage: Math.round((result.count / totalClients) * 100)
        }));

        return {
            behaviorCategories,
            spendingCategories
        };

    } catch (error) {
        console.error('Error getting client categories stats:', error);
        throw error;
    }
}

