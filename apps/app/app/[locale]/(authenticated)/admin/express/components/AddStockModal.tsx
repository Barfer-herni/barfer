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
import { Input } from '@repo/design-system/components/ui/input';
import { Label } from '@repo/design-system/components/ui/label';
import { toast } from '@repo/design-system/hooks/use-toast';
import { Calendar } from '@repo/design-system/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@repo/design-system/components/ui/popover';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@repo/design-system/lib/utils';

interface AddStockModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    puntoEnvio: string;
    onStockCreated: () => void;
}

export function AddStockModal({
    open,
    onOpenChange,
    puntoEnvio,
    onStockCreated,
}: AddStockModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        producto: '',
        peso: '',
        stockInicial: 0,
        llevamos: 0,
        pedidosDelDia: 0,
        fecha: new Date(),
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});

        // Validación
        const newErrors: Record<string, string> = {};
        if (!formData.producto.trim()) {
            newErrors.producto = 'El producto es requerido';
        }
        if (formData.stockInicial < 0) {
            newErrors.stockInicial = 'El stock inicial no puede ser negativo';
        }
        if (formData.llevamos < 0) {
            newErrors.llevamos = 'La cantidad llevada no puede ser negativa';
        }
        if (formData.pedidosDelDia < 0) {
            newErrors.pedidosDelDia = 'Los pedidos del día no pueden ser negativos';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setIsLoading(true);

        try {
            const { createStockAction } = await import('../actions');
            
            const result = await createStockAction({
                puntoEnvio,
                producto: formData.producto.trim(),
                peso: formData.peso.trim() || undefined,
                stockInicial: formData.stockInicial,
                llevamos: formData.llevamos,
                pedidosDelDia: formData.pedidosDelDia,
                stockFinal: formData.stockInicial - formData.llevamos,
                fecha: formData.fecha.toISOString(),
            });

            if (result.success) {
                toast({
                    title: '¡Éxito!',
                    description: result.message || 'Stock creado correctamente',
                });

                // Resetear formulario
                setFormData({
                    producto: '',
                    peso: '',
                    stockInicial: 0,
                    llevamos: 0,
                    pedidosDelDia: 0,
                    fecha: new Date(),
                });
                setErrors({});

                onStockCreated();
                onOpenChange(false);
            } else {
                toast({
                    title: 'Error',
                    description: result.message || 'Error al crear el stock',
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

    const stockFinal = formData.stockInicial - formData.llevamos;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Agregar Registro de Stock</DialogTitle>
                    <DialogDescription>
                        Registra el stock de un producto para este punto de envío
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        {/* Producto y Peso */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="producto">Producto *</Label>
                                <Input
                                    id="producto"
                                    placeholder="Ej: Pollo"
                                    value={formData.producto}
                                    onChange={(e) => {
                                        setFormData({ ...formData, producto: e.target.value });
                                        setErrors({ ...errors, producto: '' });
                                    }}
                                    className={errors.producto ? 'border-red-500' : ''}
                                    disabled={isLoading}
                                />
                                {errors.producto && (
                                    <span className="text-red-500 text-sm">{errors.producto}</span>
                                )}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="peso">Peso (opcional)</Label>
                                <Input
                                    id="peso"
                                    placeholder="Ej: 5KG"
                                    value={formData.peso}
                                    onChange={(e) => setFormData({ ...formData, peso: e.target.value })}
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        {/* Stock Inicial y Llevamos */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="stockInicial">Stock Inicial *</Label>
                                <Input
                                    id="stockInicial"
                                    type="number"
                                    min="0"
                                    value={formData.stockInicial}
                                    onChange={(e) => {
                                        setFormData({ ...formData, stockInicial: Number(e.target.value) });
                                        setErrors({ ...errors, stockInicial: '' });
                                    }}
                                    className={errors.stockInicial ? 'border-red-500' : ''}
                                    disabled={isLoading}
                                />
                                {errors.stockInicial && (
                                    <span className="text-red-500 text-sm">{errors.stockInicial}</span>
                                )}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="llevamos">Llevamos *</Label>
                                <Input
                                    id="llevamos"
                                    type="number"
                                    min="0"
                                    value={formData.llevamos}
                                    onChange={(e) => {
                                        setFormData({ ...formData, llevamos: Number(e.target.value) });
                                        setErrors({ ...errors, llevamos: '' });
                                    }}
                                    className={errors.llevamos ? 'border-red-500' : ''}
                                    disabled={isLoading}
                                />
                                {errors.llevamos && (
                                    <span className="text-red-500 text-sm">{errors.llevamos}</span>
                                )}
                            </div>
                        </div>

                        {/* Pedidos del Día y Fecha */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="pedidosDelDia">Pedidos del Día *</Label>
                                <Input
                                    id="pedidosDelDia"
                                    type="number"
                                    min="0"
                                    value={formData.pedidosDelDia}
                                    onChange={(e) => {
                                        setFormData({ ...formData, pedidosDelDia: Number(e.target.value) });
                                        setErrors({ ...errors, pedidosDelDia: '' });
                                    }}
                                    className={errors.pedidosDelDia ? 'border-red-500' : ''}
                                    disabled={isLoading}
                                />
                                {errors.pedidosDelDia && (
                                    <span className="text-red-500 text-sm">{errors.pedidosDelDia}</span>
                                )}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="fecha">Fecha *</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                'justify-start text-left font-normal',
                                                !formData.fecha && 'text-muted-foreground'
                                            )}
                                            disabled={isLoading}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {formData.fecha ? format(formData.fecha, 'PPP', { locale: es }) : 'Seleccionar fecha'}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={formData.fecha}
                                            onSelect={(date) => date && setFormData({ ...formData, fecha: date })}
                                            initialFocus
                                            locale={es}
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>

                        {/* Stock Final (calculado) */}
                        <div className="grid gap-2">
                            <Label>Stock Final (calculado)</Label>
                            <div className="p-2 bg-gray-100 rounded-md text-center font-bold">
                                {stockFinal}
                            </div>
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
                            {isLoading ? 'Guardando...' : 'Guardar Stock'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

