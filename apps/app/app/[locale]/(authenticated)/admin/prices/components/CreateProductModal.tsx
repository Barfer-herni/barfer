'use client'

import { useState } from 'react';
import { PriceSection, PriceType } from '@repo/data-services';
import { createPriceAction } from '../actions';
import type { CreatePriceData } from '@repo/data-services';
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
import { Checkbox } from '@repo/design-system/components/ui/checkbox';
import { useToast } from '@repo/design-system/components/ui/use-toast';

interface CreateProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    onProductCreated: () => void;
    currentMonth: number;
    currentYear: number;
}

export function CreateProductModal({ isOpen, onClose, onProductCreated, currentMonth, currentYear }: CreateProductModalProps) {
    const { toast } = useToast();
    const [isCreating, setIsCreating] = useState(false);

    // Estados del formulario
    interface FormData {
        section: PriceSection;
        product: string;
        weight: string;
        priceTypes: PriceType[];
    }

    const [formData, setFormData] = useState<FormData>({
        section: 'PERRO' as PriceSection,
        product: '',
        weight: 'none',
        priceTypes: ['EFECTIVO'] as PriceType[],
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    // Opciones disponibles
    const sectionOptions: { value: PriceSection; label: string }[] = [
        { value: 'PERRO', label: '🐕 PERRO' },
        { value: 'GATO', label: '🐱 GATO' },
        { value: 'OTROS', label: '🦴 OTROS' },
        { value: 'RAW', label: '🥩 RAW' },
    ];

    const priceTypeOptions: { value: PriceType; label: string }[] = [
        { value: 'EFECTIVO', label: 'Efectivo' },
        { value: 'TRANSFERENCIA', label: 'Transferencia' },
        { value: 'MAYORISTA', label: 'Mayorista' },
    ];

    const weightOptions = [
        { value: 'none', label: 'Sin peso específico' },
        { value: '5KG', label: '5KG' },
        { value: '10KG', label: '10KG' },
        { value: '15KG', label: '15KG' },
        { value: '200GRS', label: '200GRS' },
        { value: '30GRS', label: '30GRS' },
    ];

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

    // Manejar cambios en los tipos de precio
    const handlePriceTypeChange = (priceType: PriceType, checked: boolean) => {
        setFormData(prev => ({
            ...prev,
            priceTypes: checked
                ? [...prev.priceTypes, priceType]
                : prev.priceTypes.filter(type => type !== priceType)
        }));
    };

    // Resetear formulario
    const resetForm = () => {
        setFormData({
            section: 'PERRO' as PriceSection,
            product: '',
            weight: 'none',
            priceTypes: ['EFECTIVO'] as PriceType[],
        });
        setErrors({});
    };

    // Manejar envío del formulario
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsCreating(true);
        try {
            const weight = formData.weight === 'none' ? undefined : formData.weight;
            const productName = formData.product.trim();

            // Crear un precio por cada tipo de precio seleccionado
            const createPromises = formData.priceTypes.map(priceType => {
                const priceData: CreatePriceData = {
                    section: formData.section,
                    product: productName,
                    weight,
                    priceType,
                    price: 0, // Precio inicial en $0
                    isActive: true,
                    // Usar la fecha del período actual (currentMonth/currentYear)
                    effectiveDate: `${currentYear}-${String(currentMonth).padStart(2, '0')}-15`
                };
                return createPriceAction(priceData);
            });

            const results = await Promise.all(createPromises);

            // Verificar si todos los precios se crearon exitosamente
            const failedResults = results.filter(result => !result.success);

            if (failedResults.length === 0) {
                toast({
                    title: "Producto creado",
                    description: `Se crearon ${results.length} precios para "${productName}" en ${getMonthName(currentMonth)} ${currentYear}`,
                });
                resetForm();
                onClose();
                onProductCreated(); // Refrescar la tabla
            } else {
                toast({
                    title: "Error parcial",
                    description: `Se crearon ${results.length - failedResults.length} de ${results.length} precios. Algunos fallaron.`,
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error('Error creating prices:', error);
            toast({
                title: "Error",
                description: "Error inesperado al crear los precios",
                variant: "destructive"
            });
        } finally {
            setIsCreating(false);
        }
    };

    // Función para obtener el nombre del mes
    const getMonthName = (month: number) => {
        const months = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];
        return months[month - 1];
    };

    // Manejar cierre del modal
    const handleClose = () => {
        if (!isCreating) {
            resetForm();
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Crear Nuevo Producto</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
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

                    {/* Tipos de precio */}
                    <div className="space-y-2">
                        <Label>Tipos de Precio *</Label>
                        <div className="space-y-2">
                            {priceTypeOptions.map((option) => (
                                <div key={option.value} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={option.value}
                                        checked={formData.priceTypes.includes(option.value)}
                                        onCheckedChange={(checked) =>
                                            handlePriceTypeChange(option.value, checked as boolean)
                                        }
                                    />
                                    <Label htmlFor={option.value} className="text-sm font-normal">
                                        {option.label}
                                    </Label>
                                </div>
                            ))}
                        </div>
                        {errors.priceTypes && (
                            <p className="text-sm text-red-500">{errors.priceTypes}</p>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={isCreating}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={isCreating}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            {isCreating ? (
                                <div className="flex items-center gap-2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Creando...
                                </div>
                            ) : (
                                "Crear Producto"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
