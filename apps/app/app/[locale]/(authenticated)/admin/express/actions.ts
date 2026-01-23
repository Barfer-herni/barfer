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
    createOrder,
} from '@repo/data-services';
import { getCurrentUserWithPermissions } from '@repo/auth/server-permissions';
import { calculatePriceAction } from '../table/actions';
import { validateAndNormalizePhone } from '../table/helpers';

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

export async function getExpressOrdersAction(puntoEnvio?: string, from?: string, to?: string) {
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

        const orders = await getExpressOrders(puntoEnvio, from, to);
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

        // No revalidamos la ruta para evitar recargas lentas
        // El componente usa optimistic updates para actualización instantánea

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

// Acción para duplicar un pedido express en un punto de envío específico
export async function duplicateExpressOrderAction(orderId: string, targetPuntoEnvio: string) {
    'use server';

    console.log('🚀 [SERVER] duplicateExpressOrderAction iniciada');
    console.log('📦 [SERVER] orderId:', orderId);
    console.log('📍 [SERVER] targetPuntoEnvio:', targetPuntoEnvio);

    try {
        // Validar que el usuario tenga permiso para el punto de envío destino
        const userWithPermissions = await getCurrentUserWithPermissions();
        const isAdmin = userWithPermissions?.isAdmin || false;

        console.log('👤 [SERVER] Usuario:', { isAdmin, puntoEnvio: userWithPermissions?.puntoEnvio });

        if (!isAdmin) {
            const userPuntosEnvio = Array.isArray(userWithPermissions?.puntoEnvio)
                ? userWithPermissions.puntoEnvio
                : (userWithPermissions?.puntoEnvio ? [userWithPermissions.puntoEnvio] : []);

            if (!userPuntosEnvio.includes(targetPuntoEnvio)) {
                return {
                    success: false,
                    error: 'No tienes permiso para duplicar pedidos en este punto de envío',
                };
            }
        }

        // Obtener la orden original
        const { getCollection, ObjectId } = await import('@repo/database');
        const ordersCollection = await getCollection('orders');
        const originalOrder = await ordersCollection.findOne({ _id: new ObjectId(orderId) });

        console.log('🔍 [SERVER] Orden original encontrada:', originalOrder ? 'SÍ' : 'NO');

        if (!originalOrder) {
            console.error('❌ [SERVER] Orden no encontrada con ID:', orderId);
            return { success: false, error: 'Orden no encontrada' };
        }

        // Validar y normalizar el número de teléfono si está presente
        if (originalOrder.address?.phone) {
            const normalizedPhone = validateAndNormalizePhone(originalOrder.address.phone);
            if (!normalizedPhone) {
                return {
                    success: false,
                    error: 'El número de teléfono no es válido. Use el formato: La Plata (221 XXX-XXXX) o CABA/BA (11-XXXX-XXXX / 15-XXXX-XXXX)',
                };
            }
            originalOrder.address.phone = normalizedPhone;
        }

        // Recalcular el precio con los precios del mes de la fecha de entrega
        let recalculatedTotal = originalOrder.total;
        try {
            const result = await calculatePriceAction(
                originalOrder.items || [],
                originalOrder.orderType || 'minorista',
                originalOrder.paymentMethod || '',
                originalOrder.deliveryDay
            );

            if (result.success && result.total !== undefined) {
                recalculatedTotal = result.total;
                console.log(`💰 Precio recalculado para orden duplicada (fecha: ${originalOrder.deliveryDay}): ${originalOrder.total} → ${recalculatedTotal}`);
            } else {
                console.warn(`⚠️ No se pudo recalcular el precio, usando el original: ${originalOrder.total}`);
            }
        } catch (error) {
            console.error('Error recalculando precio al duplicar:', error);
        }

        // Crear una copia de la orden con el nuevo punto de envío
        const duplicatedOrderData = {
            ...originalOrder,
            _id: undefined,
            status: 'pending' as const,
            estadoEnvio: 'pendiente' as const, // Resetear estado de envío
            puntoEnvio: targetPuntoEnvio, // Asignar el nuevo punto de envío
            notesOwn: `DUPLICADO - ${originalOrder.notesOwn || ''}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            deliveryDay: originalOrder.deliveryDay,
            total: recalculatedTotal,
            deliveryArea: {
                ...originalOrder.deliveryArea,
                ...(originalOrder.deliveryArea?._id && { _id: originalOrder.deliveryArea._id }),
                sheetName: originalOrder.deliveryArea?.sheetName || '',
                whatsappNumber: originalOrder.deliveryArea?.whatsappNumber || '',
            },
            address: {
                ...originalOrder.address,
                betweenStreets: originalOrder.address?.betweenStreets || '',
                floorNumber: originalOrder.address?.floorNumber || '',
                departmentNumber: originalOrder.address?.departmentNumber || '',
                zipCode: originalOrder.address?.zipCode || undefined,
                reference: originalOrder.address?.reference || '',
            },
            coupon:
                originalOrder.coupon && typeof originalOrder.coupon === 'object'
                    ? originalOrder.coupon
                    : undefined,
        };

        // Crear la orden duplicada
        console.log('💾 [SERVER] Creando orden duplicada...');
        const result = await createOrder(duplicatedOrderData as any);

        console.log('✅ [SERVER] Resultado de createOrder:', result);

        if (!result.success) {
            console.error('❌ [SERVER] Error al crear orden:', result.error);
            return { success: false, error: result.error };
        }

        console.log('🎉 [SERVER] Orden duplicada exitosamente:', result.order?._id);

        revalidatePath('/admin/express');
        return {
            success: true,
            order: result.order,
            message: `Pedido duplicado correctamente en ${targetPuntoEnvio}`,
        };
    } catch (error) {
        console.error('❌ [SERVER] Error in duplicateExpressOrderAction:', error);
        return { success: false, error: 'Error al duplicar la orden' };
    }
}

/**
 * Obtener el ordenamiento guardado para una fecha y punto de envío
 */
export async function getOrderPriorityAction(fecha: string, puntoEnvio: string) {
    try {
        // Validar permisos del usuario
        const userWithPermissions = await getCurrentUserWithPermissions();
        const isAdmin = userWithPermissions?.isAdmin || false;

        if (!isAdmin) {
            const userPuntosEnvio = Array.isArray(userWithPermissions?.puntoEnvio)
                ? userWithPermissions.puntoEnvio
                : (userWithPermissions?.puntoEnvio ? [userWithPermissions.puntoEnvio] : []);

            if (!userPuntosEnvio.includes(puntoEnvio)) {
                return {
                    success: false,
                    error: 'No tienes permiso para ver este punto de envío',
                };
            }
        }

        const { getOrderPriority } = await import('@repo/data-services');
        return await getOrderPriority(fecha, puntoEnvio);
    } catch (error) {
        console.error('Error getting order priority:', error);
        return {
            success: false,
            error: 'Error al obtener el orden de prioridad',
        };
    }
}

/**
 * Guardar el ordenamiento de pedidos
 */
export async function saveOrderPriorityAction(
    fecha: string,
    puntoEnvio: string,
    orderIds: string[]
) {
    try {
        // Validar permisos del usuario
        const userWithPermissions = await getCurrentUserWithPermissions();
        const isAdmin = userWithPermissions?.isAdmin || false;

        if (!isAdmin) {
            const userPuntosEnvio = Array.isArray(userWithPermissions?.puntoEnvio)
                ? userWithPermissions.puntoEnvio
                : (userWithPermissions?.puntoEnvio ? [userWithPermissions.puntoEnvio] : []);

            if (!userPuntosEnvio.includes(puntoEnvio)) {
                return {
                    success: false,
                    error: 'No tienes permiso para modificar este punto de envío',
                };
            }
        }

        const { saveOrderPriority } = await import('@repo/data-services');
        const result = await saveOrderPriority({ fecha, puntoEnvio, orderIds });

        // No revalidamos la ruta para evitar recargas lentas
        // El componente usa optimistic updates para actualización instantánea

        return result;
    } catch (error) {
        console.error('Error saving order priority:', error);
        return {
            success: false,
            error: 'Error al guardar el orden de prioridad',
        };
    }
}

