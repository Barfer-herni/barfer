import { getCollection } from '@repo/database';
import { format } from 'date-fns';
import type { DeliveryArea, Stock, CreateStockData } from '../../types/barfer';

/**
 * Servicio para verificar y ejecutar el pase de stock al día siguiente (Rollover)
 * Se ejecuta vía CRON periódicamente
 */
export async function checkAndPerformStockRollover() {
    try {
        console.log('🔄 [STOCK ROLLOVER] Iniciando verificación de rollover de stock...');

        // 1. Obtener todas las delivery areas habilitadas que tengan schedule (puntos express)
        const deliveryAreasCollection = await getCollection('delivery_areas');
        const deliveryAreas = await deliveryAreasCollection.find({
            enabled: true,
            sameDayDelivery: true,
            schedule: { $exists: true, $ne: '' }
        }).toArray() as unknown as DeliveryArea[];

        if (!deliveryAreas.length) {
            console.log('ℹ️ [STOCK ROLLOVER] No se encontraron puntos de envío express habilitados.');
            return;
        }

        // Hora actual en Argentina
        const now = new Date();
        const argentinaTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" }));
        const currentHour = argentinaTime.getHours();

        // Formato para fechas en string (YYYY-MM-DD)
        const todayStr = format(argentinaTime, 'yyyy-MM-dd');

        // Calcular "mañana" o "próximo día hábil"
        const nextDay = new Date(argentinaTime);
        nextDay.setDate(nextDay.getDate() + 1);

        // Si mañana es Domingo, pasar al Lunes
        if (nextDay.getDay() === 0) {
            nextDay.setDate(nextDay.getDate() + 1);
        }

        const nextDayStr = format(nextDay, 'yyyy-MM-dd');

        console.log(`📅 [STOCK ROLLOVER] Hoy: ${todayStr}, Próximo día hábil: ${nextDayStr}`);

        // Importar servicios necesarios para cálculos precisos
        const { calculateSalesFromOrders } = await import('./calculateSalesForStock');
        const { getExpressOrders } = await import('./getExpressOrders');

        // Colección de stock
        const stockCollection = await getCollection('stock');

        // Procesar cada punto de envío
        for (const area of deliveryAreas) {
            // Verificar si tiene puntoEnvio definido
            if (!area.puntoEnvio) continue;

            // Verificar si ya pasó la hora de corte
            const cutOffHour = area.orderCutOffHour || 14; // Default 14hs si no está definido

            // Solo ejecutar el rollover SI YA PASÓ la hora de corte
            if (currentHour >= cutOffHour) {
                console.log(`📍 [STOCK ROLLOVER] Procesando punto: ${area.puntoEnvio} (Corte: ${cutOffHour}hs - Pasado ✅)`);

                // Buscar stock de HOY para este punto
                const stockHoy = await stockCollection.find({
                    puntoEnvio: area.puntoEnvio,
                    fecha: todayStr
                }).toArray() as unknown as Stock[];

                if (stockHoy.length === 0) {
                    console.log(`   ℹ️ No hay stock registrado para hoy (${todayStr}) en ${area.puntoEnvio}. Nada que migrar.`);
                    continue;
                }

                // Obtener órdenes de hoy para este punto para calcular ventas reales
                const ordersHoy = await getExpressOrders(area.puntoEnvio, todayStr, todayStr);
                console.log(`   📊 Encontrados ${stockHoy.length} registros de stock y ${ordersHoy.length} órdenes para hoy.`);

                // Para cada producto con stock hoy, verificar/crear stock para mañana
                for (const item of stockHoy) {
                    // Verificar si ya existe stock para el próximo día
                    const existingNextDayStock = await stockCollection.findOne({
                        puntoEnvio: area.puntoEnvio,
                        producto: item.producto,
                        fecha: nextDayStr
                    });

                    if (existingNextDayStock) {
                        continue;
                    }

                    // Calcular ventas reales para carry over preciso
                    const actualSales = calculateSalesFromOrders({
                        product: item.producto,
                        section: item.section || '',
                        weight: item.peso
                    }, ordersHoy);

                    // Stock Inicial Mañana = Stock Final Hoy
                    // We ALWAYS recalculate based on (Inicial + Llevamos - Sales) to ensure 
                    // any updates to the previous day's orders are reflected.
                    let stockInicialManana = (item.stockInicial || 0) + (item.llevamos || 0) - actualSales;

                    if (stockInicialManana < 0) stockInicialManana = 0;

                    const newStock: CreateStockData = {
                        puntoEnvio: area.puntoEnvio,
                        section: item.section,
                        producto: item.producto,
                        peso: item.peso,
                        fecha: nextDayStr,
                        stockInicial: stockInicialManana,
                        llevamos: 0,
                        pedidosDelDia: 0,
                        stockFinal: stockInicialManana
                    };

                    await stockCollection.insertOne({
                        ...newStock,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    });

                    console.log(`   ✅ Creado stock para ${item.producto} (${item.peso || '-'}) en ${nextDayStr}. Cantidad: ${stockInicialManana}`);
                }
            }
        }

        console.log('🏁 [STOCK ROLLOVER] Verificación completada.');

    } catch (error) {
        console.error('❌ [STOCK ROLLOVER] Error crítico:', error);
    }
}
