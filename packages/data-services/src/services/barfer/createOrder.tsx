import 'server-only';
import { getCollection, ObjectId } from '@repo/database';
import { z } from 'zod';
import { format } from 'date-fns';
import type { Order } from '../../types/barfer';
import { createMayoristaPerson } from './createMayoristaOrder';
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
        _id: z.string().optional(),
        description: z.string(),
        coordinates: z.array(z.array(z.number())),
        schedule: z.string(),
        orderCutOffHour: z.number(),
        enabled: z.boolean(),
        sameDayDelivery: z.boolean(),
        sameDayDeliveryDays: z.array(z.string()),
        whatsappNumber: z.string().optional(),
        sheetName: z.string().optional(),
    }),
    coupon: z.object({
        code: z.string(),
        discount: z.number(),
        type: z.enum(['percentage', 'fixed']),
    }).optional().nullable(),
    deliveryDay: z.union([z.string(), z.date()]).refine((val) => val !== undefined && val !== null && val !== '', {
        message: "La fecha de entrega es obligatoria"
    }),
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

        // Normalizar el formato del schedule si está presente
        if (validatedData.deliveryArea?.schedule) {
            validatedData.deliveryArea.schedule = normalizeScheduleTime(validatedData.deliveryArea.schedule);
        }

        // Procesar items para limpiar campos innecesarios y asegurar formato correcto
        if (validatedData.items && Array.isArray(validatedData.items)) {
            validatedData.items = processOrderItems(validatedData.items);
        }

        // Crear la nueva orden con timestamps
        const newOrder = {
            ...validatedData,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        // Insertar la orden en la base de datos
        const result = await collection.insertOne(newOrder);

        if (!result.insertedId) {
            return { success: false, error: 'Failed to create order' };
        }

        // Si es una orden mayorista, guardar solo los datos personales en la colección mayoristas
        if (validatedData.orderType === 'mayorista') {
            try {
                // Preparar solo los datos personales para la colección mayoristas
                const mayoristaPersonData = {
                    user: validatedData.user,
                    address: validatedData.address,
                };

                // Crear o verificar si ya existe el mayorista
                const mayoristaResult = await createMayoristaPerson(mayoristaPersonData);

                if (!mayoristaResult.success) {
                    console.warn('Warning: Order created but failed to save mayorista person data:', mayoristaResult.error);
                } else {
                    if (mayoristaResult.isNew) {
                        console.log('Order created and new mayorista person added to mayoristas collection');
                    } else {
                        console.log('Order created and existing mayorista person found in mayoristas collection');
                    }
                }
            } catch (mayoristaError) {
                console.warn('Warning: Failed to save mayorista person data:', mayoristaError);
                // No fallar la creación de la orden principal por este error
            }
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
