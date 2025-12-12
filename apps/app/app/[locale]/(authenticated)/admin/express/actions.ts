'use server';

import { revalidatePath } from 'next/cache';
import {
    getDeliveryAreasWithPuntoEnvio,
    createStockMongo,
    getStockByPuntoEnvioMongo,
    getDetalleEnvioByPuntoEnvioMongo,
    getExpressOrders,
    createPuntoEnvioMongo,
} from '@repo/data-services';

export async function getDeliveryAreasWithPuntoEnvioAction() {
    try {
        return await getDeliveryAreasWithPuntoEnvio();
    } catch (error) {
        console.error('Error getting delivery areas:', error);
        return {
            success: false,
            deliveryAreas: [],
        };
    }
}

export async function getExpressOrdersAction(puntoEnvio?: string) {
    try {
        const orders = await getExpressOrders(puntoEnvio);
        return {
            success: true,
            orders,
        };
    } catch (error) {
        console.error('Error getting express orders:', error);
        return {
            success: false,
            orders: [],
        };
    }
}

export async function createStockAction(data: {
    puntoEnvio: string;
    producto: string;
    peso?: string;
    stockInicial: number;
    llevamos: number;
    pedidosDelDia: number;
    stockFinal?: number;
    fecha?: string;
}) {
    try {
        const result = await createStockMongo(data);

        if (result.success) {
            revalidatePath('/admin/express');
        }

        return result;
    } catch (error) {
        console.error('Error creating stock:', error);
        return {
            success: false,
            message: 'Error al crear el stock',
        };
    }
}

export async function getStockByPuntoEnvioAction(puntoEnvio: string) {
    try {
        return await getStockByPuntoEnvioMongo(puntoEnvio);
    } catch (error) {
        console.error('Error getting stock:', error);
        return {
            success: false,
            stock: [],
        };
    }
}

export async function getDetalleEnvioByPuntoEnvioAction(puntoEnvio: string) {
    try {
        return await getDetalleEnvioByPuntoEnvioMongo(puntoEnvio);
    } catch (error) {
        console.error('Error getting detalle:', error);
        return {
            success: false,
            detalleEnvio: [],
        };
    }
}

export async function createPuntoEnvioAction(data: { nombre: string }) {
    try {
        const result = await createPuntoEnvioMongo(data);

        if (result.success) {
            revalidatePath('/admin/express');
        }

        return result;
    } catch (error) {
        console.error('Error creating punto de envío:', error);
        return {
            success: false,
            message: 'Error al crear el punto de envío',
        };
    }
}

