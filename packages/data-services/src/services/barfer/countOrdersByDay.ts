import 'server-only';
import { getCollection } from '@repo/database';

/**
 * Cuenta las órdenes del día para un punto de envío y fecha específica
 * Sin importar el estado de la orden
 */
export async function countOrdersByDay(
    puntoEnvio: string,
    date: Date
): Promise<number> {
    try {
        const collection = await getCollection('orders');

        // Crear rango de fechas para el día completo
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const count = await collection.countDocuments({
            puntoEnvio: puntoEnvio,
            createdAt: {
                $gte: startOfDay,
                $lte: endOfDay,
            },
        });

        return count;
    } catch (error) {
        console.error('Error counting orders by day:', error);
        return 0;
    }
}

