import 'server-only';
import { getCollection, ObjectId } from '@repo/database';
import { z } from 'zod';
import { format } from 'date-fns';
import type { Order } from '../../types/barfer';

const createOrderSchema = z.object({
    status: z.enum(['pending', 'confirmed', 'delivered', 'cancelled']).default('pending'),
    total: z.number().min(0).refine((val) => val !== undefined && val !== null, {
        message: "El total es obligatorio"
    }),
    subTotal: z.number().min(0).optional().default(0),
    shippingPrice: z.number().min(0).optional().default(0),
    notes: z.string().optional(),
    notesOwn: z.string().optional(),
    paymentMethod: z.string(),
    orderType: z.enum(['minorista', 'mayorista']).default('minorista'),
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
    coupon: z.object({
        code: z.string(),
        discount: z.number(),
        type: z.enum(['percentage', 'fixed']),
    }).optional(),
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

export async function createOrder(data: z.infer<typeof createOrderSchema>): Promise<{ success: boolean; order?: Order; error?: string }> {
    try {
        // Validar los datos de entrada
        const validatedData = createOrderSchema.parse(data);

        const collection = await getCollection('orders');

        // Normalizar el formato de deliveryDay si está presente
        if (validatedData.deliveryDay) {
            validatedData.deliveryDay = normalizeDeliveryDay(validatedData.deliveryDay);
        }

        // Crear la nueva orden con timestamps
        const newOrder = {
            ...validatedData,
            createdAt: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
            updatedAt: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
        };

        // Insertar la orden en la base de datos
        const result = await collection.insertOne(newOrder);

        if (!result.insertedId) {
            return { success: false, error: 'Failed to create order' };
        }

        // Obtener la orden creada
        const createdOrder = await collection.findOne({ _id: result.insertedId });

        if (!createdOrder) {
            return { success: false, error: 'Order created but not found' };
        }

        // Convertir ObjectId a string para la respuesta
        const orderWithStringId = {
            ...createdOrder,
            _id: createdOrder._id.toString(),
        } as Order;

        return { success: true, order: orderWithStringId };
    } catch (error) {
        console.error('Error creating order:', error);
        if (error instanceof z.ZodError) {
            return { success: false, error: `Validation error: ${error.errors.map(e => e.message).join(', ')}` };
        }
        return { success: false, error: 'Internal server error' };
    }
}
