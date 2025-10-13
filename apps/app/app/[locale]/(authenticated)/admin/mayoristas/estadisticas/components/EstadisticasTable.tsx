'use client';

import { useState, useMemo } from 'react';
import { Badge } from '@repo/design-system/components/ui/badge';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import type { PuntoVentaStats } from '@repo/data-services';

interface EstadisticasTableProps {
    stats: PuntoVentaStats[];
}

type SortField = 'nombre' | 'zona' | 'kgTotales' | 'promedioKgPorPedido' | 'kgUltimaCompra' | 'totalPedidos';
type SortDirection = 'asc' | 'desc';

export function EstadisticasTable({ stats }: EstadisticasTableProps) {
    const [sortField, setSortField] = useState<SortField>('kgTotales');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            // Si es el mismo campo, alternar dirección
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            // Si es un campo nuevo, ordenar descendente por defecto
            setSortField(field);
            setSortDirection('desc');
        }
    };

    const sortedStats = useMemo(() => {
        const sorted = [...stats].sort((a, b) => {
            let aValue: any;
            let bValue: any;

            switch (sortField) {
                case 'nombre':
                    aValue = a.nombre.toLowerCase();
                    bValue = b.nombre.toLowerCase();
                    break;
                case 'zona':
                    aValue = a.zona.toLowerCase();
                    bValue = b.zona.toLowerCase();
                    break;
                case 'kgTotales':
                    aValue = a.kgTotales;
                    bValue = b.kgTotales;
                    break;
                case 'promedioKgPorPedido':
                    aValue = a.promedioKgPorPedido;
                    bValue = b.promedioKgPorPedido;
                    break;
                case 'kgUltimaCompra':
                    aValue = a.kgUltimaCompra;
                    bValue = b.kgUltimaCompra;
                    break;
                case 'totalPedidos':
                    aValue = a.totalPedidos;
                    bValue = b.totalPedidos;
                    break;
                default:
                    return 0;
            }

            if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });

        return sorted;
    }, [stats, sortField, sortDirection]);

    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field) {
            return <ArrowUpDown className="w-4 h-4 ml-2 opacity-50" />;
        }
        return sortDirection === 'asc' ? (
            <ArrowUp className="w-4 h-4 ml-2" />
        ) : (
            <ArrowDown className="w-4 h-4 ml-2" />
        );
    };

    return (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead className="bg-gray-50 border-b-2">
                    <tr>
                        <th
                            onClick={() => handleSort('nombre')}
                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors"
                        >
                            <div className="flex items-center">
                                Punto de Venta
                                <SortIcon field="nombre" />
                            </div>
                        </th>
                        <th
                            onClick={() => handleSort('zona')}
                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors"
                        >
                            <div className="flex items-center">
                                Zona
                                <SortIcon field="zona" />
                            </div>
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Teléfono
                        </th>
                        <th
                            onClick={() => handleSort('kgTotales')}
                            className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors"
                        >
                            <div className="flex items-center justify-center">
                                KG Totales
                                <SortIcon field="kgTotales" />
                            </div>
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                            Frecuencia
                        </th>
                        <th
                            onClick={() => handleSort('promedioKgPorPedido')}
                            className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors"
                        >
                            <div className="flex items-center justify-center">
                                Promedio KG/Pedido
                                <SortIcon field="promedioKgPorPedido" />
                            </div>
                        </th>
                        <th
                            onClick={() => handleSort('kgUltimaCompra')}
                            className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors"
                        >
                            <div className="flex items-center justify-center">
                                KG Última Compra
                                <SortIcon field="kgUltimaCompra" />
                            </div>
                        </th>
                        <th
                            onClick={() => handleSort('totalPedidos')}
                            className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors"
                        >
                            <div className="flex items-center justify-center">
                                Total Pedidos
                                <SortIcon field="totalPedidos" />
                            </div>
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {sortedStats.map((stat) => (
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
    );
}

