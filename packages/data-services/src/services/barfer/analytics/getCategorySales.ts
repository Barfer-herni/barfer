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
    const match = optionName.match(/(\d+(?:\.\d+)?)\s*KG/i);
    if (match && match[1]) {
        return parseFloat(match[1]);
    }
    return null;
};

/**
 * Obtiene estadísticas de ventas por categoría de producto
 */
export async function getCategorySales(statusFilter?: 'pending' | 'confirmed' | 'all', limit: number = 4, startDate?: Date, endDate?: Date) {
    try {
        const collection = await getCollection('orders');

        // Construir el match condition basado en el filtro
        const matchCondition: any = {};
        if (statusFilter && statusFilter !== 'all') {
            matchCondition.status = statusFilter;
        }

        // Agregar filtro de fechas si se proporciona
        if (startDate || endDate) {
            matchCondition.createdAt = {};
            if (startDate) matchCondition.createdAt.$gte = startDate;
            if (endDate) matchCondition.createdAt.$lte = endDate;
        }

        const pipeline: any[] = [];

        // Solo agregar match si hay condiciones
        if (Object.keys(matchCondition).length > 0) {
            pipeline.push({ $match: matchCondition });
        }

        pipeline.push(
            { $unwind: '$items' },
            { $unwind: '$items.options' },
            {
                $addFields: {
                    // Extraer categoría basada en las palabras más comunes y útiles
                    category: {
                        $switch: {
                            branches: [
                                {
                                    case: { $regexMatch: { input: '$items.name', regex: /huesos/i } },
                                    then: 'HUESOS CARNOSOS'
                                },
                                {
                                    case: { $regexMatch: { input: '$items.name', regex: /complement/i } },
                                    then: 'COMPLEMENTOS'
                                },
                                {
                                    case: { $regexMatch: { input: '$items.name', regex: /perro/i } },
                                    then: 'PERRO'
                                },
                                {
                                    case: { $regexMatch: { input: '$items.name', regex: /gato/i } },
                                    then: 'GATO'
                                }
                            ],
                            default: 'OTROS'
                        }
                    }
                }
            },
            {
                $match: {
                    category: { $in: ['PERRO', 'GATO', 'HUESOS CARNOSOS', 'COMPLEMENTOS'] }
                }
            },
            {
                $group: {
                    _id: '$category',
                    totalQuantity: { $sum: '$items.options.quantity' },
                    totalRevenue: { $sum: { $multiply: ['$items.options.quantity', '$items.options.price'] } },
                    orderCount: { $sum: 1 },
                    uniqueProducts: { $addToSet: '$items.name' },
                    avgPrice: { $avg: '$items.options.price' },
                    // Necesitamos agrupar los items para calcular el peso después
                    items: {
                        $push: {
                            quantity: '$items.options.quantity',
                            productName: '$items.name',
                            optionName: '$items.options.name'
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 1,
                    totalQuantity: 1,
                    totalRevenue: 1,
                    orderCount: 1,
                    uniqueProducts: { $size: '$uniqueProducts' },
                    avgPrice: 1,
                    items: 1 // Pasamos los items al siguiente stage
                }
            },
            { $sort: { totalQuantity: -1 } },
            { $limit: limit }
        );

        const result = await collection.aggregate(pipeline).toArray();

        const formattedResult = result.map((item: any) => {
            // Calcular el peso total para la categoría
            const totalWeight = item.items.reduce((acc: number, productItem: any) => {
                const weight = getWeightInKg(productItem.productName, productItem.optionName);
                if (weight !== null) {
                    return acc + (weight * productItem.quantity);
                }
                return acc;
            }, 0);

            return {
                categoryName: item._id,
                quantity: item.totalQuantity,
                revenue: item.totalRevenue,
                orders: item.orderCount,
                uniqueProducts: item.uniqueProducts,
                avgPrice: Math.round(item.avgPrice),
                statusFilter: statusFilter || 'all',
                totalWeight: totalWeight > 0 ? totalWeight : null,
            };
        });
        return formattedResult;

    } catch (error) {
        console.error('Error fetching category sales:', error);
        throw error;
    }
} 