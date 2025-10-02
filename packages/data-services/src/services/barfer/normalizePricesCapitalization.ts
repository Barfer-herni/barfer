'use server';

import { getCollection } from '@repo/database';

/**
 * Normaliza la capitalización de todos los productos en la base de datos
 * Convierte section, product y weight a mayúsculas
 */
export async function normalizePricesCapitalization(): Promise<{
    success: boolean;
    message?: string;
    updated?: number;
    error?: string;
}> {
    try {
        const collection = await getCollection('prices');

        // Obtener todos los precios activos
        const allPrices = await collection.find({ isActive: true }).toArray();

        let updated = 0;

        for (const price of allPrices) {
            const updates: any = {};
            let needsUpdate = false;

            // Normalizar section
            if (price.section && price.section !== price.section.toUpperCase()) {
                updates.section = price.section.toUpperCase();
                needsUpdate = true;
            }

            // Normalizar product
            if (price.product && price.product !== price.product.toUpperCase()) {
                updates.product = price.product.toUpperCase();
                needsUpdate = true;
            }

            // Normalizar weight (si no es null)
            if (price.weight && price.weight !== price.weight.toUpperCase()) {
                updates.weight = price.weight.toUpperCase();
                needsUpdate = true;
            }

            // Actualizar si hay cambios
            if (needsUpdate) {
                await collection.updateOne(
                    { _id: price._id },
                    {
                        $set: {
                            ...updates,
                            updatedAt: new Date().toISOString()
                        }
                    }
                );
                updated++;
                console.log(`✅ Normalizado: ${price.section}/${price.product}/${price.weight} -> ${updates.section || price.section}/${updates.product || price.product}/${updates.weight || price.weight}`);
            }
        }

        return {
            success: true,
            message: `Se normalizaron ${updated} precios a mayúsculas`,
            updated
        };

    } catch (error) {
        console.error('Error normalizing prices capitalization:', error);
        return {
            success: false,
            error: 'Error al normalizar la capitalización de precios',
            updated: 0
        };
    }
}

/**
 * Elimina productos duplicados dejando solo el más reciente
 */
export async function removeDuplicatePrices(): Promise<{
    success: boolean;
    message?: string;
    removed?: number;
    error?: string;
}> {
    try {
        const collection = await getCollection('prices');

        // Primero normalizar todo
        await normalizePricesCapitalization();

        // Obtener fecha actual
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

        // Buscar duplicados: misma section, product, weight, priceType, isActive
        const pipeline = [
            {
                $match: {
                    isActive: true,
                    effectiveDate: { $lte: todayStr }
                }
            },
            {
                $sort: { effectiveDate: -1, createdAt: -1 }
            },
            {
                $group: {
                    _id: {
                        section: "$section",
                        product: "$product",
                        weight: "$weight",
                        priceType: "$priceType"
                    },
                    prices: { $push: "$$ROOT" },
                    count: { $sum: 1 }
                }
            },
            {
                $match: { count: { $gt: 1 } }
            }
        ];

        const duplicates = await collection.aggregate(pipeline).toArray();
        let removed = 0;

        for (const group of duplicates) {
            // Mantener el primero (más reciente) y desactivar el resto
            const [keep, ...toRemove] = group.prices;

            console.log(`🔍 Duplicados encontrados para ${group._id.section}/${group._id.product}/${group._id.weight} (${group._id.priceType}):`);
            console.log(`  ✅ Mantener: ${keep.effectiveDate} (${keep._id})`);

            for (const price of toRemove) {
                console.log(`  ❌ Desactivar: ${price.effectiveDate} (${price._id})`);
                await collection.updateOne(
                    { _id: price._id },
                    {
                        $set: {
                            isActive: false,
                            updatedAt: new Date().toISOString()
                        }
                    }
                );
                removed++;
            }
        }

        return {
            success: true,
            message: `Se desactivaron ${removed} precios duplicados`,
            removed
        };

    } catch (error) {
        console.error('Error removing duplicate prices:', error);
        return {
            success: false,
            error: 'Error al eliminar precios duplicados',
            removed: 0
        };
    }
}

