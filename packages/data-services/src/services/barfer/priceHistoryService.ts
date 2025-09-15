'use server'

import 'server-only';
import { getCollection } from '@repo/database';
import type {
    Price,
    PriceSection,
    PriceType,
    PriceHistoryQuery
} from '../../types/barfer';

/**
 * Convierte un documento de MongoDB a un objeto Price serializable
 */
function transformMongoPrice(mongoDoc: any): Price {
    return {
        _id: String(mongoDoc._id),
        section: mongoDoc.section,
        product: mongoDoc.product,
        weight: mongoDoc.weight,
        priceType: mongoDoc.priceType,
        price: mongoDoc.price,
        isActive: mongoDoc.isActive,
        effectiveDate: mongoDoc.effectiveDate,
        month: mongoDoc.month,
        year: mongoDoc.year,
        createdAt: mongoDoc.createdAt,
        updatedAt: mongoDoc.updatedAt
    };
}

/**
 * Obtener precios por mes y año específico
 * Útil para ver "¿cuánto costaba en mayo de 2024?"
 */
export async function getPricesByMonth(month: number, year: number): Promise<{
    success: boolean;
    prices: Price[];
    total: number;
    message?: string;
    error?: string;
}> {
    try {
        const collection = await getCollection('prices');

        // Buscar precios que estaban activos en ese mes/año
        const mongoPrices = await collection.find(
            {
                month,
                year,
                isActive: true
            },
            {
                sort: {
                    section: 1,
                    product: 1,
                    weight: 1,
                    priceType: 1
                }
            }
        ).toArray();

        const prices = mongoPrices.map(transformMongoPrice);

        return {
            success: true,
            prices,
            total: prices.length
        };
    } catch (error) {
        console.error('Error getting prices by month:', error);
        return {
            success: false,
            message: `Error al obtener precios de ${month}/${year}`,
            error: 'GET_PRICES_BY_MONTH_ERROR',
            prices: [],
            total: 0
        };
    }
}

/**
 * Obtener evolución de precios de un producto específico
 */
export async function getPriceEvolution(
    section: PriceSection,
    product: string,
    weight: string | undefined,
    priceType: PriceType,
    startDate?: string,
    endDate?: string
): Promise<{
    success: boolean;
    evolution: Array<{
        price: number;
        effectiveDate: string;
        month: number;
        year: number;
        createdAt: string;
    }>;
    message?: string;
    error?: string;
}> {
    try {
        const collection = await getCollection('prices');

        const filter: any = {
            section,
            product,
            priceType
        };

        if (weight !== undefined) {
            filter.weight = weight;
        }

        // Agregar filtros de fecha si se proporcionan
        if (startDate || endDate) {
            filter.effectiveDate = {};
            if (startDate) filter.effectiveDate.$gte = startDate;
            if (endDate) filter.effectiveDate.$lte = endDate;
        }

        const prices = await collection.find(filter, {
            sort: { effectiveDate: 1, createdAt: 1 }
        }).toArray() as unknown as Price[];

        const evolution = prices.map((price: Price) => ({
            price: price.price,
            effectiveDate: price.effectiveDate,
            month: price.month,
            year: price.year,
            createdAt: price.createdAt
        }));

        return {
            success: true,
            evolution
        };
    } catch (error) {
        console.error('Error getting price evolution:', error);
        return {
            success: false,
            message: 'Error al obtener la evolución de precios',
            error: 'GET_PRICE_EVOLUTION_ERROR',
            evolution: []
        };
    }
}

/**
 * Obtener comparación de precios entre dos períodos
 */
export async function comparePricesPeriods(
    period1: { month: number; year: number },
    period2: { month: number; year: number }
): Promise<{
    success: boolean;
    comparison: Array<{
        section: PriceSection;
        product: string;
        weight?: string;
        priceType: PriceType;
        period1Price: number | null;
        period2Price: number | null;
        difference: number | null;
        percentageChange: number | null;
    }>;
    message?: string;
    error?: string;
}> {
    try {
        const collection = await getCollection('prices');

        // Obtener precios de ambos períodos
        const [prices1, prices2] = await Promise.all([
            collection.find({
                month: period1.month,
                year: period1.year,
                isActive: true
            }).toArray() as unknown as Price[],
            collection.find({
                month: period2.month,
                year: period2.year,
                isActive: true
            }).toArray() as unknown as Price[]
        ]);

        // Crear mapas para facilitar la comparación
        const pricesMap1 = new Map<string, number>();
        const pricesMap2 = new Map<string, number>();

        prices1.forEach((price: Price) => {
            const key = `${price.section}-${price.product}-${price.weight || 'null'}-${price.priceType}`;
            pricesMap1.set(key, price.price);
        });

        prices2.forEach((price: Price) => {
            const key = `${price.section}-${price.product}-${price.weight || 'null'}-${price.priceType}`;
            pricesMap2.set(key, price.price);
        });

        // Obtener todas las claves únicas
        const allKeys = new Set([...pricesMap1.keys(), ...pricesMap2.keys()]);

        const comparison = Array.from(allKeys).map(key => {
            const [section, product, weight, priceType] = key.split('-');
            const price1 = pricesMap1.get(key) || null;
            const price2 = pricesMap2.get(key) || null;

            let difference = null;
            let percentageChange = null;

            if (price1 !== null && price2 !== null) {
                difference = price2 - price1;
                percentageChange = price1 > 0 ? (difference / price1) * 100 : null;
            }

            return {
                section: section as PriceSection,
                product,
                weight: weight === 'null' ? undefined : weight,
                priceType: priceType as PriceType,
                period1Price: price1,
                period2Price: price2,
                difference,
                percentageChange: percentageChange ? Math.round(percentageChange * 100) / 100 : null
            };
        });

        // Ordenar por diferencia descendente
        comparison.sort((a, b) => {
            if (a.difference === null && b.difference === null) return 0;
            if (a.difference === null) return 1;
            if (b.difference === null) return -1;
            return Math.abs(b.difference) - Math.abs(a.difference);
        });

        return {
            success: true,
            comparison
        };
    } catch (error) {
        console.error('Error comparing prices between periods:', error);
        return {
            success: false,
            message: 'Error al comparar precios entre períodos',
            error: 'COMPARE_PRICES_PERIODS_ERROR',
            comparison: []
        };
    }
}

/**
 * Obtener productos con mayor variabilidad de precios
 */
export async function getMostVolatilePrices(limit: number = 10): Promise<{
    success: boolean;
    volatilePrices: Array<{
        section: PriceSection;
        product: string;
        weight?: string;
        priceType: PriceType;
        minPrice: number;
        maxPrice: number;
        priceRange: number;
        priceCount: number;
        volatilityScore: number; // Rango como porcentaje del precio promedio
    }>;
    message?: string;
    error?: string;
}> {
    try {
        const collection = await getCollection('prices');

        const pipeline = [
            {
                $group: {
                    _id: {
                        section: "$section",
                        product: "$product",
                        weight: "$weight",
                        priceType: "$priceType"
                    },
                    minPrice: { $min: "$price" },
                    maxPrice: { $max: "$price" },
                    avgPrice: { $avg: "$price" },
                    priceCount: { $sum: 1 }
                }
            },
            {
                $match: {
                    priceCount: { $gt: 1 } // Solo productos con múltiples precios
                }
            },
            {
                $addFields: {
                    priceRange: { $subtract: ["$maxPrice", "$minPrice"] },
                    volatilityScore: {
                        $cond: {
                            if: { $gt: ["$avgPrice", 0] },
                            then: {
                                $multiply: [
                                    { $divide: [{ $subtract: ["$maxPrice", "$minPrice"] }, "$avgPrice"] },
                                    100
                                ]
                            },
                            else: 0
                        }
                    }
                }
            },
            {
                $sort: { volatilityScore: -1 }
            },
            {
                $limit: limit
            }
        ];

        const results = await collection.aggregate(pipeline).toArray();

        const volatilePrices = results.map((result: any) => ({
            section: result._id.section,
            product: result._id.product,
            weight: result._id.weight,
            priceType: result._id.priceType,
            minPrice: Math.round(result.minPrice * 100) / 100,
            maxPrice: Math.round(result.maxPrice * 100) / 100,
            priceRange: Math.round(result.priceRange * 100) / 100,
            priceCount: result.priceCount,
            volatilityScore: Math.round(result.volatilityScore * 100) / 100
        }));

        return {
            success: true,
            volatilePrices
        };
    } catch (error) {
        console.error('Error getting most volatile prices:', error);
        return {
            success: false,
            message: 'Error al obtener productos con mayor variabilidad de precios',
            error: 'GET_VOLATILE_PRICES_ERROR',
            volatilePrices: []
        };
    }
}

/**
 * Obtener resumen de cambios de precios por mes
 */
export async function getPriceChangesSummary(year?: number): Promise<{
    success: boolean;
    summary: Array<{
        month: number;
        year: number;
        monthName: string;
        totalChanges: number;
        avgPriceChange: number;
        biggestIncrease: {
            product: string;
            section: PriceSection;
            priceType: PriceType;
            increase: number;
        } | null;
        biggestDecrease: {
            product: string;
            section: PriceSection;
            priceType: PriceType;
            decrease: number;
        } | null;
    }>;
    message?: string;
    error?: string;
}> {
    try {
        const collection = await getCollection('prices');

        const currentYear = year || new Date().getFullYear();
        const monthNames = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];

        // Obtener cambios por mes
        const pipeline = [
            {
                $match: { year: currentYear }
            },
            {
                $group: {
                    _id: { month: "$month", year: "$year" },
                    changes: { $push: "$$ROOT" },
                    totalChanges: { $sum: 1 },
                    avgPrice: { $avg: "$price" }
                }
            },
            {
                $sort: { "_id.month": 1 }
            }
        ];

        const monthlyData = await collection.aggregate(pipeline).toArray();

        const summary = await Promise.all(
            monthlyData.map(async (monthData: any) => {
                const month = monthData._id.month;
                const year = monthData._id.year;

                // Para calcular los cambios más grandes, necesitamos comparar con el mes anterior
                const previousMonth = month === 1 ? 12 : month - 1;
                const previousYear = month === 1 ? year - 1 : year;

                const previousPrices = await collection.find({
                    month: previousMonth,
                    year: previousYear
                }).toArray() as unknown as Price[];

                const currentPrices = monthData.changes;

                // Crear mapas para comparación
                const prevMap = new Map();
                previousPrices.forEach((price: Price) => {
                    const key = `${price.section}-${price.product}-${price.weight || 'null'}-${price.priceType}`;
                    prevMap.set(key, price.price);
                });

                let totalPriceChange = 0;
                let changeCount = 0;
                let biggestIncrease: any = null;
                let biggestDecrease: any = null;

                currentPrices.forEach((currentPrice: Price) => {
                    const key = `${currentPrice.section}-${currentPrice.product}-${currentPrice.weight || 'null'}-${currentPrice.priceType}`;
                    const prevPrice = prevMap.get(key);

                    if (prevPrice !== undefined) {
                        const change = currentPrice.price - prevPrice;
                        totalPriceChange += change;
                        changeCount++;

                        if (change > 0 && (!biggestIncrease || change > biggestIncrease.increase)) {
                            biggestIncrease = {
                                product: currentPrice.product,
                                section: currentPrice.section,
                                priceType: currentPrice.priceType,
                                increase: Math.round(change * 100) / 100
                            };
                        }

                        if (change < 0 && (!biggestDecrease || change < biggestDecrease.decrease)) {
                            biggestDecrease = {
                                product: currentPrice.product,
                                section: currentPrice.section,
                                priceType: currentPrice.priceType,
                                decrease: Math.round(Math.abs(change) * 100) / 100
                            };
                        }
                    }
                });

                return {
                    month,
                    year,
                    monthName: monthNames[month - 1],
                    totalChanges: monthData.totalChanges,
                    avgPriceChange: changeCount > 0 ? Math.round((totalPriceChange / changeCount) * 100) / 100 : 0,
                    biggestIncrease,
                    biggestDecrease
                };
            })
        );

        return {
            success: true,
            summary
        };
    } catch (error) {
        console.error('Error getting price changes summary:', error);
        return {
            success: false,
            message: 'Error al obtener resumen de cambios de precios',
            error: 'GET_PRICE_CHANGES_SUMMARY_ERROR',
            summary: []
        };
    }
}