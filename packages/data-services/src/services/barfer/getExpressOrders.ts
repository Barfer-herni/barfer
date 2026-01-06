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
            filter.deliveryDay = {};
            if (from && from.trim() !== '') {
                // Crear fecha desde string sin manipulación de zona horaria
                const [year, month, day] = from.split('-').map(Number);
                const fromDateObj = new Date(year, month - 1, day, 0, 0, 0, 0);
                filter.deliveryDay.$gte = fromDateObj;
            }
            if (to && to.trim() !== '') {
                // Crear fecha desde string sin manipulación de zona horaria
                const [year, month, day] = to.split('-').map(Number);
                const toDateObj = new Date(year, month - 1, day, 23, 59, 59, 999);
                filter.deliveryDay.$lte = toDateObj;
            }
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
