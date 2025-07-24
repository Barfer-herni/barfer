import 'server-only';
import { getCollection } from '@repo/database';

/**
 * Extracts weight in kilograms from a product's option name.
 * Returns null if no weight is found or if the product is a complement.
 * @param productName - The name of the product.
 * @param optionName - The option name, e.g., "5KG".
 * @returns The weight in KG, or null.
 */
const getWeightInKg = (productName: string, optionName: string): number | null => {
    const lowerProductName = productName.toLowerCase();

    if (lowerProductName.includes('big dog')) {
        return 15;
    }
    if (lowerProductName.includes('complemento')) {
        return null;
    }
    const match = optionName.match(/(\d+(\.\d+)?)\s*KG/i);
    if (match && match[1]) {
        return parseFloat(match[1]);
    }
    return null;
};

interface DeliveryTypeStats {
    month: string;
    sameDayOrders: number;
    normalOrders: number;
    wholesaleOrders: number;
    sameDayRevenue: number;
    normalRevenue: number;
    wholesaleRevenue: number;
    sameDayWeight: number;
    normalWeight: number;
    wholesaleWeight: number;
}

/**
 * Función de prueba específica para verificar el problema con mayoristas
 */
export async function testWholesaleIssue(startDate?: Date, endDate?: Date): Promise<void> {
    try {
        const collection = await getCollection('orders');

        console.log('=== TEST ESPECÍFICO: Problema con mayoristas ===');
        console.log('Fechas de entrada:', { startDate, endDate });

        // 1. Verificar todas las órdenes mayoristas sin filtro de fecha
        const allWholesale = await collection.find({ orderType: "mayorista" }).toArray();
        console.log('Todas las órdenes mayoristas:', allWholesale.length);

        allWholesale.forEach((order, index) => {
            console.log(`Orden mayorista ${index + 1}:`, {
                id: order._id,
                orderType: order.orderType,
                createdAt: order.createdAt,
                total: order.total,
                status: order.status,
                deliveryDay: order.deliveryDay
            });
        });

        // 2. Verificar si hay órdenes mayoristas en el período específico
        if (startDate && endDate) {
            const periodWholesale = await collection.find({
                orderType: "mayorista",
                createdAt: {
                    $gte: startDate,
                    $lte: endDate
                }
            }).toArray();

            console.log('Órdenes mayoristas en período específico:', periodWholesale.length);
            periodWholesale.forEach((order, index) => {
                console.log(`Orden mayorista en período ${index + 1}:`, {
                    id: order._id,
                    orderType: order.orderType,
                    createdAt: order.createdAt,
                    total: order.total,
                    status: order.status
                });
            });
        }

        // 3. Verificar si el problema está en el pipeline de agregación
        const testPipeline = [
            {
                $match: {
                    orderType: "mayorista"
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
                    },
                    isWholesale: {
                        $eq: ["$orderType", "mayorista"]
                    }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" }
                    },
                    wholesaleOrders: {
                        $sum: { $cond: ["$isWholesale", 1, 0] }
                    },
                    totalOrders: { $sum: 1 }
                }
            }
        ];

        const testResult = await collection.aggregate(testPipeline).toArray();
        console.log('Resultado de pipeline de prueba:', testResult);

    } catch (error) {
        console.error('Error en test específico:', error);
        throw error;
    }
}

export async function debugWholesaleOrders(startDate?: Date, endDate?: Date): Promise<{
    totalWholesale: number;
    periodWholesale: number;
    sampleOrders: any[];
}> {
    try {
        const collection = await getCollection('orders');

        console.log('=== DEBUG SIMPLE: Verificando órdenes mayoristas ===');
        console.log('Fechas:', { startDate, endDate });

        // 1. Contar todas las órdenes mayoristas
        const totalWholesale = await collection.countDocuments({ orderType: "mayorista" });
        console.log('Total órdenes mayoristas en BD:', totalWholesale);

        // 2. Contar órdenes mayoristas en el período
        const matchCondition: any = { orderType: "mayorista" };
        if (startDate || endDate) {
            matchCondition.createdAt = {};
            if (startDate) matchCondition.createdAt.$gte = startDate;
            if (endDate) matchCondition.createdAt.$lte = endDate;
        }

        const periodWholesale = await collection.countDocuments(matchCondition);
        console.log('Órdenes mayoristas en período:', periodWholesale);

        // 3. Obtener algunas órdenes mayoristas para inspeccionar
        const sampleOrders = await collection.find(matchCondition).limit(5).toArray();
        console.log('Muestra de órdenes mayoristas:');
        sampleOrders.forEach((order, index) => {
            console.log(`Orden ${index + 1}:`, {
                id: order._id,
                orderType: order.orderType,
                createdAt: order.createdAt,
                total: order.total,
                status: order.status
            });
        });

        return { totalWholesale, periodWholesale, sampleOrders };
    } catch (error) {
        console.error('Error en debug:', error);
        throw error;
    }
}

export async function getDeliveryTypeStatsByMonth(startDate?: Date, endDate?: Date): Promise<DeliveryTypeStats[]> {
    try {
        const collection = await getCollection('orders');

        const pipeline: any[] = [];

        // Primero convertir createdAt a Date si es necesario
        pipeline.push({
            $addFields: {
                createdAt: {
                    $cond: [
                        { $eq: [{ $type: "$createdAt" }, "string"] },
                        { $toDate: "$createdAt" },
                        "$createdAt"
                    ]
                }
            }
        });

        // Luego aplicar filtros de fecha
        if (startDate || endDate) {
            const matchCondition: any = {};
            matchCondition.createdAt = {};
            if (startDate) matchCondition.createdAt.$gte = startDate;
            if (endDate) matchCondition.createdAt.$lte = endDate;
            pipeline.push({ $match: matchCondition });
        }

        // Agregar debug: verificar órdenes mayoristas en el período
        const debugPipeline = [
            ...pipeline,
            {
                $match: {
                    orderType: "mayorista"
                }
            },
            {
                $project: {
                    _id: 1,
                    orderType: 1,
                    createdAt: 1,
                    total: 1,
                    status: 1
                }
            }
        ];

        console.log('=== DEBUG: Órdenes mayoristas en el período ===');
        console.log('Fechas de filtro:', { startDate, endDate });

        const debugResult = await collection.aggregate(debugPipeline).toArray();
        console.log('Órdenes mayoristas encontradas:', debugResult.length);
        debugResult.forEach((order, index) => {
            console.log(`Orden ${index + 1}:`, {
                id: order._id,
                orderType: order.orderType,
                createdAt: order.createdAt,
                total: order.total,
                status: order.status
            });
        });

        pipeline.push(
            // Agregar campos para clasificación
            {
                $addFields: {
                    isSameDayDelivery: {
                        $or: [
                            { $eq: ["$deliveryArea.sameDayDelivery", true] },
                            { $eq: ["$items.sameDayDelivery", true] }
                        ]
                    },
                    isWholesale: {
                        $eq: ["$orderType", "mayorista"]
                    }
                }
            },
            // Agrupar por orden primero para evitar duplicados
            {
                $group: {
                    _id: {
                        orderId: "$_id",
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" }
                    },
                    orderType: { $first: "$orderType" },
                    isSameDayDelivery: { $first: "$isSameDayDelivery" },
                    isWholesale: { $first: "$isWholesale" },
                    total: { $first: "$total" },
                    items: { $first: "$items" }
                }
            },
            // Ahora agrupar por mes
            {
                $group: {
                    _id: {
                        year: "$_id.year",
                        month: "$_id.month"
                    },
                    sameDayOrders: {
                        $sum: {
                            $cond: [
                                { $and: ["$isSameDayDelivery", { $not: "$isWholesale" }] },
                                1,
                                0
                            ]
                        }
                    },
                    normalOrders: {
                        $sum: {
                            $cond: [
                                { $and: [{ $not: "$isSameDayDelivery" }, { $not: "$isWholesale" }] },
                                1,
                                0
                            ]
                        }
                    },
                    wholesaleOrders: {
                        $sum: { $cond: ["$isWholesale", 1, 0] }
                    },
                    sameDayRevenue: {
                        $sum: {
                            $cond: [
                                { $and: ["$isSameDayDelivery", { $not: "$isWholesale" }] },
                                "$total",
                                0
                            ]
                        }
                    },
                    normalRevenue: {
                        $sum: {
                            $cond: [
                                { $and: [{ $not: "$isSameDayDelivery" }, { $not: "$isWholesale" }] },
                                "$total",
                                0
                            ]
                        }
                    },
                    wholesaleRevenue: {
                        $sum: { $cond: ["$isWholesale", "$total", 0] }
                    },
                    // Agrupar items para calcular peso después
                    items: {
                        $push: {
                            isSameDay: "$isSameDayDelivery",
                            isWholesale: "$isWholesale",
                            items: "$items"
                        }
                    }
                }
            },
            {
                $sort: { "_id.year": 1, "_id.month": 1 }
            },
            {
                $project: {
                    _id: 0,
                    month: {
                        $concat: [
                            { $toString: "$_id.year" },
                            "-",
                            { $toString: { $cond: { if: { $lt: ["$_id.month", 10] }, then: { $concat: ["0", { $toString: "$_id.month" }] }, else: { $toString: "$_id.month" } } } }
                        ]
                    },
                    sameDayOrders: 1,
                    normalOrders: 1,
                    wholesaleOrders: 1,
                    sameDayRevenue: 1,
                    normalRevenue: 1,
                    wholesaleRevenue: 1,
                    items: 1
                }
            }
        );

        const result = await collection.aggregate(pipeline).toArray();

        console.log('=== DEBUG: Resultado final ===');
        console.log('Resultado de agregación:', result);

        // Calcular pesos después de la agregación
        const formattedResult = result.map((item: any) => {
            let sameDayWeight = 0;
            let normalWeight = 0;
            let wholesaleWeight = 0;

            item.items.forEach((orderItem: any) => {
                // Ahora items es un array de items de la orden
                orderItem.items.forEach((productItem: any) => {
                    productItem.options.forEach((option: any) => {
                        const weight = getWeightInKg(productItem.name, option.name);
                        if (weight !== null) {
                            const totalWeight = weight * option.quantity;
                            if (orderItem.isWholesale) {
                                wholesaleWeight += totalWeight;
                            } else if (orderItem.isSameDay) {
                                sameDayWeight += totalWeight;
                            } else {
                                normalWeight += totalWeight;
                            }
                        }
                    });
                });
            });

            return {
                month: item.month,
                sameDayOrders: item.sameDayOrders,
                normalOrders: item.normalOrders,
                wholesaleOrders: item.wholesaleOrders,
                sameDayRevenue: item.sameDayRevenue,
                normalRevenue: item.normalRevenue,
                wholesaleRevenue: item.wholesaleRevenue,
                sameDayWeight: Math.round(sameDayWeight * 100) / 100, // Redondear a 2 decimales
                normalWeight: Math.round(normalWeight * 100) / 100,
                wholesaleWeight: Math.round(wholesaleWeight * 100) / 100
            };
        });

        console.log('=== DEBUG: Resultado formateado ===');
        console.log('Resultado formateado:', formattedResult);

        return formattedResult as DeliveryTypeStats[];

    } catch (error) {
        console.error('Error fetching delivery type stats by month:', error);
        throw error;
    }
} 