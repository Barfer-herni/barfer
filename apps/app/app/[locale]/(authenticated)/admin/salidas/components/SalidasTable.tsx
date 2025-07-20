'use client'

import { useState } from 'react';
import { TipoSalida, FormaPago, TipoRegistro } from '@repo/database';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@repo/design-system/components/ui/table';
import { Button } from '@repo/design-system/components/ui/button';
import { Badge } from '@repo/design-system/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/design-system/components/ui/card';
import { toast } from '@repo/design-system/hooks/use-toast';
import { Plus, Edit, Trash2, Filter } from 'lucide-react';

interface Salida {
    id: string;
    fecha: Date;
    detalle: string;
    categoria: string;
    tipo: TipoSalida;
    marca?: string | null;
    monto: number;
    formaPago: FormaPago;
    tipoRegistro: TipoRegistro;
    createdAt: Date;
    updatedAt: Date;
}

interface SalidasTableProps {
    salidas?: Salida[];
}

export function SalidasTable({ salidas = [] }: SalidasTableProps) {
    const [isLoading, setIsLoading] = useState(false);

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('es-AR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).format(new Date(date));
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS'
        }).format(amount);
    };

    const getTipoColor = (tipo: TipoSalida) => {
        return tipo === 'ORDINARIO'
            ? 'bg-blue-100 text-blue-800 border-blue-200'
            : 'bg-orange-100 text-orange-800 border-orange-200';
    };

    const getTipoRegistroColor = (tipoRegistro: TipoRegistro) => {
        return tipoRegistro === 'BLANCO'
            ? 'bg-green-100 text-green-800 border-green-200'
            : 'bg-gray-100 text-gray-800 border-gray-200';
    };

    const getFormaPagoLabel = (formaPago: FormaPago) => {
        const labels: Record<FormaPago, string> = {
            EFECTIVO: 'Efectivo',
            TRANSFERENCIA: 'Transferencia',
            TARJETA_DEBITO: 'Tarjeta Débito',
            TARJETA_CREDITO: 'Tarjeta Crédito',
            MERCADO_PAGO: 'Mercado Pago',
            OTRO: 'Otro'
        };
        return labels[formaPago] || formaPago;
    };

    const handleAddSalida = () => {
        toast({
            title: "Funcionalidad en desarrollo",
            description: "Próximamente podrás agregar nuevas salidas",
        });
    };

    const handleEditSalida = (id: string) => {
        toast({
            title: "Funcionalidad en desarrollo",
            description: "Próximamente podrás editar salidas",
        });
    };

    const handleDeleteSalida = (id: string) => {
        toast({
            title: "Funcionalidad en desarrollo",
            description: "Próximamente podrás eliminar salidas",
        });
    };

    return (
        <div className="space-y-4">
            {/* Header con botón de agregar */}
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-semibold">Registro de Salidas</h3>
                    <p className="text-sm text-muted-foreground">
                        {salidas.length} salida{salidas.length !== 1 ? 's' : ''} registrada{salidas.length !== 1 ? 's' : ''}
                    </p>
                </div>
                <Button onClick={handleAddSalida} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Agregar Salida
                </Button>
            </div>

            {/* Tabla */}
            <div className="rounded-lg border">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead className="font-semibold">Fecha</TableHead>
                            <TableHead className="font-semibold">Detalle</TableHead>
                            <TableHead className="font-semibold">Categoría</TableHead>
                            <TableHead className="font-semibold">Tipo</TableHead>
                            <TableHead className="font-semibold">Marca</TableHead>
                            <TableHead className="font-semibold text-right">Monto</TableHead>
                            <TableHead className="font-semibold">Forma de Pago</TableHead>
                            <TableHead className="font-semibold">Registro</TableHead>
                            <TableHead className="font-semibold text-center">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {salidas.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                                    No hay salidas registradas aún.
                                    <br />
                                    <span className="text-sm">Haz clic en "Agregar Salida" para comenzar.</span>
                                </TableCell>
                            </TableRow>
                        ) : (
                            salidas.map((salida) => (
                                <TableRow key={salida.id} className="hover:bg-muted/30">
                                    <TableCell className="font-medium">
                                        {formatDate(salida.fecha)}
                                    </TableCell>
                                    <TableCell className="max-w-xs truncate" title={salida.detalle}>
                                        {salida.detalle}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary">
                                            {salida.categoria}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="outline"
                                            className={getTipoColor(salida.tipo)}
                                        >
                                            {salida.tipo}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {salida.marca ? (
                                            <span className="text-sm">{salida.marca}</span>
                                        ) : (
                                            <span className="text-muted-foreground">—</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right font-mono">
                                        {formatCurrency(salida.monto)}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">
                                            {getFormaPagoLabel(salida.formaPago)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="outline"
                                            className={getTipoRegistroColor(salida.tipoRegistro)}
                                        >
                                            {salida.tipoRegistro}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => handleEditSalida(salida.id)}
                                                className="h-8 w-8 p-0"
                                                title="Editar salida"
                                            >
                                                <Edit className="h-3 w-3" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => handleDeleteSalida(salida.id)}
                                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                title="Eliminar salida"
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Información adicional */}
            <div className="text-sm text-muted-foreground space-y-1">
                <p>• Las salidas se muestran ordenadas por fecha (más recientes primero)</p>
                <p>• Usa los filtros para buscar salidas específicas</p>
                <p>• El tipo "ORDINARIO" representa gastos habituales, "EXTRAORDINARIO" gastos excepcionales</p>
                <p>• "BLANCO" son gastos declarados, "NEGRO" son gastos no declarados</p>
            </div>
        </div>
    );
} 