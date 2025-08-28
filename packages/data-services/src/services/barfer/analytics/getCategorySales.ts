import 'server-only';
import { getCollection } from '@repo/database';

/**
 * Extracts weight in kilograms from a product's option name.
 * Returns null if no weight is found or if the product is a complement.
 * @param productName - The name of the product.
 * @param optionName - The option name, e.g., "5KG".
 * @returns The weight in KG, or null.
 */
const getWeightInKg = (productName: string, optionName: string): number | null => {
    const lowerProductName = productName.toLowerCase();

    if (lowerProductName.includes('big dog')) {
        return 15;
    }
    if (lowerProductName.includes('complemento')) {
        return null;
    }
    const match = optionName.match(/(\d+(?:\.\d+)?)\s*k?g/i);
    if (match && match[1]) {
        return parseFloat(match[1]);
    }
    return null;
};

/**
 * Obtiene estadísticas de ventas por categoría de producto
 */
export async function getCategorySales(statusFilter?: 'pending' | 'confirmed' | 'all', limit: number = 10, startDate?: Date, endDate?: Date) {
    try {
        const collection = await getCollection('orders');

        // Construir el match condition basado en el filtro
        const matchCondition: any = {};
        if (statusFilter && statusFilter !== 'all') {
            matchCondition.status = statusFilter;
        }

        // Agregar filtro de fechas si se proporciona
        if (startDate || endDate) {
            matchCondition.createdAt = {};
            if (startDate) matchCondition.createdAt.$gte = startDate;
            if (endDate) matchCondition.createdAt.$lte = endDate;
        }

        const pipeline: any[] = [];

        // Solo agregar match si hay condiciones
        if (Object.keys(matchCondition).length > 0) {
            pipeline.push({ $match: matchCondition });
        }

        pipeline.push(
            { $unwind: '$items' },
            { $unwind: '$items.options' },
            {
                $addFields: {
                    // Calcular precio efectivo: usar precio de opción si > 0, sino usar precio total de la orden
                    effectivePrice: {
                        $cond: [
                            { $gt: ['$items.options.price', 0] },
                            '$items.options.price',
                            { $divide: ['$total', { $sum: '$items.options.quantity' }] }
                        ]
                    }
                }
            },
            {
                $addFields: {
                    // Extraer categoría basada en las palabras más comunes y útiles
                    category: {
                        $switch: {
                            branches: [
                                {
                                    case: { $regexMatch: { input: '$items.name', regex: /big dog/i } },
                                    then: 'BIG DOG'
                                },
                                {
                                    case: { $regexMatch: { input: '$items.name', regex: /huesos/i } },
                                    then: 'HUESOS CARNOSOS'
                                },
                                {
                                    case: { $regexMatch: { input: '$items.name', regex: /complement/i } },
                                    then: 'COMPLEMENTOS'
                                },
                                {
                                    case: { $regexMatch: { input: '$items.name', regex: /perro/i } },
                                    then: 'PERRO'
                                },
                                {
                                    case: { $regexMatch: { input: '$items.name', regex: /gato/i } },
                                    then: 'GATO'
                                }
                            ],
                            default: 'OTROS'
                        }
                    }
                }
            },
            {
                $match: {
                    category: { $in: ['BIG DOG', 'PERRO', 'GATO', 'HUESOS CARNOSOS', 'COMPLEMENTOS'] }
                }
            },
            {
                $group: {
                    _id: '$category',
                    totalQuantity: { $sum: '$items.options.quantity' },
                    totalRevenue: { $sum: { $multiply: ['$items.options.quantity', '$items.options.price'] } },
                    orderCount: { $sum: 1 },
                    uniqueProducts: { $addToSet: '$items.name' },
                    avgPrice: { $avg: '$items.options.price' },
                    // Necesitamos agrupar los items para calcular el peso después
                    items: {
                        $push: {
                            quantity: '$items.options.quantity',
                            productName: '$items.name',
                            optionName: '$items.options.name'
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 1,
                    totalQuantity: 1,
                    totalRevenue: 1,
                    orderCount: 1,
                    uniqueProducts: { $size: '$uniqueProducts' },
                    avgPrice: 1,
                    items: 1 // Pasamos los items al siguiente stage
                }
            },
            { $sort: { totalQuantity: -1 } },
            { $limit: limit }
        );

        const result = await collection.aggregate(pipeline).toArray();

        console.log('=== DEBUG CATEGORÍAS ===');
        console.log('Pipeline result:', result);
        console.log('Limit usado:', limit);
        console.log('Status filter:', statusFilter);

        // Debug: Verificar si hay órdenes con BIG DOG
        console.log('Filtros aplicados:', {
            statusFilter,
            startDate: startDate?.toISOString(),
            endDate: endDate?.toISOString()
        });

        // Primero buscar SIN filtros de fecha para ver si existen
        const allBigDogOrders = await collection.find({
            'items.name': { $regex: /big dog/i }
        }).toArray();

        console.log('Todas las órdenes BIG DOG (sin filtros):', allBigDogOrders.length);
        if (allBigDogOrders.length > 0) {
            console.log('Primera orden BIG DOG (sin filtros):', {
                id: allBigDogOrders[0]._id,
                createdAt: allBigDogOrders[0].createdAt,
                status: allBigDogOrders[0].status,
                items: allBigDogOrders[0].items.map((item: any) => ({
                    name: item.name,
                    options: item.options
                }))
            });
        }

        // Ahora buscar CON filtros
        const bigDogOrders = await collection.find({
            'items.name': { $regex: /big dog/i },
            ...(statusFilter && statusFilter !== 'all' ? { status: statusFilter } : {}),
            ...(startDate || endDate ? {
                createdAt: {
                    ...(startDate ? { $gte: startDate } : {}),
                    ...(endDate ? { $lte: endDate } : {})
                }
            } : {})
        }).toArray();

        console.log('Órdenes con BIG DOG encontradas (con filtros):', bigDogOrders.length);

        // Si BIG DOG tiene revenue 0, calcular el revenue total de las órdenes BIG DOG
        let bigDogRevenue = 0;
        const bigDogItem = result.find((item: any) => item._id === 'BIG DOG');

        if (bigDogItem && bigDogItem.totalRevenue === 0) {
            const bigDogOrders = await collection.find({
                'items.name': { $regex: /big dog/i },
                ...(statusFilter && statusFilter !== 'all' ? { status: statusFilter } : {}),
                ...(startDate || endDate ? {
                    createdAt: {
                        ...(startDate ? { $gte: startDate } : {}),
                        ...(endDate ? { $lte: endDate } : {})
                    }
                } : {})
            }).toArray();

            bigDogRevenue = bigDogOrders.reduce((sum, order) => sum + (order.total || 0), 0);
        }

        const formattedResult = result.map((item: any) => {
            // Calcular el peso total para la categoría
            const totalWeight = item.items.reduce((acc: number, productItem: any) => {
                const weight = getWeightInKg(productItem.productName, productItem.optionName);
                if (weight !== null) {
                    return acc + (weight * productItem.quantity);
                }
                return acc;
            }, 0);

            // Usar el revenue calculado para BIG DOG si es necesario
            const adjustedRevenue = (item._id === 'BIG DOG' && item.totalRevenue === 0) ? bigDogRevenue : item.totalRevenue;

            return {
                categoryName: item._id,
                quantity: item.totalQuantity,
                revenue: adjustedRevenue,
                orders: item.orderCount,
                uniqueProducts: item.uniqueProducts,
                avgPrice: Math.round(item.avgPrice),
                statusFilter: statusFilter || 'all',
                totalWeight: totalWeight > 0 ? totalWeight : null,
            };
        });

        console.log('Resultado final formateado:', formattedResult);
        console.log('=== FIN DEBUG CATEGORÍAS ===');
        return formattedResult;

    } catch (error) {
        console.error('Error fetching category sales:', error);
        throw error;
    }
}

/**
 * Función de debug para verificar productos BIG DOG
 */
export async function debugBigDogProducts(): Promise<void> {
    try {
        const collection = await getCollection('orders');

        console.log('=== DEBUG: Verificando productos BIG DOG ===');

        // Buscar órdenes que contengan productos BIG DOG
        const bigDogOrders = await collection.find({
            'items.name': { $regex: /big dog/i }
        }).toArray();

        console.log(`Encontradas ${bigDogOrders.length} órdenes con productos BIG DOG`);

        if (bigDogOrders.length > 0) {
            console.log('Órdenes con BIG DOG:');
            bigDogOrders.forEach((order, index) => {
                console.log(`Orden ${index + 1}:`, {
                    id: order._id,
                    createdAt: order.createdAt,
                    status: order.status,
                    total: order.total
                });

                if (order.items) {
                    order.items.forEach((item: any, itemIndex: number) => {
                        if (item.name.toLowerCase().includes('big dog')) {
                            console.log(`  Producto BIG DOG ${itemIndex + 1}:`, {
                                name: item.name,
                                options: item.options?.length || 0
                            });

                            if (item.options) {
                                item.options.forEach((option: any, optIndex: number) => {
                                    console.log(`    Opción ${optIndex + 1}:`, {
                                        name: option.name,
                                        quantity: option.quantity,
                                        price: option.price
                                    });
                                });
                            }
                        }
                    });
                }
            });
        } else {
            console.log('No se encontraron órdenes con productos BIG DOG');
        }

        // Verificar categorización
        console.log('\n=== Verificando categorización ===');
        const sampleOrder = await collection.findOne({
            'items.name': { $regex: /big dog/i }
        });

        if (sampleOrder && sampleOrder.items) {
            sampleOrder.items.forEach((item: any) => {
                if (item.name.toLowerCase().includes('big dog')) {
                    console.log(`Producto: ${item.name}`);
                    console.log('Categorización esperada: BIG DOG');

                    // Simular la categorización del pipeline
                    const category = item.name.toLowerCase().includes('big dog') ? 'BIG DOG' : 'OTROS';
                    console.log(`Categorización resultante: ${category}`);
                }
            });
        }

        // Verificar filtros de fecha
        console.log('\n=== Verificando filtros de fecha ===');
        const orderDate = new Date(sampleOrder?.createdAt);
        console.log(`Fecha de la orden: ${orderDate}`);
        console.log(`Fecha de la orden (ISO): ${orderDate.toISOString()}`);

        // Verificar si la orden está dentro del rango de fechas típico
        const now = new Date();
        const oneYearAgo = new Date(now.getFullYear() - 1, 0, 1);
        const oneYearFromNow = new Date(now.getFullYear() + 1, 11, 31);

        console.log(`Rango típico: ${oneYearAgo.toISOString()} - ${oneYearFromNow.toISOString()}`);
        console.log(`¿Está dentro del rango típico? ${orderDate >= oneYearAgo && orderDate <= oneYearFromNow}`);

        // Verificar el pipeline completo
        console.log('\n=== Verificando pipeline completo ===');
        const testPipeline = [
            { $match: { 'items.name': { $regex: /big dog/i } } },
            { $unwind: '$items' },
            { $unwind: '$items.options' },
            {
                $addFields: {
                    category: {
                        $switch: {
                            branches: [
                                {
                                    case: { $regexMatch: { input: '$items.name', regex: /big dog/i } },
                                    then: 'BIG DOG'
                                },
                                {
                                    case: { $regexMatch: { input: '$items.name', regex: /huesos/i } },
                                    then: 'HUESOS CARNOSOS'
                                },
                                {
                                    case: { $regexMatch: { input: '$items.name', regex: /complement/i } },
                                    then: 'COMPLEMENTOS'
                                },
                                {
                                    case: { $regexMatch: { input: '$items.name', regex: /perro/i } },
                                    then: 'PERRO'
                                },
                                {
                                    case: { $regexMatch: { input: '$items.name', regex: /gato/i } },
                                    then: 'GATO'
                                }
                            ],
                            default: 'OTROS'
                        }
                    }
                }
            },
            {
                $match: {
                    category: { $in: ['BIG DOG', 'PERRO', 'GATO', 'HUESOS CARNOSOS', 'COMPLEMENTOS'] }
                }
            },
            {
                $group: {
                    _id: '$category',
                    totalQuantity: { $sum: '$items.options.quantity' },
                    totalRevenue: { $sum: { $multiply: ['$items.options.quantity', '$items.options.price'] } },
                    orderCount: { $sum: 1 }
                }
            }
        ];

        const testResult = await collection.aggregate(testPipeline).toArray();
        console.log('Resultado del pipeline de prueba:', testResult);

        // Verificar si el problema es el precio 0
        console.log('\n=== Verificando precios ===');
        if (sampleOrder && sampleOrder.items) {
            sampleOrder.items.forEach((item: any, index: number) => {
                if (item.name.toLowerCase().includes('big dog')) {
                    console.log(`Producto BIG DOG ${index + 1}: ${item.name}`);
                    if (item.options) {
                        item.options.forEach((option: any, optIndex: number) => {
                            console.log(`  Opción ${optIndex + 1}:`, {
                                name: option.name,
                                quantity: option.quantity,
                                price: option.price,
                                totalPrice: option.quantity * option.price
                            });
                        });
                    }
                }
            });
        }

        // Verificar si hay otras categorías con revenue > 0
        console.log('\n=== Verificando otras categorías ===');
        const allCategoriesResult = await collection.aggregate([
            { $unwind: '$items' },
            { $unwind: '$items.options' },
            {
                $addFields: {
                    category: {
                        $switch: {
                            branches: [
                                {
                                    case: { $regexMatch: { input: '$items.name', regex: /big dog/i } },
                                    then: 'BIG DOG'
                                },
                                {
                                    case: { $regexMatch: { input: '$items.name', regex: /huesos/i } },
                                    then: 'HUESOS CARNOSOS'
                                },
                                {
                                    case: { $regexMatch: { input: '$items.name', regex: /complement/i } },
                                    then: 'COMPLEMENTOS'
                                },
                                {
                                    case: { $regexMatch: { input: '$items.name', regex: /perro/i } },
                                    then: 'PERRO'
                                },
                                {
                                    case: { $regexMatch: { input: '$items.name', regex: /gato/i } },
                                    then: 'GATO'
                                }
                            ],
                            default: 'OTROS'
                        }
                    }
                }
            },
            {
                $match: {
                    category: { $in: ['BIG DOG', 'PERRO', 'GATO', 'HUESOS CARNOSOS', 'COMPLEMENTOS'] }
                }
            },
            {
                $group: {
                    _id: '$category',
                    totalQuantity: { $sum: '$items.options.quantity' },
                    totalRevenue: { $sum: { $multiply: ['$items.options.quantity', '$items.options.price'] } },
                    orderCount: { $sum: 1 },
                    avgPrice: { $avg: '$items.options.price' },
                    maxPrice: { $max: '$items.options.price' },
                    minPrice: { $min: '$items.options.price' }
                }
            },
            { $sort: { totalRevenue: -1 } }
        ]).toArray();

        console.log('Todas las categorías con detalles de precios:', allCategoriesResult);

    } catch (error) {
        console.error('Error en debug de BIG DOG:', error);
        throw error;
    }
} 