import 'server-only';
import { getCollection } from '@repo/database';
import { format } from 'date-fns';
import type { Order } from '../../types/barfer';

/** Misma lógica que el front: fecha del pedido = deliveryDay en UTC (YYYY-MM-DD) o createdAt en hora Argentina. */
function orderDateStr(order: Order): string {
    if (order.deliveryDay != null && order.deliveryDay !== '') {
        const d = new Date(order.deliveryDay as string | Date);
        return d.toISOString().substring(0, 10);
    }
    const created = new Date(order.createdAt as string | Date);
    const argDate = new Date(created.getTime() - 3 * 60 * 60 * 1000);
    return argDate.toISOString().substring(0, 10);
}

/** Filtra órdenes al día indicado con la MISMA regla que el front (ExpressPageClient ordersOfDay). */
function filterOrdersForDay(orders: Order[], dateStr: string, puntoEnvio: string): Order[] {
    return orders.filter(o => {
        if (!o.puntoEnvio || o.puntoEnvio !== puntoEnvio) return false;
        if (orderDateStr(o) !== dateStr) return false;
        if (!o.items || o.items.length === 0) return false;
        return true;
    });
}

/**
 * Initializes stock for a specific date and shipping point.
 * If stock already exists and has activity, it does nothing.
 * Otherwise, it calculates the TRUE Stock Final of the previous day 
 * and updates/creates the records for the target date.
 */
export async function initializeStockForDate(puntoEnvio: string, date: Date | string): Promise<{
    success: boolean;
    initialized: boolean;
    count: number;
    message?: string;
    error?: string;
}> {
    try {
        console.log("DATE", date)
        const stockCollection = await getCollection('stock');

        // Normalize date string (YYYY-MM-DD)
        let targetDateStr: string;
        if (date instanceof Date) {
            targetDateStr = format(date, 'yyyy-MM-dd');
        } else {
            targetDateStr = date.substring(0, 10);
        }

        console.log(`\n🔄 ========== INITIALIZING STOCK ==========`);
        console.log(`📍 Punto de envío: ${puntoEnvio}`);
        console.log(`📅 Target date: ${targetDateStr}`);

        // 1. Check if stock exists
        const existingStock = await stockCollection.find({
            puntoEnvio: puntoEnvio,
            fecha: targetDateStr
        }).toArray();
        
        console.log(`📦 Existing stock records for ${targetDateStr}: ${existingStock.length}`);
        // Get today's date in YYYY-MM-DD format (Argentina time -3h)
        const nowArg = new Date(new Date().getTime() - (3 * 60 * 60 * 1000));
        const todayStr = (nowArg).toISOString().substring(0, 10);

        console.log(`📅 Date comparison: target=${targetDateStr}, today=${todayStr}`);
        
        // ALWAYS recalculate stock values to ensure data accuracy
        // This is important because orders can be added/modified retroactively
        console.log(`✅ Proceeding with initialization/recalculation...`);

        console.log("PEPEEE", targetDateStr);

        // 2. Find the most recent date with stock for this puntoEnvio
        const recentStock = await stockCollection
            .find({
                puntoEnvio: puntoEnvio,
                fecha: { $lt: targetDateStr }
            })
            .sort({ fecha: -1 })
            .limit(1)
            .toArray();

        if (recentStock.length === 0) {
            return {
                success: true,
                initialized: false,
                count: existingStock.length,
                message: 'No previous stock found to carry over'
            };
        }

        const lastDateStr = recentStock[0].fecha;
        console.log(`📅 Found previous stock from ${lastDateStr}. Carrying over...`);

        // 3. Get ALL stock records for that last date
        console.log("puntoEnvio", puntoEnvio);
        console.log("lastDateStr", lastDateStr);
        const previousStockRecords = await stockCollection
            .find({
                puntoEnvio: puntoEnvio,
                fecha: lastDateStr
            })
            .toArray();

        // 4. Get ALL orders for that last date to calculate REAL sales
        const { getExpressOrders } = await import('./getExpressOrders');
        const { calculateSalesFromOrders } = await import('./calculateSalesForStock');
        const ordersForLastDate = await getExpressOrders(puntoEnvio, lastDateStr, lastDateStr);

        console.log(`📦 Found ${ordersForLastDate.length} orders for ${lastDateStr} to calculate true sales.`);

        // 4.5. Get orders for the TARGET date to recalculate pedidosDelDia and stockFinal.
        // Traemos un rango y filtramos en código con la MISMA lógica que el front (deliveryDay UTC date o createdAt Arg)
        // para evitar desajustes por timezone o por cómo MongoDB compara fechas.
        const ordersForTargetDateRaw = await getExpressOrders(puntoEnvio, targetDateStr, targetDateStr);
        const ordersForTargetDate = filterOrdersForDay(ordersForTargetDateRaw, targetDateStr, puntoEnvio);
        console.log(`📦 Found ${ordersForTargetDate.length} orders for ${targetDateStr} (raw ${ordersForTargetDateRaw.length}) to recalculate pedidosDelDia and stockFinal.`);
        console.log('🔍 Orders for target date:', JSON.stringify(ordersForTargetDate.map(o => ({
            _id: o._id,
            puntoEnvio: o.puntoEnvio,
            deliveryDay: o.deliveryDay,
            createdAt: o.createdAt,
            items: o.items?.map(i => ({ name: i.name, options: i.options }))
        })), null, 2));

        // 5. Create or Update stock records for the target date
        let updatedCount = 0;

        for (const prev of previousStockRecords) {
            // Determine section (fallback for old records)
            let section = prev.section;
            if (!section) {
                const productUpper = (prev.producto || '').toUpperCase();
                if (productUpper.includes('GATO')) section = 'GATO';
                else if (productUpper.includes('PERRO') || productUpper.includes('BIG DOG')) section = 'PERRO';
                else if (productUpper.includes('OTROS')) section = 'OTROS';
                else section = 'PERRO';
            }

            // Calculate REAL sales for this product specifically
            const actualSales = calculateSalesFromOrders({
                product: prev.producto,
                section: section,
                weight: prev.peso
            }, ordersForLastDate);

            // CALCULATE Carry-over:
            // We ALWAYS recalculate based on (Inicial + Llevamos - Sales) to ensure 
            // any updates to the previous day's orders are reflected.


            // console.log('actualSales', actualSales);
            // console.log('prev.stockInicial', prev.stockInicial);
            // console.log('prev.llevamos', prev.llevamos);
            // console.log('prev.peso', prev.peso);
            // console.log('prev.producto', prev.producto);
            // console.log('prev.section', prev.section);
            // console.log('prev.fecha', prev.fecha);
            // console.log('prev.createdAt', prev.createdAt);
            // console.log('prev.updatedAt', prev.updatedAt);
            console.log("prev", prev);

            let fecha = prev.fecha;
            console.log("fecha", fecha)
            const date = new Date(fecha);
            date.setDate(date.getDate() - 1);

            const diaAnterior = date.toISOString().split('T')[0];


            console.log("diaAnterior", diaAnterior);

            // const stockInicialValue = (prev.stockInicial || 0) + (prev.llevamos || 0) - actualSales;
            console.log('prev.stockFinal', prev.stockFinal);
            const stockInicialValue = prev.stockFinal;

            // Calculate REAL pedidosDelDia for the TARGET date
            console.log(`\n🔍 Calculating pedidosDelDia for:`, {
                producto: prev.producto,
                section: section,
                peso: prev.peso,
                ordersCount: ordersForTargetDate.length
            });
            
            const pedidosDelDiaForTarget = calculateSalesFromOrders({
                product: prev.producto,
                section: section,
                weight: prev.peso
            }, ordersForTargetDate);

            console.log(`📊 Product: ${prev.producto} (${prev.peso}) - pedidosDelDia recalculated: ${pedidosDelDiaForTarget}`);

            // Check if record exists for this product 
            const existingMatch = existingStock.find(s =>
                s.producto === prev.producto &&
                s.peso === prev.peso
            );

            if (existingMatch) {
                // IMPORTANT: Recalculate stockFinal based on current data
                // Formula: stockInicial + llevamos - pedidosDelDia = stockFinal
                const recalculatedStockFinal = stockInicialValue + (existingMatch.llevamos || 0) - pedidosDelDiaForTarget;

                console.log(`✏️ UPDATING existing record:`, {
                    _id: existingMatch._id,
                    producto: prev.producto,
                    peso: prev.peso,
                    OLD_VALUES: {
                        stockInicial: existingMatch.stockInicial,
                        llevamos: existingMatch.llevamos,
                        pedidosDelDia: existingMatch.pedidosDelDia,
                        stockFinal: existingMatch.stockFinal
                    },
                    NEW_VALUES: {
                        stockInicial: stockInicialValue,
                        llevamos: existingMatch.llevamos || 0,
                        pedidosDelDia: pedidosDelDiaForTarget,
                        stockFinal: recalculatedStockFinal
                    },
                    CALCULATION: `${stockInicialValue} + ${existingMatch.llevamos || 0} - ${pedidosDelDiaForTarget} = ${recalculatedStockFinal}`
                });

                await stockCollection.updateOne(
                    { _id: existingMatch._id },
                    {
                        $set: {
                            stockInicial: stockInicialValue,
                            pedidosDelDia: pedidosDelDiaForTarget,
                            stockFinal: recalculatedStockFinal,
                            section: section,
                            updatedAt: new Date()
                        }
                    }
                );
                updatedCount++;
            } else {
                // Create new record with recalculated values
                const newStockFinal = stockInicialValue - pedidosDelDiaForTarget;
                
                console.log(`➕ CREATING new record:`, {
                    producto: prev.producto,
                    peso: prev.peso,
                    section: section,
                    VALUES: {
                        stockInicial: stockInicialValue,
                        llevamos: 0,
                        pedidosDelDia: pedidosDelDiaForTarget,
                        stockFinal: newStockFinal
                    },
                    CALCULATION: `${stockInicialValue} + 0 - ${pedidosDelDiaForTarget} = ${newStockFinal}`,
                    fecha: targetDateStr,
                    puntoEnvio: puntoEnvio
                });

                await stockCollection.insertOne({
                    puntoEnvio: puntoEnvio,
                    section: section,
                    producto: prev.producto,
                    peso: prev.peso,
                    stockInicial: stockInicialValue,
                    llevamos: 0,
                    pedidosDelDia: pedidosDelDiaForTarget,
                    stockFinal: newStockFinal,
                    fecha: targetDateStr,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
                updatedCount++;
            }
        }

        console.log(`\n✅ ========== INITIALIZATION COMPLETE ==========`);
        console.log(`📊 Total records updated/created: ${updatedCount}`);
        console.log(`📅 Synchronized from: ${lastDateStr} to ${targetDateStr}`);
        
        return {
            success: true,
            initialized: true,
            count: updatedCount,
            message: `Synchronized ${updatedCount} records from ${lastDateStr}`
        };

    } catch (error) {
        console.error('Error in initializeStockForDate:', error);
        return {
            success: false,
            initialized: false,
            count: 0,
            error: 'Failed to initialize stock'
        };
    }
}
