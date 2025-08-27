'use client';

import { useMemo } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/design-system/components/ui/card';
import { Badge } from '@repo/design-system/components/ui/badge';

interface PaymentMethodStat {
    paymentMethod: string;
    totalOrders: number;
    totalRevenue: number;
    confirmedOrders: number;
    confirmedRevenue: number;
    pendingOrders: number;
    pendingRevenue: number;
    averageOrderValue: number;
    statusFilter: string;
}

interface PaymentsChartProps {
    currentPayments: PaymentMethodStat[];
    comparePayments?: PaymentMethodStat[];
    isComparing?: boolean;
    statusFilter: 'all' | 'pending' | 'confirmed';
    dateFilter?: { from: Date; to: Date };
    compareFilter?: { from: Date; to: Date };
}

// Colores para los métodos de pago
const PAYMENT_COLORS = {
    'efectivo': '#10b981',
    'transferencia': '#3b82f6',
    'tarjeta': '#8b5cf6',
    'qr': '#f59e0b',
    'otro': '#6b7280',
    'default': '#64748b'
};

export function PaymentsChart({
    currentPayments,
    comparePayments = [],
    isComparing = false,
    statusFilter,
    dateFilter,
    compareFilter
}: PaymentsChartProps) {

    // Preparar datos para el gráfico de dona
    const pieData = useMemo(() => {
        return currentPayments.map((payment, index) => ({
            name: payment.paymentMethod.charAt(0).toUpperCase() + payment.paymentMethod.slice(1),
            value: statusFilter === 'confirmed' ? payment.confirmedOrders :
                statusFilter === 'pending' ? payment.pendingOrders :
                    payment.totalOrders,
            revenue: statusFilter === 'confirmed' ? payment.confirmedRevenue :
                statusFilter === 'pending' ? payment.pendingRevenue :
                    payment.totalRevenue,
            orders: statusFilter === 'confirmed' ? payment.confirmedOrders :
                statusFilter === 'pending' ? payment.pendingOrders :
                    payment.totalOrders,
            avgOrderValue: payment.averageOrderValue,
            color: PAYMENT_COLORS[payment.paymentMethod.toLowerCase() as keyof typeof PAYMENT_COLORS] || PAYMENT_COLORS.default,
            method: payment.paymentMethod
        }));
    }, [currentPayments, statusFilter]);

    // Preparar datos para comparación
    const comparisonData = useMemo(() => {
        if (!isComparing || !comparePayments.length) return [];

        return currentPayments.map(current => {
            const compare = comparePayments.find(p => p.paymentMethod === current.paymentMethod);
            const currentValue = statusFilter === 'confirmed' ? current.confirmedOrders :
                statusFilter === 'pending' ? current.pendingOrders :
                    current.totalOrders;
            const compareValue = compare ? (
                statusFilter === 'confirmed' ? compare.confirmedOrders :
                    statusFilter === 'pending' ? compare.pendingOrders :
                        compare.totalOrders
            ) : 0;

            return {
                method: current.paymentMethod.charAt(0).toUpperCase() + current.paymentMethod.slice(1),
                current: currentValue,
                currentRevenue: statusFilter === 'confirmed' ? current.confirmedRevenue :
                    statusFilter === 'pending' ? current.pendingRevenue :
                        current.totalRevenue,
                compare: compareValue,
                compareRevenue: compare ? (
                    statusFilter === 'confirmed' ? compare.confirmedRevenue :
                        statusFilter === 'pending' ? compare.pendingRevenue :
                            compare.totalRevenue
                ) : 0
            };
        });
    }, [currentPayments, comparePayments, isComparing, statusFilter]);

    const formatCurrency = (value: number) => {
        return `$${value.toLocaleString()}`;
    };

    const formatDateRange = (from: Date, to: Date) => {
        return `${from.toLocaleDateString('es-ES')} - ${to.toLocaleDateString('es-ES')}`;
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'all': return 'Todos';
            case 'pending': return 'Pendientes';
            case 'confirmed': return 'Confirmados';
            default: return 'Todos';
        }
    };

    const getPaymentIcon = (method: string) => {
        switch (method.toLowerCase()) {
            case 'efectivo': return '💵';
            case 'transferencia': return '🏦';
            case 'tarjeta': return '💳';
            case 'qr': return '📱';
            case 'otro': return '💰';
            default: return '💳';
        }
    };

    // Componente personalizado para las etiquetas del gráfico de dona
    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
        if (percent < 0.05) return null; // No mostrar etiquetas para segmentos muy pequeños

        const RADIAN = Math.PI / 180;
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        return (
            <text
                x={x}
                y={y}
                fill="white"
                textAnchor={x > cx ? 'start' : 'end'}
                dominantBaseline="central"
                fontSize={10}
                fontWeight="bold"
            >
                {`${(percent * 100).toFixed(0)}%`}
            </text>
        );
    };

    return (
        <div className="space-y-4 md:space-y-6">
            {/* Gráfico de Dona - Distribución de Métodos de Pago */}
            <Card>
                <CardHeader className="pb-4">
                    <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <span className="text-lg">Distribución por Método de Pago</span>
                        <Badge variant="secondary" className="w-fit">
                            {getStatusLabel(statusFilter)} - Pedidos
                        </Badge>
                    </CardTitle>
                    <CardDescription>
                        Distribución de pedidos por método de pago
                        {dateFilter && ` (${formatDateRange(dateFilter.from, dateFilter.to)})`}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col lg:flex-row gap-4">
                        {/* Gráfico de dona */}
                        <div className="flex-1">
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={renderCustomizedLabel}
                                        outerRadius={80}
                                        innerRadius={40}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value: number, name: string, props: any) => [
                                            `${value.toLocaleString()} pedidos`,
                                            `${getPaymentIcon(props.payload.method)} ${props.payload.name}`
                                        ]}
                                        labelFormatter={() => ''}
                                        contentStyle={{
                                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                            border: '1px solid #ccc',
                                            borderRadius: '8px',
                                            fontSize: '12px'
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Leyenda personalizada */}
                        <div className="lg:w-48 lg:flex-shrink-0">
                            <h4 className="text-sm font-medium mb-3">Métodos de Pago</h4>
                            <div className="space-y-2">
                                {pieData.map((entry, index) => (
                                    <div key={index} className="flex items-center gap-2 text-xs">
                                        <div
                                            className="w-3 h-3 rounded-full flex-shrink-0"
                                            style={{ backgroundColor: entry.color }}
                                        />
                                        <span className="flex-1 min-w-0">
                                            <span className="mr-1">{getPaymentIcon(entry.method)}</span>
                                            <span>{entry.name}</span>
                                        </span>
                                        <span className="text-muted-foreground font-medium">
                                            {entry.value.toLocaleString()}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Gráfico de Comparación de Métodos de Pago */}
            {isComparing && comparisonData.length > 0 && (
                <Card>
                    <CardHeader className="pb-4">
                        <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <span className="text-lg">Comparación de Métodos de Pago</span>
                            <div className="flex flex-col sm:flex-row gap-2 text-xs">
                                <Badge variant="outline" className="text-blue-600 w-fit">
                                    Principal: {dateFilter && formatDateRange(dateFilter.from, dateFilter.to)}
                                </Badge>
                                <Badge variant="outline" className="text-orange-600 w-fit">
                                    Comparación: {compareFilter && formatDateRange(compareFilter.from, compareFilter.to)}
                                </Badge>
                            </div>
                        </CardTitle>
                        <CardDescription>
                            Comparación de pedidos por método de pago
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={350}>
                            <BarChart
                                data={comparisonData}
                                margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                                barCategoryGap="20%"
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="method"
                                    tick={{ fontSize: 10 }}
                                />
                                <YAxis
                                    tick={{ fontSize: 10 }}
                                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                                />
                                <Tooltip
                                    formatter={(value: number, name: string, props: any) => [
                                        `${value.toLocaleString()} pedidos`,
                                        name === 'current' ? 'Principal' : 'Comparación'
                                    ]}
                                    labelFormatter={(label, payload) => {
                                        const data = payload?.[0]?.payload;
                                        return data ? `${getPaymentIcon(data.method)} ${data.method}` : label;
                                    }}
                                    contentStyle={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '8px',
                                        fontSize: '12px'
                                    }}
                                />
                                <Legend />
                                <Bar
                                    dataKey="current"
                                    name="Principal"
                                    fill="#3b82f6"
                                    radius={[2, 2, 0, 0]}
                                    maxBarSize={60}
                                />
                                <Bar
                                    dataKey="compare"
                                    name="Comparación"
                                    fill="#ea580c"
                                    radius={[2, 2, 0, 0]}
                                    maxBarSize={60}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}

            {/* Gráfico de Ingresos por Método de Pago */}
            <Card>
                <CardHeader>
                    <CardTitle>Ingresos por Método de Pago</CardTitle>
                    <CardDescription>
                        Distribución de ingresos según método de pago ({getStatusLabel(statusFilter).toLowerCase()})
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                            data={pieData}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                dataKey="name"
                                tick={{ fontSize: 12 }}
                            />
                            <YAxis
                                tick={{ fontSize: 12 }}
                                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                            />
                            <Tooltip
                                formatter={(value: number, name: string, props: any) => [
                                    formatCurrency(value),
                                    'Ingresos'
                                ]}
                                labelFormatter={(label, payload) => {
                                    const data = payload?.[0]?.payload;
                                    return data ? `${getPaymentIcon(data.method)} ${data.name}` : label;
                                }}
                            />
                            <Bar
                                dataKey="revenue"
                                fill="#059669"
                                radius={[4, 4, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>


        </div>
    );
} 