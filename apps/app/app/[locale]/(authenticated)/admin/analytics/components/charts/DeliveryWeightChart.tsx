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
    sameDayWeight: number;
    normalWeight: number;
    wholesaleWeight: number;
}

interface DeliveryWeightChartProps {
    data: DeliveryTypeStats[];
}

export function DeliveryWeightChart({ data }: DeliveryWeightChartProps) {
    return (
        <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data}>
                <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value} kg`} />
                <Tooltip
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '0.5rem' }}
                    labelStyle={{ color: '#f9fafb' }}
                    formatter={(value: number) => [`${value} kg`, '']}
                />
                <Legend />
                <Bar dataKey="sameDayWeight" name="Envíos en el día" fill="#3498db" radius={[4, 4, 0, 0]} />
                <Bar dataKey="normalWeight" name="Reparto normal" fill="#9b59b6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="wholesaleWeight" name="Mayorista" fill="#e74c3c" radius={[4, 4, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    );
} 