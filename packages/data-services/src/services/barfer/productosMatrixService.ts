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

    // Match especial para BIG DOG: extraer el sabor de las opciones
    // Ej: "BIG DOG (15kg)" con opción "POLLO" -> buscar producto "BIG DOG POLLO"
    if (detectedSection === 'PERRO' && normalizedItemName.includes('BIG DOG')) {
        // Para BIG DOG, el sabor está en las opciones, no en el nombre del producto
        if (item.options && Array.isArray(item.options) && item.options.length > 0) {
            const sabor = item.options[0].name || '';
            const bigDogProductName = `BIG DOG ${sabor.toUpperCase()}`;

            console.log(`      🐕 BIG DOG detectado: "${itemName}" con sabor "${sabor}"`);
            console.log(`      🔍 Buscando producto: "${bigDogProductName}"`);

            // Buscar el producto BIG DOG con el sabor específico
            match = productosFiltrados.find(p =>
                normalizeProductName(p.product) === bigDogProductName.toUpperCase()
            );

            if (match) {
                console.log(`      ✅ Match BIG DOG: "${itemName}" -> "${match.fullName}" (sección: ${match.section})`);
                return match;
            } else {
                console.log(`      ❌ No se encontró producto BIG DOG para sabor: "${sabor}"`);
                console.log(`      Productos disponibles:`, productosFiltrados.map(p => `"${p.product}"`).slice(0, 5));
            }
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

    // Detectar si el producto está en gramos por su nombre o por el producto mayorista
    const isProductInGrams = (item.name && item.name.toUpperCase().includes('GRS')) ||
        (producto.fullName && producto.fullName.toUpperCase().includes('GRS'));

    // Detectar si es un producto de orejas con multiplicador (X50, X100, etc.)
    const isOrejas = (item.name && (item.name.toUpperCase().includes('OREJA') || item.name.toUpperCase().includes('OREJAS'))) ||
        (producto.fullName && (producto.fullName.toUpperCase().includes('OREJA') || producto.fullName.toUpperCase().includes('OREJAS')));

    // Extraer multiplicador de orejas del nombre del producto
    const orejasMultiplier = isOrejas ? extractUnitMultiplier(producto.product) : 1;

    // Debug: mostrar información del producto
    if (isProductInGrams) {
        console.log(`      🧮 Producto en gramos detectado: "${item.name}" -> "${producto.fullName}"`);
    }
    if (isOrejas && orejasMultiplier > 1) {
        console.log(`      🧮 Producto de orejas detectado: "${item.name}" -> "${producto.fullName}" (multiplicador: ${orejasMultiplier})`);
    }

    // Detectar si es un producto BIG DOG y extraer peso del nombre del producto
    const isBigDog = item.name && item.name.toUpperCase().includes('BIG DOG');
    const bigDogWeight = isBigDog ? extractKilosFromWeight(item.name) : 0;

    // Si tiene opciones, procesar cada una
    if (item.options && Array.isArray(item.options)) {
        for (const option of item.options) {
            const quantity = option.quantity || 0;
            const optionName = option.name || '';

            // Verificar si es un producto en gramos (por opción, nombre del item o producto mayorista)
            if (optionName.toUpperCase().includes('GRS') || isProductInGrams) {
                // Para productos en gramos, devolver la cantidad directamente
                console.log(`      🧮 Producto en gramos: opción "${optionName}" cantidad ${quantity}`);
                total += quantity;
            } else if (isBigDog && bigDogWeight > 0) {
                // Para productos BIG DOG, usar el peso extraído del nombre del producto
                total += bigDogWeight * quantity;
            } else if (isOrejas && orejasMultiplier > 1) {
                // Para productos de orejas, usar el multiplicador del nombre del producto
                console.log(`      🧮 Producto de orejas: cantidad ${quantity} x multiplicador ${orejasMultiplier} = ${quantity * orejasMultiplier}`);
                total += quantity * orejasMultiplier;
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
 * Función de ordenamiento personalizado para las columnas de la matriz
 * Orden específico solicitado:
 * 1. BIG DOG POLLO, BIG DOG VACA
 * 2. Productos de PERRO
 * 3. Productos de GATO
 * 4. HUESOS CARNOSOS 5KG
 * 5. BOX COMPLEMENTOS, GARRAS, CORNALITOS 200grs, HUESOS RECREATIVOS, CALDO DE HUESOS, CORNALITOS 30grs
 * 6. Productos RAW: HIGADO, OREJAS, POLLO, TRAQUEA
 */
function sortProductNamesForMatrix(productNames: string[]): string[] {
    return productNames.sort((a, b) => {
        const getOrderPriority = (name: string): number => {
            const upperName = name.toUpperCase();

            // 1. BIG DOG primero
            if (upperName.includes('BIG DOG POLLO')) return 1;
            if (upperName.includes('BIG DOG VACA')) return 2;

            // 2. Productos de PERRO (excluyendo BIG DOG)
            if (upperName.startsWith('PERRO ') && !upperName.includes('BIG DOG')) {
                if (upperName.includes('POLLO')) return 10;
                if (upperName.includes('CERDO')) return 11;
                if (upperName.includes('VACA')) return 12;
                if (upperName.includes('CORDERO')) return 13;
                return 14; // otros perros
            }

            // 3. Productos de GATO
            if (upperName.startsWith('GATO ')) {
                if (upperName.includes('POLLO')) return 20;
                if (upperName.includes('VACA')) return 21;
                if (upperName.includes('CORDERO')) return 22;
                return 23; // otros gatos
            }

            // 4. HUESOS CARNOSOS específico
            if (upperName.includes('HUESOS CARNOSOS 5KG')) return 30;

            // 5. Complementos y otros productos
            if (upperName.includes('BOX COMPLEMENTOS')) return 40;
            if (upperName.includes('GARRAS')) return 41;
            if (upperName.includes('CORNALITOS 200GRS')) return 42;
            if (upperName.includes('HUESOS RECREATIVOS')) return 43;
            if (upperName.includes('CALDO DE HUESOS')) return 44;
            if (upperName.includes('CORNALITOS 30GRS')) return 45;

            // 6. Productos RAW
            if (upperName.startsWith('RAW -')) {
                if (upperName.includes('HIGADO 100GRS')) return 50;
                if (upperName.includes('HIGADO 40GRS')) return 51;
                if (upperName.includes('OREJAS')) return 52;
                if (upperName.includes('POLLO 100GRS')) return 53;
                if (upperName.includes('POLLO 40GRS')) return 54;
                if (upperName.includes('TRAQUEA X1')) return 55;
                if (upperName.includes('TRAQUEA X2')) return 56;
                return 57; // otros RAW
            }

            // 7. Todo lo demás al final
            return 999;
        };

        const orderA = getOrderPriority(a);
        const orderB = getOrderPriority(b);

        if (orderA !== orderB) {
            return orderA - orderB;
        }

        // Si tienen la misma prioridad, ordenar alfabéticamente
        return a.localeCompare(b);
    });
}

/**
 * Genera la matriz completa de productos con datos por punto de venta
 */
async function generateProductMatrix(productNames: string[], fromDate?: Date, toDate?: Date): Promise<ProductoMatrixData[]> {
    try {
        const puntosVentaCollection = await getCollection('puntos_venta');
        const ordersCollection = await getCollection('orders');
        const pricesCollection = await getCollection('prices');

        // 1. Obtener productos mayoristas desde prices para matching
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
                    section,
                    groupKey: generateGroupKey(doc.product, section)
                });
            }
        }

        const productosMayoristas = Array.from(productosMayoristasMap.values());
        console.log(`✅ ${productosMayoristas.length} productos mayoristas cargados`);

        // 2. Obtener todos los puntos de venta
        const puntosVenta = await puntosVentaCollection.find({}).toArray();
        console.log(`🏪 ${puntosVenta.length} puntos de venta encontrados`);

        // 3. Generar la matriz
        const matrix: ProductoMatrixData[] = [];

        for (const puntoVenta of puntosVenta) {
            const puntoVentaId = puntoVenta._id.toString();

            // Construir filtro de fechas
            const dateFilter: any = {
                punto_de_venta: puntoVentaId,
                orderType: 'mayorista'
            };

            // Si se proporcionaron fechas específicas, usarlas
            if (fromDate || toDate) {
                dateFilter.deliveryDay = {};

                if (fromDate) {
                    // Inicio del día desde
                    const startDate = new Date(fromDate);
                    startDate.setHours(0, 0, 0, 0);
                    dateFilter.deliveryDay.$gte = startDate;
                }

                if (toDate) {
                    // Fin del día hasta
                    const endDate = new Date(toDate);
                    endDate.setHours(23, 59, 59, 999);
                    dateFilter.deliveryDay.$lte = endDate;
                }
            }

            const ordenes = await ordersCollection.find(dateFilter).toArray();

            console.log(`🏪 ${puntoVenta.nombre} (ID: ${puntoVentaId}): ${ordenes.length} órdenes`);

            // Inicializar datos del punto de venta
            const puntoVentaData: ProductoMatrixData = {
                puntoVentaId,
                puntoVentaNombre: puntoVenta.nombre,
                zona: puntoVenta.zona || 'Sin zona',
                productos: {},
                totalKilos: 0
            };

            // Inicializar todos los productos en 0
            for (const productName of productNames) {
                puntoVentaData.productos[productName] = 0;
            }

            // Procesar órdenes
            for (const orden of ordenes) {
                if (orden.items && Array.isArray(orden.items)) {
                    for (const item of orden.items) {
                        const matchedProduct = matchItemToProduct(item, productosMayoristas);

                        if (matchedProduct) {
                            const quantity = calculateItemQuantity(item, matchedProduct);

                            // Generar el nombre canónico del producto para buscar en productNames
                            const canonicalName = generateCanonicalProductName(matchedProduct);

                            // Debug: mostrar información del producto
                            console.log(`    📦 Item: "${item.name}" -> Producto: "${matchedProduct.fullName}" -> Cantidad: ${quantity} -> Nombre canónico: "${canonicalName}"`);

                            // Si el producto está en la lista de productNames, agregarlo
                            if (productNames.includes(canonicalName)) {
                                puntoVentaData.productos[canonicalName] += quantity;

                                // Solo contar en totalKilos si debe contar
                                if (shouldCountInTotal(matchedProduct)) {
                                    puntoVentaData.totalKilos += quantity;
                                }

                                console.log(`    ✅ Agregado: ${quantity} a "${canonicalName}" (total: ${puntoVentaData.productos[canonicalName]})`);
                            } else {
                                console.log(`    ❌ Producto "${canonicalName}" no está en productNames`);
                            }
                        }
                    }
                }
            }

            matrix.push(puntoVentaData);
        }

        console.log(`✅ Matriz generada con ${matrix.length} puntos de venta`);
        return matrix;

    } catch (error) {
        console.error('Error generando matriz de productos:', error);
        return [];
    }
}

/**
 * Genera el nombre canónico de un producto para matching con productNames
 */
function generateCanonicalProductName(producto: ProductoMayorista): string {
    const section = producto.section.trim().toUpperCase();
    const product = producto.product.trim().toUpperCase();
    const weight = producto.weight.trim().toUpperCase();

    let name = '';

    if (section.startsWith('RAW')) {
        // RAW - PRODUCT [WEIGHT] - pero no incluir "UNIDAD" si es el peso
        if (weight && weight !== 'UNIDAD') {
            name = `RAW - ${product} ${weight}`.trim();
        } else {
            name = `RAW - ${product}`.trim();
        }
    } else if (section.startsWith('BOX PERRO')) {
        name = `BOX PERRO ${product}`.trim();
    } else if (section.startsWith('BOX GATO')) {
        name = `BOX GATO ${product}`.trim();
    } else if (section.startsWith('BIG DOG')) {
        name = `BIG DOG ${product}`.trim();
    } else if (section) {
        name = `${section} ${product}`.trim();
    } else {
        name = product;
    }

    // Unificar orejas
    if (/RAW -\s*OREJA(S)?/i.test(name)) name = 'RAW - OREJAS';

    return name.replace(/\s+/g, ' ').trim();
}

/**
 * Devuelve la matriz completa de productos con datos por punto de venta
 * Usa el mes actual/año actual (si no hay results, usa el último month disponible en el mismo año)
 */
export async function getProductosMatrix(year: number, month: number, fromDate?: string, toDate?: string): Promise<{
    success: boolean;
    matrix?: ProductoMatrixData[];
    productNames?: string[];
    error?: string;
}> {
    try {
        const pricesCollection = await getCollection('prices');

        // fecha actual (en tu entorno es 2025-10-24 según lo hablamos)
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1; // 1-12

        // Helper: normalizar strings
        const normalize = (s?: string) => {
            if (!s) return '';
            const accentsMap: { [k: string]: string } = {
                'Á': 'A', 'É': 'E', 'Í': 'I', 'Ó': 'O', 'Ú': 'U', 'Ü': 'U', 'Ñ': 'N',
                'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u', 'ü': 'u', 'ñ': 'n'
            };
            const noAccent = s.replace(/[ÁÉÍÓÚÜÑáéíóúüñ]/g, c => accentsMap[c] || c);
            return noAccent.toString().toUpperCase().replace(/\s+/g, ' ').trim();
        };

        // 1) Intentar traer prices del month/year actual
        let pricesDocs = await pricesCollection.find(
            { priceType: 'MAYORISTA', isActive: true, year: currentYear, month: currentMonth },
            { projection: { section: 1, product: 1, weight: 1, effectiveDate: 1, createdAt: 1 } }
        ).toArray();

        // 2) Si no hay para el mes actual, buscar el último month disponible en el mismo año
        if (!pricesDocs || pricesDocs.length === 0) {
            // obtenemos los meses disponibles para el año actual
            const months = await pricesCollection.aggregate([
                { $match: { priceType: 'MAYORISTA', isActive: true, year: currentYear } },
                { $group: { _id: "$month" } },
                { $sort: { _id: -1 } },
                { $limit: 1 }
            ]).toArray();

            if (months.length > 0 && months[0]._id) {
                const lastMonthAvailable = months[0]._id;
                pricesDocs = await pricesCollection.find(
                    { priceType: 'MAYORISTA', isActive: true, year: currentYear, month: lastMonthAvailable },
                    { projection: { section: 1, product: 1, weight: 1, effectiveDate: 1, createdAt: 1 } }
                ).toArray();
            } else {
                // si no hay nada en el año actual, intentar traer algo de cualquier año (ultimo por fecha)
                pricesDocs = await pricesCollection.find(
                    { priceType: 'MAYORISTA', isActive: true },
                    { projection: { section: 1, product: 1, weight: 1, effectiveDate: 1, createdAt: 1 } }
                ).sort({ effectiveDate: -1, createdAt: -1 }).limit(500).toArray();
            }
        }

        // 3) Deduplicar por section+product+weight tomando la versión más reciente (effectiveDate/createdAt)
        type PriceKey = { section: string; product: string; weight: string; date: Date | null };
        const latestMap = new Map<string, PriceKey>();

        for (const p of pricesDocs) {
            const section = normalize(p.section || '');
            const product = normalize(p.product || '');
            const weight = normalize(p.weight || '');
            const key = `${section}||${product}||${weight}`;
            const date = p.effectiveDate ? new Date(p.effectiveDate) : (p.createdAt ? new Date(p.createdAt) : null);

            const prev = latestMap.get(key);
            if (!prev) {
                latestMap.set(key, { section, product, weight, date });
            } else {
                const prevDate = prev.date || new Date(0);
                const curDate = date || new Date(0);
                if (curDate > prevDate) latestMap.set(key, { section, product, weight, date });
            }
        }

        // 4) Construir nombres canónicos a partir de section/product/weight
        const namesSet = new Set<string>();
        for (const { section, product, weight } of latestMap.values()) {
            let name = '';

            if (section.startsWith('RAW')) {
                // RAW - PRODUCT [WEIGHT]
                name = `RAW - ${product}${weight ? ' ' + weight : ''}`.trim();
            } else if (section.startsWith('BOX PERRO')) {
                name = `BOX PERRO ${product}`.trim();
            } else if (section.startsWith('BOX GATO')) {
                name = `BOX GATO ${product}`.trim();
            } else if (section.startsWith('BIG DOG')) {
                name = `BIG DOG ${product}`.trim();
            } else if (section) {
                name = `${section} ${product}`.trim();
            } else {
                name = product;
            }

            // Unificar orejas
            if (/RAW -\s*OREJA(S)?/i.test(name)) name = 'RAW - OREJAS';

            name = name.replace(/\s+/g, ' ').trim();
            if (name) namesSet.add(name);
        }

        // 5) Aplicar ordenamiento personalizado a los nombres de productos
        const productNamesUnsorted = Array.from(namesSet);
        const productNames = sortProductNamesForMatrix(productNamesUnsorted);

        console.log('productNames ordenados:', productNames);

        // 6) Generar la matriz completa con datos de puntos de venta
        // Usar fechas específicas si se proporcionan, sino usar year/month
        let matrixFromDate: Date | undefined;
        let matrixToDate: Date | undefined;

        if (fromDate && toDate) {
            // Usar las fechas específicas proporcionadas
            matrixFromDate = new Date(fromDate);
            matrixToDate = new Date(toDate);
        } else {
            // Convertir year/month a fechas específicas para el filtrado
            matrixFromDate = new Date(year, month - 1, 1); // month - 1 porque JavaScript months are 0-based
            matrixToDate = new Date(year, month, 0, 23, 59, 59); // último día del mes
        }

        const matrix = await generateProductMatrix(productNames, matrixFromDate, matrixToDate);

        return { success: true, matrix, productNames };
    } catch (err) {
        console.error('Error en getProductNamesFromPricesCurrentMonth:', err);
        return { success: false, error: 'Error obteniendo productNames desde prices' };
    }
}



