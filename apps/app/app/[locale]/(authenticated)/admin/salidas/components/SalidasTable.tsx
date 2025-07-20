'use client'

import { useState } from 'react';
import { TipoSalida, TipoRegistro } from '@repo/database';
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
import { AddSalidaModal } from './AddSalidaModal';
import { EditSalidaModal } from './EditSalidaModal';
import { DeleteSalidaDialog } from './DeleteSalidaDialog';
import { SalidaData } from '@repo/data-services';

interface SalidasTableProps {
    salidas?: SalidaData[];
    onRefreshSalidas?: () => void;
}

export function SalidasTable({ salidas = [], onRefreshSalidas }: SalidasTableProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedSalida, setSelectedSalida] = useState<SalidaData | null>(null);

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

    const getFormaPagoLabel = (metodoPago: string) => {
        const labels: Record<string, string> = {
            'EFECTIVO': 'Efectivo',
            'TRANSFERENCIA': 'Transfer.',
            'TARJETA DEBITO': 'T. Débito',
            'TARJETA CREDITO': 'T. Crédito',
            'MERCADO PAGO': 'M. Pago',
            'CHEQUE': 'Cheque'
        };
        return labels[metodoPago] || metodoPago;
    };

    const handleAddSalida = () => {
        setIsAddModalOpen(true);
    };

    const handleSalidaCreated = () => {
        if (onRefreshSalidas) {
            onRefreshSalidas();
        }
    };

    const handleEditSalida = (salida: SalidaData) => {
        setSelectedSalida(salida);
        setIsEditModalOpen(true);
    };

    const handleDeleteSalida = (salida: SalidaData) => {
        setSelectedSalida(salida);
        setIsDeleteDialogOpen(true);
    };

    const handleModalClose = () => {
        setSelectedSalida(null);
        setIsEditModalOpen(false);
        setIsDeleteDialogOpen(false);
    };

    return (
        <div className="space-y-4">
            {/* Header con botón de agregar */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-1">
                <div className="space-y-1">
                    <h3 className="text-lg font-semibold text-gray-900">Registro de Salidas</h3>
                    <p className="text-sm text-muted-foreground">
                        {salidas.length === 0
                            ? 'No hay salidas registradas'
                            : `${salidas.length} salida${salidas.length !== 1 ? 's' : ''} registrada${salidas.length !== 1 ? 's' : ''}`
                        }
                    </p>
                </div>
                <Button onClick={handleAddSalida} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Agregar Salida</span>
                    <span className="sm:hidden">Agregar</span>
                </Button>
            </div>

            {/* Tabla */}
            <div className="rounded-lg border overflow-hidden">
                <div className="overflow-x-auto">
                    <Table className="min-w-[1000px]">
                        <TableHeader>
                            <TableRow className="bg-muted/50">
                                <TableHead className="font-semibold w-[100px]">Fecha</TableHead>
                                <TableHead className="font-semibold min-w-[200px]">Detalle</TableHead>
                                <TableHead className="font-semibold w-[120px]">Categoría</TableHead>
                                <TableHead className="font-semibold w-[110px] text-center">Tipo</TableHead>
                                <TableHead className="font-semibold w-[100px]">Marca</TableHead>
                                <TableHead className="font-semibold w-[120px] text-right">Monto</TableHead>
                                <TableHead className="font-semibold w-[140px]">Forma de Pago</TableHead>
                                <TableHead className="font-semibold w-[100px] text-center">Registro</TableHead>
                                <TableHead className="font-semibold w-[100px] text-center">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {salidas.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="text-base font-medium">No hay salidas registradas aún</div>
                                            <div className="text-sm">Haz clic en "Agregar Salida" para comenzar</div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                salidas.map((salida) => (
                                    <TableRow key={salida.id} className="hover:bg-muted/30">
                                        <TableCell className="font-medium text-sm w-[100px]">
                                            {formatDate(salida.fecha)}
                                        </TableCell>
                                        <TableCell className="min-w-[200px] max-w-[300px]" title={salida.detalle}>
                                            <div className="truncate">
                                                {salida.detalle}
                                            </div>
                                        </TableCell>
                                        <TableCell className="w-[120px]">
                                            <Badge variant="secondary" className="text-xs">
                                                {salida.categoria?.nombre || 'Sin categoría'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="w-[110px] text-center">
                                            <Badge
                                                variant="outline"
                                                className={`${getTipoColor(salida.tipo)} text-xs`}
                                            >
                                                {salida.tipo === 'ORDINARIO' ? 'ORD' : 'EXT'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="w-[100px] text-sm">
                                            {salida.marca && salida.marca !== 'SIN_MARCA' ? (
                                                <div className="truncate" title={salida.marca}>
                                                    {salida.marca}
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right font-mono w-[120px] text-sm font-semibold">
                                            {formatCurrency(salida.monto)}
                                        </TableCell>
                                        <TableCell className="w-[140px]">
                                            <Badge variant="outline" className="text-xs">
                                                {getFormaPagoLabel(salida.metodoPago?.nombre || 'Sin método')}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="w-[100px] text-center">
                                            <Badge
                                                variant="outline"
                                                className={`${getTipoRegistroColor(salida.tipoRegistro)} text-xs`}
                                            >
                                                {salida.tipoRegistro}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="w-[100px]">
                                            <div className="flex items-center justify-center gap-1">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleEditSalida(salida)}
                                                    className="h-7 w-7 p-0 hover:bg-blue-50 text-blue-600"
                                                    title="Editar salida"
                                                >
                                                    <Edit className="h-3 w-3" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleDeleteSalida(salida)}
                                                    className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
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
            </div>

            {/* Información adicional */}
            <div className="text-sm text-muted-foreground space-y-1">
                <p>• Las salidas se muestran ordenadas por fecha (más recientes primero)</p>
                <p>• Usa los filtros para buscar salidas específicas</p>
                <p>• El tipo "ORDINARIO" representa gastos habituales, "EXTRAORDINARIO" gastos excepcionales</p>
                <p>• "BLANCO" son gastos declarados, "NEGRO" son gastos no declarados</p>
            </div>

            {/* Modal para agregar salida */}
            <AddSalidaModal
                open={isAddModalOpen}
                onOpenChange={setIsAddModalOpen}
                onSalidaCreated={handleSalidaCreated}
            />

            {/* Modal para editar salida */}
            {selectedSalida && (
                <EditSalidaModal
                    open={isEditModalOpen}
                    onOpenChange={(open) => {
                        setIsEditModalOpen(open);
                        if (!open) handleModalClose();
                    }}
                    salida={selectedSalida}
                    onSalidaUpdated={handleSalidaCreated}
                />
            )}

            {/* Diálogo para eliminar salida */}
            {selectedSalida && (
                <DeleteSalidaDialog
                    open={isDeleteDialogOpen}
                    onOpenChange={(open) => {
                        setIsDeleteDialogOpen(open);
                        if (!open) handleModalClose();
                    }}
                    salida={selectedSalida}
                    onSalidaDeleted={handleSalidaCreated}
                />
            )}
        </div>
    );
} 