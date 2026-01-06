'use client';

import { useState, useRef, useEffect } from 'react';
import { Input } from '@repo/design-system/components/ui/input';
import { updateOrderAction } from '../../table/actions';

interface NotesOwnCellProps {
    orderId: string;
    currentNotes: string;
    onUpdate?: () => void | Promise<void>;
}

export function NotesOwnCell({ orderId, currentNotes, onUpdate }: NotesOwnCellProps) {
    const [value, setValue] = useState(currentNotes || '');
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Actualizar valor cuando cambie currentNotes (por ejemplo, después de un refresh)
    useEffect(() => {
        setValue(currentNotes || '');
    }, [currentNotes]);

    // Auto-focus cuando entra en modo edición
    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditing]);

    const handleSave = async (newValue: string) => {
        // Si el valor no cambió, no hacer nada
        if (newValue === currentNotes) {
            setIsEditing(false);
            return;
        }

        setIsSaving(true);
        setIsEditing(false); // Salir del modo edición inmediatamente
        
        try {
            const result = await updateOrderAction(orderId, {
                notesOwn: newValue
            });

            if (!result.success) {
                // Si falla, revertir al valor original
                setValue(currentNotes || '');
                alert('Error al guardar las notas');
            }
            // NO llamar a onUpdate para evitar refresh completo
        } catch (error) {
            console.error('Error saving notes:', error);
            setValue(currentNotes || '');
            alert('Error al guardar las notas');
        } finally {
            setIsSaving(false);
        }
    };

    const handleChange = (newValue: string) => {
        setValue(newValue);

        // Cancelar timeout anterior si existe
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        // Guardar automáticamente después de 1 segundo de inactividad
        saveTimeoutRef.current = setTimeout(() => {
            handleSave(newValue);
        }, 1000);
    };

    const handleBlur = () => {
        // Cancelar el timeout de auto-guardado
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
        // Guardar inmediatamente al salir del campo
        handleSave(value);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            // Cancelar el timeout de auto-guardado
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
            // Guardar inmediatamente
            handleSave(value);
        } else if (e.key === 'Escape') {
            e.preventDefault();
            // Cancelar el timeout de auto-guardado
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
            // Revertir al valor original
            setValue(currentNotes || '');
            setIsEditing(false);
        }
    };

    if (isEditing) {
        return (
            <Input
                ref={inputRef}
                value={value}
                onChange={(e) => handleChange(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                className="w-full text-sm h-8"
                placeholder="Escribe notas..."
            />
        );
    }

    return (
        <div
            onClick={() => setIsEditing(true)}
            className={`min-w-[100px] text-sm cursor-text hover:bg-gray-50 px-2 py-1 rounded transition-colors ${isSaving ? 'opacity-50' : ''}`}
            title="Click para editar"
        >
            {value || <span className="text-gray-400 italic">Sin notas...</span>}
            {isSaving && <span className="text-xs text-blue-500 ml-2">💾</span>}
        </div>
    );
}

