'use server'

import 'server-only';
import { getCollection } from '@repo/database';
import type { PriceSection, PriceType } from '../../types/barfer';

/**
 * Obtener el precio de un producto específico desde MongoDB
 */
export async function getProductPrice(
    product: string,
    weight: string | null,
    orderType: 'minorista' | 'mayorista',
    paymentMethod: string,
    sectionParam?: string
): Promise<{ success: boolean; price?: number; error?: string }> {
    try {
        // Determinar la sección y producto primero para verificar si es solo mayorista
        const productUpper = product.toUpperCase();
        const weightUpper = weight?.toUpperCase() || '';
        const isOnlyMayoristaProduct = productUpper.includes('GARRAS') ||
            productUpper.includes('CALDO') ||
            (productUpper.includes('CORNALITOS') && (weightUpper === '200GRS' || weightUpper === '30GRS')) ||
            productUpper.includes('HUESOS RECREATIVO') ||
            productUpper.includes('HUESO RECREATIVO');

        // Mapear orderType y paymentMethod a PriceType
        let priceType: PriceType;

        if (orderType === 'mayorista' || isOnlyMayoristaProduct) {
            // Si es mayorista O es un producto que solo existe en mayorista
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

        // No calcular la sección inicialmente, se determinará desde la base de datos

        // Normalizar el nombre del producto para la búsqueda
        let searchProduct = product.toUpperCase();
        let searchWeight = weight;

        // Mapear nombres de productos comunes
        if (searchProduct.includes('GATO') && searchProduct.includes('VACA')) {
            searchProduct = 'GATO VACA';
        } else if (searchProduct.includes('GATO') && searchProduct.includes('POLLO')) {
            searchProduct = 'GATO POLLO';
        } else if (searchProduct.includes('GATO') && searchProduct.includes('CERDO')) {
            searchProduct = 'GATO CERDO';
        } else if (searchProduct.includes('GATO') && searchProduct.includes('CORDERO')) {
            searchProduct = 'GATO CORDERO';
        } else if (searchProduct.includes('BOX') && searchProduct.includes('POLLO')) {
            searchProduct = 'POLLO';
        } else if (searchProduct.includes('BOX') && searchProduct.includes('VACA')) {
            searchProduct = 'VACA';
        } else if (searchProduct.includes('BOX') && searchProduct.includes('CERDO')) {
            searchProduct = 'CERDO';
        } else if (searchProduct.includes('BOX') && searchProduct.includes('CORDERO')) {
            searchProduct = 'CORDERO';
        } else if (searchProduct.includes('BOX') && (searchProduct.includes('COMPLEMENTO') || searchProduct.includes('COMPLEMENTOS'))) {
            searchProduct = 'BOX DE COMPLEMENTOS';
        } else if (searchProduct === 'BOX DE COMPLEMENTOS') {
            // Ya está en el formato correcto
            searchProduct = 'BOX DE COMPLEMENTOS';
        } else if (searchProduct.includes('BIG DOG') && searchProduct.includes('VACA')) {
            searchProduct = 'BIG DOG VACA';
        } else if (searchProduct.includes('BIG DOG') && searchProduct.includes('POLLO')) {
            searchProduct = 'BIG DOG POLLO';
        } else if (searchProduct === 'HUESOS CARNOSOS 5KG') {
            // Ya está en el formato correcto, no cambiar nada
            searchProduct = 'HUESOS CARNOSOS 5KG';
        } else if (searchProduct.includes('HUESOS CARNOSOS') ||
            searchProduct.includes('HUESO CARNOSO') ||
            searchProduct.includes('HUESOS CARNOSO') ||
            searchProduct.includes('HUESO CARNOSOS') ||
            (searchProduct.includes('HUESO') && searchProduct.includes('CARNOSO'))) {
            searchProduct = 'HUESOS CARNOSOS 5KG';
        } else if (searchProduct.includes('HUESO RECREATIVO') || searchProduct.includes('HUESOS RECREATIVO')) {
            searchProduct = 'HUESOS RECREATIVOS';
        } else if (searchProduct.includes('COMPLEMENTOS') && !searchProduct.includes('BOX')) {
            searchProduct = 'BOX DE COMPLEMENTOS';
        } else if (searchProduct.includes('GARRAS')) {
            searchProduct = 'GARRAS';
        } else if (searchProduct.includes('CALDO')) {
            searchProduct = 'CALDO DE HUESOS';
        } else if (searchProduct.includes('CORNALITOS')) {
            console.log("ingrese 1")
            if (searchProduct.includes('30GRS')) {
                console.log("ingrese 2")
                searchProduct = 'CORNALITOS 30GRS';
                searchWeight = null; // porque en la DB está todo en el campo product
            } else if (searchProduct.includes('200GRS')) {
                searchProduct = 'CORNALITOS 200GRS';
                searchWeight = null;
            } else {
                searchProduct = 'CORNALITOS';
                searchWeight = null;
            }
        }
        // } else if (searchProduct.includes('CORNALITOS')) {
        //     if (searchProduct.includes('30GRS')) {
        //         searchProduct = 'CORNALITOS';
        //         searchWeight = '30GRS';
        //     } else if (searchProduct.includes('200GRS')) {
        //         searchProduct = 'CORNALITOS';
        //         searchWeight = '200GRS';
        //     } else {
        //         // fallback: sin peso => null
        //         searchProduct = 'CORNALITOS';
        //         searchWeight = null;
        //     }
        // }

        // Mapear pesos comunes

        // Mapear pesos de gramos a kilogramos para productos principales
        if (weight) {
            const weightUpper = weight.toUpperCase();
            if (weightUpper === '500GRS' || weightUpper === '500G') {
                searchWeight = '5KG';
            } else if (weightUpper === '1000GRS' || weightUpper === '1000G' || weightUpper === '1KG') {
                searchWeight = '10KG';
            } else if (weightUpper === '200GRS' || weightUpper === '200G') {
                searchWeight = '200GRS'; // CORNALITOS mantiene este peso
            }
        }

        // Para algunos productos, el peso puede ser null
        // HUESOS CARNOSOS 5KG tiene el peso en el nombre, por lo que se guarda con weight: null
        // CORNALITOS usa el peso real (200GRS) en la búsqueda, no null
        // BIG DOG usa weight: "15KG" en la base de datos
        if (['GARRAS', 'CALDO DE HUESOS', 'HUESOS RECREATIVOS', 'BOX DE COMPLEMENTOS', 'HUESOS CARNOSOS 5KG'].includes(searchProduct)) {
            searchWeight = null;
        } else if (searchProduct.startsWith('BIG DOG')) {
            // BIG DOG siempre usa "15KG" como peso en la base de datos
            searchWeight = '15KG';
        }

        // Debug: Log del mapeo inicial (antes de buscar en DB)
        console.log(`🔍 MAPEO DE PRODUCTO:`, {
            original: product,
            mapped: searchProduct,
            originalWeight: weight,
            mappedWeight: searchWeight,
            priceType,
            orderType,
            paymentMethod,
            isOnlyMayoristaProduct,
            forcedMayorista: isOnlyMayoristaProduct && orderType !== 'mayorista',
            note: 'Sección se determinará desde la base de datos'
        });

        // Buscar el precio en MongoDB
        const collection = await getCollection('prices');

        // Primero buscar el producto en la base de datos para obtener su sección real
        const productQuery: any = {
            product: { $regex: `^${searchProduct.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
            priceType,
            isActive: true
        };

        // Solo agregar sectionParam si está definido
        if (sectionParam) {
            productQuery.section = sectionParam;
        }

        // Solo agregar weight al query si no es null
        if (searchWeight !== null) {
            productQuery.weight = searchWeight;
        } else {
            // Para productos sin peso específico, buscar donde weight sea null o undefined
            productQuery.$or = [
                { weight: null },
                { weight: { $exists: false } }
            ];
        }

        // Buscar TODOS los productos que coincidan para seleccionar el correcto
        const productRecords = await collection.find(productQuery).toArray();

        if (!productRecords || productRecords.length === 0) {
            console.warn(`❌ No se encontró producto en la base de datos:`, {
                product: searchProduct,
                weight: searchWeight,
                note: 'Intentando buscar por nombre de producto sin sección específica'
            });

            return {
                success: false,
                error: `No se encontró el producto "${product}" en la base de datos. Verifica que el producto esté configurado en la gestión de precios.`
            };
        }

        // Si hay múltiples registros, priorizar por sección
        let productRecord = productRecords[0]; // Por defecto, el primero

        if (productRecords.length > 1) {
            console.log(`🔍 Encontrados ${productRecords.length} registros para ${searchProduct}:`,
                productRecords.map(r => ({ section: r.section, price: r.price })));

            // Definir prioridad de secciones (mayor prioridad = menor número)
            const sectionPriority: Record<string, number> = {
                'GATO': 1,
                'OTROS': 2,
                'PERRO': 3,
                'RAW': 4
            };

            // Seleccionar el registro con mayor prioridad de sección
            productRecord = productRecords.reduce((best, current) => {
                const bestPriority = sectionPriority[best.section as string] || 999;
                const currentPriority = sectionPriority[current.section as string] || 999;

                if (currentPriority < bestPriority) {
                    return current;
                }
                return best;
            });

            console.log(`✅ Seleccionado registro por prioridad de sección: sección ${productRecord.section}, precio $${productRecord.price}`);
        }

        // Usar la sección real de la base de datos
        const realSection = productRecord.section;
        console.log(`✅ Producto encontrado en sección real: ${realSection}`);

        // Construir query final para obtener el precio
        const query: any = {
            section: realSection,
            product: { $regex: `^${searchProduct.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' }, // Case-insensitive exact match
            priceType,
            isActive: true
        };

        // Solo agregar weight al query si no es null
        if (searchWeight !== null) {
            query.weight = searchWeight;
        } else {
            // Para productos sin peso específico, buscar donde weight sea null o undefined
            query.$or = [
                { weight: null },
                { weight: { $exists: false } }
            ];
        }

        // Buscar precios del mes y año actual, pero si no encuentra, buscar el más reciente
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1;
        const currentYear = currentDate.getFullYear();

        console.log(`🔍 BÚSQUEDA EN MONGODB:`, {
            ...query,
            month: currentMonth,
            year: currentYear,
            note: `Buscando primero en ${currentMonth}/${currentYear}`
        });

        // Primero buscar precios del mes actual
        let priceRecord = await collection.findOne({
            ...query,
            month: currentMonth,
            year: currentYear
        });

        // Si no encuentra en el mes actual, buscar el precio más reciente disponible
        if (!priceRecord) {
            console.log(`⚠️ No se encontró precio en ${currentMonth}/${currentYear}, buscando el más reciente...`);

            priceRecord = await collection.findOne({
                ...query
            }, {
                sort: {
                    year: -1,
                    month: -1,
                    updatedAt: -1
                }
            });

            if (priceRecord) {
                console.log(`✅ Encontrado precio más reciente en ${priceRecord.month}/${priceRecord.year}`);
            }
        }

        console.log(`💰 Precio encontrado:`, priceRecord ? `$${priceRecord.price}` : 'NO ENCONTRADO');

        // Si no encontró el producto y la sección real era RAW, intentar buscar en OTROS como fallback
        if (!priceRecord && realSection === 'RAW') {
            console.log(`🔄 No se encontró en RAW, intentando buscar en OTROS como fallback...`);

            const fallbackQuery = {
                ...query,
                section: 'OTROS'
            };

            // Primero buscar en el mes actual
            priceRecord = await collection.findOne({
                ...fallbackQuery,
                month: currentMonth,
                year: currentYear
            });

            // Si no encuentra en el mes actual, buscar el más reciente
            if (!priceRecord) {
                priceRecord = await collection.findOne({
                    ...fallbackQuery
                }, {
                    sort: {
                        year: -1,
                        month: -1,
                        updatedAt: -1
                    }
                });
            }

            if (priceRecord) {
                console.log(`✅ Encontrado en OTROS como fallback: $${priceRecord.price}`);
            }
        }

        if (!priceRecord) {
            console.warn(`❌ No se encontró precio en ningún período:`, {
                section: realSection,
                product: searchProduct,
                weight: searchWeight,
                priceType,
                currentMonth,
                currentYear
            });

            return {
                success: false,
                error: `No se encontró precio para ${product} (${weight || 'sin peso'}) - ${priceType}. Verifica que el producto esté configurado en la gestión de precios.`
            };
        }

        return {
            success: true,
            price: priceRecord.price
        };

    } catch (error) {
        console.error('Error al obtener precio del producto:', error);
        return {
            success: false,
            error: 'Error al obtener el precio del producto'
        };
    }
}

/**
 * Función de debug para investigar problemas de cálculo de precios
 */
export async function debugPriceCalculation() {
    console.log('🔍 DEBUG: Investigando cálculo de precios...\n');

    try {
        // 1. Verificar estructura de la colección prices
        const pricesCollection = await getCollection('prices');

        console.log('📊 ESTRUCTURA DE LA COLECCIÓN PRICES:');
        const samplePrices = await pricesCollection.find({}).limit(5).toArray();
        console.log('Muestra de precios:', JSON.stringify(samplePrices, null, 2));

        // 2. Contar productos por sección
        const sectionsCount = await pricesCollection.aggregate([
            { $group: { _id: '$section', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]).toArray();
        console.log('\n📈 PRODUCTOS POR SECCIÓN:', sectionsCount);

        // 3. Contar productos por tipo de precio
        const priceTypesCount = await pricesCollection.aggregate([
            { $group: { _id: '$priceType', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]).toArray();
        console.log('\n💰 TIPOS DE PRECIO:', priceTypesCount);

        // 4. Verificar productos únicos
        const uniqueProducts = await pricesCollection.aggregate([
            { $group: { _id: { product: '$product', weight: '$weight' }, count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 20 }
        ]).toArray();
        console.log('\n🏷️ PRODUCTOS ÚNICOS (top 20):', uniqueProducts);

        // 4.1. Verificar precios del mes actual
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1;
        const currentYear = currentDate.getFullYear();

        // 4.2. Verificar pesos específicos para productos principales
        console.log('\n⚖️ PESOS DISPONIBLES PARA PRODUCTOS PRINCIPALES:');
        const mainProducts = ['POLLO', 'VACA', 'CERDO', 'CORDERO'];

        for (const product of mainProducts) {
            const weights = await pricesCollection.aggregate([
                { $match: { product: product, month: currentMonth, year: currentYear } },
                { $group: { _id: '$weight', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]).toArray();

            console.log(`${product}:`, weights.map(w => `${w._id || 'sin peso'} (${w.count} precios)`));
        }

        // 5. Verificar precios del mes actual

        console.log(`\n📅 PRECIOS DEL MES ACTUAL (${currentMonth}/${currentYear}):`);
        const currentMonthPrices = await pricesCollection.find({
            month: currentMonth,
            year: currentYear
        }).toArray();
        console.log(`Total de precios en ${currentMonth}/${currentYear}: ${currentMonthPrices.length}`);

        if (currentMonthPrices.length > 0) {
            console.log('Primeros 5 precios del mes actual:');
            currentMonthPrices.slice(0, 5).forEach(price => {
                console.log(`- ${price.section} | ${price.product} | ${price.weight || 'sin peso'} | ${price.priceType} | $${price.price}`);
            });
        }

        // 6. Verificar productos sin precios en el mes actual
        console.log(`\n❌ PRODUCTOS SIN PRECIOS EN ${currentMonth}/${currentYear}:`);
        const allProducts = await pricesCollection.aggregate([
            { $group: { _id: { product: '$product', weight: '$weight', section: '$section' } } }
        ]).toArray();

        const productsWithoutCurrentPrice = [];
        for (const product of allProducts) {
            const hasCurrentPrice = await pricesCollection.findOne({
                product: product._id.product,
                weight: product._id.weight,
                section: product._id.section,
                month: currentMonth,
                year: currentYear
            });

            if (!hasCurrentPrice) {
                productsWithoutCurrentPrice.push(product._id);
            }
        }

        console.log(`Productos sin precios en ${currentMonth}/${currentYear}: ${productsWithoutCurrentPrice.length}`);
        if (productsWithoutCurrentPrice.length > 0) {
            productsWithoutCurrentPrice.slice(0, 10).forEach(product => {
                console.log(`- ${product.section} | ${product.product} | ${product.weight || 'sin peso'}`);
            });
        }

        // 7. Verificar precios específicos en la base de datos
        console.log(`\n🔍 VERIFICANDO PRECIOS ESPECÍFICOS EN ${currentMonth}/${currentYear}:`);

        const specificProducts = [
            { product: 'POLLO', weight: '5KG', section: 'PERRO' },
            { product: 'POLLO', weight: '10KG', section: 'PERRO' },
            { product: 'VACA', weight: '5KG', section: 'PERRO' },
            { product: 'VACA', weight: '10KG', section: 'PERRO' },
            { product: 'CERDO', weight: '5KG', section: 'PERRO' },
            { product: 'CERDO', weight: '10KG', section: 'PERRO' },
            { product: 'BIG DOG VACA', weight: null, section: 'PERRO' },
            { product: 'HUESOS CARNOSOS 5KG', weight: null, section: 'OTROS' },
            { product: 'GARRAS', weight: null, section: 'OTROS' },
            { product: 'CORNALITOS', weight: '200GRS', section: 'OTROS' }
        ];

        for (const item of specificProducts) {
            console.log(`\n--- Verificando: ${item.product} (${item.weight || 'sin peso'}) en sección ${item.section} ---`);

            const query: any = {
                section: item.section,
                product: item.product,
                isActive: true,
                month: currentMonth,
                year: currentYear
            };

            if (item.weight !== null) {
                query.weight = item.weight;
            } else {
                query.$or = [{ weight: null }, { weight: { $exists: false } }];
            }

            const prices = await pricesCollection.find(query).toArray();

            if (prices.length > 0) {
                prices.forEach(price => {
                    console.log(`✅ ${price.priceType}: $${price.price}`);
                });
            } else {
                console.log(`❌ No se encontraron precios para ${item.product}`);
            }
        }

        // 8. Probar cálculo de precios con productos comunes
        console.log('\n🧪 PROBANDO CÁLCULO DE PRECIOS:');

        const testProducts = [
            { name: 'POLLO', weight: '500GRS' }, // Debería mapear a 5KG
            { name: 'POLLO', weight: '1000GRS' }, // Debería mapear a 10KG
            { name: 'VACA', weight: '500GRS' }, // Debería mapear a 5KG
            { name: 'VACA', weight: '1000GRS' }, // Debería mapear a 10KG
            { name: 'CERDO', weight: '500GRS' }, // Debería mapear a 5KG
            { name: 'CERDO', weight: '1000GRS' }, // Debería mapear a 10KG
            { name: 'BIG DOG VACA', weight: null },
            { name: 'HUESOS CARNOSOS 5KG', weight: null },
            { name: 'GARRAS', weight: null },
            { name: 'CORNALITOS', weight: '200GRS' }
        ];

        for (const product of testProducts) {
            console.log(`\n--- Probando: ${product.name} (${product.weight || 'sin peso'}) ---`);

            // Probar para minorista efectivo
            const minoristaEfectivo = await getProductPrice(product.name, product.weight, 'minorista', 'cash');
            console.log(`Minorista Efectivo: ${minoristaEfectivo.success ? `$${minoristaEfectivo.price}` : minoristaEfectivo.error}`);

            // Probar para minorista transferencia
            const minoristaTransferencia = await getProductPrice(product.name, product.weight, 'minorista', 'transferencia');
            console.log(`Minorista Transferencia: ${minoristaTransferencia.success ? `$${minoristaTransferencia.price}` : minoristaTransferencia.error}`);

            // Probar para mayorista
            const mayorista = await getProductPrice(product.name, product.weight, 'mayorista', 'cash');
            console.log(`Mayorista: ${mayorista.success ? `$${mayorista.price}` : mayorista.error}`);
        }

        return { success: true, message: 'Debug completado' };

    } catch (error) {
        console.error('❌ Error en debug:', error);
        return { success: false, error: (error as Error).message };
    }
}

/**
 * Calcular el total de una orden basado en sus items, tipo de cliente y método de pago
 */
export async function calculateOrderTotal(
    items: Array<{
        name: string;
        options: Array<{
            name: string;
            quantity: number;
        }>;
    }>,
    orderType: 'minorista' | 'mayorista',
    paymentMethod: string
): Promise<{ success: boolean; total?: number; itemPrices?: Array<{ name: string; weight: string; unitPrice: number; quantity: number; subtotal: number }>; error?: string }> {
    try {
        let total = 0;
        const itemPrices = [];

        for (const item of items) {
            let weight = item.options[0]?.name || null;
            let productName = item.name;
            const quantity = item.options[0]?.quantity || 1;

            console.log(`🔍 ITEM ANTES DEL PROCESAMIENTO:`, {
                name: productName,
                weight: weight,
                options: item.options
            });

            // Manejo especial para BIG DOG
            if (productName.includes('BIG DOG')) {
                console.log(`🐕 BIG DOG detectado: ${productName}, peso actual: ${weight}`);
                if (weight === '15KG') {
                    // Para BIG DOG, el peso es siempre 15KG y se busca con weight: "15KG" en la base de datos
                    weight = '15KG'; // BIG DOG usa weight: "15KG" en la base de datos
                    console.log(`🐕 BIG DOG: Manteniendo peso 15KG para búsqueda en DB`);
                } else if (weight === null) {
                    // Si no hay peso, asignar el peso por defecto para BIG DOG
                    weight = '15KG';
                    console.log(`🐕 BIG DOG: Asignando peso por defecto 15KG para búsqueda en DB`);
                } else {
                    console.log(`🐕 BIG DOG: Peso inesperado: ${weight}, usando 15KG por defecto`);
                    weight = '15KG';
                }
            }

            const priceResult = await getProductPrice(productName, weight, orderType, paymentMethod);

            if (!priceResult.success || priceResult.price === undefined || priceResult.price === null) {
                console.warn(`No se pudo obtener precio para ${item.name} (${weight}):`, priceResult.error);
                // Continuar con los otros items, no fallar toda la orden
                continue;
            }

            const subtotal = priceResult.price * quantity;
            total += subtotal;

            itemPrices.push({
                name: item.name,
                weight: weight || 'N/A',
                unitPrice: priceResult.price,
                quantity,
                subtotal
            });
        }

        return {
            success: true,
            total,
            itemPrices
        };
    } catch (error) {
        console.error('Error al calcular total de la orden:', error);
        return {
            success: false,
            error: 'Error al calcular el total de la orden'
        };
    }
}
