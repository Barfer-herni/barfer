import { database } from '@repo/database';
import type { TipoSalida, TipoRegistro } from '@repo/database';

// Tipos para el servicio
export interface SalidaData {
    id: string;
    fecha: Date;
    detalle: string;
    tipo: TipoSalida;
    marca?: string | null;
    monto: number;
    tipoRegistro: TipoRegistro;
    categoriaId: string;
    metodoPagoId: string;
    // Datos relacionados
    categoria: {
        id: string;
        nombre: string;
    };
    metodoPago: {
        id: string;
        nombre: string;
    };
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateSalidaInput {
    fecha: Date;
    detalle: string;
    categoriaId: string;
    tipo: TipoSalida;
    marca?: string;
    monto: number;
    metodoPagoId: string;
    tipoRegistro: TipoRegistro;
}

export interface UpdateSalidaInput {
    fecha?: Date;
    detalle?: string;
    categoriaId?: string;
    tipo?: TipoSalida;
    marca?: string;
    monto?: number;
    metodoPagoId?: string;
    tipoRegistro?: TipoRegistro;
}

// Servicios CRUD

/**
 * Obtener todas las salidas ordenadas por fecha (más recientes primero)
 */
export async function getAllSalidas(): Promise<{
    success: boolean;
    salidas?: SalidaData[];
    total?: number;
    message?: string;
    error?: string;
}> {
    try {
        const salidas = await database.salida.findMany({
            include: {
                categoria: {
                    select: {
                        id: true,
                        nombre: true
                    }
                },
                metodoPago: {
                    select: {
                        id: true,
                        nombre: true
                    }
                }
            },
            orderBy: {
                fecha: 'desc'
            }
        });

        return {
            success: true,
            salidas: salidas as SalidaData[],
            total: salidas.length
        };
    } catch (error) {
        console.error('Error in getAllSalidas:', error);
        return {
            success: false,
            message: 'Error al obtener las salidas',
            error: 'GET_ALL_SALIDAS_ERROR'
        };
    }
}

/**
 * Obtener una salida por ID
 */
export async function getSalidaById(id: string): Promise<{
    success: boolean;
    salida?: SalidaData;
    message?: string;
    error?: string;
}> {
    try {
        const salida = await database.salida.findUnique({
            where: { id },
            include: {
                categoria: {
                    select: {
                        id: true,
                        nombre: true
                    }
                },
                metodoPago: {
                    select: {
                        id: true,
                        nombre: true
                    }
                }
            }
        });

        if (!salida) {
            return {
                success: false,
                message: 'Salida no encontrada',
                error: 'SALIDA_NOT_FOUND'
            };
        }

        return {
            success: true,
            salida: salida as SalidaData
        };
    } catch (error) {
        console.error('Error in getSalidaById:', error);
        return {
            success: false,
            message: 'Error al obtener la salida',
            error: 'GET_SALIDA_BY_ID_ERROR'
        };
    }
}

/**
 * Crear una nueva salida
 */
export async function createSalida(data: CreateSalidaInput): Promise<{
    success: boolean;
    salida?: SalidaData;
    message?: string;
    error?: string;
}> {
    try {
        const salida = await database.salida.create({
            data: {
                fecha: data.fecha,
                detalle: data.detalle,
                categoriaId: data.categoriaId,
                tipo: data.tipo,
                marca: data.marca,
                monto: data.monto,
                metodoPagoId: data.metodoPagoId,
                tipoRegistro: data.tipoRegistro
            },
            include: {
                categoria: {
                    select: {
                        id: true,
                        nombre: true
                    }
                },
                metodoPago: {
                    select: {
                        id: true,
                        nombre: true
                    }
                }
            }
        });

        return {
            success: true,
            salida: salida as SalidaData,
            message: 'Salida creada exitosamente'
        };
    } catch (error) {
        console.error('Error in createSalida:', error);
        return {
            success: false,
            message: 'Error al crear la salida',
            error: 'CREATE_SALIDA_ERROR'
        };
    }
}

/**
 * Actualizar una salida existente
 */
export async function updateSalida(id: string, data: UpdateSalidaInput): Promise<{
    success: boolean;
    salida?: SalidaData;
    message?: string;
    error?: string;
}> {
    try {
        const salida = await database.salida.update({
            where: { id },
            data: {
                ...data,
                updatedAt: new Date()
            }
        });

        return {
            success: true,
            salida: salida as SalidaData,
            message: 'Salida actualizada exitosamente'
        };
    } catch (error) {
        console.error('Error in updateSalida:', error);
        return {
            success: false,
            message: 'Error al actualizar la salida',
            error: 'UPDATE_SALIDA_ERROR'
        };
    }
}

/**
 * Eliminar una salida
 */
export async function deleteSalida(id: string): Promise<{
    success: boolean;
    message?: string;
    error?: string;
}> {
    try {
        await database.salida.delete({
            where: { id }
        });

        return {
            success: true,
            message: 'Salida eliminada exitosamente'
        };
    } catch (error) {
        console.error('Error in deleteSalida:', error);
        return {
            success: false,
            message: 'Error al eliminar la salida',
            error: 'DELETE_SALIDA_ERROR'
        };
    }
}

// Servicios de filtrado y búsqueda

/**
 * Obtener salidas por rango de fechas
 */
export async function getSalidasByDateRange(startDate: Date, endDate: Date): Promise<{
    success: boolean;
    salidas?: SalidaData[];
    total?: number;
    message?: string;
    error?: string;
}> {
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
            salidas: salidas as SalidaData[],
            total: salidas.length
        };
    } catch (error) {
        console.error('Error in getSalidasByDateRange:', error);
        return {
            success: false,
            message: 'Error al obtener salidas por rango de fechas',
            error: 'GET_SALIDAS_BY_DATE_RANGE_ERROR'
        };
    }
}

/**
 * Obtener salidas por categoría
 */
export async function getSalidasByCategory(categoria: string): Promise<{
    success: boolean;
    salidas?: SalidaData[];
    total?: number;
    message?: string;
    error?: string;
}> {
    try {
        const salidas = await database.salida.findMany({
            where: {
                categoria: {
                    nombre: {
                        contains: categoria,
                        mode: 'insensitive'
                    }
                }
            },
            include: {
                categoria: {
                    select: {
                        id: true,
                        nombre: true
                    }
                },
                metodoPago: {
                    select: {
                        id: true,
                        nombre: true
                    }
                }
            },
            orderBy: {
                fecha: 'desc'
            }
        });

        return {
            success: true,
            salidas: salidas as SalidaData[],
            total: salidas.length
        };
    } catch (error) {
        console.error('Error in getSalidasByCategory:', error);
        return {
            success: false,
            message: 'Error al obtener salidas por categoría',
            error: 'GET_SALIDAS_BY_CATEGORY_ERROR'
        };
    }
}

/**
 * Obtener salidas por tipo (ORDINARIO/EXTRAORDINARIO)
 */
export async function getSalidasByType(tipo: TipoSalida): Promise<{
    success: boolean;
    salidas?: SalidaData[];
    total?: number;
    message?: string;
    error?: string;
}> {
    try {
        const salidas = await database.salida.findMany({
            where: { tipo },
            orderBy: {
                fecha: 'desc'
            }
        });

        return {
            success: true,
            salidas: salidas as SalidaData[],
            total: salidas.length
        };
    } catch (error) {
        console.error('Error in getSalidasByType:', error);
        return {
            success: false,
            message: 'Error al obtener salidas por tipo',
            error: 'GET_SALIDAS_BY_TYPE_ERROR'
        };
    }
}

/**
 * Obtener estadísticas de salidas por mes
 */
export async function getSalidasStatsByMonth(year: number, month: number): Promise<{
    success: boolean;
    stats?: {
        totalSalidas: number;
        totalMonto: number;
        salidasOrdinarias: number;
        salidasExtraordinarias: number;
        montoOrdinario: number;
        montoExtraordinario: number;
        salidasBlancas: number;
        salidasNegras: number;
        montoBlanco: number;
        montoNegro: number;
    };
    message?: string;
    error?: string;
}> {
    try {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

        const salidas = await database.salida.findMany({
            where: {
                fecha: {
                    gte: startDate,
                    lte: endDate
                }
            }
        });

        const stats = {
            totalSalidas: salidas.length,
            totalMonto: salidas.reduce((sum, s) => sum + s.monto, 0),
            salidasOrdinarias: salidas.filter(s => s.tipo === 'ORDINARIO').length,
            salidasExtraordinarias: salidas.filter(s => s.tipo === 'EXTRAORDINARIO').length,
            montoOrdinario: salidas.filter(s => s.tipo === 'ORDINARIO').reduce((sum, s) => sum + s.monto, 0),
            montoExtraordinario: salidas.filter(s => s.tipo === 'EXTRAORDINARIO').reduce((sum, s) => sum + s.monto, 0),
            salidasBlancas: salidas.filter(s => s.tipoRegistro === 'BLANCO').length,
            salidasNegras: salidas.filter(s => s.tipoRegistro === 'NEGRO').length,
            montoBlanco: salidas.filter(s => s.tipoRegistro === 'BLANCO').reduce((sum, s) => sum + s.monto, 0),
            montoNegro: salidas.filter(s => s.tipoRegistro === 'NEGRO').reduce((sum, s) => sum + s.monto, 0),
        };

        return {
            success: true,
            stats
        };
    } catch (error) {
        console.error('Error in getSalidasStatsByMonth:', error);
        return {
            success: false,
            message: 'Error al obtener estadísticas de salidas',
            error: 'GET_SALIDAS_STATS_BY_MONTH_ERROR'
        };
    }
} 