'use client';

import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@repo/design-system/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/design-system/components/ui/select';
import { Button } from '@repo/design-system/components/ui/button';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Order, PuntoEnvio, ProductForStock } from '@repo/data-services';
import { ResumenGeneralChart } from './ResumenGeneralChart';
import { Calendar as CalendarIcon, Filter } from 'lucide-react';

interface ResumenGeneralTablesProps {
    orders: Order[];
    puntosEnvio: PuntoEnvio[];
    productsForStock: ProductForStock[];
}

export function ResumenGeneralTables({ orders, puntosEnvio, productsForStock }: ResumenGeneralTablesProps) {
    // State for filtering
    const [selectedMonth, setSelectedMonth] = useState<string>('all'); // 'all' or 'YYYY-MM'

    // Derived state: Available months from orders
    const availableMonths = useMemo(() => {
        const months = new Set<string>();
        orders.forEach(order => {
            // Determine date (Argentina Timezone logic)
            let orderDate: Date;
            if (order.deliveryDay) {
                orderDate = new Date(order.deliveryDay);
            } else {
                const createdAt = new Date(order.createdAt);
                orderDate = new Date(createdAt.getTime() - (3 * 60 * 60 * 1000));
            }
            const monthKey = orderDate.toISOString().substring(0, 7); // YYYY-MM
            months.add(monthKey);
        });
        return Array.from(months).sort().reverse(); // Newest first
    }, [orders]);

    // Set default month to most recent if available and currently 'all' (optional, maybe user wants 'all' by default)
    // The user requirement says: "que pueda filtrar por meses y que pueda comparar entre meses"
    // So 'all' allows comparing between months in the chart.
    // But for the Tables, 'all' means "Total of the period".

    // Filter orders based on selection
    const filteredOrders = useMemo(() => {
        if (selectedMonth === 'all') return orders;
        return orders.filter(order => {
            let orderDate: Date;
            if (order.deliveryDay) {
                orderDate = new Date(order.deliveryDay);
            } else {
                const createdAt = new Date(order.createdAt);
                orderDate = new Date(createdAt.getTime() - (3 * 60 * 60 * 1000));
            }
            return orderDate.toISOString().substring(0, 7) === selectedMonth;
        });
    }, [orders, selectedMonth]);

    // Data processing for Summary Tables (Aggregated by Punto Envio)
    const summaryData = useMemo(() => {
        const dataByPunto: Record<string, {
            name: string;
            totalOrders: number;
            totalKilos: number;
            totalRevenue: number;
            totalShippingCost: number;
            flavors: Record<string, number>;
        }> = {};

        // Initialize
        puntosEnvio.forEach(punto => {
            if (punto.nombre) {
                dataByPunto[punto.nombre] = {
                    name: punto.nombre,
                    totalOrders: 0,
                    totalKilos: 0,
                    totalRevenue: 0,
                    totalShippingCost: 0,
                    flavors: {
                        'POLLO': 0, 'VACA': 0, 'CERDO': 0, 'CORDERO': 0,
                        'BIG DOG POLLO': 0, 'BIG DOG VACA': 0,
                        'GATO POLLO': 0, 'GATO VACA': 0, 'GATO CORDERO': 0,
                        'HUESOS CARNOSOS': 0
                    }
                };
            }
        });

        filteredOrders.forEach(order => {
            const puntoNombre = order.puntoEnvio || order.deliveryArea?.puntoEnvio;
            if (!puntoNombre || !dataByPunto[puntoNombre]) return;

            const puntoData = dataByPunto[puntoNombre];
            puntoData.totalOrders += 1;
            puntoData.totalRevenue += (order.total || 0);
            puntoData.totalShippingCost += (order.shippingPrice || 0);

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
                        const totalItemWeight = weight * qty;
                        puntoData.totalKilos += totalItemWeight;

                        if (productName.includes('BIG DOG')) {
                            if (productName.includes('POLLO')) puntoData.flavors['BIG DOG POLLO'] += totalItemWeight;
                            else if (productName.includes('VACA')) puntoData.flavors['BIG DOG VACA'] += totalItemWeight;
                        } else if (productName.includes('GATO')) {
                            if (productName.includes('POLLO')) puntoData.flavors['GATO POLLO'] += totalItemWeight;
                            else if (productName.includes('VACA')) puntoData.flavors['GATO VACA'] += totalItemWeight;
                            else if (productName.includes('CORDERO')) puntoData.flavors['GATO CORDERO'] += totalItemWeight;
                        } else if ((productName.includes('HUESOS CARNOSOS') || productName.includes('HUESO CARNOSO')) &&
                            !productName.includes('RECREATIVO') && !productName.includes('CALDO')) {
                            puntoData.flavors['HUESOS CARNOSOS'] += totalItemWeight;
                        } else {
                            if (productName.includes('POLLO')) puntoData.flavors['POLLO'] += totalItemWeight;
                            else if (productName.includes('VACA')) puntoData.flavors['VACA'] += totalItemWeight;
                            else if (productName.includes('CERDO')) puntoData.flavors['CERDO'] += totalItemWeight;
                            else if (productName.includes('CORDERO')) puntoData.flavors['CORDERO'] += totalItemWeight;
                        }
                    }
                });
            }
        });

        return Object.values(dataByPunto);
    }, [filteredOrders, puntosEnvio]);

    // Prepare Data for Chart (All time / Based on user selection capability?)
    // The chart should ideally show the Evolution over the available months.
    // So we use ALL orders to build the historical chart, REGARDLESS of the 'selectedMonth' filter used for the Tables?
    // User asked: "Cuando selecciono todos los puntos de envio sumar un grafico de lineas que muestre la evolucion mes a mes"
    // Usually charts show the whole history or the range selected in the global filter (from URL).
    // The 'filteredOrders' above are filtered by 'selectedMonth' local state. 
    // If 'selectedMonth' is a specific month, the chart would only show 1 point? That renders a line chart useless.
    // DECISION: The Chart always shows data derived from `orders` (the full set passed to component), 
    // ignoring the `selectedMonth` filter which applies to the Summary Tables.
    const chartData = useMemo(() => {
        // We need to group by Month AND by Point (for the "Compare" mode in chart)
        // Structure: { monthName: "Enero 2024", totalKilos: 100, totalOrders: 10, avgShipping: 500, PuntoA_orders: 5, PuntoB_orders: 5, ... }

        const dataByMonth: Record<string, any> = {};

        orders.forEach(order => {
            // Determine date 
            let orderDate: Date;
            if (order.deliveryDay) {
                orderDate = new Date(order.deliveryDay);
            } else {
                const createdAt = new Date(order.createdAt);
                orderDate = new Date(createdAt.getTime() - (3 * 60 * 60 * 1000));
            }
            const monthKey = orderDate.toISOString().substring(0, 7); // YYYY-MM

            if (!dataByMonth[monthKey]) {
                const dateObj = new Date(parseInt(monthKey.split('-')[0]), parseInt(monthKey.split('-')[1]) - 1);
                const monthName = format(dateObj, 'MMMM yyyy', { locale: es });
                dataByMonth[monthKey] = {
                    month: monthKey,
                    monthName: monthName.charAt(0).toUpperCase() + monthName.slice(1),
                    totalOrders: 0,
                    totalKilos: 0,
                    totalRevenue: 0,
                    totalShippingSum: 0,
                };
                // Initialize specific point counters
                puntosEnvio.forEach(p => {
                    if (p.nombre) {
                        dataByMonth[monthKey][`${p.nombre}_orders`] = 0;
                        dataByMonth[monthKey][`${p.nombre}_kilos`] = 0;
                        dataByMonth[monthKey][`${p.nombre}_revenue`] = 0;
                        dataByMonth[monthKey][`${p.nombre}_shipping`] = 0; // Sum for average calculation
                        dataByMonth[monthKey][`${p.nombre}_shippingCount`] = 0;
                    }
                });
            }

            const data = dataByMonth[monthKey];
            data.totalOrders += 1;
            data.totalRevenue += (order.total || 0);
            data.totalShippingSum += (order.shippingPrice || 0);

            // Point specific
            const pName = order.puntoEnvio || order.deliveryArea?.puntoEnvio;

            if (pName) {
                if (data[`${pName}_orders`] !== undefined) {
                    data[`${pName}_orders`] += 1;
                    data[`${pName}_revenue`] += (order.total || 0);
                    data[`${pName}_shipping`] += (order.shippingPrice || 0);
                    data[`${pName}_shippingCount`] += 1;
                }
            }

            // Kilos
            if (order.items && Array.isArray(order.items)) {
                let orderKilos = 0;
                order.items.forEach((item: any) => {
                    const productName = (item.name || '').toUpperCase().trim();
                    const qty = item.quantity || item.options?.[0]?.quantity || 1;
                    let weight = 0;
                    const weightMatch = productName.match(/(\d+)\s*KG/i);
                    if (weightMatch) weight = parseFloat(weightMatch[1]);
                    else if (productName.includes('BOX')) weight = 10;
                    else if (item.options?.[0]?.name?.match(/(\d+)\s*KG/i)) {
                        weight = parseFloat(item.options[0].name.match(/(\d+)\s*KG/i)![1]);
                    }
                    if (weight > 0) orderKilos += (weight * qty);
                });

                data.totalKilos += orderKilos;
                if (pName && data[`${pName}_kilos`] !== undefined) {
                    data[`${pName}_kilos`] += orderKilos;
                }
            }
        });

        // Calculate averages and finalize array
        return Object.values(dataByMonth)
            .sort((a: any, b: any) => a.month.localeCompare(b.month))
            .map((item: any) => {
                const processed = { ...item };
                // Global Average Shipping
                processed.avgShipping = item.totalOrders > 0 ? Math.round(item.totalShippingSum / item.totalOrders) : 0;

                // Point Averages
                puntosEnvio.forEach(p => {
                    if (p.nombre) {
                        const count = item[`${p.nombre}_shippingCount`];
                        const sum = item[`${p.nombre}_shipping`];
                        processed[`${p.nombre}_shipping`] = count > 0 ? Math.round(sum / count) : 0;

                        // Copy kilos/orders to match expected chart keys (e.g. "PuntoA_kilos")
                        // Our Chart expects `${puntoName}_${metric}`. 
                        // We already populated `${p.nombre}_kilos` and `${p.nombre}_orders`.
                        // Just need to ensure `_shipping` is the average, which we just did.
                    }
                });
                return processed;
            });

    }, [orders, puntosEnvio]);


    // Calculate totals for footer
    const totals = useMemo(() => {
        return summaryData.reduce((acc, curr) => {
            acc.totalOrders += curr.totalOrders;
            acc.totalKilos += curr.totalKilos;
            acc.totalRevenue += curr.totalRevenue;
            acc.totalShippingCost += curr.totalShippingCost;

            Object.keys(curr.flavors).forEach(flavor => {
                acc.flavors[flavor] = (acc.flavors[flavor] || 0) + curr.flavors[flavor];
            });

            return acc;
        }, {
            totalOrders: 0,
            totalKilos: 0,
            totalRevenue: 0,
            totalShippingCost: 0,
            flavors: {} as Record<string, number>
        });
    }, [summaryData]);

    const formatCurrency = (val: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(val);
    const formatNumber = (val: number) => new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 }).format(val);

    return (
        <div className="space-y-8">


            {/* Filter Controls for Tables */}
            <div className="flex items-center gap-2 bg-white p-3 rounded-lg border shadow-sm w-fit">
                <CalendarIcon className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">Filtrar Tablas:</span>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger className="w-[180px] h-8">
                        <SelectValue placeholder="Seleccionar mes" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todo el periodo</SelectItem>
                        {availableMonths.map(month => {
                            const [y, m] = month.split('-');
                            const date = new Date(parseInt(y), parseInt(m) - 1);
                            const label = format(date, 'MMMM yyyy', { locale: es });
                            return <SelectItem key={month} value={month}>{label.charAt(0).toUpperCase() + label.slice(1)}</SelectItem>;
                        })}
                    </SelectContent>
                </Select>
            </div>

            {/* Table 1: Summary Metrics */}
            <Card>
                <CardHeader>
                    <CardTitle>Resumen General por Puntos de Venta</CardTitle>
                    <CardDescription>
                        {selectedMonth === 'all'
                            ? 'Métricas totales acumuladas del periodo seleccionado'
                            : `Métricas para ${format(new Date(parseInt(selectedMonth.split('-')[0]), parseInt(selectedMonth.split('-')[1]) - 1), 'MMMM yyyy', { locale: es })}`
                        }
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/50">
                                    <th className="text-left p-3 font-medium text-muted-foreground w-[200px]">Punto de Venta</th>
                                    <th className="text-center p-3 font-medium text-muted-foreground">Pedidos Totales</th>
                                    <th className="text-center p-3 font-medium text-muted-foreground">Kilos Vendidos</th>
                                    <th className="text-center p-3 font-medium text-muted-foreground">Ingresos Totales</th>
                                    <th className="text-center p-3 font-medium text-muted-foreground">Costos de Envío</th>
                                </tr>
                            </thead>
                            <tbody>
                                {summaryData.map((row) => (
                                    <tr key={row.name} className="border-b hover:bg-muted/50">
                                        <td className="p-3 font-medium">{row.name}</td>
                                        <td className="p-3 text-center">{row.totalOrders}</td>
                                        <td className="p-3 text-center font-bold text-blue-600">{formatNumber(row.totalKilos)} kg</td>
                                        <td className="p-3 text-center font-medium text-green-600">{formatCurrency(row.totalRevenue)}</td>
                                        <td className="p-3 text-center text-orange-600">{formatCurrency(row.totalShippingCost)}</td>
                                    </tr>
                                ))}
                                <tr className="bg-muted/30 font-bold border-t-2">
                                    <td className="p-3">TOTALES</td>
                                    <td className="p-3 text-center">{totals.totalOrders}</td>
                                    <td className="p-3 text-center text-blue-700">{formatNumber(totals.totalKilos)} kg</td>
                                    <td className="p-3 text-center text-green-700">{formatCurrency(totals.totalRevenue)}</td>
                                    <td className="p-3 text-center text-orange-700">{formatCurrency(totals.totalShippingCost)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Table 2: Flavor Breakdown */}
            <Card>
                <CardHeader>
                    <CardTitle>Detalle de Kilos por Sabor</CardTitle>
                    <CardDescription>Desglose de kilos vendidos por variedad y punto de venta</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left p-2 font-medium w-[180px] bg-gray-50">Punto de Venta</th>
                                    {/* Perro */}
                                    <th className="text-center p-2 font-medium bg-blue-50">Pollo</th>
                                    <th className="text-center p-2 font-medium bg-blue-50">Vaca</th>
                                    <th className="text-center p-2 font-medium bg-blue-50">Cerdo</th>
                                    <th className="text-center p-2 font-medium bg-blue-50">Cordero</th>
                                    <th className="text-center p-2 font-medium bg-blue-50">Big Dog Pollo</th>
                                    <th className="text-center p-2 font-medium bg-blue-50">Big Dog Vaca</th>
                                    {/* Gato */}
                                    <th className="text-center p-2 font-medium bg-orange-50">Gato Pollo</th>
                                    <th className="text-center p-2 font-medium bg-orange-50">Gato Vaca</th>
                                    <th className="text-center p-2 font-medium bg-orange-50">Gato Cordero</th>
                                    {/* Otros */}
                                    <th className="text-center p-2 font-medium bg-gray-50">Huesos</th>
                                </tr>
                            </thead>
                            <tbody>
                                {summaryData.map((row, idx) => (
                                    <tr key={row.name} className={`border-b ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                                        <td className="p-2 font-medium bg-gray-50/80">{row.name}</td>

                                        <td className="text-center p-2 bg-blue-50/30">{formatNumber(row.flavors['POLLO'])}</td>
                                        <td className="text-center p-2 bg-blue-50/30">{formatNumber(row.flavors['VACA'])}</td>
                                        <td className="text-center p-2 bg-blue-50/30">{formatNumber(row.flavors['CERDO'])}</td>
                                        <td className="text-center p-2 bg-blue-50/30">{formatNumber(row.flavors['CORDERO'])}</td>
                                        <td className="text-center p-2 bg-blue-50/30">{formatNumber(row.flavors['BIG DOG POLLO'])}</td>
                                        <td className="text-center p-2 bg-blue-50/30">{formatNumber(row.flavors['BIG DOG VACA'])}</td>

                                        <td className="text-center p-2 bg-orange-50/30">{formatNumber(row.flavors['GATO POLLO'])}</td>
                                        <td className="text-center p-2 bg-orange-50/30">{formatNumber(row.flavors['GATO VACA'])}</td>
                                        <td className="text-center p-2 bg-orange-50/30">{formatNumber(row.flavors['GATO CORDERO'])}</td>

                                        <td className="text-center p-2 bg-gray-50/30">{formatNumber(row.flavors['HUESOS CARNOSOS'])}</td>
                                    </tr>
                                ))}
                                <tr className="font-bold border-t-2">
                                    <td className="p-2 bg-gray-100">TOTALES</td>
                                    <td className="text-center p-2 bg-blue-100">{formatNumber(totals.flavors['POLLO'] || 0)}</td>
                                    <td className="text-center p-2 bg-blue-100">{formatNumber(totals.flavors['VACA'] || 0)}</td>
                                    <td className="text-center p-2 bg-blue-100">{formatNumber(totals.flavors['CERDO'] || 0)}</td>
                                    <td className="text-center p-2 bg-blue-100">{formatNumber(totals.flavors['CORDERO'] || 0)}</td>
                                    <td className="text-center p-2 bg-blue-100">{formatNumber(totals.flavors['BIG DOG POLLO'] || 0)}</td>
                                    <td className="text-center p-2 bg-blue-100">{formatNumber(totals.flavors['BIG DOG VACA'] || 0)}</td>

                                    <td className="text-center p-2 bg-orange-100">{formatNumber(totals.flavors['GATO POLLO'] || 0)}</td>
                                    <td className="text-center p-2 bg-orange-100">{formatNumber(totals.flavors['GATO VACA'] || 0)}</td>
                                    <td className="text-center p-2 bg-orange-100">{formatNumber(totals.flavors['GATO CORDERO'] || 0)}</td>

                                    <td className="text-center p-2 bg-gray-100">{formatNumber(totals.flavors['HUESOS CARNOSOS'] || 0)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Chart Section */}
            <ResumenGeneralChart data={chartData} puntosEnvio={puntosEnvio} />
        </div>
    );
}
