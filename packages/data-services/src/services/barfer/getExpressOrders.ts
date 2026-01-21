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

            // Preparar las fechas de filtro
            let fromDateObj: Date | undefined;
            let toDateObj: Date | undefined;

            if (from && from.trim() !== '') {
                const [year, month, day] = from.split('-').map(Number);
                fromDateObj = new Date(year, month - 1, day, 0, 0, 0, 0);
            }
            if (to && to.trim() !== '') {
                const [year, month, day] = to.split('-').map(Number);
                toDateObj = new Date(year, month - 1, day, 23, 59, 59, 999);
            }

            // Condición 1: Filtrar por deliveryDay (Prioridad)
            const deliveryDayMatch: any = {};
            if (fromDateObj) deliveryDayMatch.$gte = fromDateObj;
            if (toDateObj) deliveryDayMatch.$lte = toDateObj;

            // Condición 2: Filtrar por createdAt (Fallback - solo si no hay deliveryDay)
            // Nota: Idealmente ajustaríamos -3h aquí también, pero para query simple mantendremos el rango directo
            // o ajustaremos el rango de búsqueda para compensar.
            // Por simplicidad y consistencia con "si no hay deliveryDay, es la fecha de creación", usamos rango directo.
            const createdAtMatch: any = {};
            if (fromDateObj) createdAtMatch.$gte = fromDateObj;
            if (toDateObj) createdAtMatch.$lte = toDateObj;

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
