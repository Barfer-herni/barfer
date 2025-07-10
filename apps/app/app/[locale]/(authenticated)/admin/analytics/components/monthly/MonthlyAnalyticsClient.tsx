'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/design-system/components/ui/card';
import { Badge } from '@repo/design-system/components/ui/badge';
import { ShoppingCart, DollarSign, Users, AlertCircle } from 'lucide-react';
import { Separator } from '@repo/design-system/components/ui/separator';
import { MonthlyChart } from '../charts/MonthlyChart';
import { DeliveryOrdersChart } from '../charts/DeliveryOrdersChart';
import { DeliveryRevenueChart } from '../charts/DeliveryRevenueChart';
import { DeliveryWeightChart } from '../charts/DeliveryWeightChart';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface MonthlyData {
    month: string;
    orders: number;
    uniqueCustomers: number;
    revenue: number;
}

interface MonthlyAnalyticsClientProps {
    allOrdersData: MonthlyData[];   // Todos los pedidos (pending + confirmed)
    compareAllOrdersData?: MonthlyData[];   // Datos de comparación
    isComparing?: boolean; // Si está en modo comparación
    dateFilter?: { from: Date; to: Date }; // Fechas del período principal
    compareFilter?: { from: Date; to: Date }; // Fechas del período de comparación
    deliveryStats: any[]; // Se podría definir un tipo más estricto
    compareDeliveryStats?: any[];
}

export function MonthlyAnalyticsClient({
    allOrdersData,
    compareAllOrdersData,
    isComparing = false,
    dateFilter,
    compareFilter,
    deliveryStats,
    compareDeliveryStats
}: MonthlyAnalyticsClientProps) {
    // Los datos ya vienen filtrados del servidor, solo necesitamos ordenarlos
    const { sortedAllOrders, sortedCompareAllOrders } = useMemo(() => {
        return {
            sortedAllOrders: [...allOrdersData].sort((a, b) => b.month.localeCompare(a.month)),
            sortedCompareAllOrders: compareAllOrdersData ? [...compareAllOrdersData].sort((a, b) => b.month.localeCompare(a.month)) : []
        };
    }, [allOrdersData, compareAllOrdersData]);

    // Calcular totales para comparación
    const totals = useMemo(() => {
        const currentTotal = sortedAllOrders.reduce((acc, month) => ({
            orders: acc.orders + month.orders,
            revenue: acc.revenue + month.revenue,
            uniqueCustomers: acc.uniqueCustomers + month.uniqueCustomers
        }), { orders: 0, revenue: 0, uniqueCustomers: 0 });

        const compareTotal = sortedCompareAllOrders.reduce((acc, month) => ({
            orders: acc.orders + month.orders,
            revenue: acc.revenue + month.revenue,
            uniqueCustomers: acc.uniqueCustomers + month.uniqueCustomers
        }), { orders: 0, revenue: 0, uniqueCustomers: 0 });

        return { current: currentTotal, compare: compareTotal };
    }, [sortedAllOrders, sortedCompareAllOrders]);

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
        if (!from || !to) {
            return 'Período no válido';
        }
        return `${format(from, 'dd/MM/yyyy', { locale: es })} - ${format(to, 'dd/MM/yyyy', { locale: es })}`;
    };

    // Determinar cuál período es más reciente para las etiquetas
    const isPrimaryNewer = dateFilter && compareFilter ? dateFilter.from > compareFilter.from : true;
    const newerLabel = isPrimaryNewer ? 'Principal' : 'Comparación';
    const olderLabel = isPrimaryNewer ? 'Comparación' : 'Principal';

    // Formatear nombre del mes para mostrar
    const formatMonthName = (monthStr: string) => {
        const [year, month] = monthStr.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        return format(date, 'MMMM yyyy', { locale: es });
    };

    return (
        <div className="space-y-4">
            {/* Resumen de comparación */}
            {isComparing && (
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">Resumen - Pedidos</CardTitle>
                            {dateFilter && (
                                <p className="text-xs text-muted-foreground">
                                    Principal: {formatDateRange(dateFilter.from, dateFilter.to)}
                                    {compareFilter && (
                                        <><br />Comparación: {formatDateRange(compareFilter.from, compareFilter.to)}</>
                                    )}
                                </p>
                            )}
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">{olderLabel} (anterior):</span>
                                    <span className="font-medium">{isPrimaryNewer ? totals.compare.orders : totals.current.orders}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">{newerLabel} (más reciente):</span>
                                    <span className="font-medium">{isPrimaryNewer ? totals.current.orders : totals.compare.orders}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium">Cambio:</span>
                                    {formatChange(calculateChange(
                                        totals.current.orders,
                                        totals.compare.orders,
                                        dateFilter?.from || new Date(),
                                        compareFilter?.from || new Date()
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">Resumen - Ingresos</CardTitle>
                            {dateFilter && (
                                <p className="text-xs text-muted-foreground">
                                    Principal: {formatDateRange(dateFilter.from, dateFilter.to)}
                                    {compareFilter && (
                                        <><br />Comparación: {formatDateRange(compareFilter.from, compareFilter.to)}</>
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
                                    {formatChange(calculateChange(
                                        totals.current.revenue,
                                        totals.compare.revenue,
                                        dateFilter?.from || new Date(),
                                        compareFilter?.from || new Date()
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">Resumen - Clientes Únicos</CardTitle>
                            {dateFilter && (
                                <p className="text-xs text-muted-foreground">
                                    Principal: {formatDateRange(dateFilter.from, dateFilter.to)}
                                    {compareFilter && (
                                        <><br />Comparación: {formatDateRange(compareFilter.from, compareFilter.to)}</>
                                    )}
                                </p>
                            )}
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">{olderLabel} (anterior):</span>
                                    <span className="font-medium">{isPrimaryNewer ? totals.compare.uniqueCustomers : totals.current.uniqueCustomers}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">{newerLabel} (más reciente):</span>
                                    <span className="font-medium">{isPrimaryNewer ? totals.current.uniqueCustomers : totals.compare.uniqueCustomers}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium">Cambio:</span>
                                    {formatChange(calculateChange(
                                        totals.current.uniqueCustomers,
                                        totals.compare.uniqueCustomers,
                                        dateFilter?.from || new Date(),
                                        compareFilter?.from || new Date()
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
                {/* Tabla 1: Pedidos mensuales */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ShoppingCart className="h-5 w-5" />
                            Pedidos por mes {isComparing ? `(${newerLabel})` : ''}
                        </CardTitle>
                        <CardDescription>
                            {dateFilter && `${formatDateRange(dateFilter.from, dateFilter.to)} • `}
                            Todos los pedidos e ingresos mensuales
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {sortedAllOrders.length > 0 ? (
                                sortedAllOrders.map((month) => (
                                    <div key={month.month} className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded gap-2">
                                        <span className="text-sm font-medium">{formatMonthName(month.month)}</span>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <Badge variant="secondary">
                                                {month.orders} pedidos
                                            </Badge>
                                            <span className="text-sm text-muted-foreground">
                                                ${month.revenue.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                                    <p>No hay datos para el mes seleccionado</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Tabla 2: Clientes únicos mensuales */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Clientes por mes {isComparing ? `(${newerLabel})` : ''}
                        </CardTitle>
                        <CardDescription>
                            {dateFilter && `${formatDateRange(dateFilter.from, dateFilter.to)} • `}
                            Total de pedidos vs clientes únicos
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {sortedAllOrders.length > 0 ? (
                                sortedAllOrders.map((month) => (
                                    <div key={month.month} className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded gap-2">
                                        <span className="text-sm font-medium">{formatMonthName(month.month)}</span>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <Badge variant="outline" className="flex items-center gap-1">
                                                <ShoppingCart className="h-3 w-3" />
                                                {month.orders} pedidos
                                            </Badge>
                                            <Badge variant="default" className="flex items-center gap-1">
                                                <Users className="h-3 w-3" />
                                                {month.uniqueCustomers} únicos
                                            </Badge>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                                    <p>No hay datos para el mes seleccionado</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Datos de comparación */}
            {isComparing && sortedCompareAllOrders.length > 0 && (
                <div className="grid gap-4 md:grid-cols-2">
                    {/* Tabla 3: Pedidos mensuales - Comparación */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ShoppingCart className="h-5 w-5" />
                                Pedidos por mes ({olderLabel})
                            </CardTitle>
                            <CardDescription>
                                {compareFilter && `${formatDateRange(compareFilter.from, compareFilter.to)} • `}
                                Todos los pedidos e ingresos del período de comparación
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {sortedCompareAllOrders.map((month) => (
                                    <div key={month.month} className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded gap-2">
                                        <span className="text-sm font-medium">{formatMonthName(month.month)}</span>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <Badge variant="outline">
                                                {month.orders} pedidos
                                            </Badge>
                                            <span className="text-sm text-muted-foreground">
                                                ${month.revenue.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tabla 4: Clientes únicos - Comparación */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                Clientes por mes ({olderLabel})
                            </CardTitle>
                            <CardDescription>
                                {compareFilter && `${formatDateRange(compareFilter.from, compareFilter.to)} • `}
                                Total de pedidos vs clientes únicos del período de comparación
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {sortedCompareAllOrders.map((month) => (
                                    <div key={month.month} className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded gap-2">
                                        <span className="text-sm font-medium">{formatMonthName(month.month)}</span>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <Badge variant="outline" className="flex items-center gap-1">
                                                <ShoppingCart className="h-3 w-3" />
                                                {month.orders} pedidos
                                            </Badge>
                                            <Badge variant="outline" className="flex items-center gap-1">
                                                <Users className="h-3 w-3" />
                                                {month.uniqueCustomers} únicos
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Gráficos */}
            <MonthlyChart
                allOrdersData={allOrdersData}
                compareAllOrdersData={compareAllOrdersData}
                isComparing={isComparing}
                dateFilter={dateFilter}
                compareFilter={compareFilter}
            />

            <h3 className="text-2xl font-bold tracking-tight my-4 col-span-1 md:col-span-2">Análisis de Tipos de Entrega (Período Actual)</h3>
            <Card>
                <CardHeader>
                    <CardTitle>Pedidos por Tipo de Entrega</CardTitle>
                    <CardDescription>Cantidad de pedidos de envío en el día vs. reparto normal.</CardDescription>
                </CardHeader>
                <CardContent>
                    <DeliveryOrdersChart data={deliveryStats} />
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Ingresos por Tipo de Entrega</CardTitle>
                    <CardDescription>Ingresos generados por cada tipo de entrega.</CardDescription>
                </CardHeader>
                <CardContent>
                    <DeliveryRevenueChart data={deliveryStats} />
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Peso por Tipo de Entrega</CardTitle>
                    <CardDescription>Peso total en kg por cada tipo de entrega.</CardDescription>
                </CardHeader>
                <CardContent>
                    <DeliveryWeightChart data={deliveryStats} />
                </CardContent>
            </Card>

            {isComparing && compareDeliveryStats && (
                <>
                    <h3 className="text-2xl font-bold tracking-tight my-4 col-span-1 md:col-span-2">Análisis de Tipos de Entrega (Período de Comparación)</h3>
                    <Card>
                        <CardHeader>
                            <CardTitle>Pedidos por Tipo de Entrega</CardTitle>
                            <CardDescription>Comparación de pedidos de envío en el día vs. reparto normal.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <DeliveryOrdersChart data={compareDeliveryStats} />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Ingresos por Tipo de Entrega</CardTitle>
                            <CardDescription>Comparación de ingresos por cada tipo de entrega.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <DeliveryRevenueChart data={compareDeliveryStats} />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Peso por Tipo de Entrega</CardTitle>
                            <CardDescription>Comparación de peso total en kg por cada tipo de entrega.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <DeliveryWeightChart data={compareDeliveryStats} />
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
} 