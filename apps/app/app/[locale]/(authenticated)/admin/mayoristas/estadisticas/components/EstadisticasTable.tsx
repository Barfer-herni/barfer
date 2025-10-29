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
            return <ArrowUpDown className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2 opacity-50" />;
        }
        return sortDirection === 'asc' ? (
            <ArrowUp className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2" />
        ) : (
            <ArrowDown className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2" />
        );
    };

    return (
        <div className="overflow-x-auto -mx-3 sm:mx-0">
            <table className="w-full min-w-[800px]">
                <thead className="bg-gray-50 border-b-2">
                    <tr>
                        <th
                            onClick={() => handleSort('nombre')}
                            className="px-2 sm:px-4 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors whitespace-nowrap"
                        >
                            <div className="flex items-center">
                                Punto de Venta
                                <SortIcon field="nombre" />
                            </div>
                        </th>
                        <th
                            onClick={() => handleSort('zona')}
                            className="px-2 sm:px-4 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors whitespace-nowrap"
                        >
                            <div className="flex items-center">
                                Zona
                                <SortIcon field="zona" />
                            </div>
                        </th>
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                            Teléfono
                        </th>
                        <th
                            onClick={() => handleSort('kgTotales')}
                            className="px-2 sm:px-4 py-2 sm:py-3 text-center text-[10px] sm:text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors whitespace-nowrap"
                        >
                            <div className="flex items-center justify-center">
                                KG Totales
                                <SortIcon field="kgTotales" />
                            </div>
                        </th>
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-center text-[10px] sm:text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                            Frecuencia
                        </th>
                        <th
                            onClick={() => handleSort('promedioKgPorPedido')}
                            className="px-2 sm:px-4 py-2 sm:py-3 text-center text-[10px] sm:text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors whitespace-nowrap"
                        >
                            <div className="flex items-center justify-center">
                                Promedio KG
                                <SortIcon field="promedioKgPorPedido" />
                            </div>
                        </th>
                        <th
                            onClick={() => handleSort('kgUltimaCompra')}
                            className="px-2 sm:px-4 py-2 sm:py-3 text-center text-[10px] sm:text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors whitespace-nowrap"
                        >
                            <div className="flex items-center justify-center">
                                KG Última
                                <SortIcon field="kgUltimaCompra" />
                            </div>
                        </th>
                        <th
                            onClick={() => handleSort('totalPedidos')}
                            className="px-2 sm:px-4 py-2 sm:py-3 text-center text-[10px] sm:text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors whitespace-nowrap"
                        >
                            <div className="flex items-center justify-center">
                                Total
                                <SortIcon field="totalPedidos" />
                            </div>
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {sortedStats.map((stat) => (
                        <tr key={stat._id} className="hover:bg-gray-50">
                            <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium">
                                {stat.nombre}
                            </td>
                            <td className="px-2 sm:px-4 py-2 sm:py-3">
                                <Badge variant="secondary" className="text-[10px] sm:text-xs px-1 sm:px-2">
                                    {stat.zona}
                                </Badge>
                            </td>
                            <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-600">
                                {stat.telefono}
                            </td>
                            <td className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs sm:text-sm font-semibold text-green-600">
                                {stat.kgTotales > 0 ? (
                                    `${stat.kgTotales.toLocaleString('es-AR')} kg`
                                ) : (
                                    <span className="text-gray-400">--</span>
                                )}
                            </td>
                            <td className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs sm:text-sm">
                                {stat.frecuenciaCompra}
                            </td>
                            <td className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs sm:text-sm">
                                {stat.promedioKgPorPedido > 0 ? (
                                    `${stat.promedioKgPorPedido.toLocaleString('es-AR')} kg`
                                ) : (
                                    <span className="text-gray-400">--</span>
                                )}
                            </td>
                            <td className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs sm:text-sm">
                                {stat.kgUltimaCompra > 0 ? (
                                    `${stat.kgUltimaCompra.toLocaleString('es-AR')} kg`
                                ) : (
                                    <span className="text-gray-400">--</span>
                                )}
                            </td>
                            <td className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs sm:text-sm">
                                <Badge variant="outline" className="text-[10px] sm:text-xs px-1 sm:px-2">
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

