'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@repo/design-system/components/ui/card';
import type { Order } from '@repo/data-services';

interface MonthlyMetricsTableProps {
    orders: Order[];
    puntoEnvioName?: string;
}

export function MonthlyMetricsTable({ orders, puntoEnvioName }: MonthlyMetricsTableProps) {

    // Process orders to group by month
    const monthlyData = useMemo(() => {
        const dataByMonth: Record<string, {
            monthKey: string; // YYYY-MM
            totalOrders: number;
            totalKilos: number;
            totalRevenue: number;
            totalShipping: number;
        }> = {};

        orders.forEach(order => {
            // Filter by Punto Envio if specified (though orders passed might already be filtered)
            if (puntoEnvioName && order.puntoEnvio !== puntoEnvioName && puntoEnvioName !== 'all') {
                return;
            }

            // Determine date (using the Argentina Timezone logic)
            let orderDate: Date;
            if (order.deliveryDay) {
                // deliveryDay is likely UTC but represents the local date string 00:00
                // simple substring is safer for consistency with other parts
                orderDate = new Date(order.deliveryDay);
            } else {
                const createdAt = new Date(order.createdAt);
                orderDate = new Date(createdAt.getTime() - (3 * 60 * 60 * 1000));
            }

            const monthKey = orderDate.toISOString().substring(0, 7); // YYYY-MM

            if (!dataByMonth[monthKey]) {
                dataByMonth[monthKey] = {
                    monthKey,
                    totalOrders: 0,
                    totalKilos: 0,
                    totalRevenue: 0,
                    totalShipping: 0,
                };
            }

            const data = dataByMonth[monthKey];
            data.totalOrders += 1;
            data.totalRevenue += (order.total || 0);
            data.totalShipping += (order.shippingPrice || 0);

            // Calculate Weight
            // Reusing the logic from ResumenGeneralTables roughly
            if (order.items && Array.isArray(order.items)) {
                order.items.forEach((item: any) => {
                    const productName = (item.name || '').toUpperCase().trim();
                    const qty = item.quantity || item.options?.[0]?.quantity || 1;
                    let weight = 0;

                    const weightMatch = productName.match(/(\d+)\s*KG/i);
                    if (weightMatch) {
                        weight = parseFloat(weightMatch[1]);
                    } else if (productName.includes('BOX')) {
                        weight = 10;
                    } else if (item.options && item.options.length > 0) {
                        const optName = item.options[0].name || '';
                        const optMatch = optName.match(/(\d+)\s*KG/i);
                        if (optMatch) weight = parseFloat(optMatch[1]);
                    }

                    if (weight > 0) {
                        data.totalKilos += (weight * qty);
                    }
                });
            }
        });

        // Convert to array and sort descending by date
        return Object.values(dataByMonth).sort((a, b) => b.monthKey.localeCompare(a.monthKey));
    }, [orders, puntoEnvioName]);

    const formatCurrency = (val: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(val);
    const formatNumber = (val: number) => new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 }).format(val);

    // Helper to format month name
    const formatMonthKey = (key: string) => {
        const [year, month] = key.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        return new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric' }).format(date);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Historial Mensual</CardTitle>
                <CardDescription>
                    {puntoEnvioName ? `Métricas detalladas para ${puntoEnvioName}` : 'Métricas generales por mes'}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b bg-muted/50">
                                <th className="text-left p-3 font-medium text-muted-foreground">Mes</th>
                                <th className="text-center p-3 font-medium text-muted-foreground">Pedidos Totales</th>
                                <th className="text-center p-3 font-medium text-muted-foreground">Kilos Vendidos</th>
                                <th className="text-center p-3 font-medium text-muted-foreground">Ingresos Totales</th>
                                <th className="text-center p-3 font-medium text-muted-foreground">Costo Envío Promedio</th>
                            </tr>
                        </thead>
                        <tbody>
                            {monthlyData.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-4 text-center text-muted-foreground">
                                        No hay datos disponibles para el periodo seleccionado
                                    </td>
                                </tr>
                            ) : (
                                monthlyData.map((row) => (
                                    <tr key={row.monthKey} className="border-b hover:bg-muted/50 transition-colors">
                                        <td className="p-3 font-medium capitalize">{formatMonthKey(row.monthKey)}</td>
                                        <td className="p-3 text-center">{row.totalOrders}</td>
                                        <td className="p-3 text-center font-bold text-blue-600">{formatNumber(row.totalKilos)} kg</td>
                                        <td className="p-3 text-center font-medium text-green-600">{formatCurrency(row.totalRevenue)}</td>
                                        <td className="p-3 text-center text-orange-600">
                                            {formatCurrency(row.totalOrders > 0 ? row.totalShipping / row.totalOrders : 0)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}
