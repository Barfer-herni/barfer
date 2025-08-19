import 'server-only';
import { getCollection } from '@repo/database';

interface ProductQuantity {
    month: string;
    // Productos Perro
    pollo: number;
    vaca: number;
    cerdo: number;
    cordero: number;
    bigDogPollo: number;
    bigDogVaca: number;
    totalPerro: number;
    // Productos Gato
    gatoPollo: number;
    gatoVaca: number;
    gatoCordero: number;
    totalGato: number;
    // Otros
    huesosCarnosos: number;
    // Total del mes
    totalMes: number;
}

interface QuantityStatsByType {
    minorista: ProductQuantity[];
    sameDay: ProductQuantity[];
    mayorista: ProductQuantity[];
}

/**
 * Extrae el peso en kilogramos de un producto basado en su nombre
 */
const getProductWeight = (productName: string, optionName: string): number => {
    const lowerProductName = productName.toLowerCase();
    const lowerOptionName = optionName.toLowerCase();

    // Big Dog productos
    if (lowerProductName.includes('big dog')) {
        return 15; // Big Dog siempre es 15KG
    }

    // Extraer peso del nombre de la opción (ej: "5KG", "10KG", "2.5KG")
    const weightMatch = lowerOptionName.match(/(\d+(?:\.\d+)?)\s*kg/i);
    if (weightMatch) {
        const weight = parseFloat(weightMatch[1]);
        return weight;
    }

    // Buscar peso en el nombre del producto también
    const productWeightMatch = lowerProductName.match(/(\d+(?:\.\d+)?)\s*kg/i);
    if (productWeightMatch) {
        const weight = parseFloat(productWeightMatch[1]);
        return weight;
    }

    // Valores por defecto basados en el nombre del producto
    if (lowerProductName.includes('huesos') || lowerProductName.includes('carnosos')) {
        return 1; // Huesos carnosos
    }

    // Productos estándar - intentar extraer peso de diferentes formatos
    if (lowerProductName.includes('pollo') || lowerProductName.includes('vaca') ||
        lowerProductName.includes('cerdo') || lowerProductName.includes('cordero')) {

        // Buscar patrones como "5kg", "10kg", "2.5kg" en el nombre del producto
        const standardWeightMatch = lowerProductName.match(/(\d+(?:\.\d+)?)\s*k?g?/i);
        if (standardWeightMatch) {
            const weight = parseFloat(standardWeightMatch[1]);
            return weight;
        }

        // Si no se encuentra, usar valor por defecto
        return 5; // Productos estándar
    }

    return 0; // Producto no reconocido
};

/**
 * Categoriza un producto basado en su nombre y opción
 */
const categorizeProduct = (productName: string, optionName: string): {
    category: 'perro' | 'gato' | 'otros';
    subcategory: string;
} => {
    const lowerName = productName.toLowerCase();
    const lowerOptionName = optionName.toLowerCase();

    // Big Dog productos (perro) - el nombre es "BIG DOG (15kg)" y la variante está en options
    if (lowerName.includes('big dog')) {
        if (lowerOptionName.includes('pollo')) return { category: 'perro', subcategory: 'bigDogPollo' };
        if (lowerOptionName.includes('vaca')) return { category: 'perro', subcategory: 'bigDogVaca' };
        return { category: 'perro', subcategory: 'bigDog' };
    }

    // Productos de gato
    if (lowerName.includes('gato')) {
        if (lowerName.includes('pollo')) return { category: 'gato', subcategory: 'gatoPollo' };
        if (lowerName.includes('vaca')) return { category: 'gato', subcategory: 'gatoVaca' };
        if (lowerName.includes('cordero')) return { category: 'gato', subcategory: 'gatoCordero' };
        return { category: 'gato', subcategory: 'gato' };
    }

    // Productos de perro estándar
    if (lowerName.includes('pollo')) return { category: 'perro', subcategory: 'pollo' };
    if (lowerName.includes('vaca')) return { category: 'perro', subcategory: 'vaca' };
    if (lowerName.includes('cerdo')) return { category: 'perro', subcategory: 'cerdo' };
    if (lowerName.includes('cordero')) return { category: 'perro', subcategory: 'cordero' };

    // Otros productos
    if (lowerName.includes('huesos') || lowerName.includes('carnosos')) {
        return { category: 'otros', subcategory: 'huesosCarnosos' };
    }

    return { category: 'otros', subcategory: 'otros' };
};

/**
 * Función de prueba simple para verificar productos
 */
export async function testProductData(): Promise<void> {
    try {
        const collection = await getCollection('orders');

        console.log('=== TEST: Verificando datos de productos ===');

        // Obtener una orden de ejemplo
        const sampleOrder = await collection.findOne({});

        if (!sampleOrder) {
            console.log('No se encontraron órdenes en la base de datos');
            return;
        }

        console.log('Orden de ejemplo:', {
            id: sampleOrder._id,
            orderType: sampleOrder.orderType,
            createdAt: sampleOrder.createdAt,
            total: sampleOrder.total
        });

        if (sampleOrder.items && sampleOrder.items.length > 0) {
            console.log('Productos en la orden:');
            sampleOrder.items.forEach((item: any, index: number) => {
                console.log(`  Producto ${index + 1}:`, {
                    name: item.name,
                    options: item.options?.length || 0
                });

                if (item.options) {
                    item.options.forEach((option: any, optIndex: number) => {
                        const weight = getProductWeight(item.name, option.name);
                        const { category, subcategory } = categorizeProduct(item.name, option.name);

                        console.log(`    Opción ${optIndex + 1}:`, {
                            name: option.name,
                            quantity: option.quantity,
                            price: option.price,
                            calculatedWeight: weight,
                            category,
                            subcategory
                        });
                    });
                }
            });
        } else {
            console.log('No hay productos en esta orden');
        }

    } catch (error) {
        console.error('Error en test de productos:', error);
        throw error;
    }
}

/**
 * Función de debug para verificar los datos de cantidad
 */
export async function debugQuantityStats(startDate?: Date, endDate?: Date): Promise<void> {
    try {
        const collection = await getCollection('orders');

        console.log('=== DEBUG: Verificando datos de cantidad ===');
        console.log('Fechas:', { startDate, endDate });

        // 1. Verificar todas las órdenes en el período
        const matchCondition: any = {};
        if (startDate || endDate) {
            matchCondition.createdAt = {};
            if (startDate) matchCondition.createdAt.$gte = startDate;
            if (endDate) matchCondition.createdAt.$lte = endDate;
        }

        const allOrders = await collection.find(matchCondition).limit(5).toArray();
        console.log('Órdenes encontradas:', allOrders.length);

        allOrders.forEach((order, index) => {
            console.log(`Orden ${index + 1}:`, {
                id: order._id,
                orderType: order.orderType,
                createdAt: order.createdAt,
                total: order.total,
                items: order.items?.length || 0
            });

            // Verificar items de la orden
            if (order.items) {
                order.items.forEach((item: any, itemIndex: number) => {
                    console.log(`  Item ${itemIndex + 1}:`, {
                        name: item.name,
                        options: item.options?.length || 0
                    });

                    if (item.options) {
                        item.options.forEach((option: any, optionIndex: number) => {
                            const weight = getProductWeight(item.name, option.name);
                            const { category, subcategory } = categorizeProduct(item.name, option.name);
                            console.log(`    Option ${optionIndex + 1}:`, {
                                name: option.name,
                                quantity: option.quantity,
                                price: option.price,
                                calculatedWeight: weight,
                                category,
                                subcategory,
                                totalWeight: weight * option.quantity
                            });
                        });
                    }
                });
            }
        });

    } catch (error) {
        console.error('Error en debug de cantidad:', error);
        throw error;
    }
}

export async function getQuantityStatsByMonth(startDate?: Date, endDate?: Date): Promise<QuantityStatsByType> {
    try {
        const collection = await getCollection('orders');



        const pipeline: any[] = [];

        // Convertir createdAt a Date si es necesario
        pipeline.push({
            $addFields: {
                createdAt: {
                    $cond: [
                        { $eq: [{ $type: "$createdAt" }, "string"] },
                        { $toDate: "$createdAt" },
                        "$createdAt"
                    ]
                }
            }
        });

        // Aplicar filtros de fecha
        if (startDate || endDate) {
            const matchCondition: any = {};
            matchCondition.createdAt = {};
            if (startDate) matchCondition.createdAt.$gte = startDate;
            if (endDate) matchCondition.createdAt.$lte = endDate;
            pipeline.push({ $match: matchCondition });
        }

        pipeline.push(
            // Agregar campos para clasificación
            {
                $addFields: {
                    isSameDayDelivery: {
                        $or: [
                            { $eq: ["$deliveryArea.sameDayDelivery", true] },
                            { $eq: ["$items.sameDayDelivery", true] }
                        ]
                    },
                    isWholesale: {
                        $cond: [
                            { $eq: ["$orderType", "mayorista"] },
                            true,
                            false
                        ]
                    }
                }
            },
            // Unwind items para procesar cada producto
            { $unwind: '$items' },
            { $unwind: '$items.options' },
            // Agrupar por mes, tipo de cliente y producto
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" },
                        clientType: {
                            $cond: [
                                "$isWholesale",
                                "mayorista",
                                {
                                    $cond: [
                                        "$isSameDayDelivery",
                                        "sameDay",
                                        "minorista"
                                    ]
                                }
                            ]
                        },
                        productName: "$items.name",
                        optionName: "$items.options.name"
                    },
                    totalQuantity: { $sum: "$items.options.quantity" },
                    totalWeight: { $sum: { $multiply: ["$items.options.quantity", 1] } } // Placeholder, se calculará después
                }
            },
            {
                $sort: { "_id.year": 1, "_id.month": 1 }
            }
        );

        const result = await collection.aggregate(pipeline).toArray();



        // Procesar resultados y calcular cantidades
        const processedData: QuantityStatsByType = {
            minorista: [],
            sameDay: [],
            mayorista: []
        };

        // Agrupar por mes y tipo de cliente
        const groupedByMonth: { [key: string]: { [clientType: string]: ProductQuantity } } = {};

        result.forEach((item: any) => {
            const month = `${item._id.year}-${String(item._id.month).padStart(2, '0')}`;
            const clientType = item._id.clientType;
            const productName = item._id.productName;
            const optionName = item._id.optionName;
            const quantity = item.totalQuantity;



            // Calcular peso real
            const weight = getProductWeight(productName, optionName);
            const totalWeight = weight * quantity;

            // Inicializar mes si no existe
            if (!groupedByMonth[month]) {
                groupedByMonth[month] = {
                    minorista: {
                        month,
                        pollo: 0, vaca: 0, cerdo: 0, cordero: 0,
                        bigDogPollo: 0, bigDogVaca: 0, totalPerro: 0,
                        gatoPollo: 0, gatoVaca: 0, gatoCordero: 0, totalGato: 0,
                        huesosCarnosos: 0, totalMes: 0
                    },
                    sameDay: {
                        month,
                        pollo: 0, vaca: 0, cerdo: 0, cordero: 0,
                        bigDogPollo: 0, bigDogVaca: 0, totalPerro: 0,
                        gatoPollo: 0, gatoVaca: 0, gatoCordero: 0, totalGato: 0,
                        huesosCarnosos: 0, totalMes: 0
                    },
                    mayorista: {
                        month,
                        pollo: 0, vaca: 0, cerdo: 0, cordero: 0,
                        bigDogPollo: 0, bigDogVaca: 0, totalPerro: 0,
                        gatoPollo: 0, gatoVaca: 0, gatoCordero: 0, totalGato: 0,
                        huesosCarnosos: 0, totalMes: 0
                    }
                };
            }

            // Categorizar producto
            const { subcategory } = categorizeProduct(productName, optionName);



            // Asignar peso a la categoría correspondiente
            switch (subcategory) {
                case 'pollo':
                    groupedByMonth[month][clientType].pollo += totalWeight;
                    break;
                case 'vaca':
                    groupedByMonth[month][clientType].vaca += totalWeight;
                    break;
                case 'cerdo':
                    groupedByMonth[month][clientType].cerdo += totalWeight;
                    break;
                case 'cordero':
                    groupedByMonth[month][clientType].cordero += totalWeight;
                    break;
                case 'bigDogPollo':
                    groupedByMonth[month][clientType].bigDogPollo += totalWeight;
                    break;
                case 'bigDogVaca':
                    groupedByMonth[month][clientType].bigDogVaca += totalWeight;
                    break;
                case 'gatoPollo':
                    groupedByMonth[month][clientType].gatoPollo += totalWeight;
                    break;
                case 'gatoVaca':
                    groupedByMonth[month][clientType].gatoVaca += totalWeight;
                    break;
                case 'gatoCordero':
                    groupedByMonth[month][clientType].gatoCordero += totalWeight;
                    break;
                case 'huesosCarnosos':
                    groupedByMonth[month][clientType].huesosCarnosos += totalWeight;
                    break;
            }

            groupedByMonth[month][clientType].totalMes += totalWeight;
        });



        // Calcular totales y redondear
        Object.keys(groupedByMonth).forEach(month => {
            Object.keys(groupedByMonth[month]).forEach(clientType => {
                const data = groupedByMonth[month][clientType];

                // Calcular totales
                data.totalPerro = data.pollo + data.vaca + data.cerdo + data.cordero + data.bigDogPollo + data.bigDogVaca;
                data.totalGato = data.gatoPollo + data.gatoVaca + data.gatoCordero;

                // Redondear a 2 decimales
                Object.keys(data).forEach(key => {
                    if (key !== 'month' && typeof data[key as keyof ProductQuantity] === 'number') {
                        (data as any)[key] = Math.round((data as any)[key] * 100) / 100;
                    }
                });

                // Agregar a los datos procesados
                processedData[clientType as keyof QuantityStatsByType].push(data);
            });
        });



        return processedData;

    } catch (error) {
        console.error('Error fetching quantity stats by month:', error);
        throw error;
    }
} 