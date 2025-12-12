import { ObjectId, getCollection } from '@repo/database';
import type { DetalleEnvio, CreateDetalleEnvioData, UpdateDetalleEnvioData } from '../types/barfer';

/**
 * Obtener todos los detalles de un punto de envío
 */
export async function getDetalleEnvioByPuntoEnvioMongo(puntoEnvioId: string): Promise<{
    success: boolean;
    detalles?: DetalleEnvio[];
    total?: number;
    message?: string;
    error?: string;
}> {
    try {
        const detalleEnvioCollection = await getCollection('detalle_envio');

        if (!ObjectId.isValid(puntoEnvioId)) {
            return {
                success: false,
                detalles: [],
                total: 0,
                error: 'INVALID_PUNTO_ENVIO_ID',
            };
        }

        const detalles = await detalleEnvioCollection
            .aggregate([
                {
                    $match: { puntoEnvioId: new ObjectId(puntoEnvioId) }
                },
                {
                    $lookup: {
                        from: 'puntos_envio',
                        localField: 'puntoEnvioId',
                        foreignField: '_id',
                        as: 'puntoEnvioInfo'
                    }
                },
                {
                    $addFields: {
                        puntoEnvioNombre: { $arrayElemAt: ['$puntoEnvioInfo.nombre', 0] }
                    }
                },
                {
                    $sort: { month: -1 }
                }
            ])
            .toArray();

        const formattedDetalles: DetalleEnvio[] = detalles.map((doc) => ({
            _id: doc._id.toString(),
            puntoEnvio: doc.puntoEnvioNombre || doc.puntoEnvioId?.toString() || '',
            fecha: doc.month || '',
            pollo: doc.pollo || 0,
            vaca: doc.vaca || 0,
            cerdo: doc.cerdo || 0,
            cordero: doc.cordero || 0,
            bigDogPollo: doc.bigDogPollo || 0,
            bigDogVaca: doc.bigDogVaca || 0,
            totalPerro: doc.totalPerro || 0,
            gatoPollo: doc.gatoPollo || 0,
            gatoVaca: doc.gatoVaca || 0,
            gatoCordero: doc.gatoCordero || 0,
            totalGato: doc.totalGato || 0,
            huesosCarnosos: doc.huesosCarnosos || 0,
            totalMes: doc.totalMes || 0,
            createdAt: doc.createdAt?.toISOString() || new Date().toISOString(),
            updatedAt: doc.updatedAt?.toISOString() || new Date().toISOString(),
        }));

        return {
            success: true,
            detalles: formattedDetalles,
            total: formattedDetalles.length,
        };
    } catch (error) {
        console.error('Error in getDetalleEnvioByPuntoEnvioMongo:', error);
        return {
            success: false,
            detalles: [],
            total: 0,
            error: 'GET_DETALLE_ENVIO_BY_PUNTO_ENVIO_MONGO_ERROR',
        };
    }
}

/**
 * Crear un nuevo registro de detalle
 */
export async function createDetalleEnvioMongo(data: CreateDetalleEnvioData): Promise<{
    success: boolean;
    detalle?: DetalleEnvio;
    message?: string;
    error?: string;
}> {
    try {
        const detalleEnvioCollection = await getCollection('detalle_envio');
        const puntosEnvioCollection = await getCollection('puntos_envio');

        // Buscar el punto de envío por nombre para obtener su ID
        const puntoEnvio = await puntosEnvioCollection.findOne({
            nombre: data.puntoEnvio
        });

        if (!puntoEnvio) {
            return {
                success: false,
                message: 'Punto de envío no encontrado',
                error: 'PUNTO_ENVIO_NOT_FOUND',
            };
        }

        // Convertir fecha (YYYY-MM) a month para la búsqueda
        const month = data.fecha;

        // Verificar si ya existe un detalle para este mes y punto de envío
        const existingDetalle = await detalleEnvioCollection.findOne({
            puntoEnvioId: puntoEnvio._id,
            month: month,
        });

        if (existingDetalle) {
            return {
                success: false,
                message: 'Ya existe un detalle para este mes',
                error: 'DETALLE_ALREADY_EXISTS',
            };
        }

        const now = new Date();
        const detalleDoc = {
            puntoEnvioId: puntoEnvio._id,
            month: month,
            pollo: data.pollo || 0,
            vaca: data.vaca || 0,
            cerdo: data.cerdo || 0,
            cordero: data.cordero || 0,
            bigDogPollo: data.bigDogPollo || 0,
            bigDogVaca: data.bigDogVaca || 0,
            totalPerro: data.totalPerro || 0,
            gatoPollo: data.gatoPollo || 0,
            gatoVaca: data.gatoVaca || 0,
            gatoCordero: data.gatoCordero || 0,
            totalGato: data.totalGato || 0,
            huesosCarnosos: data.huesosCarnosos || 0,
            totalMes: data.totalMes || 0,
            createdAt: now,
            updatedAt: now,
        };

        const result = await detalleEnvioCollection.insertOne(detalleDoc);

        const newDetalle: DetalleEnvio = {
            _id: result.insertedId.toString(),
            puntoEnvio: data.puntoEnvio,
            fecha: month,
            pollo: detalleDoc.pollo,
            vaca: detalleDoc.vaca,
            cerdo: detalleDoc.cerdo,
            cordero: detalleDoc.cordero,
            bigDogPollo: detalleDoc.bigDogPollo,
            bigDogVaca: detalleDoc.bigDogVaca,
            totalPerro: detalleDoc.totalPerro,
            gatoPollo: detalleDoc.gatoPollo,
            gatoVaca: detalleDoc.gatoVaca,
            gatoCordero: detalleDoc.gatoCordero,
            totalGato: detalleDoc.totalGato,
            huesosCarnosos: detalleDoc.huesosCarnosos,
            totalMes: detalleDoc.totalMes,
            createdAt: detalleDoc.createdAt.toISOString(),
            updatedAt: detalleDoc.updatedAt.toISOString(),
        };

        return {
            success: true,
            detalle: newDetalle,
            message: 'Detalle creado exitosamente',
        };
    } catch (error) {
        console.error('Error in createDetalleEnvioMongo:', error);
        return {
            success: false,
            message: 'Error al crear el detalle',
            error: 'CREATE_DETALLE_ENVIO_MONGO_ERROR',
        };
    }
}

/**
 * Actualizar un registro de detalle
 */
export async function updateDetalleEnvioMongo(
    id: string,
    data: UpdateDetalleEnvioData
): Promise<{
    success: boolean;
    detalle?: DetalleEnvio;
    message?: string;
    error?: string;
}> {
    try {
        const detalleEnvioCollection = await getCollection('detalle_envio');

        if (!ObjectId.isValid(id)) {
            return {
                success: false,
                message: 'ID inválido',
                error: 'INVALID_ID',
            };
        }

        const existingDetalle = await detalleEnvioCollection.findOne({
            _id: new ObjectId(id),
        });

        if (!existingDetalle) {
            return {
                success: false,
                message: 'Detalle no encontrado',
                error: 'DETALLE_NOT_FOUND',
            };
        }

        const updateDoc: any = {
            updatedAt: new Date(),
        };

        // Si se actualiza puntoEnvio, necesitamos buscar su ID
        if (data.puntoEnvio !== undefined) {
            const puntosEnvioCollection = await getCollection('puntos_envio');
            const puntoEnvio = await puntosEnvioCollection.findOne({
                nombre: data.puntoEnvio
            });
            if (puntoEnvio) {
                updateDoc.puntoEnvioId = puntoEnvio._id;
            }
        }

        // Usar fecha si está disponible, sino month (para compatibilidad)
        if (data.fecha) {
            updateDoc.month = data.fecha;
        } else if (data.month) {
            updateDoc.month = data.month;
        }
        if (data.pollo !== undefined) updateDoc.pollo = data.pollo;
        if (data.vaca !== undefined) updateDoc.vaca = data.vaca;
        if (data.cerdo !== undefined) updateDoc.cerdo = data.cerdo;
        if (data.cordero !== undefined) updateDoc.cordero = data.cordero;
        if (data.bigDogPollo !== undefined) updateDoc.bigDogPollo = data.bigDogPollo;
        if (data.bigDogVaca !== undefined) updateDoc.bigDogVaca = data.bigDogVaca;
        if (data.totalPerro !== undefined) updateDoc.totalPerro = data.totalPerro;
        if (data.gatoPollo !== undefined) updateDoc.gatoPollo = data.gatoPollo;
        if (data.gatoVaca !== undefined) updateDoc.gatoVaca = data.gatoVaca;
        if (data.gatoCordero !== undefined) updateDoc.gatoCordero = data.gatoCordero;
        if (data.totalGato !== undefined) updateDoc.totalGato = data.totalGato;
        if (data.huesosCarnosos !== undefined) updateDoc.huesosCarnosos = data.huesosCarnosos;
        if (data.totalMes !== undefined) updateDoc.totalMes = data.totalMes;

        await detalleEnvioCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: updateDoc }
        );

        const updatedDetalle = await detalleEnvioCollection
            .aggregate([
                {
                    $match: { _id: new ObjectId(id) }
                },
                {
                    $lookup: {
                        from: 'puntos_envio',
                        localField: 'puntoEnvioId',
                        foreignField: '_id',
                        as: 'puntoEnvioInfo'
                    }
                },
                {
                    $addFields: {
                        puntoEnvioNombre: { $arrayElemAt: ['$puntoEnvioInfo.nombre', 0] }
                    }
                }
            ])
            .toArray();

        if (!updatedDetalle || updatedDetalle.length === 0) {
            return {
                success: false,
                message: 'Error al obtener el detalle actualizado',
                error: 'GET_UPDATED_DETALLE_ERROR',
            };
        }

        const doc = updatedDetalle[0];
        const formattedDetalle: DetalleEnvio = {
            _id: doc._id.toString(),
            puntoEnvio: doc.puntoEnvioNombre || doc.puntoEnvioId?.toString() || '',
            fecha: doc.month || '',
            pollo: doc.pollo || 0,
            vaca: doc.vaca || 0,
            cerdo: doc.cerdo || 0,
            cordero: doc.cordero || 0,
            bigDogPollo: doc.bigDogPollo || 0,
            bigDogVaca: doc.bigDogVaca || 0,
            totalPerro: doc.totalPerro || 0,
            gatoPollo: doc.gatoPollo || 0,
            gatoVaca: doc.gatoVaca || 0,
            gatoCordero: doc.gatoCordero || 0,
            totalGato: doc.totalGato || 0,
            huesosCarnosos: doc.huesosCarnosos || 0,
            totalMes: doc.totalMes || 0,
            createdAt: doc.createdAt?.toISOString() || new Date().toISOString(),
            updatedAt: doc.updatedAt?.toISOString() || new Date().toISOString(),
        };

        return {
            success: true,
            detalle: formattedDetalle,
            message: 'Detalle actualizado exitosamente',
        };
    } catch (error) {
        console.error('Error in updateDetalleEnvioMongo:', error);
        return {
            success: false,
            message: 'Error al actualizar el detalle',
            error: 'UPDATE_DETALLE_ENVIO_MONGO_ERROR',
        };
    }
}

