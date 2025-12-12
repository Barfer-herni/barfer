import 'server-only';
import { getCollection, ObjectId } from '@repo/database';
import type {
    PuntoEnvio,
    CreatePuntoEnvioData,
    UpdatePuntoEnvioData,
} from '../../types/barfer';

const COLLECTION_NAME = 'puntos_envio';

/**
 * Crear un nuevo punto de envío
 */
export async function createPuntoEnvioMongo(
    data: CreatePuntoEnvioData
): Promise<{ success: boolean; puntoEnvio?: PuntoEnvio; message?: string }> {
    try {
        const collection = await getCollection(COLLECTION_NAME);

        // Verificar si ya existe un punto de envío con el mismo nombre
        const existingPuntoEnvio = await collection.findOne({
            nombre: { $regex: new RegExp(`^${data.nombre}$`, 'i') },
        });

        if (existingPuntoEnvio) {
            return {
                success: false,
                message: 'Ya existe un punto de envío con ese nombre',
            };
        }

        const now = new Date().toISOString();
        const newPuntoEnvio = {
            nombre: data.nombre.trim(),
            createdAt: now,
            updatedAt: now,
        };

        const result = await collection.insertOne(newPuntoEnvio);

        return {
            success: true,
            puntoEnvio: {
                _id: result.insertedId.toString(),
                ...newPuntoEnvio,
            },
            message: 'Punto de envío creado exitosamente',
        };
    } catch (error) {
        console.error('Error al crear punto de envío:', error);
        return {
            success: false,
            message: 'Error al crear el punto de envío',
        };
    }
}

/**
 * Obtener todos los puntos de envío
 */
export async function getAllPuntosEnvioMongo(): Promise<{
    success: boolean;
    puntosEnvio?: PuntoEnvio[];
    message?: string;
}> {
    try {
        const collection = await getCollection(COLLECTION_NAME);

        const puntosEnvio = await collection
            .find({})
            .sort({ createdAt: -1 })
            .toArray();

        return {
            success: true,
            puntosEnvio: puntosEnvio.map((punto) => ({
                _id: punto._id.toString(),
                nombre: punto.nombre,
                createdAt: punto.createdAt instanceof Date ? punto.createdAt.toISOString() : (typeof punto.createdAt === 'string' ? punto.createdAt : new Date().toISOString()),
                updatedAt: punto.updatedAt instanceof Date ? punto.updatedAt.toISOString() : (typeof punto.updatedAt === 'string' ? punto.updatedAt : new Date().toISOString()),
            })),
        };
    } catch (error) {
        console.error('Error al obtener puntos de envío:', error);
        return {
            success: false,
            puntosEnvio: [],
            message: 'Error al obtener los puntos de envío',
        };
    }
}

/**
 * Obtener un punto de envío por ID
 */
export async function getPuntoEnvioByIdMongo(
    id: string
): Promise<{ success: boolean; puntoEnvio?: PuntoEnvio; message?: string }> {
    try {
        const collection = await getCollection(COLLECTION_NAME);

        const puntoEnvio = await collection.findOne({ _id: new ObjectId(id) });

        if (!puntoEnvio) {
            return {
                success: false,
                message: 'Punto de envío no encontrado',
            };
        }

        return {
            success: true,
            puntoEnvio: {
                _id: puntoEnvio._id.toString(),
                nombre: puntoEnvio.nombre,
                createdAt: puntoEnvio.createdAt,
                updatedAt: puntoEnvio.updatedAt,
            },
        };
    } catch (error) {
        console.error('Error al obtener punto de envío:', error);
        return {
            success: false,
            message: 'Error al obtener el punto de envío',
        };
    }
}

/**
 * Actualizar un punto de envío
 */
export async function updatePuntoEnvioMongo(
    id: string,
    data: UpdatePuntoEnvioData
): Promise<{ success: boolean; puntoEnvio?: PuntoEnvio; message?: string }> {
    try {
        const collection = await getCollection(COLLECTION_NAME);

        const updateData: any = {
            updatedAt: new Date().toISOString(),
        };

        if (data.nombre !== undefined) {
            updateData.nombre = data.nombre.trim();
        }

        const result = await collection.findOneAndUpdate(
            { _id: new ObjectId(id) },
            { $set: updateData },
            { returnDocument: 'after' }
        );

        if (!result) {
            return {
                success: false,
                message: 'Punto de envío no encontrado',
            };
        }

        return {
            success: true,
            puntoEnvio: {
                _id: result._id.toString(),
                nombre: result.nombre,
                createdAt: result.createdAt,
                updatedAt: result.updatedAt,
            },
            message: 'Punto de envío actualizado exitosamente',
        };
    } catch (error) {
        console.error('Error al actualizar punto de envío:', error);
        return {
            success: false,
            message: 'Error al actualizar el punto de envío',
        };
    }
}

/**
 * Eliminar un punto de envío
 */
export async function deletePuntoEnvioMongo(
    id: string
): Promise<{ success: boolean; message?: string }> {
    try {
        const collection = await getCollection(COLLECTION_NAME);

        const result = await collection.deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 0) {
            return {
                success: false,
                message: 'Punto de envío no encontrado',
            };
        }

        return {
            success: true,
            message: 'Punto de envío eliminado exitosamente',
        };
    } catch (error) {
        console.error('Error al eliminar punto de envío:', error);
        return {
            success: false,
            message: 'Error al eliminar el punto de envío',
        };
    }
}
