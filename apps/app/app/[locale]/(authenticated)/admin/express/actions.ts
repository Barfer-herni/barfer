'use server';

import { revalidatePath } from 'next/cache';
import {
    getDeliveryAreasWithPuntoEnvio,
    createStockMongo,
    getStockByPuntoEnvioMongo,
    getDetalleEnvioByPuntoEnvioMongo,
    getExpressOrders,
    createPuntoEnvioMongo,
    getAllPuntosEnvioMongo,
    updateEstadoEnvio,
    getProductsForStock,
    updateStockMongo,
    countOrdersByDay,
} from '@repo/data-services';
import { getCurrentUserWithPermissions } from '@repo/auth/server-permissions';

export async function getDeliveryAreasWithPuntoEnvioAction() {
    try {
        return await getDeliveryAreasWithPuntoEnvio();
    } catch (error) {
        console.error('Error getting delivery areas:', error);
        return {
            success: false,
            deliveryAreas: [],
        };
    }
}

export async function getExpressOrdersAction(puntoEnvio?: string) {
    try {
        // Validar que el usuario tenga permiso para ver este punto de envío
        const userWithPermissions = await getCurrentUserWithPermissions();
        const isAdmin = userWithPermissions?.isAdmin || false;

        // Si no es admin y se especifica un punto de envío, validar que esté en sus puntos asignados
        if (!isAdmin && puntoEnvio && puntoEnvio !== 'all') {
            const userPuntosEnvio = Array.isArray(userWithPermissions?.puntoEnvio)
                ? userWithPermissions.puntoEnvio
                : (userWithPermissions?.puntoEnvio ? [userWithPermissions.puntoEnvio] : []);

            // Si el usuario no tiene puntos asignados o el punto seleccionado no está en su lista, retornar vacío
            if (userPuntosEnvio.length === 0 || !userPuntosEnvio.includes(puntoEnvio)) {
                return {
                    success: true,
                    orders: [],
                };
            }
        }

        const orders = await getExpressOrders(puntoEnvio);
        return {
            success: true,
            orders,
        };
    } catch (error) {
        console.error('Error getting express orders:', error);
        return {
            success: false,
            orders: [],
        };
    }
}

export async function createStockAction(data: {
    puntoEnvio: string;
    producto: string;
    peso?: string;
    stockInicial: number;
    llevamos: number;
    pedidosDelDia: number;
    stockFinal?: number;
    fecha?: string;
}) {
    try {
        const result = await createStockMongo(data);

        if (result.success) {
            revalidatePath('/admin/express');
        }

        return result;
    } catch (error) {
        console.error('Error creating stock:', error);
        return {
            success: false,
            message: 'Error al crear el stock',
        };
    }
}

export async function getStockByPuntoEnvioAction(puntoEnvio: string) {
    try {
        // Validar que el usuario tenga permiso para ver este punto de envío
        const userWithPermissions = await getCurrentUserWithPermissions();
        const isAdmin = userWithPermissions?.isAdmin || false;

        // Si no es admin, validar que el punto esté en sus puntos asignados
        if (!isAdmin) {
            const userPuntosEnvio = Array.isArray(userWithPermissions?.puntoEnvio)
                ? userWithPermissions.puntoEnvio
                : (userWithPermissions?.puntoEnvio ? [userWithPermissions.puntoEnvio] : []);

            if (userPuntosEnvio.length === 0 || !userPuntosEnvio.includes(puntoEnvio)) {
                return {
                    success: true,
                    stock: [],
                };
            }
        }

        return await getStockByPuntoEnvioMongo(puntoEnvio);
    } catch (error) {
        console.error('Error getting stock:', error);
        return {
            success: false,
            stock: [],
        };
    }
}

export async function getDetalleEnvioByPuntoEnvioAction(puntoEnvio: string) {
    try {
        // Validar que el usuario tenga permiso para ver este punto de envío
        const userWithPermissions = await getCurrentUserWithPermissions();
        const isAdmin = userWithPermissions?.isAdmin || false;

        // Si no es admin, validar que el punto esté en sus puntos asignados
        if (!isAdmin) {
            const userPuntosEnvio = Array.isArray(userWithPermissions?.puntoEnvio)
                ? userWithPermissions.puntoEnvio
                : (userWithPermissions?.puntoEnvio ? [userWithPermissions.puntoEnvio] : []);

            if (userPuntosEnvio.length === 0 || !userPuntosEnvio.includes(puntoEnvio)) {
                return {
                    success: true,
                    detalleEnvio: [],
                };
            }
        }

        return await getDetalleEnvioByPuntoEnvioMongo(puntoEnvio);
    } catch (error) {
        console.error('Error getting detalle:', error);
        return {
            success: false,
            detalleEnvio: [],
        };
    }
}

export async function createPuntoEnvioAction(data: { nombre: string }) {
    try {
        const result = await createPuntoEnvioMongo(data);

        if (result.success) {
            revalidatePath('/admin/express');
        }

        return result;
    } catch (error) {
        console.error('Error creating punto de envío:', error);
        return {
            success: false,
            message: 'Error al crear el punto de envío',
        };
    }
}

export async function getAllPuntosEnvioAction() {
    try {
        return await getAllPuntosEnvioMongo();
    } catch (error) {
        console.error('Error getting puntos de envío:', error);
        return {
            success: false,
            puntosEnvio: [],
        };
    }
}

export async function updateEstadoEnvioAction(orderId: string, estadoEnvio: 'pendiente' | 'pidiendo' | 'en-viaje' | 'listo') {
    try {
        const result = await updateEstadoEnvio(orderId, estadoEnvio);

        if (result.success) {
            revalidatePath('/admin/express');
        }

        return result;
    } catch (error) {
        console.error('Error updating estado de envío:', error);
        return {
            success: false,
            error: 'Error al actualizar el estado de envío',
        };
    }
}

export async function getProductsForStockAction() {
    try {
        return await getProductsForStock();
    } catch (error) {
        console.error('Error getting products for stock:', error);
        return {
            success: false,
            products: [],
            error: 'Error al obtener los productos para stock',
        };
    }
}

export async function updateStockAction(
    id: string,
    data: {
        stockInicial?: number;
        llevamos?: number;
        pedidosDelDia?: number;
        stockFinal?: number;
    }
) {
    try {
        const result = await updateStockMongo(id, data);

        if (result.success) {
            revalidatePath('/admin/express');
        }

        return result;
    } catch (error) {
        console.error('Error updating stock:', error);
        return {
            success: false,
            message: 'Error al actualizar el stock',
        };
    }
}

export async function getPedidosDelDiaAction(puntoEnvio: string, date: Date) {
    try {
        const count = await countOrdersByDay(puntoEnvio, date);
        return {
            success: true,
            count,
        };
    } catch (error) {
        console.error('Error getting pedidos del día:', error);
        return {
            success: false,
            count: 0,
        };
    }
}
