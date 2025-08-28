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
    const match = optionName.match(/(\d+(\.\d+)?)\s*k?g/i);
    if (match && match[1]) {
        return parseFloat(match[1]);
    }
    return null;
};

/**
 * Obtiene estadísticas de ventas por producto
 * 
 * Raw MongoDB result:
 * {
 *   "_id": {
 *     "productId": "66cf6c25a2cc94fdeb2ad0c6",
 *     "productName": "BOX GATO POLLO",
 *     "optionName": "5KG"
 *   },
 *   "totalQuantity": 1461,
 *   "totalRevenue": 48686865,
 *   "orderCount": 1265,
 *   "avgPrice": 33356.129644268774,
 *   "statuses": ["confirmed", "pending"]
 * }
 * 
 * Formatted result:
 * {
 *   "productId": "66cf6c25a2cc94fdeb2ad0c6",
 *   "productName": "BOX GATO POLLO",
 *   "optionName": "5KG",
 *   "quantity": 1461,
 *   "revenue": 48686865,
 *   "orders": 1265,
 *   "avgPrice": 33356,
 *   "statuses": ["confirmed", "pending"],
 *   "statusFilter": "all"
 * }
 */
export async function getProductSales(statusFilter?: 'pending' | 'confirmed' | 'all', limit: number = 50, startDate?: Date, endDate?: Date) {
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
                $group: {
                    _id: {
                        productId: '$items.id',
                        productName: '$items.name',
                        optionName: '$items.options.name'
                    },
                    totalQuantity: { $sum: '$items.options.quantity' },
                    totalRevenue: { $sum: { $multiply: ['$items.options.quantity', '$items.options.price'] } },
                    orderCount: { $sum: 1 },
                    avgPrice: { $avg: '$items.options.price' },
                    statuses: { $addToSet: '$status' } // Para saber qué estados incluye
                }
            },
            { $sort: { totalQuantity: -1 } },
            { $limit: limit }
        );

        const result = await collection.aggregate(pipeline).toArray();

        const formattedResult = result.map((item: any) => {
            const weightPerUnit = getWeightInKg(item._id.productName, item._id.optionName);
            const totalWeight = weightPerUnit !== null ? item.totalQuantity * weightPerUnit : null;

            return {
                productId: item._id.productId,
                productName: item._id.productName,
                optionName: item._id.optionName,
                quantity: item.totalQuantity,
                revenue: item.totalRevenue,
                orders: item.orderCount,
                avgPrice: Math.round(item.avgPrice),
                statuses: item.statuses, // Array de estados incluidos
                statusFilter: statusFilter || 'all',
                totalWeight,
            };
        });

        return formattedResult;

    } catch (error) {
        console.error('Error fetching product sales:', error);
        throw error;
    }
} 