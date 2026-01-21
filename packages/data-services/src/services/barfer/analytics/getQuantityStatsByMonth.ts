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
    let weight = 0;

    // 1. Buscar peso en el nombre del producto (Prioridad 1 en Express)
    const productWeightMatch = lowerProductName.match(/(\d+(?:\.\d+)?)\s*k?g?/i);
    if (productWeightMatch) {
        weight = parseFloat(productWeightMatch[1]);
    }
    // 2. Si es BOX y no teniamos peso en nombre -> 10kg (Prioridad 2 en Express)
    else if (lowerProductName.includes('box')) {
        weight = 10;
    }
    // 3. Buscar peso en opción (Prioridad 3 en Express)
    else {
        const weightMatch = lowerOptionName.match(/(\d+(?:\.\d+)?)\s*k?g?/i);
        if (weightMatch) {
            weight = parseFloat(weightMatch[1]);
        }
    }

    return weight;
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

    // Construir full name para búsquedas robustas (como hicimos en Express)
    const fullName = `${lowerName} ${lowerOptionName}`;

    // Big Dog productos (perro)
    if (lowerName.includes('big dog')) {
        if (fullName.includes('pollo')) return { category: 'perro', subcategory: 'bigDogPollo' };
        if (fullName.includes('vaca')) return { category: 'perro', subcategory: 'bigDogVaca' };
        return { category: 'perro', subcategory: 'bigDog' };
    }

    // Productos de gato
    if (lowerName.includes('gato')) {
        if (fullName.includes('pollo')) return { category: 'gato', subcategory: 'gatoPollo' };
        if (fullName.includes('vaca')) return { category: 'gato', subcategory: 'gatoVaca' };
        if (fullName.includes('cordero')) return { category: 'gato', subcategory: 'gatoCordero' };
        return { category: 'gato', subcategory: 'gato' };
    }

    // Productos de perro estándar
    if (fullName.includes('pollo')) return { category: 'perro', subcategory: 'pollo' };
    if (fullName.includes('vaca')) return { category: 'perro', subcategory: 'vaca' };
    if (fullName.includes('cerdo')) return { category: 'perro', subcategory: 'cerdo' };
    if (fullName.includes('cordero')) return { category: 'perro', subcategory: 'cordero' };

    // Otros productos - Lógica estricta de Express para Huesos
    if ((lowerName.includes('huesos carnosos') || lowerName.includes('hueso carnoso')) &&
        !lowerName.includes('recreativo') &&
        !lowerName.includes('caldo')) {
        return { category: 'otros', subcategory: 'huesosCarnosos' };
    }

    return { category: 'otros', subcategory: 'otros' };
};

export async function getQuantityStatsByMonth(startDate?: Date, endDate?: Date): Promise<QuantityStatsByType> {
    try {
        const collection = await getCollection('orders');



        const pipeline: any[] = [];

        // Convertir createdAt a Date si es necesario y calcualr effectiveDate
        pipeline.push({
            $addFields: {
                createdAtTyped: {
                    $cond: [
                        { $eq: [{ $type: "$createdAt" }, "string"] },
                        { $toDate: "$createdAt" },
                        "$createdAt"
                    ]
                }
            }
        });

        pipeline.push({
            $addFields: {
                effectiveDate: {
                    $ifNull: [
                        "$deliveryDay",
                        { $subtract: ["$createdAtTyped", 3 * 60 * 60 * 1000] }
                    ]
                }
            }
        });

        // Aplicar filtros de fecha usando effectiveDate
        if (startDate || endDate) {
            const matchCondition: any = {};
            matchCondition.effectiveDate = {};
            if (startDate) matchCondition.effectiveDate.$gte = startDate;
            if (endDate) matchCondition.effectiveDate.$lte = endDate;
            pipeline.push({ $match: matchCondition });
        }

        pipeline.push(
            // Agregar campos para clasificación
            {
                $addFields: {
                    isSameDayDelivery: {
                        $or: [
                            { $eq: ["$deliveryArea.sameDayDelivery", true] },
                            { $eq: ["$items.sameDayDelivery", true] },
                            { $eq: ["$paymentMethod", "bank-transfer"] }
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
            // IMPORTANTE: preserveNullAndEmptyArrays para no perder productos sin opciones (ej: BOX simples)
            { $unwind: { path: '$items.options', preserveNullAndEmptyArrays: true } },
            // Agrupar por mes, tipo de cliente y producto
            {
                $group: {
                    _id: {
                        year: { $year: "$effectiveDate" },
                        month: { $month: "$effectiveDate" },
                        clientType: {
                            $cond: [
                                "$isSameDayDelivery",
                                "sameDay",
                                {
                                    $cond: [
                                        "$isWholesale",
                                        "mayorista",
                                        "minorista"
                                    ]
                                }
                            ]
                        },
                        productName: "$items.name",
                        // Si no hay opción, usar string vacío para validaciones
                        optionName: { $ifNull: ["$items.options.name", ""] }
                    },
                    // Si hay item.quantity, usarlo (Express logic: item.quantity || item.options[0].quantity).
                    // Esto corrige el caso donde item.quantity = 2 y options.quantity = 1 (2 bolsas de 10kg).
                    totalQuantity: {
                        $sum: {
                            $ifNull: ["$items.quantity", "$items.options.quantity"]
                        }
                    },
                    // Placeholder (el peso se calcula después en el map)
                    totalWeight: { $sum: 0 }
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