'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@repo/design-system/components/ui/card';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Order, PuntoEnvio, ProductForStock } from '@repo/data-services';

interface ResumenGeneralTablesProps {
    orders: Order[];
    puntosEnvio: PuntoEnvio[];
    productsForStock: ProductForStock[];
    selectedDate: Date;
}

export function ResumenGeneralTables({ orders, puntosEnvio, productsForStock, selectedDate }: ResumenGeneralTablesProps) {
    const formattedDate = format(selectedDate, "EEEE d 'de' MMMM", { locale: es });

    // Filter orders for the selected date
    const ordersForDate = useMemo(() => {
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        return orders.filter(order => {
            const orderDate = new Date(order.createdAt);
            const orderDateStr = format(orderDate, 'yyyy-MM-dd');
            return orderDateStr === dateStr;
        });
    }, [orders, selectedDate]);

    // Data processing for both tables
    const summaryData = useMemo(() => {
        // Initialize data structure for each punto
        const dataByPunto: Record<string, {
            name: string;
            totalOrders: number;
            totalKilos: number;
            totalRevenue: number;
            totalShippingCost: number;
            flavors: Record<string, number>;
        }> = {};

        // Initialize with all available puntos (inc. those with 0 orders)
        puntosEnvio.forEach(punto => {
            if (punto.nombre) {
                dataByPunto[punto.nombre] = {
                    name: punto.nombre,
                    totalOrders: 0,
                    totalKilos: 0,
                    totalRevenue: 0,
                    totalShippingCost: 0,
                    flavors: {
                        'POLLO': 0,
                        'VACA': 0,
                        'CERDO': 0,
                        'CORDERO': 0,
                        'BIG DOG POLLO': 0,
                        'BIG DOG VACA': 0,
                        'GATO POLLO': 0,
                        'GATO VACA': 0,
                        'GATO CORDERO': 0,
                        'HUESOS CARNOSOS': 0
                    }
                };
            }
        });

        // Process orders
        ordersForDate.forEach(order => {
            const puntoNombre = order.puntoEnvio;
            if (!puntoNombre || !dataByPunto[puntoNombre]) return;

            const puntoData = dataByPunto[puntoNombre];
            puntoData.totalOrders += 1;
            puntoData.totalRevenue += (order.total || 0);
            puntoData.totalShippingCost += (order.shippingPrice || 0);

            // Process items for weights
            if (order.items && Array.isArray(order.items)) {
                order.items.forEach((item: any) => {
                    // Extract weight from item name or calculate logic if needed
                    // This logic mirrors calculatePedidosDelDia in ExpressPageClient
                    const productName = (item.name || '').toUpperCase().trim();
                    const qty = item.quantity || item.options?.[0]?.quantity || 1;

                    // Determine weight roughly from name if possible, or assume based on product type
                    // Ideally we'd match with productsForStock but simple text parsing works for summary
                    let weight = 0;

                    // Try to extract KG from name
                    const weightMatch = productName.match(/(\d+)\s*KG/i);
                    if (weightMatch) {
                        weight = parseFloat(weightMatch[1]);
                    } else if (productName.includes('BOX')) {
                        // Assumptions for boxes if weight not explicit
                        weight = 10; // Default assumption, verify if needed
                    } else {
                        // More precise matching strategy similar to calculatePedidosDelDia needed? 
                        // For now let's try to map to known products
                        // Or if we can't determine weight, skip or assume default? 
                        // To be safe, let's look at available product options if any
                        if (item.options && item.options.length > 0) {
                            const optName = item.options[0].name || '';
                            const optMatch = optName.match(/(\d+)\s*KG/i);
                            if (optMatch) weight = parseFloat(optMatch[1]);
                        }
                    }

                    if (weight > 0) {
                        const totalItemWeight = weight * qty;
                        puntoData.totalKilos += totalItemWeight;

                        // Categorize flavor
                        if (productName.includes('BIG DOG')) {
                            if (productName.includes('POLLO')) puntoData.flavors['BIG DOG POLLO'] += totalItemWeight;
                            else if (productName.includes('VACA')) puntoData.flavors['BIG DOG VACA'] += totalItemWeight;
                        } else if (productName.includes('GATO')) {
                            if (productName.includes('POLLO')) puntoData.flavors['GATO POLLO'] += totalItemWeight;
                            else if (productName.includes('VACA')) puntoData.flavors['GATO VACA'] += totalItemWeight;
                            else if (productName.includes('CORDERO')) puntoData.flavors['GATO CORDERO'] += totalItemWeight;
                        } else if (productName.includes('HUESO')) {
                            puntoData.flavors['HUESOS CARNOSOS'] += totalItemWeight;
                        } else {
                            // Standard Perro
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
    }, [ordersForDate, puntosEnvio]);

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
            {/* Table 1: Summary Metrics */}
            <Card>
                <CardHeader>
                    <CardTitle>Resumen General por Puntos de Venta</CardTitle>
                    <CardDescription>Métricas totales para el día {formattedDate}</CardDescription>
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
        </div>
    );
}
