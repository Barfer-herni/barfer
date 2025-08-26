'use client';

import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/design-system/components/ui/card';

interface DataPoint {
    period: string;
    date: string;
    [key: string]: any;
}

interface CategoryProgressChartProps {
    data: DataPoint[];
    isComparing: boolean;
    dateFilter?: { from: Date; to: Date };
}

const CATEGORY_KEYS = {
    'BIG DOG': { quantity: 'bigDogQuantity', revenue: 'bigDogRevenue', color: '#9b59b6' },
    'PERRO': { quantity: 'perroQuantity', revenue: 'perroRevenue', color: '#3498db' },
    'GATO': { quantity: 'gatoQuantity', revenue: 'gatoRevenue', color: '#e74c3c' },
    'HUESOS CARNOSOS': { quantity: 'huesosQuantity', revenue: 'huesosRevenue', color: '#2ecc71' },
    'COMPLEMENTOS': { quantity: 'complementosQuantity', revenue: 'complementosRevenue', color: '#f1c40f' }
};

function parseDateString(dateString: string): Date {
    if (dateString.includes('/')) {
        const parts = dateString.split('/'); // DD/MM/YYYY
        if (parts.length === 3) {
            return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
        }
    }
    const parts = dateString.split('-'); // YYYY-MM-DD
    if (parts.length === 3) {
        return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    }
    // Fallback for unexpected formats, though it might still result in Invalid Date
    return new Date(dateString);
}

export function CategoryProgressChart({
    data,
    isComparing,
    dateFilter,
}: CategoryProgressChartProps) {
    const diffDays = dateFilter ? Math.ceil(Math.abs(dateFilter.to.getTime() - dateFilter.from.getTime()) / (1000 * 60 * 60 * 24)) : 0;
    const periodType = diffDays <= 31 ? 'daily' : diffDays <= 90 ? 'weekly' : 'monthly';

    const chartData = useMemo(() => {
        if (!data) return [];
        return data.map(item => {
            let displayDate;
            if (periodType === 'daily') {
                const date = parseDateString(item.date);
                displayDate = date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
            } else if (periodType === 'weekly') {
                displayDate = `S${item.period.split('-W')[1]}`;
            } else { // monthly
                const date = parseDateString(item.date);
                displayDate = date.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });
            }
            return {
                ...item,
                displayDate,
                fullDate: item.date,
            };
        }).sort((a, b) => parseDateString(a.fullDate).getTime() - parseDateString(b.fullDate).getTime());
    }, [data, periodType]);

    const formatCurrency = (value: number) => `$${value.toLocaleString()}`;

    const renderTooltip = (label: string, payload: any[] | undefined) => {
        const point = payload?.[0]?.payload;
        if (point && point.fullDate) {
            try {
                const date = parseDateString(point.fullDate);

                if (!isNaN(date.getTime())) {
                    if (periodType === 'daily') {
                        const formattedDate = date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
                        const dayString = date.toLocaleDateString('es-ES', { weekday: 'long' });
                        return (
                            <div>
                                <div>{formattedDate}</div>
                                <div style={{ textTransform: 'capitalize' }}>{dayString}</div>
                            </div>
                        );
                    }
                    if (periodType === 'weekly') {
                        return `Semana ${point.period.split('-W')[1]}`;
                    }
                    if (periodType === 'monthly') {
                        return date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
                    }
                }
            } catch (e) {
                // fallback to original label
            }
        }
        return label;
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Unidades por Categoría</CardTitle>
                    <CardDescription>Unidades vendidas por categoría a lo largo del tiempo.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={350}>
                        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 20, bottom: 50 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                dataKey="displayDate"
                                fontSize={12}
                                angle={periodType === 'daily' ? -45 : 0}
                                textAnchor={periodType === 'daily' ? 'end' : 'middle'}
                                height={60}
                            />
                            <YAxis fontSize={12} />
                            <Tooltip
                                formatter={(value: number) => `${Number(value).toLocaleString()} un.`}
                                labelFormatter={renderTooltip}
                            />
                            <Legend />
                            {Object.entries(CATEGORY_KEYS).map(([name, keys]) => (<Line key={name} type="monotone" dataKey={keys.quantity} name={name} stroke={keys.color} strokeWidth={2} dot={false} />))}
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Ingresos por Categoría</CardTitle>
                    <CardDescription>Ingresos generados por categoría a lo largo del tiempo.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={chartData} margin={{ top: 5, right: 20, left: 20, bottom: 50 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                dataKey="displayDate"
                                fontSize={12}
                                angle={periodType === 'daily' ? -45 : 0}
                                textAnchor={periodType === 'daily' ? 'end' : 'middle'}
                                height={60}
                            />
                            <YAxis tickFormatter={(value) => `$${(Number(value) / 1000).toFixed(0)}k`} fontSize={12} />
                            <Tooltip
                                formatter={(value: number) => formatCurrency(value)}
                                labelFormatter={renderTooltip}
                            />
                            <Legend />
                            {Object.entries(CATEGORY_KEYS).map(([name, keys]) => (<Bar key={name} dataKey={keys.revenue} name={name} fill={keys.color} />))}
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
} 