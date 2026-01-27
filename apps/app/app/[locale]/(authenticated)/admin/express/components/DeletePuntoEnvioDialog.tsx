'use client';

import { useState } from 'react';
import { Button } from '@repo/design-system/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@repo/design-system/components/ui/dialog';
import { toast } from '@repo/design-system/hooks/use-toast';
import { deletePuntoEnvioAction } from '../actions';
import type { PuntoEnvio } from '@repo/data-services';

interface DeletePuntoEnvioDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    puntoEnvio: PuntoEnvio | null;
    onDeleted: (deletedNombre: string) => void;
}

export function DeletePuntoEnvioDialog({
    open,
    onOpenChange,
    puntoEnvio,
    onDeleted,
}: DeletePuntoEnvioDialogProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handleDelete = async () => {
        if (!puntoEnvio) return;
        setIsLoading(true);

        try {
            const result = await deletePuntoEnvioAction(String(puntoEnvio._id));

            if (result.success) {
                toast({
                    title: 'Éxito',
                    description: result.message || 'Punto de envío eliminado correctamente',
                });
                onDeleted(puntoEnvio.nombre);
                onOpenChange(false);
            } else {
                toast({
                    title: 'Error',
                    description: result.message || 'Error al eliminar el punto de envío',
                    variant: 'destructive',
                });
            }
        } catch {
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
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Eliminar punto de envío</DialogTitle>
                    <DialogDescription>
                        ¿Estás seguro de que querés eliminar el punto de envío &quot;{puntoEnvio?.nombre}&quot;?
                        Se eliminarán también el stock y el detalle de envío asociados. Esta acción no se puede deshacer.
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isLoading}
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Eliminando...' : 'Eliminar'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
