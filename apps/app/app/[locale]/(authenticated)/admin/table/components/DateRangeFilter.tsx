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

export function DateRangeFilter({
    className,
}: React.HTMLAttributes<HTMLDivElement>) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isOpen, setIsOpen] = React.useState(false);

    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const urlDate: DateRange | undefined = {
        from: from ? new Date(`${from}T00:00:00.000Z`) : undefined,
        to: to ? new Date(`${to}T00:00:00.000Z`) : undefined,
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

            params.set('from', format(fromDate, 'yyyy-MM-dd'));
            params.set('to', format(toDate, 'yyyy-MM-dd'));
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
                        {selectedDate?.from ? (
                            <Button variant="ghost" onClick={handleClear}>Limpiar</Button>
                        ) : <div />}
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