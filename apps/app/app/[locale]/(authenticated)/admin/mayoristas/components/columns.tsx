'use client';

import { type ColumnDef } from '@tanstack/react-table';
import { Badge } from '@repo/design-system/components/ui/badge';
import { ZONA_TRANSLATIONS, TIPO_NEGOCIO_TRANSLATIONS } from '../constants';
import type { Mayorista } from '@repo/data-services';
import { Check, X, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

export const columns: ColumnDef<Mayorista>[] = [
    {
        accessorKey: 'nombre',
        header: ({ column }) => {
            const isSorted = column.getIsSorted();
            return (
                <button
                    type="button"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                    className="flex items-center gap-2 hover:text-gray-900 font-medium"
                >
                    Nombre del Punto de Venta
                    {isSorted === 'asc' ? (
                        <ArrowUp className="w-4 h-4" />
                    ) : isSorted === 'desc' ? (
                        <ArrowDown className="w-4 h-4" />
                    ) : (
                        <ArrowUpDown className="w-4 h-4 opacity-50" />
                    )}
                </button>
            );
        },
        cell: ({ row }) => {
            return (
                <div className="min-w-[120px] sm:min-w-[180px] font-medium text-xs sm:text-sm">
                    {row.getValue('nombre')}
                </div>
            );
        },
        enableSorting: true,
    },
    {
        accessorKey: 'zona',
        header: ({ column }) => {
            const isSorted = column.getIsSorted();
            return (
                <button
                    type="button"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                    className="flex items-center gap-2 hover:text-gray-900 font-medium"
                >
                    Zona
                    {isSorted === 'asc' ? (
                        <ArrowUp className="w-4 h-4" />
                    ) : isSorted === 'desc' ? (
                        <ArrowDown className="w-4 h-4" />
                    ) : (
                        <ArrowUpDown className="w-4 h-4 opacity-50" />
                    )}
                </button>
            );
        },
        cell: ({ row }) => {
            const zona = row.getValue('zona') as string;
            const zonaLabel = ZONA_TRANSLATIONS[zona] || zona;
            return (
                <div className="min-w-[70px] sm:min-w-[100px]">
                    <Badge variant="secondary" className="text-[10px] sm:text-xs px-1 sm:px-2">
                        {zonaLabel}
                    </Badge>
                </div>
            );
        },
        enableSorting: true,
    },
    {
        accessorKey: 'contacto.direccion',
        header: ({ column }) => {
            const isSorted = column.getIsSorted();
            return (
                <button
                    type="button"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                    className="flex items-center gap-2 hover:text-gray-900 font-medium"
                >
                    Dirección
                    {isSorted === 'asc' ? (
                        <ArrowUp className="w-4 h-4" />
                    ) : isSorted === 'desc' ? (
                        <ArrowDown className="w-4 h-4" />
                    ) : (
                        <ArrowUpDown className="w-4 h-4 opacity-50" />
                    )}
                </button>
            );
        },
        cell: ({ row }) => {
            const direccion = row.original.contacto?.direccion || '';
            return (
                <div className="min-w-[120px] sm:min-w-[180px] text-xs sm:text-sm truncate max-w-[200px]">
                    {direccion || <span className="text-gray-400">--</span>}
                </div>
            );
        },
        enableSorting: true,
    },
    {
        accessorKey: 'contacto.telefono',
        header: ({ column }) => {
            const isSorted = column.getIsSorted();
            return (
                <button
                    type="button"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                    className="flex items-center gap-2 hover:text-gray-900 font-medium"
                >
                    Teléfono
                    {isSorted === 'asc' ? (
                        <ArrowUp className="w-4 h-4" />
                    ) : isSorted === 'desc' ? (
                        <ArrowDown className="w-4 h-4" />
                    ) : (
                        <ArrowUpDown className="w-4 h-4 opacity-50" />
                    )}
                </button>
            );
        },
        cell: ({ row }) => {
            const telefono = row.original.contacto?.telefono || '';
            return (
                <div className="min-w-[90px] sm:min-w-[130px] text-xs sm:text-sm">
                    {telefono || <span className="text-gray-400">--</span>}
                </div>
            );
        },
        enableSorting: true,
    },
    {
        accessorKey: 'horarios',
        header: ({ column }) => {
            const isSorted = column.getIsSorted();
            return (
                <button
                    type="button"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                    className="flex items-center gap-2 hover:text-gray-900 font-medium"
                >
                    Horarios de Atención
                    {isSorted === 'asc' ? (
                        <ArrowUp className="w-4 h-4" />
                    ) : isSorted === 'desc' ? (
                        <ArrowDown className="w-4 h-4" />
                    ) : (
                        <ArrowUpDown className="w-4 h-4 opacity-50" />
                    )}
                </button>
            );
        },
        cell: ({ row }) => {
            const horarios = row.getValue('horarios') as string | undefined;
            if (!horarios || horarios.trim() === '') {
                return <span className="text-gray-400">--</span>;
            }

            // Dividir por saltos de línea para mostrar en múltiples líneas
            const lineas = horarios.split('\n').filter(l => l.trim() !== '');

            return (
                <div className="min-w-[120px] sm:min-w-[180px] text-[10px] sm:text-xs whitespace-pre-line max-w-[200px] truncate">
                    {lineas.map((linea, index) => (
                        <div key={index} className="py-0.5 truncate">
                            {linea}
                        </div>
                    ))}
                </div>
            );
        },
        enableSorting: true,
    },
    {
        accessorKey: 'fechaPrimerPedido',
        header: ({ column }) => {
            const isSorted = column.getIsSorted();
            return (
                <button
                    type="button"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                    className="flex items-center gap-2 hover:text-gray-900 font-medium"
                >
                    Primer Pedido
                    {isSorted === 'asc' ? (
                        <ArrowUp className="w-4 h-4" />
                    ) : isSorted === 'desc' ? (
                        <ArrowDown className="w-4 h-4" />
                    ) : (
                        <ArrowUpDown className="w-4 h-4 opacity-50" />
                    )}
                </button>
            );
        },
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
                <div className="min-w-[80px] sm:min-w-[110px] text-xs sm:text-sm text-center">
                    {formatted}
                </div>
            );
        },
        enableSorting: true,
    },
    {
        accessorKey: 'fechaUltimoPedido',
        header: ({ column }) => {
            const isSorted = column.getIsSorted();
            return (
                <button
                    type="button"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                    className="flex items-center gap-2 hover:text-gray-900 font-medium"
                >
                    Último Pedido
                    {isSorted === 'asc' ? (
                        <ArrowUp className="w-4 h-4" />
                    ) : isSorted === 'desc' ? (
                        <ArrowDown className="w-4 h-4" />
                    ) : (
                        <ArrowUpDown className="w-4 h-4 opacity-50" />
                    )}
                </button>
            );
        },
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
                <div className="min-w-[80px] sm:min-w-[110px] text-xs sm:text-sm text-center">
                    {formatted}
                </div>
            );
        },
        enableSorting: true,
    },
    {
        accessorKey: 'tieneFreezer',
        header: ({ column }) => {
            const isSorted = column.getIsSorted();
            return (
                <button
                    type="button"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                    className="flex items-center gap-2 hover:text-gray-900 font-medium"
                >
                    Freezer Nuestro
                    {isSorted === 'asc' ? (
                        <ArrowUp className="w-4 h-4" />
                    ) : isSorted === 'desc' ? (
                        <ArrowDown className="w-4 h-4" />
                    ) : (
                        <ArrowUpDown className="w-4 h-4 opacity-50" />
                    )}
                </button>
            );
        },
        cell: ({ row }) => {
            const tieneFreezer = row.getValue('tieneFreezer') as boolean;

            return (
                <div className="min-w-[70px] sm:min-w-[120px] text-center">
                    {tieneFreezer ? (
                        <div className="flex items-center justify-center gap-0.5 sm:gap-1">
                            <Check className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                            <Badge variant="default" className="bg-green-500 text-[10px] sm:text-xs px-1 sm:px-2">Sí</Badge>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center gap-0.5 sm:gap-1">
                            <X className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                            <Badge variant="secondary" className="text-[10px] sm:text-xs px-1 sm:px-2">No</Badge>
                        </div>
                    )}
                </div>
            );
        },
        enableSorting: true,
    },
    {
        accessorKey: 'cantidadFreezers',
        header: ({ column }) => {
            const isSorted = column.getIsSorted();
            return (
                <button
                    type="button"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                    className="flex items-center gap-2 hover:text-gray-900 font-medium"
                >
                    Cant
                    {isSorted === 'asc' ? (
                        <ArrowUp className="w-4 h-4" />
                    ) : isSorted === 'desc' ? (
                        <ArrowDown className="w-4 h-4" />
                    ) : (
                        <ArrowUpDown className="w-4 h-4 opacity-50" />
                    )}
                </button>
            );
        },
        cell: ({ row }) => {
            const cantidad = row.getValue('cantidadFreezers') as number | undefined;
            const tieneFreezer = row.original.tieneFreezer;

            return (
                <div className="min-w-[50px] sm:min-w-[60px] text-xs sm:text-sm text-center">
                    {tieneFreezer && cantidad ? (
                        <span className="font-semibold">{cantidad}</span>
                    ) : (
                        <span className="text-gray-400">--</span>
                    )}
                </div>
            );
        },
        enableSorting: true,
    },
    {
        accessorKey: 'capacidadFreezer',
        header: ({ column }) => {
            const isSorted = column.getIsSorted();
            return (
                <button
                    type="button"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                    className="flex items-center gap-2 hover:text-gray-900 font-medium"
                >
                    Capacidad
                    {isSorted === 'asc' ? (
                        <ArrowUp className="w-4 h-4" />
                    ) : isSorted === 'desc' ? (
                        <ArrowDown className="w-4 h-4" />
                    ) : (
                        <ArrowUpDown className="w-4 h-4 opacity-50" />
                    )}
                </button>
            );
        },
        cell: ({ row }) => {
            const capacidad = row.getValue('capacidadFreezer') as number | undefined;
            const tieneFreezer = row.original.tieneFreezer;

            return (
                <div className="min-w-[70px] sm:min-w-[100px] text-xs sm:text-sm text-center">
                    {tieneFreezer && capacidad ? (
                        `${capacidad}L`
                    ) : (
                        <span className="text-gray-400">--</span>
                    )}
                </div>
            );
        },
        enableSorting: true,
    },
    {
        accessorKey: 'tiposNegocio',
        header: ({ column }) => {
            const isSorted = column.getIsSorted();
            return (
                <button
                    type="button"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                    className="flex items-center gap-2 hover:text-gray-900 font-medium"
                >
                    Tipo de Negocio
                    {isSorted === 'asc' ? (
                        <ArrowUp className="w-4 h-4" />
                    ) : isSorted === 'desc' ? (
                        <ArrowDown className="w-4 h-4" />
                    ) : (
                        <ArrowUpDown className="w-4 h-4 opacity-50" />
                    )}
                </button>
            );
        },
        cell: ({ row }) => {
            const tipos = row.getValue('tiposNegocio') as string[];

            if (!tipos || tipos.length === 0) {
                return <span className="text-gray-400">--</span>;
            }

            return (
                <div className="min-w-[120px] sm:min-w-[180px] flex flex-wrap gap-0.5 sm:gap-1">
                    {tipos.map((tipo) => (
                        <Badge key={tipo} variant="outline" className="text-[10px] sm:text-xs px-1 sm:px-2">
                            {TIPO_NEGOCIO_TRANSLATIONS[tipo] || tipo}
                        </Badge>
                    ))}
                </div>
            );
        },
        enableSorting: true,
    },
];
