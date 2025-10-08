'use client'

import { useState, useEffect } from 'react';
import { Button } from '@repo/design-system/components/ui/button';
import { Input } from '@repo/design-system/components/ui/input';
import { Label } from '@repo/design-system/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/design-system/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@repo/design-system/components/ui/dialog';
import { toast } from '@repo/design-system/hooks/use-toast';
import { ProveedorData } from './ProveedoresManager';
import {
    getAllCategoriasAction,
    getAllMetodosPagoAction,
    createProveedorAction
} from '../actions';

interface AddProveedorModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onProveedorCreated: (proveedor: ProveedorData) => void;
}

export function AddProveedorModal({ open, onOpenChange, onProveedorCreated }: AddProveedorModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        nombre: '',
        detalle: '',
        telefono: '',
        personaContacto: '',
        registro: 'BLANCO' as 'BLANCO' | 'NEGRO',
        categoriaId: '',
        metodoPagoId: ''
    });

    // Estados para las opciones de categorías y métodos de pago
    const [categorias, setCategorias] = useState<Array<{ id: string, nombre: string }>>([]);
    const [metodosPago, setMetodosPago] = useState<Array<{ id: string, nombre: string }>>([]);

    // Cargar opciones al abrir el modal
    useEffect(() => {
        if (open) {
            loadOptions();
        }
    }, [open]);

    const loadOptions = async () => {
        try {
            const [categoriasResult, metodosPagoResult] = await Promise.all([
                getAllCategoriasAction(),
                getAllMetodosPagoAction()
            ]);

            if (categoriasResult.success && categoriasResult.categorias) {
                setCategorias(categoriasResult.categorias.map(c => ({ id: c._id, nombre: c.nombre })));
            }

            if (metodosPagoResult.success && metodosPagoResult.metodosPago) {
                // Filtrar solo EFECTIVO y TRANSFERENCIA
                const metodosFiltrados = metodosPagoResult.metodosPago
                    .filter(m => m.nombre === 'EFECTIVO' || m.nombre === 'TRANSFERENCIA')
                    .map(m => ({ id: m._id, nombre: m.nombre }));
                setMetodosPago(metodosFiltrados);
            }
        } catch (error) {
            console.error('Error loading options:', error);
        }
    };

    const handleInputChange = (field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // Validaciones
            if (!formData.nombre.trim()) {
                toast({
                    title: 'Error',
                    description: 'El nombre del proveedor es obligatorio',
                    variant: 'destructive'
                });
                return;
            }

            if (!formData.detalle.trim()) {
                toast({
                    title: 'Error',
                    description: 'El detalle es obligatorio',
                    variant: 'destructive'
                });
                return;
            }


            // Crear el proveedor usando la acción del servidor
            const proveedorData = {
                nombre: formData.nombre.trim(),
                detalle: formData.detalle.trim(),
                telefono: formData.telefono.trim(),
                personaContacto: formData.personaContacto.trim(),
                registro: formData.registro,
                categoriaId: formData.categoriaId === 'none' ? undefined : formData.categoriaId,
                metodoPagoId: formData.metodoPagoId === 'none' ? undefined : formData.metodoPagoId,
                isActive: true
            };

            const result = await createProveedorAction(proveedorData);

            if (result.success) {
                toast({
                    title: 'Éxito',
                    description: 'Proveedor creado correctamente'
                });

                // Limpiar formulario
                setFormData({
                    nombre: '',
                    detalle: '',
                    telefono: '',
                    personaContacto: '',
                    registro: 'BLANCO',
                    categoriaId: '',
                    metodoPagoId: ''
                });

                onOpenChange(false);

                // Notificar al componente padre para recargar la lista
                onProveedorCreated(result.proveedor as any);
            } else {
                toast({
                    title: 'Error',
                    description: result.message || 'Error al crear el proveedor',
                    variant: 'destructive'
                });
            }

        } catch (error) {
            console.error('Error creating proveedor:', error);
            toast({
                title: 'Error',
                description: 'Error al crear el proveedor',
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
                    <DialogTitle>Agregar Nuevo Proveedor</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="nombre">Proveedor *</Label>
                        <Input
                            id="nombre"
                            value={formData.nombre}
                            onChange={(e) => handleInputChange('nombre', e.target.value)}
                            placeholder="Ej: Distribuidora ABC"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="detalle">Detalle *</Label>
                        <Input
                            id="detalle"
                            value={formData.detalle}
                            onChange={(e) => handleInputChange('detalle', e.target.value)}
                            placeholder="Ej: visceras vacunas, alimentos balanceados"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="telefono">Teléfono</Label>
                        <Input
                            id="telefono"
                            value={formData.telefono}
                            onChange={(e) => handleInputChange('telefono', e.target.value)}
                            placeholder="Ej: 221 123-4567"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="personaContacto">Persona de Contacto</Label>
                        <Input
                            id="personaContacto"
                            value={formData.personaContacto}
                            onChange={(e) => handleInputChange('personaContacto', e.target.value)}
                            placeholder="Ej: Juan Pérez"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="registro">Registro</Label>
                        <Select value={formData.registro} onValueChange={(value) => handleInputChange('registro', value)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="BLANCO">Blanco (Registrado)</SelectItem>
                                <SelectItem value="NEGRO">Negro (No registrado)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="categoriaId">Categoría</Label>
                        <Select value={formData.categoriaId} onValueChange={(value) => handleInputChange('categoriaId', value)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar categoría" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">Sin categoría</SelectItem>
                                {categorias.map(categoria => (
                                    <SelectItem key={categoria.id} value={categoria.id}>
                                        {categoria.nombre}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="metodoPagoId">Forma de Pago Preferida</Label>
                        <Select value={formData.metodoPagoId} onValueChange={(value) => handleInputChange('metodoPagoId', value)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar método de pago" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">Sin método preferido</SelectItem>
                                {metodosPago.map(metodo => (
                                    <SelectItem key={metodo.id} value={metodo.id}>
                                        {metodo.nombre}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isLoading}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? 'Creando...' : 'Crear Proveedor'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
