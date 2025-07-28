import { database } from '@repo/database';

export interface CategoriaData {
    id: string;
    nombre: string;
    descripcion?: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateCategoriaInput {
    nombre: string;
    descripcion?: string;
    isActive?: boolean;
}

export interface UpdateCategoriaInput {
    nombre?: string;
    descripcion?: string;
    isActive?: boolean;
}

/**
 * Obtener todas las categorías activas
 */
export async function getAllCategorias(): Promise<{
    success: boolean;
    categorias?: CategoriaData[];
    total?: number;
    message?: string;
    error?: string;
}> {
    try {
        const categorias = await database.categoria.findMany({
            where: {
                isActive: true
            },
            orderBy: {
                nombre: 'asc'
            }
        });

        return {
            success: true,
            categorias: categorias as CategoriaData[],
            total: categorias.length
        };
    } catch (error) {
        console.error('Error in getAllCategorias:', error);
        return {
            success: false,
            message: 'Error al obtener las categorías',
            error: 'GET_ALL_CATEGORIAS_ERROR'
        };
    }
}

/**
 * Crear una nueva categoría
 */
export async function createCategoria(data: CreateCategoriaInput): Promise<{
    success: boolean;
    categoria?: CategoriaData;
    message?: string;
    error?: string;
}> {
    try {
        // Verificar si ya existe una categoría con ese nombre
        const existingCategoria = await database.categoria.findUnique({
            where: { nombre: data.nombre.toUpperCase() }
        });

        if (existingCategoria) {
            return {
                success: false,
                message: 'Ya existe una categoría con ese nombre',
                error: 'CATEGORIA_ALREADY_EXISTS'
            };
        }

        const categoria = await database.categoria.create({
            data: {
                nombre: data.nombre.toUpperCase(),
                descripcion: data.descripcion,
                isActive: data.isActive ?? true
            }
        });

        return {
            success: true,
            categoria: categoria as CategoriaData,
            message: 'Categoría creada exitosamente'
        };
    } catch (error) {
        console.error('Error in createCategoria:', error);
        return {
            success: false,
            message: 'Error al crear la categoría',
            error: 'CREATE_CATEGORIA_ERROR'
        };
    }
}

/**
 * Actualizar una categoría existente
 */
export async function updateCategoria(id: string, data: UpdateCategoriaInput): Promise<{
    success: boolean;
    categoria?: CategoriaData;
    message?: string;
    error?: string;
}> {
    try {
        const categoria = await database.categoria.update({
            where: { id },
            data: {
                ...data,
                nombre: data.nombre ? data.nombre.toUpperCase() : undefined,
                updatedAt: new Date()
            }
        });

        return {
            success: true,
            categoria: categoria as CategoriaData,
            message: 'Categoría actualizada exitosamente'
        };
    } catch (error) {
        console.error('Error in updateCategoria:', error);
        return {
            success: false,
            message: 'Error al actualizar la categoría',
            error: 'UPDATE_CATEGORIA_ERROR'
        };
    }
}

/**
 * Desactivar una categoría (soft delete)
 */
export async function deleteCategoria(id: string): Promise<{
    success: boolean;
    message?: string;
    error?: string;
}> {
    try {
        await database.categoria.update({
            where: { id },
            data: {
                isActive: false,
                updatedAt: new Date()
            }
        });

        return {
            success: true,
            message: 'Categoría desactivada exitosamente'
        };
    } catch (error) {
        console.error('Error in deleteCategoria:', error);
        return {
            success: false,
            message: 'Error al desactivar la categoría',
            error: 'DELETE_CATEGORIA_ERROR'
        };
    }
}

/**
 * Inicializar categorías por defecto
 */
export async function initializeCategorias(): Promise<{
    success: boolean;
    message?: string;
    error?: string;
    created?: number;
}> {
    try {
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
            const exists = await database.categoria.findUnique({
                where: { nombre }
            });

            if (!exists) {
                await database.categoria.create({
                    data: { nombre }
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
        console.error('Error in initializeCategorias:', error);
        return {
            success: false,
            message: 'Error al inicializar las categorías',
            error: 'INITIALIZE_CATEGORIAS_ERROR'
        };
    }
}

/**
 * Crear categoría SUELDOS si no existe
 */
export async function ensureSueldosCategory(): Promise<{
    success: boolean;
    categoria?: CategoriaData;
    message?: string;
    error?: string;
}> {
    try {
        // Verificar si ya existe la categoría SUELDOS
        const existingCategory = await database.categoria.findUnique({
            where: { nombre: 'SUELDOS' }
        });

        if (existingCategory) {
            return {
                success: true,
                categoria: {
                    id: existingCategory.id,
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
        const newCategory = await database.categoria.create({
            data: {
                nombre: 'SUELDOS',
                descripcion: 'Gastos relacionados con salarios y remuneraciones',
                isActive: true
            }
        });

        return {
            success: true,
            categoria: {
                id: newCategory.id,
                nombre: newCategory.nombre,
                descripcion: newCategory.descripcion,
                isActive: newCategory.isActive,
                createdAt: newCategory.createdAt,
                updatedAt: newCategory.updatedAt
            },
            message: 'Categoría SUELDOS creada exitosamente'
        };

    } catch (error) {
        console.error('Error ensuring SUELDOS category:', error);
        return {
            success: false,
            message: 'Error al crear la categoría SUELDOS',
            error: 'CREATE_SUELDOS_CATEGORY_ERROR'
        };
    }
} 