import { getCollection } from '@repo/database';

export interface ProductoMatrixData {
    puntoVentaId: string;
    puntoVentaNombre: string;
    zona: string;
    productos: {
        [productName: string]: number; // nombre del producto -> kilos totales
    };
    totalKilos: number;
}

interface ProductoMayorista {
    fullName: string; // "BIG DOG VACA 15KG"
    product: string;  // "BIG DOG VACA"
    weight: string;   // "15KG"
    kilos: number;    // 15
    section: string;  // "PERRO", "GATO", "RAW", etc.
}

/**
 * Extrae los kilos de un string de peso
 * Ej: "15KG" -> 15, "10 KG" -> 10
 */
function extractKilosFromWeight(weight: string | null | undefined): number {
    if (!weight || typeof weight !== 'string') return 0;
    const match = weight.match(/(\d+)\s*KG/i);
    return match ? parseInt(match[1], 10) : 0;
}

/**
 * Normaliza un nombre de producto para hacer matching
 * Remueve espacios extras, convierte a mayúsculas
 */
function normalizeProductName(name: string): string {
    return name.trim().toUpperCase().replace(/\s+/g, ' ');
}

/**
 * Función de ordenamiento personalizado para productos de matriz
 * Orden: 
 * 1. PERRO (sabores): pollo, cerdo, vaca, cordero
 * 2. PERRO (BIG DOG): pollo, vaca
 * 3. GATO: pollo, vaca, cordero
 * 4. OTROS (huesos carnosos)
 * 5. OTROS (complementos): garras, cornalitos, caldo, huesos recreativos
 * 6. RAW: todos
 */
function sortProductsForMatrix(a: ProductoMayorista, b: ProductoMayorista): number {
    // Normalizar para comparación
    const normalizeProduct = (p: string) => p.trim().toUpperCase();
    const productA = normalizeProduct(a.product);
    const productB = normalizeProduct(b.product);
    const sectionA = normalizeProduct(a.section);
    const sectionB = normalizeProduct(b.section);

    // Definir orden de secciones principales
    const getSectionOrder = (section: string, product: string): number => {
        if (section === 'PERRO') {
            if (product.includes('BIG DOG')) return 2; // Big Dog después de perros regulares
            return 1; // Perros regulares primero
        }
        if (section === 'GATO') return 3;
        if (section === 'OTROS') {
            if (product.includes('HUESOS CARNOSOS')) return 4;
            // Complementos: garras, cornalitos, caldo, huesos recreativos
            if (product.includes('GARRAS') ||
                product.includes('CORNALITOS') ||
                product.includes('CALDO') ||
                product.includes('HUESOS RECREATIVOS') ||
                product.includes('COMPLEMENTOS')) {
                return 5;
            }
            return 4.5; // Otros productos de OTROS entre huesos carnosos y complementos
        }
        if (section === 'RAW') return 6;
        return 999; // Secciones desconocidas al final
    };

    const orderA = getSectionOrder(sectionA, productA);
    const orderB = getSectionOrder(sectionB, productB);

    if (orderA !== orderB) {
        return orderA - orderB;
    }

    // Dentro de la misma sección, ordenar por sabor/producto
    const getFlavorOrder = (product: string, section: string): number => {
        // Para PERRO regular (no BIG DOG)
        if (section === 'PERRO' && !product.includes('BIG DOG')) {
            if (product.includes('POLLO')) return 1;
            if (product.includes('CERDO')) return 2;
            if (product.includes('VACA')) return 3;
            if (product.includes('CORDERO')) return 4;
        }

        // Para BIG DOG
        if (product.includes('BIG DOG')) {
            if (product.includes('POLLO')) return 1;
            if (product.includes('VACA')) return 2;
        }

        // Para GATO
        if (section === 'GATO') {
            if (product.includes('POLLO')) return 1;
            if (product.includes('VACA')) return 2;
            if (product.includes('CORDERO')) return 3;
        }

        // Para complementos
        if (section === 'OTROS') {
            if (product.includes('GARRAS')) return 1;
            if (product.includes('CORNALITOS')) return 2;
            if (product.includes('CALDO')) return 3;
            if (product.includes('HUESOS RECREATIVOS')) return 4;
        }

        return 999; // Sin orden específico
    };

    const flavorA = getFlavorOrder(productA, sectionA);
    const flavorB = getFlavorOrder(productB, sectionB);

    if (flavorA !== flavorB) {
        return flavorA - flavorB;
    }

    // Si tienen el mismo orden de sabor, ordenar alfabéticamente
    return a.fullName.localeCompare(b.fullName);
}

/**
 * Intenta hacer match de un item de orden con un producto mayorista oficial
 */
function matchItemToProduct(
    item: any,
    productosMayoristas: ProductoMayorista[]
): ProductoMayorista | null {
    const itemName = item.name || item.id || '';
    const normalizedItemName = normalizeProductName(itemName);

    console.log(`      🔍 Buscando match para: "${itemName}"`);

    // Intentar match exacto primero (nombre completo con peso)
    let match = productosMayoristas.find(p =>
        normalizeProductName(p.fullName) === normalizedItemName
    );

    if (match) {
        console.log(`      ✅ Match exacto: ${match.fullName}`);
        return match;
    }

    // Intentar match exacto solo por nombre de producto (sin peso)
    match = productosMayoristas.find(p =>
        normalizeProductName(p.product) === normalizedItemName
    );

    if (match) {
        console.log(`      ✅ Match por producto: ${match.fullName}`);
        return match;
    }

    // Si el item tiene opciones, intentar match por opción
    if (item.options && Array.isArray(item.options)) {
        for (const option of item.options) {
            const optionName = option.name || '';
            if (!optionName) continue;

            const normalizedOption = normalizeProductName(optionName);

            // Match por peso en la opción
            match = productosMayoristas.find(p =>
                normalizeProductName(p.weight) === normalizedOption
            );

            if (match) {
                // Verificar si el nombre del item incluye el producto
                const productWords = match.product.split(' ');
                const allWordsMatch = productWords.every(word =>
                    normalizedItemName.includes(word)
                );

                if (allWordsMatch) {
                    console.log(`      ✅ Match por opción: ${match.fullName}`);
                    return match;
                }
            }
        }
    }

    // Intentar match parcial por nombre de producto y peso
    for (const producto of productosMayoristas) {
        const productWords = producto.product.split(' ');
        const weightNormalized = normalizeProductName(producto.weight);

        const hasProduct = productWords.every(word =>
            normalizedItemName.includes(word)
        );
        const hasWeight = normalizedItemName.includes(weightNormalized);

        if (hasProduct && hasWeight) {
            console.log(`      ✅ Match parcial: ${producto.fullName}`);
            return producto;
        }
    }

    // Último intento: match parcial solo por producto (sin requerir peso)
    for (const producto of productosMayoristas) {
        const productWords = producto.product.split(' ');

        const hasAllWords = productWords.every(word =>
            normalizedItemName.includes(word)
        );

        if (hasAllWords && productWords.length > 0) {
            console.log(`      ✅ Match flexible: "${itemName}" -> "${producto.fullName}"`);
            return producto;
        }
    }

    console.log(`      ❌ Sin match para: "${itemName}"`);
    return null;
}

/**
 * Calcula cuántos kilos hay en un item de orden
 */
function calculateItemQuantity(item: any, producto: ProductoMayorista): number {
    let totalQuantity = 0;

    // Si tiene opciones, sumar las cantidades
    if (item.options && Array.isArray(item.options)) {
        for (const option of item.options) {
            const quantity = option.quantity || 0;
            totalQuantity += quantity;
        }
    } else {
        // Si no tiene opciones, asumir cantidad 1
        totalQuantity = 1;
    }

    return totalQuantity;
}

/**
 * Obtiene la matriz de productos comprados por cada punto de venta
 */
export async function getProductosMatrix(): Promise<{
    success: boolean;
    matrix?: ProductoMatrixData[];
    productNames?: string[]; // Lista de todos los nombres de productos únicos
    error?: string;
}> {
    try {
        console.log('🔍 Iniciando cálculo de matriz de productos...');

        const pricesCollection = await getCollection('prices');
        const puntosVentaCollection = await getCollection('puntos_venta');
        const ordersCollection = await getCollection('orders');

        // 1. Obtener todos los productos mayoristas activos desde la tabla prices
        console.log('📋 Obteniendo productos mayoristas desde tabla prices...');
        const pricesDocs = await pricesCollection
            .find({
                priceType: 'MAYORISTA',
                isActive: true
            })
            .toArray();

        console.log(`📦 ${pricesDocs.length} registros de precios mayoristas encontrados`);

        // Crear lista de productos únicos (product + weight)
        const productosMayoristasMap = new Map<string, ProductoMayorista>();

        for (const doc of pricesDocs) {
            // Si el producto no tiene peso, usar solo el nombre
            const weight = doc.weight || '';
            const fullName = weight ? `${doc.product} ${weight}`.trim() : doc.product;
            const kilos = extractKilosFromWeight(doc.weight);

            // Si no tiene kilos (weight es null o no válido), usar 1kg por defecto
            const kilosFinales = kilos > 0 ? kilos : 1;

            if (!productosMayoristasMap.has(fullName)) {
                productosMayoristasMap.set(fullName, {
                    fullName,
                    product: doc.product,
                    weight: weight || 'UNIDAD',
                    kilos: kilosFinales,
                    section: doc.section || 'OTROS'
                });
                console.log(`  🔹 Producto: ${fullName} (${kilosFinales}kg${weight ? '' : ' - SIN PESO, usando 1kg'})`);
            }
        }

        const productosMayoristas = Array.from(productosMayoristasMap.values());
        console.log(`✅ ${productosMayoristas.length} productos únicos encontrados`);

        if (productosMayoristas.length === 0) {
            return {
                success: true,
                matrix: [],
                productNames: [],
            };
        }

        // 2. Obtener todos los puntos de venta activos
        const puntosVenta = await puntosVentaCollection
            .find({ activo: true })
            .toArray();

        console.log(`📍 ${puntosVenta.length} puntos de venta encontrados`);

        if (puntosVenta.length === 0) {
            const sortedProducts = productosMayoristas.sort(sortProductsForMatrix);
            return {
                success: true,
                matrix: [],
                productNames: sortedProducts.map(p => p.fullName),
            };
        }

        const matrix: ProductoMatrixData[] = [];

        // 3. Para cada punto de venta, calcular sus compras por producto
        for (const puntoVenta of puntosVenta) {
            console.log(`\n📦 Procesando: ${puntoVenta.nombre} (ID: ${puntoVenta._id})`);

            // Buscar órdenes de este punto de venta (por _id)
            const puntoVentaId = puntoVenta._id.toString();
            const orders = await ordersCollection
                .find({
                    orderType: 'mayorista',
                    punto_de_venta: puntoVentaId,
                    status: { $in: ['pending', 'confirmed', 'delivered'] }
                })
                .toArray();

            console.log(`  📊 ${orders.length} órdenes encontradas para punto_de_venta: ${puntoVentaId}`);

            if (orders.length > 0) {
                console.log(`  📋 IDs de órdenes: ${orders.map(o => o._id).join(', ')}`);
            }

            const productosMap: { [key: string]: number } = {};
            let totalKilos = 0;
            let matchedItems = 0;
            let unmatchedItems = 0;

            // 4. Procesar cada orden
            for (const order of orders) {
                if (!order.items || !Array.isArray(order.items)) continue;

                console.log(`    📦 Orden ${order._id} - ${order.items.length} items`);

                for (const item of order.items) {
                    console.log(`    📝 Item: ${JSON.stringify({ name: item.name, id: item.id, options: item.options })}`);

                    // Intentar hacer match con un producto oficial
                    const matchedProduct = matchItemToProduct(item, productosMayoristas);

                    if (matchedProduct) {
                        const quantity = calculateItemQuantity(item, matchedProduct);
                        const kilos = matchedProduct.kilos * quantity;

                        productosMap[matchedProduct.fullName] =
                            (productosMap[matchedProduct.fullName] || 0) + kilos;

                        totalKilos += kilos;
                        matchedItems++;

                        console.log(`    ✅ Match: "${item.name}" -> "${matchedProduct.fullName}" (${quantity} × ${matchedProduct.kilos}kg = ${kilos}kg)`);
                    } else {
                        unmatchedItems++;
                        console.log(`    ⚠️  Sin match: "${item.name}"`);
                    }
                }
            }

            console.log(`  ✅ Total kilos: ${totalKilos}`);
            console.log(`  ✅ Items matched: ${matchedItems}, sin match: ${unmatchedItems}`);
            console.log(`  📦 Productos distintos: ${Object.keys(productosMap).length}`);

            matrix.push({
                puntoVentaId,
                puntoVentaNombre: puntoVenta.nombre,
                zona: puntoVenta.zona || 'N/A',
                productos: productosMap,
                totalKilos,
            });
        }

        // Ordenar por total de kilos descendente
        matrix.sort((a, b) => b.totalKilos - a.totalKilos);

        // Ordenar productos según el criterio personalizado
        const sortedProducts = productosMayoristas.sort(sortProductsForMatrix);
        const productNames = sortedProducts.map(p => p.fullName);

        console.log(`\n✅ Matriz completada: ${matrix.length} puntos de venta, ${productNames.length} productos`);

        return {
            success: true,
            matrix,
            productNames,
        };
    } catch (error) {
        console.error('❌ Error al calcular matriz de productos:', error);
        return {
            success: false,
            error: 'Error al calcular la matriz de productos',
        };
    }
}

