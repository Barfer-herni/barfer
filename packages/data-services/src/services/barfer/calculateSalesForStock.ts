import 'server-only';
import type { Order } from '../../types/barfer';

/**
 * Calcula la cantidad de productos vendidos para un registro de stock específico
 * a partir de una lista de órdenes.
 * Implementa la misma lógica de matching que el frontend.
 */
export function calculateSalesFromOrders(product: { product: string; section: string; weight?: string }, orders: Order[]): number {
    let totalQuantity = 0;
    const sectionUpper = (product.section || '').toUpperCase();
    let productName = (product.product || '').toUpperCase().trim();

    console.log(`\n🔍 [calculateSalesFromOrders] Starting calculation for:`, {
        originalProduct: product.product,
        section: product.section,
        weight: product.weight,
        ordersCount: orders.length
    });

    // Si el nombre del producto ya contiene la sección al principio (formato de la BD actual),
    // intentamos limpiarlo para el matching contra los items de la orden (que no suelen tenerlo)
    if (sectionUpper && productName.startsWith(sectionUpper)) {
        const originalProductName = productName;
        productName = productName.substring(sectionUpper.length).trim();
        console.log(`   🔧 Cleaned product name: "${originalProductName}" -> "${productName}"`);
    }

    const productWeight = product.weight ? (product.weight || '').toUpperCase().trim().replace(/\s+/g, '') : null;
    console.log(`   📦 Normalized weight: ${productWeight}`);

    orders.forEach((order, orderIndex) => {
        if (!order.items) return;

        console.log(`\n   📋 Order ${orderIndex + 1}/${orders.length} (ID: ${order._id}):`, {
            puntoEnvio: order.puntoEnvio,
            deliveryDay: order.deliveryDay,
            itemsCount: order.items?.length || 0
        });

        order.items.forEach((item: any, itemIndex) => {
            const itemProductBase = (item.name || '').toUpperCase().trim();
            const itemOption = (item.options?.[0]?.name || '').toUpperCase().trim();
            const isBigDogItem = itemProductBase.includes('BIG DOG');
            const isBigDogStock = productName.includes('BIG DOG');

            console.log(`      🔸 Item ${itemIndex + 1}: "${item.name}"`, {
                options: item.options?.map((o: any) => o.name),
                isBigDog: isBigDogItem
            });

            // 1. Validación de sección (Perro vs Gato)
            if (!sectionUpper.includes('OTROS')) {
                if (sectionUpper.includes('GATO')) {
                    if (!itemProductBase.includes('GATO')) return;
                } else if (sectionUpper.includes('PERRO')) {
                    if (itemProductBase.includes('GATO')) return;

                    // Regla: Si el ítem es BIG DOG, el stock debe ser BIG DOG.
                    // Si el ítem NO es BIG DOG, el stock NO debe ser BIG DOG.
                    if (isBigDogStock && !isBigDogItem) return;
                    if (!isBigDogStock && isBigDogItem) return;
                }
            }

            let isMatch = false;

            // CASO ESPECIAL: BIG DOG
            if (isBigDogItem && isBigDogStock) {
                const flavors = ['POLLO', 'VACA', 'CORDERO', 'CERDO', 'CONEJO', 'PAVO', 'MIX'];
                const stockFullIdent = `${productName} ${productWeight || ''}`.toUpperCase();

                // Prioridad: Matchear sabor desde las opciones
                if (item.options && item.options.length > 0) {
                    // Buscamos si alguna opción es un sabor conocido
                    const flavorOption = item.options.find((opt: any) =>
                        flavors.some(f => (opt.name || '').toUpperCase().includes(f))
                    );

                    if (flavorOption) {
                        const optValue = flavorOption.name.toUpperCase().trim();
                        // Si hay una opción de sabor, DEBE coincidir con el stock
                        isMatch = stockFullIdent.includes(optValue);
                    }
                }

                // Fallback: Si no hay match por opciones de sabor, intentar por el nombre del ítem
                if (!isMatch) {
                    const itemFullIdent = itemProductBase.toUpperCase();
                    const itemFlavor = flavors.find(f => itemFullIdent.includes(f));
                    const stockFlavor = flavors.find(f => stockFullIdent.includes(f));

                    const cleanItem = itemProductBase.replace(/\s*\(?\d+KG\)?/gi, '').trim();
                    const cleanStock = productName.replace(/\s*\(?\d+KG\)?/gi, '').trim();

                    if (cleanItem === cleanStock || (cleanItem.includes(cleanStock) && cleanStock.length > 5)) {
                        if (stockFlavor) {
                            // Si el stock tiene un sabor específico, el ítem debe tenerlo en su nombre
                            isMatch = itemFullIdent.includes(stockFlavor);
                        } else {
                            // Si el stock no tiene sabor especificado en el nombre/peso,
                            // solo matcheamos si el ítem tampoco tiene sabor en el nombre
                            isMatch = !itemFlavor;
                        }
                    }
                }
            } else {
                // CASO REGULAR: BOX PERRO, BOX GATO, etc. (misma lógica exacta que ExpressPageClient calculatePedidosDelDia)
                const itemOptions = (item.options || []).map((opt: any) => (opt.name || '').toUpperCase().trim());
                const itemMainOption = itemOptions[0] || '';

                // Detectar pesos en el ítem (en nombre u opciones)
                const itemFullIdent = `${itemProductBase} ${itemOptions.join(' ')}`.toUpperCase();
                const weightRegex = /(\d+\s*KG)/gi;
                const itemWeightsMatch = itemFullIdent.match(weightRegex);
                const stockWeightsMatch = `${productName} ${productWeight || ''}`.toUpperCase().match(weightRegex);

                const normalizedItemWeight = itemWeightsMatch ? itemWeightsMatch[0].replace(/\s+/g, '') : null;
                const normalizedStockWeight = stockWeightsMatch ? stockWeightsMatch[0].replace(/\s+/g, '') : (productWeight ? productWeight.replace(/\s+/g, '') : null);

                // Construir el nombre del item incluyendo la opción pero SIN el peso (igual que front)
                const itemProduct = `${itemProductBase} ${itemMainOption}`.trim();
                const cleanItemProduct = itemProduct.replace(/\s*\(?\d+\s*KG\)?/gi, '').trim();
                const cleanProductName = productName.replace(/\s*\(?\d+\s*KG\)?/gi, '').trim();

                // Extraer el sabor/tipo del producto del item (POLLO, VACA, etc.) - igual que front
                let extracted = itemProductBase;
                extracted = extracted.replace(/^BOX\s+PERRO\s+/i, '');
                extracted = extracted.replace(/^BOX\s+GATO\s+/i, '');
                extracted = extracted.replace(/\s*\(?\d+\s*KG\)?/gi, '');
                const extractedFlavor = extracted.trim();

                // 1. Comparación básica de nombre (mismas condiciones que front)
                const nameMatch = cleanItemProduct === cleanProductName ||
                    cleanItemProduct.includes(cleanProductName) ||
                    cleanProductName.includes(cleanItemProduct) ||
                    itemProductBase.includes(cleanProductName) ||
                    extractedFlavor === cleanProductName ||
                    cleanProductName === extractedFlavor;

                // Cuando el stock tiene peso, exigir que el sabor del ítem sea exactamente el del producto
                // (extractedFlavor === cleanProductName) para no contar ítems como "POLLO CON VERDURAS" en fila "POLLO 10KG"
                const strictFlavorMatch = !normalizedStockWeight || extractedFlavor === cleanProductName;

                if (nameMatch && strictFlavorMatch) {
                    if (normalizedStockWeight || normalizedItemWeight) {
                        isMatch = normalizedStockWeight === normalizedItemWeight;
                    } else {
                        isMatch = true;
                    }
                }

                // Fallback por sabor extraído (igual que front); con peso exige extractedFlavor === cleanProductName
                if (!isMatch && extractedFlavor) {
                    const flavorMatch = extractedFlavor === cleanProductName;
                    if (flavorMatch && (!normalizedStockWeight || flavorMatch)) {
                        if (normalizedStockWeight || normalizedItemWeight) {
                            isMatch = normalizedStockWeight === normalizedItemWeight;
                        } else {
                            isMatch = true;
                        }
                    }
                }

                // Fallback HUESOS CARNOSOS y prefijos (igual que front)
                if (!isMatch) {
                    let extractedAlt = itemProduct;
                    extractedAlt = extractedAlt.replace(/^(BARF\s*\/\s*|MEDALLONES\s*\/\s*)/i, '');
                    extractedAlt = extractedAlt.replace(/^BOX\s+PERRO\s+/i, '');
                    extractedAlt = extractedAlt.replace(/^BOX\s+GATO\s+/i, '');
                    extractedAlt = extractedAlt.replace(/\s*\(?\d+\s*KG\)?/gi, '');
                    extractedAlt = extractedAlt.trim();

                    const fallbackNameMatch = extractedAlt === cleanProductName || cleanItemProduct.includes(extractedAlt) || cleanProductName.includes(extractedAlt);
                    if (fallbackNameMatch && (!normalizedStockWeight || extractedAlt === cleanProductName)) {
                        if (normalizedStockWeight || normalizedItemWeight) {
                            isMatch = normalizedStockWeight === normalizedItemWeight;
                        } else {
                            isMatch = true;
                        }
                    }
                }
            }

            if (isMatch) {
                const quantity = item.quantity || item.options?.[0]?.quantity || 1;
                totalQuantity += quantity;
                console.log(`         ✅ MATCH! Quantity: ${quantity}, Total so far: ${totalQuantity}`);
            } else {
                console.log(`         ❌ No match`);
            }
        });
    });

    console.log(`\n   🎯 FINAL RESULT: ${totalQuantity} units for "${product.product}" (${product.weight || 'no weight'})\n`);
    return totalQuantity;
}
