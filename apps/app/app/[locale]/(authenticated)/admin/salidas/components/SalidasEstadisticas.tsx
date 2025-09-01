'use client'

import { useState, useEffect, useMemo } from 'react';
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/design-system/components/ui/card';
import { Button } from '@repo/design-system/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/design-system/components/ui/select';
import { Badge } from '@repo/design-system/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/design-system/components/ui/tabs';
import { Input } from '@repo/design-system/components/ui/input';
import { ChartBar, PieChart as PieChartIcon, TrendingUp, Filter, Calendar, CalendarDays } from 'lucide-react';
import {
    getSalidasCategoryAnalyticsAction,
    getSalidasTypeAnalyticsAction,
    getSalidasMonthlyAnalyticsAction,
    getSalidasOverviewAnalyticsAction,
    getAllCategoriasAction,
    getSalidasDetailsByCategoryAction
} from '../actions';
import {
    type SalidaCategoryStats,
    type SalidaTipoStats,
    type SalidaMonthlyStats,
    type SalidasAnalyticsSummary,
    type CategoriaData,
    type SalidaData
} from '@repo/data-services';

interface SalidasEstadisticasProps {
    onRefreshData?: () => void;
}

// Colores para los gráficos
const CHART_COLORS = [
    '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe',
    '#00c49f', '#ffbb28', '#ff8042', '#8dd1e1', '#d084d0'
];

export function SalidasEstadisticas({ onRefreshData }: SalidasEstadisticasProps) {
    // Estados para los datos
    const [categoryStats, setCategoryStats] = useState<SalidaCategoryStats[]>([]);
    const [typeStats, setTypeStats] = useState<SalidaTipoStats[]>([]);
    const [monthlyStats, setMonthlyStats] = useState<SalidaMonthlyStats[]>([]);
    const [overviewStats, setOverviewStats] = useState<SalidasAnalyticsSummary | null>(null);
    const [availableCategories, setAvailableCategories] = useState<CategoriaData[]>([]);

    // Estados para filtros
    const [typeFilter, setTypeFilter] = useState<'all' | 'ORDINARIO' | 'EXTRAORDINARIO'>('all');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [isLoading, setIsLoading] = useState(true);

    // Estados para filtros de fecha
    const [selectedPeriod, setSelectedPeriod] = useState<string>('last30days');
    const [customStartDate, setCustomStartDate] = useState<string>('');
    const [customEndDate, setCustomEndDate] = useState<string>('');

    // Estados para desglose interactivo
    const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);
    const [categoryDetails, setCategoryDetails] = useState<SalidaData[]>([]);
    const [loadingDetails, setLoadingDetails] = useState(false);

    // Funciones para calcular períodos de fecha
    const getPeriodDates = (period: string): { startDate?: Date, endDate?: Date } => {
        const now = new Date();

        // Función helper para crear fecha al inicio del día (00:00:00)
        const startOfDay = (date: Date) => {
            const d = new Date(date);
            d.setHours(0, 0, 0, 0);
            return d;
        };

        // Función helper para crear fecha al final del día (23:59:59)
        const endOfDay = (date: Date) => {
            const d = new Date(date);
            d.setHours(23, 59, 59, 999);
            return d;
        };

        switch (period) {
            case 'today':
                return {
                    startDate: startOfDay(now),
                    endDate: endOfDay(now)
                };
            case 'yesterday':
                const yesterday = new Date(now);
                yesterday.setDate(now.getDate() - 1);
                return {
                    startDate: startOfDay(yesterday),
                    endDate: endOfDay(yesterday)
                };
            case 'last7days':
                const last7Days = new Date(now);
                last7Days.setDate(now.getDate() - 7);
                return {
                    startDate: startOfDay(last7Days),
                    endDate: endOfDay(now)
                };
            case 'last30days':
                const last30Days = new Date(now);
                last30Days.setDate(now.getDate() - 30);
                return {
                    startDate: startOfDay(last30Days),
                    endDate: endOfDay(now)
                };
            case 'thismonth':
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                return {
                    startDate: startOfDay(startOfMonth),
                    endDate: endOfDay(now)
                };
            case 'lastmonth':
                const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
                return {
                    startDate: startOfDay(startOfLastMonth),
                    endDate: endOfDay(endOfLastMonth)
                };
            case 'last3months':
                const last3Months = new Date(now);
                last3Months.setMonth(now.getMonth() - 3);
                return {
                    startDate: startOfDay(last3Months),
                    endDate: endOfDay(now)
                };
            case 'thisyear':
                const startOfYear = new Date(now.getFullYear(), 0, 1);
                return {
                    startDate: startOfDay(startOfYear),
                    endDate: endOfDay(now)
                };
            case 'custom':
                if (customStartDate && customEndDate) {
                    return {
                        startDate: startOfDay(new Date(customStartDate)),
                        endDate: endOfDay(new Date(customEndDate))
                    };
                } else if (customStartDate) {
                    return {
                        startDate: startOfDay(new Date(customStartDate)),
                        endDate: endOfDay(now)
                    };
                } else if (customEndDate) {
                    return {
                        endDate: endOfDay(new Date(customEndDate))
                    };
                }
                return {};
            default:
                return {};
        }
    };

    // Cargar datos
    useEffect(() => {
        loadAllData();
        loadCategories();
    }, []);

    // Recargar datos cuando cambie el período
    useEffect(() => {
        // Limpiar expansión cuando cambie el período
        setExpandedCategoryId(null);
        setCategoryDetails([]);

        if (selectedPeriod !== 'custom') {
            // Para períodos predefinidos, cargar inmediatamente
            loadAllData();
        } else if (selectedPeriod === 'custom' && (customStartDate || customEndDate)) {
            // Para custom, cargar si al menos una fecha está definida
            loadAllData();
        }
    }, [selectedPeriod, customStartDate, customEndDate]);

    const loadAllData = async () => {
        setIsLoading(true);
        try {
            const { startDate, endDate } = getPeriodDates(selectedPeriod);

            const [categoryData, typeData, monthlyData, overviewData] = await Promise.all([
                getSalidasCategoryAnalyticsAction(startDate, endDate),
                getSalidasTypeAnalyticsAction(startDate, endDate),
                getSalidasMonthlyAnalyticsAction(undefined, startDate, endDate),
                getSalidasOverviewAnalyticsAction(startDate, endDate)
            ]);

            setCategoryStats(categoryData);
            setTypeStats(typeData);
            setMonthlyStats(monthlyData);
            setOverviewStats(overviewData);
        } catch (error) {
            console.error('Error loading analytics data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const loadCategories = async () => {
        try {
            const response = await getAllCategoriasAction();
            if (response.success && response.categorias) {
                setAvailableCategories(response.categorias);
            }
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    };

    const loadMonthlyData = async () => {
        try {
            const { startDate, endDate } = getPeriodDates(selectedPeriod);
            const categoryId = selectedCategory === 'all' || selectedCategory === '' ? undefined : selectedCategory;
            const data = await getSalidasMonthlyAnalyticsAction(categoryId, startDate, endDate);
            setMonthlyStats(data);
        } catch (error) {
            console.error('Error loading monthly data:', error);
        }
    };

    useEffect(() => {
        loadMonthlyData();
    }, [selectedCategory]);

    // Formatear datos para gráficos
    const pieChartData = useMemo(() => {
        return categoryStats.map((item, index) => ({
            name: item.categoriaNombre,
            value: item.totalMonto,
            porcentaje: item.porcentaje,
            cantidad: item.cantidad,
            color: CHART_COLORS[index % CHART_COLORS.length]
        }));
    }, [categoryStats]);

    const barChartData = useMemo(() => {
        if (typeFilter === 'all') {
            return typeStats.map(item => ({
                tipo: item.tipo === 'ORDINARIO' ? 'Ordinario' : 'Extraordinario',
                monto: item.totalMonto,
                cantidad: item.cantidad
            }));
        } else {
            const filtered = typeStats.filter(item => item.tipo === typeFilter);
            return filtered.map(item => ({
                tipo: item.tipo === 'ORDINARIO' ? 'Ordinario' : 'Extraordinario',
                monto: item.totalMonto,
                cantidad: item.cantidad
            }));
        }
    }, [typeStats, typeFilter]);

    const monthlyChartData = useMemo(() => {
        return monthlyStats.map(item => ({
            mes: `${item.monthName} ${item.year}`,
            monto: item.totalMonto,
            cantidad: item.cantidad
        }));
    }, [monthlyStats]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(amount);
    };

    // Función para manejar click en categoría
    const handleCategoryClick = async (categoriaId: string) => {
        if (expandedCategoryId === categoriaId) {
            // Si ya está expandida, colapsar
            setExpandedCategoryId(null);
            setCategoryDetails([]);
            return;
        }

        setLoadingDetails(true);
        setExpandedCategoryId(categoriaId);

        try {
            const { startDate, endDate } = getPeriodDates(selectedPeriod);
            const result = await getSalidasDetailsByCategoryAction(categoriaId, startDate, endDate);

            if (result.success && result.salidas) {
                setCategoryDetails(result.salidas);
            } else {
                setCategoryDetails([]);
            }
        } catch (error) {
            console.error('Error obteniendo desglose:', error);
            setCategoryDetails([]);
        } finally {
            setLoadingDetails(false);
        }
    };

    const formatDate = (date: Date | string) => {
        // Asegurar que tenemos un objeto Date válido
        let dateObj: Date;

        if (date instanceof Date) {
            dateObj = date;
        } else if (typeof date === 'string') {
            // Si es un string, parsear la fecha considerando que está en zona horaria local
            // Extraer solo la parte de la fecha (YYYY-MM-DD) para evitar problemas de zona horaria
            const dateOnly = date.split(' ')[0]; // Tomar solo "2025-07-27"
            const [year, month, day] = dateOnly.split('-').map(Number);

            // Crear la fecha usando UTC para evitar problemas de zona horaria
            dateObj = new Date(Date.UTC(year, month - 1, day));

            // Convertir a zona horaria local
            const localYear = dateObj.getFullYear();
            const localMonth = dateObj.getMonth();
            const localDay = dateObj.getDate();
            dateObj = new Date(localYear, localMonth, localDay);
        } else {
            dateObj = new Date(date);
        }

        // Verificar si la fecha es válida
        if (isNaN(dateObj.getTime())) {
            return 'Fecha inválida';
        }

        return new Intl.DateTimeFormat('es-AR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).format(dateObj);
    };

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border rounded shadow-lg">
                    <p className="font-medium">{label}</p>
                    <p className="text-blue-600">
                        <span className="font-medium">Monto: </span>
                        {formatCurrency(payload[0].value)}
                    </p>
                    {payload[0].payload.cantidad && (
                        <p className="text-green-600">
                            <span className="font-medium">Cantidad: </span>
                            {payload[0].payload.cantidad}
                        </p>
                    )}
                </div>
            );
        }
        return null;
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-muted-foreground">Cargando estadísticas...</p>
                </div>
            </div>
        );
    }

    const formatDateForInput = (date: Date) => {
        return date.toISOString().split('T')[0];
    };

    const getPeriodLabel = (period: string) => {
        switch (period) {
            case 'today': return 'Hoy';
            case 'yesterday': return 'Ayer';
            case 'last7days': return 'Últimos 7 días';
            case 'last30days': return 'Últimos 30 días';
            case 'thismonth': return 'Este mes';
            case 'lastmonth': return 'Mes pasado';
            case 'last3months': return 'Últimos 3 meses';
            case 'thisyear': return 'Este año';
            case 'custom': return 'Rango personalizado';
            default: return 'Período';
        }
    };

    return (
        <div className="space-y-6">
            {/* Panel de filtros de fecha */}
            <Card>
                <CardHeader className="pb-4">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Período de Análisis
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Períodos rápidos */}
                    <div>
                        <label className="text-sm font-medium text-muted-foreground mb-2 block">Períodos rápidos</label>
                        <div className="flex flex-wrap gap-2">
                            {[
                                { value: 'today', label: 'Hoy' },
                                { value: 'yesterday', label: 'Ayer' },
                                { value: 'last7days', label: 'Últimos 7 días' },
                                { value: 'last30days', label: 'Últimos 30 días' },
                                { value: 'thismonth', label: 'Este mes' },
                                { value: 'lastmonth', label: 'Mes pasado' },
                                { value: 'last3months', label: 'Últimos 3 meses' },
                                { value: 'thisyear', label: 'Este año' }
                            ].map((period) => (
                                <Button
                                    key={period.value}
                                    variant={selectedPeriod === period.value ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setSelectedPeriod(period.value)}
                                    className="text-xs"
                                >
                                    {period.label}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Rango personalizado */}
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <label className="text-sm font-medium text-muted-foreground">Rango personalizado</label>
                            <Button
                                variant={selectedPeriod === 'custom' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setSelectedPeriod('custom')}
                                className="text-xs"
                            >
                                <CalendarDays className="h-3 w-3 mr-1" />
                                Personalizado
                            </Button>
                        </div>

                        {selectedPeriod === 'custom' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">Desde</label>
                                    <Input
                                        type="date"
                                        value={customStartDate}
                                        onChange={(e) => setCustomStartDate(e.target.value)}
                                        className="text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">Hasta</label>
                                    <Input
                                        type="date"
                                        value={customEndDate}
                                        onChange={(e) => setCustomEndDate(e.target.value)}
                                        className="text-sm"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Período seleccionado */}
                    <div className="pt-2 border-t">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Período actual:</span>
                            <span className="font-medium">{getPeriodLabel(selectedPeriod)}</span>
                        </div>
                        {(() => {
                            const { startDate, endDate } = getPeriodDates(selectedPeriod);
                            if (startDate || endDate) {
                                return (
                                    <div className="text-xs text-muted-foreground mt-1">
                                        {startDate && `Desde: ${startDate.toLocaleDateString('es-AR')} ${startDate.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`}
                                        {startDate && endDate && ' • '}
                                        {endDate && `Hasta: ${endDate.toLocaleDateString('es-AR')} ${endDate.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`}
                                    </div>
                                );
                            }
                            return null;
                        })()}
                    </div>
                </CardContent>
            </Card>

            {/* Resumen general */}
            {overviewStats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center">
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-muted-foreground">Gasto Total</p>
                                    <p className="text-2xl font-bold">{formatCurrency(overviewStats.totalGasto)}</p>
                                </div>
                                <TrendingUp className="h-8 w-8 text-red-500" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center">
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-muted-foreground">Total Salidas</p>
                                    <p className="text-2xl font-bold">{overviewStats.totalSalidas}</p>
                                </div>
                                <ChartBar className="h-8 w-8 text-blue-500" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center">
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-muted-foreground">Gasto Promedio</p>
                                    <p className="text-2xl font-bold">{formatCurrency(overviewStats.gastoPromedio)}</p>
                                </div>
                                <PieChartIcon className="h-8 w-8 text-green-500" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-muted-foreground">Tipo de Gastos</p>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs">
                                        <span>Ordinarios:</span>
                                        <span className="font-medium">{overviewStats.ordinarioVsExtraordinario.ordinario.porcentaje.toFixed(1)}%</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span>Extraordinarios:</span>
                                        <span className="font-medium">{overviewStats.ordinarioVsExtraordinario.extraordinario.porcentaje.toFixed(1)}%</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Gráficos principales */}
            <Tabs defaultValue="categories" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="categories">Por Categorías</TabsTrigger>
                    <TabsTrigger value="types">Ordinario vs Extraordinario</TabsTrigger>
                    <TabsTrigger value="monthly">Por Mes</TabsTrigger>
                </TabsList>

                {/* Tab 1: Gráfico de torta por categorías */}
                <TabsContent value="categories" className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Gráfico de torta */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <PieChartIcon className="h-5 w-5" />
                                    Gastos por Categoría
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={pieChartData}
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={80}
                                                dataKey="value"
                                                label={({ porcentaje }) => `${porcentaje.toFixed(1)}%`}
                                            >
                                                {pieChartData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip content={<CustomTooltip />} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Ranking de categorías */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Ranking por Categoría</CardTitle>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Haz click en una categoría para ver el desglose detallado de gastos
                                </p>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {categoryStats.map((item, index) => (
                                        <div key={item.categoriaId}>
                                            {/* Fila principal de categoría - clickeable */}
                                            <div
                                                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted/70 transition-colors"
                                                onClick={() => handleCategoryClick(item.categoriaId)}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="text-lg font-bold text-muted-foreground">
                                                        #{index + 1}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium flex items-center gap-2">
                                                            {item.categoriaNombre}
                                                            {expandedCategoryId === item.categoriaId && (
                                                                <span className="text-xs text-blue-600">▼</span>
                                                            )}
                                                        </p>
                                                        <p className="text-sm text-muted-foreground">{item.cantidad} transacciones</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold">{formatCurrency(item.totalMonto)}</p>
                                                    <Badge variant="secondary" className="text-xs">
                                                        {item.porcentaje.toFixed(1)}%
                                                    </Badge>
                                                </div>
                                            </div>

                                            {/* Desglose detallado - solo visible si está expandida */}
                                            {expandedCategoryId === item.categoriaId && (
                                                <div className="ml-4 mt-2 space-y-2">
                                                    {loadingDetails ? (
                                                        <div className="text-center py-4 text-sm text-muted-foreground">
                                                            Cargando desglose...
                                                        </div>
                                                    ) : categoryDetails.length > 0 ? (
                                                        <>
                                                            <div className="text-sm font-medium text-muted-foreground mb-2">
                                                                Detalle de gastos:
                                                            </div>
                                                            {categoryDetails.map((salida, detailIndex) => (
                                                                <div key={salida.id} className="flex items-center justify-between p-2 bg-background border rounded text-sm">
                                                                    <div className="flex-1">
                                                                        <p className="font-medium text-sm">
                                                                            {salida.detalle}
                                                                        </p>
                                                                        <p className="text-xs text-muted-foreground">
                                                                            {formatDate(salida.fecha)} • {salida.metodoPago?.nombre || 'N/A'}
                                                                        </p>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <p className="font-semibold">
                                                                            {formatCurrency(salida.monto)}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                            <div className="text-xs text-muted-foreground pt-2 border-t">
                                                                Total: {categoryDetails.length} gastos • {formatCurrency(categoryDetails.reduce((sum, s) => sum + s.monto, 0))}
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className="text-center py-4 text-sm text-muted-foreground">
                                                            No hay gastos para mostrar en este período
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Tab 2: Ordinario vs Extraordinario */}
                <TabsContent value="types" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <ChartBar className="h-5 w-5" />
                                    Gastos Ordinarios vs Extraordinarios
                                </CardTitle>
                                <Select value={typeFilter} onValueChange={(value: any) => setTypeFilter(value)}>
                                    <SelectTrigger className="w-48">
                                        <SelectValue placeholder="Filtrar por tipo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Ambos</SelectItem>
                                        <SelectItem value="ORDINARIO">Solo Ordinarios</SelectItem>
                                        <SelectItem value="EXTRAORDINARIO">Solo Extraordinarios</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={barChartData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="tipo" />
                                        <YAxis />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend />
                                        <Bar dataKey="monto" fill="#8884d8" name="Monto" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Tab 3: Gastos por mes */}
                <TabsContent value="monthly" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <ChartBar className="h-5 w-5" />
                                    Gastos por Mes
                                </CardTitle>
                                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                    <SelectTrigger className="w-64">
                                        <SelectValue placeholder="Filtrar por categoría" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todas las categorías</SelectItem>
                                        {availableCategories.map(categoria => (
                                            <SelectItem key={categoria.id} value={categoria.id}>
                                                {categoria.nombre}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={monthlyChartData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis
                                            dataKey="mes"
                                            angle={-45}
                                            textAnchor="end"
                                            height={80}
                                        />
                                        <YAxis />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend />
                                        <Bar dataKey="monto" fill="#82ca9d" name="Monto" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
} 