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
    groupKey: string; // "PERRO - POLLO" (para agrupar sin peso)
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
 * Genera una clave de agrupación para un producto basada en sección y sabor
 * Ejemplos:
 * - "POLLO" en sección "PERRO" -> "PERRO - POLLO"
 * - "BIG DOG VACA" en sección "PERRO" -> "PERRO - BIG DOG VACA"
 * - "GARRAS DE POLLO" en sección "OTROS" -> "OTROS - GARRAS DE POLLO"
 * - "OREJA X1" en sección "RAW" -> "RAW - OREJA" (se agrupa por nombre base)
 * - "OREJA X50" en sección "RAW" -> "RAW - OREJA" (se agrupa por nombre base)
 * - "HIGADO 100GRS" en sección "RAW" -> "RAW - HIGADO" (se agrupa por nombre base)
 */
function generateGroupKey(product: string, section: string): string {
    let normalizedProduct = product.trim().toUpperCase();
    const normalizedSection = section.trim().toUpperCase();

    // Para productos RAW, agrupar por nombre base eliminando sufijos de cantidad
    if (normalizedSection === 'RAW') {
        // Normalizar espacios y caracteres especiales
        normalizedProduct = normalizedProduct.replace(/\s+/g, ' ').trim();

        // Eliminar sufijos de cantidad como X1, X50, X100, 100GRS, KG, etc.
        // Patrones a eliminar:
        // - X seguido de números (X1, X50, X100)
        // - Números seguidos de GRS/GR/GRAMOS
        // - Números seguidos de KG/KILO/KILOS
        // - Números seguidos de UND/UNIDAD/UNIDADES
        // - Números solos al final (ej: "OREJA 1" -> "OREJA")
        const baseProduct = normalizedProduct
            .replace(/\s*X\d+\s*$/i, '')           // X1, X50, X100 al final
            .replace(/\s*\d+\s*(GRS?|GRAMOS?)\s*$/i, '') // 100GRS, 500GR al final
            .replace(/\s*\d+\s*(KG|KILOS?)\s*$/i, '')    // 1KG, 2KILOS al final
            .replace(/\s*\d+\s*(UND|UNIDADES?)\s*$/i, '') // 1UND, 10UNIDADES al final
            .replace(/\s*\d+\s*$/i, '')            // Números solos al final (ej: "OREJA 1")
            .trim();

        // Normalizar nombres comunes de productos RAW
        const normalizedBaseProduct = normalizeRawProductName(baseProduct);

        console.log(`    🔧 RAW producto (agrupado): "${product}" -> "${normalizedSection} - ${normalizedBaseProduct}"`);
        return `${normalizedSection} - ${normalizedBaseProduct}`;
    }

    // Para productos que ya tienen identificadores especiales, mantenerlos
    if (normalizedProduct.includes('BIG DOG')) {
        return `${normalizedSection} - ${normalizedProduct}`;
    }

    // Para otros productos (PERRO, GATO, OTROS), usar el nombre procesado
    return `${normalizedSection} - ${normalizedProduct}`;
}

/**
 * Normaliza nombres comunes de productos RAW para unificar variaciones
 * Ejemplos:
 * - "OREJA", "OREJAS" -> "OREJA"
 * - "HIGADO", "HIGADOS" -> "HIGADO"
 * - "CORAZON", "CORAZONES" -> "CORAZON"
 */
function normalizeRawProductName(productName: string): string {
    const normalized = productName.trim().toUpperCase();

    // Mapeo de variaciones comunes
    const variations: { [key: string]: string } = {
        'OREJAS': 'OREJA',
        'HIGADOS': 'HIGADO',
        'CORAZONES': 'CORAZON',
        'RINONES': 'RINON',
        'MOLLEJAS': 'MOLLEJA',
        'LENGUAS': 'LENGUA',
        'PULMONES': 'PULMON',
        'BOCADOS': 'BOCADO',
        'PATA': 'PATAS',
        'PATAS': 'PATAS'
    };

    return variations[normalized] || normalized;
}

/**
 * Determina si un producto debe contar para el total de kilos
 * Solo cuentan: PERRO (sabores), BIG DOG, GATO, HUESOS CARNOSOS
 * No cuentan: complementos (garras, cornalitos, caldo, huesos recreativos, etc.)
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

    // Si tienen el mismo orden de sabor, ordenar alfabéticamente por groupKey
    return a.groupKey.localeCompare(b.groupKey);
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

    console.log(`      🔍 Buscando match para: "${itemName}" (opciones: ${JSON.stringify(item.options)})`);

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

    if (detectedSection) {
        console.log(`      🏷️  Sección detectada: ${detectedSection}`);
    }

    // Filtrar productos por sección si se detectó una
    const productosFiltrados = detectedSection
        ? productosMayoristas.filter(p => p.section === detectedSection)
        : productosMayoristas;

    console.log(`      📦 Buscando en ${productosFiltrados.length} productos (sección: ${detectedSection || 'todas'})`);

    // Intentar match exacto primero (nombre completo con peso)
    let match = productosFiltrados.find(p =>
        normalizeProductName(p.fullName) === normalizedItemName
    );

    if (match) {
        console.log(`      ✅ Match exacto: ${match.fullName}`);
        return match;
    }

    // Intentar match exacto solo por nombre de producto (sin peso)
    match = productosFiltrados.find(p =>
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
            match = productosFiltrados.find(p =>
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
    for (const producto of productosFiltrados) {
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

    // Match especial para BOX PERRO/GATO: extraer el sabor del nombre
    // Ej: "BOX PERRO POLLO" -> buscar producto "POLLO" en sección "PERRO"
    if (detectedSection === 'PERRO' || detectedSection === 'GATO') {
        // Remover "BOX PERRO " o "BOX GATO " del nombre para obtener el sabor
        const prefix = detectedSection === 'PERRO' ? 'BOX PERRO ' : 'BOX GATO ';
        const sabor = normalizedItemName.replace(prefix, '').trim();

        // Buscar el producto que coincida con el sabor en la sección correcta
        match = productosFiltrados.find(p =>
            normalizeProductName(p.product) === sabor
        );

        if (match) {
            console.log(`      ✅ Match BOX especial: "${itemName}" -> "${match.fullName}" (sección: ${match.section})`);
            return match;
        }
    }

    // Último intento: match parcial solo por producto (sin requerir peso)
    for (const producto of productosFiltrados) {
        const productWords = producto.product.split(' ');

        const hasAllWords = productWords.every(word =>
            normalizedItemName.includes(word)
        );

        if (hasAllWords && productWords.length > 0) {
            console.log(`      ✅ Match flexible: "${itemName}" -> "${producto.fullName}" (sección: ${producto.section})`);
            return producto;
        }
    }

    console.log(`      ❌ Sin match para: "${itemName}"`);
    return null;
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
 * Calcula cuántos kilos o unidades hay en un item de orden
 * - Para productos con peso en KG: extrae el peso de las opciones y lo multiplica por la cantidad
 * - Para productos RAW (sin peso en KG): cuenta unidades considerando multiplicadores X1, X50, X100
 */
function calculateItemQuantity(item: any, producto: ProductoMayorista): number {
    let total = 0;

    // Si tiene opciones, procesar cada una
    if (item.options && Array.isArray(item.options)) {
        for (const option of item.options) {
            const quantity = option.quantity || 0;
            const optionName = option.name || '';

            // Intentar extraer kilos del nombre de la opción (ej: "5KG", "10KG")
            const kilosFromOption = extractKilosFromWeight(optionName);

            if (kilosFromOption > 0) {
                // Si la opción tiene peso en KG, usar ese peso
                total += kilosFromOption * quantity;
            } else {
                // Para productos RAW, buscar multiplicador (X1, X50, X100) en el weight del producto
                const unitMultiplier = extractUnitMultiplier(producto.weight);
                // El peso del producto será 1 si no tiene peso definido
                total += producto.kilos * quantity * unitMultiplier;
            }
        }
    } else {
        // Si no tiene opciones, usar el peso del producto con su multiplicador
        const unitMultiplier = extractUnitMultiplier(producto.weight);
        total += producto.kilos * unitMultiplier;
    }

    return total;
}

/**
 * Obtiene la matriz de productos comprados por cada punto de venta
 * @param from - Fecha inicial (opcional)
 * @param to - Fecha final (opcional)
 */
export async function getProductosMatrix(from?: string, to?: string): Promise<{
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

            const section = doc.section || 'OTROS';
            const groupKey = generateGroupKey(doc.product, section);

            // Usar groupKey como clave del mapa para agrupar productos sin importar peso
            if (!productosMayoristasMap.has(groupKey)) {
                productosMayoristasMap.set(groupKey, {
                    fullName,
                    product: doc.product,
                    weight: weight || 'UNIDAD',
                    kilos: kilosFinales,
                    section,
                    groupKey
                });
                console.log(`  ✅ Producto agregado: ${groupKey} (base: ${fullName}, section: ${section})`);
            } else {
                console.log(`  ⏭️  Producto ya existe, omitiendo: ${fullName} -> ${groupKey}`);
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
                productNames: sortedProducts.map(p => p.groupKey),
            };
        }

        const matrix: ProductoMatrixData[] = [];

        // 3. Para cada punto de venta, calcular sus compras por producto
        for (const puntoVenta of puntosVenta) {
            console.log(`\n📦 Procesando: ${puntoVenta.nombre} (ID: ${puntoVenta._id})`);

            // Buscar órdenes de este punto de venta (por _id)
            const puntoVentaId = puntoVenta._id.toString();

            // Construir query con filtro de fecha opcional
            const query: any = {
                orderType: 'mayorista',
                punto_de_venta: puntoVentaId,
                status: { $in: ['pending', 'confirmed', 'delivered'] }
            };

            // Agregar filtro de fecha si se proporciona
            if (from || to) {
                query.createdAt = {};
                if (from) {
                    query.createdAt.$gte = new Date(from);
                }
                if (to) {
                    // Agregar un día para incluir todo el día 'to'
                    const toDate = new Date(to);
                    toDate.setDate(toDate.getDate() + 1);
                    query.createdAt.$lt = toDate;
                }
            }

            const orders = await ordersCollection
                .find(query)
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
                        // calculateItemQuantity ahora retorna kilos totales directamente
                        const kilos = calculateItemQuantity(item, matchedProduct);

                        console.log(`    🔢 Cálculo detallado:`);
                        console.log(`       - Producto matched: ${matchedProduct.fullName} (groupKey: ${matchedProduct.groupKey})`);
                        console.log(`       - Opciones del item:`, item.options);
                        console.log(`       - Kilos calculados: ${kilos}kg`);
                        console.log(`       - Acumulado anterior en ${matchedProduct.groupKey}: ${productosMap[matchedProduct.groupKey] || 0}kg`);

                        // Usar groupKey para agrupar todos los pesos del mismo sabor
                        productosMap[matchedProduct.groupKey] =
                            (productosMap[matchedProduct.groupKey] || 0) + kilos;

                        console.log(`       - Nuevo acumulado en ${matchedProduct.groupKey}: ${productosMap[matchedProduct.groupKey]}kg`);

                        // Solo sumar al total si el producto debe contar
                        if (shouldCountInTotal(matchedProduct)) {
                            totalKilos += kilos;
                            console.log(`    ✅ Match: "${item.name}" -> "${matchedProduct.groupKey}" (${kilos}kg - CUENTA EN TOTAL)`);
                        } else {
                            console.log(`    ✅ Match: "${item.name}" -> "${matchedProduct.groupKey}" (${kilos}kg - NO cuenta en total)`);
                        }

                        matchedItems++;
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
        const productNames = sortedProducts.map(p => p.groupKey);

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

