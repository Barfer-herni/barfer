import { ObjectId, getCollection } from '@repo/database';

// Tipos para el servicio MongoDB
export interface MetodoPagoMongoData {
    _id: string;
    nombre: string;
    descripcion?: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateMetodoPagoMongoInput {
    nombre: string;
    descripcion?: string;
    isActive?: boolean;
}

export interface UpdateMetodoPagoMongoInput {
    nombre?: string;
    descripcion?: string;
    isActive?: boolean;
}

// Servicios CRUD

/**
 * Obtener todos los métodos de pago activos
 */
export async function getAllMetodosPagoMongo(): Promise<{
    success: boolean;
    metodosPago?: MetodoPagoMongoData[];
    total?: number;
    message?: string;
    error?: string;
}> {
    try {
        const metodosPagoCollection = await getCollection('metodos_pago');

        const metodosPago = await metodosPagoCollection
            .find({ isActive: true })
            .sort({ nombre: 1 })
            .toArray();

        const formattedMetodosPago = metodosPago.map(metodoPago => ({
            _id: metodoPago._id.toString(),
            nombre: metodoPago.nombre,
            descripcion: metodoPago.descripcion,
            isActive: metodoPago.isActive,
            createdAt: metodoPago.createdAt,
            updatedAt: metodoPago.updatedAt
        }));

        return {
            success: true,
            metodosPago: formattedMetodosPago,
            total: formattedMetodosPago.length
        };
    } catch (error) {
        console.error('Error in getAllMetodosPagoMongo:', error);
        return {
            success: false,
            message: 'Error al obtener los métodos de pago',
            error: 'GET_ALL_METODOS_PAGO_MONGO_ERROR'
        };
    }
}

/**
 * Obtener todos los métodos de pago (incluyendo inactivos)
 */
export async function getAllMetodosPagoIncludingInactiveMongo(): Promise<{
    success: boolean;
    metodosPago?: MetodoPagoMongoData[];
    total?: number;
    message?: string;
    error?: string;
}> {
    try {
        const metodosPagoCollection = await getCollection('metodos_pago');

        const metodosPago = await metodosPagoCollection
            .find({})
            .sort({ nombre: 1 })
            .toArray();

        const formattedMetodosPago = metodosPago.map(metodoPago => ({
            _id: metodoPago._id.toString(),
            nombre: metodoPago.nombre,
            descripcion: metodoPago.descripcion,
            isActive: metodoPago.isActive,
            createdAt: metodoPago.createdAt,
            updatedAt: metodoPago.updatedAt
        }));

        return {
            success: true,
            metodosPago: formattedMetodosPago,
            total: formattedMetodosPago.length
        };
    } catch (error) {
        console.error('Error in getAllMetodosPagoIncludingInactiveMongo:', error);
        return {
            success: false,
            message: 'Error al obtener los métodos de pago',
            error: 'GET_ALL_METODOS_PAGO_INCLUDING_INACTIVE_MONGO_ERROR'
        };
    }
}

/**
 * Obtener un método de pago por ID
 */
export async function getMetodoPagoByIdMongo(id: string): Promise<{
    success: boolean;
    metodoPago?: MetodoPagoMongoData;
    message?: string;
    error?: string;
}> {
    try {
        const metodosPagoCollection = await getCollection('metodos_pago');

        const metodoPago = await metodosPagoCollection.findOne({ _id: new ObjectId(id) });

        if (!metodoPago) {
            return {
                success: false,
                message: 'Método de pago no encontrado',
                error: 'METODO_PAGO_NOT_FOUND'
            };
        }

        const formattedMetodoPago: MetodoPagoMongoData = {
            _id: metodoPago._id.toString(),
            nombre: metodoPago.nombre,
            descripcion: metodoPago.descripcion,
            isActive: metodoPago.isActive,
            createdAt: metodoPago.createdAt,
            updatedAt: metodoPago.updatedAt
        };

        return {
            success: true,
            metodoPago: formattedMetodoPago
        };
    } catch (error) {
        console.error('Error in getMetodoPagoByIdMongo:', error);
        return {
            success: false,
            message: 'Error al obtener el método de pago',
            error: 'GET_METODO_PAGO_BY_ID_MONGO_ERROR'
        };
    }
}

/**
 * Crear un nuevo método de pago
 */
export async function createMetodoPagoMongo(data: CreateMetodoPagoMongoInput): Promise<{
    success: boolean;
    metodoPago?: MetodoPagoMongoData;
    message?: string;
    error?: string;
}> {
    try {
        const metodosPagoCollection = await getCollection('metodos_pago');

        // Verificar si ya existe un método de pago con ese nombre
        const existingMetodoPago = await metodosPagoCollection.findOne({
            nombre: data.nombre.toUpperCase()
        });

        if (existingMetodoPago) {
            return {
                success: false,
                message: 'Ya existe un método de pago con ese nombre',
                error: 'METODO_PAGO_ALREADY_EXISTS'
            };
        }

        const metodoPagoDoc = {
            nombre: data.nombre.toUpperCase(),
            descripcion: data.descripcion,
            isActive: data.isActive ?? true,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const result = await metodosPagoCollection.insertOne(metodoPagoDoc);

        const newMetodoPago: MetodoPagoMongoData = {
            _id: result.insertedId.toString(),
            nombre: metodoPagoDoc.nombre,
            descripcion: metodoPagoDoc.descripcion,
            isActive: metodoPagoDoc.isActive,
            createdAt: metodoPagoDoc.createdAt,
            updatedAt: metodoPagoDoc.updatedAt
        };

        return {
            success: true,
            metodoPago: newMetodoPago,
            message: 'Método de pago creado exitosamente'
        };
    } catch (error) {
        console.error('Error in createMetodoPagoMongo:', error);
        return {
            success: false,
            message: 'Error al crear el método de pago',
            error: 'CREATE_METODO_PAGO_MONGO_ERROR'
        };
    }
}

/**
 * Actualizar un método de pago existente
 */
export async function updateMetodoPagoMongo(id: string, data: UpdateMetodoPagoMongoInput): Promise<{
    success: boolean;
    metodoPago?: MetodoPagoMongoData;
    message?: string;
    error?: string;
}> {
    try {
        const metodosPagoCollection = await getCollection('metodos_pago');

        // Construir objeto de actualización
        const updateData: any = {
            updatedAt: new Date()
        };

        if (data.nombre !== undefined) updateData.nombre = data.nombre.toUpperCase();
        if (data.descripcion !== undefined) updateData.descripcion = data.descripcion;
        if (data.isActive !== undefined) updateData.isActive = data.isActive;

        const result = await metodosPagoCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
        );

        if (result.matchedCount === 0) {
            return {
                success: false,
                message: 'Método de pago no encontrado',
                error: 'METODO_PAGO_NOT_FOUND'
            };
        }

        // Obtener el método de pago actualizado
        const updatedMetodoPago = await getMetodoPagoByIdMongo(id);

        return {
            success: true,
            metodoPago: updatedMetodoPago.metodoPago,
            message: 'Método de pago actualizado exitosamente'
        };
    } catch (error) {
        console.error('Error in updateMetodoPagoMongo:', error);
        return {
            success: false,
            message: 'Error al actualizar el método de pago',
            error: 'UPDATE_METODO_PAGO_MONGO_ERROR'
        };
    }
}

/**
 * Desactivar un método de pago (soft delete)
 */
export async function deleteMetodoPagoMongo(id: string): Promise<{
    success: boolean;
    message?: string;
    error?: string;
}> {
    try {
        const metodosPagoCollection = await getCollection('metodos_pago');

        const result = await metodosPagoCollection.updateOne(
            { _id: new ObjectId(id) },
            {
                $set: {
                    isActive: false,
                    updatedAt: new Date()
                }
            }
        );

        if (result.matchedCount === 0) {
            return {
                success: false,
                message: 'Método de pago no encontrado',
                error: 'METODO_PAGO_NOT_FOUND'
            };
        }

        return {
            success: true,
            message: 'Método de pago desactivado exitosamente'
        };
    } catch (error) {
        console.error('Error in deleteMetodoPagoMongo:', error);
        return {
            success: false,
            message: 'Error al desactivar el método de pago',
            error: 'DELETE_METODO_PAGO_MONGO_ERROR'
        };
    }
}

/**
 * Eliminar un método de pago permanentemente
 */
export async function deleteMetodoPagoPermanentlyMongo(id: string): Promise<{
    success: boolean;
    message?: string;
    error?: string;
}> {
    try {
        const metodosPagoCollection = await getCollection('metodos_pago');

        const result = await metodosPagoCollection.deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 0) {
            return {
                success: false,
                message: 'Método de pago no encontrado',
                error: 'METODO_PAGO_NOT_FOUND'
            };
        }

        return {
            success: true,
            message: 'Método de pago eliminado permanentemente'
        };
    } catch (error) {
        console.error('Error in deleteMetodoPagoPermanentlyMongo:', error);
        return {
            success: false,
            message: 'Error al eliminar el método de pago',
            error: 'DELETE_METODO_PAGO_PERMANENTLY_MONGO_ERROR'
        };
    }
}

/**
 * Inicializar métodos de pago por defecto
 */
export async function initializeMetodosPagoMongo(): Promise<{
    success: boolean;
    message?: string;
    error?: string;
    created?: number;
}> {
    try {
        const metodosPagoCollection = await getCollection('metodos_pago');

        const metodosPagoPredefinidos = [
            'EFECTIVO',
            'TRANSFERENCIA',
            'TARJETA DEBITO',
            'TARJETA CREDITO',
            'MERCADO PAGO',
            'CHEQUE'
        ];

        let created = 0;

        for (const nombre of metodosPagoPredefinidos) {
            const exists = await metodosPagoCollection.findOne({ nombre });

            if (!exists) {
                await metodosPagoCollection.insertOne({
                    nombre,
                    descripcion: null,
                    isActive: true,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
                created++;
            }
        }

        return {
            success: true,
            message: `Inicialización completada. ${created} métodos de pago creados.`,
            created
        };
    } catch (error) {
        console.error('Error in initializeMetodosPagoMongo:', error);
        return {
            success: false,
            message: 'Error al inicializar los métodos de pago',
            error: 'INITIALIZE_METODOS_PAGO_MONGO_ERROR'
        };
    }
}

/**
 * Buscar métodos de pago por nombre
 */
export async function searchMetodosPagoMongo(searchTerm: string): Promise<{
    success: boolean;
    metodosPago?: MetodoPagoMongoData[];
    total?: number;
    message?: string;
    error?: string;
}> {
    try {
        const metodosPagoCollection = await getCollection('metodos_pago');

        const metodosPago = await metodosPagoCollection
            .find({
                $and: [
                    { isActive: true },
                    {
                        $or: [
                            { nombre: { $regex: searchTerm, $options: 'i' } },
                            { descripcion: { $regex: searchTerm, $options: 'i' } }
                        ]
                    }
                ]
            })
            .sort({ nombre: 1 })
            .toArray();

        const formattedMetodosPago = metodosPago.map(metodoPago => ({
            _id: metodoPago._id.toString(),
            nombre: metodoPago.nombre,
            descripcion: metodoPago.descripcion,
            isActive: metodoPago.isActive,
            createdAt: metodoPago.createdAt,
            updatedAt: metodoPago.updatedAt
        }));

        return {
            success: true,
            metodosPago: formattedMetodosPago,
            total: formattedMetodosPago.length
        };
    } catch (error) {
        console.error('Error in searchMetodosPagoMongo:', error);
        return {
            success: false,
            message: 'Error al buscar los métodos de pago',
            error: 'SEARCH_METODOS_PAGO_MONGO_ERROR'
        };
    }
}

/**
 * Obtener estadísticas de métodos de pago
 */
export async function getMetodosPagoStatsMongo(): Promise<{
    success: boolean;
    stats?: {
        totalMetodosPago: number;
        metodosPagoActivos: number;
        metodosPagoInactivos: number;
    };
    message?: string;
    error?: string;
}> {
    try {
        const metodosPagoCollection = await getCollection('metodos_pago');

        const [totalMetodosPago, metodosPagoActivos, metodosPagoInactivos] = await Promise.all([
            metodosPagoCollection.countDocuments({}),
            metodosPagoCollection.countDocuments({ isActive: true }),
            metodosPagoCollection.countDocuments({ isActive: false })
        ]);

        const stats = {
            totalMetodosPago,
            metodosPagoActivos,
            metodosPagoInactivos
        };

        return {
            success: true,
            stats
        };
    } catch (error) {
        console.error('Error in getMetodosPagoStatsMongo:', error);
        return {
            success: false,
            message: 'Error al obtener estadísticas de métodos de pago',
            error: 'GET_METODOS_PAGO_STATS_MONGO_ERROR'
        };
    }
}

