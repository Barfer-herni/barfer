import 'server-only';
import { getCollection, ObjectId } from '@repo/database';
import { z } from 'zod';
import { format } from 'date-fns';
import type { Order } from '../../types/barfer';

const createOrderSchema = z.object({
    status: z.enum(['pending', 'confirmed', 'delivered', 'cancelled']).default('pending'),
    total: z.number().positive(),
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
        email: z.string().email(),
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
    deliveryDay: z.string(),
});

export async function createOrder(data: z.infer<typeof createOrderSchema>): Promise<{ success: boolean; order?: Order; error?: string }> {
    try {
        // Validar los datos de entrada
        const validatedData = createOrderSchema.parse(data);

        const collection = await getCollection('orders');

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
