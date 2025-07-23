'use client'

import { useState } from 'react';
import { Dictionary } from '@repo/internationalization';
import { BalanceMonthlyData } from '@repo/data-services';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@repo/design-system/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/design-system/components/ui/card';
import { Badge } from '@repo/design-system/components/ui/badge';
import { Button } from '@repo/design-system/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/design-system/components/ui/tabs';
import { Download, TrendingUp, TrendingDown, DollarSign, Package, Users, AlertTriangle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface BalanceTableProps {
    data: BalanceMonthlyData[];
    dictionary: Dictionary;
}

export function BalanceTable({ data, dictionary }: BalanceTableProps) {
    const [filteredData, setFilteredData] = useState(data);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    const formatAxisValue = (value: number) => {
        if (value >= 1000000) {
            return `${(value / 1000000).toFixed(1)}M`;
        } else if (value >= 1000) {
            return `${(value / 1000).toFixed(1)}K`;
        }
        return value.toString();
    };

    const formatPercentage = (percentage: number) => {
        const color = percentage >= 0 ? 'text-green-600' : 'text-red-600';
        const sign = percentage >= 0 ? '+' : '';
        return (
            <span className={`font-medium ${color}`}>
                {sign}{percentage.toFixed(1)}%
            </span>
        );
    };

    const formatMonthName = (monthKey: string) => {
        const [year, month] = monthKey.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        return date.toLocaleDateString('es-AR', {
            year: 'numeric',
            month: 'short'
        }).replace('.', '');
    };

    const getRowColor = (resultadoSinExtraordinarios: number, resultadoConExtraordinarios: number) => {
        // Usar el resultado sin extraordinarios para el color principal
        if (resultadoSinExtraordinarios > 0) return 'bg-green-50/50 hover:bg-green-100/50 border-l-4 border-l-green-500';
        if (resultadoSinExtraordinarios < 0) return 'bg-red-50/50 hover:bg-red-100/50 border-l-4 border-l-red-500';
        return 'hover:bg-muted/30 border-l-4 border-l-gray-300';
    };

    return (
        <div className="space-y-6">
            {/* Header con controles */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <DollarSign className="h-5 w-5 text-green-600" />
                            <span>Balance Financiero</span>
                        </div>
                        <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Exportar
                        </Button>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        Análisis mensual de ingresos y gastos del negocio.
                        <span className="text-green-600 font-medium"> Verde</span> = ganancias,
                        <span className="text-red-600 font-medium"> Rojo</span> = pérdidas.
                    </p>
                </CardContent>
            </Card>

            <Tabs defaultValue="resumen" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="resumen">📊 Resumen</TabsTrigger>
                    <TabsTrigger value="detallado">📋 Detallado</TabsTrigger>
                    <TabsTrigger value="comparativo">📈 Comparativo</TabsTrigger>
                </TabsList>

                {/* Tabla Resumen - Más compacta */}
                <TabsContent value="resumen">
                    <div className="space-y-6">
                        <Card>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-muted/30">
                                                <TableHead className="font-bold w-32">Mes</TableHead>
                                                <TableHead className="text-center font-bold w-28">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <Package className="h-4 w-4 text-blue-600" />
                                                        <span>Minor.</span>
                                                    </div>
                                                </TableHead>
                                                <TableHead className="text-center font-bold w-28">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <Users className="h-4 w-4 text-purple-600" />
                                                        <span>Mayor.</span>
                                                    </div>
                                                </TableHead>
                                                <TableHead className="text-center font-bold w-28">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <TrendingUp className="h-4 w-4 text-orange-600" />
                                                        <span>Express</span>
                                                    </div>
                                                </TableHead>
                                                <TableHead className="text-center font-bold w-32">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <TrendingUp className="h-4 w-4 text-green-600" />
                                                        <span>Ingresos</span>
                                                    </div>
                                                </TableHead>
                                                <TableHead className="text-center font-bold w-32">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <TrendingDown className="h-4 w-4 text-blue-600" />
                                                        <span>G. Ordinarios</span>
                                                    </div>
                                                </TableHead>
                                                <TableHead className="text-center font-bold w-32">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <AlertTriangle className="h-4 w-4 text-red-600" />
                                                        <span>G. Extra</span>
                                                    </div>
                                                </TableHead>
                                                <TableHead className="text-center font-bold w-32">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <TrendingDown className="h-4 w-4 text-red-600" />
                                                        <span>Gastos</span>
                                                    </div>
                                                </TableHead>
                                                <TableHead className="text-center font-bold w-32">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <DollarSign className="h-4 w-4 text-green-600" />
                                                        <span>Sin Extra.</span>
                                                    </div>
                                                </TableHead>
                                                <TableHead className="text-center font-bold w-32">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <DollarSign className="h-4 w-4 text-blue-600" />
                                                        <span>Con Extra.</span>
                                                    </div>
                                                </TableHead>
                                                <TableHead className="text-center font-bold w-24">$/Kg</TableHead>
                                            </TableRow>
                                        </TableHeader>

                                        <TableBody>
                                            {filteredData.map((row) => (
                                                <TableRow key={row.mes} className={`${getRowColor(row.resultadoSinExtraordinarios, row.resultadoConExtraordinarios)} transition-colors`}>
                                                    {/* Mes */}
                                                    <TableCell className="font-medium">
                                                        <div className="text-sm">
                                                            {formatMonthName(row.mes)}
                                                        </div>
                                                    </TableCell>

                                                    {/* Minorista */}
                                                    <TableCell className="text-center">
                                                        <div className="space-y-1">
                                                            <div className="text-sm font-mono font-medium">
                                                                {formatCurrency(row.entradasMinorista)}
                                                            </div>
                                                            <div className="text-xs text-muted-foreground">
                                                                {row.cantVentasMinorista} ventas
                                                            </div>
                                                        </div>
                                                    </TableCell>

                                                    {/* Mayorista */}
                                                    <TableCell className="text-center">
                                                        <div className="space-y-1">
                                                            <div className="text-sm font-mono font-medium">
                                                                {formatCurrency(row.entradasMayorista)}
                                                            </div>
                                                            <div className="text-xs text-muted-foreground">
                                                                {row.cantVentasMayorista} ventas
                                                            </div>
                                                        </div>
                                                    </TableCell>

                                                    {/* Express */}
                                                    <TableCell className="text-center">
                                                        <div className="space-y-1">
                                                            <div className="text-sm font-mono font-medium">
                                                                {formatCurrency(row.entradasExpress)}
                                                            </div>
                                                            <div className="text-xs text-muted-foreground">
                                                                {row.cantVentasExpress} ventas
                                                            </div>
                                                        </div>
                                                    </TableCell>

                                                    {/* Ingresos Totales */}
                                                    <TableCell className="text-center">
                                                        <div className="font-mono font-bold text-green-700">
                                                            {formatCurrency(row.entradasTotales)}
                                                        </div>
                                                    </TableCell>

                                                    {/* Gastos Ordinarios */}
                                                    <TableCell className="text-center">
                                                        <div className="font-mono font-medium text-blue-600">
                                                            {formatCurrency(row.gastosOrdinariosTotal)}
                                                        </div>
                                                    </TableCell>

                                                    {/* Gastos Extraordinarios */}
                                                    <TableCell className="text-center">
                                                        <div className="font-mono font-medium text-red-600">
                                                            {formatCurrency(row.gastosExtraordinariosTotal)}
                                                        </div>
                                                    </TableCell>

                                                    {/* Gastos Totales */}
                                                    <TableCell className="text-center">
                                                        <div className="font-mono font-medium text-red-600">
                                                            {formatCurrency(row.salidas)}
                                                        </div>
                                                    </TableCell>

                                                    {/* Resultado Sin Extraordinarios */}
                                                    <TableCell className="text-center">
                                                        <div className="space-y-1">
                                                            <div className={`font-mono font-bold text-lg ${row.resultadoSinExtraordinarios >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                                {formatCurrency(row.resultadoSinExtraordinarios)}
                                                            </div>
                                                            <div className="text-xs">
                                                                {formatPercentage(row.porcentajeSinExtraordinarios)}
                                                            </div>
                                                        </div>
                                                    </TableCell>

                                                    {/* Resultado Con Extraordinarios */}
                                                    <TableCell className="text-center">
                                                        <div className="space-y-1">
                                                            <div className={`font-mono font-bold text-lg ${row.resultadoConExtraordinarios >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                                {formatCurrency(row.resultadoConExtraordinarios)}
                                                            </div>
                                                            <div className="text-xs">
                                                                {formatPercentage(row.porcentajeConExtraordinarios)}
                                                            </div>
                                                        </div>
                                                    </TableCell>

                                                    {/* Precio por KG */}
                                                    <TableCell className="text-center">
                                                        <div className="font-mono text-sm">
                                                            {row.precioPorKg > 0 ? formatCurrency(row.precioPorKg) : '-'}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                {filteredData.length === 0 && (
                                    <div className="text-center py-12 text-muted-foreground">
                                        <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                                        <p className="text-lg font-medium">No hay datos de balance</p>
                                        <p className="text-sm">Agrega algunas órdenes para ver el análisis financiero</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Gráfico de Evolución */}
                        {filteredData.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <TrendingUp className="h-5 w-5 text-blue-600" />
                                        Evolución Mensual
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-6">
                                        {/* Gráfico de Ingresos vs Gastos */}
                                        <div>
                                            <h4 className="text-sm font-medium mb-3">Ingresos vs Gastos</h4>
                                            <ResponsiveContainer width="100%" height={300}>
                                                <BarChart data={filteredData.map(row => ({
                                                    mes: formatMonthName(row.mes),
                                                    ingresos: row.entradasTotales,
                                                    gastosOrdinarios: row.gastosOrdinariosTotal,
                                                    gastosExtraordinarios: row.gastosExtraordinariosTotal,
                                                    gastosTotales: row.salidas
                                                }))}>
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis dataKey="mes" />
                                                    <YAxis tickFormatter={formatAxisValue} />
                                                    <Tooltip
                                                        formatter={(value, name) => [
                                                            formatCurrency(Number(value)),
                                                            name === 'ingresos' ? 'Ingresos' :
                                                                name === 'gastosOrdinarios' ? 'Gastos Ordinarios' :
                                                                    name === 'gastosExtraordinarios' ? 'Gastos Extraordinarios' :
                                                                        'Gastos Totales'
                                                        ]}
                                                    />
                                                    <Legend />
                                                    <Bar dataKey="ingresos" fill="#10b981" name="Ingresos" />
                                                    <Bar dataKey="gastosOrdinarios" fill="#3b82f6" name="Gastos Ordinarios" />
                                                    <Bar dataKey="gastosExtraordinarios" fill="#ef4444" name="Gastos Extraordinarios" />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>

                                        {/* Gráfico de Resultados */}
                                        <div>
                                            <h4 className="text-sm font-medium mb-3">Resultados</h4>
                                            <ResponsiveContainer width="100%" height={300}>
                                                <LineChart data={filteredData.map(row => ({
                                                    mes: formatMonthName(row.mes),
                                                    sinExtraordinarios: row.resultadoSinExtraordinarios,
                                                    conExtraordinarios: row.resultadoConExtraordinarios
                                                }))}>
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis dataKey="mes" />
                                                    <YAxis tickFormatter={formatAxisValue} />
                                                    <Tooltip
                                                        formatter={(value, name) => [
                                                            formatCurrency(Number(value)),
                                                            name === 'sinExtraordinarios' ? 'Sin Extraordinarios' : 'Con Extraordinarios'
                                                        ]}
                                                    />
                                                    <Legend />
                                                    <Line
                                                        type="monotone"
                                                        dataKey="sinExtraordinarios"
                                                        stroke="#10b981"
                                                        strokeWidth={3}
                                                        name="Sin Extraordinarios"
                                                    />
                                                    <Line
                                                        type="monotone"
                                                        dataKey="conExtraordinarios"
                                                        stroke="#3b82f6"
                                                        strokeWidth={3}
                                                        name="Con Extraordinarios"
                                                    />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>

                                        {/* Nota explicativa sobre el formato de números */}
                                        <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                                            <p className="text-xs text-muted-foreground">
                                                <strong>Nota:</strong> Los números en el eje Y se muestran en formato abreviado para mejor legibilidad:
                                            </p>
                                            <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                                                <li>• 150,000,000 → 150.0M</li>
                                                <li>• 50,000 → 50.0K</li>
                                                <li>• 1,500 → 1.5K</li>
                                            </ul>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                <em>Pasa el mouse sobre los datos para ver los valores completos.</em>
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </TabsContent>

                {/* Tabla Detallada - Con todos los porcentajes */}
                <TabsContent value="detallado">
                    <Card>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/30">
                                            <TableHead rowSpan={2} className="font-bold border-r">Mes</TableHead>

                                            {/* Minorista */}
                                            <TableHead colSpan={4} className="text-center font-bold border-r bg-blue-50">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Package className="h-4 w-4 text-blue-600" />
                                                    Minorista
                                                </div>
                                            </TableHead>

                                            {/* Mayorista */}
                                            <TableHead colSpan={4} className="text-center font-bold border-r bg-purple-50">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Users className="h-4 w-4 text-purple-600" />
                                                    Mayorista
                                                </div>
                                            </TableHead>

                                            {/* Express */}
                                            <TableHead colSpan={4} className="text-center font-bold border-r bg-orange-50">
                                                <div className="flex items-center justify-center gap-2">
                                                    <TrendingUp className="h-4 w-4 text-orange-600" />
                                                    Express
                                                </div>
                                            </TableHead>

                                            {/* Totales */}
                                            <TableHead colSpan={3} className="text-center font-bold border-r bg-green-50">
                                                <div className="flex items-center justify-center gap-2">
                                                    <TrendingUp className="h-4 w-4 text-green-600" />
                                                    Totales
                                                </div>
                                            </TableHead>

                                            {/* Resultado */}
                                            <TableHead colSpan={2} className="text-center font-bold bg-yellow-50">
                                                <div className="flex items-center justify-center gap-2">
                                                    <DollarSign className="h-4 w-4 text-yellow-600" />
                                                    Resultado
                                                </div>
                                            </TableHead>
                                        </TableRow>
                                        <TableRow className="bg-muted/20 text-xs">
                                            <TableHead className="text-center border-r">Ingresos</TableHead>
                                            <TableHead className="text-center">%</TableHead>
                                            <TableHead className="text-center">Ventas</TableHead>
                                            <TableHead className="text-center border-r">%</TableHead>

                                            <TableHead className="text-center border-r">Ingresos</TableHead>
                                            <TableHead className="text-center">%</TableHead>
                                            <TableHead className="text-center">Ventas</TableHead>
                                            <TableHead className="text-center border-r">%</TableHead>

                                            <TableHead className="text-center border-r">Ingresos</TableHead>
                                            <TableHead className="text-center">%</TableHead>
                                            <TableHead className="text-center">Ventas</TableHead>
                                            <TableHead className="text-center border-r">%</TableHead>

                                            <TableHead className="text-center">Total</TableHead>
                                            <TableHead className="text-center">Gastos</TableHead>
                                            <TableHead className="text-center border-r">%</TableHead>

                                            <TableHead className="text-center">Neto</TableHead>
                                            <TableHead className="text-center">%</TableHead>
                                        </TableRow>
                                    </TableHeader>

                                    <TableBody>
                                        {filteredData.map((row) => (
                                            <TableRow key={row.mes} className={`${getRowColor(row.resultadoSinExtraordinarios, row.resultadoConExtraordinarios)} transition-colors`}>
                                                <TableCell className="font-medium border-r">
                                                    {formatMonthName(row.mes)}
                                                </TableCell>

                                                {/* Minorista */}
                                                <TableCell className="text-right font-mono">{formatCurrency(row.entradasMinorista)}</TableCell>
                                                <TableCell className="text-center text-xs">{row.entradasMinoristaPorcentaje.toFixed(0)}%</TableCell>
                                                <TableCell className="text-center">{row.cantVentasMinorista}</TableCell>
                                                <TableCell className="text-center text-xs border-r">{row.cantVentasMinoristaPorcentaje.toFixed(0)}%</TableCell>

                                                {/* Mayorista */}
                                                <TableCell className="text-right font-mono">{formatCurrency(row.entradasMayorista)}</TableCell>
                                                <TableCell className="text-center text-xs">{row.entradasMayoristaPorcentaje.toFixed(0)}%</TableCell>
                                                <TableCell className="text-center">{row.cantVentasMayorista}</TableCell>
                                                <TableCell className="text-center text-xs border-r">{row.cantVentasMayoristaPorcentaje.toFixed(0)}%</TableCell>

                                                {/* Express */}
                                                <TableCell className="text-right font-mono">{formatCurrency(row.entradasExpress)}</TableCell>
                                                <TableCell className="text-center text-xs">{row.entradasExpressPorcentaje.toFixed(0)}%</TableCell>
                                                <TableCell className="text-center">{row.cantVentasExpress}</TableCell>
                                                <TableCell className="text-center text-xs border-r">{row.cantVentasExpressPorcentaje.toFixed(0)}%</TableCell>

                                                {/* Totales */}
                                                <TableCell className="text-right font-mono font-bold text-green-700">{formatCurrency(row.entradasTotales)}</TableCell>
                                                <TableCell className="text-right font-mono text-red-600">{formatCurrency(row.salidas)}</TableCell>
                                                <TableCell className="text-center text-xs border-r">{row.salidasPorcentaje.toFixed(0)}%</TableCell>

                                                {/* Resultado Sin Extraordinarios */}
                                                <TableCell className="text-right font-mono font-bold">
                                                    <span className={row.resultadoSinExtraordinarios >= 0 ? 'text-green-600' : 'text-red-600'}>
                                                        {formatCurrency(row.resultadoSinExtraordinarios)}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {formatPercentage(row.porcentajeSinExtraordinarios)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>



                {/* Tabla Comparativa - Solo lo esencial */}
                <TabsContent value="comparativo">
                    <div className="grid gap-4">
                        <Card>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-muted/30">
                                                <TableHead className="font-bold">Mes</TableHead>
                                                <TableHead className="text-center font-bold">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <TrendingUp className="h-4 w-4 text-green-600" />
                                                        Ingresos vs Mes Anterior
                                                    </div>
                                                </TableHead>
                                                <TableHead className="text-center font-bold">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <TrendingDown className="h-4 w-4 text-red-600" />
                                                        Gastos vs Mes Anterior
                                                    </div>
                                                </TableHead>
                                                <TableHead className="text-center font-bold">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <DollarSign className="h-4 w-4" />
                                                        Resultado vs Anterior
                                                    </div>
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredData.map((row, index) => {
                                                const prevRow = filteredData[index - 1];
                                                const ingresosChange = prevRow ? ((row.entradasTotales - prevRow.entradasTotales) / prevRow.entradasTotales) * 100 : 0;
                                                const gastosChange = prevRow ? ((row.salidas - prevRow.salidas) / prevRow.salidas) * 100 : 0;
                                                const resultadoChange = prevRow ? ((row.resultadoSinExtraordinarios - prevRow.resultadoSinExtraordinarios) / Math.abs(prevRow.resultadoSinExtraordinarios || 1)) * 100 : 0;

                                                return (
                                                    <TableRow key={row.mes} className={getRowColor(row.resultadoSinExtraordinarios, row.resultadoConExtraordinarios)}>
                                                        <TableCell className="font-medium">
                                                            {formatMonthName(row.mes)}
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <div className="space-y-1">
                                                                <div className="font-mono">{formatCurrency(row.entradasTotales)}</div>
                                                                {index > 0 && (
                                                                    <div className="text-xs">
                                                                        {formatPercentage(ingresosChange)}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <div className="space-y-1">
                                                                <div className="font-mono text-red-600">{formatCurrency(row.salidas)}</div>
                                                                {index > 0 && (
                                                                    <div className="text-xs">
                                                                        {formatPercentage(gastosChange)}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <div className="space-y-1">
                                                                <div className={`font-mono font-bold ${row.resultadoSinExtraordinarios >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                                    {formatCurrency(row.resultadoSinExtraordinarios)}
                                                                </div>
                                                                {index > 0 && (
                                                                    <div className="text-xs">
                                                                        {formatPercentage(resultadoChange)}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>

            {/* Resumen en tarjetas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <p className="text-sm font-medium text-green-800">Total Ingresos</p>
                                <p className="text-2xl font-bold text-green-700">
                                    {formatCurrency(filteredData.reduce((sum, row) => sum + row.entradasTotales, 0))}
                                </p>
                            </div>
                            <TrendingUp className="h-8 w-8 text-green-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <p className="text-sm font-medium text-red-800">Total Gastos</p>
                                <p className="text-2xl font-bold text-red-700">
                                    {formatCurrency(filteredData.reduce((sum, row) => sum + row.salidas, 0))}
                                </p>
                            </div>
                            <TrendingDown className="h-8 w-8 text-red-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <p className="text-sm font-medium text-blue-800">Total Ventas</p>
                                <p className="text-2xl font-bold text-blue-700">
                                    {filteredData.reduce((sum, row) => sum + row.cantVentasMinorista + row.cantVentasMayorista + row.cantVentasExpress, 0)}
                                </p>
                            </div>
                            <Package className="h-8 w-8 text-blue-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card className={`bg-gradient-to-br ${filteredData.reduce((sum, row) => sum + row.resultadoSinExtraordinarios, 0) >= 0
                    ? 'from-emerald-50 to-emerald-100 border-emerald-200'
                    : 'from-red-50 to-red-100 border-red-200'
                    }`}>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <p className={`text-sm font-medium ${filteredData.reduce((sum, row) => sum + row.resultadoSinExtraordinarios, 0) >= 0
                                    ? 'text-emerald-800'
                                    : 'text-red-800'
                                    }`}>
                                    Resultado Neto (Sin Extraordinarios)
                                </p>
                                <p className={`text-2xl font-bold ${filteredData.reduce((sum, row) => sum + row.resultadoSinExtraordinarios, 0) >= 0
                                    ? 'text-emerald-700'
                                    : 'text-red-700'
                                    }`}>
                                    {formatCurrency(filteredData.reduce((sum, row) => sum + row.resultadoSinExtraordinarios, 0))}
                                </p>
                            </div>
                            <DollarSign className={`h-8 w-8 ${filteredData.reduce((sum, row) => sum + row.resultadoSinExtraordinarios, 0) >= 0
                                ? 'text-emerald-600'
                                : 'text-red-600'
                                }`} />
                        </div>
                    </CardContent>
                </Card>

                <Card className={`bg-gradient-to-br ${filteredData.reduce((sum, row) => sum + row.resultadoConExtraordinarios, 0) >= 0
                    ? 'from-blue-50 to-blue-100 border-blue-200'
                    : 'from-red-50 to-red-100 border-red-200'
                    }`}>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <p className={`text-sm font-medium ${filteredData.reduce((sum, row) => sum + row.resultadoConExtraordinarios, 0) >= 0
                                    ? 'text-blue-800'
                                    : 'text-red-800'
                                    }`}>
                                    Resultado Neto (Con Extraordinarios)
                                </p>
                                <p className={`text-2xl font-bold ${filteredData.reduce((sum, row) => sum + row.resultadoConExtraordinarios, 0) >= 0
                                    ? 'text-blue-700'
                                    : 'text-red-700'
                                    }`}>
                                    {formatCurrency(filteredData.reduce((sum, row) => sum + row.resultadoConExtraordinarios, 0))}
                                </p>
                            </div>
                            <DollarSign className={`h-8 w-8 ${filteredData.reduce((sum, row) => sum + row.resultadoConExtraordinarios, 0) >= 0
                                ? 'text-blue-600'
                                : 'text-red-600'
                                }`} />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
} 