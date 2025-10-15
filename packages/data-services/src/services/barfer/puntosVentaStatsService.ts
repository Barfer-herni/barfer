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
    section: string;
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
 * Extrae el multiplicador de unidades de un string
 * Ej: "X1" -> 1, "X50" -> 50, "X100" -> 100
 */
function extractUnitMultiplier(text: string | null | undefined): number {
    if (!text || typeof text !== 'string') return 1;
    const match = text.match(/X(\d+)/i);
    return match ? parseInt(match[1], 10) : 1;
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

    // Detectar la sección del item basándose en su nombre y opciones PRIMERO
    const detectSection = (name: string, options: any[]): string | null => {
        const normalized = name.toUpperCase();

        // Detección por nombre
        if (normalized.includes('BOX GATO') || normalized.includes('GATO')) return 'GATO';
        if (normalized.includes('BOX PERRO') || normalized.includes('PERRO')) return 'PERRO';
        if (normalized.includes('BIG DOG')) return 'PERRO';

        // Si tiene opciones con pesos en gramos (40GRS, 100GRS, 30GRS) o unidades (X1, X50), es RAW
        if (options && Array.isArray(options)) {
            for (const option of options) {
                const optionName = (option.name || '').toUpperCase();
                if (optionName.match(/\d+\s*GRS?/i) || optionName.match(/X\d+/i)) {
                    return 'RAW';
                }
            }
        }

        return null;
    };

    const detectedSection = detectSection(itemName, item.options || []);

    // Filtrar productos por sección si se detectó una
    const productosFiltrados = detectedSection
        ? productosMayoristas.filter(p => p.section === detectedSection)
        : productosMayoristas;

    // Match exacto con nombre completo
    let match = productosFiltrados.find(p =>
        normalizeProductName(p.fullName) === normalizedItemName
    );
    if (match) return match;

    // Match exacto solo por producto
    match = productosFiltrados.find(p =>
        normalizeProductName(p.product) === normalizedItemName
    );
    if (match) return match;

    // Match especial para BOX PERRO/GATO: extraer el sabor del nombre
    // Ej: "BOX PERRO POLLO" -> buscar producto "POLLO" en sección "PERRO"
    if (detectedSection === 'PERRO' || detectedSection === 'GATO') {
        // Remover "BOX PERRO " o "BOX GATO " del nombre para obtener el sabor
        const prefix = detectedSection === 'PERRO' ? 'BOX PERRO ' : 'BOX GATO ';
        const sabor = normalizedItemName.replace(prefix, '').trim();

        console.log(`        🎯 BOX Match: item="${itemName}", sección="${detectedSection}", sabor="${sabor}"`);
        console.log(`        📦 Buscando en ${productosFiltrados.length} productos de ${detectedSection}`);

        // Buscar el producto que coincida con el sabor en la sección correcta
        match = productosFiltrados.find(p =>
            normalizeProductName(p.product) === sabor
        );
        if (match) {
            console.log(`        ✅ Match encontrado: ${match.fullName} (section: ${match.section})`);
            return match;
        } else {
            console.log(`        ❌ NO match para sabor "${sabor}"`);
            console.log(`        Productos disponibles:`, productosFiltrados.map(p => `"${p.product}"`).slice(0, 5));
        }
    }

    // Match parcial
    for (const producto of productosFiltrados) {
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
 * Determina si un producto debe contar para el total de kilos
 * Solo cuentan: PERRO (sabores), BIG DOG, GATO, HUESOS CARNOSOS
 * No cuentan: complementos (garras, cornalitos, caldo, huesos recreativos, etc.) ni RAW
 */
function shouldCountInTotal(product: ProductoMayorista): boolean {
    const normalizedProduct = product.product.trim().toUpperCase();
    const normalizedSection = product.section.trim().toUpperCase();

    // PERRO y GATO siempre cuentan (incluye BIG DOG)
    if (normalizedSection === 'PERRO' || normalizedSection === 'GATO') {
        return true;
    }

    // En OTROS, solo cuentan los HUESOS CARNOSOS
    if (normalizedSection === 'OTROS') {
        return normalizedProduct.includes('HUESOS CARNOSOS');
    }

    // RAW y otros no cuentan
    return false;
}

/**
 * Calcula cuántos kilos hay en un item de orden
 * @param countInTotal - Si es true, solo cuenta productos que deben ir al total (PERRO, GATO, HUESOS CARNOSOS)
 */
function calculateItemKilos(item: any, productosMayoristas: ProductoMayorista[], countInTotal: boolean = false): number {
    const matchedProduct = matchItemToProduct(item, productosMayoristas);

    if (!matchedProduct) {
        if (countInTotal) {
            console.log(`        ❌ SIN MATCH: "${item.name}" - NO SE PUEDE CALCULAR`);
        }
        return 0;
    }

    // Calcular el total primero
    let total = 0;

    // Si tiene opciones, procesar cada una
    if (item.options && Array.isArray(item.options)) {
        for (const option of item.options) {
            const quantity = option.quantity || 0;
            const optionName = option.name || '';

            // Intentar extraer kilos de la opción (ej: "5KG", "10KG")
            const kilosFromOption = extractKilosFromWeight(optionName);

            if (kilosFromOption > 0) {
                // Si la opción tiene kilos, usar esos
                total += kilosFromOption * quantity;
            } else {
                // Para productos RAW, buscar multiplicador (X1, X50, X100) en el weight del producto
                const unitMultiplier = extractUnitMultiplier(matchedProduct.weight);
                // El peso del producto será 1 si no tiene peso definido
                total += matchedProduct.kilos * quantity * unitMultiplier;
            }
        }
    } else {
        // Sin opciones, usar el peso del producto con su multiplicador
        const unitMultiplier = extractUnitMultiplier(matchedProduct.weight);
        total += matchedProduct.kilos * unitMultiplier;
    }

    // Si countInTotal es true, verificar si el producto debe contar
    const shouldCount = shouldCountInTotal(matchedProduct);

    if (countInTotal) {
        console.log(`        🔍 "${item.name}" -> ${matchedProduct.fullName} (${matchedProduct.section}): ${total}kg - ${shouldCount ? '✅ CUENTA' : '❌ NO CUENTA'}`);

        if (!shouldCount) {
            return 0;
        }
    }

    return total;
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
export async function getPuntosVentaStats(from?: string, to?: string): Promise<{
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
            const section = doc.section || 'OTROS';

            if (!productosMayoristasMap.has(fullName)) {
                productosMayoristasMap.set(fullName, {
                    fullName,
                    product: doc.product,
                    weight: weight || 'UNIDAD',
                    kilos: kilosFinales,
                    section
                });
            }
        }

        const productosMayoristas = Array.from(productosMayoristasMap.values());
        console.log(`✅ ${productosMayoristas.length} productos mayoristas cargados`);

        // DEBUG: Mostrar productos PERRO y GATO
        const perroProds = productosMayoristas.filter(p => p.section === 'PERRO');
        const gatoProds = productosMayoristas.filter(p => p.section === 'GATO');
        console.log(`   🐕 PERRO: ${perroProds.length} productos`);
        console.log(`   🐱 GATO: ${gatoProds.length} productos`);

        // 2. Obtener todos los puntos de venta activos
        const puntosVenta = await puntosVentaCollection
            .find({ activo: true })
            .toArray();

        console.log(`🏪 Puntos de venta activos: ${puntosVenta.length}`);

        const statsArray: PuntoVentaStats[] = [];

        for (const puntoVenta of puntosVenta) {
            const puntoVentaId = puntoVenta._id.toString();

            // Construir filtro de órdenes
            const orderFilter: any = {
                orderType: 'mayorista',
                punto_de_venta: puntoVentaId
            };

            // Si se especificó rango de fechas, filtrar
            if (from || to) {
                orderFilter.createdAt = {};

                if (from) {
                    const startDate = new Date(from);
                    startDate.setHours(0, 0, 0, 0);
                    orderFilter.createdAt.$gte = startDate;
                }

                if (to) {
                    const endDate = new Date(to);
                    endDate.setHours(23, 59, 59, 999);
                    orderFilter.createdAt.$lte = endDate;
                }

                console.log(`📅 Filtrando por rango: ${from || 'inicio'} - ${to || 'fin'}`);
            }

            // Buscar órdenes mayoristas que tengan este punto_de_venta
            const ordenes = await ordersCollection
                .find(orderFilter)
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
            // Solo contar productos que deben ir al total (PERRO, GATO, HUESOS CARNOSOS)
            let kgTotales = 0;
            const kgPorOrden: number[] = [];

            for (const orden of ordenes) {
                console.log(`  📦 Procesando orden ${orden._id} con ${orden.items?.length || 0} items`);
                if (orden.items && Array.isArray(orden.items)) {
                    console.log(`     Items: ${orden.items.map((i: any) => i.name || i.id).join(', ')}`);
                }

                const kilos = orden.items?.reduce((sum: number, item: any) =>
                    sum + calculateItemKilos(item, productosMayoristas, true), 0) || 0;
                kgTotales += kilos;
                kgPorOrden.push(kilos);
                console.log(`     Total orden: ${kilos}kg`);
            }

            const promedioKg = ordenes.length > 0 ? kgTotales / ordenes.length : 0;
            const ultimaOrden = ordenes[ordenes.length - 1];
            const kgUltimaCompra = ultimaOrden
                ? ultimaOrden.items?.reduce((sum: number, item: any) =>
                    sum + calculateItemKilos(item, productosMayoristas, true), 0) || 0
                : 0;

            const frecuencia = calculateFrecuencia(ordenes);
            const primerPedido = new Date(ordenes[0].createdAt);
            const ultimoPedido = new Date(ultimaOrden.createdAt);

            console.log(`  ✅ ${puntoVenta.nombre}:`);
            console.log(`     📊 Total órdenes: ${ordenes.length}`);
            console.log(`     📦 kg Totales: ${kgTotales}kg`);
            console.log(`     📈 kg Promedio: ${Math.round(promedioKg)}kg`);
            console.log(`     🎯 kg Última compra: ${kgUltimaCompra}kg`);

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

