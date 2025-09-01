import 'server-only';
import { getCollection, ObjectId } from '@repo/database';
import type { Order } from '../../types/barfer';

interface GetOrdersParams {
    pageIndex?: number;
    pageSize?: number;
    search?: string;
    sorting?: { id: string; desc: boolean }[];
    from?: string;
    to?: string;
    orderType?: string;
}

/**
 * Escapa caracteres especiales de una cadena de texto para usarla en una expresión regular.
 */
function escapeRegex(string: string) {
    return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

/**
 * Obtiene órdenes de forma paginada, filtrada y ordenada desde el servidor.
 * @returns Un objeto con las órdenes y el conteo total de páginas.
 */
export async function getOrders({
    pageIndex = 0,
    pageSize = 50,
    search = '',
    sorting = [{ id: 'createdAt', desc: true }],
    from,
    to,
    orderType,
}: GetOrdersParams): Promise<{ orders: Order[]; pageCount: number; total: number }> {
    try {
        const collection = await getCollection('orders');

        const baseFilter: any = {};

        // Excluir envíos del día (método de pago 'transfer' y 'bank-transfer')
        baseFilter.paymentMethod = { $nin: ['transfer', 'bank-transfer'] };

        // Filtro por fecha simplificado - usar fechas directamente
        if ((from && from.trim() !== '') || (to && to.trim() !== '')) {
            baseFilter.deliveryDay = {};

            if (from && from.trim() !== '') {
                // Crear fecha desde string sin manipulación de zona horaria
                const [year, month, day] = from.split('-').map(Number);
                const fromDateObj = new Date(year, month - 1, day, 0, 0, 0, 0);
                baseFilter.deliveryDay.$gte = fromDateObj;
            }

            if (to && to.trim() !== '') {
                // Crear fecha desde string sin manipulación de zona horaria
                const [year, month, day] = to.split('-').map(Number);
                const toDateObj = new Date(year, month - 1, day, 23, 59, 59, 999);
                baseFilter.deliveryDay.$lte = toDateObj;
            }
        }

        // Filtro por tipo de orden simplificado
        if (orderType && orderType.trim() !== '' && orderType !== 'all') {
            if (orderType === 'mayorista') {
                baseFilter.orderType = 'mayorista';
            } else if (orderType === 'minorista') {
                baseFilter.$or = [
                    { orderType: 'minorista' },
                    { orderType: { $exists: false } },
                    { orderType: null }
                ];
            }
        } else {
            // Por defecto, incluir TODAS las órdenes (minoristas y mayoristas)
            // No aplicar filtro de orderType para permitir búsquedas globales
        }

        // Filtro de búsqueda simplificado con soporte para español
        const searchFilter: any = {};
        if (search && search.trim() !== '') {
            const searchWords = search.split(' ').filter(Boolean).map(escapeRegex);

            if (searchWords.length > 0) {
                searchFilter.$and = searchWords.map(word => {
                    // Mapeo de estados en español a inglés para búsqueda
                    const statusMapping: Record<string, string[]> = {
                        'pendiente': ['pending'],
                        'confirmado': ['confirmed'],
                        'entregado': ['delivered'],
                        'cancelado': ['cancelled'],
                        'pending': ['pending'],
                        'confirmed': ['confirmed'],
                        'delivered': ['delivered'],
                        'cancelled': ['cancelled']
                    };

                    // Mapeo de métodos de pago en español a inglés
                    const paymentMethodMapping: Record<string, string[]> = {
                        'efectivo': ['cash'],
                        'transferencia': ['transfer', 'bank-transfer'],
                        'mercado pago': ['mercado-pago'],
                        'cash': ['cash'],
                        'transfer': ['transfer'],
                        'bank-transfer': ['bank-transfer'],
                        'mercado-pago': ['mercado-pago']
                    };

                    // Crear filtros para status con mapeo español-inglés
                    const statusFilters = [];
                    const normalizedWord = word.toLowerCase();

                    if (statusMapping[normalizedWord]) {
                        // Si la palabra coincide con un estado en español, buscar en inglés
                        statusMapping[normalizedWord].forEach(status => {
                            statusFilters.push({ 'status': { $regex: status, $options: 'i' } });
                        });
                    } else {
                        // Si no coincide, buscar directamente
                        statusFilters.push({ 'status': { $regex: word, $options: 'i' } });
                    }

                    // Crear filtros para paymentMethod con mapeo español-inglés
                    const paymentMethodFilters = [];
                    if (paymentMethodMapping[normalizedWord]) {
                        // Si la palabra coincide con un método de pago en español, buscar en inglés
                        paymentMethodMapping[normalizedWord].forEach(method => {
                            paymentMethodFilters.push({ 'paymentMethod': { $regex: method, $options: 'i' } });
                        });
                    } else {
                        // Si no coincide, buscar directamente
                        paymentMethodFilters.push({ 'paymentMethod': { $regex: word, $options: 'i' } });
                    }

                    return {
                        $or: [
                            { 'user.name': { $regex: word, $options: 'i' } },
                            { 'user.lastName': { $regex: word, $options: 'i' } },
                            { 'user.email': { $regex: word, $options: 'i' } },
                            { 'items.name': { $regex: word, $options: 'i' } },
                            { 'address.address': { $regex: word, $options: 'i' } },
                            { 'address.city': { $regex: word, $options: 'i' } },
                            ...paymentMethodFilters, // Usar filtros mapeados para paymentMethod
                            ...statusFilters, // Usar filtros mapeados para status
                            { 'notesOwn': { $regex: word, $options: 'i' } },
                            { 'orderType': { $regex: word, $options: 'i' } },
                            { 'notes': { $regex: word, $options: 'i' } },
                            { $expr: { $regexMatch: { input: { $toString: '$address.phone' }, regex: word, options: 'i' } } },
                            { $expr: { $regexMatch: { input: { $toString: '$total' }, regex: word, options: 'i' } } },
                            { 'deliveryDay': { $regex: word, $options: 'i' } }
                        ]
                    };
                });
            }

            // Búsqueda por ObjectId si aplica
            const isObjectId = /^[0-9a-fA-F]{24}$/.test(search.trim());
            if (isObjectId) {
                if (searchFilter.$and) {
                    searchFilter.$or = [...searchFilter.$and, { _id: new ObjectId(search.trim()) }];
                    delete searchFilter.$and;
                } else {
                    searchFilter._id = new ObjectId(search.trim());
                }
            }
        }

        // Construir query final
        const finalFilters = [baseFilter];
        if (Object.keys(searchFilter).length > 0) {
            finalFilters.push(searchFilter);
        }

        const matchQuery = finalFilters.length > 1 ? { $and: finalFilters } : finalFilters[0];

        // Configurar ordenamiento
        const sortQuery: { [key: string]: 1 | -1 } = {};
        sorting.forEach(sort => {
            sortQuery[sort.id] = sort.desc ? -1 : 1;
        });

        // Calcular paginación
        const skip = pageIndex * pageSize;
        const limit = pageSize;

        // Ejecutar queries
        const [ordersFromDB, countResult] = await Promise.all([
            collection.find(matchQuery).sort(sortQuery).skip(skip).limit(limit).toArray(),
            collection.countDocuments(matchQuery)
        ]);

        const total = countResult;
        const pageCount = Math.ceil(total / pageSize);

        // Serializar órdenes
        const serializedOrders = ordersFromDB.map(order => ({
            ...order,
            _id: order._id.toString(),
        })) as unknown as Order[];

        return {
            orders: serializedOrders,
            pageCount,
            total,
        };

    } catch (error) {
        console.error('Error fetching orders:', error);
        throw new Error('Could not fetch orders.');
    }
} 