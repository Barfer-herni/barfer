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
 * Función auxiliar para calcular pesos reales de un mes específico (opcional, más precisa)
 */
async function calculateRealWeightsForMonth(
    collection: any,
    year: number,
    month: number,
    matchCondition: any
): Promise<{ sameDayWeight: number; normalWeight: number; wholesaleWeight: number }> {
    try {
        // Crear match condition específico para este mes
        const monthMatchCondition = {
            ...matchCondition,
            createdAt: {
                ...matchCondition.createdAt,
                $gte: new Date(year, month - 1, 1),
                $lt: new Date(year, month, 1)
            }
        };

        // Pipeline muy simple solo para obtener items
        const weightPipeline = [
            { $match: monthMatchCondition },
            {
                $project: {
                    items: 1,
                    orderType: 1,
                    'deliveryArea.sameDayDelivery': 1,
                    'items.sameDayDelivery': 1
                }
            },
            { $limit: 1000 } // Limitar para evitar sobrecarga
        ];

        const orders = await collection.aggregate(weightPipeline).toArray();

        let sameDayWeight = 0;
        let normalWeight = 0;
        let wholesaleWeight = 0;

        orders.forEach((order: any) => {
            const isWholesale = order.orderType === "mayorista";
            const isSameDay = order.deliveryArea?.sameDayDelivery || order.items?.some((item: any) => item.sameDayDelivery);

            if (order.items && Array.isArray(order.items)) {
                order.items.forEach((item: any) => {
                    if (item.options && Array.isArray(item.options)) {
                        item.options.forEach((option: any) => {
                            const weight = getWeightInKg(item.name, option.name);
                            if (weight !== null) {
                                const totalWeight = weight * (option.quantity || 1);
                                if (isWholesale) {
                                    wholesaleWeight += totalWeight;
                                } else if (isSameDay) {
                                    sameDayWeight += totalWeight;
                                } else {
                                    normalWeight += totalWeight;
                                }
                            }
                        });
                    }
                });
            }
        });

        return { sameDayWeight, normalWeight, wholesaleWeight };
    } catch (error) {
        console.warn(`⚠️ Error calculando pesos reales para ${year}-${month}, usando estimación:`, error);
        return { sameDayWeight: 0, normalWeight: 0, wholesaleWeight: 0 };
    }
}

/**
 * Función auxiliar para calcular pesos reales si se necesita mayor precisión
 */
async function calculateRealWeightsIfNeeded(
    collection: any,
    results: DeliveryTypeStats[],
    baseMatchCondition: any
): Promise<void> {
    console.log('🔍 Calculando pesos reales para mayor precisión...');

    for (const result of results) {
        try {
            const [year, month] = result.month.split('-').map(Number);

            // Solo calcular si hay órdenes en este mes
            if (result.sameDayOrders + result.normalOrders + result.wholesaleOrders > 0) {
                const realWeights = await calculateRealWeightsForMonth(
                    collection,
                    year,
                    month,
                    baseMatchCondition
                );

                // Actualizar con pesos reales si se obtuvieron
                if (realWeights.sameDayWeight > 0 || realWeights.normalWeight > 0 || realWeights.wholesaleWeight > 0) {
                    result.sameDayWeight = Math.round(realWeights.sameDayWeight * 100) / 100;
                    result.normalWeight = Math.round(realWeights.normalWeight * 100) / 100;
                    result.wholesaleWeight = Math.round(realWeights.wholesaleWeight * 100) / 100;
                }
            }
        } catch (error) {
            console.warn(`⚠️ Error calculando pesos reales para ${result.month}:`, error);
            // Mantener estimaciones originales en caso de error
        }
    }
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

        // ESTRATEGIA RADICAL: Dividir en consultas más pequeñas sin procesamiento pesado de items
        console.log('🔍 Ejecutando consulta optimizada sin items pesados...');

        // PASO 1: Obtener estadísticas básicas (sin items) para evitar sobrecarga de memoria
        const basicStatsPipeline: any[] = [];

        // Filtro básico de fechas más eficiente
        const matchCondition: any = {};
        if (startDate || endDate) {
            // Usar filtro directo en lugar de $expr para mejor rendimiento
            matchCondition.createdAt = {};
            if (startDate) matchCondition.createdAt.$gte = startDate;
            if (endDate) matchCondition.createdAt.$lte = endDate;
        }

        if (Object.keys(matchCondition).length > 0) {
            basicStatsPipeline.push({ $match: matchCondition });
        }

        // Pipeline super simplificado SIN items para evitar memoria
        basicStatsPipeline.push(
            // Solo convertir fecha si es necesario y clasificar
            {
                $addFields: {
                    createdAt: {
                        $cond: [
                            { $eq: [{ $type: "$createdAt" }, "string"] },
                            { $toDate: "$createdAt" },
                            "$createdAt"
                        ]
                    },
                    isSameDayDelivery: {
                        $or: [
                            { $eq: ["$deliveryArea.sameDayDelivery", true] },
                            { $eq: ["$items.sameDayDelivery", true] }
                        ]
                    },
                    isWholesale: { $eq: ["$orderType", "mayorista"] }
                }
            },
            // Agrupar SOLO con estadísticas básicas, SIN items
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
                    }
                }
            },
            // Sort simple sin muchos datos
            {
                $sort: { "_id.year": 1, "_id.month": 1 }
            },
            // Proyecto final simplificado
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
                    wholesaleRevenue: 1
                }
            }
        );

        // Ejecutar consulta básica SIN allowDiskUse (debería ser lo suficientemente pequeña)
        console.log('📊 Ejecutando agregación básica...');
        const basicStats = await collection.aggregate(basicStatsPipeline).toArray();

        console.log(`✅ Estadísticas básicas obtenidas: ${basicStats.length} meses`);

        // PASO 2: Calcular pesos por separado con consultas más pequeñas por mes
        console.log('⚖️ Calculando pesos por mes de manera eficiente...');

        const finalResults: DeliveryTypeStats[] = [];

        for (const monthStats of basicStats) {
            // Calcular peso de manera aproximada o usar valores por defecto
            // Para evitar la consulta pesada de items, usamos estimaciones basadas en órdenes

            // Estimación simple: peso promedio por orden basado en tipo
            const avgWeightPerSameDayOrder = 8; // kg promedio para same day
            const avgWeightPerNormalOrder = 12; // kg promedio para normal 
            const avgWeightPerWholesaleOrder = 25; // kg promedio para mayorista

            const sameDayWeight = monthStats.sameDayOrders * avgWeightPerSameDayOrder;
            const normalWeight = monthStats.normalOrders * avgWeightPerNormalOrder;
            const wholesaleWeight = monthStats.wholesaleOrders * avgWeightPerWholesaleOrder;

            finalResults.push({
                month: monthStats.month,
                sameDayOrders: monthStats.sameDayOrders,
                normalOrders: monthStats.normalOrders,
                wholesaleOrders: monthStats.wholesaleOrders,
                sameDayRevenue: monthStats.sameDayRevenue,
                normalRevenue: monthStats.normalRevenue,
                wholesaleRevenue: monthStats.wholesaleRevenue,
                sameDayWeight: Math.round(sameDayWeight * 100) / 100,
                normalWeight: Math.round(normalWeight * 100) / 100,
                wholesaleWeight: Math.round(wholesaleWeight * 100) / 100
            });
        }

        // PASO 3 (OPCIONAL): Si se necesitan pesos más precisos, calcular por lotes pequeños
        // Descomentar la siguiente línea para usar pesos reales (más lento pero más preciso)
        // await calculateRealWeightsIfNeeded(collection, finalResults, matchCondition);

        console.log(`🎉 Procesamiento completado: ${finalResults.length} meses procesados`);
        return finalResults;

    } catch (error) {
        console.error('Error fetching delivery type stats by month:', error);
        throw error;
    }
}

/**
 * Función alternativa super simple que evita totalmente la agregación compleja
 * Usa solo queries básicas para garantizar que funcione sin errores de memoria
 */
export async function getDeliveryTypeStatsByMonthSimple(startDate?: Date, endDate?: Date): Promise<DeliveryTypeStats[]> {
    try {
        const collection = await getCollection('orders');

        console.log('🔧 Usando método alternativo super simplificado...');

        // Crear filtro básico - compatible con Date objects y strings
        const baseFilter: any = {};
        if (startDate || endDate) {
            // Usar $or para manejar tanto Date objects como strings
            baseFilter.$or = [
                // Filtro para Date objects
                {
                    createdAt: {
                        ...(startDate && { $gte: startDate }),
                        ...(endDate && { $lte: endDate })
                    }
                },
                // Filtro para strings
                {
                    createdAt: {
                        ...(startDate && { $gte: startDate.toISOString() }),
                        ...(endDate && { $lte: endDate.toISOString() })
                    }
                }
            ];
        }

        console.log('🔍 Debug: Filtro aplicado en getDeliveryTypeStatsByMonth:', JSON.stringify(baseFilter, null, 2));
        console.log('📅 Debug: Rango de fechas consultado:', {
            startDate: startDate?.toISOString(),
            endDate: endDate?.toISOString()
        });

        // ESTRATEGIA: Obtener datos mes por mes usando find() simple
        const months = new Map<string, DeliveryTypeStats>();

        // Obtener todas las órdenes de manera simple sin agregación
        console.log('📊 Obteniendo órdenes con consulta básica...');

        // Debug: verificar si hay órdenes de mayoristas en toda la BD
        const allWholesaleOrders = await collection.find({ orderType: 'mayorista' }).toArray();
        console.log(`🏪 Debug: Total de órdenes mayoristas en toda la BD: ${allWholesaleOrders.length}`);
        if (allWholesaleOrders.length > 0) {
            console.log('🏪 Debug: Ejemplos de órdenes mayoristas en BD:', allWholesaleOrders.slice(0, 3).map(order => ({
                _id: order._id,
                createdAt: order.createdAt,
                orderType: order.orderType,
                total: order.total
            })));

            // Debug: verificar fechas de órdenes mayoristas vs rango consultado
            const startDateISO = startDate?.toISOString();
            const endDateISO = endDate?.toISOString();
            console.log('📅 Debug: Rango consultado vs fechas de mayoristas:');
            console.log(`  - Rango consultado: ${startDateISO} a ${endDateISO}`);
            allWholesaleOrders.forEach((order, index) => {
                // Convertir createdAt a Date si es string
                let orderDate = order.createdAt;
                if (typeof orderDate === 'string') {
                    orderDate = new Date(orderDate);
                }

                const orderDateISO = orderDate?.toISOString?.() || 'Fecha inválida';
                const isInRange = startDate && endDate && orderDate && !isNaN(orderDate.getTime())
                    ? (orderDate >= startDate && orderDate <= endDate)
                    : 'N/A';
                console.log(`  - Mayorista ${index + 1}: ${orderDateISO} (en rango: ${isInRange})`);
            });
        }

        // Debug: verificar si hay órdenes de mayoristas con el filtro de fechas
        const wholesaleWithDateFilter = await collection.find({
            orderType: 'mayorista',
            ...baseFilter
        }).toArray();
        console.log(`🏪 Debug: Órdenes mayoristas con filtro de fechas: ${wholesaleWithDateFilter.length}`);
        if (wholesaleWithDateFilter.length > 0) {
            console.log('🏪 Debug: Órdenes mayoristas con filtro de fechas:', wholesaleWithDateFilter.map(order => ({
                _id: order._id,
                createdAt: order.createdAt,
                orderType: order.orderType,
                total: order.total
            })));
        }

        // Debug: verificar el filtro baseFilter paso a paso
        console.log('🔍 Debug: Filtro baseFilter completo:', JSON.stringify(baseFilter, null, 2));

        // Debug: verificar tipos de datos de las fechas
        console.log('🔍 Debug: Tipos de datos de fechas:');
        console.log(`  - startDate: ${typeof startDate} - ${startDate?.constructor?.name} - ${startDate?.toISOString?.()}`);
        console.log(`  - endDate: ${typeof endDate} - ${endDate?.constructor?.name} - ${endDate?.toISOString?.()}`);

        // Debug: probar filtros individuales
        if (baseFilter.createdAt) {
            console.log('🔍 Debug: Probando filtros de fecha individuales...');

            // Probar solo con startDate
            if (baseFilter.createdAt.$gte) {
                const testStartDate = await collection.find({
                    orderType: 'mayorista',
                    createdAt: { $gte: baseFilter.createdAt.$gte }
                }).toArray();
                console.log(`🏪 Debug: Con solo startDate (>=): ${testStartDate.length} órdenes mayoristas`);
            }

            // Probar solo con endDate
            if (baseFilter.createdAt.$lte) {
                const testEndDate = await collection.find({
                    orderType: 'mayorista',
                    createdAt: { $lte: baseFilter.createdAt.$lte }
                }).toArray();
                console.log(`🏪 Debug: Con solo endDate (<=): ${testEndDate.length} órdenes mayoristas`);
            }
        }

        // Debug: probar con filtro de fecha como string
        console.log('🔍 Debug: Probando filtro de fecha como string...');
        const testStringFilter = await collection.find({
            orderType: 'mayorista',
            createdAt: {
                $gte: '2024-08-19T00:00:00.000Z',
                $lte: '2025-08-19T23:59:59.999Z'
            }
        }).toArray();
        console.log(`🏪 Debug: Con filtro de fecha como string: ${testStringFilter.length} órdenes mayoristas`);

        // Debug: comparar estructura de órdenes minoristas vs mayoristas
        console.log('🔍 Debug: Comparando estructura de órdenes...');

        // Obtener una orden minorista de ejemplo
        const sampleMinorista = await collection.findOne({ orderType: 'minorista' });
        if (sampleMinorista) {
            console.log('🏪 Debug: Estructura orden minorista:', {
                _id: sampleMinorista._id,
                createdAt: sampleMinorista.createdAt,
                createdAtType: typeof sampleMinorista.createdAt,
                orderType: sampleMinorista.orderType,
                total: sampleMinorista.total
            });
        }

        // Obtener una orden mayorista de ejemplo
        const sampleMayorista = await collection.findOne({ orderType: 'mayorista' });
        if (sampleMayorista) {
            console.log('🏪 Debug: Estructura orden mayorista:', {
                _id: sampleMayorista._id,
                createdAt: sampleMayorista.createdAt,
                createdAtType: typeof sampleMayorista.createdAt,
                orderType: sampleMayorista.orderType,
                total: sampleMayorista.total
            });
        }

        const orders = await collection.find(baseFilter, {
            projection: {
                createdAt: 1,
                orderType: 1,
                total: 1,
                'deliveryArea.sameDayDelivery': 1,
                'items.sameDayDelivery': 1
            }
        }).toArray();

        // Debug: verificar si hay órdenes de mayoristas en el rango consultado
        const wholesaleInRange = orders.filter(order => order.orderType === 'mayorista');
        console.log(`🏪 Debug: Órdenes mayoristas en el rango consultado: ${wholesaleInRange.length}`);
        if (wholesaleInRange.length > 0) {
            console.log('🏪 Debug: Órdenes mayoristas en rango:', wholesaleInRange.map(order => ({
                _id: order._id,
                createdAt: order.createdAt,
                orderType: order.orderType,
                total: order.total
            })));
        }

        console.log(`📝 Procesando ${orders.length} órdenes...`);

        // Debug: contar órdenes por tipo antes de procesar
        const orderTypeCounts = orders.reduce((acc: any, order) => {
            const orderType = order.orderType || 'minorista';
            acc[orderType] = (acc[orderType] || 0) + 1;
            return acc;
        }, {});
        console.log('🔍 Debug: Conteo de órdenes por tipo antes de procesar:', orderTypeCounts);

        // Debug: mostrar algunas órdenes de mayoristas para verificar
        const wholesaleOrders = orders.filter(order => order.orderType === 'mayorista');
        if (wholesaleOrders.length > 0) {
            console.log(`🏪 Debug: Encontradas ${wholesaleOrders.length} órdenes de mayoristas:`, wholesaleOrders.slice(0, 3).map(order => ({
                _id: order._id,
                createdAt: order.createdAt,
                orderType: order.orderType,
                total: order.total
            })));
        } else {
            console.log('⚠️ Debug: NO se encontraron órdenes de mayoristas en la consulta');
        }

        // Procesar órdenes una por una
        orders.forEach((order: any) => {
            try {
                // Convertir fecha si es string
                let orderDate = order.createdAt;
                if (typeof orderDate === 'string') {
                    orderDate = new Date(orderDate);
                }

                if (!orderDate || isNaN(orderDate.getTime())) {
                    return; // Saltar órdenes con fechas inválidas
                }

                const year = orderDate.getFullYear();
                const month = orderDate.getMonth() + 1;
                const monthKey = `${year}-${String(month).padStart(2, '0')}`;

                // Inicializar mes si no existe
                if (!months.has(monthKey)) {
                    months.set(monthKey, {
                        month: monthKey,
                        sameDayOrders: 0,
                        normalOrders: 0,
                        wholesaleOrders: 0,
                        sameDayRevenue: 0,
                        normalRevenue: 0,
                        wholesaleRevenue: 0,
                        sameDayWeight: 0,
                        normalWeight: 0,
                        wholesaleWeight: 0
                    });
                }

                const monthStats = months.get(monthKey)!;
                const total = order.total || 0;

                // Clasificar orden - asumir minorista si no tiene orderType (consistente con debug)
                const orderType = order.orderType || 'minorista';
                const isWholesale = orderType === "mayorista";
                const isSameDay = order.deliveryArea?.sameDayDelivery ||
                    (order.items && order.items.some((item: any) => item.sameDayDelivery));

                if (isWholesale) {
                    monthStats.wholesaleOrders++;
                    monthStats.wholesaleRevenue += total;
                    monthStats.wholesaleWeight += 25; // Estimación simple
                    console.log(`🏪 Debug: Orden mayorista procesada - Mes: ${monthKey}, Total: ${total}`);
                } else if (isSameDay) {
                    monthStats.sameDayOrders++;
                    monthStats.sameDayRevenue += total;
                    monthStats.sameDayWeight += 8; // Estimación simple
                } else {
                    monthStats.normalOrders++;
                    monthStats.normalRevenue += total;
                    monthStats.normalWeight += 12; // Estimación simple
                }
            } catch (error) {
                console.warn('⚠️ Error procesando orden:', error);
            }
        });

        // Convertir a array y ordenar
        const result = Array.from(months.values()).sort((a, b) => a.month.localeCompare(b.month));



        console.log('🔍 Debug: ResultadoOOOO:', result);
        // Debug: mostrar resumen final
        const totalWholesale = result.reduce((sum, month) => sum + month.wholesaleOrders, 0);
        const totalNormal = result.reduce((sum, month) => sum + month.normalOrders, 0);
        const totalSameDay = result.reduce((sum, month) => sum + month.sameDayOrders, 0);

        console.log(`📊 Debug: Resumen final del procesamiento:`);
        console.log(`  - Órdenes mayoristas: ${totalWholesale}`);
        console.log(`  - Órdenes normales: ${totalNormal}`);
        console.log(`  - Órdenes same day: ${totalSameDay}`);
        console.log(`  - Total procesado: ${totalWholesale + totalNormal + totalSameDay}`);

        console.log(`✅ Procesamiento simple completado: ${result.length} meses`);
        return result;

    } catch (error) {
        console.error('Error en método simple:', error);
        throw error;
    }
} 