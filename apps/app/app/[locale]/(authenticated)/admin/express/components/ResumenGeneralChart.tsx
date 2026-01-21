'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@repo/design-system/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Button } from '@repo/design-system/components/ui/button';
import { Badge } from '@repo/design-system/components/ui/badge';
import type { PuntoEnvio } from '@repo/data-services';

interface ChartDataPoint {
    month: string; // YYYY-MM
    monthName: string; // "Enero 2024"
    [key: string]: any; // Dynamic keys for metrics per point if needed, or total keys
}

interface ResumenGeneralChartProps {
    data: ChartDataPoint[];
    puntosEnvio: PuntoEnvio[];
}

export function ResumenGeneralChart({ data, puntosEnvio }: ResumenGeneralChartProps) {
    const [visibleMetrics, setVisibleMetrics] = useState({
        kilos: true,
        orders: true,
        shipping: true
    });

    const [selectedPunto, setSelectedPunto] = useState<string>('all');

    // Filter data based on selected point if logic requires it. 
    // Note: The 'data' prop passed here is expected to be already aggregated or contain keys we can toggle.
    // If the data is aggregated totals, we can't easily filter by point *inside* the chart unless the data structure supports it.
    // Given the requirement "show all points, only one or some to compare", the data structure typically needs to be:
    // { month: '2024-01', 'Punto A_kilos': 100, 'Punto B_kilos': 50, ... }
    // OR we filter the global 'orders' before generating 'data'.

    // For simplicity and matching the prompt's request to "Show all, only one or some", 
    // it implies the aggregation logic might need to sit *above* this chart or this chart handles complex data.
    // Let's assume 'data' contains TOTALS for now, and if we want to filter by point, we rely on the parent or 
    // we make this component smarter.

    // Actually, the user asked: "Que pueda elegir mostrar todas o una sola de ellas y mostrar todos los puntos de envio, solo uno o algunos para compararlos"
    // This implies Multi-Select for Points and Multi-Select for Metrics.
    // This suggests the lines in the chart might need to be dynamic (e.g. Line for Punto A Kilos, Line for Punto B Kilos).
    // Or just Global Kilos, Global Orders.

    // Interpretation: 
    // 1. Selector for Metrics (Kilos vs Orders vs Cost).
    // 2. Selector for Points (All vs Specifics).
    // If I select "Kilos" and "Point A" + "Point B", I should see two lines? Or one summed line?
    // "Compararlos" (compare them) suggests multiple lines, one per point.

    // Strategy:
    // The chart will display ONE metric type at a time if comparing points (to avoid scale confusion), 
    // OR allow multiple metrics for ALL points.
    // Let's support: 
    // - Mode: "Global Overview" (3 lines: Kilos, Orders, Cost -> Normalized or separately scaled?) -> Recharts with multiple Y-Axes is tricky but doable.
    // - Mode: "Compare Points" (Select 1 Metric, Select N Points -> N Lines).

    const [mode, setMode] = useState<'overview' | 'compare'>('overview');
    const [compareMetric, setCompareMetric] = useState<'kilos' | 'orders' | 'shipping'>('kilos');
    const [comparePoints, setComparePoints] = useState<string[]>(['all']);

    const chartConfig = useMemo(() => {
        // If Overview: Show Total Kilos, Total Orders, Total Cost (Average).
        // If Compare: Show [Metric] for [Points].

        let lines: React.ReactNode[] = [];

        if (mode === 'overview') {
            if (visibleMetrics.kilos) {
                lines.push(<Line yAxisId="kg" key="totalKilos" type="monotone" dataKey="totalKilos" name="Kilos Vendidos" stroke="#2563eb" strokeWidth={2} />);
            }
            if (visibleMetrics.orders) {
                // Use a separate axis or same? Orders (e.g. 100) vs Kilos (e.g. 1000). Separate axis recommended.
                lines.push(<Line yAxisId="orders" key="totalOrders" type="monotone" dataKey="totalOrders" name="Pedidos Totales" stroke="#16a34a" strokeWidth={2} />);
            }
            if (visibleMetrics.shipping) {
                lines.push(<Line yAxisId="cost" key="avgShipping" type="monotone" dataKey="avgShipping" name="Costo Envío Promedio" stroke="#ea580c" strokeWidth={2} />);
            }
        } else {
            // Compare Mode
            // Data needs keys like "PuntoName_metric"
            comparePoints.forEach((puntoName, idx) => {
                const color = `hsl(${(idx * 137.5) % 360}, 70%, 50%)`; // Generate distinct colors
                const dataKey = puntoName === 'all'
                    ? (compareMetric === 'shipping' ? 'avgShipping' : (compareMetric === 'kilos' ? 'totalKilos' : 'totalOrders'))
                    : `${puntoName}_${compareMetric}`;

                const name = puntoName === 'all' ? 'Todos' : puntoName;

                lines.push(<Line key={dataKey} type="monotone" dataKey={dataKey} name={name} stroke={color} strokeWidth={2} />);
            });
        }

        return lines;
    }, [mode, visibleMetrics, compareMetric, comparePoints]);

    return (
        <Card className="w-full">
            <CardHeader>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <CardTitle>Evolución Mensual</CardTitle>
                        <CardDescription>Comparativa de desempeño en el tiempo</CardDescription>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <div className="flex items-center border rounded-md p-1 bg-muted/20">
                            <Button
                                variant={mode === 'overview' ? 'secondary' : 'ghost'}
                                size="sm"
                                onClick={() => setMode('overview')}
                                className="text-xs"
                            >
                                Resumen Global
                            </Button>
                            <Button
                                variant={mode === 'compare' ? 'secondary' : 'ghost'}
                                size="sm"
                                onClick={() => {
                                    setMode('compare');
                                    if (comparePoints.length === 0) setComparePoints(['all']);
                                }}
                                className="text-xs"
                            >
                                Comparar Puntos
                            </Button>
                        </div>
                    </div>
                </div>

                {mode === 'overview' && (
                    <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant={visibleMetrics.kilos ? 'default' : 'outline'} className="cursor-pointer bg-blue-600 hover:bg-blue-700" onClick={() => setVisibleMetrics(prev => ({ ...prev, kilos: !prev.kilos }))}>
                            Kilos
                        </Badge>
                        <Badge variant={visibleMetrics.orders ? 'default' : 'outline'} className="cursor-pointer bg-green-600 hover:bg-green-700" onClick={() => setVisibleMetrics(prev => ({ ...prev, orders: !prev.orders }))}>
                            Pedidos
                        </Badge>
                        <Badge variant={visibleMetrics.shipping ? 'default' : 'outline'} className="cursor-pointer bg-orange-600 hover:bg-orange-700" onClick={() => setVisibleMetrics(prev => ({ ...prev, shipping: !prev.shipping }))}>
                            Costo Envío
                        </Badge>
                    </div>
                )}

                {mode === 'compare' && (
                    <div className="space-y-3 mt-2">
                        <div className="flex flex-wrap gap-2 items-center">
                            <span className="text-xs font-medium text-muted-foreground mr-2">Métrica:</span>
                            <Badge variant={compareMetric === 'kilos' ? 'default' : 'outline'} className="cursor-pointer" onClick={() => setCompareMetric('kilos')}>
                                Kilos
                            </Badge>
                            <Badge variant={compareMetric === 'orders' ? 'default' : 'outline'} className="cursor-pointer" onClick={() => setCompareMetric('orders')}>
                                Pedidos
                            </Badge>
                            <Badge variant={compareMetric === 'shipping' ? 'default' : 'outline'} className="cursor-pointer" onClick={() => setCompareMetric('shipping')}>
                                Costo Envío
                            </Badge>
                        </div>
                        <div className="flex flex-wrap gap-2 items-center">
                            <span className="text-xs font-medium text-muted-foreground mr-2">Puntos:</span>
                            <Badge
                                variant={comparePoints.includes('all') ? 'default' : 'outline'}
                                className="cursor-pointer"
                                onClick={() => {
                                    if (comparePoints.includes('all')) setComparePoints(comparePoints.filter(p => p !== 'all'));
                                    else setComparePoints([...comparePoints, 'all']);
                                }}
                            >
                                TODOS
                            </Badge>
                            {puntosEnvio.map(p => (
                                <Badge
                                    key={String(p._id)}
                                    variant={comparePoints.includes(p.nombre) ? 'default' : 'outline'}
                                    className="cursor-pointer"
                                    onClick={() => {
                                        if (comparePoints.includes(p.nombre)) setComparePoints(comparePoints.filter(n => n !== p.nombre));
                                        else setComparePoints([...comparePoints, p.nombre]);
                                    }}
                                >
                                    {p.nombre}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}
            </CardHeader>
            <CardContent>
                <div className="h-[350px] w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                            <XAxis
                                dataKey="monthName"
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            {/* Y-Axes configuration based on mode */}
                            {mode === 'overview' ? (
                                <>
                                    {visibleMetrics.kilos && <YAxis yAxisId="kg" orientation="left" stroke="#2563eb" fontSize={12} tickFormatter={(val) => `${val}kg`} />}
                                    {visibleMetrics.orders && <YAxis yAxisId="orders" orientation="right" stroke="#16a34a" fontSize={12} />}
                                    {visibleMetrics.shipping && <YAxis yAxisId="cost" orientation="right" stroke="#ea580c" fontSize={12} tickFormatter={(val) => `$${val}`} />}
                                </>
                            ) : (
                                <YAxis fontSize={12} />
                            )}

                            <Tooltip
                                contentStyle={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                labelStyle={{ fontWeight: 'bold', color: '#1f2937' }}
                                formatter={(value: number, name: string) => {
                                    if (name.includes('Kilos') || name.includes('totalKilos')) return [`${new Intl.NumberFormat('es-AR').format(value)} kg`, name];
                                    if (name.includes('Costo') || name.includes('avgShipping')) return [`${new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(value)}`, name];
                                    return [value, name];
                                }}
                            />
                            <Legend />
                            {chartConfig}
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
