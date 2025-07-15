'use server';

import 'server-only';
import { getCollection } from '@repo/database';
import { format } from 'date-fns';
import type { ClientBehaviorCategory, ClientSpendingCategory } from '../../../types/barfer';

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

export interface PaginatedClientsResponse {
    clients: ClientForTable[];
    totalCount: number;
    hasMore: boolean;
    totalPages: number;
}

export interface ClientsPaginationOptions {
    category?: string;
    type?: 'behavior' | 'spending';
    page?: number;
    pageSize?: number;
    sortBy?: 'totalSpent' | 'totalOrders' | 'lastOrder';
    sortOrder?: 'asc' | 'desc';
}

/**
 * Obtiene clientes paginados con filtros opcionales por categoría
 */
export async function getClientsPaginated(options: ClientsPaginationOptions = {}): Promise<PaginatedClientsResponse> {
    try {
        const {
            category,
            type,
            page = 1,
            pageSize = 50,
            sortBy = 'totalSpent',
            sortOrder = 'desc'
        } = options;

        const collection = await getCollection('orders');
        const skip = (page - 1) * pageSize;

        // Pipeline base para procesar clientes
        const basePipeline = [
            {
                $match: {
                    status: { $in: ['pending', 'confirmed', 'delivered', 'cancelled'] }
                }
            },
            {
                $addFields: {
                    createdAt: {
                        $cond: [
                            { $eq: [{ $type: "$createdAt" }, "string"] },
                            { $toDate: "$createdAt" },
                            "$createdAt"
                        ]
                    }
                }
            },
            {
                $group: {
                    _id: { $ifNull: ['$user.id', '$user.email'] },
                    user: { $first: '$user' },
                    lastAddress: { $last: '$address' },
                    totalOrders: { $sum: 1 },
                    totalSpent: { $sum: '$total' },
                    firstOrderDate: { $min: '$createdAt' },
                    lastOrderDate: { $max: '$createdAt' },
                    orderDates: { $push: '$createdAt' },
                    orderItems: { $push: '$items' }
                }
            },
            {
                $addFields: {
                    daysSinceFirstOrder: {
                        $divide: [
                            { $subtract: ['$$NOW', '$firstOrderDate'] },
                            1000 * 60 * 60 * 24
                        ]
                    },
                    daysSinceLastOrder: {
                        $divide: [
                            { $subtract: ['$$NOW', '$lastOrderDate'] },
                            1000 * 60 * 60 * 24
                        ]
                    }
                }
            },
            {
                $addFields: {
                    // Categorización de comportamiento
                    behaviorCategory: {
                        $switch: {
                            branches: [
                                // Cliente nuevo: 1 sola compra en últimos 7 días
                                {
                                    case: {
                                        $and: [
                                            { $eq: ['$totalOrders', 1] },
                                            { $lte: ['$daysSinceFirstOrder', 7] }
                                        ]
                                    },
                                    then: 'new'
                                },
                                // En seguimiento: 1 sola compra entre 8-30 días
                                {
                                    case: {
                                        $and: [
                                            { $eq: ['$totalOrders', 1] },
                                            { $gt: ['$daysSinceFirstOrder', 7] },
                                            { $lte: ['$daysSinceFirstOrder', 30] }
                                        ]
                                    },
                                    then: 'tracking'
                                },
                                // Cliente perdido: no compra en +120 días
                                {
                                    case: { $gt: ['$daysSinceLastOrder', 120] },
                                    then: 'lost'
                                },
                                // Posible inactivo: última compra entre 90-120 días
                                {
                                    case: {
                                        $and: [
                                            { $gt: ['$daysSinceLastOrder', 90] },
                                            { $lte: ['$daysSinceLastOrder', 120] }
                                        ]
                                    },
                                    then: 'possible-inactive'
                                }
                            ],
                            default: 'active'
                        }
                    },
                    // Cálculo simplificado del peso mensual (estimación más precisa)
                    monthlyWeight: {
                        $divide: [
                            {
                                $multiply: [
                                    '$totalOrders',
                                    {
                                        $switch: {
                                            branches: [
                                                { case: { $gte: ['$totalSpent', 30000] }, then: 20 }, // Alto gasto = más peso
                                                { case: { $gte: ['$totalSpent', 15000] }, then: 12 },
                                                { case: { $gte: ['$totalSpent', 5000] }, then: 8 }
                                            ],
                                            default: 5
                                        }
                                    }
                                ]
                            },
                            { $max: [{ $divide: ['$daysSinceFirstOrder', 30] }, 1] }
                        ]
                    }
                }
            },
            {
                $addFields: {
                    // Categorización de gasto basada en peso estimado
                    spendingCategory: {
                        $switch: {
                            branches: [
                                { case: { $gt: ['$monthlyWeight', 15] }, then: 'premium' },
                                { case: { $gt: ['$monthlyWeight', 5] }, then: 'standard' }
                            ],
                            default: 'basic'
                        }
                    }
                }
            }
        ];

        // Crear pipeline con filtro por categoría si se especifica
        let pipeline = [...basePipeline];
        if (category && type) {
            const categoryFilter = type === 'behavior'
                ? { behaviorCategory: category }
                : { spendingCategory: category };

            pipeline.push({ $match: categoryFilter } as any);
        }

        // Pipeline para contar total
        const countPipeline = [...pipeline, { $count: "total" }];
        const [countResult] = await collection.aggregate(countPipeline, { allowDiskUse: true }).toArray();
        const totalCount = countResult?.total || 0;

        // Pipeline para obtener datos paginados
        const sortField = sortBy === 'lastOrder' ? 'lastOrderDate' : sortBy;
        const sortDirection = sortOrder === 'asc' ? 1 : -1;

        const dataPipeline = [
            ...pipeline,
            { $sort: { [sortField]: sortDirection } },
            { $skip: skip },
            { $limit: pageSize }
        ];

        const clientsData = await collection.aggregate(dataPipeline, { allowDiskUse: true }).toArray();

        // Transformar al formato de tabla
        const clients: ClientForTable[] = clientsData.map(client => ({
            id: client._id,
            name: client.user.name + (client.user.lastName ? ` ${client.user.lastName}` : ''),
            email: client.user.email,
            phone: client.lastAddress?.phone || 'No disponible',
            lastOrder: format(new Date(client.lastOrderDate), 'yyyy-MM-dd'),
            totalSpent: Math.round(client.totalSpent),
            totalOrders: client.totalOrders,
            behaviorCategory: client.behaviorCategory,
            spendingCategory: client.spendingCategory
        }));

        const totalPages = Math.ceil(totalCount / pageSize);
        const hasMore = page < totalPages;

        return {
            clients,
            totalCount,
            hasMore,
            totalPages
        };

    } catch (error) {
        console.error('Error getting paginated clients:', error);
        throw error;
    }
}

export interface ClientForTableWithStatus extends ClientForTable {
    whatsappContactedAt?: Date | null;
    isHidden?: boolean;
}

export interface PaginatedClientsWithStatusResponse {
    clients: ClientForTableWithStatus[];
    totalCount: number;
    hasMore: boolean;
    totalPages: number;
}

/**
 * Obtiene clientes paginados con estado de WhatsApp y visibilidad incluidos
 */
export async function getClientsPaginatedWithStatus(options: ClientsPaginationOptions = {}): Promise<PaginatedClientsWithStatusResponse> {
    try {
        // Primero obtener los clientes paginados básicos
        const clientsResponse = await getClientsPaginated(options);

        if (clientsResponse.clients.length === 0) {
            return {
                clients: [],
                totalCount: 0,
                hasMore: false,
                totalPages: 0
            };
        }

        // Obtener emails de todos los clientes para consultar estados
        const clientEmails = clientsResponse.clients.map(client => client.email);

        // Importar funciones necesarias
        const { getWhatsAppContactStatus, getClientVisibilityStatus } = await import('../markWhatsAppContacted');

        // Cargar estados en paralelo
        const [contactResult, visibilityResult] = await Promise.all([
            getWhatsAppContactStatus(clientEmails),
            getClientVisibilityStatus(clientEmails)
        ]);

        // Crear mapas para acceso rápido
        const contactMap = new Map<string, Date | null>();
        const visibilityMap = new Map<string, boolean>();

        if (contactResult.success && contactResult.data) {
            contactResult.data.forEach(item => {
                contactMap.set(item.clientEmail, item.whatsappContactedAt);
            });
        }

        if (visibilityResult.success && visibilityResult.data) {
            visibilityResult.data.forEach(item => {
                visibilityMap.set(item.clientEmail, item.isHidden);
            });
        }

        // Combinar datos
        const clientsWithStatus: ClientForTableWithStatus[] = clientsResponse.clients.map(client => ({
            ...client,
            whatsappContactedAt: contactMap.get(client.email) || null,
            isHidden: visibilityMap.get(client.email) || false
        }));

        return {
            clients: clientsWithStatus,
            totalCount: clientsResponse.totalCount,
            hasMore: clientsResponse.hasMore,
            totalPages: clientsResponse.totalPages
        };

    } catch (error) {
        console.error('Error getting paginated clients with status:', error);
        throw error;
    }
} 