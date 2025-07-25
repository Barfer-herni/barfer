'use client'

import { useState } from 'react';
import { deleteSalidaAction } from '../actions';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@repo/design-system/components/ui/alert-dialog';
import { toast } from '@repo/design-system/hooks/use-toast';
import { SalidaData } from '@repo/data-services';

interface DeleteSalidaDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    salida: SalidaData;
    onSalidaDeleted: () => void;
}

export function DeleteSalidaDialog({ open, onOpenChange, salida, onSalidaDeleted }: DeleteSalidaDialogProps) {
    const [isLoading, setIsLoading] = useState(false);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS'
        }).format(amount);
    };

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('es-AR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).format(new Date(date));
    };

    const handleDelete = async () => {
        setIsLoading(true);

        try {
            const result = await deleteSalidaAction(salida.id);

            if (result.success) {
                toast({
                    title: "¡Éxito!",
                    description: result.message || "Salida eliminada correctamente",
                });

                onSalidaDeleted();
                onOpenChange(false);
            } else {
                toast({
                    title: "Error",
                    description: result.message || "Error al eliminar la salida",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error('Error deleting salida:', error);
            toast({
                title: "Error",
                description: "Ocurrió un error inesperado",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta acción no se puede deshacer. Se eliminará permanentemente la siguiente salida:
                    </AlertDialogDescription>
                </AlertDialogHeader>

                {/* Información de la salida fuera del AlertDialogDescription */}
                <div className="mt-4 p-4 bg-muted rounded-lg">
                    <div className="space-y-2 text-sm">
                        <div><strong>Fecha:</strong> {formatDate(salida.fecha)}</div>
                        <div><strong>Detalle:</strong> {salida.detalle}</div>
                        <div><strong>Monto:</strong> {formatCurrency(salida.monto)}</div>
                        <div><strong>Categoría:</strong> {salida.categoria?.nombre}</div>
                        <div><strong>Método de pago:</strong> {salida.metodoPago?.nombre}</div>
                        {salida.marca && salida.marca !== 'Sin marca' && (
                            <div><strong>Marca:</strong> {salida.marca}</div>
                        )}
                    </div>
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isLoading}>
                        Cancelar
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDelete}
                        disabled={isLoading}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {isLoading ? 'Eliminando...' : 'Eliminar'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
} 