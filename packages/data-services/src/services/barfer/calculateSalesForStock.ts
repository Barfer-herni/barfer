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

    // Si el nombre del producto ya contiene la sección al principio (formato de la BD actual),
    // intentamos limpiarlo para el matching contra los items de la orden (que no suelen tenerlo)
    if (sectionUpper && productName.startsWith(sectionUpper)) {
        productName = productName.substring(sectionUpper.length).trim();
    }

    const productWeight = product.weight ? (product.weight || '').toUpperCase().trim().replace(/\s+/g, '') : null;

    orders.forEach(order => {
        if (!order.items) return;

        order.items.forEach((item: any) => {
            const itemProduct = (item.name || '').toUpperCase().trim();

            // 1. Validación de sección (Perro vs Gato)
            if (!sectionUpper.includes('OTROS')) {
                if (sectionUpper.includes('GATO')) {
                    if (!itemProduct.includes('GATO')) return;
                } else if (sectionUpper.includes('PERRO')) {
                    if (itemProduct.includes('GATO')) return;
                    if (!itemProduct.includes('PERRO') && !itemProduct.includes('BIG DOG')) return;
                }
            }

            let isMatch = false;

            // 2. Caso especial: Peso en el nombre del producto
            if (!productWeight && productName.match(/\d+KG/i)) {
                const productNameWithoutWeight = productName.replace(/\s*\d+KG.*$/i, '').trim();
                if (itemProduct.includes(productNameWithoutWeight)) {
                    if (item.options && item.options.length > 0) {
                        const itemOptionName = (item.options[0]?.name || '').toUpperCase().trim();
                        const productWeightMatch = productName.match(/(\d+KG)/i);
                        if (productWeightMatch && itemOptionName.includes(productWeightMatch[1])) {
                            isMatch = true;
                        }
                    }
                }
            }

            // 3. Comparación directa
            if (!isMatch && itemProduct === productName) isMatch = true;

            // 4. Comparación si el item incluye el nombre (con validación de peso)
            if (!isMatch && itemProduct.includes(productName)) {
                if (productWeight) {
                    let weightMatch = false;
                    if (item.options && item.options.length > 0) {
                        const itemWeight = (item.options[0]?.name || '').toUpperCase().trim().replace(/\s+/g, '');
                        if (itemWeight === productWeight) weightMatch = true;
                    } else if (itemProduct.replace(/\s+/g, '').includes(productWeight)) {
                        weightMatch = true;
                    }
                    if (weightMatch) isMatch = true;
                } else {
                    isMatch = true;
                }
            }

            // 5. Prefijos comunes (BARF /, MEDALLONES /)
            if (!isMatch) {
                const cleanItemName = itemProduct.replace(/^(BARF\s*\/\s*|MEDALLONES\s*\/\s*)/i, '');
                if (cleanItemName === productName) isMatch = true;
            }

            if (isMatch) {
                // Sumar cantidad del item. Si tiene opciones y cantidad en la opción, usar esa.
                // Ajuste: coincide con la lógica del frontend (ExpressPageClient.tsx)
                const quantity = item.quantity || item.options?.[0]?.quantity || 1;
                totalQuantity += quantity;
            }
        });
    });

    return totalQuantity;
}
