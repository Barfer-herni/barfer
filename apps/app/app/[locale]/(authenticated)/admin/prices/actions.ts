'use server'

import { updateProductPrice, initializeBarferPrices, getAllPrices } from '@repo/data-services';
import { revalidatePath } from 'next/cache';

export async function updatePriceAction(priceId: string, newPrice: number) {
    try {
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