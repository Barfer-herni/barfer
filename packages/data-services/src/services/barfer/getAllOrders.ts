import 'server-only';
import { getCollection, ObjectId } from '@repo/database';
import type { Order } from '../../types/barfer';
import { addDays, format } from 'date-fns';

interface GetAllOrdersParams {
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
 * Obtiene todas las órdenes que coinciden con los filtros, sin paginación.
 * @returns Un array de órdenes.
 */
export async function getAllOrders({
    search = '',
    sorting = [{ id: 'createdAt', desc: true }],
    from,
    to,
    orderType,
}: GetAllOrdersParams): Promise<Order[]> {
    try {
        const collection = await getCollection('orders');

        const baseFilter: any = {};

        // Excluir envíos del día (método de pago 'transfer' y 'bank-transfer')
        // Comentado temporalmente para evitar que las órdenes desaparezcan al editar
        // TODO: Revisar si este filtro es necesario o implementar una solución más específica
        // baseFilter.paymentMethod = { $nin: ['transfer', 'bank-transfer'] };

        // Filtro por fecha si se proporciona - usar fechas directamente
        if (from && from.trim() !== '' || to && to.trim() !== '') {
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

        // Filtro por tipo de orden si se proporciona
        if (orderType && orderType.trim() !== '' && orderType !== 'all') {
            baseFilter.orderType = orderType;
        }

        const searchFilter: any = {};
        if (search) {
            const searchWords = search.split(' ').filter(Boolean).map(escapeRegex);
            if (searchWords.length > 0) {
                searchFilter.$and = searchWords.map(word => ({
                    $or: [
                        { 'user.name': { $regex: word, $options: 'i' } },
                        { 'user.lastName': { $regex: word, $options: 'i' } },
                        { 'user.email': { $regex: word, $options: 'i' } },
                        { 'items.name': { $regex: word, $options: 'i' } },
                        { 'address.address': { $regex: word, $options: 'i' } },
                        { 'address.city': { $regex: word, $options: 'i' } },
                        { 'paymentMethod': { $regex: word, $options: 'i' } },
                        { 'status': { $regex: word, $options: 'i' } },
                        { 'notesOwn': { $regex: word, $options: 'i' } },
                        { 'orderType': { $regex: word, $options: 'i' } },
                    ]
                }));
            }
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

        const finalAnd = [baseFilter];
        if (Object.keys(searchFilter).length > 0) {
            finalAnd.push(searchFilter);
        }
        const matchQuery = { $and: finalAnd };

        const sortQuery: { [key: string]: 1 | -1 } = {};
        sorting.forEach(sort => {
            sortQuery[sort.id] = sort.desc ? -1 : 1;
        });

        const ordersFromDB = await collection.find(matchQuery).sort(sortQuery).toArray();

        // Medida de seguridad: Eliminar duplicados por _id antes de serializar.
        const uniqueOrdersMap = new Map();
        ordersFromDB.forEach(order => {
            uniqueOrdersMap.set(order._id.toString(), order);
        });
        const uniqueOrders = Array.from(uniqueOrdersMap.values());

        const serializedOrders = uniqueOrders.map(order => ({
            ...order,
            _id: order._id.toString(),
        })) as unknown as Order[];

        return serializedOrders;

    } catch (error) {
        console.error('Error fetching all orders for export:', error);
        throw new Error('Could not fetch orders for export.');
    }
} 