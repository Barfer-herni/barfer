'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/design-system/components/ui/card';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ProductQuantity {
    month: string;
    // Productos Perro
    pollo: number;
    vaca: number;
    cerdo: number;
    cordero: number;
    bigDogPollo: number;
    bigDogVaca: number;
    totalPerro: number;
    // Productos Gato
    gatoPollo: number;
    gatoVaca: number;
    gatoCordero: number;
    totalGato: number;
    // Otros
    huesosCarnosos: number;
    // Total del mes
    totalMes: number;
}

interface QuantityTableProps {
    data: ProductQuantity[];
    title: string;
    description: string;
}

export function QuantityTable({ data, title, description }: QuantityTableProps) {
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

    if (!data || data.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>{title}</CardTitle>
                    <CardDescription>{description}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                        <p>No hay datos disponibles para este período</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
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
                            {data.map((row, index) => (
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
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
} 