'use server'

import {
    // Servicios MongoDB
    getAllSalidasMongo,
    getAllSalidasWithPermissionFilterMongo,
    getSalidasPaginatedMongo,
    createSalidaMongo,
    updateSalidaMongo,
    deleteSalidaMongo,
    getSalidasByDateRangeMongo,
    getAllCategoriasMongo,
    getAllMetodosPagoMongo,
    createCategoriaMongo,
    deleteCategoriaMongo,
    createMetodoPagoMongo,
    initializeCategoriasMongo,
    initializeMetodosPagoMongo,
    // Servicios de Proveedores
    getAllProveedoresMongo,
    getAllProveedoresIncludingInactiveMongo,
    getProveedorByIdMongo,
    createProveedorMongo,
    updateProveedorMongo,
    deleteProveedorMongo,
    searchProveedoresMongo,
    testSearchProveedoresMongo,
    // Servicios de Categorías de Proveedores
    getAllCategoriasProveedoresMongo,
    createCategoriaProveedorMongo,
    updateCategoriaProveedorMongo,
    deleteCategoriaProveedorMongo,
    initializeCategoriasProveedoresMongo,
    // Servicios de Analytics
    getSalidasCategoryAnalytics,
    getSalidasTypeAnalytics,
    getSalidasMonthlyAnalytics,
    getSalidasOverviewAnalytics,
    getSalidasDetailsByCategory,
    // Servicios adicionales
    getSalidasByCategory,
    // Tipos MongoDB
    type CreateSalidaMongoInput,
    type UpdateSalidaMongoInput,
    type CreateProveedorMongoInput,
    type UpdateProveedorMongoInput,
    type CreateCategoriaProveedorMongoInput,
    type UpdateCategoriaProveedorMongoInput
} from '@repo/data-services';
import { revalidatePath } from 'next/cache';
import { TipoSalida, TipoRegistro } from '@repo/database';
import { hasPermission } from '@repo/auth/server-permissions';

// Re-exportar tipos para las acciones
export type { CreateSalidaMongoInput as CreateSalidaData, UpdateSalidaMongoInput as UpdateSalidaData };

// Acciones usando los nuevos servicios

// Obtener todas las salidas
export async function getAllSalidasAction() {
    const result = await getAllSalidasWithPermissionFilterMongo();
    return result;
}

// Obtener salidas paginadas
export async function getSalidasPaginatedAction({
    pageIndex = 0,
    pageSize = 50,
}: {
    pageIndex?: number;
    pageSize?: number;
}) {
    'use server';

    const result = await getSalidasPaginatedMongo({ pageIndex, pageSize });
    return result;
}

// Crear una nueva salida
export async function createSalidaAction(data: CreateSalidaMongoInput) {
    // Verificar permisos
    if (!await hasPermission('outputs:create')) {
        return { success: false, error: 'No tienes permisos para crear salidas' };
    }

    const result = await createSalidaMongo(data);
    if (result.success) {
        revalidatePath('/admin/salidas');
    }
    return result;
}

// Actualizar una salida
export async function updateSalidaAction(salidaId: string, data: UpdateSalidaMongoInput) {
    // Verificar permisos
    if (!await hasPermission('outputs:edit')) {
        return { success: false, error: 'No tienes permisos para editar salidas' };
    }

    const result = await updateSalidaMongo(salidaId, data);
    if (result.success) {
        revalidatePath('/admin/salidas');
    }
    return result;
}

// Eliminar una salida
export async function deleteSalidaAction(salidaId: string) {
    // Verificar permisos
    if (!await hasPermission('outputs:delete')) {
        return { success: false, error: 'No tienes permisos para eliminar salidas' };
    }

    const result = await deleteSalidaMongo(salidaId);
    if (result.success) {
        revalidatePath('/admin/salidas');
    }
    return result;
}

// Obtener salidas por rango de fechas
export async function getSalidasByDateRangeAction(startDate: Date, endDate: Date) {
    return await getSalidasByDateRangeMongo(startDate, endDate);
}

// Obtener salidas por categoría
export async function getSalidasByCategoryAction(categoria: string) {
    return await getSalidasByCategory(categoria);
}

// Nuevas acciones para categorías y métodos de pago

// Obtener todas las categorías
export async function getAllCategoriasAction() {
    return await getAllCategoriasMongo();
}

// Crear una nueva categoría
export async function createCategoriaAction(nombre: string) {
    const result = await createCategoriaMongo({ nombre });
    if (result.success) {
        revalidatePath('/admin/salidas');
    }
    return result;
}

// Eliminar una categoría
export async function deleteCategoriaAction(categoriaId: string) {
    // Verificar permisos
    if (!await hasPermission('outputs:delete')) {
        return { success: false, error: 'No tienes permisos para eliminar categorías' };
    }

    const result = await deleteCategoriaMongo(categoriaId);
    if (result.success) {
        revalidatePath('/admin/salidas');
    }
    return result;
}

// Inicializar categorías por defecto
export async function initializeCategoriasAction() {
    // Verificar permisos de admin
    if (!await hasPermission('admin:full_access')) {
        return { success: false, error: 'No tienes permisos para inicializar categorías' };
    }

    const result = await initializeCategoriasMongo();
    if (result.success) {
        revalidatePath('/admin/salidas');
    }
    return result;
}

// Obtener todos los métodos de pago
export async function getAllMetodosPagoAction() {
    return await getAllMetodosPagoMongo();
}

// Crear un nuevo método de pago
export async function createMetodoPagoAction(nombre: string) {
    const result = await createMetodoPagoMongo({ nombre });
    if (result.success) {
        revalidatePath('/admin/salidas');
    }
    return result;
}

// Inicializar métodos de pago por defecto
export async function initializeMetodosPagoAction() {
    // Verificar permisos de admin
    if (!await hasPermission('admin:full_access')) {
        return { success: false, error: 'No tienes permisos para inicializar métodos de pago' };
    }

    const result = await initializeMetodosPagoMongo();
    if (result.success) {
        revalidatePath('/admin/salidas');
    }
    return result;
}

// ==========================================
// ACCIONES DE ANALYTICS (MongoDB)
// ==========================================

// Obtener estadísticas de salidas por mes
export async function getSalidasStatsByMonthAction(year: number, month: number) {
    const { getSalidasStatsByMonthMongo } = await import('@repo/data-services');
    return await getSalidasStatsByMonthMongo(year, month);
}

// ==========================================
// ACCIONES DE ANALYTICS (PostgreSQL/Prisma)
// ==========================================

// Obtener estadísticas de salidas por categoría
export async function getSalidasCategoryAnalyticsAction(startDate?: Date, endDate?: Date) {
    return await getSalidasCategoryAnalytics(startDate, endDate);
}

// Obtener estadísticas de salidas por tipo (ordinario vs extraordinario)
export async function getSalidasTypeAnalyticsAction(startDate?: Date, endDate?: Date) {
    return await getSalidasTypeAnalytics(startDate, endDate);
}

// Obtener estadísticas de salidas por mes
export async function getSalidasMonthlyAnalyticsAction(categoriaId?: string, startDate?: Date, endDate?: Date) {
    return await getSalidasMonthlyAnalytics(categoriaId, startDate, endDate);
}

// Obtener resumen general de salidas
export async function getSalidasOverviewAnalyticsAction(startDate?: Date, endDate?: Date) {
    return await getSalidasOverviewAnalytics(startDate, endDate);
}

// Obtener detalles de salidas por categoría
export async function getSalidasDetailsByCategoryAction(categoriaId: string, startDate?: Date, endDate?: Date) {
    // Usar servicio MongoDB en lugar de Prisma
    const result = await getAllSalidasMongo();

    if (!result.success || !result.salidas) {
        return { success: false, salidas: [], error: result.error };
    }

    // Filtrar por categoría y rango de fechas
    const filteredSalidas = result.salidas.filter(salida => {
        const matchesCategory = salida.categoriaId === categoriaId;

        if (!matchesCategory) return false;

        if (startDate || endDate) {
            const salidaDate = new Date(salida.fechaFactura);
            if (startDate && salidaDate < startDate) return false;
            if (endDate && salidaDate > endDate) return false;
        }

        return true;
    });

    return { success: true, salidas: filteredSalidas };
}

// ==========================================
// ACCIONES DE PROVEEDORES (MongoDB)
// ==========================================

// Obtener todos los proveedores
export async function getAllProveedoresAction() {
    return await getAllProveedoresMongo();
}

// Obtener todos los proveedores (incluyendo inactivos)
export async function getAllProveedoresIncludingInactiveAction() {
    return await getAllProveedoresIncludingInactiveMongo();
}

// Obtener un proveedor por ID
export async function getProveedorByIdAction(id: string) {
    return await getProveedorByIdMongo(id);
}

// Crear un nuevo proveedor
export async function createProveedorAction(data: CreateProveedorMongoInput) {
    // Verificar permisos
    if (!await hasPermission('outputs:create')) {
        return { success: false, error: 'No tienes permisos para crear proveedores' };
    }

    const result = await createProveedorMongo(data);
    if (result.success) {
        revalidatePath('/admin/salidas');
    }
    return result;
}

// Actualizar un proveedor
export async function updateProveedorAction(proveedorId: string, data: UpdateProveedorMongoInput) {
    // Verificar permisos
    if (!await hasPermission('outputs:edit')) {
        return { success: false, error: 'No tienes permisos para editar proveedores' };
    }

    const result = await updateProveedorMongo(proveedorId, data);
    if (result.success) {
        revalidatePath('/admin/salidas');
    }
    return result;
}

// Eliminar un proveedor
export async function deleteProveedorAction(proveedorId: string) {
    // Verificar permisos
    if (!await hasPermission('outputs:delete')) {
        return { success: false, error: 'No tienes permisos para eliminar proveedores' };
    }

    const result = await deleteProveedorMongo(proveedorId);
    if (result.success) {
        revalidatePath('/admin/salidas');
    }
    return result;
}

// Buscar proveedores
export async function searchProveedoresAction(searchTerm: string) {
    return await searchProveedoresMongo(searchTerm);
}

// Función de prueba para búsqueda de proveedores
export async function testSearchProveedoresAction(searchTerm: string) {
    return await testSearchProveedoresMongo(searchTerm);
}

// ==========================================
// ACCIONES DE CATEGORÍAS DE PROVEEDORES (MongoDB)
// ==========================================

// Obtener todas las categorías de proveedores
export async function getAllCategoriasProveedoresAction() {
    return await getAllCategoriasProveedoresMongo();
}

// Crear una nueva categoría de proveedor
export async function createCategoriaProveedorAction(data: CreateCategoriaProveedorMongoInput) {
    // Verificar permisos
    if (!await hasPermission('outputs:create')) {
        return { success: false, error: 'No tienes permisos para crear categorías de proveedores' };
    }

    const result = await createCategoriaProveedorMongo(data);
    if (result.success) {
        revalidatePath('/admin/salidas');
    }
    return result;
}

// Actualizar una categoría de proveedor
export async function updateCategoriaProveedorAction(categoriaId: string, data: UpdateCategoriaProveedorMongoInput) {
    // Verificar permisos
    if (!await hasPermission('outputs:edit')) {
        return { success: false, error: 'No tienes permisos para editar categorías de proveedores' };
    }

    const result = await updateCategoriaProveedorMongo(categoriaId, data);
    if (result.success) {
        revalidatePath('/admin/salidas');
    }
    return result;
}

// Eliminar una categoría de proveedor
export async function deleteCategoriaProveedorAction(categoriaId: string) {
    // Verificar permisos
    if (!await hasPermission('outputs:delete')) {
        return { success: false, error: 'No tienes permisos para eliminar categorías de proveedores' };
    }

    const result = await deleteCategoriaProveedorMongo(categoriaId);
    if (result.success) {
        revalidatePath('/admin/salidas');
    }
    return result;
}

// Inicializar categorías de proveedores por defecto
export async function initializeCategoriasProveedoresAction() {
    // Verificar permisos de admin
    if (!await hasPermission('admin:full_access')) {
        return { success: false, error: 'No tienes permisos para inicializar categorías de proveedores' };
    }

    const result = await initializeCategoriasProveedoresMongo();
    if (result.success) {
        revalidatePath('/admin/salidas');
    }
    return result;
} 