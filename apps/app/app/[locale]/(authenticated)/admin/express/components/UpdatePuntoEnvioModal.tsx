'use client';

import { useState, useEffect } from 'react';
import { Button } from '@repo/design-system/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@repo/design-system/components/ui/dialog';
import { Input } from '@repo/design-system/components/ui/input';
import { Label } from '@repo/design-system/components/ui/label';
import { toast } from '@repo/design-system/hooks/use-toast';
import { updatePuntoEnvioAction } from '../actions';
import type { PuntoEnvio } from '@repo/data-services';

interface UpdatePuntoEnvioModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    puntoEnvio: PuntoEnvio | null;
    onPuntoEnvioUpdated: () => void;
}

export function UpdatePuntoEnvioModal({
    open,
    onOpenChange,
    puntoEnvio,
    onPuntoEnvioUpdated,
}: UpdatePuntoEnvioModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [nombre, setNombre] = useState('');
    const [cutoffTime, setCutoffTime] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (puntoEnvio) {
            setNombre(puntoEnvio.nombre);
            setCutoffTime(puntoEnvio.cutoffTime || '');
        }
    }, [puntoEnvio]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!puntoEnvio) return;

        if (!nombre.trim()) {
            setError('El nombre es requerido');
            return;
        }

        setIsLoading(true);

        try {
            const result = await updatePuntoEnvioAction(String(puntoEnvio._id), {
                nombre: nombre.trim(),
                cutoffTime: cutoffTime || undefined,
            });

            if (result.success) {
                toast({
                    title: '¡Éxito!',
                    description: result.message || 'Punto de envío actualizado correctamente',
                });

                onPuntoEnvioUpdated();
                onOpenChange(false);
            } else {
                toast({
                    title: 'Error',
                    description: result.message || 'Error al actualizar el punto de envío',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Ocurrió un error inesperado',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Editar Punto de Envío</DialogTitle>
                    <DialogDescription>
                        Modifica los datos del punto de envío.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="edit-nombre">Nombre del Punto de Envío *</Label>
                            <Input
                                id="edit-nombre"
                                placeholder="Ej: Córdoba"
                                value={nombre}
                                onChange={(e) => {
                                    setNombre(e.target.value);
                                    setError('');
                                }}
                                className={error ? 'border-red-500' : ''}
                                disabled={isLoading}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-cutoffTime">Hora de Corte (Opcional)</Label>
                            <Input
                                id="edit-cutoffTime"
                                type="time"
                                placeholder="Ej: 16:00"
                                value={cutoffTime}
                                onChange={(e) => setCutoffTime(e.target.value)}
                                disabled={isLoading}
                            />
                            <p className="text-xs text-muted-foreground">
                                Hora límite para que los pedidos entren en el día actual.
                            </p>
                            {error && (
                                <span className="text-red-500 text-sm">{error}</span>
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isLoading}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? 'Guardando...' : 'Guardar Cambios'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
