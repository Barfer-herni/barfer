import { getCollection } from '@repo/database';

export interface ProductoMatrixData {
    puntoVentaId: string;
    puntoVentaNombre: string;
    zona: string;
    productos: {
        [productName: string]: number; // nombre del producto -> kilos totales o cantidad (para productos en gramos)
    };
    totalKilos: number; // Total de kilos (solo productos en KG, no incluye cantidades de productos en gramos)
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
 * - "HIGADO 100GRS" en sección "RAW" -> "RAW - HIGADO 100GRS" (se mantiene separado por peso)
 */
function generateGroupKey(product: string, section: string): string {
    let normalizedProduct = product.trim().toUpperCase();
    const normalizedSection = section.trim().toUpperCase();

    // Para productos RAW, agrupar por nombre base eliminando sufijos de cantidad
    if (normalizedSection === 'RAW') {
        // Normalizar espacios y caracteres especiales
        normalizedProduct = normalizedProduct.replace(/\s+/g, ' ').trim();

        // Solo agrupar OREJAS (X1, X50, X100 son el mismo producto)
        // Otros productos RAW mantienen sus diferencias de peso/cantidad
        if (normalizedProduct.includes('OREJA')) {
            // Para orejas, eliminar sufijos de cantidad y normalizar
            const baseProduct = normalizedProduct
                .replace(/\s*X\d+\s*$/i, '')           // X1, X50, X100 al final
                .replace(/\s*\d+\s*$/i, '')            // Números solos al final
                .trim();

            // Normalizar nombres comunes de productos RAW
            const normalizedBaseProduct = normalizeRawProductName(baseProduct);

            console.log(`    🔧 RAW producto (OREJA agrupado): "${product}" -> "${normalizedSection} - ${normalizedBaseProduct}"`);
            return `${normalizedSection} - ${normalizedBaseProduct}`;
        } else {
            // Para otros productos RAW, mantener el nombre completo con peso/cantidad
            console.log(`    🔧 RAW producto (mantenido separado): "${product}" -> "${normalizedSection} - ${normalizedProduct}"`);
            return `${normalizedSection} - ${normalizedProduct}`;
        }
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
        'PATA': 'PATA',
        'PATAS': 'PATA'
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

    // Si el item tiene opciones, intentar match por opción PRIMERO (especialmente para RAW)
    if (item.options && Array.isArray(item.options)) {
        for (const option of item.options) {
            const optionName = option.name || '';
            if (!optionName) continue;

            const normalizedOption = normalizeProductName(optionName);

            // Para productos RAW, construir el nombre completo con el peso de la opción
            if (detectedSection === 'RAW') {
                const fullItemName = `${normalizedItemName} ${normalizedOption}`;
                console.log(`      🔧 Construyendo nombre completo RAW: "${itemName}" + "${optionName}" = "${fullItemName}"`);

                // Buscar match exacto con el nombre completo construido
                match = productosFiltrados.find(p =>
                    normalizeProductName(p.fullName) === fullItemName
                );

                if (match) {
                    console.log(`      ✅ Match RAW por nombre completo: ${match.fullName}`);
                    return match;
                }
            } else {
                // Para otros productos, match por peso en la opción
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
    }

    // Intentar match exacto solo por nombre de producto (sin peso) - SOLO si no se encontró por opciones
    match = productosFiltrados.find(p =>
        normalizeProductName(p.product) === normalizedItemName
    );

    if (match) {
        console.log(`      ✅ Match por producto: ${match.fullName}`);
        return match;
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
 * - Para productos en gramos (GRS): devuelve la cantidad directamente sin convertir a kilos
 * - Para productos RAW (sin peso en KG): cuenta unidades considerando multiplicadores X1, X50, X100
 */
function calculateItemQuantity(item: any, producto: ProductoMayorista): number {
    let total = 0;

    // Detectar si el producto está en gramos por su nombre
    const isProductInGrams = item.name && item.name.toUpperCase().includes('GRS');

    // Si tiene opciones, procesar cada una
    if (item.options && Array.isArray(item.options)) {
        for (const option of item.options) {
            const quantity = option.quantity || 0;
            const optionName = option.name || '';

            // Verificar si es un producto en gramos (por opción o por nombre del producto)
            if (optionName.toUpperCase().includes('GRS') || isProductInGrams) {
                // Para productos en gramos, devolver la cantidad directamente
                total += quantity;
            } else {
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
        }
    } else {
        // Si no tiene opciones, usar el peso del producto con su multiplicador
        const unitMultiplier = extractUnitMultiplier(producto.weight);
        total += producto.kilos * unitMultiplier;
    }

    return total;
}

/**
 * Obtiene la matriz de productos comprados por cada punto de venta usando agregación MongoDB
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
        console.log('🔍 Iniciando cálculo de matriz de productos con agregación MongoDB...');

        const puntosVentaCollection = await getCollection('puntos_venta');
        const ordersCollection = await getCollection('orders');

        // 1. Obtener todos los puntos de venta activos
        const puntosVenta = await puntosVentaCollection
            .find({ activo: true })
            .toArray();

        console.log(`📍 ${puntosVenta.length} puntos de venta encontrados`);

        if (puntosVenta.length === 0) {
            return {
                success: true,
                matrix: [],
                productNames: [],
            };
        }

        const matrix: ProductoMatrixData[] = [];
        const allProductNames = new Set<string>();

        // 2. Para cada punto de venta, usar agregación para calcular productos
        for (const puntoVenta of puntosVenta) {
            console.log(`\n📦 Procesando: ${puntoVenta.nombre} (ID: ${puntoVenta._id})`);

            const puntoVentaId = puntoVenta._id.toString();

            // Construir pipeline de agregación basado en tu ejemplo
            const pipeline: any[] = [
                {
                    $match: {
                        punto_de_venta: puntoVentaId,
                        orderType: 'mayorista',
                        status: { $in: ['pending', 'confirmed', 'delivered'] }
                    }
                },
                { $unwind: "$items" },
                { $unwind: "$items.options" },
                {
                    $addFields: {
                        valorNumerico: {
                            $toDouble: {
                                $getField: {
                                    field: "match",
                                    input: {
                                        $arrayElemAt: [
                                            { $regexFindAll: { input: "$items.options.name", regex: /[0-9]+/ } },
                                            0
                                        ]
                                    }
                                }
                            }
                        }
                    }
                },
                {
                    $addFields: {
                        kilosPorUnidad: {
                            $switch: {
                                branches: [
                                    {
                                        case: { $regexMatch: { input: "$items.options.name", regex: /KG/i } },
                                        then: "$valorNumerico"
                                    },
                                    {
                                        case: { $regexMatch: { input: "$items.options.name", regex: /GRS/i } },
                                        then: 1 // Para productos en gramos por opción, usar 1 para mantener la cantidad original
                                    },
                                    {
                                        case: { $regexMatch: { input: "$items.name", regex: /GRS/i } },
                                        then: 1 // Para productos en gramos por nombre del producto, usar 1 para mantener la cantidad original
                                    }
                                ],
                                default: 0
                            }
                        }
                    }
                },
                {
                    $addFields: {
                        totalQuantityItem: { $multiply: ["$kilosPorUnidad", "$items.options.quantity"] }
                    }
                },
                {
                    $group: {
                        _id: {
                            producto: "$items.name",
                            presentacion: "$items.options.name"
                        },
                        totalQuantity: { $sum: "$totalQuantityItem" }
                    }
                },
                {
                    $match: { totalQuantity: { $gt: 0 } }
                },
                { $sort: { "_id.producto": 1, "_id.presentacion": 1 } }
            ];

            // Agregar filtro de fecha si se proporciona
            if (from || to) {
                const dateFilter: any = {};
                if (from) {
                    // Crear fecha desde string sin manipulación de zona horaria
                    const [year, month, day] = from.split('-').map(Number);
                    const fromDateObj = new Date(year, month - 1, day, 0, 0, 0, 0);
                    dateFilter.$gte = fromDateObj;
                }
                if (to) {
                    // Crear fecha desde string sin manipulación de zona horaria
                    const [year, month, day] = to.split('-').map(Number);
                    const toDateObj = new Date(year, month - 1, day, 23, 59, 59, 999);
                    dateFilter.$lte = toDateObj;
                }
                pipeline[0].$match.deliveryDay = dateFilter;
            }

            const productosResult = await ordersCollection.aggregate(pipeline).toArray();

            console.log(`  📊 ${productosResult.length} productos únicos encontrados para ${puntoVenta.nombre}`);

            const productosMap: { [key: string]: number } = {};
            let totalKilos = 0;

            // Procesar resultados y aplicar agrupación especial para orejas
            for (const producto of productosResult) {
                const productoName = producto._id.producto;
                const presentacion = producto._id.presentacion;
                const quantity = producto.totalQuantity;

                // Crear clave de agrupación
                let groupKey: string;

                // Detectar si es producto RAW
                const isRaw = presentacion.match(/\d+\s*GRS?/i) || presentacion.match(/X\d+/i);

                if (isRaw && productoName.toUpperCase().includes('OREJA')) {
                    // Agrupar todas las orejas en una sola columna
                    groupKey = `RAW - OREJA`;
                } else if (isRaw) {
                    // Otros productos RAW mantienen su presentación
                    groupKey = `RAW - ${productoName.toUpperCase()} ${presentacion.toUpperCase()}`;
                } else {
                    // Productos no RAW mantienen su nombre original
                    groupKey = `${productoName.toUpperCase()}`;
                }

                // Acumular cantidad (kilos para productos en KG, cantidad para productos en gramos)
                productosMap[groupKey] = (productosMap[groupKey] || 0) + quantity;

                // Solo sumar al total de kilos si NO es un producto en gramos
                const isGrams = presentacion.match(/\d+\s*GRS?/i) || productoName.match(/\d+\s*GRS?/i);
                if (!isGrams) {
                    totalKilos += quantity;
                }

                allProductNames.add(groupKey);

                console.log(`    ✅ ${productoName} ${presentacion} → ${groupKey} (${quantity}${isGrams ? ' unidades' : 'kg'})`);
            }

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

        // Convertir Set a Array y ordenar
        const productNames = Array.from(allProductNames).sort();

        console.log(`\n✅ Matriz completada: ${matrix.length} puntos de venta, ${productNames.length} productos únicos`);

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

