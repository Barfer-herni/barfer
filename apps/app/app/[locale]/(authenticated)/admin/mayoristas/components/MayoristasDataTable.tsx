'use client';

import { useState, useCallback, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
    flexRender,
    getCoreRowModel,
    useReactTable,
    type ColumnDef,
    type PaginationState,
} from '@tanstack/react-table';

import { Input } from '@repo/design-system/components/ui/input';
import { Button } from '@repo/design-system/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@repo/design-system/components/ui/dialog';
import { Label } from '@repo/design-system/components/ui/label';
import { Textarea } from '@repo/design-system/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/design-system/components/ui/table';
import { Pencil, Trash2, Search, BarChart3, Table2 } from 'lucide-react';
import Link from 'next/link';

import { createMayoristaAction, updateMayoristaAction, deleteMayoristaAction } from '../actions';
import { ZONA_OPTIONS, FRECUENCIA_OPTIONS, TIPO_NEGOCIO_OPTIONS } from '../constants';
import type { Mayorista } from '@repo/data-services';

interface MayoristasDataTableProps {
    columns: ColumnDef<Mayorista>[];
    data: Mayorista[];
    pageCount: number;
    total: number;
    pagination: PaginationState;
}

export function MayoristasDataTable({
    columns,
    data,
    pageCount,
    total,
    pagination,
}: MayoristasDataTableProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [editingMayorista, setEditingMayorista] = useState<Mayorista | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [searchInput, setSearchInput] = useState(searchParams.get('search') ?? '');
    const [isPending, startTransition] = useTransition();

    const [formData, setFormData] = useState<any>({
        nombre: '',
        zona: 'CABA',
        frecuencia: 'MENSUAL',
        fechaInicioVentas: new Date().toISOString().split('T')[0],
        fechaPrimerPedido: '',
        fechaUltimoPedido: '',
        tieneFreezer: false,
        cantidadFreezers: 0,
        capacidadFreezer: 0,
        tiposNegocio: [],
        contacto: {
            telefono: '',
            email: '',
            direccion: '',
        },
        notas: '',
    });

    const table = useReactTable({
        data,
        columns,
        pageCount,
        state: {
            pagination,
        },
        manualPagination: true,
        getCoreRowModel: getCoreRowModel(),
    });

    const navigateToSearch = useCallback((value: string) => {
        startTransition(() => {
            const params = new URLSearchParams(searchParams);
            params.set('page', '1');
            params.set('search', value);
            router.push(`${pathname}?${params.toString()}`);
        });
    }, [pathname, router, searchParams]);

    const navigateToPagination = useCallback((pageIndex: number, pageSize: number) => {
        startTransition(() => {
            const params = new URLSearchParams(searchParams);
            params.set('page', (pageIndex + 1).toString());
            params.set('pageSize', pageSize.toString());
            router.push(`${pathname}?${params.toString()}`);
        });
    }, [pathname, router, searchParams]);

    const handleSearchChange = useCallback((value: string) => {
        setSearchInput(value);
        if (value.trim() === '') {
            navigateToSearch('');
        }
    }, [navigateToSearch]);

    const handleSearchSubmit = useCallback((value: string) => {
        navigateToSearch(value);
    }, [navigateToSearch]);

    const handleSearchKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            handleSearchSubmit(searchInput);
        }
    }, [searchInput, handleSearchSubmit]);

    const resetForm = () => {
        setFormData({
            nombre: '',
            zona: 'CABA',
            frecuencia: 'MENSUAL',
            fechaInicioVentas: new Date().toISOString().split('T')[0],
            fechaPrimerPedido: '',
            fechaUltimoPedido: '',
            tieneFreezer: false,
            cantidadFreezers: 0,
            capacidadFreezer: 0,
            tiposNegocio: [],
            contacto: {
                telefono: '',
                email: '',
                direccion: '',
            },
            notas: '',
        });
    };

    const handleCreate = async () => {
        setLoading(true);
        try {
            const result = await createMayoristaAction(formData);
            if (!result.success) throw new Error(result.error || 'Error al crear');
            setShowCreateModal(false);
            resetForm();
            router.refresh();
        } catch (e) {
            alert(e instanceof Error ? e.message : 'Error al crear el mayorista');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = async () => {
        if (!editingMayorista) return;

        setLoading(true);
        try {
            const result = await updateMayoristaAction(editingMayorista._id!, formData);
            if (!result.success) throw new Error(result.error || 'Error al actualizar');
            setEditingMayorista(null);
            resetForm();
            router.refresh();
        } catch (e) {
            alert(e instanceof Error ? e.message : 'Error al actualizar el mayorista');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de que quieres eliminar este mayorista?')) {
            return;
        }

        setLoading(true);
        try {
            const result = await deleteMayoristaAction(id);
            if (!result.success) throw new Error(result.error || 'Error al eliminar');
            router.refresh();
        } catch (e) {
            alert(e instanceof Error ? e.message : 'Error al eliminar el mayorista');
        } finally {
            setLoading(false);
        }
    };

    const openEditModal = (mayorista: Mayorista) => {
        setEditingMayorista(mayorista);
        setFormData({
            nombre: mayorista.nombre,
            zona: mayorista.zona,
            frecuencia: mayorista.frecuencia,
            fechaInicioVentas: typeof mayorista.fechaInicioVentas === 'string'
                ? mayorista.fechaInicioVentas.split('T')[0]
                : new Date(mayorista.fechaInicioVentas).toISOString().split('T')[0],
            fechaPrimerPedido: mayorista.fechaPrimerPedido
                ? (typeof mayorista.fechaPrimerPedido === 'string'
                    ? mayorista.fechaPrimerPedido.split('T')[0]
                    : new Date(mayorista.fechaPrimerPedido).toISOString().split('T')[0])
                : '',
            fechaUltimoPedido: mayorista.fechaUltimoPedido
                ? (typeof mayorista.fechaUltimoPedido === 'string'
                    ? mayorista.fechaUltimoPedido.split('T')[0]
                    : new Date(mayorista.fechaUltimoPedido).toISOString().split('T')[0])
                : '',
            tieneFreezer: mayorista.tieneFreezer,
            cantidadFreezers: mayorista.cantidadFreezers || 0,
            capacidadFreezer: mayorista.capacidadFreezer || 0,
            tiposNegocio: mayorista.tiposNegocio || [],
            contacto: mayorista.contacto || {
                telefono: '',
                email: '',
                direccion: '',
            },
            notas: mayorista.notas || '',
        });
    };

    return (
        <div className="space-y-4">
            {/* Barra de búsqueda y acciones */}
            <div className="flex items-center gap-4">
                <div className="relative flex-1">
                    <Input
                        placeholder="Buscar por nombre, teléfono o email..."
                        value={searchInput}
                        onChange={(event) => handleSearchChange(event.target.value)}
                        onKeyDown={handleSearchKeyDown}
                        className="pr-10"
                        disabled={isPending}
                    />
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSearchSubmit(searchInput)}
                        disabled={isPending}
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    >
                        <Search className="h-4 w-4" />
                    </Button>
                </div>

                <Link href="/admin/mayoristas/estadisticas">
                    <Button
                        variant="outline"
                        className="border-purple-500 text-purple-600 hover:bg-purple-50"
                    >
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Ver Estadísticas
                    </Button>
                </Link>

                <Link href="/admin/mayoristas/matriz">
                    <Button
                        variant="outline"
                        className="border-blue-500 text-blue-600 hover:bg-blue-50"
                    >
                        <Table2 className="w-4 h-4 mr-2" />
                        Matriz de Productos
                    </Button>
                </Link>

                <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
                    <DialogTrigger asChild>
                        <Button onClick={() => { resetForm(); setShowCreateModal(true); }}>
                            + Crear Mayorista
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Crear Nuevo Punto de Venta Mayorista</DialogTitle>
                        </DialogHeader>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Nombre del Punto de Venta *</Label>
                                <Input
                                    value={formData.nombre}
                                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                    placeholder="Ej: LA PLATA M2"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Zona *</Label>
                                <select
                                    value={formData.zona}
                                    onChange={(e) => setFormData({ ...formData, zona: e.target.value })}
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                >
                                    {ZONA_OPTIONS.map(option => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2 col-span-2">
                                <Label>Dirección</Label>
                                <Input
                                    value={formData.contacto.direccion}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        contacto: { ...formData.contacto, direccion: e.target.value }
                                    })}
                                    placeholder="Dirección completa"
                                />
                            </div>

                            <div className="space-y-2 col-span-2">
                                <Label>Teléfono</Label>
                                <Input
                                    value={formData.contacto.telefono}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        contacto: { ...formData.contacto, telefono: e.target.value }
                                    })}
                                    placeholder="Teléfono de contacto"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Primer Pedido</Label>
                                <Input
                                    type="date"
                                    value={formData.fechaPrimerPedido}
                                    onChange={(e) => setFormData({ ...formData, fechaPrimerPedido: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Último Pedido</Label>
                                <Input
                                    type="date"
                                    value={formData.fechaUltimoPedido}
                                    onChange={(e) => setFormData({ ...formData, fechaUltimoPedido: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>¿Tiene Freezer Nuestro?</Label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={formData.tieneFreezer}
                                        onChange={(e) => setFormData({ ...formData, tieneFreezer: e.target.checked })}
                                        className="w-4 h-4"
                                    />
                                    <span className="text-sm">Sí</span>
                                </div>
                            </div>

                            {formData.tieneFreezer && (
                                <>
                                    <div className="space-y-2">
                                        <Label>Cantidad de Freezers</Label>
                                        <Input
                                            type="number"
                                            value={formData.cantidadFreezers}
                                            onChange={(e) => setFormData({ ...formData, cantidadFreezers: Number(e.target.value) })}
                                            placeholder="Ej: 2"
                                            min="0"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Capacidad del Freezer (Litros)</Label>
                                        <Input
                                            type="number"
                                            value={formData.capacidadFreezer}
                                            onChange={(e) => setFormData({ ...formData, capacidadFreezer: Number(e.target.value) })}
                                            placeholder="Ej: 300"
                                        />
                                    </div>
                                </>
                            )}

                            <div className="space-y-2 col-span-2">
                                <Label>Tipo de Negocio * (Selecciona todas las que apliquen)</Label>
                                <div className="flex flex-wrap gap-4 border border-gray-300 rounded-md p-3">
                                    {TIPO_NEGOCIO_OPTIONS.map(option => (
                                        <div key={option.value} className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id={`tipo-${option.value}`}
                                                checked={formData.tiposNegocio.includes(option.value)}
                                                onChange={(e) => {
                                                    const newTipos = e.target.checked
                                                        ? [...formData.tiposNegocio, option.value]
                                                        : formData.tiposNegocio.filter((t: string) => t !== option.value);
                                                    setFormData({ ...formData, tiposNegocio: newTipos });
                                                }}
                                                className="w-4 h-4"
                                            />
                                            <label htmlFor={`tipo-${option.value}`} className="text-sm cursor-pointer">
                                                {option.label}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2 col-span-2">
                                <Label>Notas</Label>
                                <Textarea
                                    value={formData.notas}
                                    onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                                    placeholder="Notas adicionales"
                                    rows={3}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 mt-4">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowCreateModal(false);
                                    resetForm();
                                }}
                            >
                                Cancelar
                            </Button>
                            <Button onClick={handleCreate} disabled={loading}>
                                {loading ? 'Creando...' : 'Crear Mayorista'}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Tabla */}
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id} className="px-4 py-3">
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                    </TableHead>
                                ))}
                                <TableHead className="px-4 py-3 text-center">Acciones</TableHead>
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow key={row.id}>
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id} className="px-4 py-3">
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </TableCell>
                                    ))}
                                    <TableCell className="px-4 py-3">
                                        <div className="flex gap-2 justify-center">
                                            <Dialog open={editingMayorista?._id === row.original._id} onOpenChange={(open) => {
                                                if (!open) {
                                                    setEditingMayorista(null);
                                                    resetForm();
                                                }
                                            }}>
                                                <DialogTrigger asChild>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => openEditModal(row.original)}
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                                    <DialogHeader>
                                                        <DialogTitle>Editar Mayorista</DialogTitle>
                                                    </DialogHeader>

                                                    {/* Mismo formulario que crear */}
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <Label>Nombre del Punto de Venta *</Label>
                                                            <Input
                                                                value={formData.nombre}
                                                                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                                            />
                                                        </div>

                                                        <div className="space-y-2">
                                                            <Label>Zona *</Label>
                                                            <select
                                                                value={formData.zona}
                                                                onChange={(e) => setFormData({ ...formData, zona: e.target.value })}
                                                                className="w-full p-2 border border-gray-300 rounded-md"
                                                            >
                                                                {ZONA_OPTIONS.map(option => (
                                                                    <option key={option.value} value={option.value}>
                                                                        {option.label}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>

                                                        <div className="space-y-2 col-span-2">
                                                            <Label>Dirección</Label>
                                                            <Input
                                                                value={formData.contacto.direccion}
                                                                onChange={(e) => setFormData({
                                                                    ...formData,
                                                                    contacto: { ...formData.contacto, direccion: e.target.value }
                                                                })}
                                                            />
                                                        </div>

                                                        <div className="space-y-2 col-span-2">
                                                            <Label>Teléfono</Label>
                                                            <Input
                                                                value={formData.contacto.telefono}
                                                                onChange={(e) => setFormData({
                                                                    ...formData,
                                                                    contacto: { ...formData.contacto, telefono: e.target.value }
                                                                })}
                                                            />
                                                        </div>

                                                        <div className="space-y-2">
                                                            <Label>Primer Pedido</Label>
                                                            <Input
                                                                type="date"
                                                                value={formData.fechaPrimerPedido}
                                                                onChange={(e) => setFormData({ ...formData, fechaPrimerPedido: e.target.value })}
                                                            />
                                                        </div>

                                                        <div className="space-y-2">
                                                            <Label>Último Pedido</Label>
                                                            <Input
                                                                type="date"
                                                                value={formData.fechaUltimoPedido}
                                                                onChange={(e) => setFormData({ ...formData, fechaUltimoPedido: e.target.value })}
                                                            />
                                                        </div>

                                                        <div className="space-y-2">
                                                            <Label>¿Tiene Freezer Nuestro?</Label>
                                                            <div className="flex items-center gap-2">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={formData.tieneFreezer}
                                                                    onChange={(e) => setFormData({ ...formData, tieneFreezer: e.target.checked })}
                                                                    className="w-4 h-4"
                                                                />
                                                                <span className="text-sm">Sí</span>
                                                            </div>
                                                        </div>

                                                        {formData.tieneFreezer && (
                                                            <>
                                                                <div className="space-y-2">
                                                                    <Label>Cantidad de Freezers</Label>
                                                                    <Input
                                                                        type="number"
                                                                        value={formData.cantidadFreezers}
                                                                        onChange={(e) => setFormData({ ...formData, cantidadFreezers: Number(e.target.value) })}
                                                                        min="0"
                                                                    />
                                                                </div>

                                                                <div className="space-y-2">
                                                                    <Label>Capacidad del Freezer (Litros)</Label>
                                                                    <Input
                                                                        type="number"
                                                                        value={formData.capacidadFreezer}
                                                                        onChange={(e) => setFormData({ ...formData, capacidadFreezer: Number(e.target.value) })}
                                                                    />
                                                                </div>
                                                            </>
                                                        )}

                                                        <div className="space-y-2 col-span-2">
                                                            <Label>Tipo de Negocio * (Selecciona todas las que apliquen)</Label>
                                                            <div className="flex flex-wrap gap-4 border border-gray-300 rounded-md p-3">
                                                                {TIPO_NEGOCIO_OPTIONS.map(option => (
                                                                    <div key={option.value} className="flex items-center gap-2">
                                                                        <input
                                                                            type="checkbox"
                                                                            id={`edit-tipo-${option.value}`}
                                                                            checked={formData.tiposNegocio.includes(option.value)}
                                                                            onChange={(e) => {
                                                                                const newTipos = e.target.checked
                                                                                    ? [...formData.tiposNegocio, option.value]
                                                                                    : formData.tiposNegocio.filter((t: string) => t !== option.value);
                                                                                setFormData({ ...formData, tiposNegocio: newTipos });
                                                                            }}
                                                                            className="w-4 h-4"
                                                                        />
                                                                        <label htmlFor={`edit-tipo-${option.value}`} className="text-sm cursor-pointer">
                                                                            {option.label}
                                                                        </label>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        <div className="space-y-2 col-span-2">
                                                            <Label>Notas</Label>
                                                            <Textarea
                                                                value={formData.notas}
                                                                onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                                                                rows={3}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="flex justify-end gap-2 mt-4">
                                                        <Button
                                                            variant="outline"
                                                            onClick={() => {
                                                                setEditingMayorista(null);
                                                                resetForm();
                                                            }}
                                                        >
                                                            Cancelar
                                                        </Button>
                                                        <Button onClick={handleEdit} disabled={loading}>
                                                            {loading ? 'Guardando...' : 'Guardar Cambios'}
                                                        </Button>
                                                    </div>
                                                </DialogContent>
                                            </Dialog>

                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => handleDelete(row.original._id!)}
                                                disabled={loading}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length + 1} className="h-24 text-center">
                                    No se encontraron resultados.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Paginación */}
            <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                    Mostrando {table.getRowModel().rows.length} de {total} mayoristas.
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigateToPagination(pagination.pageIndex - 1, pagination.pageSize)}
                        disabled={pagination.pageIndex === 0}
                    >
                        Anterior
                    </Button>
                    <div className="text-sm">
                        Página {pagination.pageIndex + 1} de {pageCount || 1}
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigateToPagination(pagination.pageIndex + 1, pagination.pageSize)}
                        disabled={pagination.pageIndex >= pageCount - 1}
                    >
                        Siguiente
                    </Button>
                </div>
            </div>
        </div>
    );
}

