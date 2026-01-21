import 'server-only';
import { getCollection, ObjectId } from '@repo/database';
import type {
    DetalleEnvio,
    CreateDetalleEnvioData,
    UpdateDetalleEnvioData,
} from '../../types/barfer';

const COLLECTION_NAME = 'detalleEnvio';

/**
 * Crear un nuevo detalle de envío
 */
export async function createDetalleEnvioMongo(
    data: CreateDetalleEnvioData
): Promise<{ success: boolean; detalleEnvio?: DetalleEnvio; message?: string }> {
    try {
        const collection = await getCollection(COLLECTION_NAME);

        const now = new Date().toISOString();

        const newDetalleEnvio = {
            puntoEnvio: data.puntoEnvio,
            fecha: data.fecha,
            pollo: data.pollo,
            vaca: data.vaca,
            cerdo: data.cerdo,
            cordero: data.cordero,
            bigDogPollo: data.bigDogPollo,
            bigDogVaca: data.bigDogVaca,
            totalPerro: data.totalPerro,
            gatoPollo: data.gatoPollo,
            gatoVaca: data.gatoVaca,
            gatoCordero: data.gatoCordero,
            totalGato: data.totalGato,
            huesosCarnosos: data.huesosCarnosos,
            totalMes: data.totalMes,
            createdAt: now,
            updatedAt: now,
        };

        const result = await collection.insertOne(newDetalleEnvio);

        return {
            success: true,
            detalleEnvio: {
                _id: result.insertedId.toString(),
                puntoEnvio: newDetalleEnvio.puntoEnvio,
                fecha: newDetalleEnvio.fecha,
                pollo: newDetalleEnvio.pollo ?? 0,
                vaca: newDetalleEnvio.vaca ?? 0,
                cerdo: newDetalleEnvio.cerdo ?? 0,
                cordero: newDetalleEnvio.cordero ?? 0,
                bigDogPollo: newDetalleEnvio.bigDogPollo ?? 0,
                bigDogVaca: newDetalleEnvio.bigDogVaca ?? 0,
                totalPerro: newDetalleEnvio.totalPerro ?? 0,
                gatoPollo: newDetalleEnvio.gatoPollo ?? 0,
                gatoVaca: newDetalleEnvio.gatoVaca ?? 0,
                gatoCordero: newDetalleEnvio.gatoCordero ?? 0,
                totalGato: newDetalleEnvio.totalGato ?? 0,
                huesosCarnosos: newDetalleEnvio.huesosCarnosos ?? 0,
                totalMes: newDetalleEnvio.totalMes ?? 0,
                createdAt: newDetalleEnvio.createdAt,
                updatedAt: newDetalleEnvio.updatedAt,
            },
            message: 'Detalle de envío creado exitosamente',
        };
    } catch (error) {
        console.error('Error al crear detalle de envío:', error);
        return {
            success: false,
            message: 'Error al crear el detalle de envío',
        };
    }
}

/**
 * Calcula el peso de un producto basado en su nombre y opción
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
        return parseFloat(weightMatch[1]);
    }

    // Buscar peso en el nombre del producto también
    const productWeightMatch = lowerProductName.match(/(\d+(?:\.\d+)?)\s*kg/i);
    if (productWeightMatch) {
        return parseFloat(productWeightMatch[1]);
    }

    // Valores por defecto basados en el nombre del producto
    if (lowerProductName.includes('huesos') || lowerProductName.includes('carnosos')) {
        return 1; // Huesos carnosos
    }

    // Productos estándar - intentar extraer peso de diferentes formatos
    if (lowerProductName.includes('pollo') || lowerProductName.includes('vaca') ||
        lowerProductName.includes('cerdo') || lowerProductName.includes('cordero')) {
        const standardWeightMatch = lowerProductName.match(/(\d+(?:\.\d+)?)\s*k?g?/i);
        if (standardWeightMatch) {
            return parseFloat(standardWeightMatch[1]);
        }
        return 5; // Productos estándar por defecto
    }

    return 0; // Producto no reconocido
};

/**
 * Categoriza un producto basado en su nombre y opción
 */
const categorizeProduct = (productName: string, optionName: string): {
    category: 'perro' | 'gato' | 'otros';
    subcategory: 'pollo' | 'vaca' | 'cerdo' | 'cordero' | 'bigDogPollo' | 'bigDogVaca' | 'gatoPollo' | 'gatoVaca' | 'gatoCordero' | 'huesosCarnosos';
} => {
    const lowerProductName = productName.toLowerCase();
    const lowerOptionName = optionName.toLowerCase();

    // Big Dog productos
    if (lowerProductName.includes('big dog')) {
        if (lowerProductName.includes('pollo')) {
            return { category: 'perro', subcategory: 'bigDogPollo' };
        }
        if (lowerProductName.includes('vaca')) {
            return { category: 'perro', subcategory: 'bigDogVaca' };
        }
    }

    // Huesos carnosos
    if (lowerProductName.includes('huesos') || lowerProductName.includes('carnosos')) {
        return { category: 'otros', subcategory: 'huesosCarnosos' };
    }

    // Productos Gato
    if (lowerProductName.includes('gato')) {
        if (lowerProductName.includes('pollo')) {
            return { category: 'gato', subcategory: 'gatoPollo' };
        }
        if (lowerProductName.includes('vaca')) {
            return { category: 'gato', subcategory: 'gatoVaca' };
        }
        if (lowerProductName.includes('cordero')) {
            return { category: 'gato', subcategory: 'gatoCordero' };
        }
    }

    // Productos Perro
    if (lowerProductName.includes('pollo')) {
        return { category: 'perro', subcategory: 'pollo' };
    }
    if (lowerProductName.includes('vaca')) {
        return { category: 'perro', subcategory: 'vaca' };
    }
    if (lowerProductName.includes('cerdo')) {
        return { category: 'perro', subcategory: 'cerdo' };
    }
    if (lowerProductName.includes('cordero')) {
        return { category: 'perro', subcategory: 'cordero' };
    }

    // Por defecto
    return { category: 'perro', subcategory: 'pollo' };
};

/**
 * Obtener todos los detalles de envío de un punto de envío
 * Calcula el detalle desde las órdenes (sameDay) del punto de envío
 */
export async function getDetalleEnvioByPuntoEnvioMongo(
    puntoEnvio: string
): Promise<{ success: boolean; detalleEnvio?: DetalleEnvio[]; message?: string }> {
    try {
        const ordersCollection = await getCollection('orders');

        // Pipeline para calcular detalle desde órdenes
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

        // Filtrar por punto de envío y sameDay (lógica express completa: sameDayDelivery OR bank-transfer)
        pipeline.push({
            $match: {
                puntoEnvio: puntoEnvio,
                $or: [
                    { 'deliveryArea.sameDayDelivery': true },
                    { paymentMethod: 'bank-transfer' }
                ]
            }
        });

        // Unwind items para procesar cada producto
        pipeline.push({ $unwind: '$items' });
        pipeline.push({ $unwind: '$items.options' });

        // Agrupar por mes y producto
        pipeline.push({
            $group: {
                _id: {
                    year: { $year: "$createdAt" },
                    month: { $month: "$createdAt" },
                    productName: "$items.name",
                    optionName: "$items.options.name"
                },
                totalQuantity: { $sum: "$items.options.quantity" }
            }
        });

        pipeline.push({
            $sort: { "_id.year": 1, "_id.month": 1 }
        });

        const result = await ordersCollection.aggregate(pipeline).toArray();

        // Procesar resultados y calcular cantidades
        const groupedByMonth: { [key: string]: DetalleEnvio } = {};

        result.forEach((item: any) => {
            const month = `${item._id.year}-${String(item._id.month).padStart(2, '0')}`;
            const productName = item._id.productName;
            const optionName = item._id.optionName;
            const quantity = item.totalQuantity;

            // Calcular peso real
            const weight = getProductWeight(productName, optionName);
            const totalWeight = weight * quantity;

            // Inicializar mes si no existe
            if (!groupedByMonth[month]) {
                groupedByMonth[month] = {
                    _id: month, // Usar month como ID temporal
                    puntoEnvio: puntoEnvio,
                    fecha: month,
                    pollo: 0,
                    vaca: 0,
                    cerdo: 0,
                    cordero: 0,
                    bigDogPollo: 0,
                    bigDogVaca: 0,
                    totalPerro: 0,
                    gatoPollo: 0,
                    gatoVaca: 0,
                    gatoCordero: 0,
                    totalGato: 0,
                    huesosCarnosos: 0,
                    totalMes: 0,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                };
            }

            // Categorizar producto
            const { subcategory } = categorizeProduct(productName, optionName);

            // Asignar peso a la categoría correspondiente
            switch (subcategory) {
                case 'pollo':
                    groupedByMonth[month].pollo += totalWeight;
                    break;
                case 'vaca':
                    groupedByMonth[month].vaca += totalWeight;
                    break;
                case 'cerdo':
                    groupedByMonth[month].cerdo += totalWeight;
                    break;
                case 'cordero':
                    groupedByMonth[month].cordero += totalWeight;
                    break;
                case 'bigDogPollo':
                    groupedByMonth[month].bigDogPollo += totalWeight;
                    break;
                case 'bigDogVaca':
                    groupedByMonth[month].bigDogVaca += totalWeight;
                    break;
                case 'gatoPollo':
                    groupedByMonth[month].gatoPollo += totalWeight;
                    break;
                case 'gatoVaca':
                    groupedByMonth[month].gatoVaca += totalWeight;
                    break;
                case 'gatoCordero':
                    groupedByMonth[month].gatoCordero += totalWeight;
                    break;
                case 'huesosCarnosos':
                    groupedByMonth[month].huesosCarnosos += totalWeight;
                    break;
            }

            groupedByMonth[month].totalMes += totalWeight;
        });

        // Calcular totales y redondear
        const detalles: DetalleEnvio[] = Object.values(groupedByMonth).map((detalle) => {
            // Calcular totales
            detalle.totalPerro = detalle.pollo + detalle.vaca + detalle.cerdo + detalle.cordero + detalle.bigDogPollo + detalle.bigDogVaca;
            detalle.totalGato = detalle.gatoPollo + detalle.gatoVaca + detalle.gatoCordero;

            // Redondear a 2 decimales
            const rounded = {
                ...detalle,
                pollo: Math.round(detalle.pollo * 100) / 100,
                vaca: Math.round(detalle.vaca * 100) / 100,
                cerdo: Math.round(detalle.cerdo * 100) / 100,
                cordero: Math.round(detalle.cordero * 100) / 100,
                bigDogPollo: Math.round(detalle.bigDogPollo * 100) / 100,
                bigDogVaca: Math.round(detalle.bigDogVaca * 100) / 100,
                totalPerro: Math.round(detalle.totalPerro * 100) / 100,
                gatoPollo: Math.round(detalle.gatoPollo * 100) / 100,
                gatoVaca: Math.round(detalle.gatoVaca * 100) / 100,
                gatoCordero: Math.round(detalle.gatoCordero * 100) / 100,
                totalGato: Math.round(detalle.totalGato * 100) / 100,
                huesosCarnosos: Math.round(detalle.huesosCarnosos * 100) / 100,
                totalMes: Math.round(detalle.totalMes * 100) / 100,
            };

            return rounded;
        }).sort((a, b) => b.fecha.localeCompare(a.fecha)); // Ordenar por fecha descendente

        return {
            success: true,
            detalleEnvio: detalles,
        };
    } catch (error) {
        console.error('Error al obtener detalles de envío:', error);
        return {
            success: false,
            detalleEnvio: [],
            message: 'Error al obtener los detalles de envío',
        };
    }
}

/**
 * Obtener un detalle de envío por ID
 */
export async function getDetalleEnvioByIdMongo(
    id: string
): Promise<{ success: boolean; detalleEnvio?: DetalleEnvio; message?: string }> {
    try {
        const collection = await getCollection(COLLECTION_NAME);

        const detalle = await collection.findOne({ _id: new ObjectId(id) });

        if (!detalle) {
            return {
                success: false,
                message: 'Detalle de envío no encontrado',
            };
        }

        return {
            success: true,
            detalleEnvio: {
                _id: detalle._id.toString(),
                puntoEnvio: detalle.puntoEnvio,
                fecha: detalle.fecha instanceof Date ? detalle.fecha.toISOString() : detalle.fecha,
                pollo: detalle.pollo,
                vaca: detalle.vaca,
                cerdo: detalle.cerdo,
                cordero: detalle.cordero,
                bigDogPollo: detalle.bigDogPollo,
                bigDogVaca: detalle.bigDogVaca,
                totalPerro: detalle.totalPerro,
                gatoPollo: detalle.gatoPollo,
                gatoVaca: detalle.gatoVaca,
                gatoCordero: detalle.gatoCordero,
                totalGato: detalle.totalGato,
                huesosCarnosos: detalle.huesosCarnosos,
                totalMes: detalle.totalMes,
                createdAt: detalle.createdAt instanceof Date ? detalle.createdAt.toISOString() : detalle.createdAt,
                updatedAt: detalle.updatedAt instanceof Date ? detalle.updatedAt.toISOString() : detalle.updatedAt,
            },
        };
    } catch (error) {
        console.error('Error al obtener detalle de envío:', error);
        return {
            success: false,
            message: 'Error al obtener el detalle de envío',
        };
    }
}

/**
 * Actualizar un detalle de envío
 */
export async function updateDetalleEnvioMongo(
    id: string,
    data: UpdateDetalleEnvioData
): Promise<{ success: boolean; detalleEnvio?: DetalleEnvio; message?: string }> {
    try {
        const collection = await getCollection(COLLECTION_NAME);

        const updateData: any = {
            updatedAt: new Date().toISOString(),
        };

        if (data.puntoEnvio !== undefined) updateData.puntoEnvio = data.puntoEnvio;
        if (data.fecha !== undefined) updateData.fecha = data.fecha;
        if (data.pollo !== undefined) updateData.pollo = data.pollo;
        if (data.vaca !== undefined) updateData.vaca = data.vaca;
        if (data.cerdo !== undefined) updateData.cerdo = data.cerdo;
        if (data.cordero !== undefined) updateData.cordero = data.cordero;
        if (data.bigDogPollo !== undefined) updateData.bigDogPollo = data.bigDogPollo;
        if (data.bigDogVaca !== undefined) updateData.bigDogVaca = data.bigDogVaca;
        if (data.totalPerro !== undefined) updateData.totalPerro = data.totalPerro;
        if (data.gatoPollo !== undefined) updateData.gatoPollo = data.gatoPollo;
        if (data.gatoVaca !== undefined) updateData.gatoVaca = data.gatoVaca;
        if (data.gatoCordero !== undefined) updateData.gatoCordero = data.gatoCordero;
        if (data.totalGato !== undefined) updateData.totalGato = data.totalGato;
        if (data.huesosCarnosos !== undefined) updateData.huesosCarnosos = data.huesosCarnosos;
        if (data.totalMes !== undefined) updateData.totalMes = data.totalMes;

        const result = await collection.findOneAndUpdate(
            { _id: new ObjectId(id) },
            { $set: updateData },
            { returnDocument: 'after' }
        );

        if (!result) {
            return {
                success: false,
                message: 'Detalle de envío no encontrado',
            };
        }

        return {
            success: true,
            detalleEnvio: {
                _id: result._id.toString(),
                puntoEnvio: result.puntoEnvio,
                fecha: result.fecha instanceof Date ? result.fecha.toISOString() : result.fecha,
                pollo: result.pollo,
                vaca: result.vaca,
                cerdo: result.cerdo,
                cordero: result.cordero,
                bigDogPollo: result.bigDogPollo,
                bigDogVaca: result.bigDogVaca,
                totalPerro: result.totalPerro,
                gatoPollo: result.gatoPollo,
                gatoVaca: result.gatoVaca,
                gatoCordero: result.gatoCordero,
                totalGato: result.totalGato,
                huesosCarnosos: result.huesosCarnosos,
                totalMes: result.totalMes,
                createdAt: result.createdAt instanceof Date ? result.createdAt.toISOString() : result.createdAt,
                updatedAt: result.updatedAt instanceof Date ? result.updatedAt.toISOString() : result.updatedAt,
            },
            message: 'Detalle de envío actualizado exitosamente',
        };
    } catch (error) {
        console.error('Error al actualizar detalle de envío:', error);
        return {
            success: false,
            message: 'Error al actualizar el detalle de envío',
        };
    }
}

/**
 * Eliminar un detalle de envío
 */
export async function deleteDetalleEnvioMongo(
    id: string
): Promise<{ success: boolean; message?: string }> {
    try {
        const collection = await getCollection(COLLECTION_NAME);

        const result = await collection.deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 0) {
            return {
                success: false,
                message: 'Detalle de envío no encontrado',
            };
        }

        return {
            success: true,
            message: 'Detalle de envío eliminado exitosamente',
        };
    } catch (error) {
        console.error('Error al eliminar detalle de envío:', error);
        return {
            success: false,
            message: 'Error al eliminar el detalle de envío',
        };
    }
}

