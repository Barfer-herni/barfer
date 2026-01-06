'use client';

import { type ColumnDef, type CellContext } from '@tanstack/react-table';
import type { Order } from '@repo/data-services/src/types/barfer';
import { Badge } from '@repo/design-system/components/ui/badge';
import { Input } from '@repo/design-system/components/ui/input';
import { Button } from '@repo/design-system/components/ui/button';
import { STATUS_TRANSLATIONS, PAYMENT_METHOD_TRANSLATIONS } from '../../table/constants';
import { createLocalDate, formatPhoneNumber } from '../../table/helpers';
import { EstadoEnvioCell } from './EstadoEnvioCell';
import { ShippingPriceCell } from './ShippingPriceCell';
import { NotesOwnCell } from './NotesOwnCell';
import { ChevronUp, ChevronDown } from 'lucide-react';

export const createExpressColumns = (
    onOrderUpdated?: () => void | Promise<void>,
    onMoveOrder?: (orderId: string, direction: 'up' | 'down') => void,
    isDragEnabled?: boolean
): ColumnDef<Order>[] => [
    // Columna de prioridad: muestra flechas si NO está habilitado el drag
    // Si el drag está habilitado, esta columna se oculta porque el drag handle se renderiza en OrdersTable
    ...(!isDragEnabled ? [{
        accessorKey: 'priority',
        header: () => <div className="w-full text-center text-xs">Prioridad</div>,
        enableSorting: false,
        cell: ({ row }: CellContext<Order, unknown>) => {
            const orderId = row.original._id;
            if (!onMoveOrder) {
                return <div className="w-full text-center text-xs">--</div>;
            }
            return (
                <div className="flex items-center justify-center gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={(e) => {
                            e.stopPropagation();
                            onMoveOrder(String(orderId), 'up');
                        }}
                        title="Mover arriba"
                    >
                        <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={(e) => {
                            e.stopPropagation();
                            onMoveOrder(String(orderId), 'down');
                        }}
                        title="Mover abajo"
                    >
                        <ChevronDown className="h-4 w-4" />
                    </Button>
                </div>
            );
        },
        size: 80,
        minSize: 70,
        maxSize: 90,
    }] : []),
    {
        accessorKey: 'orderType',
        header: 'Tipo',
        cell: ({ row }: CellContext<Order, unknown>) => {
            const orderType = row.getValue('orderType') as Order['orderType'];
            const isWholesale = orderType === 'mayorista';
            return (
                <Badge
                    variant={isWholesale ? 'destructive' : 'secondary'}
                    className="text-xs px-1 h-5"
                >
                    {orderType === 'mayorista' ? 'M' : 'Min'}
                </Badge>
            );
        },
        size: 40,
        minSize: 30,
        maxSize: 50,
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
                    bgColor = 'bg-red-100';
                    break;
                case 3: // Miércoles
                    bgColor = 'bg-yellow-100';
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
                    <span className="font-semibold text-sm">
                        {formatted}
                    </span>
                </div>
            );
        },
        size: 70,
        minSize: 60,
        maxSize: 80,
    },
    {
        accessorKey: 'estadoEnvio',
        header: 'Est. Envío',
        cell: ({ row }: CellContext<Order, unknown>) => {
            const orderId = row.original._id;
            const estadoEnvio = row.original.estadoEnvio;
            return (
                <div className="min-w-[80px] flex items-center justify-center">
                    <EstadoEnvioCell
                        orderId={orderId}
                        currentEstado={estadoEnvio}
                        onUpdate={onOrderUpdated}
                    />
                </div>
            );
        },
        size: 80,
        minSize: 80,
    },
    {
        accessorKey: 'shippingPrice',
        header: () => <div className="w-full text-center text-sm">Envío</div>,
        cell: ({ row }: CellContext<Order, unknown>) => {
            const orderId = row.original._id;
            const shippingPrice = row.original.shippingPrice || 0;
            return (
                <ShippingPriceCell
                    orderId={orderId}
                    currentPrice={shippingPrice}
                    onUpdate={onOrderUpdated}
                />
            );
        },
        size: 80,
        minSize: 70,
        maxSize: 90,
    },
    {
        accessorKey: 'notesOwn',
        header: 'Notas propias',
        cell: ({ row }: CellContext<Order, unknown>) => {
            const orderId = row.original._id;
            const notesOwn = row.original.notesOwn || '';
            return (
                <div className="min-w-[100px]">
                    <NotesOwnCell
                        orderId={orderId}
                        currentNotes={notesOwn}
                        onUpdate={onOrderUpdated}
                    />
                </div>
            );
        }
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
            return <div className="min-w-[180px] text-sm whitespace-normal break-words">{address ? `${address.address}, ${address.city}` : 'N/A'}</div>;
        }
    },
    {
        accessorKey: 'address.phone',
        header: 'Teléfono',
        cell: ({ row }: CellContext<Order, unknown>) => {
            const address = row.original.address as Order['address'];
            const formattedPhone = formatPhoneNumber(address?.phone || '');
            return <div className="min-w-[10px] text-sm">{formattedPhone}</div>;
        }
    },
    {
        accessorKey: 'items',
        header: 'Productos',
        enableSorting: false,
        cell: ({ row }: CellContext<Order, unknown>) => {
            const items = row.original.items as Order['items'];
            return (
                <div className="min-w-[200px] text-sm whitespace-normal break-words">
                    {items.map((item, index) => {
                        const option = item.options[0] as any;
                        const optionName = option?.name || '';
                        const quantity = option?.quantity || 1;

                        // Determinar qué mostrar en lugar de "Default"
                        let displayOption = optionName;
                        if (optionName === 'Default' || optionName === '') {
                            displayOption = '';
                        }

                        const itemName = item.name || '';
                        const hasWeightInName = /\d+KG|\d+GRS|\d+G/.test(itemName);
                        const hasQuantityInName = /\s+-\s+x\d+$/i.test(itemName);

                        return (
                            <div key={`${item.id}-${index}`}>
                                {itemName}
                                {!hasWeightInName && displayOption ? ` - ${displayOption}` : ''}
                                {!hasQuantityInName ? ` - x${quantity}` : ''}
                            </div>
                        );
                    })}
                </div>
            );
        }
    },
    {
        accessorKey: 'paymentMethod',
        header: 'Pago',
        cell: ({ row }: CellContext<Order, unknown>) => {
            const paymentMethod = row.original.paymentMethod || '';
            const translatedPaymentMethod = PAYMENT_METHOD_TRANSLATIONS[paymentMethod.toLowerCase()] || paymentMethod;
            return <div className="min-w-[80px] text-sm">{translatedPaymentMethod}</div>;
        },
        size: 80,
    },
    {
        accessorKey: 'status',
        header: 'Estado',
        cell: ({ row }: CellContext<Order, unknown>) => {
            const status = row.getValue('status') as Order['status'];
            const translatedStatus = STATUS_TRANSLATIONS[status] || status || 'Sin estado';
            const paymentMethod = row.original.paymentMethod;
            let colorClass = '';

            if (status === 'pending' && paymentMethod !== 'cash') {
                colorClass = 'bg-red-500 force-dark-black text-white';
            }
            if (status === 'confirmed') {
                colorClass = 'font-semibold';
            }

            return (
                <div className="h-full flex items-center justify-center">
                    <span className={`text-xs px-2 py-1 rounded ${colorClass}`}>
                        {translatedStatus}
                    </span>
                </div>
            );
        },
        size: 80,
    },
    {
        accessorKey: 'total',
        header: () => <div className="w-full text-center text-sm">Total</div>,
        cell: ({ row }: CellContext<Order, unknown>) => {
            const amount = parseFloat(row.getValue('total') as string);
            const rounded = Math.round(amount);
            const formatted = new Intl.NumberFormat('es-AR', {
                style: 'currency',
                currency: 'ARS',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
            }).format(rounded);
            return <div className="font-medium text-center min-w-[70px] text-sm">{formatted}</div>;
        },
        size: 80,
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

                if (address.reference) parts.push(address.reference);

                if (address.floorNumber || address.departmentNumber) {
                    const floorDept = [address.floorNumber, address.departmentNumber].filter(Boolean).join(' ');
                    if (floorDept) parts.push(floorDept);
                }

                if (address.betweenStreets) parts.push(`Entre calles: ${address.betweenStreets}`);

                addressInfo = parts.join(' / ');
            }

            const allNotes = [notes, addressInfo].filter(Boolean).join(' / ');
            return <div className="min-w-[200px] text-sm whitespace-normal break-words">{allNotes || 'N/A'}</div>;
        },
        size: 200,
        minSize: 150,
    },
    {
        accessorKey: 'user.email',
        header: 'Mail',
        cell: ({ row }: CellContext<Order, unknown>) => {
            if ((row as any).isEditing) {
                return (
                    <Input
                        value={row.original.user?.email || ''}
                        className="w-full text-xs"
                        readOnly
                    />
                );
            }
            const user = row.original.user as Order['user'];
            if (!user || !user.email) return <div className="text-xs">N/A</div>;

            const emailParts = user.email.split('@');
            const displayEmail = emailParts[0] + '@';

            return (
                <div
                    className="text-xs truncate"
                    title={user.email}
                >
                    {displayEmail}
                </div>
            );
        },
        size: 50,
        minSize: 40,
    },
];

// Exportar también la versión sin callback para compatibilidad
export const expressColumns = createExpressColumns();

