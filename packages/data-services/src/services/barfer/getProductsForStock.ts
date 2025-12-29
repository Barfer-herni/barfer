import 'server-only';
import { getCollection } from '@repo/database';
import type { PriceSection } from '../../types/barfer';

export interface ProductForStock {
    section: PriceSection;
    product: string;
    weight: string | null;
    formattedName: string; // "section - product - weight" o "section - product"
}

/**
 * Obtener productos de prices filtrados por categorías para la tabla de stock
 * Filtra por: PERRO, GATO, OTROS (y productos que contengan "VACA" en cualquier sección)
 * Excluye de OTROS: CORNALITOS, CALDO DE HUESOS, GARRAS, HUESO RECREATIVO, HUESOS RECREATIVOS
 */
export async function getProductsForStock(): Promise<{
    success: boolean;
    products?: ProductForStock[];
    error?: string;
}> {
    try {
        const collection = await getCollection('prices');

        // Obtener fecha actual en formato correcto
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

        // Productos de OTROS que NO queremos mostrar
        const excludedOtrosProducts = ['CORNALITOS', 'CALDO DE HUESOS', 'GARRAS', 'HUESO RECREATIVO', 'HUESOS RECREATIVOS'];
        
        // Pipeline para obtener productos únicos de PERRO, GATO, OTROS, y productos que contengan "VACA"
        // PERRO: todos los productos de la sección PERRO
        // GATO: todos los productos de la sección GATO (POLLO, VACA, CORDERO, etc.)
        // OTROS: todos los productos de la sección OTROS (los excluidos se filtrarán después)
        // VACA: productos que contengan "VACA" en el nombre (puede estar en cualquier sección)
        const pipeline = [
            {
                $match: {
                    isActive: true,
                    effectiveDate: { $lte: todayStr },
                    $or: [
                        { section: 'PERRO' }, // Todos los productos de PERRO
                        { section: 'GATO' }, // Todos los productos de GATO (POLLO, VACA, CORDERO, etc.)
                        { section: 'OTROS' }, // Todos los productos de OTROS (se filtrarán después)
                        { product: { $regex: 'VACA', $options: 'i' } } // Productos que contengan "VACA" (incluye BIG DOG VACA, etc.)
                    ]
                }
            },
            {
                $sort: { effectiveDate: -1, createdAt: -1 }
            },
            {
                // Normalizar a mayúsculas para agrupar correctamente
                $addFields: {
                    sectionUpper: { $toUpper: "$section" },
                    productUpper: { $toUpper: "$product" },
                    weightUpper: {
                        $cond: [
                            { $eq: ["$weight", null] },
                            null,
                            { $toUpper: "$weight" }
                        ]
                    }
                }
            },
            {
                $group: {
                    _id: {
                        section: "$sectionUpper",
                        product: "$productUpper",
                        weight: "$weightUpper"
                    },
                    latestPrice: { $first: "$$ROOT" }
                }
            },
            {
                $replaceRoot: { newRoot: "$latestPrice" }
            },
            {
                $project: {
                    section: { $toUpper: "$section" },
                    product: { $toUpper: "$product" },
                    weight: {
                        $cond: [
                            { $eq: ["$weight", null] },
                            null,
                            { $toUpper: "$weight" }
                        ]
                    }
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

        const products = await collection.aggregate(pipeline).toArray();

        // Filtrar productos excluidos de OTROS
        const filteredProducts = products.filter(p => {
            if (p.section === 'OTROS') {
                const productUpper = (p.product || '').toUpperCase();
                // Excluir productos que contengan alguno de los nombres excluidos
                return !excludedOtrosProducts.some(excluded => 
                    productUpper.includes(excluded.toUpperCase())
                );
            }
            return true;
        });

        // Formatear productos
        const productsWithDetails: ProductForStock[] = filteredProducts.map(p => {
            const parts = [p.section, p.product];
            if (p.weight) {
                parts.push(p.weight);
            }
            const formattedName = parts.join(' - ');

            return {
                section: p.section as PriceSection,
                product: p.product,
                weight: p.weight,
                formattedName
            };
        });

        // Eliminar duplicados
        const uniqueProducts = productsWithDetails.filter((product, index, self) =>
            index === self.findIndex(p => 
                p.section === product.section &&
                p.product === product.product &&
                p.weight === product.weight
            )
        );

        return {
            success: true,
            products: uniqueProducts
        };
    } catch (error) {
        console.error('Error getting products for stock:', error);
        return {
            success: false,
            error: 'Error al obtener los productos para stock',
            products: []
        };
    }
}

