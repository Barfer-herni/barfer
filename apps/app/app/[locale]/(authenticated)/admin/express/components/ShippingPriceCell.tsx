'use client';

import { useState } from 'react';
import { Input } from '@repo/design-system/components/ui/input';
import { updateOrderAction } from '../../table/actions';

interface ShippingPriceCellProps {
    orderId: string;
    currentPrice: number;
    onUpdate?: () => void;
}

export function ShippingPriceCell({ orderId, currentPrice, onUpdate }: ShippingPriceCellProps) {
    const [value, setValue] = useState<string>(currentPrice?.toString() || '0');
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const handleBlur = async () => {
        if (isSaving) return;
        
        const numValue = Number(value);
        const currentNumValue = currentPrice || 0;
        
        // Si el valor no cambió, solo salir del modo edición
        if (numValue === currentNumValue) {
            setIsEditing(false);
            return;
        }

        // Validar que sea un número válido
        if (isNaN(numValue) || numValue < 0) {
            setValue(currentNumValue.toString());
            setIsEditing(false);
            return;
        }

        setIsSaving(true);
        try {
            const result = await updateOrderAction(orderId, {
                shippingPrice: numValue
            });

            if (result.success) {
                setIsEditing(false);
                // Llamar al callback para recargar datos si está disponible
                if (onUpdate) {
                    onUpdate();
                }
            } else {
                // Revertir el valor si falla
                setValue(currentNumValue.toString());
                alert(result.error || 'Error al actualizar el costo de envío');
            }
        } catch (error) {
            // Revertir el valor si hay error
            setValue(currentNumValue.toString());
            console.error('Error updating shipping price:', error);
            alert('Error al actualizar el costo de envío');
        } finally {
            setIsSaving(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.currentTarget.blur();
        } else if (e.key === 'Escape') {
            setValue(currentPrice?.toString() || '0');
            setIsEditing(false);
        }
    };

    const handleFocus = () => {
        setIsEditing(true);
    };

    if (isEditing) {
        return (
            <div className="min-w-[100px] flex items-center justify-center">
                <Input
                    type="number"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    disabled={isSaving}
                    className="w-20 h-7 text-xs text-center"
                    autoFocus
                />
            </div>
        );
    }

    // Mostrar valor formateado cuando no está editando
    const rounded = Math.round(currentPrice || 0);
    const formatted = new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(rounded);

    return (
        <div 
            className="font-medium text-center min-w-[100px] text-sm cursor-pointer hover:bg-gray-100 px-2 py-1 rounded transition-colors"
            onClick={handleFocus}
            title="Click para editar"
        >
            {formatted}
        </div>
    );
}

