import 'server-only';
import { getCollection, ObjectId } from '@repo/database';
import type { Stock } from '../../types/barfer';
import { format, subDays, startOfDay } from 'date-fns';

/**
 * Initializes stock for a specific date and shipping point.
 * If stock already exists for that date, it does nothing.
 * Otherwise, it looks for the most recent stock records and creates new ones
 * carrying over the Stock Final as Stock Initial.
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
            // Ensure we have YYYY-MM-DD
            targetDateStr = date.substring(0, 10);
        }

        console.log(`🔄 Check/Init Stock for ${puntoEnvio} on ${targetDateStr}`);

        // 1. Check if stock exists for this date and puntoEnvio
        const existingStockCount = await stockCollection.countDocuments({
            puntoEnvio: puntoEnvio,
            fecha: targetDateStr
        });

        if (existingStockCount > 0) {
            console.log(`✅ Stock already exists for ${targetDateStr} (${existingStockCount} records). Skipping init.`);
            return {
                success: true,
                initialized: false,
                count: existingStockCount,
                message: 'Stock already exists'
            };
        }

        // 2. Find the most recent date with stock for this puntoEnvio
        // We look back up to 30 days to find the last record
        const recentStock = await stockCollection
            .find({
                puntoEnvio: puntoEnvio,
                fecha: { $lt: targetDateStr }
            })
            .sort({ fecha: -1 })
            .limit(1)
            .toArray();

        if (recentStock.length === 0) {
            console.log(`⚠️ No previous stock found for ${puntoEnvio}. Starting from scratch.`);
            return {
                success: true,
                initialized: false,
                count: 0,
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

        // 4. Create new stock records for the target date
        const newStockDocs = previousStockRecords.map(prev => {
            const stockInicial = prev.stockFinal || 0; // Carry over final as initial

            return {
                puntoEnvio: puntoEnvio,
                producto: prev.producto,
                peso: prev.peso,
                stockInicial: stockInicial,
                llevamos: 0, // Reset sales
                pedidosDelDia: 0, // Reset orders (will be calculated by UI/actions)
                stockFinal: stockInicial, // Initially, Final = Initial
                fecha: targetDateStr,
                createdAt: new Date(),
                updatedAt: new Date()
            };
        });

        if (newStockDocs.length > 0) {
            await stockCollection.insertMany(newStockDocs);
            console.log(`🚀 Initialized ${newStockDocs.length} stock records for ${targetDateStr}`);
        }

        return {
            success: true,
            initialized: true,
            count: newStockDocs.length,
            message: `Initialized ${newStockDocs.length} records from ${lastDateStr}`
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
