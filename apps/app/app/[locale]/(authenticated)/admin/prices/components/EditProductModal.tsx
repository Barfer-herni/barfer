'use client'

import { useState, useEffect } from 'react';
import { PriceSection, PriceType } from '@repo/data-services';
import { updateProductAction, deleteProductAction, updateProductPriceTypesAction } from '../actions';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@repo/design-system/components/ui/dialog';
import { Button } from '@repo/design-system/components/ui/button';
import { Input } from '@repo/design-system/components/ui/input';
import { Label } from '@repo/design-system/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@repo/design-system/components/ui/select';
import { useToast } from '@repo/design-system/components/ui/use-toast';
import { Trash2 } from 'lucide-react';

interface Product {
    section: PriceSection;
    product: string;
    weight: string | null;
    priceTypes: PriceType[];
    totalPrices: number;
    isActive: boolean;
}

interface EditProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    onProductUpdated: () => void;
    product: Product | null;
}

export function EditProductModal({ isOpen, onClose, onProductUpdated, product }: EditProductModalProps) {
    const { toast } = useToast();
    const [isUpdating, setIsUpdating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Estados del formulario
    const [formData, setFormData] = useState({
        section: 'PERRO' as PriceSection,
        product: '',
        weight: 'none',
        priceTypes: [] as PriceType[],
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    // Opciones disponibles
    const sectionOptions: { value: PriceSection; label: string }[] = [
        { value: 'PERRO', label: '🐕 PERRO' },
        { value: 'GATO', label: '🐱 GATO' },
        { value: 'OTROS', label: '🦴 OTROS' },
        { value: 'RAW', label: '🥩 RAW' },
    ];

    const weightOptions = [
        { value: 'none', label: 'Sin peso específico' },
        { value: '5KG', label: '5KG' },
        { value: '10KG', label: '10KG' },
        { value: '15KG', label: '15KG' },
        { value: '200GRS', label: '200GRS' },
        { value: '100GRS', label: '100GRS' },
        { value: '30GRS', label: '30GRS' },
    ];

    const priceTypeOptions: { value: PriceType; label: string }[] = [
        { value: 'EFECTIVO', label: '💰 Efectivo' },
        { value: 'TRANSFERENCIA', label: '🏦 Transferencia' },
        { value: 'MAYORISTA', label: '📦 Mayorista' },
    ];

    // Cargar datos del producto cuando se abre el modal
    useEffect(() => {
        if (product && isOpen) {
            setFormData({
                section: product.section,
                product: product.product,
                weight: product.weight || 'none',
                priceTypes: product.priceTypes,
            });
            setErrors({});
        }
    }, [product, isOpen]);

    // Validar formulario
    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.product.trim()) {
            newErrors.product = 'El nombre del producto es obligatorio';
        }

        if (formData.priceTypes.length === 0) {
            newErrors.priceTypes = 'Debe seleccionar al menos un tipo de precio';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Resetear formulario
    const resetForm = () => {
        setFormData({
            section: 'PERRO' as PriceSection,
            product: '',
            weight: 'none',
            priceTypes: [],
        });
        setErrors({});
    };

    // Manejar tipos de precio
    const togglePriceType = (priceType: PriceType) => {
        setFormData(prev => ({
            ...prev,
            priceTypes: prev.priceTypes.includes(priceType)
                ? prev.priceTypes.filter(pt => pt !== priceType)
                : [...prev.priceTypes, priceType]
        }));
    };

    // Manejar actualización del producto
    const handleUpdate = async () => {
        if (!product || !validateForm()) {
            return;
        }

        setIsUpdating(true);
        try {
            const weight = formData.weight === 'none' ? null : formData.weight;

            console.log('🔧 FRONTEND UPDATE DEBUG:', {
                originalProduct: product,
                formData,
                convertedWeight: weight,
                weightConversion: `${formData.weight} -> ${weight}`
            });

            // Actualizar datos básicos del producto
            const basicResult = await updateProductAction(
                product.section,
                product.product,
                product.weight,
                {
                    section: formData.section,
                    product: formData.product.trim(),
                    weight,
                }
            );

            console.log('🔧 BASIC RESULT:', basicResult);

            // Actualizar tipos de precio si cambiaron
            const priceTypesChanged = JSON.stringify(product.priceTypes.sort()) !== JSON.stringify(formData.priceTypes.sort());
            let priceTypesResult: { success: boolean; addedCount: number; removedCount: number; message?: string; error?: string } = {
                success: true,
                addedCount: 0,
                removedCount: 0,
                message: ''
            };

            if (priceTypesChanged) {
                priceTypesResult = await updateProductPriceTypesAction(
                    formData.section,
                    formData.product.trim(),
                    weight,
                    product.priceTypes,
                    formData.priceTypes
                );
            }

            if (basicResult.success && priceTypesResult.success) {
                const message = priceTypesChanged
                    ? `${basicResult.message}. ${priceTypesResult.message}`
                    : basicResult.message || "El producto se actualizó exitosamente";

                toast({
                    title: "Producto actualizado",
                    description: message,
                });
                resetForm();
                onClose();
                onProductUpdated();
            } else {
                toast({
                    title: "Error",
                    description: basicResult.message || priceTypesResult.message || "Error al actualizar el producto",
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error('Error updating product:', error);
            toast({
                title: "Error",
                description: "Error inesperado al actualizar el producto",
                variant: "destructive"
            });
        } finally {
            setIsUpdating(false);
        }
    };

    // Manejar eliminación del producto
    const handleDelete = async () => {
        if (!product) return;

        if (!confirm(`¿Estás seguro de que quieres eliminar el producto "${product.product}"? Se eliminarán todos los precios asociados.`)) {
            return;
        }

        setIsDeleting(true);
        try {
            const result = await deleteProductAction(
                product.section,
                product.product,
                product.weight
            );

            if (result.success) {
                toast({
                    title: "Producto eliminado",
                    description: result.message || "El producto se eliminó exitosamente",
                });
                resetForm();
                onClose();
                onProductUpdated();
            } else {
                toast({
                    title: "Error",
                    description: result.message || "Error al eliminar el producto",
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error('Error deleting product:', error);
            toast({
                title: "Error",
                description: "Error inesperado al eliminar el producto",
                variant: "destructive"
            });
        } finally {
            setIsDeleting(false);
        }
    };

    // Manejar cierre del modal
    const handleClose = () => {
        if (!isUpdating && !isDeleting) {
            resetForm();
            onClose();
        }
    };

    if (!product) return null;

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Editar Producto</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Información del producto */}
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <h4 className="font-medium text-blue-900 mb-2">Información del Producto</h4>
                        <div className="text-sm text-blue-700 space-y-1">
                            <p><strong>Producto:</strong> {product.product}</p>
                            <p><strong>Sección:</strong> {product.section}</p>
                            <p><strong>Peso:</strong> {product.weight || 'Sin peso específico'}</p>
                            <p><strong>Tipos de precio:</strong> {product.priceTypes.join(', ')}</p>
                        </div>
                    </div>

                    {/* Sección */}
                    <div className="space-y-2">
                        <Label htmlFor="section">Sección *</Label>
                        <Select
                            value={formData.section}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, section: value as PriceSection }))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona una sección" />
                            </SelectTrigger>
                            <SelectContent>
                                {sectionOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Nombre del producto */}
                    <div className="space-y-2">
                        <Label htmlFor="product">Nombre del Producto *</Label>
                        <Input
                            id="product"
                            type="text"
                            placeholder="Ej: BIG DOG POLLO, VACA, CORDERO..."
                            value={formData.product}
                            onChange={(e) => setFormData(prev => ({ ...prev, product: e.target.value }))}
                            className={errors.product ? 'border-red-500' : ''}
                        />
                        {errors.product && (
                            <p className="text-sm text-red-500">{errors.product}</p>
                        )}
                    </div>

                    {/* Peso */}
                    <div className="space-y-2">
                        <Label htmlFor="weight">Peso</Label>
                        <Select
                            value={formData.weight}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, weight: value }))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona un peso" />
                            </SelectTrigger>
                            <SelectContent>
                                {weightOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Tipos de Precio */}
                    <div className="space-y-2">
                        <Label htmlFor="priceTypes">Tipos de Precio *</Label>
                        <div className="space-y-2">
                            {priceTypeOptions.map((option) => (
                                <div key={option.value} className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id={`priceType-${option.value}`}
                                        checked={formData.priceTypes.includes(option.value)}
                                        onChange={() => togglePriceType(option.value)}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <Label
                                        htmlFor={`priceType-${option.value}`}
                                        className="text-sm font-normal cursor-pointer"
                                    >
                                        {option.label}
                                    </Label>
                                </div>
                            ))}
                        </div>
                        {errors.priceTypes && (
                            <p className="text-sm text-red-500">{errors.priceTypes}</p>
                        )}
                    </div>
                </div>

                <DialogFooter className="flex justify-between">
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={isUpdating || isDeleting}
                        className="bg-red-600 hover:bg-red-700"
                    >
                        {isDeleting ? (
                            <div className="flex items-center gap-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Eliminando...
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Trash2 className="h-4 w-4" />
                                Eliminar Producto
                            </div>
                        )}
                    </Button>

                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={isUpdating || isDeleting}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="button"
                            onClick={handleUpdate}
                            disabled={isUpdating || isDeleting}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            {isUpdating ? (
                                <div className="flex items-center gap-2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Actualizando...
                                </div>
                            ) : (
                                "Actualizar Producto"
                            )}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
