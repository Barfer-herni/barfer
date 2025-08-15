'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/design-system/components/ui/card';
import { Badge } from '@repo/design-system/components/ui/badge';
import { Button } from '@repo/design-system/components/ui/button';
import { Separator } from '@repo/design-system/components/ui/separator';
import { Tag, Filter, Bug } from 'lucide-react';
import { useInitStore } from '../../../../../../../store/initStore';
import { CategoriesChart } from '../charts/CategoriesChart';
import { CategoryProgressChart } from '../charts/CategoryProgressChart';
import type { ProductByTimePeriod } from '@repo/data-services/src/services/barfer';
import { debugBigDogAction } from '../../actions';

interface CategorySale {
    categoryName: string;
    quantity: number;
    revenue: number;
    orders: number;
    uniqueProducts: number;
    avgPrice: number;
    statusFilter: string;
    totalWeight?: number | null;
}

interface ProductProgressData {
    period: string;
    date: string;
    perroQuantity: number;
    perroRevenue: number;
    gatoQuantity: number;
    gatoRevenue: number;
    huesosQuantity: number;
    huesosRevenue: number;
    complementosQuantity: number;
    complementosRevenue: number;
    totalQuantity: number;
    totalRevenue: number;
}

interface CategoriesAnalyticsClientProps {
    allCategories: CategorySale[];
    pendingCategories: CategorySale[];
    confirmedCategories: CategorySale[];
    compareAllCategories?: CategorySale[];
    comparePendingCategories?: CategorySale[];
    compareConfirmedCategories?: CategorySale[];
    progressData: ProductByTimePeriod[];
    compareProgressData?: ProductByTimePeriod[];
    isComparing: boolean;
    dateFilter: { from: Date; to: Date };
    compareFilter?: { from: Date; to: Date };
}

const CATEGORY_KEYS: { [key: string]: { quantity: string; revenue: string } } = {
    'BIG DOG': { quantity: 'bigDogQuantity', revenue: 'bigDogRevenue' },
    Perros: { quantity: 'perroQuantity', revenue: 'perroRevenue' },
    Gatos: { quantity: 'gatoQuantity', revenue: 'gatoRevenue' },
    Huesos: { quantity: 'huesosQuantity', revenue: 'huesosRevenue' },
    Complementos: { quantity: 'complementosQuantity', revenue: 'complementosRevenue' }
};

const filterDataForChart = (data: ProductByTimePeriod[], filter: string) => {
    if (filter === 'all' || !data) {
        return data;
    }

    return data.map(item => {
        const newItem: { [key: string]: any } = { ...item };
        for (const categoryName in CATEGORY_KEYS) {
            const keys = CATEGORY_KEYS[categoryName as keyof typeof CATEGORY_KEYS];
            if (categoryName.toLowerCase() !== filter.toLowerCase()) {
                newItem[keys.quantity] = 0;
                newItem[keys.revenue] = 0;
            }
        }
        return newItem as ProductByTimePeriod;
    });
};

export function CategoriesAnalyticsClient({
    allCategories,
    pendingCategories,
    confirmedCategories,
    compareAllCategories,
    comparePendingCategories,
    compareConfirmedCategories,
    progressData,
    compareProgressData,
    isComparing,
    dateFilter,
    compareFilter
}: CategoriesAnalyticsClientProps) {
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed'>('all');
    const [categoryFilter, setCategoryFilter] = useState('all');

    const allCategoryNames = useMemo(() => {
        const names = new Set<string>();

        // Agregar categorías de los datos reales
        if (allCategories && allCategories.length > 0) {
            allCategories.forEach(category => {
                names.add(category.categoryName);
            });
        }

        // Agregar categorías de CATEGORY_KEYS como respaldo
        for (const key in CATEGORY_KEYS) {
            names.add(key);
        }

        return ['all', ...Array.from(names)];
    }, [allCategories]);

    const filteredProgressData = useMemo(() => {
        return filterDataForChart(progressData, categoryFilter);
    }, [progressData, categoryFilter]);

    const filteredCompareProgressData = useMemo(() => {
        if (!compareProgressData) return undefined;
        return filterDataForChart(compareProgressData, categoryFilter);
    }, [compareProgressData, categoryFilter]);

    // Seleccionar los datos correctos basado en el filtro
    const getCurrentCategories = () => {
        let categories;
        switch (statusFilter) {
            case 'all': categories = allCategories; break;
            case 'pending': categories = pendingCategories; break;
            case 'confirmed': categories = confirmedCategories; break;
            default: categories = allCategories; break;
        }

        // Reordenar por cantidad (descendente)
        const sortedCategories = [...categories].sort((a, b) => b.quantity - a.quantity);
        return sortedCategories;
    };

    const getCompareCategories = () => {
        if (!isComparing) return [];

        let categories;
        switch (statusFilter) {
            case 'all': categories = compareAllCategories || []; break;
            case 'pending': categories = comparePendingCategories || []; break;
            case 'confirmed': categories = compareConfirmedCategories || []; break;
            default: categories = compareAllCategories || []; break;
        }

        return [...categories].sort((a, b) => b.quantity - a.quantity);
    };

    const currentCategories = getCurrentCategories();
    const compareCategories = getCompareCategories();

    // Calcular totales para comparación
    const totals = useMemo(() => {
        const currentTotal = currentCategories.reduce((acc, c) => ({
            quantity: acc.quantity + c.quantity,
            revenue: acc.revenue + c.revenue,
            orders: acc.orders + c.orders,
            uniqueProducts: acc.uniqueProducts + c.uniqueProducts
        }), { quantity: 0, revenue: 0, orders: 0, uniqueProducts: 0 });

        const compareTotal = compareCategories.reduce((acc, c) => ({
            quantity: acc.quantity + c.quantity,
            revenue: acc.revenue + c.revenue,
            orders: acc.orders + c.orders,
            uniqueProducts: acc.uniqueProducts + c.uniqueProducts
        }), { quantity: 0, revenue: 0, orders: 0, uniqueProducts: 0 });

        return { current: currentTotal, compare: compareTotal };
    }, [currentCategories, compareCategories]);

    // Función para calcular porcentaje de cambio (de fecha antigua a reciente)
    const calculateChange = (primaryValue: number, compareValue: number, primaryDate: Date, compareDate: Date) => {
        // Determinar cuál es el período anterior y cuál el actual basándose en fechas
        const isPrimaryNewer = primaryDate > compareDate;
        const oldValue = isPrimaryNewer ? compareValue : primaryValue;
        const newValue = isPrimaryNewer ? primaryValue : compareValue;

        if (oldValue === 0) return newValue > 0 ? 100 : 0;
        return ((newValue - oldValue) / oldValue) * 100;
    };

    const formatChange = (change: number) => {
        const isPositive = change >= 0;
        return (
            <span className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {isPositive ? '+' : ''}{change.toFixed(1)}%
            </span>
        );
    };

    const formatDateRange = (from: Date, to: Date) => {
        return `${from.toLocaleDateString('es-ES')} - ${to.toLocaleDateString('es-ES')}`;
    };

    // Determinar cuál período es más reciente para las etiquetas
    const isPrimaryNewer = dateFilter && compareFilter ? dateFilter.from > compareFilter.from : true;
    const newerLabel = isPrimaryNewer ? 'Principal' : 'Comparación';
    const olderLabel = isPrimaryNewer ? 'Comparación' : 'Principal';

    // Obtener estadísticas del filtro actual
    const getFilterStats = () => {
        const total = currentCategories.length;
        const totalQuantity = currentCategories.reduce((sum, c) => sum + c.quantity, 0);
        const totalRevenue = currentCategories.reduce((sum, c) => sum + c.revenue, 0);
        const totalWeight = currentCategories.reduce((sum, c) => sum + (c.totalWeight || 0), 0);
        return { total, totalQuantity, totalRevenue, totalWeight };
    };

    const stats = getFilterStats();

    const getFilterLabel = (filter: string) => {
        switch (filter) {
            case 'all': return 'Todas';
            case 'pending': return 'Pendientes';
            case 'confirmed': return 'Confirmadas';
            default: return 'Todas';
        }
    };

    const getFilterColor = (filter: string) => {
        switch (filter) {
            case 'all': return 'text-blue-600';
            case 'pending': return 'text-orange-600';
            case 'confirmed': return 'text-green-600';
            default: return 'text-blue-600';
        }
    };

    const getCategoryIcon = (category: string) => {
        const upperCategory = category.toUpperCase();

        // Iconos para categorías específicas de perro
        if (upperCategory === 'PERRO POLLO') return '🐶🍗';
        if (upperCategory === 'PERRO VACA') return '🐶🥩';
        if (upperCategory === 'PERRO CERDO') return '🐶🥓';
        if (upperCategory === 'PERRO CORDERO') return '🐶🐑';
        if (upperCategory === 'PERRO OTROS') return '🐶';

        // Iconos para categorías específicas de gato
        if (upperCategory === 'GATO POLLO') return '🐱🍗';
        if (upperCategory === 'GATO VACA') return '🐱🥩';
        if (upperCategory === 'GATO CORDERO') return '🐱🐑';
        if (upperCategory === 'GATO OTROS') return '🐱';

        // Iconos para productos especiales
        if (upperCategory === 'HUESOS CARNOSOS') return '🦴';
        if (upperCategory === 'COMPLEMENTOS') return '🔧';
        if (upperCategory === 'BIG DOG') return '📦';
        if (upperCategory === 'OTROS') return '📋';

        // Icono por defecto
        return '📋';
    };

    // Determinar el tipo de período basado en el rango de fechas
    const getPeriodType = (): 'daily' | 'weekly' | 'monthly' => {
        if (!dateFilter) return 'daily';

        const diffTime = Math.abs(dateFilter.to.getTime() - dateFilter.from.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays <= 31) return 'daily';      // Hasta un mes: por días
        if (diffDays <= 90) return 'weekly';     // Hasta 3 meses: por semanas
        return 'monthly';                        // Más de 3 meses: por meses
    };

    return (
        <div className="space-y-4" key={`categories-filter-${statusFilter}`}>
            {/* Botón de debug temporal */}
            <div className="flex justify-end">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                        const result = await debugBigDogAction();
                        console.log('Debug result:', result);
                        alert(result.message);
                    }}
                    className="flex items-center gap-2"
                >
                    <Bug className="h-4 w-4" />
                    Debug BIG DOG
                </Button>
            </div>

            {/* Resumen de comparación */}
            {isComparing && (
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">Resumen - Unidades Vendidas</CardTitle>
                            {dateFilter && (
                                <p className="text-xs text-muted-foreground">
                                    {newerLabel}: {formatDateRange(dateFilter.from, dateFilter.to)}
                                    {compareFilter && (
                                        <><br />{olderLabel}: {formatDateRange(compareFilter.from, compareFilter.to)}</>
                                    )}
                                </p>
                            )}
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">{olderLabel} (anterior):</span>
                                    <span className="font-medium">{(isPrimaryNewer ? totals.compare.quantity : totals.current.quantity).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">{newerLabel} (más reciente):</span>
                                    <span className="font-medium">{(isPrimaryNewer ? totals.current.quantity : totals.compare.quantity).toLocaleString()}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium">Cambio:</span>
                                    {formatChange(calculateChange(totals.current.quantity, totals.compare.quantity, dateFilter?.from || new Date(), compareFilter?.from || new Date()))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">Resumen - Ingresos</CardTitle>
                            {dateFilter && (
                                <p className="text-xs text-muted-foreground">
                                    {newerLabel}: {formatDateRange(dateFilter.from, dateFilter.to)}
                                    {compareFilter && (
                                        <><br />{olderLabel}: {formatDateRange(compareFilter.from, compareFilter.to)}</>
                                    )}
                                </p>
                            )}
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">{olderLabel} (anterior):</span>
                                    <span className="font-medium">${(isPrimaryNewer ? totals.compare.revenue : totals.current.revenue).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">{newerLabel} (más reciente):</span>
                                    <span className="font-medium">${(isPrimaryNewer ? totals.current.revenue : totals.compare.revenue).toLocaleString()}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium">Cambio:</span>
                                    {formatChange(calculateChange(totals.current.revenue, totals.compare.revenue, dateFilter?.from || new Date(), compareFilter?.from || new Date()))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">Resumen - Órdenes</CardTitle>
                            {dateFilter && (
                                <p className="text-xs text-muted-foreground">
                                    {newerLabel}: {formatDateRange(dateFilter.from, dateFilter.to)}
                                    {compareFilter && (
                                        <><br />{olderLabel}: {formatDateRange(compareFilter.from, compareFilter.to)}</>
                                    )}
                                </p>
                            )}
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">{olderLabel} (anterior):</span>
                                    <span className="font-medium">{(isPrimaryNewer ? totals.compare.orders : totals.current.orders).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">{newerLabel} (más reciente):</span>
                                    <span className="font-medium">{(isPrimaryNewer ? totals.current.orders : totals.compare.orders).toLocaleString()}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium">Cambio:</span>
                                    {formatChange(calculateChange(totals.current.orders, totals.compare.orders, dateFilter?.from || new Date(), compareFilter?.from || new Date()))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Filtro de estado */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        Filtra categorías por estado de órdenes
                    </CardTitle>
                    <CardDescription>
                        Filtra categorías por estado de órdenes
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row flex-wrap gap-2">
                        <Button
                            variant={statusFilter === 'all' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setStatusFilter('all')}
                            className="w-full sm:w-auto"
                        >
                            Todas las órdenes
                        </Button>
                        <Button
                            variant={statusFilter === 'pending' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setStatusFilter('pending')}
                            className="w-full sm:w-auto"
                        >
                            Solo pendientes
                        </Button>
                        <Button
                            variant={statusFilter === 'confirmed' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setStatusFilter('confirmed')}
                            className="w-full sm:w-auto"
                        >
                            Solo confirmadas
                        </Button>
                    </div>
                    <div className={`mt-3 text-xs sm:text-sm font-medium ${getFilterColor(statusFilter)} break-words`}>
                        Mostrando: {stats.total} categorías • {stats.totalQuantity.toLocaleString()} unidades • ${stats.totalRevenue.toLocaleString()} • {stats.totalWeight.toLocaleString()} kg
                    </div>
                </CardContent>
            </Card>

            {/* Lista de categorías */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Tag className="h-5 w-5" />
                        Ventas por categoría {isComparing ? `(${newerLabel})` : ''}
                    </CardTitle>
                    <CardDescription>
                        {dateFilter && `${formatDateRange(dateFilter.from, dateFilter.to)} • `}
                        Rendimiento por categorías ({getFilterLabel(statusFilter)}) • {currentCategories.length} resultados
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {currentCategories.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">
                            <Tag className="h-8 w-8 mx-auto mb-2" />
                            <p>No hay categorías con el filtro seleccionado</p>
                        </div>
                    ) : (
                        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                            {currentCategories.map((category, index) => (
                                <div key={`current-${statusFilter}-${category.categoryName}-${index}`} className="p-4 border rounded-lg">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className="text-lg flex-shrink-0">{getCategoryIcon(category.categoryName)}</span>
                                            <h3 className="font-medium truncate">{category.categoryName}</h3>
                                        </div>
                                        <Badge variant="outline" className="text-xs flex-shrink-0">
                                            #{index + 1}
                                        </Badge>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs sm:text-sm text-muted-foreground">Productos únicos</span>
                                            <span className="font-medium text-sm">{category.uniqueProducts}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs sm:text-sm text-muted-foreground">Unidades vendidas</span>
                                            <span className={`font-medium text-sm ${getFilterColor(statusFilter)}`}>
                                                {category.quantity}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs sm:text-sm text-muted-foreground">Órdenes</span>
                                            <span className="font-medium text-sm">{category.orders}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs sm:text-sm text-muted-foreground">Ingresos totales</span>
                                            <span className="font-bold text-sm text-green-600">
                                                ${category.revenue.toLocaleString()}
                                            </span>
                                        </div>
                                        {category.totalWeight && (
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs sm:text-sm text-muted-foreground">Kilogramos totales</span>
                                                <span className="font-bold text-sm text-blue-600">
                                                    {category.totalWeight.toLocaleString()} kg
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs sm:text-sm text-muted-foreground">Precio promedio</span>
                                            <span className="font-medium text-sm">
                                                ${category.avgPrice.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Lista de categorías de comparación */}
            {isComparing && compareCategories.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Tag className="h-5 w-5" />
                            Ventas por categoría ({olderLabel})
                        </CardTitle>
                        <CardDescription>
                            {compareFilter && `${formatDateRange(compareFilter.from, compareFilter.to)} • `}
                            Rendimiento por categorías del período de comparación ({getFilterLabel(statusFilter)}) • {compareCategories.length} resultados
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                            {compareCategories.map((category, index) => (
                                <div key={`compare-${statusFilter}-${category.categoryName}-${index}`} className="p-4 border rounded-lg">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className="text-lg flex-shrink-0">{getCategoryIcon(category.categoryName)}</span>
                                            <h3 className="font-medium truncate">{category.categoryName}</h3>
                                        </div>
                                        <Badge variant="outline" className="text-xs flex-shrink-0">
                                            #{index + 1}
                                        </Badge>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs sm:text-sm text-muted-foreground">Productos únicos</span>
                                            <span className="font-medium text-sm">{category.uniqueProducts}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs sm:text-sm text-muted-foreground">Unidades vendidas</span>
                                            <span className="font-medium text-sm text-blue-600">
                                                {category.quantity}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs sm:text-sm text-muted-foreground">Órdenes</span>
                                            <span className="font-medium text-sm">{category.orders}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs sm:text-sm text-muted-foreground">Ingresos totales</span>
                                            <span className="font-bold text-sm text-blue-600">
                                                ${category.revenue.toLocaleString()}
                                            </span>
                                        </div>
                                        {category.totalWeight && (
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs sm:text-sm text-muted-foreground">Kilogramos totales</span>
                                                <span className="font-bold text-sm text-blue-600">
                                                    {category.totalWeight.toLocaleString()} kg
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs sm:text-sm text-muted-foreground">Precio promedio</span>
                                            <span className="font-medium text-sm">
                                                ${category.avgPrice.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Gráficos */}
            <CategoriesChart
                currentCategories={currentCategories}
                compareCategories={compareCategories}
                isComparing={isComparing}
                statusFilter={statusFilter}
                dateFilter={dateFilter}
                compareFilter={compareFilter}
            />

            <Card>
                <CardHeader>
                    <CardTitle>Análisis de Evolución por Categoría</CardTitle>
                    <CardDescription>Selecciona una categoría para filtrar los gráficos de evolución.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-2 mb-4">
                        {allCategoryNames.map(category => (
                            <Button
                                key={category}
                                variant={categoryFilter === category ? 'default' : 'outline'}
                                onClick={() => setCategoryFilter(category)}
                                className="capitalize"
                            >
                                {category === 'all' ? 'Todas las Categorías' : category}
                            </Button>
                        ))}
                    </div>
                    {isComparing ? (
                        <div className="space-y-8">
                            {filteredCompareProgressData && filteredCompareProgressData.length > 0 && (
                                <div>
                                    <div className="mb-4">
                                        <h3 className="text-xl font-bold">{`Evolución Período de Comparación (${olderLabel})`}</h3>
                                        <p className="text-muted-foreground">
                                            {compareFilter && formatDateRange(compareFilter.from, compareFilter.to)}
                                        </p>
                                    </div>
                                    <CategoryProgressChart
                                        data={filteredCompareProgressData}
                                        isComparing={false}
                                        dateFilter={compareFilter}
                                    />
                                </div>
                            )}

                            {filteredCompareProgressData && filteredCompareProgressData.length > 0 && filteredProgressData && filteredProgressData.length > 0 && (
                                <Separator />
                            )}

                            {filteredProgressData && filteredProgressData.length > 0 && (
                                <div>
                                    <div className="mb-4">
                                        <h3 className="text-xl font-bold">{`Evolución Período Principal (${newerLabel})`}</h3>
                                        <p className="text-muted-foreground">
                                            {dateFilter && formatDateRange(dateFilter.from, dateFilter.to)}
                                        </p>
                                    </div>
                                    <CategoryProgressChart
                                        data={filteredProgressData}
                                        isComparing={false}
                                        dateFilter={dateFilter}
                                    />
                                </div>
                            )}
                        </div>
                    ) : (
                        progressData.length > 0 && (
                            <CategoryProgressChart
                                data={filteredProgressData}
                                isComparing={false}
                                dateFilter={dateFilter}
                            />
                        )
                    )}
                </CardContent>
            </Card>
        </div>
    );
} 