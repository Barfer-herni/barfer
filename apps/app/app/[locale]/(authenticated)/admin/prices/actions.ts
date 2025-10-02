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
    initializeProductosGestor,
    normalizePricesCapitalization,
    removeDuplicatePrices
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

export async function normalizePricesCapitalizationAction() {
    try {
        // Verificar permisos de edición
        const canEditPrices = await hasPermission('prices:edit');
        if (!canEditPrices) {
            return {
                success: false,
                message: 'No tienes permisos para normalizar precios',
                error: 'INSUFFICIENT_PERMISSIONS',
                updated: 0
            };
        }

        const result = await normalizePricesCapitalization();

        if (result.success) {
            revalidatePath('/admin/prices');
        }

        return result;
    } catch (error) {
        console.error('Error normalizing prices capitalization:', error);
        return {
            success: false,
            message: 'Error al normalizar capitalización de precios',
            error: 'NORMALIZE_PRICES_ACTION_ERROR',
            updated: 0
        };
    }
}

export async function removeDuplicatePricesAction() {
    try {
        // Verificar permisos de edición
        const canEditPrices = await hasPermission('prices:edit');
        if (!canEditPrices) {
            return {
                success: false,
                message: 'No tienes permisos para eliminar duplicados',
                error: 'INSUFFICIENT_PERMISSIONS',
                removed: 0
            };
        }

        const result = await removeDuplicatePrices();

        if (result.success) {
            revalidatePath('/admin/prices');
        }

        return result;
    } catch (error) {
        console.error('Error removing duplicate prices:', error);
        return {
            success: false,
            message: 'Error al eliminar precios duplicados',
            error: 'REMOVE_DUPLICATES_ACTION_ERROR',
            removed: 0
        };
    }
}
