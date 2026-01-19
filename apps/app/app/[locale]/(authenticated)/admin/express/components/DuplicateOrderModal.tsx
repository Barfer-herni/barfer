'use client';

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@repo/design-system/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@repo/design-system/components/ui/select';
import { Button } from '@repo/design-system/components/ui/button';
import type { PuntoEnvio } from '@repo/data-services';

interface DuplicateOrderModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    puntosEnvio: PuntoEnvio[];
    currentPuntoEnvio: string;
    onConfirm: (targetPuntoEnvio: string) => void;
}

export function DuplicateOrderModal({
    open,
    onOpenChange,
    puntosEnvio,
    currentPuntoEnvio,
    onConfirm,
}: DuplicateOrderModalProps) {
    const [selectedPuntoEnvio, setSelectedPuntoEnvio] = useState<string>(currentPuntoEnvio);

    // Actualizar el punto de envío seleccionado cuando cambia el punto actual
    useEffect(() => {
        setSelectedPuntoEnvio(currentPuntoEnvio);
    }, [currentPuntoEnvio]);

    const handleConfirm = () => {
        onConfirm(selectedPuntoEnvio);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Duplicar Pedido</DialogTitle>
                    <DialogDescription>
                        Selecciona en qué punto de envío deseas duplicar este pedido.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <label htmlFor="punto-envio" className="text-sm font-medium">
                            Punto de Envío
                        </label>
                        <Select value={selectedPuntoEnvio} onValueChange={setSelectedPuntoEnvio}>
                            <SelectTrigger id="punto-envio">
                                <SelectValue placeholder="Selecciona un punto de envío" />
                            </SelectTrigger>
                            <SelectContent>
                                {puntosEnvio.map((punto) => (
                                    <SelectItem key={String(punto._id)} value={punto.nombre}>
                                        {punto.nombre}
                                        {punto.nombre === currentPuntoEnvio && ' (actual)'}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button onClick={handleConfirm}>Duplicar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
