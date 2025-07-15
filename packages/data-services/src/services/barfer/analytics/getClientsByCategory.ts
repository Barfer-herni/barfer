'use server';

import { getClientCategorization } from './getClientCategorization';
import type { ClientBehaviorCategory, ClientSpendingCategory, ClientCategorization } from '../../../types/barfer';
import 'server-only';
import { getCollection } from '@repo/database';
import { format } from 'date-fns';

export interface ClientForTable {
    id: string;
    name: string;
    email: string;
    phone: string;
    lastOrder: string;
    totalSpent: number;
    totalOrders: number;
    behaviorCategory: ClientBehaviorCategory;
    spendingCategory: ClientSpendingCategory;
}

/**
 * Obtiene clientes filtrados por categoría de comportamiento o gasto
 * Ahora con soporte para paginación opcional (mantiene compatibilidad hacia atrás)
 */
export async function getClientsByCategory(
    category?: string,
    type?: 'behavior' | 'spending',
    page?: number,
    pageSize?: number
): Promise<ClientForTable[]> {
    try {
        // Obtener todos los datos de categorización de clientes
        const clientAnalytics = await getClientCategorization();

        let filteredClients = clientAnalytics.clients;

        // Filtrar por categoría si se especifica
        if (category && type) {
            filteredClients = clientAnalytics.clients.filter(client => {
                if (type === 'behavior') {
                    return client.behaviorCategory === category;
                } else {
                    return client.spendingCategory === category;
                }
            });
        }

        // Transformar los datos al formato esperado por las tablas
        const clientsForTable: ClientForTable[] = filteredClients.map(client => ({
            id: client._id, // Usando email como ID único
            name: client.user.name + (client.user.lastName ? ` ${client.user.lastName}` : ''),
            email: client.user.email,
            phone: client.lastAddress?.phone || 'No disponible', // Usar phoneNumber del usuario
            lastOrder: format(new Date(client.lastOrderDate), 'yyyy-MM-dd'), // Formato YYYY-MM-DD
            totalSpent: Math.round(client.totalSpent),
            totalOrders: client.totalOrders,
            behaviorCategory: client.behaviorCategory,
            spendingCategory: client.spendingCategory
        }));

        // Ordenar por total gastado (descendente)
        clientsForTable.sort((a, b) => b.totalSpent - a.totalSpent);

        // Aplicar paginación si se especifica (mantiene compatibilidad hacia atrás)
        if (page && pageSize) {
            const startIndex = (page - 1) * pageSize;
            const endIndex = startIndex + pageSize;
            return clientsForTable.slice(startIndex, endIndex);
        }

        return clientsForTable;

    } catch (error) {
        console.error('Error getting clients by category:', error);
        throw error;
    }
}

/**
 * Versión con información completa de paginación
 */
export async function getClientsByCategoryPaginated(
    category?: string,
    type?: 'behavior' | 'spending',
    page: number = 1,
    pageSize: number = 50
): Promise<{
    clients: ClientForTable[];
    totalCount: number;
    totalPages: number;
    currentPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}> {
    try {
        // Obtener todos los clientes (sin paginación)
        const allClients = await getClientsByCategory(category, type);

        // Calcular información de paginación
        const totalCount = allClients.length;
        const totalPages = Math.ceil(totalCount / pageSize);
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const clients = allClients.slice(startIndex, endIndex);

        return {
            clients,
            totalCount,
            totalPages,
            currentPage: page,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1
        };

    } catch (error) {
        console.error('Error getting paginated clients by category:', error);
        throw error;
    }
} 