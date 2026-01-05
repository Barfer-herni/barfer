import 'server-only';
import { getCollection } from '@repo/database';
import type { Order } from '../../types/barfer';

/**
 * Obtener órdenes express
 * - Pedidos viejos: paymentMethod: "bank-transfer"
 * - Pedidos nuevos: deliveryArea.sameDayDelivery: true
 * Opcionalmente filtradas por punto de envío (nombre)
 */
export async function getExpressOrders(puntoEnvio?: string): Promise<Order[]> {
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
