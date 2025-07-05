'use client';

import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ProductTimelinePoint {
    period: string;
    [key: string]: any;
}

interface ProductTimelineChartProps {
    data: ProductTimelinePoint[];
    yKey1: string;
    yKey2?: string;
    name1: string;
    name2?: string;
    yAxisFormatter?: (value: any) => string;
}

export function ProductTimelineChart({ data, yKey1, yKey2, name1, name2, yAxisFormatter }: ProductTimelineChartProps) {
    if (!data || data.length === 0) {
        return <p>No hay datos suficientes para mostrar el gráfico.</p>;
    }

    return (
        <ResponsiveContainer width="100%" height={350}>
            <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <XAxis dataKey="period" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={yAxisFormatter} />
                <Tooltip
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '0.5rem' }}
                    labelStyle={{ color: '#f9fafb' }}
                />
                <Legend />
                <Line type="monotone" dataKey={yKey1} name={name1} stroke="#22c55e" strokeWidth={2} />
                {yKey2 && name2 && (
                    <Line type="monotone" dataKey={yKey2} name={name2} stroke="#f97316" strokeWidth={2} />
                )}
            </LineChart>
        </ResponsiveContainer>
    );
} 