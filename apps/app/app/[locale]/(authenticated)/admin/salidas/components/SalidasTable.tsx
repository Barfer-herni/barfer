'use client'

import { useState, useMemo } from 'react';
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
import { Input } from '@repo/design-system/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/design-system/components/ui/select';
import { toast } from '@repo/design-system/hooks/use-toast';
import { Plus, Edit, Trash2, Filter, Search, X } from 'lucide-react';
import { AddSalidaModal } from './AddSalidaModal';
import { EditSalidaModal } from './EditSalidaModal';
import { DeleteSalidaDialog } from './DeleteSalidaDialog';
import { SalidaData } from '@repo/data-services';

// Funciones de permisos del cliente (definidas localmente)
function hasAllCategoriesPermission(permissions: string[]): boolean {
    return permissions.includes('outputs:view_all_categories');
}

function getCategoryPermissions(permissions: string[]): string[] {
    return permissions.filter(p => p.startsWith('outputs:view_category:'));
}

interface SalidasTableProps {
    salidas?: SalidaData[];
    onRefreshSalidas?: () => void;
    userPermissions?: string[];
}

export function SalidasTable({ salidas = [], onRefreshSalidas, userPermissions = [] }: SalidasTableProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedSalida, setSelectedSalida] = useState<SalidaData | null>(null);

    // Estados para los filtros
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategoria, setSelectedCategoria] = useState<string>('');
    const [selectedMarca, setSelectedMarca] = useState<string>('');
    const [selectedMetodoPago, setSelectedMetodoPago] = useState<string>('');
    const [selectedTipo, setSelectedTipo] = useState<string>('');
    const [selectedTipoRegistro, setSelectedTipoRegistro] = useState<string>('');
    const [selectedFecha, setSelectedFecha] = useState<string>('');

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
            currency: 'ARS',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
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

    // Obtener opciones únicas para los filtros
    const uniqueCategorias = useMemo(() => {
        const categorias = salidas
            .map(s => s.categoria?.nombre)
            .filter((name): name is string => name !== undefined)
            .filter((name, index, array) => array.indexOf(name) === index);
        return categorias.sort();
    }, [salidas]);

    const uniqueMarcas = useMemo(() => {
        const marcas = salidas
            .map(s => s.marca)
            .filter((marca): marca is string => marca !== undefined && marca !== 'SIN_MARCA')
            .filter((marca, index, array) => array.indexOf(marca) === index);
        return marcas.sort();
    }, [salidas]);

    const uniqueMetodosPago = useMemo(() => {
        const metodos = salidas
            .map(s => s.metodoPago?.nombre)
            .filter((name): name is string => name !== undefined)
            .filter((name, index, array) => array.indexOf(name) === index);
        return metodos.sort();
    }, [salidas]);

    // Filtrar las salidas
    const filteredSalidas = useMemo(() => {
        return salidas.filter(salida => {
            // Filtro por texto de búsqueda
            if (searchTerm) {
                const searchLower = searchTerm.toLowerCase();
                const matchesDetalle = salida.detalle.toLowerCase().includes(searchLower);
                const matchesCategoria = salida.categoria?.nombre?.toLowerCase().includes(searchLower);
                const matchesMarca = salida.marca?.toLowerCase().includes(searchLower);
                const matchesMetodoPago = salida.metodoPago?.nombre?.toLowerCase().includes(searchLower);
                const matchesMonto = salida.monto.toString().includes(searchTerm);

                if (!matchesDetalle && !matchesCategoria && !matchesMarca && !matchesMetodoPago && !matchesMonto) {
                    return false;
                }
            }

            // Filtro por categoría
            if (selectedCategoria && salida.categoria?.nombre !== selectedCategoria) {
                return false;
            }

            // Filtro por marca
            if (selectedMarca && salida.marca !== selectedMarca) {
                return false;
            }

            // Filtro por método de pago
            if (selectedMetodoPago && salida.metodoPago?.nombre !== selectedMetodoPago) {
                return false;
            }

            // Filtro por tipo
            if (selectedTipo && salida.tipo !== selectedTipo) {
                return false;
            }

            // Filtro por tipo de registro
            if (selectedTipoRegistro && salida.tipoRegistro !== selectedTipoRegistro) {
                return false;
            }

            // Filtro por fecha exacta
            if (selectedFecha) {
                const fechaSalida = new Date(salida.fecha);
                const fechaFilter = new Date(selectedFecha);

                // Comparar solo año, mes y día (ignorar tiempo)
                const salidaDateString = fechaSalida.toISOString().split('T')[0];
                const filterDateString = fechaFilter.toISOString().split('T')[0];

                if (salidaDateString !== filterDateString) {
                    return false;
                }
            }

            return true;
        });
    }, [salidas, searchTerm, selectedCategoria, selectedMarca, selectedMetodoPago, selectedTipo, selectedTipoRegistro, selectedFecha]);

    const clearFilters = () => {
        setSearchTerm('');
        setSelectedCategoria('');
        setSelectedMarca('');
        setSelectedMetodoPago('');
        setSelectedTipo('');
        setSelectedTipoRegistro('');
        setSelectedFecha('');
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
                            : `${filteredSalidas.length} de ${salidas.length} salida${salidas.length !== 1 ? 's' : ''} mostrada${salidas.length !== 1 ? 's' : ''}${filteredSalidas.length !== salidas.length ? ' (filtradas)' : ''}`
                        }
                    </p>
                </div>
                {userPermissions.includes('outputs:create') && (
                    <Button onClick={handleAddSalida} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
                        <Plus className="h-4 w-4" />
                        <span className="hidden sm:inline">Agregar Salida</span>
                        <span className="sm:hidden">Agregar</span>
                    </Button>
                )}
            </div>

            {/* Panel de filtros */}
            <Card>
                <CardHeader className="pb-4">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Filter className="h-4 w-4" />
                        Filtros de Búsqueda
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Buscador de texto */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                            placeholder="Buscar por detalle, categoría, marca, método de pago o monto..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    {/* Filtros organizados en dos filas */}
                    <div className="space-y-3">
                        {/* Primera fila: Filtros principales */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {/* Categoría */}
                            <Select value={selectedCategoria} onValueChange={setSelectedCategoria}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Categoría" />
                                </SelectTrigger>
                                <SelectContent>
                                    {uniqueCategorias.map(categoria => (
                                        <SelectItem key={categoria} value={categoria}>
                                            {categoria}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {/* Marca */}
                            <Select value={selectedMarca} onValueChange={setSelectedMarca}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Marca" />
                                </SelectTrigger>
                                <SelectContent>
                                    {uniqueMarcas.map(marca => (
                                        <SelectItem key={marca} value={marca}>
                                            {marca}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {/* Método de pago */}
                            <Select value={selectedMetodoPago} onValueChange={setSelectedMetodoPago}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Forma de pago" />
                                </SelectTrigger>
                                <SelectContent>
                                    {uniqueMetodosPago.map(metodo => (
                                        <SelectItem key={metodo} value={metodo}>
                                            {getFormaPagoLabel(metodo)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {/* Tipo */}
                            <Select value={selectedTipo} onValueChange={setSelectedTipo}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ORDINARIO">Ordinario</SelectItem>
                                    <SelectItem value="EXTRAORDINARIO">Extraordinario</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Segunda fila: Filtros adicionales */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {/* Tipo de registro */}
                            <Select value={selectedTipoRegistro} onValueChange={setSelectedTipoRegistro}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Registro" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="BLANCO">Blanco</SelectItem>
                                    <SelectItem value="NEGRO">Negro</SelectItem>
                                </SelectContent>
                            </Select>

                            {/* Fecha específica */}
                            <Input
                                type="date"
                                value={selectedFecha}
                                onChange={(e) => setSelectedFecha(e.target.value)}
                                className="text-sm"
                                title="Filtrar por fecha específica"
                            />

                            {/* Espacio vacío para balancear */}
                            <div></div>

                            {/* Botón de limpiar filtros */}
                            <Button
                                variant="outline"
                                onClick={clearFilters}
                                className="flex items-center gap-2 justify-center"
                            >
                                <X className="h-4 w-4" />
                                Limpiar
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

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
                            {filteredSalidas.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                                        <div className="flex flex-col items-center gap-2">
                                            {salidas.length === 0 ? (
                                                <>
                                                    <div className="text-base font-medium">No hay salidas registradas aún</div>
                                                    <div className="text-sm">Haz clic en "Agregar Salida" para comenzar</div>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="text-base font-medium">No se encontraron salidas</div>
                                                    <div className="text-sm">Intenta con diferentes filtros de búsqueda</div>
                                                </>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredSalidas.map((salida) => (
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
                                                {userPermissions.includes('outputs:edit') && (
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleEditSalida(salida)}
                                                        className="h-7 w-7 p-0 hover:bg-blue-50 text-blue-600"
                                                        title="Editar salida"
                                                    >
                                                        <Edit className="h-3 w-3" />
                                                    </Button>
                                                )}
                                                {userPermissions.includes('outputs:delete') && (
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleDeleteSalida(salida)}
                                                        className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                        title="Eliminar salida"
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                )}
                                                {!userPermissions.includes('outputs:edit') && !userPermissions.includes('outputs:delete') && (
                                                    <span className="text-xs text-muted-foreground">Sin permisos</span>
                                                )}
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
                <p>• Usa el buscador de texto para buscar en detalle, categoría, marca, método de pago o monto</p>
                <p>• Los filtros desplegables permiten filtrar por criterios específicos</p>
                <p>• Usa el filtro "Fecha" para mostrar solo salidas de una fecha específica</p>
                <p>• El tipo "ORDINARIO" representa gastos habituales, "EXTRAORDINARIO" gastos excepcionales</p>
                <p>• "BLANCO" son gastos declarados, "NEGRO" son gastos no declarados</p>
                {!hasAllCategoriesPermission(userPermissions) &&
                    getCategoryPermissions(userPermissions).length === 0 && (
                        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
                            <p className="text-amber-800 font-medium">⚠️ Información sobre permisos</p>
                            <p className="text-amber-700 text-xs mt-1">
                                Solo puedes ver las categorías para las que tienes permisos específicos.
                                Contacta al administrador si necesitas acceso a categorías adicionales.
                            </p>
                        </div>
                    )}
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