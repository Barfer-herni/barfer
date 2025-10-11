'use client';

import { type ColumnDef } from '@tanstack/react-table';
import { Badge } from '@repo/design-system/components/ui/badge';
import { ZONA_TRANSLATIONS, TIPO_NEGOCIO_TRANSLATIONS } from '../constants';
import type { Mayorista } from '@repo/data-services';
import { Check, X } from 'lucide-react';

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
        accessorKey: 'contacto.direccion',
        header: 'Dirección',
        cell: ({ row }) => {
            const direccion = row.original.contacto?.direccion || '';
            return (
                <div className="min-w-[180px] text-sm">
                    {direccion || <span className="text-gray-400">--</span>}
                </div>
            );
        },
    },
    {
        accessorKey: 'contacto.telefono',
        header: 'Teléfono',
        cell: ({ row }) => {
            const telefono = row.original.contacto?.telefono || '';
            return (
                <div className="min-w-[130px] text-sm">
                    {telefono || <span className="text-gray-400">--</span>}
                </div>
            );
        },
    },
    {
        accessorKey: 'fechaPrimerPedido',
        header: 'Primer Pedido',
        cell: ({ row }) => {
            const fecha = row.getValue('fechaPrimerPedido') as string | Date | undefined;
            if (!fecha) return <span className="text-gray-400">--</span>;

            const date = typeof fecha === 'string' ? new Date(fecha) : fecha;
            const formatted = date.toLocaleDateString('es-AR', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            });

            return (
                <div className="min-w-[110px] text-sm text-center">
                    {formatted}
                </div>
            );
        },
    },
    {
        accessorKey: 'fechaUltimoPedido',
        header: 'Último Pedido',
        cell: ({ row }) => {
            const fecha = row.getValue('fechaUltimoPedido') as string | Date | undefined;
            if (!fecha) return <span className="text-gray-400">--</span>;

            const date = typeof fecha === 'string' ? new Date(fecha) : fecha;
            const formatted = date.toLocaleDateString('es-AR', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            });

            return (
                <div className="min-w-[110px] text-sm text-center">
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
                        <div className="flex items-center justify-center gap-1">
                            <Check className="w-4 h-4 text-green-600" />
                            <Badge variant="default" className="bg-green-500">Sí</Badge>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center gap-1">
                            <X className="w-4 h-4 text-gray-400" />
                            <Badge variant="secondary">No</Badge>
                        </div>
                    )}
                </div>
            );
        },
    },
    {
        accessorKey: 'cantidadFreezers',
        header: 'Cant',
        cell: ({ row }) => {
            const cantidad = row.getValue('cantidadFreezers') as number | undefined;
            const tieneFreezer = row.original.tieneFreezer;

            return (
                <div className="min-w-[60px] text-sm text-center">
                    {tieneFreezer && cantidad ? (
                        <span className="font-semibold">{cantidad}</span>
                    ) : (
                        <span className="text-gray-400">--</span>
                    )}
                </div>
            );
        },
    },
    {
        accessorKey: 'capacidadFreezer',
        header: 'Capacidad',
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
        accessorKey: 'tiposNegocio',
        header: 'Tipo de Negocio',
        cell: ({ row }) => {
            const tipos = row.getValue('tiposNegocio') as string[];

            if (!tipos || tipos.length === 0) {
                return <span className="text-gray-400">--</span>;
            }

            return (
                <div className="min-w-[180px] flex flex-wrap gap-1">
                    {tipos.map((tipo) => (
                        <Badge key={tipo} variant="outline" className="text-xs">
                            {TIPO_NEGOCIO_TRANSLATIONS[tipo] || tipo}
                        </Badge>
                    ))}
                </div>
            );
        },
    },
];
