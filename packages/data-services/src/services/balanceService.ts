'use server'

import 'server-only';
import { getCollection } from '@repo/database';
import { database } from '@repo/database';

export interface BalanceMonthlyData {
    mes: string;
    // Entradas Minorista
    entradasMinorista: number;
    entradasMinoristaPorcentaje: number;
    cantVentasMinorista: number;
    cantVentasMinoristaPorcentaje: number;
    // Entradas Mayorista  
    entradasMayorista: number;
    entradasMayoristaPorcentaje: number;
    cantVentasMayorista: number;
    cantVentasMayoristaPorcentaje: number;
    // Entradas Express (bank-transfer)
    entradasExpress: number;
    entradasExpressPorcentaje: number;
    cantVentasExpress: number;
    cantVentasExpressPorcentaje: number;
    // Entradas Totales
    entradasTotales: number;
    // Salidas
    salidas: number;
    salidasPorcentaje: number;
    // Resultado
    resultadoBarfer: number;
    porcentajeSobreTotalEntradas: number;
    // Precio por KG
    precioPorKg: number;
}

/**
 * Obtiene datos de balance mensual combinando entradas (órdenes) y salidas
 */
export async function getBalanceMonthly(
    startDate?: Date,
    endDate?: Date
): Promise<{ success: boolean; data?: BalanceMonthlyData[]; error?: string }> {
    try {
        const ordersCollection = await getCollection('orders');

        const ordersMatchCondition: any = {};
        if (startDate || endDate) {
            ordersMatchCondition.createdAt = {};
            if (startDate) ordersMatchCondition.createdAt.$gte = startDate;
            if (endDate) ordersMatchCondition.createdAt.$lte = endDate;
        } else {
            // Si no se especifica fecha, mostrar los últimos 3 años para asegurar datos
            const currentYear = new Date().getFullYear();
            const yearStartDate = new Date(currentYear - 2, 0, 1); // Dos años atrás
            const yearEndDate = new Date(currentYear, 11, 31, 23, 59, 59); // Año actual
            ordersMatchCondition.createdAt = { $gte: yearStartDate, $lte: yearEndDate };
        }
        const sampleOrders = await ordersCollection.find(ordersMatchCondition).limit(10).toArray();
        const paymentMethodCounts = await ordersCollection.aggregate([
            { $match: ordersMatchCondition },
            { $group: { _id: '$paymentMethod', count: { $sum: 1 } } }
        ]).toArray();
        paymentMethodCounts.forEach((item: any) => {
        });


        const orderTypeCounts = await ordersCollection.aggregate([
            { $match: ordersMatchCondition },
            { $group: { _id: '$orderType', count: { $sum: 1 } } }
        ]).toArray();
        orderTypeCounts.forEach((item: any) => {
        });
        sampleOrders.forEach((order: any, index: number) => {
            const paymentMethod = order.paymentMethod || '';
            const orderType = order.orderType || 'minorista';

            let categoria = '';
            if (paymentMethod === 'bank-transfer') {
                categoria = 'EXPRESS';
            } else if (orderType === 'mayorista') {
                categoria = 'MAYORISTA';
            } else {
                categoria = 'MINORISTA';
            }
        });

        const ordersPipeline: any[] = [];
        if (Object.keys(ordersMatchCondition).length > 0) {
            ordersPipeline.push({ $match: ordersMatchCondition });
        }

        ordersPipeline.push(
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    // Express: órdenes con paymentMethod = 'bank-transfer' (prioridad alta)
                    totalExpress: {
                        $sum: {
                            $cond: [
                                {
                                    $eq: [
                                        { $ifNull: ['$paymentMethod', ''] },
                                        'bank-transfer'
                                    ]
                                },
                                '$total',
                                0
                            ]
                        }
                    },
                    cantExpress: {
                        $sum: {
                            $cond: [
                                {
                                    $eq: [
                                        { $ifNull: ['$paymentMethod', ''] },
                                        'bank-transfer'
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    },
                    // Mayorista: orderType = 'mayorista' (excluyendo bank-transfer que ya se contaron como Express)
                    totalMayorista: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        {
                                            $eq: [
                                                { $ifNull: ['$orderType', 'minorista'] },
                                                'mayorista'
                                            ]
                                        },
                                        {
                                            $ne: [
                                                { $ifNull: ['$paymentMethod', ''] },
                                                'bank-transfer'
                                            ]
                                        }
                                    ]
                                },
                                '$total',
                                0
                            ]
                        }
                    },
                    cantMayorista: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        {
                                            $eq: [
                                                { $ifNull: ['$orderType', 'minorista'] },
                                                'mayorista'
                                            ]
                                        },
                                        {
                                            $ne: [
                                                { $ifNull: ['$paymentMethod', ''] },
                                                'bank-transfer'
                                            ]
                                        }
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    },
                    totalMinorista: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        {
                                            $ne: [
                                                { $ifNull: ['$orderType', 'minorista'] },
                                                'mayorista'
                                            ]
                                        },
                                        {
                                            $ne: [
                                                { $ifNull: ['$paymentMethod', ''] },
                                                'bank-transfer'
                                            ]
                                        }
                                    ]
                                },
                                '$total',
                                0
                            ]
                        }
                    },
                    cantMinorista: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        {
                                            $ne: [
                                                { $ifNull: ['$orderType', 'minorista'] },
                                                'mayorista'
                                            ]
                                        },
                                        {
                                            $ne: [
                                                { $ifNull: ['$paymentMethod', ''] },
                                                'bank-transfer'
                                            ]
                                        }
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    },
                    totalEntradas: { $sum: '$total' },
                    totalOrdenes: { $sum: 1 },
                    totalItems: { $sum: { $size: '$items' } }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        );

        const ordersResult = await ordersCollection.aggregate(ordersPipeline, {
            allowDiskUse: true
        }).toArray();
        if (ordersResult.length === 0) {
        } else {
            ordersResult.forEach((monthData: any, index: number) => {
                const monthName = new Date(monthData._id.year, monthData._id.month - 1).toLocaleDateString('es-AR', {
                    year: 'numeric',
                    month: 'long'
                });
            });
        }
        const salidasMatchCondition: any = {};
        if (startDate || endDate) {
            salidasMatchCondition.fecha = {};
            if (startDate) {
                salidasMatchCondition.fecha.gte = startDate;
            }
            if (endDate) {
                salidasMatchCondition.fecha.lte = endDate;
            }
        } else {
            // Si no se especifica fecha, mostrar solo el año actual
            const currentYear = new Date().getFullYear();
            const yearStartDate = new Date(currentYear, 0, 1);
            const yearEndDate = new Date(currentYear, 11, 31, 23, 59, 59);
            salidasMatchCondition.fecha = { gte: yearStartDate, lte: yearEndDate };
        }

        // Obtener datos de salidas directamente desde Prisma
        const salidasResult = await database.salida.findMany({
            where: salidasMatchCondition,
            select: {
                fecha: true,
                monto: true
            }
        });

        // Procesar salidas por mes
        const salidasByMonth = new Map<string, number>();

        for (const salida of salidasResult) {
            const fecha = new Date(salida.fecha);
            const monthKey = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
            const currentSum = salidasByMonth.get(monthKey) || 0;
            salidasByMonth.set(monthKey, currentSum + salida.monto);
        }

        // Combinar datos y calcular métricas
        const balanceData: BalanceMonthlyData[] = [];

        for (const orderData of ordersResult) {
            const monthKey = `${orderData._id.year}-${String(orderData._id.month).padStart(2, '0')}`;
            const salidas = salidasByMonth.get(monthKey) || 0;

            const totalEntradas = orderData.totalEntradas;
            const totalMinorista = orderData.totalMinorista;
            const totalMayorista = orderData.totalMayorista;
            const totalExpress = orderData.totalExpress;
            const totalOrdenes = orderData.totalOrdenes;

            // Estimación simple del peso basada en órdenes promedio
            // Para evitar agregaciones complejas que pueden causar errores de memoria
            const estimatedWeight = orderData.totalItems * 8; // Estimación de 8kg promedio por item
            const resultadoBarfer = totalEntradas - salidas;
            const precioPorKg = estimatedWeight > 0 ? totalEntradas / estimatedWeight : 0;

            balanceData.push({
                mes: monthKey,
                // Entradas Minorista
                entradasMinorista: totalMinorista,
                entradasMinoristaPorcentaje: totalEntradas > 0 ? (totalMinorista / totalEntradas) * 100 : 0,
                cantVentasMinorista: orderData.cantMinorista,
                cantVentasMinoristaPorcentaje: totalOrdenes > 0 ? (orderData.cantMinorista / totalOrdenes) * 100 : 0,
                // Entradas Mayorista
                entradasMayorista: totalMayorista,
                entradasMayoristaPorcentaje: totalEntradas > 0 ? (totalMayorista / totalEntradas) * 100 : 0,
                cantVentasMayorista: orderData.cantMayorista,
                cantVentasMayoristaPorcentaje: totalOrdenes > 0 ? (orderData.cantMayorista / totalOrdenes) * 100 : 0,
                // Entradas Express
                entradasExpress: totalExpress,
                entradasExpressPorcentaje: totalEntradas > 0 ? (totalExpress / totalEntradas) * 100 : 0,
                cantVentasExpress: orderData.cantExpress,
                cantVentasExpressPorcentaje: totalOrdenes > 0 ? (orderData.cantExpress / totalOrdenes) * 100 : 0,
                // Entradas Totales
                entradasTotales: totalEntradas,
                // Salidas
                salidas: salidas,
                salidasPorcentaje: totalEntradas > 0 ? (salidas / totalEntradas) * 100 : 0,
                // Resultado
                resultadoBarfer: resultadoBarfer,
                porcentajeSobreTotalEntradas: totalEntradas > 0 ? (resultadoBarfer / totalEntradas) * 100 : 0,
                // Precio por KG
                precioPorKg: precioPorKg
            });
        }

        return { success: true, data: balanceData };

    } catch (error) {
        console.error('Error obteniendo balance mensual:', error);
        console.error('Error details:', {
            message: (error as Error).message,
            stack: (error as Error).stack
        });
        return { success: false, error: `Error interno del servidor: ${(error as Error).message}` };
    }
}

/**
 * Helper function to extract weight from product option name
 */
function getWeightFromOption(productName: string, optionName: string): number {
    const lowerProductName = productName.toLowerCase();

    if (lowerProductName.includes('big dog')) {
        return 15;
    }
    if (lowerProductName.includes('complemento')) {
        return 0;
    }
    const match = optionName.match(/(\d+(?:\.\d+)?)\s*KG/i);
    if (match && match[1]) {
        return parseFloat(match[1]);
    }
    return 0;
}

