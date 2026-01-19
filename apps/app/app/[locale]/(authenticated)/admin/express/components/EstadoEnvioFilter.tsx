'use client';

import * as React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Check } from 'lucide-react';
import { cn } from '@repo/design-system/lib/utils';
import { Button } from '@repo/design-system/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@repo/design-system/components/ui/popover';

const estadosEnvio = [
    { value: 'all', label: 'Todos' },
    { value: 'pendiente', label: 'Pendiente' },
    { value: 'pidiendo', label: 'Pidiendo' },
    { value: 'en-viaje', label: 'En viaje' },
    { value: 'listo', label: 'Listo' },
] as const;

export function EstadoEnvioFilter() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isOpen, setIsOpen] = React.useState(false);

    // Obtener estados seleccionados de la URL
    const estadosFromUrl = searchParams.get('estadosEnvio');
    const selectedEstados = React.useMemo(() => {
        if (!estadosFromUrl || estadosFromUrl === 'all') {
            return ['all'];
        }
        return estadosFromUrl.split(',');
    }, [estadosFromUrl]);

    const toggleEstado = (value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        
        let newEstados: string[];
        
        if (value === 'all') {
            // Si selecciona "Todos", limpiar todo
            newEstados = ['all'];
        } else {
            // Remover "all" si está presente
            const currentEstados = selectedEstados.filter(e => e !== 'all');
            
            if (currentEstados.includes(value)) {
                // Si ya está seleccionado, quitarlo
                newEstados = currentEstados.filter(e => e !== value);
                // Si no queda ninguno, seleccionar "all"
                if (newEstados.length === 0) {
                    newEstados = ['all'];
                }
            } else {
                // Si no está seleccionado, agregarlo
                newEstados = [...currentEstados, value];
            }
        }
        
        // Actualizar URL
        if (newEstados.includes('all') || newEstados.length === 0) {
            params.delete('estadosEnvio');
        } else {
            params.set('estadosEnvio', newEstados.join(','));
        }
        
        params.set('page', '1');
        router.replace(`${pathname}?${params.toString()}`);
    };

    const getDisplayText = () => {
        if (selectedEstados.includes('all') || selectedEstados.length === 0) {
            return 'Todos los estados';
        }
        if (selectedEstados.length === 1) {
            const estado = estadosEnvio.find(e => e.value === selectedEstados[0]);
            return estado?.label || 'Filtrar por estado';
        }
        return `${selectedEstados.length} estados seleccionados`;
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className="w-full sm:w-[200px] justify-start text-left font-normal"
                >
                    <span className="truncate">{getDisplayText()}</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0" align="start">
                <div className="flex flex-col">
                    {estadosEnvio.map((estado) => {
                        const isSelected = selectedEstados.includes(estado.value);
                        const isAll = estado.value === 'all';
                        const allSelected = selectedEstados.includes('all');
                        
                        return (
                            <button
                                key={estado.value}
                                onClick={() => toggleEstado(estado.value)}
                                className={cn(
                                    'flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent cursor-pointer transition-colors',
                                    (isSelected || (isAll && allSelected)) && 'bg-accent'
                                )}
                                type="button"
                            >
                                <div className={cn(
                                    'flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                                    (isSelected || (isAll && allSelected)) ? 'bg-primary text-primary-foreground' : 'opacity-50'
                                )}>
                                    {(isSelected || (isAll && allSelected)) && (
                                        <Check className="h-3 w-3" />
                                    )}
                                </div>
                                <span className="flex-1 text-left">{estado.label}</span>
                            </button>
                        );
                    })}
                </div>
            </PopoverContent>
        </Popover>
    );
}
