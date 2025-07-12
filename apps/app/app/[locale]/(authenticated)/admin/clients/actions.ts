'use server';

import { markWhatsAppContacted, unmarkWhatsAppContacted, getWhatsAppContactStatus, hideClients, showClients, getClientVisibilityStatus } from '@repo/data-services/src/services/barfer/markWhatsAppContacted';

/**
 * Marca clientes como contactados por WhatsApp
 */
export async function markClientsAsWhatsAppContacted(clientEmails: string[]) {
    try {
        if (!clientEmails || clientEmails.length === 0) {
            return {
                success: false,
                error: 'No se proporcionaron emails de clientes'
            };
        }

        const result = await markWhatsAppContacted({ clientEmails });
        return result;

    } catch (error) {
        console.error('Error in markClientsAsWhatsAppContacted action:', error);
        return {
            success: false,
            error: 'Error interno del servidor'
        };
    }
}

/**
 * Desmarca clientes como contactados por WhatsApp
 */
export async function unmarkClientsAsWhatsAppContacted(clientEmails: string[]) {
    try {
        if (!clientEmails || clientEmails.length === 0) {
            return {
                success: false,
                error: 'No se proporcionaron emails de clientes'
            };
        }

        const result = await unmarkWhatsAppContacted({ clientEmails });
        return result;

    } catch (error) {
        console.error('Error in unmarkClientsAsWhatsAppContacted action:', error);
        return {
            success: false,
            error: 'Error interno del servidor'
        };
    }
}

/**
 * Obtiene el estado de contacto por WhatsApp para una lista de clientes
 */
export async function getClientsWhatsAppContactStatus(clientEmails: string[]) {
    try {
        if (!clientEmails || clientEmails.length === 0) {
            return {
                success: false,
                error: 'No se proporcionaron emails de clientes'
            };
        }

        const result = await getWhatsAppContactStatus(clientEmails);
        return result;

    } catch (error) {
        console.error('Error in getClientsWhatsAppContactStatus action:', error);
        return {
            success: false,
            error: 'Error interno del servidor'
        };
    }
}

/**
 * Oculta clientes seleccionados
 */
export async function hideSelectedClients(clientEmails: string[]) {
    try {
        if (!clientEmails || clientEmails.length === 0) {
            return {
                success: false,
                error: 'No se proporcionaron emails de clientes'
            };
        }

        const result = await hideClients({ clientEmails });
        return result;

    } catch (error) {
        console.error('Error in hideSelectedClients action:', error);
        return {
            success: false,
            error: 'Error interno del servidor'
        };
    }
}

/**
 * Muestra clientes ocultados
 */
export async function showSelectedClients(clientEmails: string[]) {
    try {
        if (!clientEmails || clientEmails.length === 0) {
            return {
                success: false,
                error: 'No se proporcionaron emails de clientes'
            };
        }

        const result = await showClients({ clientEmails });
        return result;

    } catch (error) {
        console.error('Error in showSelectedClients action:', error);
        return {
            success: false,
            error: 'Error interno del servidor'
        };
    }
}

/**
 * Obtiene el estado de visibilidad para una lista de clientes
 */
export async function getClientsVisibilityStatus(clientEmails: string[]) {
    try {
        if (!clientEmails || clientEmails.length === 0) {
            return {
                success: false,
                error: 'No se proporcionaron emails de clientes'
            };
        }

        const result = await getClientVisibilityStatus(clientEmails);
        return result;

    } catch (error) {
        console.error('Error in getClientsVisibilityStatus action:', error);
        return {
            success: false,
            error: 'Error interno del servidor'
        };
    }
}

