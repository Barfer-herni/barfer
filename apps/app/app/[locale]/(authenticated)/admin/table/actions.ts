'use server';
import { revalidatePath } from 'next/cache';
import { updateOrder } from '@repo/data-services/src/services/barfer/updateOrder';
import { deleteOrder } from '@repo/data-services/src/services/barfer/deleteOrder';
import { createOrder } from '@repo/data-services/src/services/barfer/createOrder';
import { migrateClientType } from '@repo/data-services/src/services/barfer/migrateClientType';
import { updateOrdersStatusBulk } from '@repo/data-services/src/services/barfer/updateOrder';

export async function updateOrderAction(id: string, data: any) {
    try {
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

        const updated = await updateOrder(id, data);
        return { success: true, order: updated };
    } catch (error) {
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