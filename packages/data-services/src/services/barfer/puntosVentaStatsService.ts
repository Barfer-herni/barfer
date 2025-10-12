'use server';

import { getCollection } from '@repo/database';

export interface PuntoVentaStats {
    _id: string;
    nombre: string;
    zona: string;
    telefono: string;
    kgTotales: number;
    frecuenciaCompra: string;
    promedioKgPorPedido: number;
    kgUltimaCompra: number;
    totalPedidos: number;
    fechaPrimerPedido?: Date;
    fechaUltimoPedido?: Date;
}

interface ProductoMayorista {
    fullName: string;
    product: string;
    weight: string;
    kilos: number;
}

/**
 * Extrae los kilos de un string de peso
 */
function extractKilosFromWeight(weight: string | null | undefined): number {
    if (!weight || typeof weight !== 'string') return 0;
    const match = weight.match(/(\d+)\s*KG/i);
    return match ? parseInt(match[1], 10) : 0;
}

/**
 * Normaliza un nombre de producto
 */
function normalizeProductName(name: string): string {
    return name.trim().toUpperCase().replace(/\s+/g, ' ');
}

/**
 * Intenta hacer match de un item con un producto mayorista oficial
 */
function matchItemToProduct(
    item: any,
    productosMayoristas: ProductoMayorista[]
): ProductoMayorista | null {
    const itemName = item.name || item.id || '';
    const normalizedItemName = normalizeProductName(itemName);

    // Match exacto con nombre completo
    let match = productosMayoristas.find(p =>
        normalizeProductName(p.fullName) === normalizedItemName
    );
    if (match) return match;

    // Match exacto solo por producto
    match = productosMayoristas.find(p =>
        normalizeProductName(p.product) === normalizedItemName
    );
    if (match) return match;

    // Match parcial
    for (const producto of productosMayoristas) {
        const productWords = producto.product.split(' ');
        const hasAllWords = productWords.every(word =>
            normalizedItemName.includes(word)
        );

        if (hasAllWords && productWords.length > 0) {
            return producto;
        }
    }

    return null;
}

/**
 * Calcula la cantidad de un item
 */
function calculateItemQuantity(item: any): number {
    let totalQuantity = 0;

    if (item.options && Array.isArray(item.options)) {
        for (const option of item.options) {
            totalQuantity += option.quantity || 0;
        }
    } else {
        totalQuantity = 1;
    }

    return totalQuantity;
}

/**
 * Calcula kilos de un item usando productos oficiales
 */
function calculateItemKilos(item: any, productosMayoristas: ProductoMayorista[]): number {
    const matchedProduct = matchItemToProduct(item, productosMayoristas);

    if (matchedProduct) {
        const quantity = calculateItemQuantity(item);
        return matchedProduct.kilos * quantity;
    }

    return 0;
}

/**
 * Calcula la frecuencia de compra desde las fechas de órdenes
 */
function calculateFrecuencia(orders: any[]): string {
    if (orders.length === 0) return 'Sin pedidos';
    if (orders.length === 1) return '1 pedido (sin frecuencia)';

    const dates = orders.map(o => new Date(o.createdAt)).sort((a, b) => a.getTime() - b.getTime());
    const firstDate = dates[0];
    const lastDate = dates[dates.length - 1];

    const daysDiff = (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24);
    const avgDaysBetweenOrders = Math.round(daysDiff / (orders.length - 1));

    if (avgDaysBetweenOrders === 0) return 'Pedidos el mismo día';
    if (avgDaysBetweenOrders === 1) return 'Cada 1 día';

    return `Cada ${avgDaysBetweenOrders} días`;
}

/**
 * Obtiene estadísticas por punto de venta usando punto_de_venta como conexión
 */
export async function getPuntosVentaStats(): Promise<{
    success: boolean;
    stats?: PuntoVentaStats[];
    error?: string;
}> {
    try {
        const pricesCollection = await getCollection('prices');
        const puntosVentaCollection = await getCollection('puntos_venta');
        const ordersCollection = await getCollection('orders');

        // 1. Obtener productos mayoristas desde prices
        console.log('📋 Cargando productos mayoristas desde prices...');
        const pricesDocs = await pricesCollection
            .find({
                priceType: 'MAYORISTA',
                isActive: true
            })
            .toArray();

        const productosMayoristasMap = new Map<string, ProductoMayorista>();

        for (const doc of pricesDocs) {
            const weight = doc.weight || '';
            const fullName = weight ? `${doc.product} ${weight}`.trim() : doc.product;
            const kilos = extractKilosFromWeight(doc.weight);
            const kilosFinales = kilos > 0 ? kilos : 1;

            if (!productosMayoristasMap.has(fullName)) {
                productosMayoristasMap.set(fullName, {
                    fullName,
                    product: doc.product,
                    weight: weight || 'UNIDAD',
                    kilos: kilosFinales
                });
            }
        }

        const productosMayoristas = Array.from(productosMayoristasMap.values());
        console.log(`✅ ${productosMayoristas.length} productos mayoristas cargados`);

        // 2. Obtener todos los puntos de venta activos
        const puntosVenta = await puntosVentaCollection
            .find({ activo: true })
            .toArray();

        console.log(`🏪 Puntos de venta activos: ${puntosVenta.length}`);

        const statsArray: PuntoVentaStats[] = [];

        for (const puntoVenta of puntosVenta) {
            const puntoVentaId = puntoVenta._id.toString();

            // Buscar órdenes mayoristas que tengan este punto_de_venta
            const ordenes = await ordersCollection
                .find({
                    orderType: 'mayorista',
                    punto_de_venta: puntoVentaId
                })
                .sort({ createdAt: 1 }) // Más antiguas primero para calcular fechas
                .toArray();

            console.log(`🏪 ${puntoVenta.nombre} (ID: ${puntoVentaId}): ${ordenes.length} órdenes`);

            if (ordenes.length === 0) {
                // Sin órdenes asociadas
                statsArray.push({
                    _id: puntoVenta._id.toString(),
                    nombre: puntoVenta.nombre,
                    zona: puntoVenta.zona,
                    telefono: puntoVenta.contacto?.telefono || 'Sin teléfono',
                    kgTotales: 0,
                    frecuenciaCompra: 'Sin pedidos',
                    promedioKgPorPedido: 0,
                    kgUltimaCompra: 0,
                    totalPedidos: 0,
                });
                continue;
            }

            // Calcular estadísticas usando productos oficiales
            let kgTotales = 0;
            const kgPorOrden: number[] = [];

            for (const orden of ordenes) {
                const kilos = orden.items?.reduce((sum: number, item: any) =>
                    sum + calculateItemKilos(item, productosMayoristas), 0) || 0;
                kgTotales += kilos;
                kgPorOrden.push(kilos);
                console.log(`  📦 Orden ${orden._id}: ${kilos}kg`);
            }

            const promedioKg = ordenes.length > 0 ? kgTotales / ordenes.length : 0;
            const ultimaOrden = ordenes[ordenes.length - 1];
            const kgUltimaCompra = ultimaOrden
                ? ultimaOrden.items?.reduce((sum: number, item: any) =>
                    sum + calculateItemKilos(item, productosMayoristas), 0) || 0
                : 0;

            const frecuencia = calculateFrecuencia(ordenes);
            const primerPedido = new Date(ordenes[0].createdAt);
            const ultimoPedido = new Date(ultimaOrden.createdAt);

            console.log(`  ✅ ${puntoVenta.nombre}: ${kgTotales}kg totales, ${Math.round(promedioKg)}kg promedio`);

            statsArray.push({
                _id: puntoVenta._id.toString(),
                nombre: puntoVenta.nombre,
                zona: puntoVenta.zona,
                telefono: puntoVenta.contacto?.telefono || 'Sin teléfono',
                kgTotales: Math.round(kgTotales),
                frecuenciaCompra: frecuencia,
                promedioKgPorPedido: Math.round(promedioKg),
                kgUltimaCompra: Math.round(kgUltimaCompra),
                totalPedidos: ordenes.length,
                fechaPrimerPedido: primerPedido,
                fechaUltimoPedido: ultimoPedido,
            });
        }

        // Ordenar por kgTotales descendente
        statsArray.sort((a, b) => b.kgTotales - a.kgTotales);

        console.log(`✅ Estadísticas generadas para ${statsArray.length} puntos de venta`);

        return {
            success: true,
            stats: statsArray,
        };
    } catch (error) {
        console.error('❌ Error al obtener estadísticas de puntos de venta:', error);
        return {
            success: false,
            error: (error as Error).message,
        };
    }
}

