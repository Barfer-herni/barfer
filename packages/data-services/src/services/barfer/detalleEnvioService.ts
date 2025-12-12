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
 * Obtener todos los detalles de envío de un punto de envío
 */
export async function getDetalleEnvioByPuntoEnvioMongo(
    puntoEnvio: string
): Promise<{ success: boolean; detalleEnvio?: DetalleEnvio[]; message?: string }> {
    try {
        const collection = await getCollection(COLLECTION_NAME);

        const detalles = await collection
            .find({ puntoEnvio })
            .sort({ fecha: -1 })
            .toArray();

        return {
            success: true,
            detalleEnvio: detalles.map((detalle) => ({
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
            })),
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

