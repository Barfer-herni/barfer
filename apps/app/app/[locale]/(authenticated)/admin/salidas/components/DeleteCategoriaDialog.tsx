'use client'

import { useState } from 'react';
import { deleteCategoriaAction } from '../actions';
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

interface CategoriaData {
    id: string;
    nombre: string;
    descripcion?: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

interface DeleteCategoriaDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    categoria: CategoriaData;
    onCategoriaDeleted: () => void;
}

export function DeleteCategoriaDialog({
    open,
    onOpenChange,
    categoria,
    onCategoriaDeleted
}: DeleteCategoriaDialogProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handleDelete = async () => {
        if (!categoria) return;

        setIsLoading(true);
        try {
            const result = await deleteCategoriaAction(categoria.id);

            if (result.success) {
                toast({
                    title: "Categoría eliminada",
                    description: "La categoría ha sido eliminada exitosamente.",
                });
                onCategoriaDeleted();
                onOpenChange(false);
            } else {
                toast({
                    title: "Error",
                    description: result.message || "Error al eliminar la categoría",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error('Error deleting categoria:', error);
            toast({
                title: "Error",
                description: "Error inesperado al eliminar la categoría",
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
                        Esta acción desactivará la categoría. Las salidas existentes que usen esta categoría no se verán afectadas, pero no se podrán crear nuevas salidas con esta categoría.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                {/* Información de la categoría */}
                <div className="mt-4 p-4 bg-muted rounded-lg">
                    <div className="space-y-2 text-sm">
                        <div><strong>Nombre:</strong> {categoria.nombre}</div>
                        {categoria.descripcion && (
                            <div><strong>Descripción:</strong> {categoria.descripcion}</div>
                        )}
                        <div><strong>Estado:</strong> {categoria.isActive ? 'Activa' : 'Inactiva'}</div>
                        <div><strong>Creada:</strong> {new Date(categoria.createdAt).toLocaleDateString()}</div>
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