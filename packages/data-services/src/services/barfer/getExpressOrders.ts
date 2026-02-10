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
                { 'deliveryArea.sameDayDelivery': true },
                // Pedidos con punto de envío asignado (independiente del método de pago)
                { puntoEnvio: { $exists: true, $nin: [null, ''] } }
            ]
        };

        // Si se proporciona puntoEnvio, filtrar por ese punto de envío
        if (puntoEnvio) {
            filter.puntoEnvio = puntoEnvio;
        }

        // Filtro por fecha si se proporciona
        if (from && from.trim() !== '' || to && to.trim() !== '') {
            // Si solo hay "from", tratar como día único (evitar devolver todos los días futuros)
            const fromVal = from?.trim() || '';
            const toVal = to?.trim() || fromVal;

            let fromDateUTC: Date | undefined;
            let toDateUTC: Date | undefined;

            if (fromVal) {
                const [year, month, day] = fromVal.split('-').map(Number);
                // 00:00:00 Arg Time = 03:00:00 UTC
                fromDateUTC = new Date(Date.UTC(year, month - 1, day, 3, 0, 0, 0));
            }
            if (toVal) {
                const [year, month, day] = toVal.split('-').map(Number);
                // 23:59:59 Arg Time = 02:59:59 UTC of NEXT day
                toDateUTC = new Date(Date.UTC(year, month - 1, day + 1, 2, 59, 59, 999));
            }

            // Para deliveryDay: día en UTC (00:00 a 23:59) para alinearse con el front (toISOString().substring(0,10))
            let fromDeliveryUTC: Date | undefined;
            let toDeliveryUTC: Date | undefined;
            if (fromVal) {
                const [year, month, day] = fromVal.split('-').map(Number);
                fromDeliveryUTC = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
            }
            if (toVal) {
                const [year, month, day] = toVal.split('-').map(Number);
                toDeliveryUTC = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
            }

            filter.$and = [
                {
                    $or: [
                        {
                            deliveryDay: {
                                ...(fromDeliveryUTC && { $gte: fromDeliveryUTC }),
                                ...(toDeliveryUTC && { $lte: toDeliveryUTC })
                            }
                        },
                        {
                            $and: [
                                { deliveryDay: { $exists: false } },
                                {
                                    createdAt: {
                                        ...(fromDateUTC && { $gte: fromDateUTC }),
                                        ...(toDateUTC && { $lte: toDateUTC })
                                    }
                                }
                            ]
                        },
                        {
                            $and: [
                                { deliveryDay: null },
                                {
                                    createdAt: {
                                        ...(fromDateUTC && { $gte: fromDateUTC }),
                                        ...(toDateUTC && { $lte: toDateUTC })
                                    }
                                }
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
