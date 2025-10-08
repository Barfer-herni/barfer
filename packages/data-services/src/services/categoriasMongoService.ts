import { ObjectId, getCollection } from '@repo/database';

// Tipos para el servicio MongoDB
export interface CategoriaMongoData {
    _id: string;
    nombre: string;
    descripcion?: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateCategoriaMongoInput {
    nombre: string;
    descripcion?: string;
    isActive?: boolean;
}

export interface UpdateCategoriaMongoInput {
    nombre?: string;
    descripcion?: string;
    isActive?: boolean;
}

// Servicios CRUD

/**
 * Obtener todas las categorías activas
 */
export async function getAllCategoriasMongo(): Promise<{
    success: boolean;
    categorias?: CategoriaMongoData[];
    total?: number;
    message?: string;
    error?: string;
}> {
    try {
        const categoriasCollection = await getCollection('categorias');

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
        console.error('Error in getAllCategoriasMongo:', error);
        return {
            success: false,
            message: 'Error al obtener las categorías',
            error: 'GET_ALL_CATEGORIAS_MONGO_ERROR'
        };
    }
}

/**
 * Obtener todas las categorías (incluyendo inactivas)
 */
export async function getAllCategoriasIncludingInactiveMongo(): Promise<{
    success: boolean;
    categorias?: CategoriaMongoData[];
    total?: number;
    message?: string;
    error?: string;
}> {
    try {
        const categoriasCollection = await getCollection('categorias');

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
        console.error('Error in getAllCategoriasIncludingInactiveMongo:', error);
        return {
            success: false,
            message: 'Error al obtener las categorías',
            error: 'GET_ALL_CATEGORIAS_INCLUDING_INACTIVE_MONGO_ERROR'
        };
    }
}

/**
 * Obtener una categoría por ID
 */
export async function getCategoriaByIdMongo(id: string): Promise<{
    success: boolean;
    categoria?: CategoriaMongoData;
    message?: string;
    error?: string;
}> {
    try {
        const categoriasCollection = await getCollection('categorias');

        const categoria = await categoriasCollection.findOne({ _id: new ObjectId(id) });

        if (!categoria) {
            return {
                success: false,
                message: 'Categoría no encontrada',
                error: 'CATEGORIA_NOT_FOUND'
            };
        }

        const formattedCategoria: CategoriaMongoData = {
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
        console.error('Error in getCategoriaByIdMongo:', error);
        return {
            success: false,
            message: 'Error al obtener la categoría',
            error: 'GET_CATEGORIA_BY_ID_MONGO_ERROR'
        };
    }
}

/**
 * Crear una nueva categoría
 */
export async function createCategoriaMongo(data: CreateCategoriaMongoInput): Promise<{
    success: boolean;
    categoria?: CategoriaMongoData;
    message?: string;
    error?: string;
}> {
    try {
        const categoriasCollection = await getCollection('categorias');

        // Verificar si ya existe una categoría con ese nombre
        const existingCategoria = await categoriasCollection.findOne({
            nombre: data.nombre.toUpperCase()
        });

        if (existingCategoria) {
            return {
                success: false,
                message: 'Ya existe una categoría con ese nombre',
                error: 'CATEGORIA_ALREADY_EXISTS'
            };
        }

        const categoriaDoc = {
            nombre: data.nombre.toUpperCase(),
            descripcion: data.descripcion,
            isActive: data.isActive ?? true,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const result = await categoriasCollection.insertOne(categoriaDoc);

        const newCategoria: CategoriaMongoData = {
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
            message: 'Categoría creada exitosamente'
        };
    } catch (error) {
        console.error('Error in createCategoriaMongo:', error);
        return {
            success: false,
            message: 'Error al crear la categoría',
            error: 'CREATE_CATEGORIA_MONGO_ERROR'
        };
    }
}

/**
 * Actualizar una categoría existente
 */
export async function updateCategoriaMongo(id: string, data: UpdateCategoriaMongoInput): Promise<{
    success: boolean;
    categoria?: CategoriaMongoData;
    message?: string;
    error?: string;
}> {
    try {
        const categoriasCollection = await getCollection('categorias');

        // Construir objeto de actualización
        const updateData: any = {
            updatedAt: new Date()
        };

        if (data.nombre !== undefined) updateData.nombre = data.nombre.toUpperCase();
        if (data.descripcion !== undefined) updateData.descripcion = data.descripcion;
        if (data.isActive !== undefined) updateData.isActive = data.isActive;

        const result = await categoriasCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
        );

        if (result.matchedCount === 0) {
            return {
                success: false,
                message: 'Categoría no encontrada',
                error: 'CATEGORIA_NOT_FOUND'
            };
        }

        // Obtener la categoría actualizada
        const updatedCategoria = await getCategoriaByIdMongo(id);

        return {
            success: true,
            categoria: updatedCategoria.categoria,
            message: 'Categoría actualizada exitosamente'
        };
    } catch (error) {
        console.error('Error in updateCategoriaMongo:', error);
        return {
            success: false,
            message: 'Error al actualizar la categoría',
            error: 'UPDATE_CATEGORIA_MONGO_ERROR'
        };
    }
}

/**
 * Desactivar una categoría (soft delete)
 */
export async function deleteCategoriaMongo(id: string): Promise<{
    success: boolean;
    message?: string;
    error?: string;
}> {
    try {
        const categoriasCollection = await getCollection('categorias');

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
                message: 'Categoría no encontrada',
                error: 'CATEGORIA_NOT_FOUND'
            };
        }

        return {
            success: true,
            message: 'Categoría desactivada exitosamente'
        };
    } catch (error) {
        console.error('Error in deleteCategoriaMongo:', error);
        return {
            success: false,
            message: 'Error al desactivar la categoría',
            error: 'DELETE_CATEGORIA_MONGO_ERROR'
        };
    }
}

/**
 * Eliminar una categoría permanentemente
 */
export async function deleteCategoriaPermanentlyMongo(id: string): Promise<{
    success: boolean;
    message?: string;
    error?: string;
}> {
    try {
        const categoriasCollection = await getCollection('categorias');

        const result = await categoriasCollection.deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 0) {
            return {
                success: false,
                message: 'Categoría no encontrada',
                error: 'CATEGORIA_NOT_FOUND'
            };
        }

        return {
            success: true,
            message: 'Categoría eliminada permanentemente'
        };
    } catch (error) {
        console.error('Error in deleteCategoriaPermanentlyMongo:', error);
        return {
            success: false,
            message: 'Error al eliminar la categoría',
            error: 'DELETE_CATEGORIA_PERMANENTLY_MONGO_ERROR'
        };
    }
}

/**
 * Inicializar categorías por defecto
 */
export async function initializeCategoriasMongo(): Promise<{
    success: boolean;
    message?: string;
    error?: string;
    created?: number;
}> {
    try {
        const categoriasCollection = await getCollection('categorias');

        const categoriasPredefinidas = [
            'SUELDOS',
            'IMPUESTOS',
            'MANTENIMIENTO MAQUINARIA',
            'INSUMOS',
            'MATERIA PRIMA',
            'SERVICIOS',
            'FLETE',
            'LIMPIEZA',
            'ALQUILERES',
            'UTILES',
            'PUBLICIDAD',
            'MANTENIMIENTO EDILICIO',
            'OTROS',
            'CAJA CHICA',
            'VIATICOS',
            'VEHICULOS',
            'COMBUSTIBLE',
            'OFICINA',
            'FINANCIACION',
            'INVERSION EDILICIA',
            'INDUMENTARIA',
            'INVERSION PRODUCTO',
            'PRODUCTOS',
            'INVERSION TECNOLOGICA',
            'I&D'
        ];

        let created = 0;

        for (const nombre of categoriasPredefinidas) {
            const exists = await categoriasCollection.findOne({ nombre });

            if (!exists) {
                await categoriasCollection.insertOne({
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
            message: `Inicialización completada. ${created} categorías creadas.`,
            created
        };
    } catch (error) {
        console.error('Error in initializeCategoriasMongo:', error);
        return {
            success: false,
            message: 'Error al inicializar las categorías',
            error: 'INITIALIZE_CATEGORIAS_MONGO_ERROR'
        };
    }
}

/**
 * Crear categoría SUELDOS si no existe
 */
export async function ensureSueldosCategoryMongo(): Promise<{
    success: boolean;
    categoria?: CategoriaMongoData;
    message?: string;
    error?: string;
}> {
    try {
        const categoriasCollection = await getCollection('categorias');

        // Verificar si ya existe la categoría SUELDOS
        const existingCategory = await categoriasCollection.findOne({ nombre: 'SUELDOS' });

        if (existingCategory) {
            return {
                success: true,
                categoria: {
                    _id: existingCategory._id.toString(),
                    nombre: existingCategory.nombre,
                    descripcion: existingCategory.descripcion,
                    isActive: existingCategory.isActive,
                    createdAt: existingCategory.createdAt,
                    updatedAt: existingCategory.updatedAt
                },
                message: 'La categoría SUELDOS ya existe'
            };
        }

        // Crear la categoría SUELDOS
        const newCategoryDoc = {
            nombre: 'SUELDOS',
            descripcion: 'Gastos relacionados con salarios y remuneraciones',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const result = await categoriasCollection.insertOne(newCategoryDoc);

        const newCategory: CategoriaMongoData = {
            _id: result.insertedId.toString(),
            nombre: newCategoryDoc.nombre,
            descripcion: newCategoryDoc.descripcion,
            isActive: newCategoryDoc.isActive,
            createdAt: newCategoryDoc.createdAt,
            updatedAt: newCategoryDoc.updatedAt
        };

        return {
            success: true,
            categoria: newCategory,
            message: 'Categoría SUELDOS creada exitosamente'
        };

    } catch (error) {
        console.error('Error ensuring SUELDOS category in MongoDB:', error);
        return {
            success: false,
            message: 'Error al crear la categoría SUELDOS',
            error: 'CREATE_SUELDOS_CATEGORY_MONGO_ERROR'
        };
    }
}

/**
 * Buscar categorías por nombre
 */
export async function searchCategoriasMongo(searchTerm: string): Promise<{
    success: boolean;
    categorias?: CategoriaMongoData[];
    total?: number;
    message?: string;
    error?: string;
}> {
    try {
        const categoriasCollection = await getCollection('categorias');

        const categorias = await categoriasCollection
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
        console.error('Error in searchCategoriasMongo:', error);
        return {
            success: false,
            message: 'Error al buscar las categorías',
            error: 'SEARCH_CATEGORIAS_MONGO_ERROR'
        };
    }
}

/**
 * Obtener estadísticas de categorías
 */
export async function getCategoriasStatsMongo(): Promise<{
    success: boolean;
    stats?: {
        totalCategorias: number;
        categoriasActivas: number;
        categoriasInactivas: number;
    };
    message?: string;
    error?: string;
}> {
    try {
        const categoriasCollection = await getCollection('categorias');

        const [totalCategorias, categoriasActivas, categoriasInactivas] = await Promise.all([
            categoriasCollection.countDocuments({}),
            categoriasCollection.countDocuments({ isActive: true }),
            categoriasCollection.countDocuments({ isActive: false })
        ]);

        const stats = {
            totalCategorias,
            categoriasActivas,
            categoriasInactivas
        };

        return {
            success: true,
            stats
        };
    } catch (error) {
        console.error('Error in getCategoriasStatsMongo:', error);
        return {
            success: false,
            message: 'Error al obtener estadísticas de categorías',
            error: 'GET_CATEGORIAS_STATS_MONGO_ERROR'
        };
    }
}

