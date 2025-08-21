import 'server-only';
import { getCollection, ObjectId } from '@repo/database';
import type { MayoristaOrder } from '../../types/barfer';

export interface MayoristaOrdersPaginationOptions {
    page: number;
    pageSize: number;
    search?: string;
    status?: string;
    from?: string;
    to?: string;
}

export interface PaginatedMayoristaOrdersResponse {
    orders: MayoristaOrder[];
    total: number;
    pageCount: number;
    currentPage: number;
    pageSize: number;
}

// Tipo para las estadísticas de órdenes mayoristas
export interface MayoristaOrdersStats {
    total: number;
    totalRevenue: number;
    pending: number;
    confirmed: number;
    delivered: number;
    cancelled: number;
}

export async function getMayoristaOrdersForTable(options: MayoristaOrdersPaginationOptions): Promise<PaginatedMayoristaOrdersResponse> {
    try {
        const collection = await getCollection('mayoristas');

        const { page, pageSize, search, status, from, to } = options;
        const skip = (page - 1) * pageSize;

        // Construir filtros
        const filters: any = {};

        // Filtro de búsqueda
        if (search) {
            filters.$or = [
                { 'user.name': { $regex: search, $options: 'i' } },
                { 'user.lastName': { $regex: search, $options: 'i' } },
                { 'user.email': { $regex: search, $options: 'i' } },
                { 'address.address': { $regex: search, $options: 'i' } },
                { 'address.city': { $regex: search, $options: 'i' } },
                { 'address.phone': { $regex: search, $options: 'i' } },
                { notes: { $regex: search, $options: 'i' } },
                { notesOwn: { $regex: search, $options: 'i' } }
            ];
        }

        // Filtro de estado
        if (status && status !== 'all') {
            filters.status = status;
        }

        // Filtros de fecha
        if (from || to) {
            filters.createdAt = {};
            if (from) {
                filters.createdAt.$gte = new Date(from);
            }
            if (to) {
                filters.createdAt.$lte = new Date(to + 'T23:59:59.999Z');
            }
        }

        // Obtener total de documentos
        const total = await collection.countDocuments(filters);

        // Obtener órdenes con paginación
        const orders = await collection
            .find(filters)
            .sort({ createdAt: -1 }) // Más recientes primero
            .skip(skip)
            .limit(pageSize)
            .toArray();

        // Convertir ObjectIds a strings
        const ordersWithStringIds = orders.map(order => ({
            ...order,
            _id: order._id.toString(),
        })) as MayoristaOrder[];

        const pageCount = Math.ceil(total / pageSize);

        return {
            orders: ordersWithStringIds,
            total,
            pageCount,
            currentPage: page,
            pageSize
        };

    } catch (error) {
        console.error('Error getting mayorista orders for table:', error);
        throw new Error('Failed to fetch mayorista orders');
    }
}

// Función para obtener estadísticas de órdenes mayoristas
export async function getMayoristaOrdersStats(): Promise<MayoristaOrdersStats> {
    try {
        const collection = await getCollection('mayoristas');

        const stats = await collection.aggregate([
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    totalRevenue: { $sum: '$total' },
                    pending: {
                        $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
                    },
                    confirmed: {
                        $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] }
                    },
                    delivered: {
                        $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] }
                    },
                    cancelled: {
                        $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
                    }
                }
            }
        ]).toArray();

        if (stats.length === 0) {
            return {
                total: 0,
                totalRevenue: 0,
                pending: 0,
                confirmed: 0,
                delivered: 0,
                cancelled: 0
            };
        }

        // Convertir el resultado de MongoDB a nuestro tipo explícito
        const rawStats = stats[0];
        return {
            total: Number(rawStats.total) || 0,
            totalRevenue: Number(rawStats.totalRevenue) || 0,
            pending: Number(rawStats.pending) || 0,
            confirmed: Number(rawStats.confirmed) || 0,
            delivered: Number(rawStats.delivered) || 0,
            cancelled: Number(rawStats.cancelled) || 0
        };

    } catch (error) {
        console.error('Error getting mayorista orders stats:', error);
        throw new Error('Failed to fetch mayorista orders stats');
    }
}
