import { ObjectId, getCollection } from '@repo/database';
import type { OrderPriority, CreateOrderPriorityData, UpdateOrderPriorityData } from '../types/barfer';

/**
 * Obtener el ordenamiento guardado para una fecha y punto de envío específicos
 */
export async function getOrderPriority(fecha: string, puntoEnvio: string): Promise<{
    success: boolean;
    orderPriority?: OrderPriority;
    error?: string;
}> {
    try {
        const orderPriorityCollection = await getCollection('order_priority');

        const doc = await orderPriorityCollection.findOne({
            fecha,
            puntoEnvio,
        });

        if (!doc) {
            // No hay ordenamiento guardado para esta fecha/punto
            return {
                success: true,
                orderPriority: undefined,
            };
        }

        const orderPriority: OrderPriority = {
            _id: doc._id.toString(),
            fecha: doc.fecha,
            puntoEnvio: doc.puntoEnvio,
            orderIds: doc.orderIds || [],
            createdAt: doc.createdAt?.toISOString() || new Date().toISOString(),
            updatedAt: doc.updatedAt?.toISOString() || new Date().toISOString(),
        };

        return {
            success: true,
            orderPriority,
        };
    } catch (error) {
        console.error('Error in getOrderPriority:', error);
        return {
            success: false,
            error: 'GET_ORDER_PRIORITY_ERROR',
        };
    }
}

/**
 * Guardar o actualizar el ordenamiento de pedidos
 * Usa upsert para crear o actualizar el documento
 */
export async function saveOrderPriority(data: CreateOrderPriorityData): Promise<{
    success: boolean;
    orderPriority?: OrderPriority;
    message?: string;
    error?: string;
}> {
    try {
        const orderPriorityCollection = await getCollection('order_priority');

        const now = new Date();

        // Usar upsert para crear o actualizar
        const result = await orderPriorityCollection.findOneAndUpdate(
            {
                fecha: data.fecha,
                puntoEnvio: data.puntoEnvio,
            },
            {
                $set: {
                    orderIds: data.orderIds,
                    updatedAt: now,
                },
                $setOnInsert: {
                    createdAt: now,
                },
            },
            {
                upsert: true,
                returnDocument: 'after',
            }
        );

        if (!result) {
            return {
                success: false,
                message: 'Error al guardar el orden de prioridad',
                error: 'SAVE_ORDER_PRIORITY_ERROR',
            };
        }

        const orderPriority: OrderPriority = {
            _id: result._id.toString(),
            fecha: result.fecha,
            puntoEnvio: result.puntoEnvio,
            orderIds: result.orderIds || [],
            createdAt: result.createdAt?.toISOString() || now.toISOString(),
            updatedAt: result.updatedAt?.toISOString() || now.toISOString(),
        };

        return {
            success: true,
            orderPriority,
            message: 'Orden de prioridad guardado exitosamente',
        };
    } catch (error) {
        console.error('Error in saveOrderPriority:', error);
        return {
            success: false,
            message: 'Error al guardar el orden de prioridad',
            error: 'SAVE_ORDER_PRIORITY_ERROR',
        };
    }
}

/**
 * Actualizar solo el array de orderIds
 */
export async function updateOrderPriority(
    fecha: string,
    puntoEnvio: string,
    data: UpdateOrderPriorityData
): Promise<{
    success: boolean;
    orderPriority?: OrderPriority;
    message?: string;
    error?: string;
}> {
    try {
        const orderPriorityCollection = await getCollection('order_priority');

        const now = new Date();

        const result = await orderPriorityCollection.findOneAndUpdate(
            {
                fecha,
                puntoEnvio,
            },
            {
                $set: {
                    orderIds: data.orderIds,
                    updatedAt: now,
                },
            },
            {
                returnDocument: 'after',
            }
        );

        if (!result) {
            return {
                success: false,
                message: 'Orden de prioridad no encontrado',
                error: 'ORDER_PRIORITY_NOT_FOUND',
            };
        }

        const orderPriority: OrderPriority = {
            _id: result._id.toString(),
            fecha: result.fecha,
            puntoEnvio: result.puntoEnvio,
            orderIds: result.orderIds || [],
            createdAt: result.createdAt?.toISOString() || now.toISOString(),
            updatedAt: result.updatedAt?.toISOString() || now.toISOString(),
        };

        return {
            success: true,
            orderPriority,
            message: 'Orden de prioridad actualizado exitosamente',
        };
    } catch (error) {
        console.error('Error in updateOrderPriority:', error);
        return {
            success: false,
            message: 'Error al actualizar el orden de prioridad',
            error: 'UPDATE_ORDER_PRIORITY_ERROR',
        };
    }
}
