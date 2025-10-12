import { getPuntosVentaStatsAction } from '../actions';
import { Card } from '@repo/design-system/components/ui/card';
import { Badge } from '@repo/design-system/components/ui/badge';
import { ShoppingCart, Package, Activity, TrendingUp, ArrowLeft } from 'lucide-react';
import { Button } from '@repo/design-system/components/ui/button';
import Link from 'next/link';

export default async function EstadisticasPage() {
    const result = await getPuntosVentaStatsAction();
    const stats = result.success && result.stats ? result.stats : [];

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
                <div>
                    <h1 className="text-2xl font-bold">
                        Estadísticas de Puntos de Venta
                    </h1>
                    <p className="text-muted-foreground">
                        Análisis detallado de compras y frecuencia por punto de venta
                    </p>
                </div>
            </div>

            {stats.length === 0 ? (
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
        </div>
    );
}

