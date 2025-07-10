import 'server-only';
import { getCollection } from '@repo/database';
import { differenceInDays } from 'date-fns';

interface ProductEvolution {
    productId: string;
    productName: string;
    optionName: string;
    totalQuantity: number;
    totalRevenue: number;
    confirmedQuantity: number;
    confirmedRevenue: number;
}

interface ProductTimelinePoint {
    period: string;
    totalQuantity: number;
    totalRevenue: number;
    confirmedQuantity: number;
    confirmedRevenue: number;
    products: ProductEvolution[];
}

export async function getProductTimeline(
    startDate: Date,
    endDate: Date,
    productIds?: string[]
): Promise<ProductTimelinePoint[]> {
    try {
        const collection = await getCollection('orders');

        const diffTime = differenceInDays(endDate, startDate);
        const diffDays = Math.ceil(diffTime);

        let periodFormat: string;
        if (diffDays <= 31) periodFormat = '%Y-%m-%d';
        else if (diffDays <= 90) periodFormat = '%Y-%U';
        else periodFormat = '%Y-%m';

        const matchStage: any = {
            createdAt: { $gte: startDate, $lte: endDate },
            status: { $in: ['confirmed', 'pending'] }
        };

        if (productIds && productIds.length > 0) {
            matchStage['items.id'] = { $in: productIds };
        }

        const pipeline: any[] = [
            { $match: matchStage },
            { $unwind: '$items' },
            { $unwind: '$items.options' },
            {
                $group: {
                    _id: {
                        period: { $dateToString: { format: periodFormat, date: '$createdAt' } },
                        productId: '$items.id',
                        productName: '$items.name',
                        optionName: '$items.options.name'
                    },
                    totalQuantity: { $sum: '$items.options.quantity' },
                    totalRevenue: { $sum: { $multiply: ['$items.options.price', '$items.options.quantity'] } },
                    confirmedQuantity: {
                        $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, '$items.options.quantity', 0] }
                    },
                    confirmedRevenue: {
                        $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, { $multiply: ['$items.options.price', '$items.options.quantity'] }, 0] }
                    }
                }
            },
            {
                $group: {
                    _id: '$_id.period',
                    products: {
                        $push: {
                            productId: '$_id.productId',
                            productName: '$_id.productName',
                            optionName: '$_id.optionName',
                            totalQuantity: '$totalQuantity',
                            totalRevenue: '$totalRevenue',
                            confirmedQuantity: '$confirmedQuantity',
                            confirmedRevenue: '$confirmedRevenue'
                        }
                    },
                    totalQuantity: { $sum: '$totalQuantity' },
                    totalRevenue: { $sum: '$totalRevenue' },
                    confirmedQuantity: { $sum: '$confirmedQuantity' },
                    confirmedRevenue: { $sum: '$confirmedRevenue' }
                }
            },
            {
                $project: {
                    _id: 0,
                    period: '$_id',
                    products: 1,
                    totalQuantity: 1,
                    totalRevenue: 1,
                    confirmedQuantity: 1,
                    confirmedRevenue: 1
                }
            },
            { $sort: { period: 1 } }
        ];

        const result = await collection.aggregate(pipeline).toArray();
        return result as ProductTimelinePoint[];
    } catch (error) {
        console.error('Error fetching product timeline:', error);
        throw error;
    }
} 