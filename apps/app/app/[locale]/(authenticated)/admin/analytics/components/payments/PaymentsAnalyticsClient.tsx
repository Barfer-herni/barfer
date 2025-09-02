'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/design-system/components/ui/card';
import { Badge } from '@repo/design-system/components/ui/badge';
import { Button } from '@repo/design-system/components/ui/button';
import { Separator } from '@repo/design-system/components/ui/separator';
import { CreditCard, DollarSign, TrendingUp, AlertCircle, Filter } from 'lucide-react';
import { PaymentsChart } from '../charts/PaymentsChart';
import { PaymentsProgressChart } from '../charts/PaymentsProgressChart';

interface PaymentMethod {
    paymentMethod: string;
    totalCount: number;
    totalRevenue: number;
    totalPercentage: number;
    confirmedCount: number;
    confirmedRevenue: number;
    confirmedPercentage: number;
    pendingCount: number;
    pendingRevenue: number;
    pendingPercentage: number;
    revenuePercentage: number;
}

interface PaymentStats {
    paymentMethods: PaymentMethod[];
    totalOrders: number;
    totalRevenue: number;
    totalConfirmedOrders: number;
    totalConfirmedRevenue: number;
    totalPendingOrders: number;
    totalPendingRevenue: number;
}

interface PaymentProgressData {
    period: string;
    date: string;
    efectivoOrders: number;
    efectivoRevenue: number;
    transferenciaOrders: number;
    transferenciaRevenue: number;
    tarjetaOrders: number;
    tarjetaRevenue: number;
    otherOrders: number;
    otherRevenue: number;
    totalOrders: number;
    totalRevenue: number;
}

interface PaymentsAnalyticsClientProps {
    paymentStats: PaymentStats;
    comparePaymentStats?: PaymentStats;
    progressData?: PaymentProgressData[];
    compareProgressData?: PaymentProgressData[];
    isComparing?: boolean;
    dateFilter?: { from: Date; to: Date };
    compareFilter?: { from: Date; to: Date };
}

const FILTERS = [
    { id: 'all', label: 'Todos' },
    { id: 'Efectivo', label: 'Efectivo' },
    { id: 'Transferencia', label: 'Transferencia' },
    { id: 'Mercado Pago', label: 'Mercado Pago' },
] as const;

type PaymentMethodFilter = typeof FILTERS[number]['id'];

export function PaymentsAnalyticsClient({
    paymentStats,
    comparePaymentStats,
    progressData,
    compareProgressData,
    isComparing = false,
    dateFilter,
    compareFilter
}: PaymentsAnalyticsClientProps) {

    const [paymentMethodFilter, setPaymentMethodFilter] = useState<PaymentMethodFilter>('all');
    const paymentMethods = paymentStats.paymentMethods || [];

    // Filtrar solo los métodos de pago específicos que queremos mostrar
    const filteredPaymentMethods = paymentMethods.filter(method => {
        const methodName = method.paymentMethod.toLowerCase();
        return methodName === 'cash' ||
            methodName === 'mercado-pago' ||
            methodName === 'bank-transfer';
    });

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

    const getPaymentIcon = (method: string) => {
        const upperMethod = method.toUpperCase();

        if (upperMethod.includes('EFECTIVO')) return '💵';
        if (upperMethod.includes('TRANSFERENCIA')) return '🏦';
        if (upperMethod.includes('TARJETA')) return '💳';
        if (upperMethod.includes('DEBITO')) return '🏧';
        if (upperMethod.includes('CREDITO')) return '💳';
        if (upperMethod.includes('MERCADO PAGO')) return '💙';
        if (upperMethod.includes('PAYPAL')) return '🅿️';

        return '💰';
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
        <div className="space-y-4">
            {/* Comparison Summary Cards (no changes needed here, they use comparePaymentStats) */}
            {isComparing && comparePaymentStats && (
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">Resumen - Total Órdenes</CardTitle>
                            {dateFilter && (
                                <p className="text-xs text-muted-foreground">
                                    {olderLabel}: {formatDateRange(dateFilter.from, dateFilter.to)}
                                    {compareFilter && (
                                        <><br />{newerLabel}: {formatDateRange(compareFilter.from, compareFilter.to)}</>
                                    )}
                                </p>
                            )}
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">{olderLabel} (anterior):</span>
                                    <span className="font-medium">{(isPrimaryNewer ? comparePaymentStats.totalOrders : paymentStats.totalOrders).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">{newerLabel} (más reciente):</span>
                                    <span className="font-medium">{(isPrimaryNewer ? paymentStats.totalOrders : comparePaymentStats.totalOrders).toLocaleString()}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium">Cambio:</span>
                                    {formatChange(calculateChange(paymentStats.totalOrders, comparePaymentStats.totalOrders, dateFilter?.from || new Date(), compareFilter?.from || new Date()))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">Resumen - Ingresos Totales</CardTitle>
                            {dateFilter && (
                                <p className="text-xs text-muted-foreground">
                                    {olderLabel}: {formatDateRange(dateFilter.from, dateFilter.to)}
                                    {compareFilter && (
                                        <><br />{newerLabel}: {formatDateRange(compareFilter.from, compareFilter.to)}</>
                                    )}
                                </p>
                            )}
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">{olderLabel} (anterior):</span>
                                    <span className="font-medium">${(isPrimaryNewer ? comparePaymentStats.totalRevenue : paymentStats.totalRevenue).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">{newerLabel} (más reciente):</span>
                                    <span className="font-medium">${(isPrimaryNewer ? paymentStats.totalRevenue : comparePaymentStats.totalRevenue).toLocaleString()}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium">Cambio:</span>
                                    {formatChange(calculateChange(paymentStats.totalRevenue, comparePaymentStats.totalRevenue, dateFilter?.from || new Date(), compareFilter?.from || new Date()))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">Resumen - Órdenes Confirmadas</CardTitle>
                            {dateFilter && (
                                <p className="text-xs text-muted-foreground">
                                    {olderLabel}: {formatDateRange(dateFilter.from, dateFilter.to)}
                                    {compareFilter && (
                                        <><br />{newerLabel}: {formatDateRange(compareFilter.from, compareFilter.to)}</>
                                    )}
                                </p>
                            )}
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">{olderLabel} (anterior):</span>
                                    <span className="font-medium">{(isPrimaryNewer ? comparePaymentStats.totalConfirmedOrders : paymentStats.totalConfirmedOrders).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">{newerLabel} (más reciente):</span>
                                    <span className="font-medium">{(isPrimaryNewer ? paymentStats.totalConfirmedOrders : comparePaymentStats.totalConfirmedOrders).toLocaleString()}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium">Cambio:</span>
                                    {formatChange(calculateChange(paymentStats.totalConfirmedOrders, comparePaymentStats.totalConfirmedOrders, dateFilter?.from || new Date(), compareFilter?.from || new Date()))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Main Summary Cards (no changes needed here, they use paymentStats) */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total de Órdenes</CardTitle>
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{paymentStats.totalOrders.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                            {paymentStats.totalConfirmedOrders} confirmadas • {paymentStats.totalPendingOrders} pendientes
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${paymentStats.totalRevenue.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                            ${paymentStats.totalConfirmedRevenue.toLocaleString()} confirmados
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Métodos de Pago</CardTitle>
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{filteredPaymentMethods.length}</div>
                        <p className="text-xs text-muted-foreground">
                            métodos diferentes
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Payment Methods Summary Card - Resumen de Métodos de Pago */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        Resumen de Métodos de Pago {isComparing ? `(${newerLabel})` : ''}
                    </CardTitle>
                    <CardDescription>
                        {dateFilter && `${formatDateRange(dateFilter.from, dateFilter.to)} • `}
                        Detalle de métricas por método de pago (cash, mercado-pago, bank-transfer) • {filteredPaymentMethods.length} métodos
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {filteredPaymentMethods.length > 0 ? (
                            filteredPaymentMethods.map((method, index) => (
                                <div key={method.paymentMethod} className="p-4 border rounded-lg">
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="text-lg">{getPaymentIcon(method.paymentMethod)}</span>
                                        <h3 className="font-medium">{method.paymentMethod}</h3>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                        <div>
                                            <div className="text-muted-foreground text-xs">Valor promedio</div>
                                            <div className="font-medium">${(method.totalRevenue / method.totalCount).toLocaleString()}</div>
                                        </div>
                                        <div>
                                            <div className="text-muted-foreground text-xs">Total Órdenes</div>
                                            <div className="font-medium">{method.totalCount.toLocaleString()} pedidos</div>
                                            <div className="text-xs text-blue-600 font-medium">({method.totalPercentage.toFixed(1)}%)</div>
                                        </div>
                                        <div>
                                            <div className="text-muted-foreground text-xs">Ingresos Totales</div>
                                            <div className="font-bold">${method.totalRevenue.toLocaleString()}</div>
                                            <div className="text-xs text-green-600 font-medium">({method.revenuePercentage.toFixed(1)}%)</div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                                <p>No hay datos de métodos de pago para mostrar</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Comparison Breakdown Card (no changes needed, it uses comparePaymentStats) */}
            {isComparing && comparePaymentStats && comparePaymentStats.paymentMethods.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CreditCard className="h-5 w-5" />
                            Métodos de Pago ({olderLabel})
                        </CardTitle>
                        <CardDescription>
                            {compareFilter && `${formatDateRange(compareFilter.from, compareFilter.to)} • `}
                            Análisis del período de comparación • {comparePaymentStats.paymentMethods.filter(method => {
                                const methodName = method.paymentMethod.toLowerCase();
                                return methodName === 'cash' ||
                                    methodName === 'mercado-pago' ||
                                    methodName === 'bank-transfer';
                            }).length} métodos
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {comparePaymentStats.paymentMethods
                                .filter(method => {
                                    const methodName = method.paymentMethod.toLowerCase();
                                    return methodName === 'cash' ||
                                        methodName === 'mercado-pago' ||
                                        methodName === 'bank-transfer';
                                })
                                .map((method, index) => (
                                    <div key={method.paymentMethod} className="p-4 border rounded-lg">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg">{getPaymentIcon(method.paymentMethod)}</span>
                                                <h3 className="font-medium">{method.paymentMethod}</h3>
                                            </div>
                                            <Badge variant="outline" className="text-xs">
                                                #{index + 1}
                                            </Badge>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                            <div>
                                                <div className="text-muted-foreground text-xs">Total Órdenes</div>
                                                <div className="font-medium text-blue-600">{method.totalCount} ({method.totalPercentage.toFixed(1)}%)</div>
                                            </div>
                                            <div>
                                                <div className="text-muted-foreground text-xs">Confirmadas</div>
                                                <div className="font-medium text-blue-600">{method.confirmedCount} ({method.confirmedPercentage.toFixed(1)}%)</div>
                                            </div>
                                            <div>
                                                <div className="text-muted-foreground text-xs">Pendientes</div>
                                                <div className="font-medium text-blue-600">{method.pendingCount} ({method.pendingPercentage.toFixed(1)}%)</div>
                                            </div>
                                            <div>
                                                <div className="text-muted-foreground text-xs">Ingresos</div>
                                                <div className="font-bold text-blue-600">${method.totalRevenue.toLocaleString()}</div>
                                            </div>
                                        </div>

                                    </div>
                                ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                            <CardTitle>Evolución de Pagos en el Tiempo</CardTitle>
                            <CardDescription>
                                Seguimiento de ingresos y órdenes según el método de pago.
                            </CardDescription>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            {FILTERS.map(filter => (
                                <Button
                                    key={filter.id}
                                    variant={paymentMethodFilter === filter.id ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setPaymentMethodFilter(filter.id)}
                                >
                                    {filter.label}
                                </Button>
                            ))}
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {progressData && progressData.length > 0 ? (
                        <PaymentsProgressChart
                            data={progressData}
                            compareData={compareProgressData}
                            isComparing={isComparing}
                            periodType={getPeriodType()}
                            filter={paymentMethodFilter}
                            dateFilter={dateFilter}
                            compareFilter={compareFilter}
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-40">
                            <AlertCircle className="w-8 h-8 text-muted-foreground" />
                            <p className="mt-2 text-sm text-muted-foreground">No hay datos suficientes para mostrar la evolución.</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <PaymentsChart
                currentPayments={paymentMethods.map(method => ({
                    paymentMethod: method.paymentMethod,
                    totalOrders: method.totalCount,
                    totalRevenue: method.totalRevenue,
                    confirmedOrders: method.confirmedCount,
                    confirmedRevenue: method.confirmedRevenue,
                    pendingOrders: method.pendingCount,
                    pendingRevenue: method.pendingRevenue,
                    averageOrderValue: method.totalCount > 0 ? method.totalRevenue / method.totalCount : 0,
                    statusFilter: 'all'
                }))}
                comparePayments={comparePaymentStats?.paymentMethods?.map(method => ({
                    paymentMethod: method.paymentMethod,
                    totalOrders: method.totalCount,
                    totalRevenue: method.totalRevenue,
                    confirmedOrders: method.confirmedCount,
                    confirmedRevenue: method.confirmedRevenue,
                    pendingOrders: method.pendingCount,
                    pendingRevenue: method.pendingRevenue,
                    averageOrderValue: method.totalCount > 0 ? method.totalRevenue / method.totalCount : 0,
                    statusFilter: 'all'
                }))}
                isComparing={isComparing}
                statusFilter="all"
                dateFilter={dateFilter}
                compareFilter={compareFilter}
            />
        </div>
    );
} 
