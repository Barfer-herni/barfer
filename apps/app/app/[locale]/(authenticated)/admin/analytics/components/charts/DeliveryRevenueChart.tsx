'use client';

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts';

interface DeliveryTypeStats {
    month: string;
    sameDayOrders: number;
    normalOrders: number;
    wholesaleOrders: number;
    sameDayRevenue: number;
    normalRevenue: number;
    wholesaleRevenue: number;
}

interface DeliveryRevenueChartProps {
    data: DeliveryTypeStats[];
}

export function DeliveryRevenueChart({ data }: DeliveryRevenueChartProps) {
    return (
        <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data}>
                <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `$${Number(value).toLocaleString('es-AR')}`}
                />
                <Tooltip
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '0.5rem' }}
                    labelStyle={{ color: '#f9fafb' }}
                    formatter={(value: number) => [`$${value.toLocaleString('es-AR')}`, null]}
                />
                <Legend />
                <Bar dataKey="sameDayRevenue" name="Ingresos (Envíos día)" fill="#2ecc71" radius={[4, 4, 0, 0]} />
                <Bar dataKey="normalRevenue" name="Ingresos (Reparto normal)" fill="#9b59b6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="wholesaleRevenue" name="Ingresos (Mayorista)" fill="#e74c3c" radius={[4, 4, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    );
} 