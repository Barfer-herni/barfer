import 'server-only';
import { getCollection, ObjectId } from '@repo/database';
import { canViewSalidaCategory, getViewableCategories } from '@repo/auth/server-permissions';

// ==========================================
// TIPOS PARA ANALYTICS DE SALIDAS (MongoDB)
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
// SERVICIOS DE ANALYTICS (MongoDB)
// ==========================================

/**
 * Obtiene estadísticas de salidas por categoría para gráfico de torta (MongoDB)
 */
export async function getSalidasCategoryAnalyticsMongo(
    startDate?: Date,
    endDate?: Date
): Promise<SalidaCategoryStats[]> {
    try {
        const salidasCollection = await getCollection('salidas');
        const categoriasCollection = await getCollection('categorias');

        // 1. Obtener categorías visibles según permisos
        const viewableCategories = await getViewableCategories();

        // 2. Construir filtro de fecha
        const matchStage: any = {};
        if (startDate || endDate) {
            matchStage.fechaFactura = {};
            if (startDate) matchStage.fechaFactura.$gte = startDate;
            if (endDate) matchStage.fechaFactura.$lte = endDate;
        }

        // 3. Pipeline de agregación
        const pipeline: any[] = [
            // Filtrar por fechas si existen
            ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),

            // Lookup de categoría
            {
                $lookup: {
                    from: 'categorias',
                    localField: 'categoriaId',
                    foreignField: '_id',
                    as: 'categoria'
                }
            },
            {
                $addFields: {
                    categoria: { $arrayElemAt: ['$categoria', 0] }
                }
            },

            // Filtrar por categorías visibles si no es admin
            ...(viewableCategories.includes('*') ? [] : [{
                $match: {
                    'categoria.nombre': { $in: viewableCategories }
                }
            }]),

            // Agrupar por categoría
            {
                $group: {
                    _id: '$categoriaId',
                    categoriaNombre: { $first: '$categoria.nombre' },
                    totalMonto: { $sum: '$monto' },
                    cantidad: { $sum: 1 }
                }
            },

            // Ordenar por monto descendente
            {
                $sort: { totalMonto: -1 }
            }
        ];

        const results = await salidasCollection.aggregate(pipeline).toArray();

        // 4. Calcular total para porcentajes
        const totalMonto = results.reduce((acc, item) => acc + item.totalMonto, 0);

        // 5. Formatear resultados
        const stats: SalidaCategoryStats[] = results.map(item => ({
            categoriaId: item._id.toString(),
            categoriaNombre: item.categoriaNombre || 'Categoría Desconocida',
            totalMonto: item.totalMonto,
            cantidad: item.cantidad,
            porcentaje: totalMonto > 0 ? Math.round((item.totalMonto / totalMonto) * 10000) / 100 : 0
        }));

        return stats;

    } catch (error) {
        console.error('Error in getSalidasCategoryAnalyticsMongo:', error);
        throw error;
    }
}

/**
 * Obtiene estadísticas de salidas ordinarias vs extraordinarias (MongoDB)
 */
export async function getSalidasTypeAnalyticsMongo(
    startDate?: Date,
    endDate?: Date
): Promise<SalidaTipoStats[]> {
    try {
        const salidasCollection = await getCollection('salidas');

        // 1. Obtener categorías visibles según permisos
        const viewableCategories = await getViewableCategories();

        // 2. Construir filtro de fecha
        const matchStage: any = {};
        if (startDate || endDate) {
            matchStage.fechaFactura = {};
            if (startDate) matchStage.fechaFactura.$gte = startDate;
            if (endDate) matchStage.fechaFactura.$lte = endDate;
        }

        // 3. Pipeline de agregación
        const pipeline: any[] = [
            // Filtrar por fechas si existen
            ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),

            // Lookup de categoría para filtrar por permisos
            {
                $lookup: {
                    from: 'categorias',
                    localField: 'categoriaId',
                    foreignField: '_id',
                    as: 'categoria'
                }
            },
            {
                $addFields: {
                    categoria: { $arrayElemAt: ['$categoria', 0] }
                }
            },

            // Filtrar por categorías visibles si no es admin
            ...(viewableCategories.includes('*') ? [] : [{
                $match: {
                    'categoria.nombre': { $in: viewableCategories }
                }
            }]),

            // Agrupar por tipo
            {
                $group: {
                    _id: '$tipo',
                    totalMonto: { $sum: '$monto' },
                    cantidad: { $sum: 1 }
                }
            }
        ];

        const results = await salidasCollection.aggregate(pipeline).toArray();

        // 4. Calcular total para porcentajes
        const totalMonto = results.reduce((acc, item) => acc + item.totalMonto, 0);

        // 5. Formatear resultados
        const stats: SalidaTipoStats[] = results.map(item => ({
            tipo: item._id as 'ORDINARIO' | 'EXTRAORDINARIO',
            totalMonto: item.totalMonto,
            cantidad: item.cantidad,
            porcentaje: totalMonto > 0 ? Math.round((item.totalMonto / totalMonto) * 10000) / 100 : 0
        }));

        return stats;

    } catch (error) {
        console.error('Error in getSalidasTypeAnalyticsMongo:', error);
        throw error;
    }
}

/**
 * Obtiene estadísticas de salidas por mes (MongoDB)
 */
export async function getSalidasMonthlyAnalyticsMongo(
    categoriaId?: string,
    startDate?: Date,
    endDate?: Date
): Promise<SalidaMonthlyStats[]> {
    try {
        const salidasCollection = await getCollection('salidas');

        // 1. Obtener categorías visibles según permisos
        const viewableCategories = await getViewableCategories();

        // 2. Construir filtro
        const matchStage: any = {};

        if (categoriaId) {
            matchStage.categoriaId = new ObjectId(categoriaId);
        }

        if (startDate || endDate) {
            matchStage.fechaFactura = {};
            if (startDate) matchStage.fechaFactura.$gte = startDate;
            if (endDate) matchStage.fechaFactura.$lte = endDate;
        }

        // 3. Pipeline de agregación
        const pipeline: any[] = [
            // Filtrar por condiciones básicas
            ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),

            // Lookup de categoría
            {
                $lookup: {
                    from: 'categorias',
                    localField: 'categoriaId',
                    foreignField: '_id',
                    as: 'categoria'
                }
            },
            {
                $addFields: {
                    categoria: { $arrayElemAt: ['$categoria', 0] }
                }
            },

            // Filtrar por categorías visibles si no es admin
            ...(viewableCategories.includes('*') ? [] : [{
                $match: {
                    'categoria.nombre': { $in: viewableCategories }
                }
            }]),

            // Ordenar por fecha
            {
                $sort: { fechaFactura: 1 }
            }
        ];

        const salidas = await salidasCollection.aggregate(pipeline).toArray();

        // 4. Agrupar por mes manualmente
        const monthNames = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];

        const monthlyData: Record<string, SalidaMonthlyStats> = {};

        salidas.forEach(salida => {
            const date = new Date(salida.fechaFactura);
            const year = date.getFullYear();
            const month = date.getMonth() + 1;
            const key = `${year}-${month}`;

            if (!monthlyData[key]) {
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

        // 5. Convertir a array y ordenar por fecha
        const result = Object.values(monthlyData).sort((a, b) => {
            if (a.year !== b.year) return a.year - b.year;
            return a.month - b.month;
        });

        return result;

    } catch (error) {
        console.error('Error in getSalidasMonthlyAnalyticsMongo:', error);
        throw error;
    }
}

/**
 * Obtiene resumen general de salidas (MongoDB)
 */
export async function getSalidasOverviewAnalyticsMongo(
    startDate?: Date,
    endDate?: Date
): Promise<SalidasAnalyticsSummary> {
    try {
        const salidasCollection = await getCollection('salidas');

        // 1. Obtener categorías visibles según permisos
        const viewableCategories = await getViewableCategories();

        // 2. Construir filtro de fecha
        const matchStage: any = {};
        if (startDate || endDate) {
            matchStage.fechaFactura = {};
            if (startDate) matchStage.fechaFactura.$gte = startDate;
            if (endDate) matchStage.fechaFactura.$lte = endDate;
        }

        // 3. Pipeline de agregación
        const pipeline: any[] = [
            // Filtrar por fechas si existen
            ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),

            // Lookup de categoría
            {
                $lookup: {
                    from: 'categorias',
                    localField: 'categoriaId',
                    foreignField: '_id',
                    as: 'categoria'
                }
            },
            {
                $addFields: {
                    categoria: { $arrayElemAt: ['$categoria', 0] }
                }
            },

            // Filtrar por categorías visibles si no es admin
            ...(viewableCategories.includes('*') ? [] : [{
                $match: {
                    'categoria.nombre': { $in: viewableCategories }
                }
            }])
        ];

        const salidas = await salidasCollection.aggregate(pipeline).toArray();

        // 4. Calcular estadísticas
        const totalSalidas = salidas.length;
        const totalMonto = salidas.reduce((sum, s) => sum + s.monto, 0);

        const salidasOrdinarias = salidas.filter(s => s.tipo === 'ORDINARIO').length;
        const salidasExtraordinarias = salidas.filter(s => s.tipo === 'EXTRAORDINARIO').length;
        const montoOrdinario = salidas.filter(s => s.tipo === 'ORDINARIO').reduce((sum, s) => sum + s.monto, 0);
        const montoExtraordinario = salidas.filter(s => s.tipo === 'EXTRAORDINARIO').reduce((sum, s) => sum + s.monto, 0);

        const salidasBlancas = salidas.filter(s => s.tipoRegistro === 'BLANCO').length;
        const salidasNegras = salidas.filter(s => s.tipoRegistro === 'NEGRO').length;
        const montoBlanco = salidas.filter(s => s.tipoRegistro === 'BLANCO').reduce((sum, s) => sum + s.monto, 0);
        const montoNegro = salidas.filter(s => s.tipoRegistro === 'NEGRO').reduce((sum, s) => sum + s.monto, 0);

        // 5. Calcular promedios y porcentajes
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
                    porcentaje: Math.round(porcentajeOrdinarias * 100) / 100
                },
                extraordinario: {
                    monto: montoExtraordinario,
                    cantidad: salidasExtraordinarias,
                    porcentaje: Math.round(porcentajeExtraordinarias * 100) / 100
                }
            },
            blancoVsNegro: {
                blanco: {
                    monto: montoBlanco,
                    cantidad: salidasBlancas,
                    porcentaje: Math.round(porcentajeBlancas * 100) / 100
                },
                negro: {
                    monto: montoNegro,
                    cantidad: salidasNegras,
                    porcentaje: Math.round(porcentajeNegras * 100) / 100
                }
            }
        };

    } catch (error) {
        console.error('Error in getSalidasOverviewAnalyticsMongo:', error);
        throw error;
    }
}

