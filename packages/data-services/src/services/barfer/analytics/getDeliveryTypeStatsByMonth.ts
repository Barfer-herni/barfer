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

export async function getDeliveryTypeStatsByMonth(startDate?: Date, endDate?: Date): Promise<DeliveryTypeStats[]> {
    try {
        const collection = await getCollection('orders');

        const pipeline: any[] = [];

        if (startDate || endDate) {
            const matchCondition: any = {};
            matchCondition.createdAt = {};
            if (startDate) matchCondition.createdAt.$gte = startDate;
            if (endDate) matchCondition.createdAt.$lte = endDate;
            pipeline.push({ $match: matchCondition });
        }

        pipeline.push(
            { $unwind: '$items' },
            { $unwind: '$items.options' },
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
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" }
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
                            quantity: "$items.options.quantity",
                            productName: "$items.name",
                            optionName: "$items.options.name"
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

        // Calcular pesos después de la agregación
        const formattedResult = result.map((item: any) => {
            let sameDayWeight = 0;
            let normalWeight = 0;
            let wholesaleWeight = 0;

            item.items.forEach((productItem: any) => {
                const weight = getWeightInKg(productItem.productName, productItem.optionName);
                if (weight !== null) {
                    const totalWeight = weight * productItem.quantity;
                    if (productItem.isWholesale) {
                        wholesaleWeight += totalWeight;
                    } else if (productItem.isSameDay) {
                        sameDayWeight += totalWeight;
                    } else {
                        normalWeight += totalWeight;
                    }
                }
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

        return formattedResult as DeliveryTypeStats[];

    } catch (error) {
        console.error('Error fetching delivery type stats by month:', error);
        throw error;
    }
} 