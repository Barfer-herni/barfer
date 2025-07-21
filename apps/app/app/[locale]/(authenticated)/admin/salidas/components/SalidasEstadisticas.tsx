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
import { ChartBar, PieChart as PieChartIcon, TrendingUp, Filter } from 'lucide-react';
import {
    getSalidasCategoryAnalyticsAction,
    getSalidasTypeAnalyticsAction,
    getSalidasMonthlyAnalyticsAction,
    getSalidasOverviewAnalyticsAction,
    getAllCategoriasAction
} from '../actions';
import {
    type SalidaCategoryStats,
    type SalidaTipoStats,
    type SalidaMonthlyStats,
    type SalidasAnalyticsSummary,
    type CategoriaData
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

    // Cargar datos
    useEffect(() => {
        loadAllData();
        loadCategories();
    }, []);

    const loadAllData = async () => {
        setIsLoading(true);
        try {
            const [categoryData, typeData, monthlyData, overviewData] = await Promise.all([
                getSalidasCategoryAnalyticsAction(),
                getSalidasTypeAnalyticsAction(),
                getSalidasMonthlyAnalyticsAction(),
                getSalidasOverviewAnalyticsAction()
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
            const categoryId = selectedCategory === 'all' || selectedCategory === '' ? undefined : selectedCategory;
            const data = await getSalidasMonthlyAnalyticsAction(categoryId);
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
            currency: 'ARS'
        }).format(amount);
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

    return (
        <div className="space-y-6">
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
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {categoryStats.map((item, index) => (
                                        <div key={item.categoriaId} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <div className="text-lg font-bold text-muted-foreground">
                                                    #{index + 1}
                                                </div>
                                                <div>
                                                    <p className="font-medium">{item.categoriaNombre}</p>
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