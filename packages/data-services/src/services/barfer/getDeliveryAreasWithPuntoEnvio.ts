import 'server-only';
import { getCollection } from '@repo/database';
import type { DeliveryArea } from '../../types/barfer';

/**
 * Obtener todas las delivery areas que tienen el campo puntoEnvio
 * Estas son las que se usan como puntos de envío express
 */
export async function getDeliveryAreasWithPuntoEnvio(): Promise<{
    success: boolean;
    deliveryAreas?: DeliveryArea[];
    message?: string;
}> {
    try {
        const collection = await getCollection('deliveryareas');

        // Filtrar solo las que tienen el campo puntoEnvio definido
        const deliveryAreas = await collection
            .find({
                puntoEnvio: { $exists: true, $ne: null, $nin: ['', null] }
            })
            .sort({ puntoEnvio: 1 })
            .toArray();

        return {
            success: true,
            deliveryAreas: deliveryAreas.map((area) => ({
                _id: area._id.toString(),
                description: area.description,
                coordinates: area.coordinates,
                schedule: area.schedule,
                orderCutOffHour: area.orderCutOffHour,
                enabled: area.enabled,
                sameDayDelivery: area.sameDayDelivery,
                sameDayDeliveryDays: area.sameDayDeliveryDays,
                whatsappNumber: area.whatsappNumber,
                sheetName: area.sheetName,
                puntoEnvio: area.puntoEnvio,
                createdAt: area.createdAt instanceof Date ? area.createdAt.toISOString() : area.createdAt,
                updatedAt: area.updatedAt instanceof Date ? area.updatedAt.toISOString() : area.updatedAt,
            })),
        };
    } catch (error) {
        console.error('Error al obtener delivery areas con puntoEnvio:', error);
        return {
            success: false,
            deliveryAreas: [],
            message: 'Error al obtener las delivery areas',
        };
    }
}

