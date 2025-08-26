import 'server-only';
import { getCollection } from '@repo/database';
import { differenceInDays } from 'date-fns';

export interface ProductByTimePeriod {
    period: string;
    date: string;
    bigDogQuantity: number;
    bigDogRevenue: number;
    perroQuantity: number;
    perroRevenue: number;
    gatoQuantity: number;
    gatoRevenue: number;
    huesosQuantity: number;
    huesosRevenue: number;
    complementosQuantity: number;
    complementosRevenue: number;
    totalQuantity: number;
    totalRevenue: number;
}

export async function getProductsByTimePeriod(
    startDate: Date,
    endDate: Date
): Promise<ProductByTimePeriod[]> {
    try {
        const collection = await getCollection('orders');

        // Calcular la diferencia en días para determinar el tipo de agrupación
        const daysDiff = Math.ceil(differenceInDays(endDate, startDate));

        let groupBy: any;

        if (daysDiff <= 31) {
            // Agrupación diaria
            groupBy = {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' },
                day: { $dayOfMonth: '$createdAt' }
            };
        } else if (daysDiff <= 90) {
            // Agrupación semanal
            groupBy = {
                year: { $year: '$createdAt' },
                week: { $week: '$createdAt' }
            };
        } else {
            // Agrupación mensual
            groupBy = {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' }
            };
        }

        const pipeline: any[] = [
            {
                $match: {
                    createdAt: {
                        $gte: startDate,
                        $lte: endDate
                    },
                    status: { $in: ['pending', 'confirmed'] }
                }
            },
            { $unwind: '$items' },
            { $unwind: '$items.options' },
            {
                $addFields: {
                    // Categorizar productos basándose en el nombre
                    productCategory: {
                        $switch: {
                            branches: [
                                {
                                    case: { $regexMatch: { input: '$items.name', regex: /big dog/i } },
                                    then: 'bigDog'
                                },
                                {
                                    case: { $regexMatch: { input: '$items.name', regex: /perro/i } },
                                    then: 'perro'
                                },
                                {
                                    case: { $regexMatch: { input: '$items.name', regex: /gato/i } },
                                    then: 'gato'
                                },
                                {
                                    case: { $regexMatch: { input: '$items.name', regex: /huesos/i } },
                                    then: 'huesos'
                                },
                                {
                                    case: { $regexMatch: { input: '$items.name', regex: /complement/i } },
                                    then: 'complementos'
                                }
                            ],
                            default: 'otros'
                        }
                    }
                }
            },
            {
                $group: {
                    _id: groupBy,
                    bigDogQuantity: {
                        $sum: { $cond: [{ $eq: ['$productCategory', 'bigDog'] }, '$items.options.quantity', 0] }
                    },
                    bigDogRevenue: {
                        $sum: { $cond: [{ $eq: ['$productCategory', 'bigDog'] }, { $multiply: ['$items.options.quantity', '$items.options.price'] }, 0] }
                    },
                    perroQuantity: {
                        $sum: { $cond: [{ $eq: ['$productCategory', 'perro'] }, '$items.options.quantity', 0] }
                    },
                    perroRevenue: {
                        $sum: { $cond: [{ $eq: ['$productCategory', 'perro'] }, { $multiply: ['$items.options.quantity', '$items.options.price'] }, 0] }
                    },
                    gatoQuantity: {
                        $sum: { $cond: [{ $eq: ['$productCategory', 'gato'] }, '$items.options.quantity', 0] }
                    },
                    gatoRevenue: {
                        $sum: { $cond: [{ $eq: ['$productCategory', 'gato'] }, { $multiply: ['$items.options.quantity', '$items.options.price'] }, 0] }
                    },
                    huesosQuantity: {
                        $sum: { $cond: [{ $eq: ['$productCategory', 'huesos'] }, '$items.options.quantity', 0] }
                    },
                    huesosRevenue: {
                        $sum: { $cond: [{ $eq: ['$productCategory', 'huesos'] }, { $multiply: ['$items.options.quantity', '$items.options.price'] }, 0] }
                    },
                    complementosQuantity: {
                        $sum: { $cond: [{ $eq: ['$productCategory', 'complementos'] }, '$items.options.quantity', 0] }
                    },
                    complementosRevenue: {
                        $sum: { $cond: [{ $eq: ['$productCategory', 'complementos'] }, { $multiply: ['$items.options.quantity', '$items.options.price'] }, 0] }
                    },
                    totalQuantity: { $sum: '$items.options.quantity' },
                    totalRevenue: { $sum: { $multiply: ['$items.options.quantity', '$items.options.price'] } }
                }
            },
            {
                $sort: {
                    '_id.year': 1,
                    '_id.month': 1,
                    '_id.day': 1,
                    '_id.week': 1
                }
            },
            {
                $project: {
                    _id: 0,
                    period: {
                        $cond: {
                            if: { $and: [{ $ifNull: ['$_id.day', false] }] },
                            then: {
                                $concat: [
                                    { $toString: '$_id.year' },
                                    '-',
                                    { $toString: '$_id.month' },
                                    '-',
                                    { $toString: '$_id.day' }
                                ]
                            },
                            else: {
                                $cond: {
                                    if: { $and: [{ $ifNull: ['$_id.week', false] }] },
                                    then: {
                                        $concat: [
                                            { $toString: '$_id.year' },
                                            '-W',
                                            { $toString: '$_id.week' }
                                        ]
                                    },
                                    else: {
                                        $concat: [
                                            { $toString: '$_id.year' },
                                            '-',
                                            { $toString: '$_id.month' }
                                        ]
                                    }
                                }
                            }
                        }
                    },
                    date: {
                        $cond: {
                            if: { $and: [{ $ifNull: ['$_id.day', false] }] },
                            then: {
                                $concat: [
                                    { $toString: '$_id.day' },
                                    '/',
                                    { $toString: '$_id.month' },
                                    '/',
                                    { $toString: '$_id.year' }
                                ]
                            },
                            else: {
                                $cond: {
                                    if: { $and: [{ $ifNull: ['$_id.week', false] }] },
                                    then: {
                                        $concat: [
                                            'Semana ',
                                            { $toString: '$_id.week' },
                                            ' de ',
                                            { $toString: '$_id.year' }
                                        ]
                                    },
                                    else: {
                                        $concat: [
                                            {
                                                $switch: {
                                                    branches: [
                                                        { case: { $eq: ['$_id.month', 1] }, then: 'Enero' },
                                                        { case: { $eq: ['$_id.month', 2] }, then: 'Febrero' },
                                                        { case: { $eq: ['$_id.month', 3] }, then: 'Marzo' },
                                                        { case: { $eq: ['$_id.month', 4] }, then: 'Abril' },
                                                        { case: { $eq: ['$_id.month', 5] }, then: 'Mayo' },
                                                        { case: { $eq: ['$_id.month', 6] }, then: 'Junio' },
                                                        { case: { $eq: ['$_id.month', 7] }, then: 'Julio' },
                                                        { case: { $eq: ['$_id.month', 8] }, then: 'Agosto' },
                                                        { case: { $eq: ['$_id.month', 9] }, then: 'Septiembre' },
                                                        { case: { $eq: ['$_id.month', 10] }, then: 'Octubre' },
                                                        { case: { $eq: ['$_id.month', 11] }, then: 'Noviembre' },
                                                        { case: { $eq: ['$_id.month', 12] }, then: 'Diciembre' }
                                                    ],
                                                    default: 'Mes'
                                                }
                                            },
                                            ' ',
                                            { $toString: '$_id.year' }
                                        ]
                                    }
                                }
                            }
                        }
                    },
                    bigDogQuantity: 1,
                    bigDogRevenue: 1,
                    perroQuantity: 1,
                    perroRevenue: 1,
                    gatoQuantity: 1,
                    gatoRevenue: 1,
                    huesosQuantity: 1,
                    huesosRevenue: 1,
                    complementosQuantity: 1,
                    complementosRevenue: 1,
                    totalQuantity: 1,
                    totalRevenue: 1
                }
            }
        ];

        const result = await collection.aggregate(pipeline).toArray();

        return result as ProductByTimePeriod[];

    } catch (error) {
        console.error('Error fetching products by time period:', error);
        throw error;
    }
} 