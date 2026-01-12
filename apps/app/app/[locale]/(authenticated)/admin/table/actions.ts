'use server';
import { createOrder, updateOrder, deleteOrder, migrateClientType } from '@repo/data-services/src/services/barfer';
import { revalidatePath } from 'next/cache';
import { updateOrdersStatusBulk } from '@repo/data-services/src/services/barfer/updateOrder';
import { validateAndNormalizePhone } from './helpers';
import { calculateOrderTotal, getPriceFromFormattedProduct, calculateOrderTotalExact, debugRawProducts } from '@repo/data-services';

export async function updateOrderAction(id: string, data: any) {
    console.log(`🔍 [DEBUG] FRONTEND updateOrderAction - INPUT:`, {
        id,
        data,
        items: data.items,
        timestamp: new Date().toISOString()
    });

    try {
        // Validar y normalizar el número de teléfono si está presente
        if (data.address?.phone) {
            const normalizedPhone = validateAndNormalizePhone(data.address.phone);
            if (normalizedPhone) {
                data.address.phone = normalizedPhone;
            } else {
                return { success: false, error: 'El número de teléfono no es válido. Use el formato: La Plata (221 XXX-XXXX) o CABA/BA (11-XXXX-XXXX / 15-XXXX-XXXX)' };
            }
        }

        // Guardar backup antes de actualizar
        try {
            const { saveOrderBackup } = await import('@repo/data-services/src/services/barfer/orderBackupService');
            // Necesitamos obtener los datos actuales antes de actualizar
            const { getCollection, ObjectId } = await import('@repo/database');
            const ordersCollection = await getCollection('orders');
            const currentOrder = await ordersCollection.findOne({ _id: new ObjectId(id) });

            if (currentOrder) {
                await saveOrderBackup(
                    id,
                    'update',
                    currentOrder, // Los datos actuales (anteriores) se guardan como backup
                    data, // Los nuevos datos
                    'Actualización de orden'
                );
            }
        } catch (backupError) {
            console.warn('No se pudo guardar el backup:', backupError);
        }

        console.log(`🔍 [DEBUG] FRONTEND updateOrderAction - Llamando a updateOrder:`, {
            id,
            data,
            timestamp: new Date().toISOString()
        });

        const updated = await updateOrder(id, data);

        console.log(`✅ [DEBUG] FRONTEND updateOrderAction - SUCCESS:`, {
            updated,
            items: updated?.items,
            timestamp: new Date().toISOString()
        });

        return { success: true, order: updated };
    } catch (error) {
        console.error(`❌ [DEBUG] FRONTEND updateOrderAction - ERROR:`, {
            error,
            id,
            data,
            timestamp: new Date().toISOString()
        });
        return { success: false, error: (error as Error).message };
    }
}

export async function deleteOrderAction(id: string) {
    try {
        // Guardar backup antes de eliminar
        try {
            const { saveOrderBackup } = await import('@repo/data-services/src/services/barfer/orderBackupService');
            // Obtener los datos completos antes de eliminar
            const { getCollection, ObjectId } = await import('@repo/database');
            const ordersCollection = await getCollection('orders');
            const orderToDelete = await ordersCollection.findOne({ _id: new ObjectId(id) });

            if (orderToDelete) {
                await saveOrderBackup(
                    id,
                    'delete',
                    orderToDelete, // Los datos completos de la orden a eliminar
                    null,
                    'Eliminación de orden'
                );
            }
        } catch (backupError) {
            console.warn('No se pudo guardar el backup:', backupError);
        }

        const result = await deleteOrder(id);
        if (!result.success) {
            return { success: false, error: result.error };
        }
        revalidatePath('/admin/table');
        return { success: true };
    } catch (error) {
        console.error('Error in deleteOrderAction:', error);
        return { success: false, error: 'Error al eliminar la orden' };
    }
}

export async function createOrderAction(data: any) {
    try {
        // Validar y normalizar el número de teléfono si está presente
        if (data.address?.phone) {
            const normalizedPhone = validateAndNormalizePhone(data.address.phone);
            if (normalizedPhone) {
                data.address.phone = normalizedPhone;
            } else {
                return { success: false, error: 'El número de teléfono no es válido. Use el formato: La Plata (221 XXX-XXXX) o CABA/BA (11-XXXX-XXXX / 15-XXXX-XXXX)' };
            }
        }

        const result = await createOrder(data);
        if (!result.success) {
            return { success: false, error: result.error };
        }
        revalidatePath('/admin/table');
        return { success: true, order: result.order };
    } catch (error) {
        console.error('Error in createOrderAction:', error);
        return { success: false, error: 'Error al crear la orden' };
    }
}

export async function migrateClientTypeAction() {
    try {
        const result = await migrateClientType();
        revalidatePath('/admin/table');
        return result;
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}



export async function updateOrdersStatusBulkAction(ids: string[], status: string) {
    'use server';
    return await updateOrdersStatusBulk(ids, status);
}

// Nueva acción para deshacer el último cambio
export async function undoLastChangeAction() {
    try {
        const { restoreLastBackup } = await import('@repo/data-services/src/services/barfer/orderBackupService');
        const result = await restoreLastBackup();

        if (!result.success) {
            return { success: false, error: (result as any).error || 'Error al deshacer' };
        }

        revalidatePath('/admin/table');
        return { success: true, action: (result as any).restoredAction };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

// Nueva acción para limpiar todos los backups
export async function clearAllBackupsAction() {
    try {
        const { clearAllBackups } = await import('@repo/data-services/src/services/barfer/orderBackupService');
        const result = await clearAllBackups();

        if (!result.success) {
            return { success: false, error: (result as any).error || 'Error al limpiar backups' };
        }

        revalidatePath('/admin/table');
        return { success: true };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

// Nueva acción para obtener la cantidad de backups disponibles
export async function getBackupsCountAction() {
    try {
        const { getBackupsCount } = await import('@repo/data-services/src/services/barfer/orderBackupService');
        const result = await getBackupsCount();

        if (!result.success) {
            return { success: false, count: 0, error: result.error };
        }

        return { success: true, count: result.count };
    } catch (error) {
        return { success: false, count: 0, error: (error as Error).message };
    }
}

// Nueva acción para buscar mayoristas desde puntos_venta
export async function searchMayoristasAction(searchTerm: string) {
    'use server';

    try {
        const { searchPuntosVenta } = await import('@repo/data-services');

        if (!searchTerm || searchTerm.length < 2) {
            return { success: true, puntosVenta: [] };
        }

        const result = await searchPuntosVenta(searchTerm);

        return {
            success: result.success,
            puntosVenta: result.puntosVenta || [],
            error: result.error
        };
    } catch (error) {
        console.error('Error searching puntos de venta:', error);
        return {
            success: false,
            error: 'Error al buscar puntos de venta',
            puntosVenta: []
        };
    }
}

// Nueva acción para calcular el precio automáticamente
export async function calculatePriceAction(
    items: Array<{
        name: string;
        options: Array<{
            name: string;
            quantity: number;
        }>;
    }>,
    orderType: 'minorista' | 'mayorista',
    paymentMethod: string,
    deliveryDate?: string | Date
) {
    'use server';

    try {
        // NUEVO: Usar la función exacta que maneja el formato de la BD
        const result = await calculateOrderTotalExact(items, orderType, paymentMethod, deliveryDate);

        if (result.success) {
            return {
                success: true,
                total: result.total,
                itemPrices: result.itemPrices
            };
        }

        return {
            success: false,
            error: result.error
        };
    } catch (error) {
        console.error('Error in calculatePriceAction:', error);
        return {
            success: false,
            error: 'Error al calcular el precio automático'
        };
    }
}


// Nueva acción para obtener productos desde la colección prices
export async function getProductsFromPricesAction() {
    'use server';

    try {
        const { getProductsForSelect } = await import('@repo/data-services/src/services/barfer/pricesService');

        const result = await getProductsForSelect();

        if (result.success) {
            return {
                success: true,
                products: result.products,
                productsWithDetails: result.productsWithDetails
            };
        }

        return {
            success: false,
            error: result.error || 'Error al obtener productos',
            products: [],
            productsWithDetails: []
        };
    } catch (error) {
        console.error('Error in getProductsFromPricesAction:', error);
        return {
            success: false,
            error: 'Error al obtener productos de la base de datos',
            products: [],
            productsWithDetails: []
        };
    }
}

// Nueva acción para calcular precio usando valores exactos de la DB
export async function calculateExactPriceAction(
    formattedProduct: string,
    orderType: 'minorista' | 'mayorista',
    paymentMethod: string,
    deliveryDate?: string | Date
) {
    'use server';

    try {
        const result = await getPriceFromFormattedProduct(
            formattedProduct,
            orderType,
            paymentMethod,
            deliveryDate
        );

        if (result.success) {
            return {
                success: true,
                price: result.price
            };
        }

        return {
            success: false,
            error: result.error || 'Error al calcular el precio'
        };
    } catch (error) {
        console.error('Error in calculateExactPriceAction:', error);
        return {
            success: false,
            error: 'Error al calcular el precio automático'
        };
    }
}

// Nueva acción para duplicar un pedido
export async function duplicateOrderAction(id: string) {
    'use server';

    try {
        // Obtener la orden original
        const { getCollection, ObjectId } = await import('@repo/database');
        const ordersCollection = await getCollection('orders');
        const originalOrder = await ordersCollection.findOne({ _id: new ObjectId(id) });

        if (!originalOrder) {
            return { success: false, error: 'Orden no encontrada' };
        }

        // Validar y normalizar el número de teléfono si está presente
        if (originalOrder.address?.phone) {
            const normalizedPhone = validateAndNormalizePhone(originalOrder.address.phone);
            if (!normalizedPhone) {
                return { success: false, error: 'El número de teléfono no es válido. Use el formato: La Plata (221 XXX-XXXX) o CABA/BA (11-XXXX-XXXX / 15-XXXX-XXXX)' };
            }
            // Actualizar el teléfono normalizado en la orden original
            originalOrder.address.phone = normalizedPhone;
        }

        // Recalcular el precio con los precios del mes de la fecha de entrega
        let recalculatedTotal = originalOrder.total;
        try {
            const result = await calculatePriceAction(
                originalOrder.items || [],
                originalOrder.orderType || 'minorista',
                originalOrder.paymentMethod || '',
                originalOrder.deliveryDay // Usar la fecha de entrega del pedido original
            );
            
            if (result.success && result.total !== undefined) {
                recalculatedTotal = result.total;
                console.log(`💰 Precio recalculado para orden duplicada (fecha: ${originalOrder.deliveryDay}): ${originalOrder.total} → ${recalculatedTotal}`);
            } else {
                console.warn(`⚠️ No se pudo recalcular el precio, usando el original: ${originalOrder.total}`);
            }
        } catch (error) {
            console.error('Error recalculando precio al duplicar:', error);
            // Si falla el cálculo, usar el precio original
        }

        // Crear una copia de la orden con modificaciones para indicar que es duplicada
        const duplicatedOrderData = {
            ...originalOrder,
            _id: undefined, // Remover el ID para crear una nueva orden
            status: 'pending' as const, // Resetear el estado a pendiente
            notesOwn: `DUPLICADO - ${originalOrder.notesOwn || ''}`, // Marcar como duplicado en notas propias
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            // Mantener la fecha de entrega original para que el usuario pueda modificarla si es necesario
            deliveryDay: originalOrder.deliveryDay,
            // IMPORTANTE: Usar el precio recalculado con los precios actuales
            total: recalculatedTotal,
            // Normalizar campos opcionales que pueden causar problemas de validación
            deliveryArea: {
                ...originalOrder.deliveryArea,
                // Solo incluir _id si existe en la orden original
                ...(originalOrder.deliveryArea?._id && { _id: originalOrder.deliveryArea._id }),
                sheetName: originalOrder.deliveryArea?.sheetName || '',
                whatsappNumber: originalOrder.deliveryArea?.whatsappNumber || ''
            },
            // Normalizar campos de address que pueden ser null pero el schema espera string
            address: {
                ...originalOrder.address,
                betweenStreets: originalOrder.address?.betweenStreets || '',
                floorNumber: originalOrder.address?.floorNumber || '',
                departmentNumber: originalOrder.address?.departmentNumber || '',
                // Manejar campos que pueden ser null en el esquema de la orden
                zipCode: originalOrder.address?.zipCode || undefined,
                reference: originalOrder.address?.reference || ''
            },
            // Manejar coupon: si es string (formato viejo), convertir a null; si es objeto, mantenerlo
            coupon: (originalOrder.coupon && typeof originalOrder.coupon === 'object') 
                ? originalOrder.coupon 
                : undefined
        };

        // Crear la orden duplicada usando el servicio existente
        const result = await createOrder(duplicatedOrderData as any);
        if (!result.success) {
            return { success: false, error: result.error };
        }

        revalidatePath('/admin/table');
        return { success: true, order: result.order, message: 'Pedido duplicado correctamente' };
    } catch (error) {
        console.error('Error in duplicateOrderAction:', error);
        return { success: false, error: 'Error al duplicar la orden' };
    }
}

// Acción para debug de productos RAW
export async function debugRawProductsAction() {
    'use server';

    try {
        const result = await debugRawProducts();
        return result;
    } catch (error) {
        console.error('Error in debugRawProductsAction:', error);
        return {
            success: false,
            error: 'Error al obtener información de productos RAW'
        };
    }
} 