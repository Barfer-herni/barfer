import { getCollection } from '@repo/database';
import { PriceType } from '../../types/barfer';

/**
 * Servicio de cálculo de precios que usa valores exactos de la base de datos
 * sin mapeos hardcodeados. Toma los valores directamente de los selects.
 */

interface ExactPriceParams {
    section: string;
    product: string;
    weight: string | null;
    orderType: 'minorista' | 'mayorista';
    paymentMethod: string;
}

/**
 * Obtiene el precio de un producto usando valores exactos de la base de datos
 * @param params - Parámetros exactos del producto seleccionado
 * @returns Resultado con el precio o error
 */
export async function getExactProductPrice(params: ExactPriceParams): Promise<{
    success: boolean;
    price?: number;
    error?: string;
    debug?: any;
}> {
    try {
        const { section, product, weight, orderType, paymentMethod } = params;

        // Determinar el tipo de precio basado en orderType y paymentMethod
        let priceType: PriceType;

        if (orderType === 'mayorista') {
            priceType = 'MAYORISTA';
        } else {
            // Para minorista, depende del método de pago
            if (paymentMethod === 'cash') {
                priceType = 'EFECTIVO';
            } else {
                // transferencia, mercado pago, etc.
                priceType = 'TRANSFERENCIA';
            }
        }

        // Buscar directamente en la base de datos con los valores exactos
        const collection = await getCollection('prices');

        // Construir el query exacto (insensible a mayúsculas/minúsculas)
        const query: any = {
            section: section.toUpperCase(),
            product: { $regex: `^${product.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' }, // Insensible a mayúsculas/minúsculas
            priceType,
            isActive: true,
            // Solo tomar precios cuya fecha efectiva sea menor o igual a hoy
            effectiveDate: { $lte: new Date().toISOString().split('T')[0] }
        };

        // Manejo especial para CORNALITOS - el peso está en el nombre del producto
        if (product.toUpperCase().includes('CORNALITOS')) {
            console.log(`🌽 CORNALITOS detectado: ${product}`);
            // Para CORNALITOS, el peso está en el nombre del producto, no en el campo weight
            // Buscar con weight: null porque en la DB está todo en el campo product
            query.weight = null;
        } else if (weight && weight.trim() !== '') {
            // Solo agregar weight si no es null o undefined
            query.weight = weight.toUpperCase();
        } else {
            // Para productos sin peso, buscar donde weight sea null
            query.$or = [
                { weight: null },
                { weight: { $exists: false } },
                { weight: '' }
            ];
        }

        // Manejo especial para productos RAW
        if (section.toUpperCase() === 'RAW') {
            console.log(`🥩 Producto RAW detectado: ${product} - ${weight}`);

            // Para productos RAW, verificar que solo se busquen para mayoristas
            if (orderType !== 'mayorista') {
                return {
                    success: false,
                    error: `Los productos RAW solo están disponibles para mayoristas`,
                    debug: { params, reason: 'RAW product for non-mayorista client' }
                };
            }
        }

        console.log(`🔍 BÚSQUEDA EXACTA EN DB:`, {
            query,
            params: {
                section: section.toUpperCase(),
                product: product.toUpperCase(),
                weight: weight ? weight.toUpperCase() : null,
                priceType,
                orderType,
                paymentMethod
            }
        });

        // Buscar el precio más reciente para este producto
        let priceRecord = await collection.findOne(query, {
            sort: { effectiveDate: -1, createdAt: -1 }
        });

        // Si no se encuentra con el query exacto, intentar búsqueda más flexible
        if (!priceRecord) {
            console.warn(`❌ No se encontró precio con query exacto:`, query);
            console.log(`🔍 Intentando búsqueda flexible...`);

            // Búsqueda flexible: solo por sección, producto y priceType (sin weight)
            const flexibleQuery = {
                section: section.toUpperCase(),
                product: { $regex: `^${product.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' }, // Insensible a mayúsculas/minúsculas
                priceType,
                isActive: true,
                // Solo tomar precios cuya fecha efectiva sea menor o igual a hoy
                effectiveDate: { $lte: new Date().toISOString().split('T')[0] }
            };

            console.log(`🔍 Query flexible:`, flexibleQuery);

            priceRecord = await collection.findOne(flexibleQuery, {
                sort: { effectiveDate: -1, createdAt: -1 }
            });

            if (priceRecord) {
                console.log(`✅ Precio encontrado con búsqueda flexible:`, {
                    found: priceRecord,
                    price: priceRecord.price,
                    note: 'Encontrado sin especificar weight'
                });
            }
        }

        if (!priceRecord) {
            console.warn(`❌ No se encontró precio ni con búsqueda flexible`);

            // Mensaje de error más específico para productos RAW
            if (section.toUpperCase() === 'RAW') {
                return {
                    success: false,
                    error: `No se encontró precio para el producto RAW ${product}${weight ? ` - ${weight}` : ''} (${priceType}). Verifica que el producto esté configurado en la gestión de precios.`,
                    debug: { exactQuery: query, flexibleQuery: { section: section.toUpperCase(), product: { $regex: `^${product.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' }, priceType, isActive: true }, params, note: 'RAW product not found in database' }
                };
            }

            return {
                success: false,
                error: `No se encontró precio para ${section} - ${product}${weight ? ` - ${weight}` : ''} (${priceType})`,
                debug: { exactQuery: query, flexibleQuery: { section: section.toUpperCase(), product: { $regex: `^${product.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' }, priceType, isActive: true }, params }
            };
        }

        console.log(`✅ PRECIO ENCONTRADO:`, {
            found: priceRecord,
            price: priceRecord.price
        });

        return {
            success: true,
            price: priceRecord.price,
            debug: { query, found: priceRecord }
        };

    } catch (error) {
        console.error('Error en getExactProductPrice:', error);
        return {
            success: false,
            error: `Error al calcular precio: ${(error as Error).message}`,
            debug: { params, error: (error as Error).message }
        };
    }
}

/**
 * Parsea un producto formateado (section - product - weight) en sus componentes
 * @param formattedProduct - Producto en formato "section - product - weight"
 * @returns Componentes del producto
 */
export function parseFormattedProduct(formattedProduct: string): {
    section: string;
    product: string;
    weight: string | null;
} {
    const parts = formattedProduct.split(' - ');

    if (parts.length < 2) {
        throw new Error(`Formato de producto inválido: ${formattedProduct}`);
    }

    let section = parts[0].trim();
    let product = parts[1].trim();
    let weight = parts.length > 2 ? parts[2].trim() : null;

    // Manejo especial para productos con formato "BOX PERRO POLLO - 5KG"
    // En este caso, la sección viene como "BOX PERRO POLLO" y el producto como "5KG"
    // Necesitamos extraer la sección real y el producto real
    if (section.toUpperCase().includes('BOX') && section.toUpperCase().includes('PERRO')) {
        // Formato: "BOX PERRO POLLO - 5KG"
        // Extraer: section = "PERRO", product = "POLLO", weight = "5KG"
        const sectionParts = section.split(' ');
        if (sectionParts.length >= 3) {
            section = sectionParts[1]; // "PERRO"
            product = sectionParts[2]; // "POLLO"
            weight = parts[1].trim(); // "5KG"
        }
    } else if (section.toUpperCase().includes('BOX') && section.toUpperCase().includes('GATO')) {
        // Formato: "BOX GATO POLLO - 5KG"
        // Extraer: section = "GATO", product = "POLLO", weight = "5KG"
        const sectionParts = section.split(' ');
        if (sectionParts.length >= 3) {
            section = sectionParts[1]; // "GATO"
            product = sectionParts[2]; // "POLLO"
            weight = parts[1].trim(); // "5KG"
        }
    } else if (section.toUpperCase().includes('HUESOS CARNOSOS') || section.toUpperCase().includes('HUESO CARNOSO')) {
        // Formato: "HUESOS CARNOSOS - 5KG"
        // En la DB: section = "OTROS", product = "HUESOS CARNOSOS 5KG", weight = null
        // El peso está incluido en el nombre del producto, no como campo separado
        section = 'OTROS';
        product = `${parts[0].trim()} ${parts[1].trim()}`; // "HUESOS CARNOSOS 5KG"
        weight = null; // El peso está en el nombre del producto
    } else if (section.toUpperCase().includes('BOX DE COMPLEMENTOS') || section.toUpperCase().includes('BOX COMPLEMENTOS')) {
        // Formato: "BOX DE COMPLEMENTOS - 1U" o "BOX DE COMPLEMENTOS"
        // En la DB: section = "OTROS", product = "BOX DE COMPLEMENTOS", weight = null
        // El "1U" es solo una referencia visual, no se almacena en la DB
        section = 'OTROS';
        product = parts[0].trim(); // "BOX DE COMPLEMENTOS"
        weight = null; // Siempre null en la DB
    }

    // Manejo especial para CORNALITOS - el peso está en el nombre del producto
    if (product.toUpperCase().includes('CORNALITOS')) {
        console.log(`🌽 CORNALITOS en parseo: ${product}`);
        // Para CORNALITOS, el peso está en el nombre del producto
        // Ejemplo: "Cornalitos 30grs" -> product: "CORNALITOS 30GRS", weight: null
        // No extraer el peso como campo separado
        weight = null;
    }

    console.log(`🔧 Parseo de producto: "${formattedProduct}" -> section: "${section}", product: "${product}", weight: "${weight}"`);

    return { section, product, weight };
}

/**
 * Función helper que combina parseFormattedProduct y getExactProductPrice
 * @param formattedProduct - Producto en formato "section - product - weight"
 * @param orderType - Tipo de orden (minorista/mayorista)
 * @param paymentMethod - Método de pago
 * @returns Resultado con el precio
 */
export async function getPriceFromFormattedProduct(
    formattedProduct: string,
    orderType: 'minorista' | 'mayorista',
    paymentMethod: string
): Promise<{
    success: boolean;
    price?: number;
    error?: string;
    debug?: any;
}> {
    try {
        const { section, product, weight } = parseFormattedProduct(formattedProduct);

        return await getExactProductPrice({
            section,
            product,
            weight,
            orderType,
            paymentMethod
        });
    } catch (error) {
        return {
            success: false,
            error: `Error al parsear producto: ${(error as Error).message}`,
            debug: { formattedProduct, error: (error as Error).message }
        };
    }
}

/**
 * Calcula el total de una orden usando valores exactos de la base de datos
 * @param items - Items de la orden
 * @param orderType - Tipo de orden (minorista/mayorista)
 * @param paymentMethod - Método de pago
 * @returns Total calculado y precios por item
 */
export async function calculateOrderTotalExact(
    items: Array<{
        name: string;
        fullName?: string; // Formato "section - product - weight"
        options: Array<{
            name: string;
            quantity: number;
        }>;
    }>,
    orderType: 'minorista' | 'mayorista',
    paymentMethod: string
): Promise<{
    success: boolean;
    total?: number;
    itemPrices?: Array<{
        name: string;
        weight: string;
        unitPrice: number;
        quantity: number;
        subtotal: number;
    }>;
    error?: string;
}> {
    try {
        let total = 0;
        const itemPrices = [];

        for (const item of items) {
            const quantity = item.options[0]?.quantity || 1;

            console.log(`🔍 ITEM EXACTO:`, {
                name: item.name,
                fullName: item.fullName,
                options: item.options
            });

            // Si tenemos fullName (formato de la BD), usarlo directamente
            if (item.fullName && item.fullName.includes(' - ')) {
                const result = await getPriceFromFormattedProduct(
                    item.fullName,
                    orderType,
                    paymentMethod
                );

                if (result.success && result.price !== undefined) {
                    const subtotal = result.price * quantity;
                    total += subtotal;

                    // Extraer componentes del fullName para el reporte
                    const parts = item.fullName.split(' - ');
                    const section = parts[0];
                    const product = parts[1];
                    const weight = parts[2] || 'N/A';

                    itemPrices.push({
                        name: item.fullName,
                        weight: weight,
                        unitPrice: result.price,
                        quantity,
                        subtotal
                    });

                    continue;
                }
            }

            // Fallback: usar el nombre del item (compatibilidad con datos antiguos)
            console.warn(`Item sin fullName, usando fallback: ${item.name}`);
            const weight = item.options[0]?.name || null;

            // Intentar deducir la sección basándose en el nombre del producto
            let deducedSection = 'PERRO'; // Default
            const productName = item.name.toUpperCase();

            if (productName.includes('GATO')) {
                deducedSection = 'GATO';
            } else if (productName.includes('BOX DE COMPLEMENTOS') ||
                productName.includes('HUESOS CARNOSOS') ||
                productName.includes('HUESO CARNOSO')) {
                deducedSection = 'OTROS';
            } else if (productName.includes('CORNALITOS') ||
                productName.includes('GARRAS') ||
                productName.includes('CALDO') ||
                productName.includes('HUESOS RECREATIVO') ||
                productName.includes('HUESO RECREATIVO') ||
                productName.includes('HIGADO') ||
                productName.includes('POLLO') && (productName.includes('40GRS') || productName.includes('100GRS')) ||
                productName.includes('TRAQUEA') ||
                productName.includes('OREJAS') ||
                productName.includes('TREAT')) {
                deducedSection = 'RAW';
            }

            console.log(`🔍 Fallback con sección deducida: ${deducedSection} para ${item.name}`);

            // CORRECCIÓN: Eliminar "BOX" del nombre del producto para la búsqueda en DB
            let cleanProductName = item.name;
            if (deducedSection === 'PERRO' || deducedSection === 'GATO') {
                // Para productos PERRO y GATO, eliminar "BOX PERRO " o "BOX GATO " del nombre
                cleanProductName = cleanProductName.replace(/^BOX\s+(PERRO|GATO)\s+/i, '');
                console.log(`🔧 Nombre limpio para búsqueda: "${cleanProductName}" (original: "${item.name}")`);
            }

            const result = await getExactProductPrice({
                section: deducedSection,
                product: cleanProductName, // Usar el nombre limpio sin BOX
                weight,
                orderType,
                paymentMethod
            });

            if (result.success && result.price !== undefined) {
                const subtotal = result.price * quantity;
                total += subtotal;

                itemPrices.push({
                    name: item.name,
                    weight: weight || 'N/A',
                    unitPrice: result.price,
                    quantity,
                    subtotal
                });
            } else {
                console.warn(`No se pudo obtener precio para ${item.name}:`, result.error);
            }
        }

        return {
            success: true,
            total,
            itemPrices
        };
    } catch (error) {
        console.error('Error al calcular total exacto de la orden:', error);
        return {
            success: false,
            error: `Error al calcular el total de la orden: ${(error as Error).message}`
        };
    }
}

/**
 * Función de debug para verificar productos RAW
 * @returns Información sobre productos RAW en la base de datos
 */
export async function debugRawProducts(): Promise<{
    success: boolean;
    rawProducts?: Array<{
        section: string;
        product: string;
        weight: string | null;
        formattedName: string;
        priceTypes: string[];
    }>;
    error?: string;
}> {
    try {
        const collection = await getCollection('prices');

        // Buscar todos los productos RAW
        const rawProducts = await collection.find({
            section: 'RAW',
            isActive: true
        }).toArray();

        const formattedRawProducts = rawProducts.map(product => {
            const parts = ['RAW', product.product];
            if (product.weight) {
                parts.push(product.weight);
            }
            const formattedName = parts.join(' - ');

            return {
                section: product.section,
                product: product.product,
                weight: product.weight,
                formattedName,
                priceTypes: [product.priceType]
            };
        });

        // Agrupar por producto único
        const groupedProducts = new Map();
        formattedRawProducts.forEach(product => {
            const key = `${product.product}-${product.weight || 'null'}`;
            if (!groupedProducts.has(key)) {
                groupedProducts.set(key, {
                    ...product,
                    priceTypes: []
                });
            }
            groupedProducts.get(key).priceTypes.push(...product.priceTypes);
        });

        return {
            success: true,
            rawProducts: Array.from(groupedProducts.values())
        };

    } catch (error) {
        console.error('Error en debugRawProducts:', error);
        return {
            success: false,
            error: `Error al obtener productos RAW: ${(error as Error).message}`
        };
    }
}

/**
 * Obtiene todos los precios disponibles para un tipo de cliente específico
 * @param clientType - Tipo de cliente (minorista/mayorista)
 * @returns Lista de productos con precios disponibles
 */
export async function getAvailablePricesForClient(clientType: 'minorista' | 'mayorista'): Promise<{
    success: boolean;
    products: Array<{
        formattedName: string;
        section: string;
        product: string;
        weight: string | null;
        prices: {
            EFECTIVO?: number;
            TRANSFERENCIA?: number;
            MAYORISTA?: number;
        };
    }>;
    error?: string;
}> {
    try {
        const collection = await getCollection('prices');

        // Agregación para obtener todos los productos activos con sus precios
        const pipeline = [
            {
                $match: { isActive: true }
            },
            {
                $group: {
                    _id: {
                        section: "$section",
                        product: "$product",
                        weight: "$weight"
                    },
                    prices: {
                        $push: {
                            priceType: "$priceType",
                            price: "$price",
                            effectiveDate: "$effectiveDate"
                        }
                    }
                }
            },
            {
                $project: {
                    section: "$_id.section",
                    product: "$_id.product",
                    weight: "$_id.weight",
                    prices: 1
                }
            },
            {
                $sort: {
                    section: 1,
                    product: 1,
                    weight: 1
                }
            }
        ];

        const results = await collection.aggregate(pipeline).toArray();

        // Procesar resultados y filtrar según tipo de cliente
        const processedProducts = results.map(result => {
            const { section, product, weight, prices } = result;

            // Obtener el precio más reciente por tipo
            const latestPrices: any = {};
            prices.forEach((p: any) => {
                if (!latestPrices[p.priceType] ||
                    new Date(p.effectiveDate) > new Date(latestPrices[p.priceType].effectiveDate)) {
                    latestPrices[p.priceType] = p;
                }
            });

            // Formatear nombre del producto
            const parts = [section, product];
            if (weight) {
                parts.push(weight);
            }
            const formattedName = parts.join(' - ');

            return {
                formattedName,
                section,
                product,
                weight,
                prices: {
                    EFECTIVO: latestPrices.EFECTIVO?.price,
                    TRANSFERENCIA: latestPrices.TRANSFERENCIA?.price,
                    MAYORISTA: latestPrices.MAYORISTA?.price
                }
            };
        });

        // Filtrar productos según tipo de cliente
        let filteredProducts = processedProducts;

        if (clientType === 'minorista') {
            // Para minoristas, excluir productos que solo tienen precios MAYORISTA
            filteredProducts = processedProducts.filter(p =>
                p.prices.EFECTIVO || p.prices.TRANSFERENCIA
            );
        }

        return {
            success: true,
            products: filteredProducts
        };

    } catch (error) {
        console.error('Error getting available prices for client:', error);
        return {
            success: false,
            products: [],
            error: `Error al obtener precios disponibles: ${(error as Error).message}`
        };
    }
}
