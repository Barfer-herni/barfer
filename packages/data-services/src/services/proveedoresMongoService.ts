import { ObjectId, getCollection } from '@repo/database';

// Tipos para el servicio MongoDB
export interface ProveedorMongoData {
    _id: string;
    nombre: string;
    detalle: string;
    telefono: string;
    personaContacto: string;
    registro: 'BLANCO' | 'NEGRO';
    categoriaId?: string | null;
    metodoPagoId?: string | null;
    // Datos relacionados (populados)
    categoria?: {
        _id: string;
        nombre: string;
    };
    metodoPago?: {
        _id: string;
        nombre: string;
    };
    isActive: boolean;
    createdAt: Date | string;
    updatedAt: Date | string;
}

export interface CreateProveedorMongoInput {
    nombre: string;
    detalle: string;
    telefono: string;
    personaContacto: string;
    registro: 'BLANCO' | 'NEGRO';
    categoriaId?: string;
    metodoPagoId?: string;
    isActive?: boolean;
}

export interface UpdateProveedorMongoInput {
    nombre?: string;
    detalle?: string;
    telefono?: string;
    personaContacto?: string;
    registro?: 'BLANCO' | 'NEGRO';
    categoriaId?: string;
    metodoPagoId?: string;
    isActive?: boolean;
}

// Servicios CRUD

/**
 * Obtener todos los proveedores activos con datos relacionados
 */
export async function getAllProveedoresMongo(): Promise<{
    success: boolean;
    proveedores?: ProveedorMongoData[];
    total?: number;
    message?: string;
    error?: string;
}> {
    try {
        const proveedoresCollection = await getCollection('proveedores');

        const proveedores = await proveedoresCollection
            .aggregate([
                { $match: { isActive: true } },
                {
                    $lookup: {
                        from: 'categorias',
                        localField: 'categoriaId',
                        foreignField: '_id',
                        as: 'categoria'
                    }
                },
                {
                    $lookup: {
                        from: 'metodos_pago',
                        localField: 'metodoPagoId',
                        foreignField: '_id',
                        as: 'metodoPago'
                    }
                },
                {
                    $addFields: {
                        categoria: { $arrayElemAt: ['$categoria', 0] },
                        metodoPago: { $arrayElemAt: ['$metodoPago', 0] }
                    }
                },
                {
                    $sort: { nombre: 1 }
                }
            ])
            .toArray();

        const formattedProveedores = proveedores.map(proveedor => ({
            _id: proveedor._id.toString(),
            nombre: proveedor.nombre,
            detalle: proveedor.detalle,
            telefono: proveedor.telefono,
            personaContacto: proveedor.personaContacto,
            registro: proveedor.registro,
            categoriaId: proveedor.categoriaId ? proveedor.categoriaId.toString() : null,
            metodoPagoId: proveedor.metodoPagoId ? proveedor.metodoPagoId.toString() : null,
            categoria: proveedor.categoria ? {
                _id: proveedor.categoria._id.toString(),
                nombre: proveedor.categoria.nombre
            } : undefined,
            metodoPago: proveedor.metodoPago ? {
                _id: proveedor.metodoPago._id.toString(),
                nombre: proveedor.metodoPago.nombre
            } : undefined,
            isActive: proveedor.isActive,
            createdAt: proveedor.createdAt,
            updatedAt: proveedor.updatedAt
        }));

        return {
            success: true,
            proveedores: formattedProveedores,
            total: formattedProveedores.length
        };
    } catch (error) {
        console.error('Error in getAllProveedoresMongo:', error);
        return {
            success: false,
            message: 'Error al obtener los proveedores',
            error: 'GET_ALL_PROVEEDORES_MONGO_ERROR'
        };
    }
}

/**
 * Obtener todos los proveedores (activos e inactivos) con datos relacionados
 */
export async function getAllProveedoresIncludingInactiveMongo(): Promise<{
    success: boolean;
    proveedores?: ProveedorMongoData[];
    total?: number;
    message?: string;
    error?: string;
}> {
    try {
        const proveedoresCollection = await getCollection('proveedores');

        const proveedores = await proveedoresCollection
            .aggregate([
                {
                    $lookup: {
                        from: 'categorias',
                        localField: 'categoriaId',
                        foreignField: '_id',
                        as: 'categoria'
                    }
                },
                {
                    $lookup: {
                        from: 'metodos_pago',
                        localField: 'metodoPagoId',
                        foreignField: '_id',
                        as: 'metodoPago'
                    }
                },
                {
                    $addFields: {
                        categoria: { $arrayElemAt: ['$categoria', 0] },
                        metodoPago: { $arrayElemAt: ['$metodoPago', 0] }
                    }
                },
                {
                    $sort: { nombre: 1 }
                }
            ])
            .toArray();

        const formattedProveedores = proveedores.map(proveedor => ({
            _id: proveedor._id.toString(),
            nombre: proveedor.nombre,
            detalle: proveedor.detalle,
            telefono: proveedor.telefono,
            personaContacto: proveedor.personaContacto,
            registro: proveedor.registro,
            categoriaId: proveedor.categoriaId ? proveedor.categoriaId.toString() : null,
            metodoPagoId: proveedor.metodoPagoId ? proveedor.metodoPagoId.toString() : null,
            categoria: proveedor.categoria ? {
                _id: proveedor.categoria._id.toString(),
                nombre: proveedor.categoria.nombre
            } : undefined,
            metodoPago: proveedor.metodoPago ? {
                _id: proveedor.metodoPago._id.toString(),
                nombre: proveedor.metodoPago.nombre
            } : undefined,
            isActive: proveedor.isActive,
            createdAt: proveedor.createdAt,
            updatedAt: proveedor.updatedAt
        }));

        return {
            success: true,
            proveedores: formattedProveedores,
            total: formattedProveedores.length
        };
    } catch (error) {
        console.error('Error in getAllProveedoresIncludingInactiveMongo:', error);
        return {
            success: false,
            message: 'Error al obtener los proveedores',
            error: 'GET_ALL_PROVEEDORES_INCLUDING_INACTIVE_MONGO_ERROR'
        };
    }
}

/**
 * Obtener un proveedor por ID con datos relacionados
 */
export async function getProveedorByIdMongo(id: string): Promise<{
    success: boolean;
    proveedor?: ProveedorMongoData;
    message?: string;
    error?: string;
}> {
    try {
        const proveedoresCollection = await getCollection('proveedores');

        const proveedor = await proveedoresCollection
            .aggregate([
                { $match: { _id: new ObjectId(id) } },
                {
                    $lookup: {
                        from: 'categorias',
                        localField: 'categoriaId',
                        foreignField: '_id',
                        as: 'categoria'
                    }
                },
                {
                    $lookup: {
                        from: 'metodos_pago',
                        localField: 'metodoPagoId',
                        foreignField: '_id',
                        as: 'metodoPago'
                    }
                },
                {
                    $addFields: {
                        categoria: { $arrayElemAt: ['$categoria', 0] },
                        metodoPago: { $arrayElemAt: ['$metodoPago', 0] }
                    }
                }
            ])
            .toArray();

        if (proveedor.length === 0) {
            return {
                success: false,
                message: 'Proveedor no encontrado',
                error: 'PROVEEDOR_NOT_FOUND'
            };
        }

        const proveedorData = proveedor[0];
        const formattedProveedor: ProveedorMongoData = {
            _id: proveedorData._id.toString(),
            nombre: proveedorData.nombre,
            detalle: proveedorData.detalle,
            telefono: proveedorData.telefono,
            personaContacto: proveedorData.personaContacto,
            registro: proveedorData.registro,
            categoriaId: proveedorData.categoriaId ? proveedorData.categoriaId.toString() : null,
            metodoPagoId: proveedorData.metodoPagoId ? proveedorData.metodoPagoId.toString() : null,
            categoria: proveedorData.categoria ? {
                _id: proveedorData.categoria._id.toString(),
                nombre: proveedorData.categoria.nombre
            } : undefined,
            metodoPago: proveedorData.metodoPago ? {
                _id: proveedorData.metodoPago._id.toString(),
                nombre: proveedorData.metodoPago.nombre
            } : undefined,
            isActive: proveedorData.isActive,
            createdAt: proveedorData.createdAt,
            updatedAt: proveedorData.updatedAt
        };

        return {
            success: true,
            proveedor: formattedProveedor
        };
    } catch (error) {
        console.error('Error in getProveedorByIdMongo:', error);
        return {
            success: false,
            message: 'Error al obtener el proveedor',
            error: 'GET_PROVEEDOR_BY_ID_MONGO_ERROR'
        };
    }
}

/**
 * Crear un nuevo proveedor
 */
export async function createProveedorMongo(data: CreateProveedorMongoInput): Promise<{
    success: boolean;
    proveedor?: ProveedorMongoData;
    message?: string;
    error?: string;
}> {
    try {
        const proveedoresCollection = await getCollection('proveedores');

        // Verificar si ya existe un proveedor con el mismo nombre
        const existingProveedor = await proveedoresCollection.findOne({
            nombre: { $regex: new RegExp(`^${data.nombre}$`, 'i') }
        });

        if (existingProveedor) {
            return {
                success: false,
                message: 'Ya existe un proveedor con ese nombre',
                error: 'PROVEEDOR_ALREADY_EXISTS'
            };
        }

        // Construir documento para insertar
        const proveedorDoc: any = {
            nombre: data.nombre,
            detalle: data.detalle,
            telefono: data.telefono,
            personaContacto: data.personaContacto,
            registro: data.registro,
            isActive: data.isActive !== undefined ? data.isActive : true,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        // Agregar campos opcionales
        if (data.categoriaId) proveedorDoc.categoriaId = new ObjectId(data.categoriaId);
        if (data.metodoPagoId) proveedorDoc.metodoPagoId = new ObjectId(data.metodoPagoId);

        const result = await proveedoresCollection.insertOne(proveedorDoc);

        // Obtener el proveedor creado con datos relacionados
        const createdProveedor = await getProveedorByIdMongo(result.insertedId.toString());

        return {
            success: true,
            proveedor: createdProveedor.proveedor,
            message: 'Proveedor creado exitosamente'
        };
    } catch (error) {
        console.error('Error in createProveedorMongo:', error);
        return {
            success: false,
            message: 'Error al crear el proveedor',
            error: 'CREATE_PROVEEDOR_MONGO_ERROR'
        };
    }
}

/**
 * Actualizar un proveedor existente
 */
export async function updateProveedorMongo(id: string, data: UpdateProveedorMongoInput): Promise<{
    success: boolean;
    proveedor?: ProveedorMongoData;
    message?: string;
    error?: string;
}> {
    try {
        const proveedoresCollection = await getCollection('proveedores');

        // Verificar si el proveedor existe
        const existingProveedor = await proveedoresCollection.findOne({ _id: new ObjectId(id) });

        if (!existingProveedor) {
            return {
                success: false,
                message: 'Proveedor no encontrado',
                error: 'PROVEEDOR_NOT_FOUND'
            };
        }

        // Si se está actualizando el nombre, verificar que no exista otro proveedor con el mismo nombre
        if (data.nombre && data.nombre !== existingProveedor.nombre) {
            const duplicateProveedor = await proveedoresCollection.findOne({
                nombre: { $regex: new RegExp(`^${data.nombre}$`, 'i') },
                _id: { $ne: new ObjectId(id) }
            });

            if (duplicateProveedor) {
                return {
                    success: false,
                    message: 'Ya existe otro proveedor con ese nombre',
                    error: 'PROVEEDOR_NAME_ALREADY_EXISTS'
                };
            }
        }

        // Construir objeto de actualización
        const updateData: any = {
            updatedAt: new Date()
        };

        // Agregar campos solo si están presentes
        if (data.nombre !== undefined) updateData.nombre = data.nombre;
        if (data.detalle !== undefined) updateData.detalle = data.detalle;
        if (data.telefono !== undefined) updateData.telefono = data.telefono;
        if (data.personaContacto !== undefined) updateData.personaContacto = data.personaContacto;
        if (data.registro !== undefined) updateData.registro = data.registro;
        if (data.isActive !== undefined) updateData.isActive = data.isActive;
        if (data.categoriaId !== undefined) updateData.categoriaId = data.categoriaId ? new ObjectId(data.categoriaId) : null;
        if (data.metodoPagoId !== undefined) updateData.metodoPagoId = data.metodoPagoId ? new ObjectId(data.metodoPagoId) : null;

        const result = await proveedoresCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
        );

        if (result.matchedCount === 0) {
            return {
                success: false,
                message: 'Proveedor no encontrado',
                error: 'PROVEEDOR_NOT_FOUND'
            };
        }

        // Obtener el proveedor actualizado
        const updatedProveedor = await getProveedorByIdMongo(id);

        return {
            success: true,
            proveedor: updatedProveedor.proveedor,
            message: 'Proveedor actualizado exitosamente'
        };
    } catch (error) {
        console.error('Error in updateProveedorMongo:', error);
        return {
            success: false,
            message: 'Error al actualizar el proveedor',
            error: 'UPDATE_PROVEEDOR_MONGO_ERROR'
        };
    }
}

/**
 * Eliminar un proveedor (soft delete)
 */
export async function deleteProveedorMongo(id: string): Promise<{
    success: boolean;
    message?: string;
    error?: string;
}> {
    try {
        const proveedoresCollection = await getCollection('proveedores');

        const result = await proveedoresCollection.updateOne(
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
                message: 'Proveedor no encontrado',
                error: 'PROVEEDOR_NOT_FOUND'
            };
        }

        return {
            success: true,
            message: 'Proveedor eliminado exitosamente'
        };
    } catch (error) {
        console.error('Error in deleteProveedorMongo:', error);
        return {
            success: false,
            message: 'Error al eliminar el proveedor',
            error: 'DELETE_PROVEEDOR_MONGO_ERROR'
        };
    }
}

/**
 * Buscar proveedores por término de búsqueda
 */
export async function searchProveedoresMongo(searchTerm: string): Promise<{
    success: boolean;
    proveedores?: ProveedorMongoData[];
    total?: number;
    message?: string;
    error?: string;
}> {
    try {
        console.log('🔍 searchProveedoresMongo - Término de búsqueda:', searchTerm);
        const proveedoresCollection = await getCollection('proveedores');

        const proveedores = await proveedoresCollection
            .aggregate([
                {
                    $match: {
                        isActive: true,
                        $or: [
                            { nombre: { $regex: searchTerm, $options: 'i' } },
                            { detalle: { $regex: searchTerm, $options: 'i' } },
                            { personaContacto: { $regex: searchTerm, $options: 'i' } }
                        ]
                    }
                },
                {
                    $lookup: {
                        from: 'categorias',
                        localField: 'categoriaId',
                        foreignField: '_id',
                        as: 'categoria'
                    }
                },
                {
                    $lookup: {
                        from: 'metodos_pago',
                        localField: 'metodoPagoId',
                        foreignField: '_id',
                        as: 'metodoPago'
                    }
                },
                {
                    $addFields: {
                        categoria: { $arrayElemAt: ['$categoria', 0] },
                        metodoPago: { $arrayElemAt: ['$metodoPago', 0] }
                    }
                },
                {
                    $sort: { nombre: 1 }
                }
            ])
            .toArray();

        const formattedProveedores = proveedores.map(proveedor => ({
            _id: proveedor._id.toString(),
            nombre: proveedor.nombre,
            detalle: proveedor.detalle,
            telefono: proveedor.telefono,
            personaContacto: proveedor.personaContacto,
            registro: proveedor.registro,
            categoriaId: proveedor.categoriaId ? proveedor.categoriaId.toString() : null,
            metodoPagoId: proveedor.metodoPagoId ? proveedor.metodoPagoId.toString() : null,
            categoria: proveedor.categoria ? {
                _id: proveedor.categoria._id.toString(),
                nombre: proveedor.categoria.nombre
            } : undefined,
            metodoPago: proveedor.metodoPago ? {
                _id: proveedor.metodoPago._id.toString(),
                nombre: proveedor.metodoPago.nombre
            } : undefined,
            isActive: proveedor.isActive,
            createdAt: proveedor.createdAt,
            updatedAt: proveedor.updatedAt
        }));

        return {
            success: true,
            proveedores: formattedProveedores,
            total: formattedProveedores.length
        };
    } catch (error) {
        console.error('❌ Error in searchProveedoresMongo:', error);
        return {
            success: false,
            message: 'Error al buscar proveedores',
            error: 'SEARCH_PROVEEDORES_MONGO_ERROR'
        };
    }
}

// Función de prueba simple
export async function testSearchProveedoresMongo(searchTerm: string): Promise<{
    success: boolean;
    proveedores?: any[];
    message?: string;
}> {
    try {
        console.log('🧪 testSearchProveedoresMongo - Término:', searchTerm);
        const proveedoresCollection = await getCollection('proveedores');

        // Búsqueda simple sin agregación
        const proveedores = await proveedoresCollection
            .find({
                isActive: true,
                $or: [
                    { nombre: { $regex: searchTerm, $options: 'i' } },
                    { detalle: { $regex: searchTerm, $options: 'i' } },
                    { personaContacto: { $regex: searchTerm, $options: 'i' } }
                ]
            })
            .toArray();

        console.log('🧪 testSearchProveedoresMongo - Resultados:', proveedores.length);

        return {
            success: true,
            proveedores: proveedores.map(p => ({
                _id: p._id.toString(),
                nombre: p.nombre,
                detalle: p.detalle,
                telefono: p.telefono,
                personaContacto: p.personaContacto,
                registro: p.registro,
                categoriaId: p.categoriaId?.toString(),
                metodoPagoId: p.metodoPagoId?.toString(),
                isActive: p.isActive
            }))
        };
    } catch (error) {
        console.error('❌ Error in testSearchProveedoresMongo:', error);
        return {
            success: false,
            message: 'Error al buscar proveedores'
        };
    }
}
