import 'server-only';
import { getCollection, ObjectId } from '@repo/database';
import { format } from 'date-fns';

interface MarkWhatsAppContactedParams {
    clientEmails: string[];
}

/**
 * Marca clientes como contactados por WhatsApp
 * Actualiza el campo whatsappContactedAt en la colección orders
 * @param clientEmails Array de emails de clientes a marcar
 * @returns Resultado de la operación
 */
export async function markWhatsAppContacted({ clientEmails }: MarkWhatsAppContactedParams): Promise<{
    success: boolean;
    message?: string;
    error?: string;
    updatedCount?: number;
}> {
    try {
        const collection = await getCollection('orders');
        const now = format(new Date(), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");

        // Actualizar todas las órdenes de los clientes especificados
        const result = await collection.updateMany(
            { 'user.email': { $in: clientEmails } },
            {
                $set: {
                    whatsappContactedAt: now
                }
            }
        );

        return {
            success: true,
            message: `${result.modifiedCount} órdenes actualizadas con contacto por WhatsApp`,
            updatedCount: result.modifiedCount
        };

    } catch (error) {
        console.error('Error marking clients as WhatsApp contacted:', error);
        return {
            success: false,
            error: 'Error al marcar clientes como contactados por WhatsApp'
        };
    }
}

/**
 * Obtiene el estado de contacto por WhatsApp para una lista de clientes
 * Consulta la colección orders para obtener el campo whatsappContactedAt
 * @param clientEmails Array de emails de clientes
 * @returns Array con el estado de contacto de cada cliente
 */
export async function getWhatsAppContactStatus(clientEmails: string[]): Promise<{
    success: boolean;
    data?: Array<{ clientEmail: string; whatsappContactedAt: Date | null }>;
    error?: string;
}> {
    try {
        const collection = await getCollection('orders');

        // Obtener la fecha más reciente de contacto por WhatsApp para cada cliente
        const pipeline = [
            {
                $match: {
                    'user.email': { $in: clientEmails }
                }
            },
            {
                $group: {
                    _id: '$user.email',
                    whatsappContactedAt: { $max: '$whatsappContactedAt' }
                }
            }
        ];

        const contacts = await collection.aggregate(pipeline).toArray();

        // Crear un mapa para acceso rápido
        const contactMap = new Map();
        contacts.forEach(contact => {
            contactMap.set(contact._id, contact.whatsappContactedAt);
        });

        // Crear resultado para todos los emails solicitados
        const result = clientEmails.map(email => ({
            clientEmail: email,
            whatsappContactedAt: contactMap.get(email) || null
        }));

        return {
            success: true,
            data: result
        };

    } catch (error) {
        console.error('Error getting WhatsApp contact status:', error);
        return {
            success: false,
            error: 'Error al obtener el estado de contacto por WhatsApp'
        };
    }
} 