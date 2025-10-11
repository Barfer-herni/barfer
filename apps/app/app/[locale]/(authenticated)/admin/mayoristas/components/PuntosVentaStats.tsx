'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@repo/design-system/components/ui/dialog';
import { Button } from '@repo/design-system/components/ui/button';
import { Card } from '@repo/design-system/components/ui/card';
import { Badge } from '@repo/design-system/components/ui/badge';
import { BarChart3, TrendingUp, Package, Activity, ShoppingCart } from 'lucide-react';
import { getPuntosVentaStatsAction } from '../actions';
import type { PuntoVentaStats } from '@repo/data-services';

export function PuntosVentaStats() {
    const [stats, setStats] = useState<PuntoVentaStats[]>([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const handleOpen = async () => {
        setIsOpen(true);
        setLoading(true);
        try {
            console.log('🔄 Cargando estadísticas de puntos de venta...');
            const result = await getPuntosVentaStatsAction();
            console.log('📊 Resultado:', result);

            if (result.success && result.stats) {
                console.log(`✅ ${result.stats.length} estadísticas cargadas`);
                setStats(result.stats);
            } else {
                console.error('❌ Error:', result.error);
            }
        } catch (error) {
            console.error('❌ Error al cargar estadísticas:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    onClick={handleOpen}
                    className="border-purple-500 text-purple-600 hover:bg-purple-50"
                >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Ver Estadísticas
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Estadísticas de Puntos de Venta</DialogTitle>
                </DialogHeader>

                {loading ? (
                    <div className="flex items-center justify-center p-12">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                            <p className="mt-4 text-gray-600">Calculando estadísticas...</p>
                        </div>
                    </div>
                ) : stats.length === 0 ? (
                    <div className="text-center p-12">
                        <div className="text-gray-500 mb-4">
                            No hay estadísticas disponibles
                        </div>
                        <p className="text-sm text-gray-400">
                            Las estadísticas se calculan desde órdenes mayoristas que tengan el campo 'punto_de_venta' configurado.
                            <br />
                            Asegúrate de crear órdenes mayoristas seleccionando un punto de venta.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">
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
                            <h3 className="text-lg font-semibold mb-4">Estadísticas por Punto de Venta</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b-2">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                Punto de Venta
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                Zona
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                Teléfono
                                            </th>
                                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                                KG Totales
                                            </th>
                                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                                Frecuencia
                                            </th>
                                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                                Promedio KG/Pedido
                                            </th>
                                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                                KG Última Compra
                                            </th>
                                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                                Total Pedidos
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {stats.map((stat) => (
                                            <tr key={stat._id} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 text-sm font-medium">
                                                    {stat.nombre}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Badge variant="secondary" className="text-xs">
                                                        {stat.zona}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-600">
                                                    {stat.telefono}
                                                </td>
                                                <td className="px-4 py-3 text-center text-sm font-semibold text-green-600">
                                                    {stat.kgTotales > 0 ? (
                                                        `${stat.kgTotales.toLocaleString('es-AR')} kg`
                                                    ) : (
                                                        <span className="text-gray-400">--</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-center text-sm">
                                                    {stat.frecuenciaCompra}
                                                </td>
                                                <td className="px-4 py-3 text-center text-sm">
                                                    {stat.promedioKgPorPedido > 0 ? (
                                                        `${stat.promedioKgPorPedido.toLocaleString('es-AR')} kg`
                                                    ) : (
                                                        <span className="text-gray-400">--</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-center text-sm">
                                                    {stat.kgUltimaCompra > 0 ? (
                                                        `${stat.kgUltimaCompra.toLocaleString('es-AR')} kg`
                                                    ) : (
                                                        <span className="text-gray-400">--</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-center text-sm">
                                                    <Badge variant="outline">
                                                        {stat.totalPedidos}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

