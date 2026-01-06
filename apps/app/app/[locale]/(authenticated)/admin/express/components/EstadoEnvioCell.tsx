'use client';

import { useState } from 'react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@repo/design-system/components/ui/select';
import { updateEstadoEnvioAction } from '../actions';
import { toast } from '@repo/design-system/hooks/use-toast';

type EstadoEnvio = 'pendiente' | 'pidiendo' | 'en-viaje' | 'listo';

interface EstadoEnvioCellProps {
    orderId: string;
    currentEstado?: EstadoEnvio;
    onUpdate?: () => void;
}

const ESTADO_COLORS: Record<EstadoEnvio, string> = {
    'pendiente': 'bg-gray-200 text-gray-800',
    'pidiendo': 'bg-sky-200 text-sky-900',
    'en-viaje': 'bg-yellow-200 text-yellow-900',
    'listo': 'bg-green-200 text-green-900',
};

const ESTADO_LABELS: Record<EstadoEnvio, string> = {
    'pendiente': 'Pendiente',
    'pidiendo': 'Pidiendo',
    'en-viaje': 'En Viaje',
    'listo': 'Listo',
};

const ESTADO_LABELS_SHORT: Record<EstadoEnvio, string> = {
    'pendiente': 'Pendi',
    'pidiendo': 'Pidie',
    'en-viaje': 'Viaje',
    'listo': 'Listo',
};

export function EstadoEnvioCell({ orderId, currentEstado = 'pendiente', onUpdate }: EstadoEnvioCellProps) {
    const [estado, setEstado] = useState<EstadoEnvio>(currentEstado);
    const [isUpdating, setIsUpdating] = useState(false);

    const handleEstadoChange = async (newEstado: EstadoEnvio) => {
        if (newEstado === estado) return;

        setIsUpdating(true);
        const previousEstado = estado;

        // Actualización optimista
        setEstado(newEstado);

        try {
            const result = await updateEstadoEnvioAction(orderId, newEstado);

            if (!result.success) {
                // Revertir en caso de error
                setEstado(previousEstado);
                toast({
                    title: 'Error',
                    description: 'Error al actualizar el estado de envío',
                    variant: 'destructive',
                });
                console.error('Error al actualizar estado:', result.error);
            }
            // NO llamar a onUpdate para evitar refresh completo
        } catch (error) {
            // Revertir en caso de error
            setEstado(previousEstado);
            toast({
                title: 'Error',
                description: 'Error al actualizar el estado de envío',
                variant: 'destructive',
            });
            console.error('Error al actualizar estado:', error);
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <Select
            value={estado}
            onValueChange={(value) => handleEstadoChange(value as EstadoEnvio)}
            disabled={isUpdating}
        >
            <SelectTrigger
                className={`h-8 text-xs font-medium ${ESTADO_COLORS[estado]} border-none w-[70px] max-w-[70px]`}
                title={ESTADO_LABELS[estado]}
            >
                <span className="flex-1 text-center truncate">
                    {ESTADO_LABELS_SHORT[estado]}
                </span>
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="pendiente">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-gray-400" />
                        <span>Pendiente</span>
                    </div>
                </SelectItem>
                <SelectItem value="pidiendo">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-sky-400" />
                        <span>Pidiendo</span>
                    </div>
                </SelectItem>
                <SelectItem value="en-viaje">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-yellow-400" />
                        <span>En Viaje</span>
                    </div>
                </SelectItem>
                <SelectItem value="listo">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-400" />
                        <span>Listo</span>
                    </div>
                </SelectItem>
            </SelectContent>
        </Select>
    );
}

