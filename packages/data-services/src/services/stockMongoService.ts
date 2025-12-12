import { ObjectId, getCollection } from '@repo/database';
import type { Stock, CreateStockData, UpdateStockData } from '../types/barfer';

/**
 * Obtener todo el stock de un punto de envío
 */
export async function getStockByPuntoEnvioMongo(puntoEnvioId: string): Promise<{
    success: boolean;
    stock?: Stock[];
    total?: number;
    message?: string;
    error?: string;
}> {
    try {
        const stockCollection = await getCollection('stock');

        if (!ObjectId.isValid(puntoEnvioId)) {
            return {
                success: false,
                stock: [],
                total: 0,
                error: 'INVALID_PUNTO_ENVIO_ID',
            };
        }

        const stock = await stockCollection
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
                    $sort: { fecha: -1, createdAt: -1 }
                }
            ])
            .toArray();

        const formattedStock: Stock[] = stock.map((doc) => ({
            _id: doc._id.toString(),
            puntoEnvio: doc.puntoEnvioNombre || doc.puntoEnvioId?.toString() || '',
            producto: doc.producto,
            peso: doc.peso,
            stockInicial: doc.stockInicial,
            llevamos: doc.llevamos,
            pedidosDelDia: doc.pedidosDelDia,
            stockFinal: doc.stockFinal,
            fecha: doc.fecha ? (doc.fecha instanceof Date ? doc.fecha.toISOString().split('T')[0] : doc.fecha) : new Date().toISOString().split('T')[0],
            createdAt: doc.createdAt?.toISOString() || new Date().toISOString(),
            updatedAt: doc.updatedAt?.toISOString() || new Date().toISOString(),
        }));

        return {
            success: true,
            stock: formattedStock,
            total: formattedStock.length,
        };
    } catch (error) {
        console.error('Error in getStockByPuntoEnvioMongo:', error);
        return {
            success: false,
            stock: [],
            total: 0,
            error: 'GET_STOCK_BY_PUNTO_ENVIO_MONGO_ERROR',
        };
    }
}

/**
 * Crear un nuevo registro de stock
 */
export async function createStockMongo(data: CreateStockData): Promise<{
    success: boolean;
    stock?: Stock;
    message?: string;
    error?: string;
}> {
    try {
        const stockCollection = await getCollection('stock');
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

        const now = new Date();
        const stockFinal = data.stockFinal ?? (data.stockInicial - data.llevamos);

        const stockDoc = {
            puntoEnvioId: puntoEnvio._id,
            producto: data.producto,
            peso: data.peso,
            stockInicial: data.stockInicial,
            llevamos: data.llevamos,
            pedidosDelDia: data.pedidosDelDia,
            stockFinal: stockFinal,
            fecha: data.fecha ? new Date(data.fecha) : now,
            createdAt: now,
            updatedAt: now,
        };

        const result = await stockCollection.insertOne(stockDoc);

        const newStock: Stock = {
            _id: result.insertedId.toString(),
            puntoEnvio: data.puntoEnvio,
            producto: stockDoc.producto,
            peso: stockDoc.peso,
            stockInicial: stockDoc.stockInicial,
            llevamos: stockDoc.llevamos,
            pedidosDelDia: stockDoc.pedidosDelDia,
            stockFinal: stockDoc.stockFinal,
            fecha: stockDoc.fecha instanceof Date ? stockDoc.fecha.toISOString().split('T')[0] : (stockDoc.fecha || new Date().toISOString().split('T')[0]),
            createdAt: stockDoc.createdAt.toISOString(),
            updatedAt: stockDoc.updatedAt.toISOString(),
        };

        return {
            success: true,
            stock: newStock,
            message: 'Stock creado exitosamente',
        };
    } catch (error) {
        console.error('Error in createStockMongo:', error);
        return {
            success: false,
            message: 'Error al crear el stock',
            error: 'CREATE_STOCK_MONGO_ERROR',
        };
    }
}

/**
 * Actualizar un registro de stock
 */
export async function updateStockMongo(
    id: string,
    data: UpdateStockData
): Promise<{
    success: boolean;
    stock?: Stock;
    message?: string;
    error?: string;
}> {
    try {
        const stockCollection = await getCollection('stock');

        if (!ObjectId.isValid(id)) {
            return {
                success: false,
                message: 'ID inválido',
                error: 'INVALID_ID',
            };
        }

        const existingStock = await stockCollection.findOne({
            _id: new ObjectId(id),
        });

        if (!existingStock) {
            return {
                success: false,
                message: 'Stock no encontrado',
                error: 'STOCK_NOT_FOUND',
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

        if (data.producto) updateDoc.producto = data.producto;
        if (data.peso !== undefined) updateDoc.peso = data.peso;
        if (data.stockInicial !== undefined) updateDoc.stockInicial = data.stockInicial;
        if (data.llevamos !== undefined) updateDoc.llevamos = data.llevamos;
        if (data.pedidosDelDia !== undefined) updateDoc.pedidosDelDia = data.pedidosDelDia;
        if (data.fecha) updateDoc.fecha = new Date(data.fecha);

        // Recalcular stockFinal si cambió stockInicial o llevamos
        if (data.stockInicial !== undefined || data.llevamos !== undefined) {
            const stockInicial = data.stockInicial ?? existingStock.stockInicial;
            const llevamos = data.llevamos ?? existingStock.llevamos;
            updateDoc.stockFinal = stockInicial - llevamos;
        } else if (data.stockFinal !== undefined) {
            updateDoc.stockFinal = data.stockFinal;
        }

        await stockCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: updateDoc }
        );

        const updatedStock = await stockCollection
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

        if (!updatedStock || updatedStock.length === 0) {
            return {
                success: false,
                message: 'Error al obtener el stock actualizado',
                error: 'GET_UPDATED_STOCK_ERROR',
            };
        }

        const doc = updatedStock[0];
        const formattedStock: Stock = {
            _id: doc._id.toString(),
            puntoEnvio: doc.puntoEnvioNombre || doc.puntoEnvioId?.toString() || '',
            producto: doc.producto,
            peso: doc.peso,
            stockInicial: doc.stockInicial,
            llevamos: doc.llevamos,
            pedidosDelDia: doc.pedidosDelDia,
            stockFinal: doc.stockFinal,
            fecha: doc.fecha ? (doc.fecha instanceof Date ? doc.fecha.toISOString().split('T')[0] : doc.fecha) : new Date().toISOString().split('T')[0],
            createdAt: doc.createdAt?.toISOString() || new Date().toISOString(),
            updatedAt: doc.updatedAt?.toISOString() || new Date().toISOString(),
        };

        return {
            success: true,
            stock: formattedStock,
            message: 'Stock actualizado exitosamente',
        };
    } catch (error) {
        console.error('Error in updateStockMongo:', error);
        return {
            success: false,
            message: 'Error al actualizar el stock',
            error: 'UPDATE_STOCK_MONGO_ERROR',
        };
    }
}

