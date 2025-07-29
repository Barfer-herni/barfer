import 'server-only';
import { getCollection, ObjectId } from '@repo/database';
import { z } from 'zod';
import { format } from 'date-fns';
import type { Order } from '../../types/barfer';

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