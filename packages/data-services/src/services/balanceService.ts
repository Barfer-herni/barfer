'use server'

import 'server-only';
import { getCollection } from '@repo/database';

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
    // Salidas - Desglose por tipo y empresa
    salidas: number;
    salidasPorcentaje: number;
    // Gastos Ordinarios
    gastosOrdinariosBarfer: number;
    gastosOrdinariosSLR: number;
    gastosOrdinariosTotal: number;
    // Gastos Extraordinarios
    gastosExtraordinariosBarfer: number;
    gastosExtraordinariosSLR: number;
    gastosExtraordinariosTotal: number;
    // Resultados - Dos cuentas diferentes
    resultadoSinExtraordinarios: number; // Entradas - Gastos Ordinarios
    resultadoConExtraordinarios: number; // Entradas - (Gastos Ordinarios + Gastos Extraordinarios)
    porcentajeSinExtraordinarios: number;
    porcentajeConExtraordinarios: number;
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


        const ordersPipeline: any[] = [];

        // Primero convertir createdAt a Date si es string (para compatibilidad con órdenes mayoristas)
        ordersPipeline.push({
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

        // Luego aplicar el filtro de fechas
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
        // Obtener datos de salidas desde MongoDB
        const salidasCollection = await getCollection('salidas');

        const salidasMatchCondition: any = {};
        if (startDate || endDate) {
            salidasMatchCondition.fechaFactura = {};
            if (startDate) {
                salidasMatchCondition.fechaFactura.$gte = startDate;
            }
            if (endDate) {
                salidasMatchCondition.fechaFactura.$lte = endDate;
            }
        } else {
            // Si no se especifica fecha, mostrar solo el año actual
            const currentYear = new Date().getFullYear();
            const yearStartDate = new Date(currentYear - 2, 0, 1); // Dos años atrás
            const yearEndDate = new Date(currentYear, 11, 31, 23, 59, 59);
            salidasMatchCondition.fechaFactura = { $gte: yearStartDate, $lte: yearEndDate };
        }

        // Obtener datos de salidas con desglose por tipo y marca
        const salidasResult = await salidasCollection
            .find(salidasMatchCondition, {
                projection: {
                    fechaFactura: 1,
                    monto: 1,
                    tipo: 1,
                    marca: 1
                }
            })
            .toArray();

        // Procesar salidas por mes con desglose
        const salidasByMonth = new Map<string, {
            total: number;
            ordinariosBarfer: number;
            ordinariosSLR: number;
            extraordinariosBarfer: number;
            extraordinariosSLR: number;
        }>();

        for (const salida of salidasResult) {
            const fecha = new Date(salida.fechaFactura);
            const monthKey = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
            const marca = salida.marca?.toLowerCase() || 'barfer';
            const isBarfer = marca === 'barfer';
            const isSLR = marca === 'slr';

            const current = salidasByMonth.get(monthKey) || {
                total: 0,
                ordinariosBarfer: 0,
                ordinariosSLR: 0,
                extraordinariosBarfer: 0,
                extraordinariosSLR: 0
            };

            current.total += salida.monto;

            if (salida.tipo === 'ORDINARIO') {
                if (isBarfer) {
                    current.ordinariosBarfer += salida.monto;
                } else if (isSLR) {
                    current.ordinariosSLR += salida.monto;
                } else {
                    // Si no es SLR, asumimos que es Barfer
                    current.ordinariosBarfer += salida.monto;
                }
            } else if (salida.tipo === 'EXTRAORDINARIO') {
                if (isBarfer) {
                    current.extraordinariosBarfer += salida.monto;
                } else if (isSLR) {
                    current.extraordinariosSLR += salida.monto;
                } else {
                    // Si no es SLR, asumimos que es Barfer
                    current.extraordinariosBarfer += salida.monto;
                }
            }

            salidasByMonth.set(monthKey, current);
        }

        // Combinar datos y calcular métricas
        const balanceData: BalanceMonthlyData[] = [];

        for (const orderData of ordersResult) {
            const monthKey = `${orderData._id.year}-${String(orderData._id.month).padStart(2, '0')}`;
            const salidasData = salidasByMonth.get(monthKey) || {
                total: 0,
                ordinariosBarfer: 0,
                ordinariosSLR: 0,
                extraordinariosBarfer: 0,
                extraordinariosSLR: 0
            };

            const totalEntradas = orderData.totalEntradas;
            const totalMinorista = orderData.totalMinorista;
            const totalMayorista = orderData.totalMayorista;
            const totalExpress = orderData.totalExpress;
            const totalOrdenes = orderData.totalOrdenes;

            // Estimación simple del peso basada en órdenes promedio
            // Para evitar agregaciones complejas que pueden causar errores de memoria
            const estimatedWeight = orderData.totalItems * 8; // Estimación de 8kg promedio por item

            // Cálculo de los dos resultados diferentes
            const resultadoSinExtraordinarios = totalEntradas - salidasData.ordinariosBarfer - salidasData.ordinariosSLR;
            const resultadoConExtraordinarios = totalEntradas - salidasData.total;
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
                // Salidas - Desglose por tipo y empresa
                salidas: salidasData.total,
                salidasPorcentaje: totalEntradas > 0 ? (salidasData.total / totalEntradas) * 100 : 0,
                // Gastos Ordinarios
                gastosOrdinariosBarfer: salidasData.ordinariosBarfer,
                gastosOrdinariosSLR: salidasData.ordinariosSLR,
                gastosOrdinariosTotal: salidasData.ordinariosBarfer + salidasData.ordinariosSLR,
                // Gastos Extraordinarios
                gastosExtraordinariosBarfer: salidasData.extraordinariosBarfer,
                gastosExtraordinariosSLR: salidasData.extraordinariosSLR,
                gastosExtraordinariosTotal: salidasData.extraordinariosBarfer + salidasData.extraordinariosSLR,
                // Resultados - Dos cuentas diferentes
                resultadoSinExtraordinarios: resultadoSinExtraordinarios,
                resultadoConExtraordinarios: resultadoConExtraordinarios,
                porcentajeSinExtraordinarios: totalEntradas > 0 ? (resultadoSinExtraordinarios / totalEntradas) * 100 : 0,
                porcentajeConExtraordinarios: totalEntradas > 0 ? (resultadoConExtraordinarios / totalEntradas) * 100 : 0,
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
    const match = optionName.match(/(\d+(?:\.\d+)?)\s*k?g/i);
    if (match && match[1]) {
        return parseFloat(match[1]);
    }
    return 0;
}

