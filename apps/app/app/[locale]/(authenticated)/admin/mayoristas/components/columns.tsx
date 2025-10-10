'use client';

import { type ColumnDef } from '@tanstack/react-table';
import { Badge } from '@repo/design-system/components/ui/badge';
import { ZONA_TRANSLATIONS, FRECUENCIA_TRANSLATIONS, TIPO_NEGOCIO_TRANSLATIONS } from '../constants';
import type { Mayorista } from '@repo/data-services';

export const columns: ColumnDef<Mayorista>[] = [
    {
        accessorKey: 'nombre',
        header: 'Nombre del Punto de Venta',
        cell: ({ row }) => {
            return (
                <div className="min-w-[180px] font-medium text-sm">
                    {row.getValue('nombre')}
                </div>
            );
        },
    },
    {
        accessorKey: 'zona',
        header: 'Zona',
        cell: ({ row }) => {
            const zona = row.getValue('zona') as string;
            const zonaLabel = ZONA_TRANSLATIONS[zona] || zona;
            return (
                <div className="min-w-[100px]">
                    <Badge variant="secondary" className="text-xs">
                        {zonaLabel}
                    </Badge>
                </div>
            );
        },
    },
    {
        id: 'kilosUltimoMes',
        header: 'Kilos Último Mes',
        cell: ({ row }) => {
            const mayorista = row.original;
            const now = new Date();
            const mesActual = now.getMonth() + 1;
            const anioActual = now.getFullYear();

            const kilosUltimoMes = mayorista.kilosPorMes?.find(
                k => k.mes === mesActual && k.anio === anioActual
            )?.kilos || 0;

            return (
                <div className="min-w-[120px] text-sm text-center">
                    {kilosUltimoMes > 0 ? (
                        <span className="font-semibold text-green-600">
                            {kilosUltimoMes.toLocaleString('es-AR')} kg
                        </span>
                    ) : (
                        <span className="text-gray-400">Sin datos</span>
                    )}
                </div>
            );
        },
    },
    {
        accessorKey: 'frecuencia',
        header: 'Frecuencia',
        cell: ({ row }) => {
            const frecuencia = row.getValue('frecuencia') as string;
            const frecuenciaLabel = FRECUENCIA_TRANSLATIONS[frecuencia] || frecuencia;

            return (
                <div className="min-w-[100px] text-sm text-center">
                    {frecuenciaLabel}
                </div>
            );
        },
    },
    {
        accessorKey: 'fechaInicioVentas',
        header: 'Cliente Desde',
        cell: ({ row }) => {
            const fecha = row.getValue('fechaInicioVentas') as string | Date;
            const date = typeof fecha === 'string' ? new Date(fecha) : fecha;

            const formatted = date.toLocaleDateString('es-AR', {
                year: 'numeric',
                month: 'short',
            });

            return (
                <div className="min-w-[100px] text-sm text-center">
                    {formatted}
                </div>
            );
        },
    },
    {
        accessorKey: 'tieneFreezer',
        header: 'Freezer Nuestro',
        cell: ({ row }) => {
            const tieneFreezer = row.getValue('tieneFreezer') as boolean;

            return (
                <div className="min-w-[120px] text-center">
                    {tieneFreezer ? (
                        <Badge variant="default" className="bg-green-500">Sí</Badge>
                    ) : (
                        <Badge variant="secondary">No</Badge>
                    )}
                </div>
            );
        },
    },
    {
        accessorKey: 'capacidadFreezer',
        header: 'Capacidad Freezer',
        cell: ({ row }) => {
            const capacidad = row.getValue('capacidadFreezer') as number | undefined;
            const tieneFreezer = row.original.tieneFreezer;

            return (
                <div className="min-w-[100px] text-sm text-center">
                    {tieneFreezer && capacidad ? (
                        `${capacidad}L`
                    ) : (
                        <span className="text-gray-400">--</span>
                    )}
                </div>
            );
        },
    },
    {
        accessorKey: 'tipoNegocio',
        header: 'Tipo de Negocio',
        cell: ({ row }) => {
            const tipo = row.getValue('tipoNegocio') as string;
            const tipoLabel = TIPO_NEGOCIO_TRANSLATIONS[tipo] || tipo;

            return (
                <div className="min-w-[150px] text-sm">
                    {tipoLabel}
                </div>
            );
        },
    },
];

