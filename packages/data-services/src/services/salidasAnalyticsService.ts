import 'server-only';
import { database } from '@repo/database';

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

        // Calcular total para porcentajes
        const totalMonto = result.reduce((acc, item) => acc + (item._sum.monto || 0), 0);

        // Mapear resultados con información de categorías
        const stats: SalidaCategoryStats[] = result.map(item => {
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
        const whereClause: any = {};

        if (categoriaId) {
            whereClause.categoriaId = categoriaId;
        }

        if (startDate || endDate) {
            whereClause.fecha = {};
            if (startDate) whereClause.fecha.gte = startDate;
            if (endDate) whereClause.fecha.lte = endDate;
        }

        // Obtener todas las salidas con información de categoría
        const salidas = await database.salida.findMany({
            where: whereClause,
            include: {
                categoria: true
            },
            orderBy: {
                fecha: 'asc'
            }
        });

        // Agrupar por mes
        const monthlyData: { [key: string]: SalidaMonthlyStats } = {};

        salidas.forEach(salida => {
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
 * Obtiene resumen general de analytics de salidas
 */
export async function getSalidasOverviewAnalytics(startDate?: Date, endDate?: Date): Promise<SalidasAnalyticsSummary> {
    try {
        const whereClause: any = {};

        if (startDate || endDate) {
            whereClause.fecha = {};
            if (startDate) whereClause.fecha.gte = startDate;
            if (endDate) whereClause.fecha.lte = endDate;
        }

        // Estadísticas generales
        const generalStats = await database.salida.aggregate({
            where: whereClause,
            _sum: {
                monto: true
            },
            _count: {
                id: true
            },
            _avg: {
                monto: true
            }
        });

        // Estadísticas por tipo
        const tipoStats = await database.salida.groupBy({
            by: ['tipo'],
            where: whereClause,
            _sum: {
                monto: true
            },
            _count: {
                id: true
            }
        });

        // Estadísticas por tipo de registro
        const registroStats = await database.salida.groupBy({
            by: ['tipoRegistro'],
            where: whereClause,
            _sum: {
                monto: true
            },
            _count: {
                id: true
            }
        });

        const totalMonto = generalStats._sum.monto || 0;
        const totalCount = generalStats._count.id || 0;

        // Procesar datos de tipo
        const ordinarioData = tipoStats.find(item => item.tipo === 'ORDINARIO');
        const extraordinarioData = tipoStats.find(item => item.tipo === 'EXTRAORDINARIO');

        const ordinarioMonto = ordinarioData?._sum.monto || 0;
        const extraordinarioMonto = extraordinarioData?._sum.monto || 0;

        // Procesar datos de registro
        const blancoData = registroStats.find(item => item.tipoRegistro === 'BLANCO');
        const negroData = registroStats.find(item => item.tipoRegistro === 'NEGRO');

        const blancoMonto = blancoData?._sum.monto || 0;
        const negroMonto = negroData?._sum.monto || 0;

        const summary: SalidasAnalyticsSummary = {
            totalGasto: totalMonto,
            totalSalidas: totalCount,
            gastoPromedio: generalStats._avg.monto || 0,
            ordinarioVsExtraordinario: {
                ordinario: {
                    monto: ordinarioMonto,
                    cantidad: ordinarioData?._count.id || 0,
                    porcentaje: totalMonto > 0 ? Math.round((ordinarioMonto / totalMonto) * 10000) / 100 : 0
                },
                extraordinario: {
                    monto: extraordinarioMonto,
                    cantidad: extraordinarioData?._count.id || 0,
                    porcentaje: totalMonto > 0 ? Math.round((extraordinarioMonto / totalMonto) * 10000) / 100 : 0
                }
            },
            blancoVsNegro: {
                blanco: {
                    monto: blancoMonto,
                    cantidad: blancoData?._count.id || 0,
                    porcentaje: totalMonto > 0 ? Math.round((blancoMonto / totalMonto) * 10000) / 100 : 0
                },
                negro: {
                    monto: negroMonto,
                    cantidad: negroData?._count.id || 0,
                    porcentaje: totalMonto > 0 ? Math.round((negroMonto / totalMonto) * 10000) / 100 : 0
                }
            }
        };

        return summary;

    } catch (error) {
        console.error('Error fetching salidas analytics summary:', error);
        throw error;
    }
} 