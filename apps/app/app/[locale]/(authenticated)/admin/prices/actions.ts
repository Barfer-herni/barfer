'use server'

import { updateProductPrice, initializeBarferPrices, getAllPrices } from '@repo/data-services';
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

        const result = await updateProductPrice(priceId, { price: newPrice });

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

        const result = await getAllPrices();
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