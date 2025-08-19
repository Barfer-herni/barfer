'use client';

import { type ColumnDef, type CellContext } from '@tanstack/react-table';
import type { Order } from '@repo/data-services/src/types/barfer';
import { Badge } from '@repo/design-system/components/ui/badge';
import { Input } from '@repo/design-system/components/ui/input';
import { STATUS_TRANSLATIONS, PAYMENT_METHOD_TRANSLATIONS } from '../constants';
import { createLocalDate } from '../helpers';

export const columns: ColumnDef<Order>[] = [
    {
        accessorKey: 'orderType',
        header: 'Tipo Orden',
        cell: ({ row }: CellContext<Order, unknown>) => {
            const orderType = row.getValue('orderType') as Order['orderType'];
            const isWholesale = orderType === 'mayorista';
            return (
                <Badge
                    variant={isWholesale ? 'destructive' : 'secondary'}
                    className="text-xs"
                >
                    {orderType === 'mayorista' ? 'Mayorista' : 'Minorista'}
                </Badge>
            );
        }
    },
    {
        accessorKey: 'deliveryDay',
        header: 'Fecha',
        enableSorting: true,
        cell: ({ row }: CellContext<Order, unknown>) => {
            const deliveryDay = row.original.deliveryDay;
            if (!deliveryDay) {
                return <div className="w-full text-center text-sm">--</div>;
            }

            // Usar la función helper para crear una fecha local
            const date = createLocalDate(deliveryDay);

            const formatted = date.toLocaleDateString('es-AR', {
                day: '2-digit',
                month: 'short',
            }).replace('.', '').replace(/\s/g, '-');

            // Colores por día de la semana
            const day = date.getDay();
            let bgColor = '';
            switch (day) {
                case 1: // Lunes
                    bgColor = 'bg-green-100';
                    break;
                case 2: // Martes
                    bgColor = 'bg-yellow-100';
                    break;
                case 3: // Miércoles
                    bgColor = 'bg-red-100';
                    break;
                case 4: // Jueves
                    bgColor = 'bg-yellow-600';
                    break;
                case 6: // Sábado
                    bgColor = 'bg-blue-100';
                    break;
                default:
                    bgColor = '';
            }



            return (
                <div className={`flex h-full w-full items-center justify-center text-center ${bgColor} rounded-sm`} style={{ minWidth: 60, maxWidth: 70 }}>
                    <span className="font-semibold">
                        {formatted}
                    </span>
                </div>
            );
        },
        size: 70, // Más angosto
        minSize: 60,
        maxSize: 80,
    },
    {
        accessorKey: 'deliveryArea.schedule',
        header: 'Rango Horario',
        cell: ({ row }: CellContext<Order, unknown>) => {
            const deliveryArea = row.original.deliveryArea;
            if (!deliveryArea?.schedule) return <div className="min-w-[90px] text-sm">N/A</div>;

            // Extraer solo las horas del schedule
            const schedule = deliveryArea.schedule;
            // Buscar patrones de horas como "10hs", "17hs", "10:00", etc.
            const hourMatches = schedule.match(/(\d{1,2})(?::\d{2})?(?:hs?)?/g);

            if (hourMatches && hourMatches.length >= 2) {
                const startHour = hourMatches[0].replace(/[^\d]/g, '');
                const endHour = hourMatches[hourMatches.length - 1].replace(/[^\d]/g, '');
                return <div className="min-w-[90px] text-sm whitespace-normal break-words">De {startHour} a {endHour}hs aprox</div>;
            }

            // Si no se puede extraer, mostrar el schedule original pero más corto
            return <div className="min-w-[90px] text-sm whitespace-normal break-words">{schedule.length > 20 ? schedule.substring(0, 20) + '...' : schedule}</div>;
        }
    },
    {
        accessorKey: 'notesOwn',
        header: 'Notas propias',
        cell: ({ row }: CellContext<Order, unknown>) => {
            const notesOwn = row.original.notesOwn || '';
            return <div className="min-w-[100px] text-sm">{notesOwn}</div>;
        }
        // cell: ({ row }: CellContext<Order, unknown>) => {
        //     return (
        //         <Input
        //             placeholder="Nota..."
        //             className="min-w-[100px] h-7 text-xs"
        //             defaultValue=""
        //         />
        //     );
        // }
    },
    {
        accessorKey: 'user.name',
        header: 'Cliente',
        cell: ({ row }: CellContext<Order, unknown>) => {
            const user = row.original.user || '';
            return <div className="min-w-[120px] text-sm whitespace-normal break-words">{user.name} {user.lastName}</div>;
        },
    },
    {
        accessorKey: 'address.address',
        header: 'Dirección',
        cell: ({ row }: CellContext<Order, unknown>) => {
            const address = row.original.address as Order['address'];
            return <div className="min-w-[40px] text-sm whitespace-normal break-words">{address ? `${address.address}, ${address.city}` : 'N/A'}</div>;
        }
    },
    {
        accessorKey: 'address.phone',
        header: 'Teléfono',
        cell: ({ row }: CellContext<Order, unknown>) => {
            const address = row.original.address as Order['address'];
            return <div className="min-w-[10px] text-sm">{address ? address.phone : 'N/A'}</div>;
        }
    },
    {
        accessorKey: 'items',
        header: 'Productos',
        enableSorting: false,
        cell: ({ row }: CellContext<Order, unknown>) => {
            const items = row.original.items as Order['items'];
            return (
                <div className="min-w-[120px] text-sm whitespace-normal break-words">
                    {items.map((item, index) => {
                        const option = item.options[0] as any;
                        const optionName = option?.name || '';
                        const quantity = option?.quantity || 1;

                        // Determinar qué mostrar en lugar de "Default"
                        let displayOption = optionName;
                        if (optionName === 'Default' || optionName === '') {
                            // Si no hay peso extraído, mostrar solo el nombre del producto
                            displayOption = '';
                        }

                        return (
                            <div key={`${item.id}-${index}`}>
                                {item.name}{displayOption ? ` - ${displayOption}` : ''} - x{quantity}
                            </div>
                        );
                    })}
                </div>
            );
        }
    },
    {
        accessorKey: 'paymentMethod',
        header: 'Medio de pago',
        cell: ({ row }: CellContext<Order, unknown>) => {
            const paymentMethod = row.original.paymentMethod || '';
            const translatedPaymentMethod = PAYMENT_METHOD_TRANSLATIONS[paymentMethod.toLowerCase()] || paymentMethod;
            return <div className="min-w-[100px] text-sm">{translatedPaymentMethod}</div>;
        }
    },
    {
        accessorKey: 'status',
        header: 'Estado',
        cell: ({ row }: CellContext<Order, unknown>) => {
            const status = row.getValue('status') as Order['status'];
            const translatedStatus = STATUS_TRANSLATIONS[status] || status;
            const paymentMethod = row.original.paymentMethod;
            let colorClass = '';
            if (status === 'pending' && paymentMethod !== 'cash') colorClass = 'bg-red-500 force-dark-black text-white';
            if (status === 'confirmed') colorClass = 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300';
            return (
                <span className={`text-xs px-2 py-1 rounded ${colorClass}`}>
                    {translatedStatus}
                </span>
            );
        }
    },
    {
        accessorKey: 'total',
        header: () => <div className="w-full text-center">Total</div>,
        cell: ({ row }: CellContext<Order, unknown>) => {
            const amount = parseFloat(row.getValue('total') as string);
            const rounded = Math.round(amount);
            const formatted = new Intl.NumberFormat('es-AR', {
                style: 'currency',
                currency: 'ARS',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
            }).format(rounded);
            return <div className="font-medium text-center min-w-[80px] text-sm">{formatted}</div>;
        }
    },
    {
        accessorKey: 'notes',
        header: 'Notas',
        cell: ({ row }: CellContext<Order, unknown>) => {
            const address = row.original.address as Order['address'];
            const notes = row.original.notes || '';

            let addressInfo = '';
            if (address) {
                const parts = [];

                // Agregar reference si existe
                if (address.reference) parts.push(address.reference);

                // Agregar piso y departamento
                if (address.floorNumber || address.departmentNumber) {
                    const floorDept = [address.floorNumber, address.departmentNumber].filter(Boolean).join(' ');
                    if (floorDept) parts.push(floorDept);
                }

                // Agregar entre calles
                if (address.betweenStreets) parts.push(`Entre calles: ${address.betweenStreets}`);

                addressInfo = parts.join(' / ');
            }

            const allNotes = [notes, addressInfo].filter(Boolean).join(' / ');
            return <div className="min-w-[120px] text-sm whitespace-normal break-words">{allNotes || 'N/A'}</div>;
        }
    },
    {
        accessorKey: 'user.email',
        header: 'Mail',
        cell: ({ row }: CellContext<Order, unknown>) => {
            if ((row as any).isEditing) {
                return (
                    <Input
                        value={row.original.user?.email || ''}
                        className="min-w-[10px] text-xs"
                        readOnly
                    />
                );
            }
            const user = row.original.user as Order['user'];
            return <div className="min-w-[10px] text-sm whitespace-normal break-words">{user ? user.email : 'N/A'}</div>;
        }
    },
]; 