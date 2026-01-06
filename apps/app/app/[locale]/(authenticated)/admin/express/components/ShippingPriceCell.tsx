'use client';

import { useState, useEffect } from 'react';
import { Input } from '@repo/design-system/components/ui/input';
import { updateOrderAction } from '../../table/actions';
import type { Order } from '@repo/data-services';

interface ShippingPriceCellProps {
    orderId: string;
    currentPrice: number;
    onUpdate?: () => void;
    onOrderUpdate?: (updatedOrder: Order) => void;
}

export function ShippingPriceCell({ orderId, currentPrice, onUpdate, onOrderUpdate }: ShippingPriceCellProps) {
    // Estado local optimista: muestra el valor actualizado inmediatamente
    const [optimisticPrice, setOptimisticPrice] = useState<number>(currentPrice || 0);
    const [value, setValue] = useState<string>(currentPrice?.toString() || '0');
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [hasPendingChange, setHasPendingChange] = useState(false);

    // Sincronizar con el prop cuando cambia (por ejemplo, después de un refresh externo)
    // PERO solo si NO hay un cambio pendiente (para no sobrescribir el valor optimista)
    useEffect(() => {
        if (!isEditing && !isSaving && !hasPendingChange) {
            // Solo actualizar si el currentPrice es diferente del optimisticPrice
            if (currentPrice !== optimisticPrice) {
                console.log('🔄 ShippingPriceCell sync:', { orderId, currentPrice, optimisticPrice });
                setOptimisticPrice(currentPrice || 0);
                setValue(currentPrice?.toString() || '0');
            }
        }
    }, [currentPrice, isEditing, isSaving, hasPendingChange, optimisticPrice, orderId]);

    const handleBlur = async () => {
        if (isSaving) return;
        
        const numValue = Number(value);
        const currentNumValue = optimisticPrice;
        
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

        // Actualización optimista: mostrar el nuevo valor inmediatamente
        setOptimisticPrice(numValue);
        setHasPendingChange(true);
        setIsSaving(true);
        setIsEditing(false);
        
        try {
            const result = await updateOrderAction(orderId, {
                shippingPrice: numValue
            });

            if (!result.success) {
                // Revertir el valor optimista si falla
                setOptimisticPrice(currentPrice || 0);
                setValue((currentPrice || 0).toString());
                setHasPendingChange(false);
                alert(result.error || 'Error al actualizar el costo de envío');
            } else if (result.order && onOrderUpdate) {
                // Actualizar el estado del padre con la orden actualizada
                console.log('✅ ShippingPriceCell saved:', { orderId, newPrice: numValue, orderFromServer: result.order.shippingPrice });
                onOrderUpdate(result.order);
                // Limpiar el flag de cambio pendiente después de que el padre se actualice
                setTimeout(() => setHasPendingChange(false), 100);
            }
            // NO llamar a onUpdate para evitar refresh completo
        } catch (error) {
            // Revertir el valor optimista si hay error
            setOptimisticPrice(currentPrice || 0);
            setValue((currentPrice || 0).toString());
            setHasPendingChange(false);
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
            setValue(optimisticPrice.toString());
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

    // Mostrar valor optimista formateado cuando no está editando
    const rounded = Math.round(optimisticPrice);
    const formatted = new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(rounded);

    return (
        <div 
            className={`font-medium text-center min-w-[100px] text-sm cursor-pointer hover:bg-gray-100 px-2 py-1 rounded transition-colors ${isSaving ? 'opacity-60' : ''}`}
            onClick={handleFocus}
            title={isSaving ? "Guardando..." : "Click para editar"}
        >
            {formatted}
        </div>
    );
}

