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

interface DeliveryOrdersChartProps {
    data: DeliveryTypeStats[];
}

export function DeliveryOrdersChart({ data }: DeliveryOrdersChartProps) {
    return (
        <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data}>
                <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                <Tooltip
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '0.5rem' }}
                    labelStyle={{ color: '#f9fafb' }}
                />
                <Legend />
                <Bar dataKey="sameDayOrders" name="Envíos en el día" fill="#3498db" radius={[4, 4, 0, 0]} />
                <Bar dataKey="normalOrders" name="Reparto normal" fill="#9b59b6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="wholesaleOrders" name="Mayorista" fill="#e74c3c" radius={[4, 4, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    );
} 