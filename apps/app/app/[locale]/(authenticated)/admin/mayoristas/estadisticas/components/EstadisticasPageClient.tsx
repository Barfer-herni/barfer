'use client';

import { useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Card } from '@repo/design-system/components/ui/card';
import { ShoppingCart, Package, Activity, TrendingUp, ArrowLeft, Calendar } from 'lucide-react';
import { Button } from '@repo/design-system/components/ui/button';
import { Input } from '@repo/design-system/components/ui/input';
import Link from 'next/link';
import { EstadisticasTable } from './EstadisticasTable';
import type { PuntoVentaStats } from '@repo/data-services';

interface EstadisticasPageClientProps {
    stats: PuntoVentaStats[];
    fromInicial?: string;
    toInicial?: string;
}

export function EstadisticasPageClient({ stats, fromInicial, toInicial }: EstadisticasPageClientProps) {
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
                            Estadísticas de Puntos de Venta
                        </h1>
                        <p className="text-muted-foreground">
                            Análisis detallado de compras y frecuencia por punto de venta
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

            {stats.length === 0 ? (
                <div className="text-center p-12">
                    <div className="text-gray-500 mb-4">
                        No hay estadísticas disponibles
                        {(fromInicial || toInicial) && ` para el período ${formatDateRange()}`}
                    </div>
                    <p className="text-sm text-gray-400">
                        Las estadísticas se calculan desde órdenes mayoristas que tengan el campo 'punto_de_venta' configurado.
                        <br />
                        Asegúrate de crear órdenes mayoristas seleccionando un punto de venta.
                    </p>
                    {(fromInicial || toInicial) && (
                        <Button
                            variant="outline"
                            onClick={handleLimpiarFiltro}
                            className="mt-4"
                        >
                            Ver todas las estadísticas
                        </Button>
                    )}
                </div>
            ) : (
                <div className="px-5 space-y-6">
                    {/* Cards de resumen */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-100 rounded-full">
                                    <ShoppingCart className="h-6 w-6 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Puntos de Venta</p>
                                    <p className="text-2xl font-bold">{stats.length}</p>
                                </div>
                            </div>
                        </Card>

                        <Card className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-green-100 rounded-full">
                                    <Package className="h-6 w-6 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">KG Totales</p>
                                    <p className="text-2xl font-bold">
                                        {stats.reduce((sum, s) => sum + s.kgTotales, 0).toLocaleString('es-AR')}
                                    </p>
                                </div>
                            </div>
                        </Card>

                        <Card className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-purple-100 rounded-full">
                                    <Activity className="h-6 w-6 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Pedidos Totales</p>
                                    <p className="text-2xl font-bold">
                                        {stats.reduce((sum, s) => sum + s.totalPedidos, 0).toLocaleString('es-AR')}
                                    </p>
                                </div>
                            </div>
                        </Card>

                        <Card className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-orange-100 rounded-full">
                                    <TrendingUp className="h-6 w-6 text-orange-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Promedio por Pedido</p>
                                    <p className="text-2xl font-bold">
                                        {stats.length > 0
                                            ? Math.round(stats.reduce((sum, s) => sum + s.promedioKgPorPedido, 0) / stats.length).toLocaleString('es-AR')
                                            : 0} kg
                                    </p>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Tabla de estadísticas */}
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold mb-4">
                            Estadísticas por Punto de Venta
                            {(fromInicial || toInicial) && (
                                <span className="text-base font-normal text-gray-500 ml-2">
                                    - {formatDateRange()}
                                </span>
                            )}
                        </h3>
                        <EstadisticasTable stats={stats} />
                    </Card>
                </div>
            )}
        </div>
    );
}

