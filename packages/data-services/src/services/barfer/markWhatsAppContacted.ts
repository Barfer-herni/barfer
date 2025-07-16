import 'server-only';
import { getCollection } from '@repo/database';
import { format } from 'date-fns';

interface MarkWhatsAppContactedParams {
    clientEmails: string[];
}

interface UnmarkWhatsAppContactedParams {
    clientEmails: string[];
}

export interface WhatsAppContactStatus {
    clientEmail: string;
    whatsappContactedAt: Date | null;
}

export interface ClientVisibilityStatus {
    clientEmail: string;
    isHidden: boolean;
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
 * Desmarca clientes como contactados por WhatsApp (pone whatsappContactedAt en null)
 * @param clientEmails Array de emails de clientes a desmarcar
 * @returns Resultado de la operación
 */
export async function unmarkWhatsAppContacted({ clientEmails }: UnmarkWhatsAppContactedParams): Promise<{
    success: boolean;
    message?: string;
    error?: string;
    updatedCount?: number;
}> {
    try {
        const collection = await getCollection('orders');

        // Actualizar todas las órdenes de los clientes especificados
        const result = await collection.updateMany(
            { 'user.email': { $in: clientEmails } },
            { $unset: { whatsappContactedAt: "" } }
        );

        return {
            success: true,
            message: `${result.modifiedCount} órdenes actualizadas`,
            updatedCount: result.modifiedCount
        };
    } catch (error) {
        console.error('Error unmarking clients as WhatsApp contacted:', error);
        return {
            success: false,
            error: 'Error al desmarcar clientes como contactados por WhatsApp'
        };
    }
}

/**
 * Obtiene el estado de contacto por WhatsApp para una lista de clientes
 * Consulta la colección orders para obtener el campo whatsappContactedAt
 * @param clientEmails Array de emails de clientes
 * @returns Array con el estado de contacto de cada cliente
 */
/**
 * Oculta clientes marcándolos con "ocultado" en el campo whatsappContactedAt
 * @param clientEmails Array de emails de clientes a ocultar
 * @returns Resultado de la operación
 */
export async function hideClients({ clientEmails }: MarkWhatsAppContactedParams): Promise<{
    success: boolean;
    message?: string;
    error?: string;
    updatedCount?: number;
}> {
    try {
        const collection = await getCollection('orders');

        // Actualizar todas las órdenes de los clientes especificados
        const result = await collection.updateMany(
            { 'user.email': { $in: clientEmails } },
            {
                $set: {
                    whatsappContactedAt: "ocultado"
                }
            }
        );

        return {
            success: true,
            message: `${result.modifiedCount} órdenes marcadas como ocultadas`,
            updatedCount: result.modifiedCount
        };

    } catch (error) {
        console.error('Error hiding clients:', error);
        return {
            success: false,
            error: 'Error al ocultar clientes'
        };
    }
}

/**
 * Muestra clientes ocultados (quita el estado "ocultado")
 * @param clientEmails Array de emails de clientes a mostrar
 * @returns Resultado de la operación
 */
export async function showClients({ clientEmails }: UnmarkWhatsAppContactedParams): Promise<{
    success: boolean;
    message?: string;
    error?: string;
    updatedCount?: number;
}> {
    try {
        const collection = await getCollection('orders');

        // Actualizar todas las órdenes de los clientes especificados
        const result = await collection.updateMany(
            {
                'user.email': { $in: clientEmails },
                'whatsappContactedAt': 'ocultado'
            },
            { $unset: { whatsappContactedAt: "" } }
        );

        return {
            success: true,
            message: `${result.modifiedCount} órdenes actualizadas`,
            updatedCount: result.modifiedCount
        };
    } catch (error) {
        console.error('Error showing clients:', error);
        return {
            success: false,
            error: 'Error al mostrar clientes'
        };
    }
}

export async function getWhatsAppContactStatus(clientEmails: string[]): Promise<{
    success: boolean;
    data?: WhatsAppContactStatus[];
    error?: string;
}> {
    try {
        const collection = await getCollection('orders');

        const pipeline = [
            { $match: { 'user.email': { $in: clientEmails } } },
            {
                $group: {
                    _id: '$user.email',
                    whatsappContactedAt: { $first: '$whatsappContactedAt' }
                }
            },
            {
                $project: {
                    clientEmail: '$_id',
                    whatsappContactedAt: 1,
                    _id: 0
                }
            }
        ];

        const result = await collection.aggregate(pipeline, { allowDiskUse: true }).toArray();

        return {
            success: true,
            data: result.map(item => ({
                clientEmail: item.clientEmail,
                whatsappContactedAt: item.whatsappContactedAt && item.whatsappContactedAt !== 'ocultado'
                    ? new Date(item.whatsappContactedAt)
                    : null
            }))
        };
    } catch (error) {
        console.error('Error getting WhatsApp contact status:', error);
        return {
            success: false,
            error: 'Error al obtener el estado de contacto por WhatsApp'
        };
    }
}

/**
 * Obtiene el estado de visibilidad para una lista de clientes
 * @param clientEmails Array de emails de clientes
 * @returns Array con el estado de visibilidad de cada cliente
 */
export async function getClientVisibilityStatus(clientEmails: string[]): Promise<{
    success: boolean;
    data?: ClientVisibilityStatus[];
    error?: string;
}> {
    try {
        const collection = await getCollection('orders');

        const pipeline = [
            { $match: { 'user.email': { $in: clientEmails } } },
            {
                $group: {
                    _id: '$user.email',
                    whatsappContactedAt: { $first: '$whatsappContactedAt' }
                }
            },
            {
                $project: {
                    clientEmail: '$_id',
                    isHidden: { $eq: ['$whatsappContactedAt', 'ocultado'] },
                    _id: 0
                }
            }
        ];

        const result = await collection.aggregate(pipeline, { allowDiskUse: true }).toArray();

        return {
            success: true,
            data: result.map(item => ({
                clientEmail: item.clientEmail,
                isHidden: item.isHidden || false
            }))
        };
    } catch (error) {
        console.error('Error getting client visibility status:', error);
        return {
            success: false,
            error: 'Error al obtener el estado de visibilidad de los clientes'
        };
    }
} 