'use client'

import { useState } from 'react';
import { Button } from '@repo/design-system/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@repo/design-system/components/ui/dialog';
import { toast } from '@repo/design-system/hooks/use-toast';
import { ProveedorData } from './ProveedoresManager';

interface DeleteProveedorDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    proveedor: ProveedorData;
    onProveedorDeleted: (proveedorId: string) => void;
}

export function DeleteProveedorDialog({ open, onOpenChange, proveedor, onProveedorDeleted }: DeleteProveedorDialogProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handleDelete = async () => {
        setIsLoading(true);

        try {
            await onProveedorDeleted(proveedor.id);

            toast({
                title: 'Éxito',
                description: 'Proveedor eliminado correctamente'
            });

            onOpenChange(false);

        } catch (error) {
            console.error('Error deleting proveedor:', error);
            toast({
                title: 'Error',
                description: 'Error al eliminar el proveedor',
                variant: 'destructive'
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Eliminar Proveedor</DialogTitle>
                    <DialogDescription>
                        ¿Estás seguro de que quieres eliminar el proveedor "{proveedor.nombre}"?
                        <br />
                        <br />
                        Esta acción no se puede deshacer y se eliminarán todos los datos asociados.
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isLoading}
                    >
                        Cancelar
                    </Button>
                    <Button
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
