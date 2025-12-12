'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/design-system/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/design-system/components/ui/select';
import { Label } from '@repo/design-system/components/ui/label';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { DetalleEnvio } from '@repo/data-services';

interface DetalleTableProps {
    data: DetalleEnvio[];
}

export function DetalleTable({ data }: DetalleTableProps) {
    // Obtener años y meses únicos de los datos
    const availableYears = useMemo(() => {
        const years = new Set<string>();
        data.forEach((detalle) => {
            if (detalle.fecha) {
                const [year] = detalle.fecha.split('-');
                years.add(year);
            }
        });
        return Array.from(years).sort((a, b) => parseInt(b) - parseInt(a)); // Más reciente primero
    }, [data]);

    const availableMonths = useMemo(() => {
        const months = new Set<string>();
        data.forEach((detalle) => {
            if (detalle.fecha) {
                const [, month] = detalle.fecha.split('-');
                months.add(month);
            }
        });
        return Array.from(months).sort((a, b) => parseInt(a) - parseInt(b)); // 01-12
    }, [data]);

    // Estado para filtros
    const [selectedYear, setSelectedYear] = useState<string>('');
    const [selectedMonth, setSelectedMonth] = useState<string>('');

    // Obtener meses disponibles para el año seleccionado
    // Si hay un año seleccionado, mostrar todos los meses del año (01-12)
    // Si no hay año seleccionado, mostrar solo los meses que tienen datos
    const monthsForSelectedYear = useMemo(() => {
        if (!selectedYear) {
            // Sin año seleccionado: mostrar solo meses que tienen datos
            return availableMonths;
        }
        // Con año seleccionado: mostrar todos los meses del año (01-12)
        return Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
    }, [selectedYear, availableMonths]);

    // Obtener año y mes actual si no hay selección
    const getCurrentDate = () => {
        const now = new Date();
        return {
            year: now.getFullYear().toString(),
            month: String(now.getMonth() + 1).padStart(2, '0'),
        };
    };

    // Inicializar con año y mes actual si hay datos
    useEffect(() => {
        if (data.length > 0 && !selectedYear && !selectedMonth && availableYears.length > 0) {
            const { year } = getCurrentDate();
            if (availableYears.includes(year)) {
                setSelectedYear(year);
            } else {
                setSelectedYear(availableYears[0]);
            }
        }
    }, [data.length, availableYears, selectedYear, selectedMonth]);

    // Establecer mes después de que se establezca el año
    useEffect(() => {
        if (selectedYear && !selectedMonth && monthsForSelectedYear.length > 0) {
            const { month } = getCurrentDate();
            if (monthsForSelectedYear.includes(month)) {
                setSelectedMonth(month);
            } else {
                setSelectedMonth(monthsForSelectedYear[0]);
            }
        }
    }, [selectedYear, selectedMonth, monthsForSelectedYear]);
    const formatMonthName = (monthStr: string) => {
        const [year, month] = monthStr.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        return format(date, 'MMMM yyyy', { locale: es });
    };

    const formatWeight = (weight: number) => {
        // Si el número es entero, mostrar sin decimales
        if (weight === Math.floor(weight)) {
            return weight.toString();
        }
        // Si tiene decimales, mostrar solo si no son .00
        const formatted = weight.toFixed(2);
        return formatted.endsWith('.00') ? weight.toFixed(0) : formatted;
    };

    // Filtrar y convertir datos según los filtros seleccionados
    const filteredAndConvertedData = useMemo(() => {
        let filtered = data;

        // Filtrar por año si está seleccionado
        if (selectedYear) {
            filtered = filtered.filter((detalle) => {
                if (!detalle.fecha) return false;
                const [year] = detalle.fecha.split('-');
                return year === selectedYear;
            });
        }

        // Filtrar por mes si está seleccionado
        if (selectedMonth) {
            filtered = filtered.filter((detalle) => {
                if (!detalle.fecha) return false;
                const [, month] = detalle.fecha.split('-');
                return month === selectedMonth;
            });
        }

        // Convertir a formato ProductQuantity
        return filtered.map((detalle) => ({
            month: detalle.fecha, // fecha contiene el mes en formato "YYYY-MM"
            pollo: detalle.pollo,
            vaca: detalle.vaca,
            cerdo: detalle.cerdo,
            cordero: detalle.cordero,
            bigDogPollo: detalle.bigDogPollo,
            bigDogVaca: detalle.bigDogVaca,
            totalPerro: detalle.totalPerro,
            gatoPollo: detalle.gatoPollo,
            gatoVaca: detalle.gatoVaca,
            gatoCordero: detalle.gatoCordero,
            totalGato: detalle.totalGato,
            huesosCarnosos: detalle.huesosCarnosos,
            totalMes: detalle.totalMes,
        })).sort((a, b) => b.month.localeCompare(a.month)); // Ordenar por fecha descendente
    }, [data, selectedYear, selectedMonth]);

    const monthNames = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    return (
        <Card>
            <CardHeader>
                <CardTitle>Envíos en el Día</CardTitle>
                <CardDescription>Cantidad total en KG por mes para envíos en el día</CardDescription>
            </CardHeader>
            <CardContent>
                {/* Filtros de Mes y Año */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label className="text-sm font-medium mb-2 block">Año</Label>
                            <Select
                                value={selectedYear || 'all'}
                                onValueChange={(value) => {
                                    if (value === 'all') {
                                        setSelectedYear('');
                                    } else {
                                        setSelectedYear(value);
                                        // Si el mes seleccionado no está disponible para el nuevo año, limpiarlo
                                        if (selectedMonth) {
                                            const monthsInYear = new Set<string>();
                                            data.forEach((detalle) => {
                                                if (detalle.fecha) {
                                                    const [year, month] = detalle.fecha.split('-');
                                                    if (year === value) {
                                                        monthsInYear.add(month);
                                                    }
                                                }
                                            });
                                            if (!monthsInYear.has(selectedMonth)) {
                                                setSelectedMonth('');
                                            }
                                        }
                                    }
                                }}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Todos los años" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos los años</SelectItem>
                                    {availableYears.map((year) => (
                                        <SelectItem key={year} value={year}>
                                            {year}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label className="text-sm font-medium mb-2 block">Mes</Label>
                            <Select
                                value={selectedMonth || 'all'}
                                onValueChange={(value) => {
                                    if (value === 'all') {
                                        setSelectedMonth('');
                                    } else {
                                        setSelectedMonth(value);
                                    }
                                }}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Todos los meses" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos los meses</SelectItem>
                                    {monthsForSelectedYear.map((month) => (
                                        <SelectItem key={month} value={month}>
                                            {monthNames[parseInt(month) - 1]}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b">
                                <th className="text-left p-2 font-medium">Mes</th>
                                {/* Productos Perro */}
                                <th className="text-center p-2 font-medium bg-blue-50">Pollo</th>
                                <th className="text-center p-2 font-medium bg-blue-50">Vaca</th>
                                <th className="text-center p-2 font-medium bg-blue-50">Cerdo</th>
                                <th className="text-center p-2 font-medium bg-blue-50">Cordero</th>
                                <th className="text-center p-2 font-medium bg-blue-50">Big Dog Pollo</th>
                                <th className="text-center p-2 font-medium bg-blue-50">Big Dog Vaca</th>
                                <th className="text-center p-2 font-medium bg-blue-100 font-bold">Total Perro</th>
                                {/* Productos Gato */}
                                <th className="text-center p-2 font-medium bg-orange-50">Gato Pollo</th>
                                <th className="text-center p-2 font-medium bg-orange-50">Gato Vaca</th>
                                <th className="text-center p-2 font-medium bg-orange-50">Gato Cordero</th>
                                <th className="text-center p-2 font-medium bg-orange-100 font-bold">Total Gato</th>
                                {/* Otros */}
                                <th className="text-center p-2 font-medium bg-gray-50">Huesos Carnosos</th>
                                {/* Total */}
                                <th className="text-center p-2 font-medium bg-green-100 font-bold">Total Mes</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAndConvertedData.length === 0 ? (
                                <tr>
                                    <td colSpan={14} className="text-center p-8 text-muted-foreground">
                                        {selectedYear || selectedMonth
                                            ? 'No hay datos disponibles para el período seleccionado'
                                            : 'No hay datos disponibles'}
                                    </td>
                                </tr>
                            ) : (
                                filteredAndConvertedData.map((row, index) => (
                                    <tr key={row.month} className={`border-b ${index % 2 === 0 ? 'bg-gray-50' : ''}`}>
                                        <td className="p-2 font-medium">{formatMonthName(row.month)}</td>
                                        {/* Productos Perro */}
                                        <td className="text-center p-2 bg-blue-50">{formatWeight(row.pollo)}</td>
                                        <td className="text-center p-2 bg-blue-50">{formatWeight(row.vaca)}</td>
                                        <td className="text-center p-2 bg-blue-50">{formatWeight(row.cerdo)}</td>
                                        <td className="text-center p-2 bg-blue-50">{formatWeight(row.cordero)}</td>
                                        <td className="text-center p-2 bg-blue-50">{formatWeight(row.bigDogPollo)}</td>
                                        <td className="text-center p-2 bg-blue-50">{formatWeight(row.bigDogVaca)}</td>
                                        <td className="text-center p-2 bg-blue-100 font-bold">{formatWeight(row.totalPerro)}</td>
                                        {/* Productos Gato */}
                                        <td className="text-center p-2 bg-orange-50">{formatWeight(row.gatoPollo)}</td>
                                        <td className="text-center p-2 bg-orange-50">{formatWeight(row.gatoVaca)}</td>
                                        <td className="text-center p-2 bg-orange-50">{formatWeight(row.gatoCordero)}</td>
                                        <td className="text-center p-2 bg-orange-100 font-bold">{formatWeight(row.totalGato)}</td>
                                        {/* Otros */}
                                        <td className="text-center p-2 bg-gray-50">{formatWeight(row.huesosCarnosos)}</td>
                                        {/* Total */}
                                        <td className="text-center p-2 bg-green-100 font-bold">{formatWeight(row.totalMes)}</td>
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

