import 'server-only';
import { getCollection, ObjectId } from '@repo/database';
import type { Order } from '../../types/barfer';

type EstadoEnvio = 'pendiente' | 'pidiendo' | 'en-viaje' | 'listo';

/**
 * Actualiza únicamente el estado de envío de una orden
 * @param orderId - ID de la orden a actualizar
 * @param estadoEnvio - Nuevo estado de envío
 * @returns Objeto con success y la orden actualizada o error
 */
export async function updateEstadoEnvio(
    orderId: string,
    estadoEnvio: EstadoEnvio
): Promise<{ success: boolean; order?: Order; error?: string }> {
    try {
        console.log(`[updateEstadoEnvio] Actualizando orden ${orderId} a estado: ${estadoEnvio}`);

        const collection = await getCollection('orders');

        // Validar que el ID sea válido
        if (!ObjectId.isValid(orderId)) {
            return {
                success: false,
                error: 'ID de orden inválido',
            };
        }

        // Actualizar solo el campo estadoEnvio
        const result = await collection.findOneAndUpdate(
            { _id: new ObjectId(orderId) },
            {
                $set: {
                    estadoEnvio,
                    updatedAt: new Date(),
                },
            },
            { returnDocument: 'after' }
        );

        if (!result) {
            console.error(`[updateEstadoEnvio] Orden no encontrada: ${orderId}`);
            return {
                success: false,
                error: 'Orden no encontrada',
            };
        }

        console.log(`[updateEstadoEnvio] Orden actualizada exitosamente: ${orderId}`);

        // Convertir el resultado a Order
        const updatedOrder: Order = {
            _id: result._id.toString(),
            status: result.status,
            total: result.total,
            items: result.items,
            subTotal: result.subTotal,
            shippingPrice: result.shippingPrice,
            notes: result.notes,
            notesOwn: result.notesOwn,
            address: result.address,
            user: result.user,
            paymentMethod: result.paymentMethod,
            coupon: result.coupon,
            deliveryArea: result.deliveryArea,
            orderType: result.orderType,
            deliveryDay: result.deliveryDay,
            puntoEnvio: result.puntoEnvio,
            estadoEnvio: result.estadoEnvio,
            whatsappContactedAt: result.whatsappContactedAt,
            createdAt: result.createdAt,
            updatedAt: result.updatedAt,
        };

        return {
            success: true,
            order: updatedOrder,
        };
    } catch (error) {
        console.error('[updateEstadoEnvio] Error al actualizar estado de envío:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido',
        };
    }
}

