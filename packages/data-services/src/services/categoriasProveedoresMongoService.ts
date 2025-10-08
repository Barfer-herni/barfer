import { ObjectId, getCollection } from '@repo/database';

// Tipos para el servicio MongoDB
export interface CategoriaProveedorMongoData {
    _id: string;
    nombre: string;
    descripcion?: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateCategoriaProveedorMongoInput {
    nombre: string;
    descripcion?: string;
    isActive?: boolean;
}

export interface UpdateCategoriaProveedorMongoInput {
    nombre?: string;
    descripcion?: string;
    isActive?: boolean;
}

// Servicios CRUD

/**
 * Obtener todas las categorías de proveedores activas
 */
export async function getAllCategoriasProveedoresMongo(): Promise<{
    success: boolean;
    categorias?: CategoriaProveedorMongoData[];
    total?: number;
    message?: string;
    error?: string;
}> {
    try {
        const categoriasCollection = await getCollection('categorias_proveedores');

        const categorias = await categoriasCollection
            .find({ isActive: true })
            .sort({ nombre: 1 })
            .toArray();

        const formattedCategorias = categorias.map(categoria => ({
            _id: categoria._id.toString(),
            nombre: categoria.nombre,
            descripcion: categoria.descripcion,
            isActive: categoria.isActive,
            createdAt: categoria.createdAt,
            updatedAt: categoria.updatedAt
        }));

        return {
            success: true,
            categorias: formattedCategorias,
            total: formattedCategorias.length
        };
    } catch (error) {
        console.error('Error in getAllCategoriasProveedoresMongo:', error);
        return {
            success: false,
            message: 'Error al obtener las categorías de proveedores',
            error: 'GET_ALL_CATEGORIAS_PROVEEDORES_MONGO_ERROR'
        };
    }
}

/**
 * Obtener todas las categorías de proveedores (activas e inactivas)
 */
export async function getAllCategoriasProveedoresIncludingInactiveMongo(): Promise<{
    success: boolean;
    categorias?: CategoriaProveedorMongoData[];
    total?: number;
    message?: string;
    error?: string;
}> {
    try {
        const categoriasCollection = await getCollection('categorias_proveedores');

        const categorias = await categoriasCollection
            .find({})
            .sort({ nombre: 1 })
            .toArray();

        const formattedCategorias = categorias.map(categoria => ({
            _id: categoria._id.toString(),
            nombre: categoria.nombre,
            descripcion: categoria.descripcion,
            isActive: categoria.isActive,
            createdAt: categoria.createdAt,
            updatedAt: categoria.updatedAt
        }));

        return {
            success: true,
            categorias: formattedCategorias,
            total: formattedCategorias.length
        };
    } catch (error) {
        console.error('Error in getAllCategoriasProveedoresIncludingInactiveMongo:', error);
        return {
            success: false,
            message: 'Error al obtener las categorías de proveedores',
            error: 'GET_ALL_CATEGORIAS_PROVEEDORES_INCLUDING_INACTIVE_MONGO_ERROR'
        };
    }
}

/**
 * Obtener una categoría de proveedor por ID
 */
export async function getCategoriaProveedorByIdMongo(id: string): Promise<{
    success: boolean;
    categoria?: CategoriaProveedorMongoData;
    message?: string;
    error?: string;
}> {
    try {
        const categoriasCollection = await getCollection('categorias_proveedores');

        const categoria = await categoriasCollection.findOne({ _id: new ObjectId(id) });

        if (!categoria) {
            return {
                success: false,
                message: 'Categoría de proveedor no encontrada',
                error: 'CATEGORIA_PROVEEDOR_NOT_FOUND'
            };
        }

        const formattedCategoria: CategoriaProveedorMongoData = {
            _id: categoria._id.toString(),
            nombre: categoria.nombre,
            descripcion: categoria.descripcion,
            isActive: categoria.isActive,
            createdAt: categoria.createdAt,
            updatedAt: categoria.updatedAt
        };

        return {
            success: true,
            categoria: formattedCategoria
        };
    } catch (error) {
        console.error('Error in getCategoriaProveedorByIdMongo:', error);
        return {
            success: false,
            message: 'Error al obtener la categoría de proveedor',
            error: 'GET_CATEGORIA_PROVEEDOR_BY_ID_MONGO_ERROR'
        };
    }
}

/**
 * Crear una nueva categoría de proveedor
 */
export async function createCategoriaProveedorMongo(data: CreateCategoriaProveedorMongoInput): Promise<{
    success: boolean;
    categoria?: CategoriaProveedorMongoData;
    message?: string;
    error?: string;
}> {
    try {
        const categoriasCollection = await getCollection('categorias_proveedores');

        // Verificar si ya existe una categoría con el mismo nombre
        const existingCategoria = await categoriasCollection.findOne({
            nombre: { $regex: new RegExp(`^${data.nombre}$`, 'i') }
        });

        if (existingCategoria) {
            return {
                success: false,
                message: 'Ya existe una categoría de proveedor con ese nombre',
                error: 'CATEGORIA_PROVEEDOR_ALREADY_EXISTS'
            };
        }

        const categoriaDoc = {
            nombre: data.nombre,
            descripcion: data.descripcion || null,
            isActive: data.isActive !== undefined ? data.isActive : true,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const result = await categoriasCollection.insertOne(categoriaDoc);

        const newCategoria: CategoriaProveedorMongoData = {
            _id: result.insertedId.toString(),
            nombre: categoriaDoc.nombre,
            descripcion: categoriaDoc.descripcion,
            isActive: categoriaDoc.isActive,
            createdAt: categoriaDoc.createdAt,
            updatedAt: categoriaDoc.updatedAt
        };

        return {
            success: true,
            categoria: newCategoria,
            message: 'Categoría de proveedor creada exitosamente'
        };
    } catch (error) {
        console.error('Error in createCategoriaProveedorMongo:', error);
        return {
            success: false,
            message: 'Error al crear la categoría de proveedor',
            error: 'CREATE_CATEGORIA_PROVEEDOR_MONGO_ERROR'
        };
    }
}

/**
 * Actualizar una categoría de proveedor existente
 */
export async function updateCategoriaProveedorMongo(id: string, data: UpdateCategoriaProveedorMongoInput): Promise<{
    success: boolean;
    categoria?: CategoriaProveedorMongoData;
    message?: string;
    error?: string;
}> {
    try {
        const categoriasCollection = await getCollection('categorias_proveedores');

        // Verificar si la categoría existe
        const existingCategoria = await categoriasCollection.findOne({ _id: new ObjectId(id) });

        if (!existingCategoria) {
            return {
                success: false,
                message: 'Categoría de proveedor no encontrada',
                error: 'CATEGORIA_PROVEEDOR_NOT_FOUND'
            };
        }

        // Si se está actualizando el nombre, verificar que no exista otra categoría con el mismo nombre
        if (data.nombre && data.nombre !== existingCategoria.nombre) {
            const duplicateCategoria = await categoriasCollection.findOne({
                nombre: { $regex: new RegExp(`^${data.nombre}$`, 'i') },
                _id: { $ne: new ObjectId(id) }
            });

            if (duplicateCategoria) {
                return {
                    success: false,
                    message: 'Ya existe otra categoría de proveedor con ese nombre',
                    error: 'CATEGORIA_PROVEEDOR_NAME_ALREADY_EXISTS'
                };
            }
        }

        const updateData: any = {
            updatedAt: new Date()
        };

        if (data.nombre !== undefined) updateData.nombre = data.nombre;
        if (data.descripcion !== undefined) updateData.descripcion = data.descripcion;
        if (data.isActive !== undefined) updateData.isActive = data.isActive;

        const result = await categoriasCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
        );

        if (result.matchedCount === 0) {
            return {
                success: false,
                message: 'Categoría de proveedor no encontrada',
                error: 'CATEGORIA_PROVEEDOR_NOT_FOUND'
            };
        }

        // Obtener la categoría actualizada
        const updatedCategoria = await getCategoriaProveedorByIdMongo(id);

        return {
            success: true,
            categoria: updatedCategoria.categoria,
            message: 'Categoría de proveedor actualizada exitosamente'
        };
    } catch (error) {
        console.error('Error in updateCategoriaProveedorMongo:', error);
        return {
            success: false,
            message: 'Error al actualizar la categoría de proveedor',
            error: 'UPDATE_CATEGORIA_PROVEEDOR_MONGO_ERROR'
        };
    }
}

/**
 * Eliminar una categoría de proveedor (soft delete)
 */
export async function deleteCategoriaProveedorMongo(id: string): Promise<{
    success: boolean;
    message?: string;
    error?: string;
}> {
    try {
        const categoriasCollection = await getCollection('categorias_proveedores');

        const result = await categoriasCollection.updateOne(
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
                message: 'Categoría de proveedor no encontrada',
                error: 'CATEGORIA_PROVEEDOR_NOT_FOUND'
            };
        }

        return {
            success: true,
            message: 'Categoría de proveedor eliminada exitosamente'
        };
    } catch (error) {
        console.error('Error in deleteCategoriaProveedorMongo:', error);
        return {
            success: false,
            message: 'Error al eliminar la categoría de proveedor',
            error: 'DELETE_CATEGORIA_PROVEEDOR_MONGO_ERROR'
        };
    }
}

/**
 * Inicializar categorías de proveedores por defecto
 */
export async function initializeCategoriasProveedoresMongo(): Promise<{
    success: boolean;
    message?: string;
    error?: string;
}> {
    try {
        const categoriasCollection = await getCollection('categorias_proveedores');

        const categoriasDefault = [
            { nombre: 'Alimentos', descripcion: 'Proveedores de alimentos y bebidas' },
            { nombre: 'Limpieza', descripcion: 'Productos de limpieza y aseo' },
            { nombre: 'Equipos', descripcion: 'Equipos y maquinaria' },
            { nombre: 'Servicios', descripcion: 'Servicios varios' },
            { nombre: 'Otros', descripcion: 'Otras categorías' }
        ];

        const existingCategorias = await categoriasCollection.find({}).toArray();
        const existingNames = existingCategorias.map(cat => cat.nombre.toLowerCase());

        const categoriasToInsert = categoriasDefault.filter(cat =>
            !existingNames.includes(cat.nombre.toLowerCase())
        );

        if (categoriasToInsert.length > 0) {
            const categoriasWithMetadata = categoriasToInsert.map(categoria => ({
                ...categoria,
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
            }));

            await categoriasCollection.insertMany(categoriasWithMetadata);
        }

        return {
            success: true,
            message: `Categorías de proveedores inicializadas. ${categoriasToInsert.length} nuevas categorías creadas.`
        };
    } catch (error) {
        console.error('Error in initializeCategoriasProveedoresMongo:', error);
        return {
            success: false,
            message: 'Error al inicializar las categorías de proveedores',
            error: 'INITIALIZE_CATEGORIAS_PROVEEDORES_MONGO_ERROR'
        };
    }
}
