// Importación dinámica para evitar problemas con server-only
async function getDatabaseConnection() {
    try {
        const { getCollection, ObjectId } = await import('@repo/database');
        return { getCollection, ObjectId };
    } catch (error) {
        console.error('Error importing database:', error);
        throw error;
    }
}

interface OrderBackup {
    orderId: string;
    action: 'update' | 'delete';
    previousData: any;
    newData?: any;
    timestamp: Date;
    description: string;
}

/**
 * Guarda un backup de una orden antes de modificarla
 * Mantiene un máximo de 10 backups y elimina los más antiguos
 */
export async function saveOrderBackup(
    orderId: string,
    action: 'update' | 'delete',
    previousData: any,
    newData?: any,
    description?: string
) {
    try {
        const { getCollection } = await getDatabaseConnection();

        const backupEntry: Omit<OrderBackup, '_id'> = {
            orderId,
            action,
            previousData,
            newData,
            timestamp: new Date(),
            description: description || `${action} de orden ${orderId}`
        };

        const backupCollection = await getCollection('orderBackups');

        // Insertar el nuevo backup
        await backupCollection.insertOne(backupEntry);

        // Mantener solo los últimos 10 backups
        const totalBackups = await backupCollection.countDocuments();
        if (totalBackups > 10) {
            // Obtener los backups más antiguos para eliminar
            const backupsToDelete = await backupCollection
                .find({})
                .sort({ timestamp: 1 }) // Ordenar por timestamp ascendente (más antiguos primero)
                .limit(totalBackups - 10) // Mantener solo los últimos 10
                .toArray();

            if (backupsToDelete.length > 0) {
                const backupIdsToDelete = backupsToDelete.map(backup => backup._id);
                await backupCollection.deleteMany({ _id: { $in: backupIdsToDelete } });
            }
        }

        return { success: true };
    } catch (error) {
        console.error('Error saving order backup:', error);
        return { success: false, error: (error as Error).message };
    }
}

/**
 * Obtiene el último backup disponible para restaurar
 */
export async function getLastBackup() {
    try {
        const { getCollection } = await getDatabaseConnection();

        const backupCollection = await getCollection('orderBackups');
        const lastBackup = await backupCollection
            .findOne(
                {},
                { sort: { timestamp: -1 } }
            );

        if (!lastBackup) {
            return { success: false, error: 'No hay cambios para deshacer' };
        }

        return { success: true, backup: lastBackup as unknown as OrderBackup };
    } catch (error) {
        console.error('Error getting last backup:', error);
        return { success: false, error: (error as Error).message };
    }
}

/**
 * Restaura el último backup y lo elimina de la tabla de backups
 */
export async function restoreLastBackup() {
    try {
        console.log('Starting restoreLastBackup...');
        const { getCollection, ObjectId } = await getDatabaseConnection();

        // Obtener el último backup
        const backupResult = await getLastBackup();
        console.log('Backup result:', backupResult);

        if (!backupResult.success) {
            return backupResult;
        }

        const backup = backupResult.backup;
        if (!backup) {
            return { success: false, error: 'Backup no encontrado' };
        }

        console.log('Restoring backup:', {
            orderId: backup.orderId,
            action: backup.action,
            hasPreviousData: !!backup.previousData
        });

        if (backup.action === 'delete') {
            // Si fue eliminado, restaurar la orden
            const ordersCollection = await getCollection('orders');
            const result = await ordersCollection.insertOne(backup.previousData);

            if (!result.insertedId) {
                return { success: false, error: 'Error al restaurar la orden eliminada' };
            }
            console.log('Order restored from deletion');
        } else if (backup.action === 'update') {
            // Si fue modificado, restaurar al estado anterior
            const ordersCollection = await getCollection('orders');
            console.log('Updating order with previous data:', backup.previousData);
            const result = await ordersCollection.updateOne(
                { _id: new ObjectId(backup.orderId) },
                { $set: backup.previousData }
            );

            console.log('Update result:', result);
            if (result.matchedCount === 0) {
                return { success: false, error: 'Orden no encontrada para restaurar' };
            }
            console.log('Order restored from update');
        }

        // Eliminar el backup usado
        const backupCollection = await getCollection('orderBackups');
        await backupCollection.deleteOne({ _id: (backup as any)._id });
        console.log('Backup deleted successfully');

        return { success: true, restoredAction: backup.action };
    } catch (error) {
        console.error('Error restoring backup:', error);
        return { success: false, error: (error as Error).message };
    }
}

/**
 * Obtiene la cantidad de backups disponibles
 */
export async function getBackupsCount() {
    try {
        const { getCollection } = await getDatabaseConnection();

        const backupCollection = await getCollection('orderBackups');
        const count = await backupCollection.countDocuments();

        return { success: true, count };
    } catch (error) {
        console.error('Error getting backups count:', error);
        return { success: false, error: (error as Error).message };
    }
}

/**
 * Limpia todos los backups (resetea el historial)
 */
export async function clearAllBackups() {
    try {
        const { getCollection } = await getDatabaseConnection();

        const backupCollection = await getCollection('orderBackups');
        await backupCollection.deleteMany({});

        return { success: true };
    } catch (error) {
        console.error('Error clearing all backups:', error);
        return { success: false, error: (error as Error).message };
    }
} 