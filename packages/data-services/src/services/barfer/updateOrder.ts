import 'server-only';
import { getCollection, ObjectId } from '@repo/database';
import { z } from 'zod';
import { format } from 'date-fns';
import type { Order } from '../../types/barfer';
import { processOrderItems } from './productMapping';

// Función para normalizar el formato de hora en el schedule
function normalizeScheduleTime(schedule: string): string {
    if (!schedule) return schedule;

    // Evitar normalizar si ya está en formato correcto
    if (schedule.includes(':') && !schedule.includes('.')) {
        return schedule;
    }

    let normalized = schedule;

    // Primero: buscar patrones con espacios como "18 . 30", "19 . 45" y convertirlos
    normalized = normalized.replace(/(\d{1,2})\s*\.\s*(\d{1,2})/g, (match, hour, minute) => {
        const paddedMinute = minute.padStart(2, '0');
        return `${hour}:${paddedMinute}`;
    });

    // Segundo: buscar patrones de hora como "18.30", "19.45", "10.15", etc.
    // Solo si no fueron convertidos en el paso anterior
    normalized = normalized.replace(/(\d{1,2})\.(\d{1,2})/g, (match, hour, minute) => {
        // Asegurar que los minutos tengan 2 dígitos
        const paddedMinute = minute.padStart(2, '0');
        return `${hour}:${paddedMinute}`;
    });

    // Tercero: buscar patrones de solo hora como "18hs", "19hs" y convertirlos a "18:00hs", "19:00hs"
    // Solo si no tienen ya minutos
    normalized = normalized.replace(/(\d{1,2})(?<!:\d{2})hs/g, '$1:00hs');

    // Cuarto: buscar patrones de 4 dígitos consecutivos (como "1830", "2000") y convertirlos a formato de hora
    // Esto convierte "1830" a "18:30" y "2000" a "20:00"
    normalized = normalized.replace(/(\d{1,2})(\d{2})(?=\s|hs|$|a|aprox)/g, (match, hour, minute) => {
        // Solo convertir si los minutos son válidos (00-59)
        const minuteNum = parseInt(minute);
        if (minuteNum >= 0 && minuteNum <= 59) {
            return `${hour}:${minute}`;
        }
        return match; // Si no son minutos válidos, mantener como está
    });

    return normalized;
}

const updateOrderSchema = z.object({
    status: z.string().optional(),
    notes: z.string().optional(),
    address: z.any().optional(),
    user: z.any().optional(),
    notesOwn: z.string().optional(),
    paymentMethod: z.string().optional(),
    orderType: z.enum(['minorista', 'mayorista']).optional(),
    coupon: z.any().optional(),
    deliveryArea: z.any().optional(),
    items: z.any().optional(),
    total: z.number().optional(),
    subTotal: z.number().optional(),
    shippingPrice: z.number().optional(),
    updatedAt: z.string().optional(),
    deliveryDay: z.union([z.string(), z.date()]).optional(),
    // Agrega aquí otros campos editables si es necesario
});

// Función para normalizar el formato de fecha deliveryDay
function normalizeDeliveryDay(dateInput: string | Date | { $date: string }): Date {
    if (!dateInput) return new Date();

    let date: Date;

    // Si es un objeto con $date, extraer el string y parsear
    if (typeof dateInput === 'object' && '$date' in dateInput) {
        date = new Date(dateInput.$date);
    }
    // Si es un objeto Date, usar directamente
    else if (dateInput instanceof Date) {
        date = dateInput;
    } else {
        // Si es string, parsear
        date = new Date(dateInput);
    }

    // Validar que la fecha sea válida
    if (isNaN(date.getTime())) {
        throw new Error('Invalid date');
    }

    // Crear fecha local (solo año, mes, día) y retornar como objeto Date
    const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    return localDate;
}

export async function updateOrder(id: string, data: any) {
    const updateData = updateOrderSchema.parse(data);
    updateData.updatedAt = format(new Date(), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");

    // Normalizar el formato de deliveryDay si está presente
    if (updateData.deliveryDay) {
        updateData.deliveryDay = normalizeDeliveryDay(updateData.deliveryDay);
    }

    // Normalizar el formato del schedule si está presente
    if (updateData.deliveryArea?.schedule) {
        updateData.deliveryArea.schedule = normalizeScheduleTime(updateData.deliveryArea.schedule);
    }

    // Procesar items para limpiar campos innecesarios y asegurar formato correcto
    if (updateData.items && Array.isArray(updateData.items)) {
        updateData.items = processOrderItems(updateData.items);
    }

    const collection = await getCollection('orders');

    // Crear el objeto de actualización manualmente para asegurar que deliveryDay se incluya
    const updateObject: any = {};

    // Copiar todos los campos excepto deliveryDay
    Object.keys(updateData).forEach(key => {
        if (key !== 'deliveryDay') {
            updateObject[key] = (updateData as any)[key];
        }
    });

    // Agregar deliveryDay por separado si existe
    if (updateData.deliveryDay) {
        updateObject.deliveryDay = updateData.deliveryDay;
    }

    const result = await collection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: updateObject },
        { returnDocument: 'after' }
    );
    if (!result) throw new Error('Order not found');

    return result.value;
}

export async function updateOrdersStatusBulk(ids: string[], status: string) {
    const collection = await getCollection('orders');
    const objectIds = ids.map(id => new ObjectId(id));
    const result = await collection.updateMany(
        { _id: { $in: objectIds } },
        { $set: { status, updatedAt: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx") } }
    );
    return { success: true, modifiedCount: result.modifiedCount };
} 