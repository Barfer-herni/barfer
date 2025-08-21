import 'server-only';
import { getCollection, ObjectId } from '@repo/database';
import { z } from 'zod';
import { format } from 'date-fns';
import type { MayoristaOrder } from '../../types/barfer';

const createMayoristaOrderSchema = z.object({
    status: z.enum(['pending', 'confirmed', 'delivered', 'cancelled']).default('pending'),
    total: z.number().min(0).refine((val) => val !== undefined && val !== null, {
        message: "El total es obligatorio"
    }),
    subTotal: z.number().min(0).optional().default(0),
    shippingPrice: z.number().min(0).optional().default(0),
    notes: z.string().optional(),
    notesOwn: z.string().optional(),
    paymentMethod: z.string(),
    orderType: z.literal('mayorista'),
    address: z.object({
        address: z.string(),
        city: z.string(),
        phone: z.string(),
        betweenStreets: z.string().optional(),
        floorNumber: z.string().optional(),
        departmentNumber: z.string().optional(),
    }),
    user: z.object({
        name: z.string(),
        lastName: z.string(),
        email: z.string().email().optional().or(z.literal('')),
    }),
    items: z.array(z.object({
        id: z.string(),
        name: z.string(),
        description: z.string().optional(),
        images: z.array(z.string()).optional(),
        options: z.array(z.object({
            name: z.string(),
            price: z.number(),
            quantity: z.number().positive(),
        })),
        price: z.number(),
        salesCount: z.number().optional(),
        discountApllied: z.number().optional(),
    })),
    deliveryArea: z.object({
        _id: z.string(),
        description: z.string(),
        coordinates: z.array(z.array(z.number())),
        schedule: z.string(),
        orderCutOffHour: z.number(),
        enabled: z.boolean(),
        sameDayDelivery: z.boolean(),
        sameDayDeliveryDays: z.array(z.string()),
        whatsappNumber: z.string(),
        sheetName: z.string(),
    }),
    deliveryDay: z.union([z.string(), z.date()]),
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

export async function createMayoristaOrder(data: z.infer<typeof createMayoristaOrderSchema>): Promise<{ success: boolean; order?: MayoristaOrder; error?: string }> {
    try {
        // Validar los datos de entrada
        const validatedData = createMayoristaOrderSchema.parse(data);

        const collection = await getCollection('mayoristas');

        // Normalizar el formato de deliveryDay si está presente
        if (validatedData.deliveryDay) {
            validatedData.deliveryDay = normalizeDeliveryDay(validatedData.deliveryDay);
        }

        // Crear la nueva orden mayorista con timestamps
        const newMayoristaOrder = {
            ...validatedData,
            createdAt: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
            updatedAt: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
        };

        // Insertar la orden mayorista en la base de datos
        const result = await collection.insertOne(newMayoristaOrder);

        if (!result.insertedId) {
            return { success: false, error: 'Failed to create mayorista order' };
        }

        // Obtener la orden creada
        const createdOrder = await collection.findOne({ _id: result.insertedId });

        if (!createdOrder) {
            return { success: false, error: 'Mayorista order created but not found' };
        }

        // Convertir ObjectId a string para la respuesta
        const orderWithStringId = {
            ...createdOrder,
            _id: createdOrder._id.toString(),
        } as MayoristaOrder;

        return { success: true, order: orderWithStringId };
    } catch (error) {
        console.error('Error creating mayorista order:', error);
        if (error instanceof z.ZodError) {
            return { success: false, error: `Validation error: ${error.errors.map(e => e.message).join(', ')}` };
        }
        return { success: false, error: 'Internal server error' };
    }
}

// Función para obtener todas las órdenes mayoristas
export async function getMayoristaOrders(): Promise<{ success: boolean; orders?: MayoristaOrder[]; error?: string }> {
    try {
        const collection = await getCollection('mayoristas');
        const orders = await collection.find({}).toArray();

        // Convertir ObjectIds a strings
        const ordersWithStringIds = orders.map(order => ({
            ...order,
            _id: order._id.toString(),
        })) as MayoristaOrder[];

        return { success: true, orders: ordersWithStringIds };
    } catch (error) {
        console.error('Error getting mayorista orders:', error);
        return { success: false, error: 'Internal server error' };
    }
}

// Función para obtener una orden mayorista por ID
export async function getMayoristaOrderById(id: string): Promise<{ success: boolean; order?: MayoristaOrder; error?: string }> {
    try {
        const collection = await getCollection('mayoristas');
        const order = await collection.findOne({ _id: new ObjectId(id) });

        if (!order) {
            return { success: false, error: 'Mayorista order not found' };
        }

        // Convertir ObjectId a string
        const orderWithStringId = {
            ...order,
            _id: order._id.toString(),
        } as MayoristaOrder;

        return { success: true, order: orderWithStringId };
    } catch (error) {
        console.error('Error getting mayorista order by ID:', error);
        return { success: false, error: 'Internal server error' };
    }
}

// Función para actualizar una orden mayorista
export async function updateMayoristaOrder(id: string, data: Partial<MayoristaOrder>): Promise<{ success: boolean; order?: MayoristaOrder; error?: string }> {
    try {
        const collection = await getCollection('mayoristas');

        // Agregar timestamp de actualización
        const updateData = {
            ...data,
            updatedAt: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
        };

        const result = await collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
        );

        if (result.matchedCount === 0) {
            return { success: false, error: 'Mayorista order not found' };
        }

        // Obtener la orden actualizada
        const updatedOrder = await collection.findOne({ _id: new ObjectId(id) });

        if (!updatedOrder) {
            return { success: false, error: 'Mayorista order updated but not found' };
        }

        // Convertir ObjectId a string
        const orderWithStringId = {
            ...updatedOrder,
            _id: updatedOrder._id.toString(),
        } as MayoristaOrder;

        return { success: true, order: orderWithStringId };
    } catch (error) {
        console.error('Error updating mayorista order:', error);
        return { success: false, error: 'Internal server error' };
    }
}

// Función para eliminar una orden mayorista
export async function deleteMayoristaOrder(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        const collection = await getCollection('mayoristas');
        const result = await collection.deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 0) {
            return { success: false, error: 'Mayorista order not found' };
        }

        return { success: true };
    } catch (error) {
        console.error('Error deleting mayorista order:', error);
        return { success: false, error: 'Internal server error' };
    }
}
