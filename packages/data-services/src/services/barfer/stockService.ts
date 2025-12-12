import 'server-only';
import { getCollection, ObjectId } from '@repo/database';
import type { Stock, CreateStockData, UpdateStockData } from '../../types/barfer';

const COLLECTION_NAME = 'stock';

/**
 * Crear un nuevo registro de stock
 */
export async function createStockMongo(
    data: CreateStockData
): Promise<{ success: boolean; stock?: Stock; message?: string }> {
    try {
        const collection = await getCollection(COLLECTION_NAME);

        const now = new Date().toISOString();
        const stockFinal = data.stockFinal ?? data.stockInicial - data.llevamos;

        const newStock = {
            puntoEnvio: data.puntoEnvio,
            producto: data.producto.trim(),
            peso: data.peso?.trim() || undefined,
            stockInicial: data.stockInicial,
            llevamos: data.llevamos,
            pedidosDelDia: data.pedidosDelDia,
            stockFinal,
            fecha: data.fecha || now,
            createdAt: now,
            updatedAt: now,
        };

        const result = await collection.insertOne(newStock);

        return {
            success: true,
            stock: {
                _id: result.insertedId.toString(),
                puntoEnvio: newStock.puntoEnvio,
                producto: newStock.producto,
                peso: newStock.peso,
                stockInicial: newStock.stockInicial,
                llevamos: newStock.llevamos,
                pedidosDelDia: newStock.pedidosDelDia,
                stockFinal: newStock.stockFinal,
                fecha: newStock.fecha,
                createdAt: newStock.createdAt,
                updatedAt: newStock.updatedAt,
            } as Stock,
            message: 'Stock creado exitosamente',
        };
    } catch (error) {
        console.error('Error al crear stock:', error);
        return {
            success: false,
            message: 'Error al crear el stock',
        };
    }
}

/**
 * Obtener todos los registros de stock de un punto de envío
 */
export async function getStockByPuntoEnvioMongo(
    puntoEnvio: string
): Promise<{ success: boolean; stock?: Stock[]; message?: string }> {
    try {
        const collection = await getCollection(COLLECTION_NAME);

        const stockRecords = await collection
            .find({ puntoEnvio })
            .sort({ fecha: -1, createdAt: -1 })
            .toArray();

        return {
            success: true,
            stock: stockRecords.map((record) => ({
                _id: record._id.toString(),
                puntoEnvio: record.puntoEnvio,
                producto: record.producto,
                peso: record.peso,
                stockInicial: record.stockInicial,
                llevamos: record.llevamos,
                pedidosDelDia: record.pedidosDelDia,
                stockFinal: record.stockFinal,
                fecha: record.fecha instanceof Date ? record.fecha.toISOString() : record.fecha,
                createdAt: record.createdAt instanceof Date ? record.createdAt.toISOString() : record.createdAt,
                updatedAt: record.updatedAt instanceof Date ? record.updatedAt.toISOString() : record.updatedAt,
            })),
        };
    } catch (error) {
        console.error('Error al obtener stock:', error);
        return {
            success: false,
            stock: [],
            message: 'Error al obtener el stock',
        };
    }
}

/**
 * Obtener un registro de stock por ID
 */
export async function getStockByIdMongo(
    id: string
): Promise<{ success: boolean; stock?: Stock; message?: string }> {
    try {
        const collection = await getCollection(COLLECTION_NAME);

        const stock = await collection.findOne({ _id: new ObjectId(id) });

        if (!stock) {
            return {
                success: false,
                message: 'Stock no encontrado',
            };
        }

        return {
            success: true,
            stock: {
                _id: stock._id.toString(),
                puntoEnvio: stock.puntoEnvio,
                producto: stock.producto,
                peso: stock.peso,
                stockInicial: stock.stockInicial,
                llevamos: stock.llevamos,
                pedidosDelDia: stock.pedidosDelDia,
                stockFinal: stock.stockFinal,
                fecha: stock.fecha instanceof Date ? stock.fecha.toISOString() : stock.fecha,
                createdAt: stock.createdAt instanceof Date ? stock.createdAt.toISOString() : stock.createdAt,
                updatedAt: stock.updatedAt instanceof Date ? stock.updatedAt.toISOString() : stock.updatedAt,
            },
        };
    } catch (error) {
        console.error('Error al obtener stock:', error);
        return {
            success: false,
            message: 'Error al obtener el stock',
        };
    }
}

/**
 * Actualizar un registro de stock
 */
export async function updateStockMongo(
    id: string,
    data: UpdateStockData
): Promise<{ success: boolean; stock?: Stock; message?: string }> {
    try {
        const collection = await getCollection(COLLECTION_NAME);

        const updateData: any = {
            updatedAt: new Date().toISOString(),
        };

        if (data.puntoEnvio !== undefined) updateData.puntoEnvio = data.puntoEnvio;
        if (data.producto !== undefined) updateData.producto = data.producto.trim();
        if (data.peso !== undefined) updateData.peso = data.peso.trim() || undefined;
        if (data.stockInicial !== undefined) updateData.stockInicial = data.stockInicial;
        if (data.llevamos !== undefined) updateData.llevamos = data.llevamos;
        if (data.pedidosDelDia !== undefined) updateData.pedidosDelDia = data.pedidosDelDia;
        if (data.fecha !== undefined) updateData.fecha = data.fecha;

        // Recalcular stockFinal si se actualizó stockInicial o llevamos
        if (data.stockInicial !== undefined || data.llevamos !== undefined) {
            const currentStock = await collection.findOne({ _id: new ObjectId(id) });
            if (currentStock) {
                const newStockInicial = data.stockInicial ?? currentStock.stockInicial;
                const newLlevamos = data.llevamos ?? currentStock.llevamos;
                updateData.stockFinal = newStockInicial - newLlevamos;
            }
        }

        if (data.stockFinal !== undefined) {
            updateData.stockFinal = data.stockFinal;
        }

        const result = await collection.findOneAndUpdate(
            { _id: new ObjectId(id) },
            { $set: updateData },
            { returnDocument: 'after' }
        );

        if (!result) {
            return {
                success: false,
                message: 'Stock no encontrado',
            };
        }

        return {
            success: true,
            stock: {
                _id: result._id.toString(),
                puntoEnvio: result.puntoEnvio,
                producto: result.producto,
                peso: result.peso,
                stockInicial: result.stockInicial,
                llevamos: result.llevamos,
                pedidosDelDia: result.pedidosDelDia,
                stockFinal: result.stockFinal,
                fecha: result.fecha instanceof Date ? result.fecha.toISOString() : result.fecha,
                createdAt: result.createdAt instanceof Date ? result.createdAt.toISOString() : result.createdAt,
                updatedAt: result.updatedAt instanceof Date ? result.updatedAt.toISOString() : result.updatedAt,
            },
            message: 'Stock actualizado exitosamente',
        };
    } catch (error) {
        console.error('Error al actualizar stock:', error);
        return {
            success: false,
            message: 'Error al actualizar el stock',
        };
    }
}

/**
 * Eliminar un registro de stock
 */
export async function deleteStockMongo(
    id: string
): Promise<{ success: boolean; message?: string }> {
    try {
        const collection = await getCollection(COLLECTION_NAME);

        const result = await collection.deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 0) {
            return {
                success: false,
                message: 'Stock no encontrado',
            };
        }

        return {
            success: true,
            message: 'Stock eliminado exitosamente',
        };
    } catch (error) {
        console.error('Error al eliminar stock:', error);
        return {
            success: false,
            message: 'Error al eliminar el stock',
        };
    }
}

