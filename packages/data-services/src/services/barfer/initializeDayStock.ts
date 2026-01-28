import 'server-only';
import { getCollection } from '@repo/database';
import { format } from 'date-fns';

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
        const stockCollection = await getCollection('stock');

        // Normalize date string (YYYY-MM-DD)
        let targetDateStr: string;
        if (date instanceof Date) {
            targetDateStr = format(date, 'yyyy-MM-dd');
        } else {
            targetDateStr = date.substring(0, 10);
        }

        console.log(`🔄 Check/Init Stock for ${puntoEnvio} on ${targetDateStr}`);

        // 1. Check if stock exists
        const existingStock = await stockCollection.find({
            puntoEnvio: puntoEnvio,
            fecha: targetDateStr
        }).toArray();

        // Get today's date in YYYY-MM-DD format (Argentina time -3h)
        const nowArg = new Date(new Date().getTime() - (3 * 60 * 60 * 1000));
        const todayStr = (nowArg).toISOString().substring(0, 10);

        // We only proceed if it's today or a future date.
        // Past dates are strictly protected to avoid destroying history.
        if (targetDateStr < todayStr && existingStock.length > 0) {
            console.log(`✅ Past date ${targetDateStr}. Skipping re-sync to protect historical data.`);
            return {
                success: true,
                initialized: false,
                count: existingStock.length,
                message: 'Historical stock protected'
            };
        }

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
            const stockInicialValue = (prev.stockInicial || 0) + (prev.llevamos || 0) - actualSales;

            // Check if record exists for this product 
            const existingMatch = existingStock.find(s =>
                s.producto === prev.producto &&
                s.peso === prev.peso
            );

            if (existingMatch) {
                // IMPORTANT: ONLY update if there is no manual activity (llevamos: 0)
                // This protects manual edits made today while allowing correction of starting values.
                if ((existingMatch.llevamos || 0) === 0) {
                    await stockCollection.updateOne(
                        { _id: existingMatch._id },
                        {
                            $set: {
                                stockInicial: stockInicialValue,
                                stockFinal: stockInicialValue - (existingMatch.pedidosDelDia || 0),
                                section: section,
                                updatedAt: new Date()
                            }
                        }
                    );
                    updatedCount++;
                }
            } else {
                // Create new record
                await stockCollection.insertOne({
                    puntoEnvio: puntoEnvio,
                    section: section,
                    producto: prev.producto,
                    peso: prev.peso,
                    stockInicial: stockInicialValue,
                    llevamos: 0,
                    pedidosDelDia: 0,
                    stockFinal: stockInicialValue,
                    fecha: targetDateStr,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
                updatedCount++;
            }
        }

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
