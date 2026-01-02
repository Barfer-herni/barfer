'use client';

import * as React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';
import { type DateRange } from 'react-day-picker';

import { cn } from '@repo/design-system/lib/utils';
import { Button } from '@repo/design-system/components/ui/button';
import { Calendar } from '@repo/design-system/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@repo/design-system/components/ui/popover';

// Función helper para crear fechas desde string
// Crea fechas locales (sin conversión de timezone) para que coincidan con las fechas guardadas en UTC
const createDateFromString = (dateString: string, isEndOfDay = false): Date => {
    const [year, month, day] = dateString.split('-').map(Number);
    // Crear fecha en hora local de Argentina usando el constructor con componentes
    const date = new Date(year, month - 1, day);

    if (isEndOfDay) {
        date.setHours(23, 59, 59, 999);
    } else {
        date.setHours(0, 0, 0, 0);
    }

    return date;
};

// Función helper para formatear fechas para la URL
// Retorna formato YYYY-MM-DD sin conversión de timezone
const formatDateForURL = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export function DateRangeFilter({
    className,
}: React.HTMLAttributes<HTMLDivElement>) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isOpen, setIsOpen] = React.useState(false);

    const from = searchParams.get('from');
    const to = searchParams.get('to');

    // Crear DateRange usando las fechas directamente
    const urlDate: DateRange | undefined = {
        from: from ? createDateFromString(from) : undefined,
        to: to ? createDateFromString(to, true) : undefined,
    };

    const [selectedDate, setSelectedDate] = React.useState<DateRange | undefined>(urlDate);

    // Actualizar selectedDate cuando se abra el popover
    React.useEffect(() => {
        if (isOpen) {
            setSelectedDate(urlDate);
        }
    }, [isOpen, from, to]);

    const handleApply = () => {
        const params = new URLSearchParams(searchParams.toString());
        if (selectedDate?.from) {
            const fromDate = selectedDate.from;
            const toDate = selectedDate.to || selectedDate.from;

            params.set('from', formatDateForURL(fromDate));
            params.set('to', formatDateForURL(toDate));
        } else {
            params.delete('from');
            params.delete('to');
        }
        params.set('page', '1');
        router.replace(`${pathname}?${params.toString()}`);
        setIsOpen(false);
    };

    const handleClear = () => {
        const params = new URLSearchParams(searchParams.toString());
        params.delete('from');
        params.delete('to');
        params.set('page', '1');
        router.replace(`${pathname}?${params.toString()}`);
        setSelectedDate(undefined);
        setIsOpen(false);
    };

    const handleToday = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        setSelectedDate({ from: today, to: today });
    };

    return (
        <div className={cn('grid gap-2', className)}>
            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={'outline'}
                        className={cn(
                            'w-[300px] justify-start text-left font-normal',
                            !urlDate?.from && 'text-muted-foreground'
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {urlDate?.from ? (
                            urlDate.to && urlDate.from.getTime() !== urlDate.to.getTime() ? (
                                <>
                                    {format(urlDate.from, 'LLL dd, y', { locale: es })} -{' '}
                                    {format(urlDate.to, 'LLL dd, y', { locale: es })}
                                </>
                            ) : (
                                format(urlDate.from, 'LLL dd, y', { locale: es })
                            )
                        ) : (
                            <span>Seleccione un rango</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={selectedDate?.from}
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        numberOfMonths={2}
                        locale={es}
                    />
                    <div className="flex justify-between p-2 border-t">
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={handleToday}>
                                Hoy
                            </Button>
                            {selectedDate?.from && (
                                <Button variant="ghost" onClick={handleClear}>Limpiar</Button>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
                            <Button onClick={handleApply}>Aplicar</Button>
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
} 