import 'server-only';
import { database } from '@repo/database';
import { canViewSalidaCategory } from '@repo/auth/server-permissions';

// ==========================================
// TIPOS PARA ANALYTICS DE SALIDAS
// ==========================================

export interface SalidaCategoryStats {
    categoriaId: string;
    categoriaNombre: string;
    totalMonto: number;
    cantidad: number;
    porcentaje: number;
}

export interface SalidaTipoStats {
    tipo: 'ORDINARIO' | 'EXTRAORDINARIO';
    totalMonto: number;
    cantidad: number;
    porcentaje: number;
}

export interface SalidaMonthlyStats {
    year: number;
    month: number;
    monthName: string;
    totalMonto: number;
    cantidad: number;
    categorias: {
        [key: string]: {
            nombre: string;
            monto: number;
            cantidad: number;
        };
    };
}

export interface SalidasAnalyticsSummary {
    totalGasto: number;
    totalSalidas: number;
    gastoPromedio: number;
    ordinarioVsExtraordinario: {
        ordinario: { monto: number; cantidad: number; porcentaje: number };
        extraordinario: { monto: number; cantidad: number; porcentaje: number };
    };
    blancoVsNegro: {
        blanco: { monto: number; cantidad: number; porcentaje: number };
        negro: { monto: number; cantidad: number; porcentaje: number };
    };
}

// ==========================================
// SERVICIOS DE ANALYTICS
// ==========================================

/**
 * Obtiene estadísticas de salidas por categoría para gráfico de torta
 */
export async function getSalidasCategoryAnalytics(startDate?: Date, endDate?: Date): Promise<SalidaCategoryStats[]> {
    try {
        const whereClause: any = {};

        if (startDate || endDate) {
            whereClause.fecha = {};
            if (startDate) whereClause.fecha.gte = startDate;
            if (endDate) whereClause.fecha.lte = endDate;
        }

        // Obtener datos agrupados por categoría
        const result = await database.salida.groupBy({
            by: ['categoriaId'],
            where: whereClause,
            _sum: {
                monto: true
            },
            _count: {
                id: true
            },
            orderBy: {
                _sum: {
                    monto: 'desc'
                }
            }
        });

        // Obtener información de categorías
        const categoriaIds = result.map(item => item.categoriaId);
        const categorias = await database.categoria.findMany({
            where: {
                id: {
                    in: categoriaIds
                }
            }
        });

        // Filtrar categorías según permisos del usuario
        const filteredResult = [];
        for (const item of result) {
            const categoria = categorias.find(cat => cat.id === item.categoriaId);
            if (categoria && await canViewSalidaCategory(categoria.nombre)) {
                filteredResult.push(item);
            }
        }

        // Calcular total para porcentajes (solo de las categorías visibles)
        const totalMonto = filteredResult.reduce((acc, item) => acc + (item._sum.monto || 0), 0);

        // Mapear resultados con información de categorías
        const stats: SalidaCategoryStats[] = filteredResult.map(item => {
            const categoria = categorias.find(cat => cat.id === item.categoriaId);
            const monto = item._sum.monto || 0;
            const cantidad = item._count.id;
            const porcentaje = totalMonto > 0 ? (monto / totalMonto) * 100 : 0;

            return {
                categoriaId: item.categoriaId,
                categoriaNombre: categoria?.nombre || 'Categoría Desconocida',
                totalMonto: monto,
                cantidad,
                porcentaje: Math.round(porcentaje * 100) / 100 // 2 decimales
            };
        });

        return stats;

    } catch (error) {
        console.error('Error fetching salidas by category:', error);
        throw error;
    }
}

/**
 * Obtiene estadísticas de salidas ordinarias vs extraordinarias
 */
export async function getSalidasTypeAnalytics(startDate?: Date, endDate?: Date): Promise<SalidaTipoStats[]> {
    try {
        const whereClause: any = {};

        if (startDate || endDate) {
            whereClause.fecha = {};
            if (startDate) whereClause.fecha.gte = startDate;
            if (endDate) whereClause.fecha.lte = endDate;
        }

        const result = await database.salida.groupBy({
            by: ['tipo'],
            where: whereClause,
            _sum: {
                monto: true
            },
            _count: {
                id: true
            }
        });

        // Calcular total para porcentajes
        const totalMonto = result.reduce((acc, item) => acc + (item._sum.monto || 0), 0);

        const stats: SalidaTipoStats[] = result.map(item => {
            const monto = item._sum.monto || 0;
            const cantidad = item._count.id;
            const porcentaje = totalMonto > 0 ? (monto / totalMonto) * 100 : 0;

            return {
                tipo: item.tipo,
                totalMonto: monto,
                cantidad,
                porcentaje: Math.round(porcentaje * 100) / 100
            };
        });

        return stats;

    } catch (error) {
        console.error('Error fetching ordinary vs extraordinary salidas:', error);
        throw error;
    }
}

/**
 * Obtiene estadísticas de salidas por mes, opcionalmente filtradas por categoría
 */
export async function getSalidasMonthlyAnalytics(
    categoriaId?: string,
    startDate?: Date,
    endDate?: Date
): Promise<SalidaMonthlyStats[]> {
    try {
        // Construir el filtro base
        const whereClause: any = {};

        // Agregar filtro de categoría si se proporciona
        if (categoriaId) {
            whereClause.categoriaId = categoriaId;
        }

        // Agregar filtro de fechas si se proporciona
        if (startDate || endDate) {
            whereClause.fecha = {};
            if (startDate) whereClause.fecha.gte = startDate;
            if (endDate) whereClause.fecha.lte = endDate;
        }

        // Obtener todas las salidas con información de categorías
        const salidas = await database.salida.findMany({
            where: whereClause,
            include: {
                categoria: {
                    select: {
                        id: true,
                        nombre: true
                    }
                }
            },
            orderBy: {
                fecha: 'asc'
            }
        });

        // Filtrar salidas según permisos del usuario
        const filteredSalidas = [];
        for (const salida of salidas) {
            if (await canViewSalidaCategory(salida.categoria.nombre)) {
                filteredSalidas.push(salida);
            }
        }

        // Agrupar por mes
        const monthlyData: Record<string, SalidaMonthlyStats> = {};

        filteredSalidas.forEach(salida => {
            const date = new Date(salida.fecha);
            const year = date.getFullYear();
            const month = date.getMonth() + 1; // getMonth() es 0-indexed
            const key = `${year}-${month}`;

            if (!monthlyData[key]) {
                const monthNames = [
                    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
                ];

                monthlyData[key] = {
                    year,
                    month,
                    monthName: monthNames[month - 1],
                    totalMonto: 0,
                    cantidad: 0,
                    categorias: {}
                };
            }

            const monthData = monthlyData[key];
            monthData.totalMonto += salida.monto;
            monthData.cantidad += 1;

            // Agrupar por categoría dentro del mes
            const categoriaNombre = salida.categoria?.nombre || 'Sin Categoría';
            if (!monthData.categorias[categoriaNombre]) {
                monthData.categorias[categoriaNombre] = {
                    nombre: categoriaNombre,
                    monto: 0,
                    cantidad: 0
                };
            }

            monthData.categorias[categoriaNombre].monto += salida.monto;
            monthData.categorias[categoriaNombre].cantidad += 1;
        });

        // Convertir a array y ordenar por fecha
        const result = Object.values(monthlyData).sort((a, b) => {
            if (a.year !== b.year) return a.year - b.year;
            return a.month - b.month;
        });

        return result;

    } catch (error) {
        console.error('Error fetching salidas by month and category:', error);
        throw error;
    }
}

/**
 * Obtiene resumen general de salidas con filtros de permisos
 */
export async function getSalidasOverviewAnalytics(startDate?: Date, endDate?: Date): Promise<SalidasAnalyticsSummary> {
    try {
        const whereClause: any = {};

        if (startDate || endDate) {
            whereClause.fecha = {};
            if (startDate) whereClause.fecha.gte = startDate;
            if (endDate) whereClause.fecha.lte = endDate;
        }

        // Obtener todas las salidas con información de categorías
        const salidas = await database.salida.findMany({
            where: whereClause,
            include: {
                categoria: {
                    select: {
                        id: true,
                        nombre: true
                    }
                }
            }
        });

        // Filtrar salidas según permisos del usuario
        const filteredSalidas = [];
        for (const salida of salidas) {
            if (await canViewSalidaCategory(salida.categoria.nombre)) {
                filteredSalidas.push(salida);
            }
        }

        // Calcular estadísticas
        const totalSalidas = filteredSalidas.length;
        const totalMonto = filteredSalidas.reduce((sum, salida) => sum + salida.monto, 0);
        const salidasOrdinarias = filteredSalidas.filter(s => s.tipo === 'ORDINARIO').length;
        const salidasExtraordinarias = filteredSalidas.filter(s => s.tipo === 'EXTRAORDINARIO').length;
        const montoOrdinario = filteredSalidas
            .filter(s => s.tipo === 'ORDINARIO')
            .reduce((sum, s) => sum + s.monto, 0);
        const montoExtraordinario = filteredSalidas
            .filter(s => s.tipo === 'EXTRAORDINARIO')
            .reduce((sum, s) => sum + s.monto, 0);
        const salidasBlancas = filteredSalidas.filter(s => s.tipoRegistro === 'BLANCO').length;
        const salidasNegras = filteredSalidas.filter(s => s.tipoRegistro === 'NEGRO').length;
        const montoBlanco = filteredSalidas
            .filter(s => s.tipoRegistro === 'BLANCO')
            .reduce((sum, s) => sum + s.monto, 0);
        const montoNegro = filteredSalidas
            .filter(s => s.tipoRegistro === 'NEGRO')
            .reduce((sum, s) => sum + s.monto, 0);

        // Calcular promedios
        const promedioPorSalida = totalSalidas > 0 ? totalMonto / totalSalidas : 0;
        const porcentajeOrdinarias = totalSalidas > 0 ? (salidasOrdinarias / totalSalidas) * 100 : 0;
        const porcentajeExtraordinarias = totalSalidas > 0 ? (salidasExtraordinarias / totalSalidas) * 100 : 0;
        const porcentajeBlancas = totalSalidas > 0 ? (salidasBlancas / totalSalidas) * 100 : 0;
        const porcentajeNegras = totalSalidas > 0 ? (salidasNegras / totalSalidas) * 100 : 0;

        return {
            totalGasto: totalMonto,
            totalSalidas,
            gastoPromedio: promedioPorSalida,
            ordinarioVsExtraordinario: {
                ordinario: {
                    monto: montoOrdinario,
                    cantidad: salidasOrdinarias,
                    porcentaje: porcentajeOrdinarias
                },
                extraordinario: {
                    monto: montoExtraordinario,
                    cantidad: salidasExtraordinarias,
                    porcentaje: porcentajeExtraordinarias
                }
            },
            blancoVsNegro: {
                blanco: {
                    monto: montoBlanco,
                    cantidad: salidasBlancas,
                    porcentaje: porcentajeBlancas
                },
                negro: {
                    monto: montoNegro,
                    cantidad: salidasNegras,
                    porcentaje: porcentajeNegras
                }
            }
        };

    } catch (error) {
        console.error('Error fetching salidas overview:', error);
        throw error;
    }
} 