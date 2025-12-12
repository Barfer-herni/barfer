'use client'

import { useState, useMemo, useCallback, useTransition, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
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
import { Plus, Edit, Trash2, Filter, Search, X, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { AddSalidaModal } from './AddSalidaModal';
import { EditSalidaModal } from './EditSalidaModal';
import { DeleteSalidaDialog } from './DeleteSalidaDialog';
import { SalidaMongoData } from '@repo/data-services';
import type { PaginationState } from '@tanstack/react-table';
import { duplicateSalidaAction } from '../actions';
import { Copy } from 'lucide-react';

// Funciones de permisos del cliente (definidas localmente)
function hasAllCategoriesPermission(permissions: string[]): boolean {
    return permissions.includes('outputs:view_all_categories');
}

function getCategoryPermissions(permissions: string[]): string[] {
    return permissions.filter(p => p.startsWith('outputs:view_category:'));
}

interface SalidasTableProps {
    salidas?: SalidaMongoData[];
    onRefreshSalidas?: () => void;
    userPermissions?: string[];
    pagination: PaginationState;
    pageCount: number;
    total: number;
    initialFilters?: {
        searchTerm?: string;
        categoriaId?: string;
        metodoPagoId?: string;
        tipo?: 'ORDINARIO' | 'EXTRAORDINARIO';
        tipoRegistro?: 'BLANCO' | 'NEGRO';
    };
}

type SortField = 'fechaFactura' | 'categoria' | 'proveedor' | 'detalle' | 'tipo' | 'marca' | 'monto' | 'metodoPago' | 'tipoRegistro' | 'fechaPago' | 'comprobanteNumber';
type SortDirection = 'asc' | 'desc';

export function SalidasTable({ salidas = [], onRefreshSalidas, userPermissions = [], pagination, pageCount, total, initialFilters = {} }: SalidasTableProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [isPending, startTransition] = useTransition();
    const [isLoading, setIsLoading] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedSalida, setSelectedSalida] = useState<SalidaMongoData | null>(null);

    // Función para aplicar filtros y navegar
    const applyFilters = useCallback((newFilters: Record<string, string | undefined>) => {
        startTransition(() => {
            const params = new URLSearchParams();

            // Restablecer a página 1 cuando se cambian filtros
            params.set('page', '1');
            params.set('pageSize', pagination.pageSize.toString());

            // Agregar filtros no vacíos
            Object.entries(newFilters).forEach(([key, value]) => {
                if (value && value.trim() !== '') {
                    params.set(key, value);
                }
            });

            router.push(`${pathname}?${params.toString()}`);
        });
    }, [pathname, router, pagination.pageSize]);

    // Función para navegar entre páginas (mantiene los filtros actuales)
    const navigateToPagination = useCallback((pageIndex: number, pageSize: number) => {
        startTransition(() => {
            const params = new URLSearchParams(window.location.search);
            params.set('page', (pageIndex + 1).toString());
            params.set('pageSize', pageSize.toString());
            router.push(`${pathname}?${params.toString()}`);
        });
    }, [pathname, router]);

    // Estados para los filtros (inicializados desde el servidor)
    const [searchTerm, setSearchTerm] = useState(initialFilters.searchTerm || '');
    const [selectedCategoria, setSelectedCategoria] = useState(initialFilters.categoriaId || '');
    const [selectedMetodoPago, setSelectedMetodoPago] = useState(initialFilters.metodoPagoId || '');
    const [selectedTipo, setSelectedTipo] = useState(initialFilters.tipo || '');
    const [selectedTipoRegistro, setSelectedTipoRegistro] = useState(initialFilters.tipoRegistro || '');

    // Estados para el ordenamiento
    const [sortField, setSortField] = useState<SortField>('fechaFactura');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

    // Debounce para el searchTerm
    const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);
    const isInitialMount = useRef(true);

    // Aplicar filtros cuando cambien (con debounce para searchTerm)
    useEffect(() => {
        // Saltar el primer render para evitar aplicar filtros innecesariamente
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        if (searchDebounceRef.current) {
            clearTimeout(searchDebounceRef.current);
        }

        searchDebounceRef.current = setTimeout(() => {
            const params = new URLSearchParams();

            // Restablecer a página 1 cuando se cambian filtros
            params.set('page', '1');
            params.set('pageSize', pagination.pageSize.toString());

            // Agregar filtros no vacíos
            if (searchTerm && searchTerm.trim() !== '') params.set('searchTerm', searchTerm);
            if (selectedCategoria) params.set('categoriaId', selectedCategoria);
            if (selectedMetodoPago) params.set('metodoPagoId', selectedMetodoPago);
            if (selectedTipo) params.set('tipo', selectedTipo);
            if (selectedTipoRegistro) params.set('tipoRegistro', selectedTipoRegistro);
            
            // Mantener los parámetros de fecha (from/to) que vienen del AnalyticsDateFilter
            const currentParams = new URLSearchParams(window.location.search);
            if (currentParams.get('from')) params.set('from', currentParams.get('from')!);
            if (currentParams.get('to')) params.set('to', currentParams.get('to')!);
            if (currentParams.get('preset')) params.set('preset', currentParams.get('preset')!);

            router.push(`${pathname}?${params.toString()}`);
        }, 500); // 500ms de debounce

        return () => {
            if (searchDebounceRef.current) {
                clearTimeout(searchDebounceRef.current);
            }
        };
    }, [searchTerm, selectedCategoria, selectedMetodoPago, selectedTipo, selectedTipoRegistro, router, pathname, pagination.pageSize]);

    const formatDate = (date: Date | string) => {
        // Asegurar que tenemos un objeto Date válido
        let dateObj: Date;

        if (date instanceof Date) {
            dateObj = date;
        } else if (typeof date === 'string') {
            // Si es un string, parsear la fecha considerando que está en zona horaria local
            // Extraer solo la parte de la fecha (YYYY-MM-DD) para evitar problemas de zona horaria
            const dateOnly = date.split(' ')[0]; // Tomar solo "2025-07-27"
            const [year, month, day] = dateOnly.split('-').map(Number);

            // Crear la fecha usando UTC para evitar problemas de zona horaria
            dateObj = new Date(Date.UTC(year, month - 1, day));

            // Convertir a zona horaria local
            const localYear = dateObj.getFullYear();
            const localMonth = dateObj.getMonth();
            const localDay = dateObj.getDate();
            dateObj = new Date(localYear, localMonth, localDay);
        } else {
            dateObj = new Date(date);
        }

        // Verificar si la fecha es válida
        if (isNaN(dateObj.getTime())) {
            return 'Fecha inválida';
        }

        return new Intl.DateTimeFormat('es-AR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).format(dateObj);
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

    // Obtener opciones únicas para los filtros (desde todas las salidas, no solo la página actual)
    // NOTA: Idealmente estos deberían venir del servidor como opciones disponibles
    const uniqueCategorias = useMemo(() => {
        const categorias = salidas
            .map(s => s.categoria)
            .filter((cat): cat is NonNullable<typeof cat> => cat !== undefined && cat !== null)
            .filter((cat, index, array) => array.findIndex(c => c._id === cat._id) === index)
            .sort((a, b) => a.nombre.localeCompare(b.nombre));
        return categorias;
    }, [salidas]);

    const uniqueMetodosPago = useMemo(() => {
        const metodos = salidas
            .map(s => s.metodoPago)
            .filter((mp): mp is NonNullable<typeof mp> => mp !== undefined && mp !== null)
            .filter((mp, index, array) => array.findIndex(m => m._id === mp._id) === index)
            .sort((a, b) => a.nombre.localeCompare(b.nombre));
        return metodos;
    }, [salidas]);

    // Función para manejar el ordenamiento
    const handleSort = (field: SortField) => {
        if (sortField === field) {
            // Si es el mismo campo, alternar dirección
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            // Si es un campo diferente, establecer como ascendente por defecto
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

    // Ordenar las salidas localmente (el filtrado se hace en el servidor)
    const sortedSalidas = useMemo(() => {
        return [...salidas].sort((a, b) => {
            let aValue: any;
            let bValue: any;

            switch (sortField) {
                case 'fechaFactura':
                    aValue = new Date(a.fechaFactura);
                    bValue = new Date(b.fechaFactura);
                    break;
                case 'categoria':
                    aValue = (a.categoria?.nombre || '').toLowerCase();
                    bValue = (b.categoria?.nombre || '').toLowerCase();
                    break;
                case 'proveedor':
                    aValue = (a.proveedor?.nombre || '').toLowerCase();
                    bValue = (b.proveedor?.nombre || '').toLowerCase();
                    break;
                case 'detalle':
                    aValue = a.detalle.toLowerCase();
                    bValue = b.detalle.toLowerCase();
                    break;
                case 'tipo':
                    aValue = a.tipo;
                    bValue = b.tipo;
                    break;
                case 'marca':
                    aValue = (a.marca || '').toLowerCase();
                    bValue = (b.marca || '').toLowerCase();
                    break;
                case 'monto':
                    aValue = a.monto;
                    bValue = b.monto;
                    break;
                case 'metodoPago':
                    aValue = (a.metodoPago?.nombre || '').toLowerCase();
                    bValue = (b.metodoPago?.nombre || '').toLowerCase();
                    break;
                case 'tipoRegistro':
                    aValue = a.tipoRegistro;
                    bValue = b.tipoRegistro;
                    break;
                case 'fechaPago':
                    aValue = a.fechaPago ? new Date(a.fechaPago) : new Date(0);
                    bValue = b.fechaPago ? new Date(b.fechaPago) : new Date(0);
                    break;
                case 'comprobanteNumber':
                    aValue = (a as any).comprobanteNumber ? String((a as any).comprobanteNumber).toLowerCase() : '';
                    bValue = (b as any).comprobanteNumber ? String((b as any).comprobanteNumber).toLowerCase() : '';
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
    }, [salidas, sortField, sortDirection]);

    const clearFilters = () => {
        setSearchTerm('');
        setSelectedCategoria('');
        setSelectedMetodoPago('');
        setSelectedTipo('');
        setSelectedTipoRegistro('');

        // Aplicar filtros vacíos (resetear, pero mantener from/to del AnalyticsDateFilter)
        applyFilters({
            searchTerm: undefined,
            categoriaId: undefined,
            metodoPagoId: undefined,
            tipo: undefined,
            tipoRegistro: undefined,
        });
    };

    const handleAddSalida = () => {
        setIsAddModalOpen(true);
    };

    const handleSalidaCreated = () => {
        if (onRefreshSalidas) {
            onRefreshSalidas();
        }
    };

    const handleEditSalida = (salida: SalidaMongoData) => {
        setSelectedSalida(salida);
        setIsEditModalOpen(true);
    };

    const handleDeleteSalida = (salida: SalidaMongoData) => {
        setSelectedSalida(salida);
        setIsDeleteDialogOpen(true);
    };

    const handleDuplicateSalida = async (salida: SalidaMongoData) => {
        if (!confirm('¿Estás seguro de que quieres duplicar este gasto? Se creará una nueva salida con los mismos datos marcada como "DUPLICADO".')) {
            return;
        }

        setIsLoading(true);
        try {
            const result = await duplicateSalidaAction(salida._id);
            if (!result.success) throw new Error(result.error || 'Error al duplicar');
            if (onRefreshSalidas) {
                onRefreshSalidas();
            }
            toast({
                title: '¡Éxito!',
                description: result.message || 'Gasto duplicado correctamente',
            });
        } catch (e) {
            toast({
                title: 'Error',
                description: e instanceof Error ? e.message : 'Error al duplicar el gasto',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
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
                        {total === 0
                            ? 'No hay salidas registradas'
                            : `Mostrando ${salidas.length} de ${total} salida${total !== 1 ? 's' : ''} totales`
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
                            placeholder="Buscar por detalle, categoría, proveedor, método de pago o monto..."
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
                                        <SelectItem key={categoria._id} value={categoria._id}>
                                            {categoria.nombre}
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
                                        <SelectItem key={metodo._id} value={metodo._id}>
                                            {getFormaPagoLabel(metodo.nombre)}
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
                        </div>

                        {/* Segunda fila: Botón de limpiar filtros */}
                        <div className="flex justify-end">
                            <Button
                                variant="outline"
                                onClick={clearFilters}
                                className="flex items-center gap-2"
                            >
                                <X className="h-4 w-4" />
                                Limpiar Filtros
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Tabla */}
            <div className="rounded-lg border overflow-hidden">
                <div className="overflow-x-auto">
                    <Table className="min-w-[1200px]">
                        <TableHeader>
                            <TableRow className="bg-muted/50">
                                <TableHead
                                    className="font-semibold w-[100px] cursor-pointer hover:bg-muted/70 select-none"
                                    onClick={() => handleSort('fechaFactura')}
                                >
                                    <div className="flex items-center gap-1">
                                        Fecha Factura
                                        {getSortIcon('fechaFactura')}
                                    </div>
                                </TableHead>
                                <TableHead
                                    className="font-semibold w-[120px] cursor-pointer hover:bg-muted/70 select-none"
                                    onClick={() => handleSort('fechaPago')}
                                >
                                    <div className="flex items-center gap-1">
                                        Fecha Pago
                                        {getSortIcon('fechaPago')}
                                    </div>
                                </TableHead>
                                <TableHead
                                    className="font-semibold w-[120px] cursor-pointer hover:bg-muted/70 select-none"
                                    onClick={() => handleSort('categoria')}
                                >
                                    <div className="flex items-center gap-1">
                                        Categoría
                                        {getSortIcon('categoria')}
                                    </div>
                                </TableHead>
                                <TableHead
                                    className="font-semibold w-[150px] cursor-pointer hover:bg-muted/70 select-none"
                                    onClick={() => handleSort('proveedor')}
                                >
                                    <div className="flex items-center gap-1">
                                        Proveedor
                                        {getSortIcon('proveedor')}
                                    </div>
                                </TableHead>
                                <TableHead
                                    className="font-semibold min-w-[200px] cursor-pointer hover:bg-muted/70 select-none"
                                    onClick={() => handleSort('detalle')}
                                >
                                    <div className="flex items-center gap-1">
                                        Detalle
                                        {getSortIcon('detalle')}
                                    </div>
                                </TableHead>
                                <TableHead
                                    className="font-semibold w-[110px] text-center cursor-pointer hover:bg-muted/70 select-none"
                                    onClick={() => handleSort('tipo')}
                                >
                                    <div className="flex items-center justify-center gap-1">
                                        Tipo
                                        {getSortIcon('tipo')}
                                    </div>
                                </TableHead>
                                <TableHead
                                    className="font-semibold w-[100px] cursor-pointer hover:bg-muted/70 select-none"
                                    onClick={() => handleSort('marca')}
                                >
                                    <div className="flex items-center gap-1">
                                        Marca
                                        {getSortIcon('marca')}
                                    </div>
                                </TableHead>
                                <TableHead
                                    className="font-semibold w-[120px] text-right cursor-pointer hover:bg-muted/70 select-none"
                                    onClick={() => handleSort('monto')}
                                >
                                    <div className="flex items-center justify-end gap-1">
                                        Monto
                                        {getSortIcon('monto')}
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
                                    className="font-semibold w-[100px] text-center cursor-pointer hover:bg-muted/70 select-none"
                                    onClick={() => handleSort('tipoRegistro')}
                                >
                                    <div className="flex items-center justify-center gap-1">
                                        Registro
                                        {getSortIcon('tipoRegistro')}
                                    </div>
                                </TableHead>
                                <TableHead
                                    className="font-semibold w-[120px] cursor-pointer hover:bg-muted/70 select-none"
                                    onClick={() => handleSort('comprobanteNumber')}
                                >
                                    <div className="flex items-center gap-1">
                                        Comprobante
                                        {getSortIcon('comprobanteNumber')}
                                    </div>
                                </TableHead>
                                <TableHead className="font-semibold w-[100px] text-center">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedSalidas.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={13} className="text-center py-12 text-muted-foreground">
                                        <div className="flex flex-col items-center gap-2">
                                            {total === 0 ? (
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
                                sortedSalidas.map((salida) => (
                                    <TableRow key={salida._id} className="hover:bg-muted/30">
                                        <TableCell className="font-medium text-sm w-[100px]">
                                            {formatDate(salida.fechaFactura)}
                                        </TableCell>
                                        <TableCell className="w-[120px] text-sm">
                                            {salida.fechaPago ? formatDate(salida.fechaPago) : '-'}
                                        </TableCell>
                                        <TableCell className="w-[120px]">
                                            <Badge variant="secondary" className="text-xs">
                                                {salida.categoria?.nombre || 'Sin categoría'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="w-[150px]">
                                            <Badge variant="outline" className="text-xs">
                                                {salida.proveedor?.nombre || 'Sin proveedor'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="min-w-[200px] max-w-[300px]" title={salida.detalle}>
                                            <div className="truncate">
                                                {salida.detalle}
                                            </div>
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
                                            <div className="truncate" title="BARFER">
                                                BARFER
                                            </div>
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
                                        <TableCell className="w-[120px] text-sm font-mono">
                                            <div className="truncate" title={salida.comprobanteNumber || ''}>
                                                {(salida.comprobanteNumber || '').toString().slice(0, 8) || '-'}
                                            </div>
                                        </TableCell>
                                        <TableCell className="w-[100px]">
                                            <div className="flex items-center justify-center gap-1">
                                                {userPermissions.includes('outputs:create') && (
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleDuplicateSalida(salida)}
                                                        className="h-7 w-7 p-0 hover:bg-green-50 text-green-600"
                                                        title="Duplicar salida"
                                                    >
                                                        <Copy className="h-3 w-3" />
                                                    </Button>
                                                )}
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
                                                {!userPermissions.includes('outputs:create') && !userPermissions.includes('outputs:edit') && !userPermissions.includes('outputs:delete') && (
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

            {/* Paginación */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t pt-4">
                <div className="text-xs sm:text-sm text-muted-foreground">
                    Mostrando {salidas.length} de {total} salidas totales.
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigateToPagination(pagination.pageIndex - 1, pagination.pageSize)}
                        disabled={pagination.pageIndex === 0 || isPending}
                        className="shrink-0"
                    >
                        Anterior
                    </Button>
                    <div className="text-xs sm:text-sm whitespace-nowrap px-2">
                        Página {pagination.pageIndex + 1} de {pageCount || 1}
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigateToPagination(pagination.pageIndex + 1, pagination.pageSize)}
                        disabled={pagination.pageIndex >= pageCount - 1 || isPending}
                        className="shrink-0"
                    >
                        Siguiente
                    </Button>
                </div>
            </div>
        </div>
    );
} 