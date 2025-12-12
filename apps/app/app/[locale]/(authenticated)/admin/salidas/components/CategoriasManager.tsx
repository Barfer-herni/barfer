'use client'

import { useState, useEffect } from 'react';
import { getAllCategoriasAction, createCategoriaAction } from '../actions';
import { DeleteCategoriaDialog } from './DeleteCategoriaDialog';
import { Button } from '@repo/design-system/components/ui/button';
import { Input } from '@repo/design-system/components/ui/input';
import { Label } from '@repo/design-system/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/design-system/components/ui/card';
import { Badge } from '@repo/design-system/components/ui/badge';
import { toast } from '@repo/design-system/hooks/use-toast';
import { Plus, Trash2, Edit } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@repo/design-system/components/ui/dialog';

interface CategoriaData {
    id: string;
    nombre: string;
    descripcion?: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export function CategoriasManager() {
    const [categorias, setCategorias] = useState<CategoriaData[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isAddingCategoria, setIsAddingCategoria] = useState(false);
    const [newCategoriaNombre, setNewCategoriaNombre] = useState('');

    // Estados para el diálogo de eliminación
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [categoriaToDelete, setCategoriaToDelete] = useState<CategoriaData | null>(null);

    // Cargar categorías al montar el componente
    useEffect(() => {
        loadCategorias();
    }, []);

    const loadCategorias = async () => {
        setIsLoading(true);
        try {
            const result = await getAllCategoriasAction();
            if (result.success && result.categorias) {
                setCategorias(result.categorias.map(c => ({
                    id: c._id,
                    nombre: c.nombre,
                    descripcion: c.descripcion,
                    isActive: c.isActive,
                    createdAt: c.createdAt,
                    updatedAt: c.updatedAt
                })));
            } else {
                toast({
                    title: "Error",
                    description: "Error al cargar las categorías",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error('Error loading categorias:', error);
            toast({
                title: "Error",
                description: "Error inesperado al cargar las categorías",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddCategoria = async () => {
        if (!newCategoriaNombre.trim()) {
            toast({
                title: "Error",
                description: "El nombre de la categoría es requerido",
                variant: "destructive",
            });
            return;
        }

        setIsAddingCategoria(true);
        try {
            console.log('[CategoriasManager] Attempting to create categoria:', newCategoriaNombre);
            // Enviar el nombre tal como está (el backend se encarga de normalizarlo)
            const result = await createCategoriaAction(newCategoriaNombre);
            
            console.log('[CategoriasManager] Create result:', result);

            if (result.success) {
                toast({
                    title: "Categoría creada",
                    description: "La categoría ha sido creada exitosamente.",
                });
                setNewCategoriaNombre('');
                loadCategorias(); // Recargar la lista
            } else {
                console.error('[CategoriasManager] Create failed:', result);
                toast({
                    title: "Error",
                    description: result.message || result.error || "Error al crear la categoría",
                    variant: "destructive",
                });
            }
        } catch (error: any) {
            console.error('[CategoriasManager] Error creating categoria:', error);
            toast({
                title: "Error",
                description: error?.message || "Error inesperado al crear la categoría",
                variant: "destructive",
            });
        } finally {
            setIsAddingCategoria(false);
        }
    };

    const handleDeleteCategoria = (categoria: CategoriaData) => {
        setCategoriaToDelete(categoria);
        setDeleteDialogOpen(true);
    };

    const handleCategoriaDeleted = () => {
        loadCategorias(); // Recargar la lista después de eliminar
    };

    const categoriasActivas = categorias.filter(cat => cat.isActive);
    const categoriasInactivas = categorias.filter(cat => !cat.isActive);

    return (
        <div className="space-y-6">
            {/* Sección para agregar nueva categoría */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Plus className="h-5 w-5" />
                        Agregar Nueva Categoría
                    </CardTitle>
                    <CardDescription>
                        Crea una nueva categoría para organizar las salidas
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="categoria-nombre">Nombre de la categoría</Label>
                            <Input
                                id="categoria-nombre"
                                value={newCategoriaNombre}
                                onChange={(e) => setNewCategoriaNombre(e.target.value)}
                                placeholder="Ej: SUELDOS, IMPUESTOS, etc."
                                disabled={isAddingCategoria}
                            />
                        </div>

                        <Button
                            onClick={handleAddCategoria}
                            disabled={isAddingCategoria || !newCategoriaNombre.trim()}
                            className="w-full"
                        >
                            {isAddingCategoria ? 'Creando...' : 'Crear Categoría'}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Lista de categorías activas */}
            <Card>
                <CardHeader>
                    <CardTitle>Categorías Activas</CardTitle>
                    <CardDescription>
                        Categorías disponibles para crear nuevas salidas
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="text-center py-4">Cargando categorías...</div>
                    ) : categoriasActivas.length === 0 ? (
                        <div className="text-center py-4 text-muted-foreground">
                            No hay categorías activas
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {categoriasActivas.map((categoria) => (
                                <div
                                    key={categoria.id}
                                    className="flex items-center justify-between p-3 border rounded-lg"
                                >
                                    <div className="flex-1">
                                        <div className="font-medium">{categoria.nombre}</div>
                                        {categoria.descripcion && (
                                            <div className="text-sm text-muted-foreground">
                                                {categoria.descripcion}
                                            </div>
                                        )}
                                        <div className="text-xs text-muted-foreground mt-1">
                                            Creada: {new Date(categoria.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="secondary">Activa</Badge>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleDeleteCategoria(categoria)}
                                            className="text-destructive hover:text-destructive"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Lista de categorías inactivas */}
            {categoriasInactivas.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Categorías Inactivas</CardTitle>
                        <CardDescription>
                            Categorías que han sido desactivadas
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {categoriasInactivas.map((categoria) => (
                                <div
                                    key={categoria.id}
                                    className="flex items-center justify-between p-3 border rounded-lg bg-muted/50"
                                >
                                    <div className="flex-1">
                                        <div className="font-medium text-muted-foreground">
                                            {categoria.nombre}
                                        </div>
                                        {categoria.descripcion && (
                                            <div className="text-sm text-muted-foreground">
                                                {categoria.descripcion}
                                            </div>
                                        )}
                                        <div className="text-xs text-muted-foreground mt-1">
                                            Desactivada: {new Date(categoria.updatedAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="text-muted-foreground">
                                        Inactiva
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Diálogo de confirmación para eliminar */}
            {categoriaToDelete && (
                <DeleteCategoriaDialog
                    open={deleteDialogOpen}
                    onOpenChange={setDeleteDialogOpen}
                    categoria={categoriaToDelete}
                    onCategoriaDeleted={handleCategoriaDeleted}
                />
            )}
        </div>
    );
} 