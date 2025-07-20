'use server'

import { database } from '@repo/database';
import { revalidatePath } from 'next/cache';
import { TipoSalida, FormaPago, TipoRegistro } from '@repo/database';

// Tipos para las acciones
interface CreateSalidaData {
    fecha: Date;
    detalle: string;
    categoria: string;
    tipo: TipoSalida;
    marca?: string;
    monto: number;
    formaPago: FormaPago;
    tipoRegistro: TipoRegistro;
}

interface UpdateSalidaData {
    fecha?: Date;
    detalle?: string;
    categoria?: string;
    tipo?: TipoSalida;
    marca?: string;
    monto?: number;
    formaPago?: FormaPago;
    tipoRegistro?: TipoRegistro;
}

// Obtener todas las salidas
export async function getAllSalidasAction() {
    try {
        const salidas = await database.salida.findMany({
            orderBy: {
                fecha: 'desc' // Más recientes primero
            }
        });

        return {
            success: true,
            salidas,
            total: salidas.length
        };
    } catch (error) {
        console.error('Error getting all salidas:', error);
        return {
            success: false,
            message: 'Error al obtener las salidas',
            error: 'GET_ALL_SALIDAS_ACTION_ERROR',
            salidas: [],
            total: 0
        };
    }
}

// Crear una nueva salida
export async function createSalidaAction(data: CreateSalidaData) {
    try {
        const salida = await database.salida.create({
            data: {
                fecha: data.fecha,
                detalle: data.detalle,
                categoria: data.categoria,
                tipo: data.tipo,
                marca: data.marca,
                monto: data.monto,
                formaPago: data.formaPago,
                tipoRegistro: data.tipoRegistro
            }
        });

        revalidatePath('/admin/salidas');

        return {
            success: true,
            salida,
            message: 'Salida creada exitosamente'
        };
    } catch (error) {
        console.error('Error creating salida:', error);
        return {
            success: false,
            message: 'Error al crear la salida',
            error: 'CREATE_SALIDA_ACTION_ERROR'
        };
    }
}

// Actualizar una salida
export async function updateSalidaAction(salidaId: string, data: UpdateSalidaData) {
    try {
        const salida = await database.salida.update({
            where: { id: salidaId },
            data
        });

        revalidatePath('/admin/salidas');

        return {
            success: true,
            salida,
            message: 'Salida actualizada exitosamente'
        };
    } catch (error) {
        console.error('Error updating salida:', error);
        return {
            success: false,
            message: 'Error al actualizar la salida',
            error: 'UPDATE_SALIDA_ACTION_ERROR'
        };
    }
}

// Eliminar una salida
export async function deleteSalidaAction(salidaId: string) {
    try {
        await database.salida.delete({
            where: { id: salidaId }
        });

        revalidatePath('/admin/salidas');

        return {
            success: true,
            message: 'Salida eliminada exitosamente'
        };
    } catch (error) {
        console.error('Error deleting salida:', error);
        return {
            success: false,
            message: 'Error al eliminar la salida',
            error: 'DELETE_SALIDA_ACTION_ERROR'
        };
    }
}

// Obtener salidas por rango de fechas
export async function getSalidasByDateRangeAction(startDate: Date, endDate: Date) {
    try {
        const salidas = await database.salida.findMany({
            where: {
                fecha: {
                    gte: startDate,
                    lte: endDate
                }
            },
            orderBy: {
                fecha: 'desc'
            }
        });

        return {
            success: true,
            salidas,
            total: salidas.length
        };
    } catch (error) {
        console.error('Error getting salidas by date range:', error);
        return {
            success: false,
            message: 'Error al obtener las salidas por rango de fechas',
            error: 'GET_SALIDAS_BY_DATE_RANGE_ACTION_ERROR',
            salidas: [],
            total: 0
        };
    }
}

// Obtener salidas por categoría
export async function getSalidasByCategoryAction(categoria: string) {
    try {
        const salidas = await database.salida.findMany({
            where: {
                categoria: {
                    contains: categoria,
                    mode: 'insensitive'
                }
            },
            orderBy: {
                fecha: 'desc'
            }
        });

        return {
            success: true,
            salidas,
            total: salidas.length
        };
    } catch (error) {
        console.error('Error getting salidas by category:', error);
        return {
            success: false,
            message: 'Error al obtener las salidas por categoría',
            error: 'GET_SALIDAS_BY_CATEGORY_ACTION_ERROR',
            salidas: [],
            total: 0
        };
    }
} 