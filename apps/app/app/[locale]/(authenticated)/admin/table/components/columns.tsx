'use client';

import { type ColumnDef, type CellContext } from '@tanstack/react-table';
import type { Order } from '@repo/data-services/src/types/barfer';
import { Badge } from '@repo/design-system/components/ui/badge';
import { Input } from '@repo/design-system/components/ui/input';
import { STATUS_TRANSLATIONS, PAYMENT_METHOD_TRANSLATIONS } from '../constants';
import { createLocalDate, normalizeScheduleTime, formatPhoneNumber } from '../helpers';

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
                    className="text-sm"
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
                return <div className="w-full text-center text-base">--</div>;
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
            if (!deliveryArea?.schedule) return <div className="min-w-[90px] text-base">N/A</div>;

            // Primero normalizar el schedule (convertir "APROXIMADAMENTE" a "aprox", etc.)
            const normalizedSchedule = normalizeScheduleTime(deliveryArea.schedule);

            // Extraer solo la parte del horario, eliminando el día si está presente
            // Buscar patrones como "De X:XXhs a X:XXhs aprox" o "X:XXhs a X:XXhs aprox"
            const timePattern = /(?:de\s+)?(\d{1,2}:\d{2}hs?\s+a\s+\d{1,2}:\d{2}hs?\s+aprox)/i;
            const match = normalizedSchedule.match(timePattern);

            if (match) {
                // Si encuentra el patrón, devolver solo el horario
                return <div className="min-w-[90px] text-base whitespace-normal break-words">{match[1]}</div>;
            }

            // Si no encuentra el patrón exacto, intentar extraer cualquier horario
            const fallbackPattern = /(\d{1,2}:\d{2}hs?\s+a\s+\d{1,2}:\d{2}hs?)/i;
            const fallbackMatch = normalizedSchedule.match(fallbackPattern);

            if (fallbackMatch) {
                // Agregar "aprox" si no está presente
                return <div className="min-w-[90px] text-base whitespace-normal break-words">{fallbackMatch[1]} aprox</div>;
            }

            // Si no se puede extraer, devolver el schedule normalizado
            return <div className="min-w-[90px] text-base whitespace-normal break-words">{normalizedSchedule}</div>;
        }
    },
    {
        accessorKey: 'notesOwn',
        header: 'Notas propias',
        cell: ({ row }: CellContext<Order, unknown>) => {
            const notesOwn = row.original.notesOwn || '';
            return <div className="min-w-[100px] text-base">{notesOwn}</div>;
        }
        // cell: ({ row }: CellContext<Order, unknown>) => {
        //     return (
        //         <Input
        //             placeholder="Nota..."
        //             className="min-w-[100px] h-7 text-sm"
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
            return <div className="min-w-[120px] text-base whitespace-normal break-words">{user.name} {user.lastName}</div>;
        },
    },
    {
        accessorKey: 'address.address',
        header: 'Dirección',
        cell: ({ row }: CellContext<Order, unknown>) => {
            const address = row.original.address as Order['address'];
            return <div className="min-w-[180px] text-base whitespace-normal break-words">{address ? `${address.address}, ${address.city}` : 'N/A'}</div>;
        }
    },
    {
        accessorKey: 'address.phone',
        header: 'Teléfono',
        cell: ({ row }: CellContext<Order, unknown>) => {
            const address = row.original.address as Order['address'];
            const formattedPhone = formatPhoneNumber(address?.phone || '');
            return <div className="min-w-[10px] text-base">{formattedPhone}</div>;
        }
    },
    {
        accessorKey: 'items',
        header: 'Productos',
        enableSorting: false,
        cell: ({ row }: CellContext<Order, unknown>) => {
            const items = row.original.items as Order['items'];
            return (
                <div className="min-w-[200px] text-base whitespace-normal break-words">
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

                        // Si el item.name ya contiene el peso (como "GATO VACA 5KG"), no mostrar displayOption
                        // para evitar duplicación
                        const itemName = item.name || '';
                        const hasWeightInName = /\d+KG|\d+GRS|\d+G/.test(itemName);

                        // Verificar si el nombre ya incluye una cantidad en formato " - x\d+" al final
                        // IMPORTANTE: No confundir con productos que tienen multiplicadores en el nombre (ej: "OREJA X50")
                        // Solo detectar si ya tiene una cantidad separada por " - " (ej: "OREJA X50 - x2")
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
        header: 'Medio de pago',
        cell: ({ row }: CellContext<Order, unknown>) => {
            const paymentMethod = row.original.paymentMethod || '';
            const translatedPaymentMethod = PAYMENT_METHOD_TRANSLATIONS[paymentMethod.toLowerCase()] || paymentMethod;
            return <div className="min-w-[100px] text-base">{translatedPaymentMethod}</div>;
        }
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
                    <span className={`text-sm px-2 py-1 rounded ${colorClass}`}>
                        {translatedStatus}
                    </span>
                </div>
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
            return <div className="font-medium text-center min-w-[80px] text-base">{formatted}</div>;
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
            return <div className="min-w-[200px] text-base whitespace-normal break-words">{allNotes || 'N/A'}</div>;
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
                        className="min-w-[10px] text-sm"
                        readOnly
                    />
                );
            }
            const user = row.original.user as Order['user'];
            if (!user || !user.email) return <div className="min-w-[10px] text-base">N/A</div>;

            // Mostrar solo hasta el "@" del email
            const emailParts = user.email.split('@');
            const displayEmail = emailParts[0] + '@';

            return (
                <div
                    className="min-w-[10px] max-w-[60px] text-sm truncate"
                    title={user.email}
                >
                    {displayEmail}
                </div>
            );
        }
    },
]; 