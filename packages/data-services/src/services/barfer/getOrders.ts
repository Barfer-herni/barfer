import 'server-only';
import { getCollection, ObjectId } from '@repo/database';
import type { Order } from '../../types/barfer';
import { parse, isValid, startOfDay, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';

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

        // Filtro por fecha si se proporciona
        if (from || to) {
            baseFilter.deliveryDay = {};
            if (from) {
                baseFilter.deliveryDay.$gte = new Date(from).toISOString();
            }
            if (to) {
                const toDate = new Date(to);
                toDate.setDate(toDate.getDate() + 1);
                baseFilter.deliveryDay.$lt = toDate.toISOString();
            }
        }

        // Filtro por tipo de cliente si se proporciona
        if (orderType && orderType !== 'all') {
            baseFilter.orderType = orderType;
        }

        const searchFilter: any = {};

        if (search) {
            // Intentar parsear la búsqueda como fecha en varios formatos
            const dateFormats = [
                'dd-MM-yyyy', 'dd/MM/yyyy', 'yyyy-MM-dd', 'dd-MM', 'dd/MM', 'dd-MMM', 'd-MMM', 'd/MM', 'd-MM', 'd-MMM-yyyy', 'dd MMM yyyy', 'd MMM yyyy'
            ];
            let parsedDate: Date | null = null;
            console.log('search', search);
            console.log('dateFormats', dateFormats);
            console.log(parsedDate);
            for (const format of dateFormats) {
                const parsed = parse(search, format, new Date(), { locale: es });
                if (isValid(parsed)) {
                    parsedDate = parsed;
                    break;
                }
            }

            if (parsedDate) {
                // Si es una fecha válida, buscar por rango de ese día en deliveryDay
                const fromDate = startOfDay(parsedDate);
                const toDate = endOfDay(parsedDate);
                searchFilter['deliveryDay'] = { $gte: fromDate.toISOString(), $lte: toDate.toISOString() };
            } else {
                const searchWords = search.split(' ').filter(Boolean).map(escapeRegex);

                if (searchWords.length > 0) {
                    searchFilter.$and = searchWords.map(word => {
                        // Regex para día (número), mes (texto) o día-mes (ej: 05-jul)
                        const dayMonthMatch = word.match(/^(\d{1,2})-([a-zA-Z]{3,})$/);
                        const dayMatch = /^\d{1,2}$/.test(word);
                        const monthMatch = /^[a-zA-Z]{3,}$/.test(word);

                        // Meses abreviados en español
                        const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
                        let monthIndex = -1;
                        if (monthMatch) {
                            monthIndex = months.findIndex(m => m.toLowerCase() === word.toLowerCase());
                        }
                        let exprFilters = [];
                        if (dayMonthMatch) {
                            // Buscar por día y mes
                            const day = parseInt(dayMonthMatch[1], 10);
                            const monthStr = dayMonthMatch[2].toLowerCase();
                            const monthIdx = months.findIndex(m => m === monthStr);
                            if (monthIdx >= 0) {
                                exprFilters.push({
                                    $and: [
                                        { $eq: [{ $dayOfMonth: { $toDate: '$deliveryDay' } }, day] },
                                        { $eq: [{ $month: { $toDate: '$deliveryDay' } }, monthIdx + 1] }
                                    ]
                                });
                            }
                        } else if (dayMatch) {
                            // Buscar solo por día
                            const day = parseInt(word, 10);
                            exprFilters.push({ $eq: [{ $dayOfMonth: { $toDate: '$deliveryDay' } }, day] });
                        } else if (monthIndex >= 0) {
                            // Buscar solo por mes
                            exprFilters.push({ $eq: [{ $month: { $toDate: '$deliveryDay' } }, monthIndex + 1] });
                        }

                        // deliveryDay: búsqueda avanzada por día, mes o día-mes
                        let deliveryDayRegexes: any[] = [];
                        // Día (ej: 05)
                        if (dayMatch) {
                            // Buscar -05T (día al final del string ISO) o -05- (día en el medio)
                            deliveryDayRegexes.push({ 'deliveryDay': { $regex: `-${word}(T|-)`, $options: 'i' } });
                        }
                        // Mes (ej: jul o 07)
                        if (monthMatch || (/^\d{2}$/.test(word) && parseInt(word, 10) >= 1 && parseInt(word, 10) <= 12)) {
                            let monthNum = monthIndex + 1;
                            if (!isNaN(Number(word))) monthNum = Number(word);
                            const monthStr = monthNum.toString().padStart(2, '0');
                            deliveryDayRegexes.push({ 'deliveryDay': { $regex: `-${monthStr}-`, $options: 'i' } });
                        }
                        // Día-mes (ej: 05-jul o 05-07)
                        if (dayMonthMatch) {
                            const day = dayMonthMatch[1].padStart(2, '0');
                            let monthNum = months.findIndex(m => m === dayMonthMatch[2].toLowerCase()) + 1;
                            if (!isNaN(Number(dayMonthMatch[2]))) monthNum = Number(dayMonthMatch[2]);
                            const monthStr = monthNum.toString().padStart(2, '0');
                            deliveryDayRegexes.push({ 'deliveryDay': { $regex: `-${monthStr}-${day}T`, $options: 'i' } });
                        }

                        return {
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
                                // Teléfono: convertir a string y buscar coincidencia parcial
                                { $expr: { $regexMatch: { input: { $toString: '$address.phone' }, regex: word, options: 'i' } } },
                                // Total: convertir a string y buscar coincidencia parcial
                                { $expr: { $regexMatch: { input: { $toString: '$total' }, regex: word, options: 'i' } } },
                                // deliveryDay: búsqueda avanzada por día, mes o día-mes
                                ...(exprFilters.length > 0
                                    ? exprFilters.map(f => ({ $expr: f }))
                                    : [{ 'deliveryDay': { $regex: word, $options: 'i' } }]
                                ),
                                ...deliveryDayRegexes,
                            ]
                        };
                    });
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

        const skip = pageIndex * pageSize;
        const limit = pageSize;

        // Query 1: Datos paginados
        const dataPipeline = [
            { $match: matchQuery },
            { $sort: sortQuery },
            { $skip: skip },
            { $limit: limit }
        ];
        const ordersFromDB = await collection.aggregate(dataPipeline, { allowDiskUse: true }).toArray();

        // Query 2: Total de documentos
        const countPipeline = [
            { $match: matchQuery },
            { $count: 'count' }
        ];
        const countResult = await collection.aggregate(countPipeline).toArray();
        const total = countResult[0]?.count || 0;
        const pageCount = Math.ceil(total / pageSize);

        // Medida de seguridad: Eliminar duplicados por _id antes de serializar.
        const uniqueOrdersMap = new Map();
        (ordersFromDB as Order[]).forEach((order: Order) => {
            uniqueOrdersMap.set(order._id.toString(), order);
        });
        const uniqueOrders = Array.from(uniqueOrdersMap.values());

        const serializedOrders = uniqueOrders.map(order => ({
            ...order,
            _id: order._id.toString(),
        })) as unknown as Order[];

        return {
            orders: serializedOrders,
            pageCount,
            total,
        };

    } catch (error) {
        console.error('Error fetching server-side paginated orders:', error);
        // El error de memoria puede volver a ocurrir si el conjunto de datos
        // que coincide con el filtro es muy grande para ordenar.
        // Un índice en `createdAt` es crucial.
        throw new Error('Could not fetch orders.');
    }
} 