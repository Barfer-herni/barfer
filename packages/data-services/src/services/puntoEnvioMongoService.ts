import { ObjectId, getCollection } from '@repo/database';
import type { PuntoEnvio, CreatePuntoEnvioData, UpdatePuntoEnvioData } from '../types/barfer';

/**
 * Obtener todos los puntos de envío
 */
export async function getAllPuntosEnvioMongo(): Promise<{
    success: boolean;
    puntosEnvio?: PuntoEnvio[];
    total?: number;
    message?: string;
    error?: string;
}> {
    try {
        const puntosEnvioCollection = await getCollection('puntos_envio');

        const puntosEnvio = await puntosEnvioCollection
            .find({})
            .sort({ createdAt: -1 })
            .toArray();

        const formattedPuntosEnvio: PuntoEnvio[] = puntosEnvio.map((doc) => {
            // Asegurar que el nombre existe y es un string
            const nombre = doc.nombre || '';

            return {
                _id: doc._id.toString(),
                nombre: nombre,
                createdAt: doc.createdAt instanceof Date
                    ? doc.createdAt.toISOString()
                    : (typeof doc.createdAt === 'string' ? doc.createdAt : new Date().toISOString()),
                updatedAt: doc.updatedAt instanceof Date
                    ? doc.updatedAt.toISOString()
                    : (typeof doc.updatedAt === 'string' ? doc.updatedAt : new Date().toISOString()),
            };
        });

        return {
            success: true,
            puntosEnvio: formattedPuntosEnvio,
            total: formattedPuntosEnvio.length,
        };
    } catch (error) {
        console.error('Error in getAllPuntosEnvioMongo:', error);
        return {
            success: false,
            puntosEnvio: [],
            total: 0,
            error: 'GET_ALL_PUNTOS_ENVIO_MONGO_ERROR',
        };
    }
}

/**
 * Obtener un punto de envío por ID
 */
export async function getPuntoEnvioByIdMongo(id: string): Promise<{
    success: boolean;
    puntoEnvio?: PuntoEnvio;
    message?: string;
    error?: string;
}> {
    try {
        const puntosEnvioCollection = await getCollection('puntos_envio');

        if (!ObjectId.isValid(id)) {
            return {
                success: false,
                message: 'ID inválido',
                error: 'INVALID_ID',
            };
        }

        const puntoEnvio = await puntosEnvioCollection.findOne({
            _id: new ObjectId(id),
        });

        if (!puntoEnvio) {
            return {
                success: false,
                message: 'Punto de envío no encontrado',
                error: 'PUNTO_ENVIO_NOT_FOUND',
            };
        }

        const formattedPuntoEnvio: PuntoEnvio = {
            _id: puntoEnvio._id.toString(),
            nombre: puntoEnvio.nombre,
            createdAt: puntoEnvio.createdAt?.toISOString() || new Date().toISOString(),
            updatedAt: puntoEnvio.updatedAt?.toISOString() || new Date().toISOString(),
        };

        return {
            success: true,
            puntoEnvio: formattedPuntoEnvio,
        };
    } catch (error) {
        console.error('Error in getPuntoEnvioByIdMongo:', error);
        return {
            success: false,
            message: 'Error al obtener el punto de envío',
            error: 'GET_PUNTO_ENVIO_BY_ID_MONGO_ERROR',
        };
    }
}

/**
 * Crear un nuevo punto de envío
 */
export async function createPuntoEnvioMongo(data: CreatePuntoEnvioData): Promise<{
    success: boolean;
    puntoEnvio?: PuntoEnvio;
    message?: string;
    error?: string;
}> {
    try {
        const puntosEnvioCollection = await getCollection('puntos_envio');

        // Verificar si ya existe un punto de envío con ese nombre
        const existingPuntoEnvio = await puntosEnvioCollection.findOne({
            nombre: { $regex: new RegExp(`^${data.nombre}$`, 'i') },
        });

        if (existingPuntoEnvio) {
            return {
                success: false,
                message: 'Ya existe un punto de envío con ese nombre',
                error: 'PUNTO_ENVIO_ALREADY_EXISTS',
            };
        }

        const now = new Date();
        const puntoEnvioDoc = {
            nombre: data.nombre,
            createdAt: now,
            updatedAt: now,
        };

        const result = await puntosEnvioCollection.insertOne(puntoEnvioDoc);

        const newPuntoEnvio: PuntoEnvio = {
            _id: result.insertedId.toString(),
            nombre: puntoEnvioDoc.nombre,
            createdAt: puntoEnvioDoc.createdAt.toISOString(),
            updatedAt: puntoEnvioDoc.updatedAt.toISOString(),
        };

        return {
            success: true,
            puntoEnvio: newPuntoEnvio,
            message: 'Punto de envío creado exitosamente',
        };
    } catch (error) {
        console.error('Error in createPuntoEnvioMongo:', error);
        return {
            success: false,
            message: 'Error al crear el punto de envío',
            error: 'CREATE_PUNTO_ENVIO_MONGO_ERROR',
        };
    }
}

/**
 * Actualizar un punto de envío existente
 */
export async function updatePuntoEnvioMongo(
    id: string,
    data: UpdatePuntoEnvioData
): Promise<{
    success: boolean;
    puntoEnvio?: PuntoEnvio;
    message?: string;
    error?: string;
}> {
    try {
        const puntosEnvioCollection = await getCollection('puntos_envio');

        if (!ObjectId.isValid(id)) {
            return {
                success: false,
                message: 'ID inválido',
                error: 'INVALID_ID',
            };
        }

        // Verificar si existe
        const existingPuntoEnvio = await puntosEnvioCollection.findOne({
            _id: new ObjectId(id),
        });

        if (!existingPuntoEnvio) {
            return {
                success: false,
                message: 'Punto de envío no encontrado',
                error: 'PUNTO_ENVIO_NOT_FOUND',
            };
        }

        // Si se actualiza el nombre, verificar que no exista otro con ese nombre
        if (data.nombre) {
            const duplicatePuntoEnvio = await puntosEnvioCollection.findOne({
                nombre: { $regex: new RegExp(`^${data.nombre}$`, 'i') },
                _id: { $ne: new ObjectId(id) },
            });

            if (duplicatePuntoEnvio) {
                return {
                    success: false,
                    message: 'Ya existe otro punto de envío con ese nombre',
                    error: 'PUNTO_ENVIO_NAME_ALREADY_EXISTS',
                };
            }
        }

        const updateDoc: any = {
            updatedAt: new Date(),
        };

        if (data.nombre) updateDoc.nombre = data.nombre;

        await puntosEnvioCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: updateDoc }
        );

        // Obtener el punto de envío actualizado
        const updatedPuntoEnvio = await getPuntoEnvioByIdMongo(id);

        return {
            success: true,
            puntoEnvio: updatedPuntoEnvio.puntoEnvio,
            message: 'Punto de envío actualizado exitosamente',
        };
    } catch (error) {
        console.error('Error in updatePuntoEnvioMongo:', error);
        return {
            success: false,
            message: 'Error al actualizar el punto de envío',
            error: 'UPDATE_PUNTO_ENVIO_MONGO_ERROR',
        };
    }
}

/**
 * Eliminar un punto de envío
 */
export async function deletePuntoEnvioMongo(id: string): Promise<{
    success: boolean;
    message?: string;
    error?: string;
}> {
    try {
        const puntosEnvioCollection = await getCollection('puntos_envio');
        const stockCollection = await getCollection('stock');
        const detalleEnvioCollection = await getCollection('detalle_envio');

        if (!ObjectId.isValid(id)) {
            return {
                success: false,
                message: 'ID inválido',
                error: 'INVALID_ID',
            };
        }

        // Verificar si existe
        const existingPuntoEnvio = await puntosEnvioCollection.findOne({
            _id: new ObjectId(id),
        });

        if (!existingPuntoEnvio) {
            return {
                success: false,
                message: 'Punto de envío no encontrado',
                error: 'PUNTO_ENVIO_NOT_FOUND',
            };
        }

        // Eliminar el punto de envío y sus datos relacionados
        await Promise.all([
            puntosEnvioCollection.deleteOne({ _id: new ObjectId(id) }),
            stockCollection.deleteMany({ puntoEnvioId: new ObjectId(id) }),
            detalleEnvioCollection.deleteMany({ puntoEnvioId: new ObjectId(id) }),
        ]);

        return {
            success: true,
            message: 'Punto de envío eliminado exitosamente',
        };
    } catch (error) {
        console.error('Error in deletePuntoEnvioMongo:', error);
        return {
            success: false,
            message: 'Error al eliminar el punto de envío',
            error: 'DELETE_PUNTO_ENVIO_MONGO_ERROR',
        };
    }
}

