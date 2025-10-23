'use client';

import { useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Card } from '@repo/design-system/components/ui/card';
import { Badge } from '@repo/design-system/components/ui/badge';
import { ArrowLeft, Calendar } from 'lucide-react';
import { Button } from '@repo/design-system/components/ui/button';
import { Input } from '@repo/design-system/components/ui/input';
import Link from 'next/link';
import { MatrixTableClient } from '../../components/MatrixTableClient';
import type { ProductoMatrixData } from '@repo/data-services';

interface MatrizPageClientProps {
    matrix: ProductoMatrixData[];
    productNames: string[];
    fromInicial?: string;
    toInicial?: string;
}

export function MatrizPageClient({ matrix, productNames, fromInicial, toInicial }: MatrizPageClientProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [fromDate, setFromDate] = useState(fromInicial || '');
    const [toDate, setToDate] = useState(toInicial || '');

    const handleAplicarFiltro = () => {
        const params = new URLSearchParams(searchParams);

        if (fromDate) {
            params.set('from', fromDate);
        } else {
            params.delete('from');
        }

        if (toDate) {
            params.set('to', toDate);
        } else {
            params.delete('to');
        }

        router.push(`${pathname}?${params.toString()}`);
    };

    const handleLimpiarFiltro = () => {
        setFromDate('');
        setToDate('');
        router.push(pathname);
    };

    const formatDateRange = () => {
        if (!fromInicial && !toInicial) return '';

        const formatDate = (dateStr: string) => {
            const date = new Date(dateStr);
            return date.toLocaleDateString('es-AR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        };

        if (fromInicial && toInicial) {
            return `${formatDate(fromInicial)} - ${formatDate(toInicial)}`;
        } else if (fromInicial) {
            return `Desde ${formatDate(fromInicial)}`;
        } else if (toInicial) {
            return `Hasta ${formatDate(toInicial)}`;
        }
        return '';
    };

    return (
        <div className="h-full w-full">
            <div className="mb-5 p-5">
                <div className="flex items-center gap-4 mb-4">
                    <Link href="/admin/mayoristas">
                        <Button variant="ghost" size="sm">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Volver a Puntos de Venta
                        </Button>
                    </Link>
                </div>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">
                            Matriz de Productos por Punto de Venta
                        </h1>
                        <p className="text-muted-foreground">
                            Cantidades compradas de cada producto por punto de venta. Para productos en KG se muestran kilos, para productos en gramos se muestra la cantidad. Haz clic en las columnas para ordenar.
                        </p>
                    </div>

                    {/* Selector de rango de fechas */}
                    <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-gray-500" />
                        <div className="flex items-center gap-2">
                            <Input
                                type="date"
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                                className="w-[150px]"
                                placeholder="Desde"
                            />
                            <span className="text-gray-500">-</span>
                            <Input
                                type="date"
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                                className="w-[150px]"
                                placeholder="Hasta"
                            />
                        </div>

                        <Button
                            onClick={handleAplicarFiltro}
                            size="sm"
                        >
                            Aplicar
                        </Button>

                        {(fromInicial || toInicial) && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleLimpiarFiltro}
                            >
                                Ver Todo
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {matrix.length === 0 ? (
                <div className="text-center p-12">
                    <div className="text-gray-500 mb-4">
                        No hay datos disponibles
                        {(fromInicial || toInicial) && ` para el período ${formatDateRange()}`}
                    </div>
                    <p className="text-sm text-gray-400">
                        Asegúrate de crear órdenes mayoristas con punto de venta seleccionado.
                    </p>
                    {(fromInicial || toInicial) && (
                        <Button
                            variant="outline"
                            onClick={handleLimpiarFiltro}
                            className="mt-4"
                        >
                            Ver toda la matriz
                        </Button>
                    )}
                </div>
            ) : (
                <div className="px-5 space-y-6">
                    {/* Resumen */}
                    <div className="flex gap-4">
                        <Badge variant="outline" className="px-4 py-2">
                            {matrix.length} puntos de venta
                        </Badge>
                        <Badge variant="outline" className="px-4 py-2">
                            {productNames.length} productos
                        </Badge>
                        <Badge variant="outline" className="px-4 py-2">
                            {matrix.reduce((sum, row) => sum + row.totalKilos, 0).toLocaleString('es-AR')} kg totales
                        </Badge>
                    </div>

                    {/* Tabla con client component para sorting */}
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold mb-4">
                            Matriz de Productos
                            {(fromInicial || toInicial) && (
                                <span className="text-base font-normal text-gray-500 ml-2">
                                    - {formatDateRange()}
                                </span>
                            )}
                        </h3>
                        <MatrixTableClient matrix={matrix} productNames={productNames} />
                    </Card>
                </div>
            )}
        </div>
    );
}

