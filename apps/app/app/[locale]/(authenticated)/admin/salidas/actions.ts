'use server'

import {
    getAllSalidas,
    createSalida,
    updateSalida,
    deleteSalida,
    getSalidasByDateRange,
    getSalidasByCategory,
    getAllCategorias,
    getAllMetodosPago,
    createCategoria,
    createMetodoPago,
    getSalidasCategoryAnalytics,
    getSalidasTypeAnalytics,
    getSalidasMonthlyAnalytics,
    getSalidasOverviewAnalytics,
    getSalidasDetailsByCategory,
    type CreateSalidaInput
} from '@repo/data-services';
import { revalidatePath } from 'next/cache';
import { TipoSalida, TipoRegistro } from '@repo/database';
import { hasPermission } from '@repo/auth/server-permissions';

// Re-exportar tipos para las acciones
export type { CreateSalidaInput as CreateSalidaData };

// Acciones usando los nuevos servicios

// Obtener todas las salidas
export async function getAllSalidasAction() {
    const result = await getAllSalidas();
    return result;
}

// Crear una nueva salida
export async function createSalidaAction(data: CreateSalidaInput) {
    // Verificar permisos
    if (!await hasPermission('outputs:create')) {
        return { success: false, error: 'No tienes permisos para crear salidas' };
    }

    const result = await createSalida(data);
    if (result.success) {
        revalidatePath('/admin/salidas');
    }
    return result;
}

// Actualizar una salida
export async function updateSalidaAction(salidaId: string, data: Partial<CreateSalidaInput>) {
    // Verificar permisos
    if (!await hasPermission('outputs:edit')) {
        return { success: false, error: 'No tienes permisos para editar salidas' };
    }

    const result = await updateSalida(salidaId, data);
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

    const result = await deleteSalida(salidaId);
    if (result.success) {
        revalidatePath('/admin/salidas');
    }
    return result;
}

// Obtener salidas por rango de fechas
export async function getSalidasByDateRangeAction(startDate: Date, endDate: Date) {
    return await getSalidasByDateRange(startDate, endDate);
}

// Obtener salidas por categoría
export async function getSalidasByCategoryAction(categoria: string) {
    return await getSalidasByCategory(categoria);
}

// Nuevas acciones para categorías y métodos de pago

// Obtener todas las categorías
export async function getAllCategoriasAction() {
    return await getAllCategorias();
}

// Crear una nueva categoría
export async function createCategoriaAction(nombre: string) {
    const result = await createCategoria({ nombre });
    if (result.success) {
        revalidatePath('/admin/salidas');
    }
    return result;
}

// Obtener todos los métodos de pago
export async function getAllMetodosPagoAction() {
    return await getAllMetodosPago();
}

// Crear un nuevo método de pago
export async function createMetodoPagoAction(nombre: string) {
    const result = await createMetodoPago({ nombre });
    if (result.success) {
        revalidatePath('/admin/salidas');
    }
    return result;
}

// ==========================================
// ACCIONES DE ANALYTICS
// ==========================================

// Obtener estadísticas de salidas por categoría
export async function getSalidasCategoryAnalyticsAction(startDate?: Date, endDate?: Date) {
    return await getSalidasCategoryAnalytics(startDate, endDate);
}

// Obtener estadísticas de salidas por tipo
export async function getSalidasTypeAnalyticsAction(startDate?: Date, endDate?: Date) {
    return await getSalidasTypeAnalytics(startDate, endDate);
}

// Obtener estadísticas de salidas por mes
export async function getSalidasMonthlyAnalyticsAction(categoriaId?: string, startDate?: Date, endDate?: Date) {
    return await getSalidasMonthlyAnalytics(categoriaId, startDate, endDate);
}

// Obtener resumen de analytics de salidas
export async function getSalidasOverviewAnalyticsAction(startDate?: Date, endDate?: Date) {
    return await getSalidasOverviewAnalytics(startDate, endDate);
}

// Obtener desglose detallado de salidas por categoría
export async function getSalidasDetailsByCategoryAction(categoriaId: string, startDate?: Date, endDate?: Date) {
    return await getSalidasDetailsByCategory(categoriaId, startDate, endDate);
} 