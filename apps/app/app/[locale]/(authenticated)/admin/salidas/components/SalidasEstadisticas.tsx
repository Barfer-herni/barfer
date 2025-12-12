'use client';

import type {
    SalidaCategoryStats,
    SalidaMonthlyStats,
    SalidaTipoStats,
    SalidasAnalyticsSummary,
} from '@repo/data-services';
import { Badge } from '@repo/design-system/components/ui/badge';
import { Button } from '@repo/design-system/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@repo/design-system/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@repo/design-system/components/ui/select';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@repo/design-system/components/ui/tabs';
import {
    Calendar,
    ChartBar,
    Filter,
    PieChart as PieChartIcon,
    TrendingUp,
    X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import {
    getAllCategoriasAction,
    getSalidasCategoryAnalyticsAction,
    getSalidasMonthlyAnalyticsAction,
    getSalidasOverviewAnalyticsAction,
    getSalidasTypeAnalyticsAction,
} from '../actions';

// Tipo para categorías (compatible con MongoDB)
interface CategoriaData {
    _id: string;
    id?: string;
    nombre: string;
}

// Colores para los gráficos
const CHART_COLORS = [
    '#8884d8',
    '#82ca9d',
    '#ffc658',
    '#ff7300',
    '#0088fe',
    '#00c49f',
    '#ffbb28',
    '#ff8042',
    '#8dd1e1',
    '#d084d0',
];

// Nombres de meses
const MONTH_NAMES = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
];

export function SalidasEstadisticas() {
    // Estados para los datos
    const [categoryStats, setCategoryStats] = useState<SalidaCategoryStats[]>([]);
    const [typeStats, setTypeStats] = useState<SalidaTipoStats[]>([]);
    const [monthlyStats, setMonthlyStats] = useState<SalidaMonthlyStats[]>([]);
    const [overviewStats, setOverviewStats] =
        useState<SalidasAnalyticsSummary | null>(null);
    const [availableCategories, setAvailableCategories] = useState<
        CategoriaData[]
    >([]);

    // Estados para filtros
    const [typeFilter, setTypeFilter] = useState<
        'all' | 'ORDINARIO' | 'EXTRAORDINARIO'
    >('all');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [selectedMonth, setSelectedMonth] = useState<string>('all');
    const [selectedYear, setSelectedYear] = useState<string>('all');
    const [isLoading, setIsLoading] = useState(true);

    // Generar años disponibles (últimos 5 años desde el año actual)
    const currentYear = new Date().getFullYear();
    const availableYears = useMemo(() => {
        const years: number[] = [];
        for (let i = 0; i < 5; i++) {
            years.push(currentYear - i);
        }
        return years;
    }, [currentYear]);

    // Calcular fechas de inicio y fin basadas en los filtros
    const getDateRange = useMemo(() => {
        let startDate: Date | undefined;
        let endDate: Date | undefined;

        if (selectedYear !== 'all') {
            const year = Number.parseInt(selectedYear);

            if (selectedMonth !== 'all') {
                // Mes y año específicos
                const month = Number.parseInt(selectedMonth);
                startDate = new Date(year, month - 1, 1);
                endDate = new Date(year, month, 0, 23, 59, 59, 999);
            } else {
                // Solo año
                startDate = new Date(year, 0, 1);
                endDate = new Date(year, 11, 31, 23, 59, 59, 999);
            }
        } else if (selectedMonth !== 'all') {
            // Solo mes (año actual)
            const month = Number.parseInt(selectedMonth);
            startDate = new Date(currentYear, month - 1, 1);
            endDate = new Date(currentYear, month, 0, 23, 59, 59, 999);
        }

        return { startDate, endDate };
    }, [selectedYear, selectedMonth, currentYear]);

    const loadAllData = useCallback(async () => {
        setIsLoading(true);
        try {
            const { startDate, endDate } = getDateRange;

            const [categoryData, typeData, monthlyData, overviewData] =
                await Promise.all([
                    getSalidasCategoryAnalyticsAction(startDate, endDate),
                    getSalidasTypeAnalyticsAction(startDate, endDate),
                    getSalidasMonthlyAnalyticsAction(undefined, startDate, endDate),
                    getSalidasOverviewAnalyticsAction(startDate, endDate),
                ]);

            setCategoryStats(categoryData);
            setTypeStats(typeData);
            setMonthlyStats(monthlyData);
            setOverviewStats(overviewData);
        } finally {
            setIsLoading(false);
        }
    }, [getDateRange]);

    const loadCategories = useCallback(async () => {
        try {
            const response = await getAllCategoriasAction();
            if (response.success && response.categorias) {
                // Adaptar categorías MongoDB al formato esperado
                setAvailableCategories(
                    response.categorias.map((c) => ({
                        ...c,
                        id: c._id,
                    }))
                );
            }
        } catch {
            // Error silenciado intencionalmente
        }
    }, []);

    const loadMonthlyData = useCallback(async () => {
        try {
            const categoryId =
                selectedCategory === 'all' || selectedCategory === ''
                    ? undefined
                    : selectedCategory;
            const { startDate, endDate } = getDateRange;
            const data = await getSalidasMonthlyAnalyticsAction(
                categoryId,
                startDate,
                endDate
            );
            setMonthlyStats(data);
        } catch {
            // Error silenciado intencionalmente
        }
    }, [selectedCategory, getDateRange]);

    // Cargar datos
    useEffect(() => {
        loadAllData();
        loadCategories();
    }, [loadAllData, loadCategories]);

    // Recargar datos mensuales cuando cambien los filtros
    useEffect(() => {
        loadMonthlyData();
    }, [loadMonthlyData]);

    // Formatear datos para gráficos
    const pieChartData = useMemo(() => {
        return categoryStats.map((item, index) => ({
            name: item.categoriaNombre,
            value: item.totalMonto,
            porcentaje: item.porcentaje,
            cantidad: item.cantidad,
            color: CHART_COLORS[index % CHART_COLORS.length],
        }));
    }, [categoryStats]);

    const barChartData = useMemo(() => {
        if (typeFilter === 'all') {
            return typeStats.map((item) => ({
                tipo: item.tipo === 'ORDINARIO' ? 'Ordinario' : 'Extraordinario',
                monto: item.totalMonto,
                cantidad: item.cantidad,
            }));
        }
        const filtered = typeStats.filter((item) => item.tipo === typeFilter);
        return filtered.map((item) => ({
            tipo: item.tipo === 'ORDINARIO' ? 'Ordinario' : 'Extraordinario',
            monto: item.totalMonto,
            cantidad: item.cantidad,
        }));
    }, [typeStats, typeFilter]);

    const monthlyChartData = useMemo(() => {
        return monthlyStats.map((item) => ({
            mes: `${item.monthName} ${item.year}`,
            monto: item.totalMonto,
            cantidad: item.cantidad,
        }));
    }, [monthlyStats]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
        }).format(amount);
    };

    const CustomTooltip = ({
        active,
        payload,
        label,
    }: {
        active?: boolean;
        payload?: Array<{ 
            value: number; 
            payload: { 
                cantidad?: number;
                name?: string;
                porcentaje?: number;
            } 
        }>;
        label?: string;
    }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="rounded border bg-white p-3 shadow-lg">
                    <p className="font-medium text-base">{data.name || label}</p>
                    <p className="text-blue-600">
                        <span className="font-medium">Monto: </span>
                        {formatCurrency(payload[0].value)}
                    </p>
                    {data.porcentaje !== undefined && (
                        <p className="text-purple-600">
                            <span className="font-medium">Porcentaje: </span>
                            {data.porcentaje.toFixed(1)}%
                        </p>
                    )}
                    {data.cantidad && (
                        <p className="text-green-600">
                            <span className="font-medium">Cantidad: </span>
                            {data.cantidad}
                        </p>
                    )}
                </div>
            );
        }
        return null;
    };

    if (isLoading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <div className="text-center">
                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-blue-600 border-b-2" />
                    <p className="mt-2 text-muted-foreground">Cargando estadísticas...</p>
                </div>
            </div>
        );
    }

    // Función para limpiar filtros de fecha
    const clearDateFilters = () => {
        setSelectedMonth('all');
        setSelectedYear('all');
    };

    // Verificar si hay filtros activos
    const hasActiveFilters = selectedMonth !== 'all' || selectedYear !== 'all';

    return (
        <div className="space-y-6">
            {/* Filtros de fecha */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Filtros de Fecha
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap items-end gap-4">
                        {/* Selector de Año */}
                        <div className="min-w-[200px] flex-1">
                            <div className="mb-2 block font-medium text-sm">Año</div>
                            <Select value={selectedYear} onValueChange={setSelectedYear}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar año" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos los años</SelectItem>
                                    {availableYears.map((year) => (
                                        <SelectItem key={year} value={year.toString()}>
                                            {year}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Selector de Mes */}
                        <div className="min-w-[200px] flex-1">
                            <div className="mb-2 block font-medium text-sm">Mes</div>
                            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar mes" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos los meses</SelectItem>
                                    {MONTH_NAMES.map((month, index) => (
                                        <SelectItem key={index + 1} value={(index + 1).toString()}>
                                            {month}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Botón para limpiar filtros */}
                        {hasActiveFilters && (
                            <Button
                                variant="outline"
                                onClick={clearDateFilters}
                                className="flex items-center gap-2"
                            >
                                <X className="h-4 w-4" />
                                Limpiar Filtros
                            </Button>
                        )}
                    </div>

                    {/* Indicador de filtro activo */}
                    {hasActiveFilters && (
                        <div className="mt-4 flex items-center gap-2 text-muted-foreground text-sm">
                            <Filter className="h-4 w-4" />
                            <span>
                                Mostrando datos de:{' '}
                                <span className="font-medium text-foreground">
                                    {selectedMonth !== 'all' &&
                                        MONTH_NAMES[Number.parseInt(selectedMonth) - 1]}
                                    {selectedMonth !== 'all' && selectedYear !== 'all' && ' de '}
                                    {selectedYear !== 'all' && selectedYear}
                                    {selectedMonth === 'all' &&
                                        selectedYear !== 'all' &&
                                        'todo el año'}
                                    {selectedMonth !== 'all' &&
                                        selectedYear === 'all' &&
                                        ` (${currentYear})`}
                                </span>
                            </span>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Resumen general */}
            {overviewStats && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center">
                                <div className="flex-1">
                                    <p className="font-medium text-muted-foreground text-sm">
                                        Gasto Total
                                    </p>
                                    <p className="font-bold text-2xl">
                                        {formatCurrency(overviewStats.totalGasto)}
                                    </p>
                                </div>
                                <TrendingUp className="h-8 w-8 text-red-500" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center">
                                <div className="flex-1">
                                    <p className="font-medium text-muted-foreground text-sm">
                                        Total Salidas
                                    </p>
                                    <p className="font-bold text-2xl">
                                        {overviewStats.totalSalidas}
                                    </p>
                                </div>
                                <ChartBar className="h-8 w-8 text-blue-500" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center">
                                <div className="flex-1">
                                    <p className="font-medium text-muted-foreground text-sm">
                                        Gasto Promedio
                                    </p>
                                    <p className="font-bold text-2xl">
                                        {formatCurrency(overviewStats.gastoPromedio)}
                                    </p>
                                </div>
                                <PieChartIcon className="h-8 w-8 text-green-500" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="space-y-2">
                                <p className="font-medium text-muted-foreground text-sm">
                                    Tipo de Gastos
                                </p>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs">
                                        <span>Ordinarios:</span>
                                        <span className="font-medium">
                                            {overviewStats.ordinarioVsExtraordinario.ordinario.porcentaje.toFixed(
                                                1
                                            )}
                                            %
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span>Extraordinarios:</span>
                                        <span className="font-medium">
                                            {overviewStats.ordinarioVsExtraordinario.extraordinario.porcentaje.toFixed(
                                                1
                                            )}
                                            %
                                        </span>
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
                    {/* Gráfico de torta - Ancho completo */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <PieChartIcon className="h-5 w-5" />
                                Gastos por Categoría
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[800px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieChartData}
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={280}
                                            innerRadius={100}
                                            dataKey="value"
                                            label={({ porcentaje, name }) => {
                                                // Mostrar solo porcentaje si es muy pequeño, o nombre corto + porcentaje
                                                if (porcentaje < 1) {
                                                    return `${porcentaje.toFixed(1)}%`;
                                                }
                                                return `${name}: ${porcentaje.toFixed(1)}%`;
                                            }}
                                            labelLine={true}
                                            paddingAngle={3}
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
                                    <div
                                        key={item.categoriaId}
                                        className="flex items-center justify-between rounded-lg bg-muted/50 p-3"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="font-bold text-lg text-muted-foreground">
                                                #{index + 1}
                                            </div>
                                            <div>
                                                <p className="font-medium">{item.categoriaNombre}</p>
                                                <p className="text-muted-foreground text-sm">
                                                    {item.cantidad} transacciones
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold">
                                                {formatCurrency(item.totalMonto)}
                                            </p>
                                            <Badge variant="secondary" className="text-xs">
                                                {item.porcentaje.toFixed(1)}%
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
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
                                <Select
                                    value={typeFilter}
                                    onValueChange={(value: string) =>
                                        setTypeFilter(
                                            value as 'all' | 'ORDINARIO' | 'EXTRAORDINARIO'
                                        )
                                    }
                                >
                                    <SelectTrigger className="w-48">
                                        <SelectValue placeholder="Filtrar por tipo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Ambos</SelectItem>
                                        <SelectItem value="ORDINARIO">Solo Ordinarios</SelectItem>
                                        <SelectItem value="EXTRAORDINARIO">
                                            Solo Extraordinarios
                                        </SelectItem>
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
                                <Select
                                    value={selectedCategory}
                                    onValueChange={setSelectedCategory}
                                >
                                    <SelectTrigger className="w-64">
                                        <SelectValue placeholder="Filtrar por categoría" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todas las categorías</SelectItem>
                                        {availableCategories.map((categoria) => (
                                            <SelectItem key={categoria._id} value={categoria._id}>
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
