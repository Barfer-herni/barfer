'use server'

import {
    updateBarferPrice,
    deleteBarferPrice,
    getAllUniqueBarferProducts,
    deleteBarferProductPrices,
    updateBarferProductPrices,
    updateBarferProductPriceTypes,
    initializeBarferPrices,
    getAllBarferPrices,
    getPricesByMonth,
    initializePricesForPeriod,
    createBarferPrice,
    getAllProductosGestor,
    createProductoGestor,
    updateProductoGestor,
    deleteProductoGestor,
    initializeProductosGestor
} from '@repo/data-services';
import type { CreateProductoGestorData, UpdateProductoGestorData, CreatePriceData } from '@repo/data-services';
import { revalidatePath } from 'next/cache';
import { hasPermission } from '@repo/auth/server-permissions';

export async function updatePriceAction(priceId: string, newPrice: number) {
    try {
        // Verificar permisos de edición
        const canEditPrices = await hasPermission('prices:edit');
        if (!canEditPrices) {
            return {
                success: false,
                message: 'No tienes permisos para editar precios',
                error: 'INSUFFICIENT_PERMISSIONS'
            };
        }

        const result = await updateBarferPrice(priceId, { price: newPrice });

        if (result.success) {
            revalidatePath('/admin/prices');
        }

        return result;
    } catch (error) {
        console.error('Error updating price:', error);
        return {
            success: false,
            message: 'Error al actualizar el precio',
            error: 'UPDATE_PRICE_ACTION_ERROR'
        };
    }
}

export async function initializeDefaultPricesAction() {
    try {
        // Verificar permisos de edición
        const canEditPrices = await hasPermission('prices:edit');
        if (!canEditPrices) {
            return {
                success: false,
                message: 'No tienes permisos para inicializar precios',
                error: 'INSUFFICIENT_PERMISSIONS'
            };
        }

        const result = await initializeBarferPrices();

        if (result.success) {
            revalidatePath('/admin/prices');
        }

        return result;
    } catch (error) {
        console.error('Error initializing prices:', error);
        return {
            success: false,
            message: 'Error al inicializar los precios',
            error: 'INITIALIZE_PRICES_ACTION_ERROR'
        };
    }
}

export async function getAllPricesAction() {
    try {
        // Verificar permisos de visualización
        const canViewPrices = await hasPermission('prices:view');
        if (!canViewPrices) {
            return {
                success: false,
                message: 'No tienes permisos para ver precios',
                error: 'INSUFFICIENT_PERMISSIONS',
                prices: [],
                total: 0
            };
        }

        const result = await getAllBarferPrices();
        return result;
    } catch (error) {
        console.error('Error getting all prices:', error);
        return {
            success: false,
            message: 'Error al obtener los precios',
            error: 'GET_ALL_PRICES_ACTION_ERROR',
            prices: [],
            total: 0
        };
    }
}

export async function getPricesByMonthAction(month: number, year: number) {
    try {
        // Verificar permisos de visualización
        const canViewPrices = await hasPermission('prices:view');
        if (!canViewPrices) {
            return {
                success: false,
                message: 'No tienes permisos para ver precios',
                error: 'INSUFFICIENT_PERMISSIONS',
                prices: [],
                total: 0
            };
        }

        const result = await getPricesByMonth(month, year);
        return result;
    } catch (error) {
        console.error('Error getting prices by month:', error);
        return {
            success: false,
            message: 'Error al obtener los precios del mes',
            error: 'GET_PRICES_BY_MONTH_ACTION_ERROR',
            prices: [],
            total: 0
        };
    }
}

export async function initializePricesForPeriodAction(month: number, year: number) {
    try {
        // Verificar permisos de edición
        const canEditPrices = await hasPermission('prices:edit');
        if (!canEditPrices) {
            return {
                success: false,
                message: 'No tienes permisos para inicializar precios',
                error: 'INSUFFICIENT_PERMISSIONS'
            };
        }

        const result = await initializePricesForPeriod(month, year);
        return result;
    } catch (error) {
        console.error('Error initializing prices for period:', error);
        return {
            success: false,
            message: 'Error al inicializar precios para el período',
            error: 'INITIALIZE_PERIOD_ACTION_ERROR'
        };
    }
}

// ===== ACCIONES PARA PRODUCTOS GESTOR =====

export async function getAllProductosGestorAction() {
    try {
        const canViewPrices = await hasPermission('prices:view');
        if (!canViewPrices) {
            return {
                success: false,
                message: 'No tienes permisos para ver productos',
                error: 'INSUFFICIENT_PERMISSIONS',
                productos: [],
                total: 0
            };
        }
        const result = await getAllProductosGestor();
        return result;
    } catch (error) {
        console.error('Error getting productos gestor:', error);
        return {
            success: false,
            message: 'Error al obtener los productos',
            error: 'GET_PRODUCTOS_GESTOR_ACTION_ERROR',
            productos: [],
            total: 0
        };
    }
}

export async function createProductoGestorAction(data: CreateProductoGestorData) {
    try {
        const canEditPrices = await hasPermission('prices:edit');
        if (!canEditPrices) {
            return {
                success: false,
                message: 'No tienes permisos para crear productos',
                error: 'INSUFFICIENT_PERMISSIONS'
            };
        }
        const result = await createProductoGestor(data);
        return result;
    } catch (error) {
        console.error('Error creating producto gestor:', error);
        return {
            success: false,
            message: 'Error al crear el producto',
            error: 'CREATE_PRODUCTO_GESTOR_ACTION_ERROR'
        };
    }
}

export async function updateProductoGestorAction(productoId: string, data: UpdateProductoGestorData) {
    try {
        const canEditPrices = await hasPermission('prices:edit');
        if (!canEditPrices) {
            return {
                success: false,
                message: 'No tienes permisos para editar productos',
                error: 'INSUFFICIENT_PERMISSIONS'
            };
        }
        const result = await updateProductoGestor(productoId, data);
        return result;
    } catch (error) {
        console.error('Error updating producto gestor:', error);
        return {
            success: false,
            message: 'Error al actualizar el producto',
            error: 'UPDATE_PRODUCTO_GESTOR_ACTION_ERROR'
        };
    }
}

export async function deleteProductoGestorAction(productoId: string) {
    try {
        const canEditPrices = await hasPermission('prices:edit');
        if (!canEditPrices) {
            return {
                success: false,
                message: 'No tienes permisos para eliminar productos',
                error: 'INSUFFICIENT_PERMISSIONS'
            };
        }
        const result = await deleteProductoGestor(productoId);
        return result;
    } catch (error) {
        console.error('Error deleting producto gestor:', error);
        return {
            success: false,
            message: 'Error al eliminar el producto',
            error: 'DELETE_PRODUCTO_GESTOR_ACTION_ERROR'
        };
    }
}

export async function initializeProductosGestorAction() {
    try {
        const canEditPrices = await hasPermission('prices:edit');
        if (!canEditPrices) {
            return {
                success: false,
                message: 'No tienes permisos para inicializar productos',
                error: 'INSUFFICIENT_PERMISSIONS'
            };
        }
        const result = await initializeProductosGestor();
        return result;
    } catch (error) {
        console.error('Error initializing productos gestor:', error);
        return {
            success: false,
            message: 'Error al inicializar productos del gestor',
            error: 'INITIALIZE_PRODUCTOS_GESTOR_ACTION_ERROR'
        };
    }
}

export async function createPriceAction(data: CreatePriceData) {
    try {
        // Verificar permisos de edición
        const canEditPrices = await hasPermission('prices:edit');
        if (!canEditPrices) {
            return {
                success: false,
                message: 'No tienes permisos para crear precios',
                error: 'INSUFFICIENT_PERMISSIONS'
            };
        }

        const result = await createBarferPrice(data);

        if (result.success) {
            revalidatePath('/admin/prices');
        }

        return result;
    } catch (error) {
        console.error('Error creating price:', error);
        return {
            success: false,
            message: 'Error al crear el precio',
            error: 'CREATE_PRICE_ACTION_ERROR'
        };
    }
}

export async function deletePriceAction(priceId: string) {
    try {
        // Verificar permisos de edición
        const canEditPrices = await hasPermission('prices:edit');
        if (!canEditPrices) {
            return {
                success: false,
                message: 'No tienes permisos para eliminar precios',
                error: 'INSUFFICIENT_PERMISSIONS'
            };
        }

        const result = await deleteBarferPrice(priceId);

        if (result.success) {
            revalidatePath('/admin/prices');
        }

        return result;
    } catch (error) {
        console.error('Error deleting price:', error);
        return {
            success: false,
            message: 'Error al eliminar el precio',
            error: 'DELETE_PRICE_ACTION_ERROR'
        };
    }
}

export async function getAllUniqueProductsAction() {
    try {
        // Verificar permisos de visualización
        const canViewPrices = await hasPermission('prices:view');
        if (!canViewPrices) {
            return {
                success: false,
                message: 'No tienes permisos para ver productos',
                error: 'INSUFFICIENT_PERMISSIONS',
                products: []
            };
        }

        const result = await getAllUniqueBarferProducts();
        return result;
    } catch (error) {
        console.error('Error getting unique products:', error);
        return {
            success: false,
            message: 'Error al obtener los productos únicos',
            error: 'GET_UNIQUE_PRODUCTS_ACTION_ERROR',
            products: []
        };
    }
}

export async function deleteProductAction(section: string, product: string, weight: string | null) {
    try {
        // Verificar permisos de edición
        const canEditPrices = await hasPermission('prices:edit');
        if (!canEditPrices) {
            return {
                success: false,
                message: 'No tienes permisos para eliminar productos',
                error: 'INSUFFICIENT_PERMISSIONS',
                deletedCount: 0
            };
        }

        const result = await deleteBarferProductPrices(section as any, product, weight);

        if (result.success) {
            revalidatePath('/admin/prices');
        }

        return result;
    } catch (error) {
        console.error('Error deleting product:', error);
        return {
            success: false,
            message: 'Error al eliminar el producto',
            error: 'DELETE_PRODUCT_ACTION_ERROR',
            deletedCount: 0
        };
    }
}

export async function updateProductAction(
    oldSection: string,
    oldProduct: string,
    oldWeight: string | null,
    newData: {
        section?: string;
        product?: string;
        weight?: string | null;
    }
) {
    try {
        // Verificar permisos de edición
        const canEditPrices = await hasPermission('prices:edit');
        if (!canEditPrices) {
            return {
                success: false,
                message: 'No tienes permisos para editar productos',
                error: 'INSUFFICIENT_PERMISSIONS',
                updatedCount: 0
            };
        }

        const result = await updateBarferProductPrices(
            oldSection as any,
            oldProduct,
            oldWeight,
            {
                section: newData.section as any,
                product: newData.product,
                weight: newData.weight
            }
        );

        if (result.success) {
            revalidatePath('/admin/prices');
        }

        return result;
    } catch (error) {
        console.error('Error updating product:', error);
        return {
            success: false,
            message: 'Error al actualizar el producto',
            error: 'UPDATE_PRODUCT_ACTION_ERROR',
            updatedCount: 0
        };
    }
}

export async function updateProductPriceTypesAction(
    section: string,
    product: string,
    weight: string | null,
    oldPriceTypes: string[],
    newPriceTypes: string[]
) {
    try {
        // Verificar permisos de edición
        const canEditPrices = await hasPermission('prices:edit');
        if (!canEditPrices) {
            return {
                success: false,
                message: 'No tienes permisos para editar tipos de precio',
                error: 'INSUFFICIENT_PERMISSIONS',
                addedCount: 0,
                removedCount: 0
            };
        }

        const result = await updateBarferProductPriceTypes(
            section as any,
            product,
            weight,
            oldPriceTypes as any[],
            newPriceTypes as any[]
        );

        if (result.success) {
            revalidatePath('/admin/prices');
        }

        return result;
    } catch (error) {
        console.error('Error updating product price types:', error);
        return {
            success: false,
            message: 'Error al actualizar los tipos de precio del producto',
            error: 'UPDATE_PRODUCT_PRICE_TYPES_ACTION_ERROR',
            addedCount: 0,
            removedCount: 0
        };
    }
}

export async function fixBigDogWeightAction() {
    try {
        // Verificar permisos de edición
        const canEditPrices = await hasPermission('prices:edit');
        if (!canEditPrices) {
            return {
                success: false,
                message: 'No tienes permisos para corregir datos',
                error: 'INSUFFICIENT_PERMISSIONS',
                fixedCount: 0
            };
        }

        const { getCollection } = await import('@repo/database');
        const collection = await getCollection('prices');

        // Buscar todos los productos BIG DOG
        const bigDogProducts = await collection.find({
            product: { $regex: /BIG DOG/ }
        }).toArray();

        console.log(`Found ${bigDogProducts.length} BIG DOG products`);

        let fixedCount = 0;

        // Actualizar cada producto BIG DOG para usar weight: "15KG"
        for (const product of bigDogProducts) {
            if (product.weight !== '15KG') {
                await collection.updateOne(
                    { _id: product._id },
                    {
                        $set: {
                            weight: '15KG',
                            updatedAt: new Date().toISOString()
                        }
                    }
                );
                fixedCount++;
                console.log(`Fixed ${product.product} - ${product.priceType} (was: ${product.weight || 'null'})`);
            }
        }

        revalidatePath('/admin/prices');

        return {
            success: true,
            message: `Se corrigieron ${fixedCount} productos BIG DOG para usar peso "15KG"`,
            fixedCount
        };
    } catch (error) {
        console.error('Error fixing BIG DOG weight:', error);
        return {
            success: false,
            message: 'Error al corregir el peso de productos BIG DOG',
            error: 'FIX_BIG_DOG_WEIGHT_ERROR',
            fixedCount: 0
        };
    }
}

export async function cleanBigDogDuplicatesAction() {
    try {
        // Verificar permisos de edición
        const canEditPrices = await hasPermission('prices:edit');
        if (!canEditPrices) {
            return {
                success: false,
                message: 'No tienes permisos para corregir datos',
                error: 'INSUFFICIENT_PERMISSIONS',
                cleanedCount: 0
            };
        }

        const { getCollection } = await import('@repo/database');
        const collection = await getCollection('prices');

        // Buscar todos los productos BIG DOG
        const allBigDogProducts = await collection.find({
            product: { $regex: /BIG DOG/ }
        }).toArray();

        console.log(`Found ${allBigDogProducts.length} total BIG DOG products`);

        // Agrupar manualmente por producto y tipo de precio (ignorando peso)
        const groups: { [key: string]: any[] } = {};

        allBigDogProducts.forEach((product: any) => {
            const key = `${product.product}-${product.priceType}`;
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(product);
        });

        // Filtrar solo grupos con duplicados
        const duplicateGroups = Object.entries(groups).filter(([key, products]) => products.length > 1);

        console.log(`Found ${duplicateGroups.length} BIG DOG groups with duplicates`);

        let cleanedCount = 0;

        // Para cada grupo de duplicados, mantener solo el más reciente y eliminar el resto
        for (const [key, products] of duplicateGroups) {
            // Ordenar por fecha de actualización (más reciente primero)
            products.sort((a: any, b: any) => {
                const dateA = new Date(a.updatedAt || a.createdAt);
                const dateB = new Date(b.updatedAt || b.createdAt);
                return dateB.getTime() - dateA.getTime();
            });

            // Mantener el primero (más reciente) y eliminar el resto
            const toKeep = products[0];
            const toDelete = products.slice(1);

            console.log(`Cleaning duplicates for ${key}: keeping 1, deleting ${toDelete.length}`);

            // Eliminar los duplicados
            for (const product of toDelete) {
                await collection.deleteOne({ _id: product._id });
                cleanedCount++;
                console.log(`Deleted duplicate: ${product.product} - ${product.priceType} - ${product.weight || 'null'}`);
            }

            // Asegurar que el producto que mantenemos tenga weight: "15KG"
            if (toKeep.weight !== '15KG') {
                await collection.updateOne(
                    { _id: toKeep._id },
                    {
                        $set: {
                            weight: '15KG',
                            updatedAt: new Date().toISOString()
                        }
                    }
                );
                console.log(`Updated weight to 15KG: ${toKeep.product} - ${toKeep.priceType}`);
            }
        }

        // Verificar que no queden productos BIG DOG con peso null
        const remainingBigDogProducts = await collection.find({
            product: { $regex: /BIG DOG/ },
            $or: [
                { weight: null },
                { weight: { $exists: false } }
            ]
        }).toArray();

        console.log(`Found ${remainingBigDogProducts.length} BIG DOG products with null weight`);

        // Actualizar todos los productos BIG DOG restantes para usar weight: "15KG"
        for (const product of remainingBigDogProducts) {
            await collection.updateOne(
                { _id: product._id },
                {
                    $set: {
                        weight: '15KG',
                        updatedAt: new Date().toISOString()
                    }
                }
            );
            console.log(`Updated null weight to 15KG: ${product.product} - ${product.priceType}`);
        }

        revalidatePath('/admin/prices');

        return {
            success: true,
            message: `Se eliminaron ${cleanedCount} productos BIG DOG duplicados y se corrigieron ${remainingBigDogProducts.length} pesos`,
            cleanedCount: cleanedCount + remainingBigDogProducts.length
        };
    } catch (error) {
        console.error('Error cleaning BIG DOG duplicates:', error);
        return {
            success: false,
            message: 'Error al limpiar duplicados de productos BIG DOG',
            error: 'CLEAN_BIG_DOG_DUPLICATES_ERROR',
            cleanedCount: 0
        };
    }
}

export async function recreateBigDogProductsAction() {
    try {
        // Verificar permisos de edición
        const canEditPrices = await hasPermission('prices:edit');
        if (!canEditPrices) {
            return {
                success: false,
                message: 'No tienes permisos para corregir datos',
                error: 'INSUFFICIENT_PERMISSIONS',
                recreatedCount: 0
            };
        }

        const { getCollection } = await import('@repo/database');
        const collection = await getCollection('prices');

        // 1. Eliminar TODOS los productos BIG DOG existentes
        const deleteResult = await collection.deleteMany({
            product: { $regex: /BIG DOG/ }
        });

        console.log(`Deleted ${deleteResult.deletedCount} existing BIG DOG products`);

        // 2. Crear los productos BIG DOG correctos
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1;
        const currentYear = currentDate.getFullYear();
        const effectiveDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
        const now = new Date().toISOString();

        const bigDogProducts = [
            // BIG DOG POLLO - 15KG
            {
                section: 'PERRO',
                product: 'BIG DOG POLLO',
                weight: '15KG',
                priceType: 'EFECTIVO',
                price: 0,
                isActive: true,
                effectiveDate,
                month: currentMonth,
                year: currentYear,
                createdAt: now,
                updatedAt: now
            },
            {
                section: 'PERRO',
                product: 'BIG DOG POLLO',
                weight: '15KG',
                priceType: 'TRANSFERENCIA',
                price: 0,
                isActive: true,
                effectiveDate,
                month: currentMonth,
                year: currentYear,
                createdAt: now,
                updatedAt: now
            },
            {
                section: 'PERRO',
                product: 'BIG DOG POLLO',
                weight: '15KG',
                priceType: 'MAYORISTA',
                price: 0,
                isActive: true,
                effectiveDate,
                month: currentMonth,
                year: currentYear,
                createdAt: now,
                updatedAt: now
            },
            // BIG DOG VACA - 15KG
            {
                section: 'PERRO',
                product: 'BIG DOG VACA',
                weight: '15KG',
                priceType: 'EFECTIVO',
                price: 0,
                isActive: true,
                effectiveDate,
                month: currentMonth,
                year: currentYear,
                createdAt: now,
                updatedAt: now
            },
            {
                section: 'PERRO',
                product: 'BIG DOG VACA',
                weight: '15KG',
                priceType: 'TRANSFERENCIA',
                price: 0,
                isActive: true,
                effectiveDate,
                month: currentMonth,
                year: currentYear,
                createdAt: now,
                updatedAt: now
            },
            {
                section: 'PERRO',
                product: 'BIG DOG VACA',
                weight: '15KG',
                priceType: 'MAYORISTA',
                price: 0,
                isActive: true,
                effectiveDate,
                month: currentMonth,
                year: currentYear,
                createdAt: now,
                updatedAt: now
            }
        ];

        // 3. Insertar los productos correctos
        const insertResult = await collection.insertMany(bigDogProducts);

        console.log(`Created ${insertResult.insertedCount} new BIG DOG products`);

        revalidatePath('/admin/prices');

        return {
            success: true,
            message: `Se eliminaron ${deleteResult.deletedCount} productos BIG DOG antiguos y se crearon ${insertResult.insertedCount} productos nuevos correctos`,
            recreatedCount: insertResult.insertedCount
        };
    } catch (error) {
        console.error('Error recreating BIG DOG products:', error);
        return {
            success: false,
            message: 'Error al recrear productos BIG DOG',
            error: 'RECREATE_BIG_DOG_PRODUCTS_ERROR',
            recreatedCount: 0
        };
    }
}

export async function ensureBigDogPricesCurrentMonthAction() {
    try {
        // Verificar permisos de edición
        const canEditPrices = await hasPermission('prices:edit');
        if (!canEditPrices) {
            return {
                success: false,
                message: 'No tienes permisos para corregir datos',
                error: 'INSUFFICIENT_PERMISSIONS',
                createdCount: 0
            };
        }

        const { getCollection } = await import('@repo/database');
        const collection = await getCollection('prices');

        // Obtener mes y año actual
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1;
        const currentYear = currentDate.getFullYear();

        console.log(`Verificando precios BIG DOG para ${currentMonth}/${currentYear}`);

        // Verificar si ya existen precios BIG DOG para el mes actual
        const existingBigDogPrices = await collection.find({
            product: { $regex: /BIG DOG/ },
            month: currentMonth,
            year: currentYear
        }).toArray();

        console.log(`Encontrados ${existingBigDogPrices.length} precios BIG DOG para ${currentMonth}/${currentYear}`);

        if (existingBigDogPrices.length >= 6) {
            // Ya existen los 6 precios necesarios (2 productos x 3 tipos de precio)
            return {
                success: true,
                message: `Ya existen ${existingBigDogPrices.length} precios BIG DOG para ${currentMonth}/${currentYear}`,
                createdCount: 0
            };
        }

        // Buscar precios BIG DOG más recientes para copiar
        const latestBigDogPrices = await collection.find({
            product: { $regex: /BIG DOG/ }
        }).sort({ year: -1, month: -1 }).limit(6).toArray();

        if (latestBigDogPrices.length === 0) {
            return {
                success: false,
                message: 'No se encontraron precios BIG DOG para copiar',
                error: 'NO_BIG_DOG_PRICES_FOUND',
                createdCount: 0
            };
        }

        // Crear precios para el mes actual basados en los más recientes
        const effectiveDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
        const now = new Date().toISOString();

        let createdCount = 0;

        for (const sourcePrice of latestBigDogPrices) {
            // Verificar si ya existe este precio para el mes actual
            const existingPrice = await collection.findOne({
                section: sourcePrice.section,
                product: sourcePrice.product,
                weight: sourcePrice.weight,
                priceType: sourcePrice.priceType,
                month: currentMonth,
                year: currentYear
            });

            if (!existingPrice) {
                const newPrice = {
                    section: sourcePrice.section,
                    product: sourcePrice.product,
                    weight: sourcePrice.weight,
                    priceType: sourcePrice.priceType,
                    price: sourcePrice.price,
                    isActive: true,
                    effectiveDate,
                    month: currentMonth,
                    year: currentYear,
                    createdAt: now,
                    updatedAt: now
                };

                await collection.insertOne(newPrice);
                createdCount++;
                console.log(`Creado precio para ${currentMonth}/${currentYear}: ${sourcePrice.product} - ${sourcePrice.priceType} - $${sourcePrice.price}`);
            }
        }

        revalidatePath('/admin/prices');

        return {
            success: true,
            message: `Se crearon ${createdCount} precios BIG DOG para ${currentMonth}/${currentYear}`,
            createdCount
        };
    } catch (error) {
        console.error('Error ensuring BIG DOG prices for current month:', error);
        return {
            success: false,
            message: 'Error al asegurar precios BIG DOG para el mes actual',
            error: 'ENSURE_BIG_DOG_PRICES_CURRENT_MONTH_ERROR',
            createdCount: 0
        };
    }
}