import 'server-only';
import { getCollection } from '@repo/database';
import type { Order } from '../../types/barfer';

/**
 * Obtener órdenes express
 * - Pedidos viejos: paymentMethod: "bank-transfer"
 * - Pedidos nuevos: deliveryArea.sameDayDelivery: true
 * Opcionalmente filtradas por punto de envío (nombre) y rango de fechas
 */
export async function getExpressOrders(puntoEnvio?: string, from?: string, to?: string): Promise<Order[]> {
    try {
        const collection = await getCollection('orders');

        // Filtro base: pedidos express (viejos o nuevos)
        const filter: any = {
            $or: [
                // Pedidos viejos: método de pago bank-transfer
                { paymentMethod: 'bank-transfer' },
                // Pedidos nuevos: sameDayDelivery activado
                { 'deliveryArea.sameDayDelivery': true }
            ]
        };

        // Si se proporciona puntoEnvio, filtrar por ese punto de envío
        if (puntoEnvio) {
            filter.puntoEnvio = puntoEnvio;
        }

        // Filtro por fecha si se proporciona
        if (from && from.trim() !== '' || to && to.trim() !== '') {
            const dateConditions: any[] = [];

            // 1. Fechas para createdAt (Local Time -> UTC conversion implicita del server o explícita)
            // Asumimos que 'from' y 'to' vienen como 'YYYY-MM-DD'.
            // Al hacer new Date(Y, M, D) en el servidor, usa el timezone del servidor.
            // Si el servidor está en UTC, new Date(2026, 0, 23) es 2026-01-23T00:00:00Z.
            // Si el servidor está en -03:00, es 2026-01-23T03:00:00Z.
            // Para createdAt queremos respetar el día local.

            let fromDateLocal: Date | undefined;
            let toDateLocal: Date | undefined;

            if (from && from.trim() !== '') {
                const [year, month, day] = from.split('-').map(Number);
                fromDateLocal = new Date(year, month - 1, day, 0, 0, 0, 0);
            }
            if (to && to.trim() !== '') {
                const [year, month, day] = to.split('-').map(Number);
                toDateLocal = new Date(year, month - 1, day, 23, 59, 59, 999);
            }

            // 2. Fechas para deliveryDay (UTC Strict)
            // deliveryDay se guarda como UTC Midnight (T00:00:00.000Z).
            // Para encontrar deliveryDay de un día específico, buscamos en el rango UTC de ese día.
            let fromDateUTC: Date | undefined;
            let toDateUTC: Date | undefined;

            if (from && from.trim() !== '') {
                const [year, month, day] = from.split('-').map(Number);
                fromDateUTC = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
            }
            if (to && to.trim() !== '') {
                const [year, month, day] = to.split('-').map(Number);
                toDateUTC = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
            }


            // Condición 1: Filtrar por deliveryDay (Usando rango UTC)
            const deliveryDayMatch: any = {};
            if (fromDateUTC) deliveryDayMatch.$gte = fromDateUTC;
            if (toDateUTC) deliveryDayMatch.$lte = toDateUTC;

            // Condición 2: Filtrar por createdAt (Usando rango Local)
            const createdAtMatch: any = {};
            if (fromDateLocal) createdAtMatch.$gte = fromDateLocal;
            if (toDateLocal) createdAtMatch.$lte = toDateLocal;

            filter.$and = [
                {
                    $or: [
                        { deliveryDay: deliveryDayMatch },
                        {
                            $and: [
                                { deliveryDay: { $exists: false } },
                                { createdAt: createdAtMatch }
                            ]
                        },
                        {
                            $and: [
                                { deliveryDay: null },
                                { createdAt: createdAtMatch }
                            ]
                        }
                    ]
                }
            ];
        }

        const orders = await collection
            .find(filter)
            .sort({ createdAt: -1 })
            .toArray();

        return orders.map((order) => ({
            _id: order._id.toString(),
            user: order.user,
            address: order.address,
            items: order.items,
            total: order.total,
            subTotal: order.subTotal || 0,
            shippingPrice: order.shippingPrice || 0,
            status: order.status,
            paymentMethod: order.paymentMethod,
            deliveryDay: order.deliveryDay,
            deliveryArea: order.deliveryArea,
            notes: order.notes,
            notesOwn: order.notesOwn,
            orderType: order.orderType,
            puntoEnvio: order.puntoEnvio,
            estadoEnvio: order.estadoEnvio || 'pendiente',
            createdAt: order.createdAt,
            updatedAt: order.updatedAt,
        })) as Order[];
    } catch (error) {
        console.error('Error al obtener órdenes express:', error);
        return [];
    }
}
