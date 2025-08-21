'use server'

import {
    getRepartosData,
    saveRepartosWeek,
    updateRepartoEntry,
    toggleRepartoCompletion,
    initializeWeek,
    cleanupOldWeeks,
    addRowToDay,
    removeRowFromDay
} from '@repo/data-services';
import { revalidatePath } from 'next/cache';
import type { WeekData, RepartoEntry } from '@repo/data-services';

// Obtener todos los datos de repartos
export async function getRepartosDataAction() {
    try {
        const data = await getRepartosData();
        return { success: true, data };
    } catch (error) {
        console.error('Error getting repartos data:', error);
        return { success: false, error: 'Failed to get repartos data', data: {} };
    }
}

// Guardar una semana completa
export async function saveRepartosWeekAction(weekKey: string, weekData: WeekData) {
    try {
        const result = await saveRepartosWeek(weekKey, weekData);

        if (result) {
            revalidatePath('/admin/repartos');
            return { success: true, message: 'Week saved successfully' };
        } else {
            return { success: false, error: 'Failed to save week' };
        }
    } catch (error) {
        console.error('Error saving repartos week:', error);
        return { success: false, error: 'Internal server error' };
    }
}

// Actualizar una entrada específica
export async function updateRepartoEntryAction(
    weekKey: string,
    dayKey: string,
    rowIndex: number,
    entry: Partial<RepartoEntry>
) {
    try {
        const result = await updateRepartoEntry(weekKey, dayKey, rowIndex, entry);

        if (result) {
            revalidatePath('/admin/repartos');
            return { success: true, message: 'Entry updated successfully' };
        } else {
            return { success: false, error: 'Failed to update entry' };
        }
    } catch (error) {
        console.error('Error updating reparto entry:', error);
        return { success: false, error: 'Internal server error' };
    }
}

// Toggle completado de una entrada
export async function toggleRepartoCompletionAction(
    weekKey: string,
    dayKey: string,
    rowIndex: number
) {
    try {
        const result = await toggleRepartoCompletion(weekKey, dayKey, rowIndex);

        if (result) {
            revalidatePath('/admin/repartos');
            return { success: true, message: 'Completion status toggled successfully' };
        } else {
            return { success: false, error: 'Failed to toggle completion status' };
        }
    } catch (error) {
        console.error('Error toggling reparto completion:', error);
        return { success: false, error: 'Internal server error' };
    }
}

// Inicializar una semana vacía
export async function initializeWeekAction(weekKey: string) {
    try {
        const result = await initializeWeek(weekKey);

        if (result) {
            revalidatePath('/admin/repartos');
            return { success: true, message: 'Week initialized successfully' };
        } else {
            return { success: false, error: 'Failed to initialize week' };
        }
    } catch (error) {
        console.error('Error initializing week:', error);
        return { success: false, error: 'Internal server error' };
    }
}

// Limpiar semanas antiguas
export async function cleanupOldWeeksAction() {
    try {
        const deletedCount = await cleanupOldWeeks();

        if (deletedCount > 0) {
            revalidatePath('/admin/repartos');
            return {
                success: true,
                message: `Se limpiaron ${deletedCount} semanas antiguas`,
                deletedCount
            };
        } else {
            return {
                success: true,
                message: 'No hay semanas antiguas para limpiar',
                deletedCount: 0
            };
        }
    } catch (error) {
        console.error('Error cleaning up old weeks:', error);
        return { success: false, error: 'Internal server error' };
    }
}

// Agregar fila a un día
export async function addRowToDayAction(weekKey: string, dayKey: string) {
    try {
        const result = await addRowToDay(weekKey, dayKey);

        if (result) {
            revalidatePath('/admin/repartos');
            return { success: true, message: 'Fila agregada exitosamente' };
        } else {
            return { success: false, error: 'No se pudo agregar la fila' };
        }
    } catch (error) {
        console.error('Error adding row to day:', error);
        return { success: false, error: 'Internal server error' };
    }
}

// Eliminar fila de un día
export async function removeRowFromDayAction(weekKey: string, dayKey: string, rowIndex: number) {
    try {
        const result = await removeRowFromDay(weekKey, dayKey, rowIndex);

        if (result) {
            revalidatePath('/admin/repartos');
            return { success: true, message: 'Fila eliminada exitosamente' };
        } else {
            return { success: false, error: 'No se pudo eliminar la fila' };
        }
    } catch (error) {
        console.error('Error removing row from day:', error);
        return { success: false, error: 'Internal server error' };
    }
}
