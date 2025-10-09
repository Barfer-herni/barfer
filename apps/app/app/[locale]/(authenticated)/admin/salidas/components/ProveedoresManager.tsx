'use client'

import { useState, useMemo, useEffect } from 'react';
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
import { Plus, Edit, Trash2, Search, X, ChevronUp, ChevronDown, ChevronsUpDown, Users } from 'lucide-react';
import { AddProveedorModal } from './AddProveedorModal';
import { EditProveedorModal } from './EditProveedorModal';
import { DeleteProveedorDialog } from './DeleteProveedorDialog';
import {
    getAllProveedoresAction,
    createProveedorAction,
    updateProveedorAction,
    deleteProveedorAction
} from '../actions';

// Tipo para los proveedores
export interface ProveedorData {
    id: string;
    nombre: string;
    detalle: string; // ej: "visceras vacunas", "alimentos balanceados", etc.
    telefono: string;
    personaContacto: string;
    registro: 'BLANCO' | 'NEGRO'; // Si le pagamos en blanco o negro
    categoriaId?: string; // ID de la categoría del proveedor
    metodoPagoId?: string; // ID del método de pago preferido
    // Datos relacionados (populados)
    categoria?: {
        _id: string;
        nombre: string;
    };
    metodoPago?: {
        _id: string;
        nombre: string;
    };
    activo: boolean;
    createdAt: string;
    updatedAt: string;
}

// Mock data para desarrollo - esto se reemplazará con datos reales de la base de datos
const mockProveedores: ProveedorData[] = [
    {
        id: '1',
        nombre: 'Distribuidora ABC',
        detalle: 'visceras vacunas',
        telefono: '221 123-4567',
        personaContacto: 'Juan Pérez',
        registro: 'BLANCO',
        categoriaId: '1',
        metodoPagoId: '1',
        categoria: {
            _id: '1',
            nombre: 'Alimentos'
        },
        metodoPago: {
            _id: '1',
            nombre: 'EFECTIVO'
        },
        activo: true,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z'
    },
    {
        id: '2',
        nombre: 'Insumos Veterinarios SA',
        detalle: 'alimentos balanceados',
        telefono: '221 987-6543',
        personaContacto: 'María García',
        registro: 'NEGRO',
        categoriaId: '2',
        metodoPagoId: '2',
        categoria: {
            _id: '2',
            nombre: 'Equipos'
        },
        metodoPago: {
            _id: '2',
            nombre: 'TRANSFERENCIA'
        },
        activo: true,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z'
    }
];

type SortField = 'nombre' | 'detalle' | 'telefono' | 'personaContacto' | 'registro' | 'categoria' | 'metodoPago';
type SortDirection = 'asc' | 'desc';

interface ProveedoresManagerProps {
    onProveedorChanged?: () => void;
}

export function ProveedoresManager({ onProveedorChanged }: ProveedoresManagerProps = {}) {
    const [proveedores, setProveedores] = useState<ProveedorData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedProveedor, setSelectedProveedor] = useState<ProveedorData | null>(null);

    // Estados para los filtros
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPagoTipo, setSelectedPagoTipo] = useState<string>('');

    // Estados para el ordenamiento
    const [sortField, setSortField] = useState<SortField>('nombre');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

    // Función para manejar el ordenamiento
    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    // Función para obtener el ícono de ordenamiento
    const getSortIcon = (field: SortField) => {
        if (sortField !== field) {
            return <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />;
        }
        return sortDirection === 'asc'
            ? <ChevronUp className="h-4 w-4 text-blue-600" />
            : <ChevronDown className="h-4 w-4 text-blue-600" />;
    };

    // Cargar proveedores desde MongoDB
    const loadProveedores = async () => {
        setIsLoading(true);
        try {
            const result = await getAllProveedoresAction();
            if (result.success && result.proveedores) {
                // Convertir datos de MongoDB al formato esperado por el componente
                const formattedProveedores = result.proveedores.map(proveedor => ({
                    id: proveedor._id,
                    nombre: proveedor.nombre,
                    detalle: proveedor.detalle,
                    telefono: proveedor.telefono,
                    personaContacto: proveedor.personaContacto,
                    registro: proveedor.registro,
                    categoriaId: proveedor.categoriaId || undefined,
                    metodoPagoId: proveedor.metodoPagoId || undefined,
                    categoria: proveedor.categoria,
                    metodoPago: proveedor.metodoPago,
                    activo: proveedor.isActive,
                    createdAt: proveedor.createdAt.toString(),
                    updatedAt: proveedor.updatedAt.toString()
                }));
                setProveedores(formattedProveedores);
            } else {
                console.error('Error loading proveedores:', result.error);
                setProveedores([]);
            }
        } catch (error) {
            console.error('Error loading proveedores:', error);
            setProveedores([]);
        } finally {
            setIsLoading(false);
        }
    };

    // Cargar datos al montar el componente
    useEffect(() => {
        loadProveedores();
    }, []);


    // Filtrar y ordenar los proveedores
    const filteredAndSortedProveedores = useMemo(() => {
        // Primero filtrar
        const filtered = proveedores.filter(proveedor => {
            // Filtro por texto de búsqueda
            if (searchTerm) {
                const searchLower = searchTerm.toLowerCase();
                const matchesNombre = proveedor.nombre.toLowerCase().includes(searchLower);
                const matchesDetalle = proveedor.detalle.toLowerCase().includes(searchLower);
                const matchesTelefono = proveedor.telefono.includes(searchTerm);
                const matchesPersona = proveedor.personaContacto.toLowerCase().includes(searchLower);

                if (!matchesNombre && !matchesDetalle && !matchesTelefono && !matchesPersona) {
                    return false;
                }
            }

            // Filtro por registro
            if (selectedPagoTipo && proveedor.registro !== selectedPagoTipo) {
                return false;
            }

            return true;
        });

        // Luego ordenar
        return filtered.sort((a, b) => {
            let aValue: any;
            let bValue: any;

            switch (sortField) {
                case 'nombre':
                    aValue = a.nombre.toLowerCase();
                    bValue = b.nombre.toLowerCase();
                    break;
                case 'detalle':
                    aValue = a.detalle.toLowerCase();
                    bValue = b.detalle.toLowerCase();
                    break;
                case 'telefono':
                    aValue = a.telefono;
                    bValue = b.telefono;
                    break;
                case 'personaContacto':
                    aValue = a.personaContacto.toLowerCase();
                    bValue = b.personaContacto.toLowerCase();
                    break;
                case 'registro':
                    aValue = a.registro;
                    bValue = b.registro;
                    break;
                case 'categoria':
                    aValue = (a.categoria?.nombre || '').toLowerCase();
                    bValue = (b.categoria?.nombre || '').toLowerCase();
                    break;
                case 'metodoPago':
                    aValue = (a.metodoPago?.nombre || '').toLowerCase();
                    bValue = (b.metodoPago?.nombre || '').toLowerCase();
                    break;
                default:
                    return 0;
            }

            if (aValue < bValue) {
                return sortDirection === 'asc' ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortDirection === 'asc' ? 1 : -1;
            }
            return 0;
        });
    }, [proveedores, searchTerm, selectedPagoTipo, sortField, sortDirection]);

    const clearFilters = () => {
        setSearchTerm('');
        setSelectedPagoTipo('');
    };

    const handleAddProveedor = () => {
        setIsAddModalOpen(true);
    };

    const handleProveedorCreated = async (proveedor: any) => {
        // Recargar la lista de proveedores
        await loadProveedores();
        // Notificar al componente padre para refrescar las salidas
        if (onProveedorChanged) {
            onProveedorChanged();
        }
    };

    const handleEditProveedor = (proveedor: ProveedorData) => {
        setSelectedProveedor(proveedor);
        setIsEditModalOpen(true);
    };

    const handleDeleteProveedor = (proveedor: ProveedorData) => {
        setSelectedProveedor(proveedor);
        setIsDeleteDialogOpen(true);
    };

    const handleProveedorUpdated = async (proveedorId: string, updatedData: any) => {
        try {
            const result = await updateProveedorAction(proveedorId, updatedData);
            if (result.success) {
                // Recargar la lista de proveedores
                await loadProveedores();
                setIsEditModalOpen(false);
                setSelectedProveedor(null);
                // Notificar al componente padre para refrescar las salidas
                if (onProveedorChanged) {
                    onProveedorChanged();
                }
            } else {
                console.error('Error updating proveedor:', result.error);
            }
        } catch (error) {
            console.error('Error updating proveedor:', error);
        }
    };

    const handleProveedorDeleted = async (proveedorId: string) => {
        try {
            const result = await deleteProveedorAction(proveedorId);
            if (result.success) {
                // Recargar la lista de proveedores
                await loadProveedores();
                setIsDeleteDialogOpen(false);
                setSelectedProveedor(null);
                // Notificar al componente padre para refrescar las salidas
                if (onProveedorChanged) {
                    onProveedorChanged();
                }
            } else {
                console.error('Error deleting proveedor:', result.error);
            }
        } catch (error) {
            console.error('Error deleting proveedor:', error);
        }
    };

    const handleModalClose = () => {
        setSelectedProveedor(null);
        setIsEditModalOpen(false);
        setIsDeleteDialogOpen(false);
    };

    const getPagoTipoColor = (pagoTipo: 'BLANCO' | 'NEGRO') => {
        return pagoTipo === 'BLANCO'
            ? 'bg-green-100 text-green-800 border-green-200'
            : 'bg-gray-100 text-gray-800 border-gray-200';
    };

    return (
        <div className="space-y-4">
            {/* Header con botón de agregar */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-1">
                <div className="space-y-1">
                    <h3 className="text-lg font-semibold text-gray-900">Gestión de Proveedores</h3>
                    <p className="text-sm text-muted-foreground">
                        {proveedores.length === 0
                            ? 'No hay proveedores registrados'
                            : `${filteredAndSortedProveedores.length} de ${proveedores.length} proveedor${proveedores.length !== 1 ? 'es' : ''} mostrado${proveedores.length !== 1 ? 's' : ''}${filteredAndSortedProveedores.length !== proveedores.length ? ' (filtrados)' : ''}`
                        }
                    </p>
                </div>
                <Button onClick={handleAddProveedor} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Agregar Proveedor</span>
                    <span className="sm:hidden">Agregar</span>
                </Button>
            </div>

            {/* Panel de filtros */}
            <Card>
                <CardHeader className="pb-4">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Search className="h-4 w-4" />
                        Filtros de Búsqueda
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Buscador de texto */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                            placeholder="Buscar por nombre, detalle, teléfono o persona de contacto..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    {/* Filtros */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {/* Registro */}
                        <Select value={selectedPagoTipo} onValueChange={setSelectedPagoTipo}>
                            <SelectTrigger>
                                <SelectValue placeholder="Registro" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="BLANCO">Blanco</SelectItem>
                                <SelectItem value="NEGRO">Negro</SelectItem>
                            </SelectContent>
                        </Select>

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
                </CardContent>
            </Card>

            {/* Tabla */}
            <div className="rounded-lg border overflow-hidden">
                <div className="overflow-x-auto">
                    <Table className="min-w-[1000px]">
                        <TableHeader>
                            <TableRow className="bg-muted/50">
                                <TableHead
                                    className="font-semibold w-[140px] cursor-pointer hover:bg-muted/70 select-none"
                                    onClick={() => handleSort('categoria')}
                                >
                                    <div className="flex items-center gap-1">
                                        Categoría
                                        {getSortIcon('categoria')}
                                    </div>
                                </TableHead>
                                <TableHead
                                    className="font-semibold w-[200px] cursor-pointer hover:bg-muted/70 select-none"
                                    onClick={() => handleSort('nombre')}
                                >
                                    <div className="flex items-center gap-1">
                                        Proveedor
                                        {getSortIcon('nombre')}
                                    </div>
                                </TableHead>
                                <TableHead
                                    className="font-semibold w-[150px] cursor-pointer hover:bg-muted/70 select-none"
                                    onClick={() => handleSort('detalle')}
                                >
                                    <div className="flex items-center gap-1">
                                        Detalle
                                        {getSortIcon('detalle')}
                                    </div>
                                </TableHead>
                                <TableHead
                                    className="font-semibold w-[140px] cursor-pointer hover:bg-muted/70 select-none"
                                    onClick={() => handleSort('telefono')}
                                >
                                    <div className="flex items-center gap-1">
                                        Teléfono
                                        {getSortIcon('telefono')}
                                    </div>
                                </TableHead>
                                <TableHead
                                    className="font-semibold w-[180px] cursor-pointer hover:bg-muted/70 select-none"
                                    onClick={() => handleSort('personaContacto')}
                                >
                                    <div className="flex items-center gap-1">
                                        Persona de Contacto
                                        {getSortIcon('personaContacto')}
                                    </div>
                                </TableHead>
                                <TableHead
                                    className="font-semibold w-[140px] cursor-pointer hover:bg-muted/70 select-none"
                                    onClick={() => handleSort('metodoPago')}
                                >
                                    <div className="flex items-center gap-1">
                                        Forma de Pago
                                        {getSortIcon('metodoPago')}
                                    </div>
                                </TableHead>
                                <TableHead
                                    className="font-semibold w-[120px] text-center cursor-pointer hover:bg-muted/70 select-none"
                                    onClick={() => handleSort('registro')}
                                >
                                    <div className="flex items-center justify-center gap-1">
                                        Registro
                                        {getSortIcon('registro')}
                                    </div>
                                </TableHead>
                                <TableHead className="font-semibold w-[100px] text-center">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="text-center py-12">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                            <div className="text-sm text-muted-foreground">Cargando proveedores...</div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredAndSortedProveedores.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                                        <div className="flex flex-col items-center gap-2">
                                            {proveedores.length === 0 ? (
                                                <>
                                                    <div className="text-base font-medium">No hay proveedores registrados aún</div>
                                                    <div className="text-sm">Haz clic en "Agregar Proveedor" para comenzar</div>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="text-base font-medium">No se encontraron proveedores</div>
                                                    <div className="text-sm">Intenta con diferentes filtros de búsqueda</div>
                                                </>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredAndSortedProveedores.map((proveedor) => (
                                    <TableRow key={proveedor.id} className="hover:bg-muted/30">
                                        <TableCell className="w-[140px]">
                                            <Badge variant="outline" className="text-xs">
                                                {proveedor.categoria?.nombre || 'Sin categoría'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-medium text-sm w-[200px]">
                                            {proveedor.nombre}
                                        </TableCell>
                                        <TableCell className="w-[150px]">
                                            <Badge variant="outline" className="text-xs">
                                                {proveedor.detalle}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="w-[140px] text-sm font-mono">
                                            {proveedor.telefono}
                                        </TableCell>
                                        <TableCell className="w-[180px] text-sm">
                                            {proveedor.personaContacto}
                                        </TableCell>
                                        <TableCell className="w-[140px]">
                                            <Badge variant="outline" className="text-xs">
                                                {proveedor.metodoPago?.nombre || 'Sin método'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="w-[120px] text-center">
                                            <Badge
                                                variant="outline"
                                                className={`${getPagoTipoColor(proveedor.registro)} text-xs`}
                                            >
                                                {proveedor.registro}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="w-[100px]">
                                            <div className="flex items-center justify-center gap-1">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleEditProveedor(proveedor)}
                                                    className="h-7 w-7 p-0 hover:bg-blue-50 text-blue-600"
                                                    title="Editar proveedor"
                                                >
                                                    <Edit className="h-3 w-3" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleDeleteProveedor(proveedor)}
                                                    className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    title="Eliminar proveedor"
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
                <p>• Haz clic en los títulos de las columnas para ordenar por ese criterio</p>
                <p>• Usa el buscador de texto para buscar en nombre, detalle, teléfono o persona de contacto</p>
                <p>• Los filtros desplegables permiten filtrar por criterios específicos</p>
                <p>• "BLANCO" significa que el pago se registra oficialmente, "NEGRO" que no se registra</p>
                <p>• Los proveedores se pueden usar al crear nuevas salidas para autocompletar datos</p>
            </div>

            {/* Modal para agregar proveedor */}
            <AddProveedorModal
                open={isAddModalOpen}
                onOpenChange={setIsAddModalOpen}
                onProveedorCreated={handleProveedorCreated}
            />

            {/* Modal para editar proveedor */}
            {selectedProveedor && (
                <EditProveedorModal
                    open={isEditModalOpen}
                    onOpenChange={(open) => {
                        setIsEditModalOpen(open);
                        if (!open) handleModalClose();
                    }}
                    proveedor={selectedProveedor}
                    onProveedorUpdated={handleProveedorUpdated}
                />
            )}

            {/* Diálogo para eliminar proveedor */}
            {selectedProveedor && (
                <DeleteProveedorDialog
                    open={isDeleteDialogOpen}
                    onOpenChange={(open) => {
                        setIsDeleteDialogOpen(open);
                        if (!open) handleModalClose();
                    }}
                    proveedor={selectedProveedor}
                    onProveedorDeleted={handleProveedorDeleted}
                />
            )}
        </div>
    );
}

