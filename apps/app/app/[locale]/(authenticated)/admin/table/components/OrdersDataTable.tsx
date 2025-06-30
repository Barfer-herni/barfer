'use client';

import * as React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
    flexRender,
    getCoreRowModel,
    getSortedRowModel,
    useReactTable,
    type ColumnDef,
    type SortingState,
    type PaginationState,
} from '@tanstack/react-table';
import { ArrowUpDown, Pencil, Save, Trash2, X } from 'lucide-react';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@repo/design-system/components/ui/table';
import { Input } from '@repo/design-system/components/ui/input';
import { Button } from '@repo/design-system/components/ui/button';
import { Badge } from '@repo/design-system/components/ui/badge';
import { updateOrderAction, deleteOrderAction, createOrderAction, migrateClientTypeAction } from '../actions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@repo/design-system/components/ui/dialog';
import { Label } from '@repo/design-system/components/ui/label';
import { Textarea } from '@repo/design-system/components/ui/textarea';
import { DateRangeFilter } from './DateRangeFilter';
import { ClientTypeFilter } from './ClientTypeFilter';
import { exportOrdersAction } from '../exportOrdersAction';

interface DataTableProps<TData extends { _id: string }, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    pageCount: number;
    total: number;
    pagination: PaginationState;
    sorting: SortingState;
}

export function OrdersDataTable<TData extends { _id: string }, TValue>({
    columns,
    data,
    pageCount,
    total,
    pagination,
    sorting,
}: DataTableProps<TData, TValue>) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Estado local para el valor del input de búsqueda
    const [globalFilter, setGlobalFilter] = React.useState(searchParams.get('search') ?? '');
    const [editingRowId, setEditingRowId] = React.useState<string | null>(null);
    const [editValues, setEditValues] = React.useState<any>({});
    const [loading, setLoading] = React.useState(false);
    const [showCreateModal, setShowCreateModal] = React.useState(false);
    const [createFormData, setCreateFormData] = React.useState({
        status: 'pending',
        total: 0,
        subTotal: 0,
        shippingPrice: 0,
        notes: '',
        notesOwn: '',
        paymentMethod: '',
        clientType: 'minorista' as 'minorista' | 'mayorista',
        address: {
            address: '',
            city: '',
            phone: '',
            betweenStreets: '',
            floorNumber: '',
            departmentNumber: '',
        },
        user: {
            name: '',
            lastName: '',
            email: '',
        },
        items: [{
            id: '',
            name: '',
            description: '',
            images: [],
            options: [{
                name: 'Default',
                price: 0,
                quantity: 1,
            }],
            price: 0,
            salesCount: 0,
            discountApllied: 0,
        }],
        deliveryArea: {
            _id: '',
            description: '',
            coordinates: [],
            schedule: '',
            orderCutOffHour: 18,
            enabled: true,
            sameDayDelivery: false,
            sameDayDeliveryDays: [],
            whatsappNumber: '',
            sheetName: '',
        },
    });
    const [isExporting, setIsExporting] = React.useState(false);
    const [isMigrating, setIsMigrating] = React.useState(false);

    // Lista de productos disponibles
    const availableProducts = [
        'Barfer box Gato Vaca 5kg',
        'Barfer box Gato Vaca 10kg',
        'Barfer box Perro Pollo 5kg',
        'Barfer box Perro Pollo 10kg',
        'Barfer box Perro Cerdo 5kg',
        'Barfer box Perro Cerdo 10kg',
        'Barfer box Gato Pollo 5kg',
        'Barfer box Gato Pollo 10kg',
        'Barfer box Gato Cordero 5kg',
        'Barfer box Gato Cordero 10kg',
        'Barfer box Perro Vaca 5kg',
        'Barfer box Perro Vaca 10kg',
        'Barfer box Perro Cordero 5kg',
        'Barfer box Perro Cordero 10kg',
        'Cornalitos',
        'Orejas'
    ];

    // Lista de productos Raw para mayoristas
    const rawProducts = [
        'Traquea X1',
        'Traquea X2',
        'Orejas',
        'Pollo 40grs',
        'Pollo 100grs',
        'Higado 40grs',
        'Higado 100grs',
        'Cornalitos 30grs'
    ];

    // Lista de complementos sueltos para mayoristas
    const complementProducts = [
        'Cornalitos 200grs',
        'Caldo de huesos',
        'Hueso recreativo',
        'Garras 300grs'
    ];

    // Función para obtener productos según el tipo de cliente
    const getProductsByClientType = (clientType: 'minorista' | 'mayorista') => {
        if (clientType === 'mayorista') {
            // Combinar todas las listas y eliminar duplicados
            const allProducts = [...availableProducts, ...rawProducts, ...complementProducts];
            const uniqueProducts = [...new Set(allProducts)];
            return uniqueProducts;
        }
        return availableProducts;
    };

    // Función para determinar si una fila debe ser roja
    const shouldHighlightRow = (row: any) => {
        const status = row.original.status;
        const paymentMethod = row.original.paymentMethod?.toLowerCase();

        return status === 'pending' && (
            paymentMethod === 'mercado pago' ||
            paymentMethod === 'transferencia bancaria' ||
            paymentMethod === 'bank-transfer'
        );
    };

    const table = useReactTable({
        data,
        columns,
        pageCount,
        state: {
            sorting,
            pagination,
            globalFilter,
        },
        getRowId: (row) => row._id,
        manualPagination: true,
        manualSorting: true,
        manualFiltering: true,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        onPaginationChange: (updater) => {
            const newPagination = typeof updater === 'function' ? updater(pagination) : updater;
            const params = new URLSearchParams(searchParams);
            params.set('page', (newPagination.pageIndex + 1).toString());
            params.set('pageSize', newPagination.pageSize.toString());
            router.push(`${pathname}?${params.toString()}`);
        },
        onSortingChange: (updater) => {
            const newSorting = typeof updater === 'function' ? updater(sorting) : updater;
            const params = new URLSearchParams(searchParams);
            if (newSorting.length > 0) {
                params.set('sort', `${newSorting[0].id}.${newSorting[0].desc ? 'desc' : 'asc'}`);
            } else {
                params.delete('sort');
            }
            router.push(`${pathname}?${params.toString()}`);
        },
    });

    // Debounce para la búsqueda
    React.useEffect(() => {
        const timeout = setTimeout(() => {
            const params = new URLSearchParams(searchParams);
            params.set('page', '1');
            params.set('search', globalFilter);
            router.push(`${pathname}?${params.toString()}`);
        }, 500);

        return () => clearTimeout(timeout);
    }, [globalFilter, pathname, router, searchParams]);

    const handleEditClick = (row: any) => {
        setEditingRowId(row.id);
        setEditValues({
            notes: row.original.notes || '',
            notesOwn: row.original.notesOwn || '',
            status: row.original.status || '',
            clientType: row.original.clientType || 'minorista',
            address: row.original.address?.address || '',
            city: row.original.address?.city || '',
            phone: row.original.address?.phone || '',
            paymentMethod: row.original.paymentMethod || '',
            userName: row.original.user?.name || '',
            userLastName: row.original.user?.lastName || '',
            userEmail: row.original.user?.email || '',
            total: row.original.total || 0,
            subTotal: row.original.subTotal || 0,
            shippingPrice: row.original.shippingPrice || 0,
            deliveryAreaSchedule: row.original.deliveryArea?.schedule || '',
            items: row.original.items || [],
        });
    };

    const handleCancel = () => {
        setEditingRowId(null);
        setEditValues({});
    };

    const handleChange = (field: string, value: any) => {
        setEditValues((prev: any) => ({ ...prev, [field]: value }));
    };

    const handleSave = async (row: any) => {
        setLoading(true);
        try {
            const result = await updateOrderAction(row.id, {
                notes: editValues.notes,
                notesOwn: editValues.notesOwn,
                status: editValues.status,
                clientType: editValues.clientType,
                paymentMethod: editValues.paymentMethod,
                total: Number(editValues.total),
                subTotal: Number(editValues.subTotal),
                shippingPrice: Number(editValues.shippingPrice),
                address: {
                    ...row.original.address,
                    address: editValues.address,
                    city: editValues.city,
                    phone: editValues.phone,
                },
                user: {
                    ...row.original.user,
                    name: editValues.userName,
                    lastName: editValues.userLastName,
                    email: editValues.userEmail,
                },
                deliveryArea: {
                    ...row.original.deliveryArea,
                    schedule: editValues.deliveryAreaSchedule,
                },
                items: editValues.items,
            });
            if (!result.success) throw new Error(result.error || 'Error al guardar');
            setEditingRowId(null);
            setEditValues({});
            router.refresh();
        } catch (e) {
            alert(e instanceof Error ? e.message : 'Error al guardar los cambios');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (row: any) => {
        if (!confirm('¿Estás seguro de que quieres eliminar esta orden? Esta acción no se puede deshacer.')) {
            return;
        }

        setLoading(true);
        try {
            const result = await deleteOrderAction(row.id);
            if (!result.success) throw new Error(result.error || 'Error al eliminar');
            router.refresh();
        } catch (e) {
            alert(e instanceof Error ? e.message : 'Error al eliminar la orden');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateOrder = async () => {
        console.log('Creating order with data:', createFormData);
        setLoading(true);
        try {
            const result = await createOrderAction(createFormData);
            if (!result.success) throw new Error(result.error || 'Error al crear');
            setShowCreateModal(false);
            setCreateFormData({
                status: 'pending',
                total: 0,
                subTotal: 0,
                shippingPrice: 0,
                notes: '',
                notesOwn: '',
                paymentMethod: '',
                clientType: 'minorista' as 'minorista' | 'mayorista',
                address: {
                    address: '',
                    city: '',
                    phone: '',
                    betweenStreets: '',
                    floorNumber: '',
                    departmentNumber: '',
                },
                user: {
                    name: '',
                    lastName: '',
                    email: '',
                },
                items: [{
                    id: '',
                    name: '',
                    description: '',
                    images: [],
                    options: [{
                        name: 'Default',
                        price: 0,
                        quantity: 1,
                    }],
                    price: 0,
                    salesCount: 0,
                    discountApllied: 0,
                }],
                deliveryArea: {
                    _id: '',
                    description: '',
                    coordinates: [],
                    schedule: '',
                    orderCutOffHour: 18,
                    enabled: true,
                    sameDayDelivery: false,
                    sameDayDeliveryDays: [],
                    whatsappNumber: '',
                    sheetName: '',
                },
            });
            router.refresh();
        } catch (e) {
            alert(e instanceof Error ? e.message : 'Error al crear la orden');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateFormChange = (field: string, value: any) => {
        console.log('handleCreateFormChange:', { field, value });

        if (field.includes('.')) {
            const parts = field.split('.');
            setCreateFormData(prev => {
                const newData = { ...prev };
                let current: any = newData;

                // Navegar hasta el penúltimo nivel
                for (let i = 0; i < parts.length - 1; i++) {
                    current = current[parts[i]];
                }

                // Asignar el valor en el último nivel
                current[parts[parts.length - 1]] = value;

                console.log('Updated createFormData:', newData);
                return newData;
            });
        } else {
            setCreateFormData(prev => ({ ...prev, [field]: value }));
        }
    };

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const from = searchParams.get('from');
            const to = searchParams.get('to');
            const search = searchParams.get('search');
            const clientType = searchParams.get('clientType');

            const result = await exportOrdersAction({
                search: search || '',
                from: from || '',
                to: to || '',
                clientType: clientType && clientType !== 'all' ? clientType : '',
            });

            if (result.success && result.data) {
                // Construir el nombre del archivo dinámicamente
                let fileName = 'ordenes';
                if (from && to) {
                    if (from === to) {
                        fileName = `ordenes-${from}`;
                    } else {
                        fileName = `ordenes-del-${from}-al-${to}`;
                    }
                }
                fileName += '.xlsx';

                // Decodificar la cadena base64 a un array de bytes
                const byteCharacters = atob(result.data);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);

                const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } else {
                alert(result.error || 'No se pudo exportar el archivo.');
            }
        } catch (e) {
            console.error('Export failed:', e);
            alert('Ocurrió un error al intentar exportar las órdenes.');
        } finally {
            setIsExporting(false);
        }
    };

    const handleMigrateClientType = async () => {
        if (!confirm('¿Estás seguro de que quieres ejecutar la migración? Esto agregará el campo "clientType" con valor "minorista" a todas las órdenes que no lo tengan.')) {
            return;
        }

        setIsMigrating(true);
        try {
            const result = await migrateClientTypeAction();
            if (result.success && 'updatedCount' in result) {
                alert(`Migración completada exitosamente. ${result.updatedCount} órdenes actualizadas.`);
                router.refresh();
            } else {
                alert(result.error || 'Error al ejecutar la migración.');
            }
        } catch (e) {
            console.error('Migration failed:', e);
            alert('Ocurrió un error al intentar ejecutar la migración.');
        } finally {
            setIsMigrating(false);
        }
    };

    return (
        <div>
            <div className="flex flex-col gap-4 py-4">
                <div className="flex items-center gap-4 flex-wrap">
                    <Input
                        placeholder="Buscar en todas las columnas..."
                        value={globalFilter}
                        onChange={(event) => setGlobalFilter(event.target.value)}
                        className="max-w-sm"
                    />
                    <DateRangeFilter />
                    <ClientTypeFilter />
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        onClick={handleExport}
                        disabled={isExporting}
                        className="bg-green-600 text-white hover:bg-green-700"
                    >
                        {isExporting ? 'Exportando...' : 'Exportar a Excel'}
                    </Button>
                    {/* <Button
                        onClick={handleMigrateClientType}
                        disabled={isMigrating}
                        className="bg-blue-600 text-white hover:bg-blue-700"
                    >
                        {isMigrating ? 'Migrando...' : 'Migrar Clientes'}
                    </Button> */}
                    <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
                        <DialogTrigger asChild>
                            <Button variant="default">Crear Orden</Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Crear Nueva Orden</DialogTitle>
                            </DialogHeader>
                            <div className="grid grid-cols-2 gap-4">
                                {/* Información del Cliente */}
                                <div className="space-y-2">
                                    <Label>Nombre</Label>
                                    <Input
                                        value={createFormData.user.name}
                                        onChange={(e) => handleCreateFormChange('user.name', e.target.value)}
                                        placeholder="Nombre del cliente"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Apellido</Label>
                                    <Input
                                        value={createFormData.user.lastName}
                                        onChange={(e) => handleCreateFormChange('user.lastName', e.target.value)}
                                        placeholder="Apellido del cliente"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Email</Label>
                                    <Input
                                        type="email"
                                        value={createFormData.user.email}
                                        onChange={(e) => handleCreateFormChange('user.email', e.target.value)}
                                        placeholder="Email del cliente"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Teléfono</Label>
                                    <Input
                                        value={createFormData.address.phone}
                                        onChange={(e) => handleCreateFormChange('address.phone', e.target.value)}
                                        placeholder="Teléfono"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Dirección</Label>
                                    <Input
                                        value={createFormData.address.address}
                                        onChange={(e) => handleCreateFormChange('address.address', e.target.value)}
                                        placeholder="Dirección"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Ciudad</Label>
                                    <Input
                                        value={createFormData.address.city}
                                        onChange={(e) => handleCreateFormChange('address.city', e.target.value)}
                                        placeholder="Ciudad"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Medio de Pago</Label>
                                    <select
                                        value={createFormData.paymentMethod}
                                        onChange={(e) => handleCreateFormChange('paymentMethod', e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded-md"
                                    >
                                        <option value="">Seleccionar</option>
                                        <option value="cash">Efectivo</option>
                                        <option value="transfer">Transferencia</option>
                                        <option value="bank-transfer">Transferencia Bancaria</option>
                                        <option value="mercado-pago">Mercado Pago</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Estado</Label>
                                    <select
                                        value={createFormData.status}
                                        onChange={(e) => handleCreateFormChange('status', e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded-md"
                                    >
                                        <option value="pending">Pendiente</option>
                                        <option value="confirmed">Confirmado</option>
                                        <option value="delivered">Entregado</option>
                                        <option value="cancelled">Cancelado</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Tipo de Cliente</Label>
                                    <select
                                        value={createFormData.clientType}
                                        onChange={(e) => handleCreateFormChange('clientType', e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded-md"
                                    >
                                        <option value="minorista">Minorista</option>
                                        <option value="mayorista">Mayorista</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Rango Horario</Label>
                                    <Input
                                        value={createFormData.deliveryArea.schedule}
                                        onChange={(e) => handleCreateFormChange('deliveryArea.schedule', e.target.value)}
                                        placeholder="Ej: Lunes a Viernes de 10hs a 17hs"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Total</Label>
                                    <Input
                                        type="number"
                                        value={createFormData.total}
                                        onChange={(e) => handleCreateFormChange('total', Number(e.target.value))}
                                        placeholder="0"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Notas Cliente</Label>
                                    <Textarea
                                        value={createFormData.notes}
                                        onChange={(e) => handleCreateFormChange('notes', e.target.value)}
                                        placeholder="Notas del cliente"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Notas Propias</Label>
                                    <Textarea
                                        value={createFormData.notesOwn}
                                        onChange={(e) => handleCreateFormChange('notesOwn', e.target.value)}
                                        placeholder="Notas propias"
                                    />
                                </div>
                                <div className="space-y-2 col-span-2">
                                    <Label>Items</Label>
                                    <div className="space-y-2">
                                        {createFormData.items?.map((item: any, index: number) => (
                                            <div key={index} className="flex gap-2">
                                                <select
                                                    value={item.name || ''}
                                                    onChange={(e) => {
                                                        const newItems = [...createFormData.items];
                                                        newItems[index] = {
                                                            ...newItems[index],
                                                            name: e.target.value,
                                                            id: e.target.value
                                                        };
                                                        handleCreateFormChange('items', newItems);
                                                    }}
                                                    className="flex-1 p-2 border border-gray-300 rounded-md"
                                                >
                                                    <option value="">Seleccionar producto</option>
                                                    {getProductsByClientType(createFormData.clientType).map(product => (
                                                        <option key={product} value={product}>
                                                            {product}
                                                        </option>
                                                    ))}
                                                </select>
                                                <Input
                                                    type="number"
                                                    value={item.options?.[0]?.quantity || 1}
                                                    onChange={(e) => {
                                                        const newItems = [...createFormData.items];
                                                        newItems[index] = {
                                                            ...newItems[index],
                                                            options: [{
                                                                ...newItems[index].options?.[0],
                                                                quantity: parseInt(e.target.value) || 1
                                                            }]
                                                        };
                                                        handleCreateFormChange('items', newItems);
                                                    }}
                                                    className="w-20 p-2"
                                                    placeholder="Qty"
                                                />
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => {
                                                        const newItems = createFormData.items.filter((_: any, i: number) => i !== index);
                                                        handleCreateFormChange('items', newItems);
                                                    }}
                                                >
                                                    X
                                                </Button>
                                            </div>
                                        ))}
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                const newItems = [...createFormData.items, {
                                                    id: '',
                                                    name: '',
                                                    description: '',
                                                    images: [],
                                                    options: [{ name: 'Default', price: 0, quantity: 1 }],
                                                    price: 0,
                                                    salesCount: 0,
                                                    discountApllied: 0,
                                                }];
                                                handleCreateFormChange('items', newItems);
                                            }}
                                        >
                                            + Agregar Item
                                        </Button>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 mt-4">
                                <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                                    Cancelar
                                </Button>
                                <Button onClick={handleCreateOrder} disabled={loading}>
                                    {loading ? 'Creando...' : 'Crear Orden'}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
            <div className="rounded-md border">
                <Table className="table-fixed w-full border-collapse">
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header, index) => (
                                    <TableHead
                                        key={header.id}
                                        className="p-1 text-xs border-r border-border"
                                        style={{
                                            width: index === 0 ? '60px' :  // Fecha
                                                index === 1 ? '100px' : // Tipo Cliente
                                                    index === 2 ? '90px' : // Día Entrega
                                                        index === 3 ? '100px' : // Rango Horario
                                                            index === 4 ? '110px' : // Notas Cliente
                                                                index === 5 ? '130px' : // Cliente
                                                                    index === 6 ? '140px' : // Dirección
                                                                        index === 7 ? '100px' : // Teléfono
                                                                            index === 8 ? '125px' : // Items
                                                                                index === 9 ? '100px' : // Medio de pago
                                                                                    index === 10 ? '95px' : // Estado
                                                                                        index === 11 ? '100px' :// Total
                                                                                            index === 12 ? '150px' : // Notas
                                                                                                index === 13 ? '180px' : // Mail
                                                                                                    '150px'
                                        }}
                                    >
                                        {header.isPlaceholder ? null : (
                                            <Button
                                                variant="ghost"
                                                onClick={header.column.getToggleSortingHandler()}
                                                disabled={!header.column.getCanSort()}
                                                className="h-6 px-1 text-xs"
                                            >
                                                {flexRender(header.column.columnDef.header, header.getContext())}
                                                {{
                                                    asc: ' 🔼',
                                                    desc: ' 🔽',
                                                }[header.column.getIsSorted() as string] ?? null}
                                            </Button>
                                        )}
                                    </TableHead>
                                ))}
                                <TableHead className="p-1 text-xs border-r border-border" style={{ width: '80px' }}>Acciones</TableHead>
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && 'selected'}
                                    className={shouldHighlightRow(row) ? 'bg-red-100 dark:bg-red-900/40' : ''}
                                >
                                    {row.getVisibleCells().map((cell, index) => {
                                        let extraClass = '';
                                        if (index === 0) {
                                            const createdAtObj = (row.original as any)['createdAt'];
                                            let date: Date | null = null;
                                            if (createdAtObj instanceof Date) {
                                                date = createdAtObj;
                                            } else if (createdAtObj?.$date) {
                                                date = new Date(createdAtObj.$date);
                                            } else if (typeof createdAtObj === 'string' || typeof createdAtObj === 'number') {
                                                date = new Date(createdAtObj);
                                            }
                                            if (date) {
                                                const day = date.getDay();
                                                extraClass = {
                                                    1: 'bg-green-100',    // Lunes (verde suave)
                                                    2: 'bg-yellow-100',   // Martes (amarillo suave)
                                                    3: 'bg-red-100',      // Miércoles (rojo suave)
                                                    4: 'bg-amber-200',    // Jueves (ámbar/marrón suave)
                                                    6: 'bg-blue-100',     // Sábado (azul suave)
                                                }[day] || '';
                                            }
                                        }
                                        // Edición inline para campos editables
                                        if (editingRowId === row.id) {
                                            console.log('Columna:', cell.column.id);
                                            if (cell.column.id === 'notesOwn') {
                                                return (
                                                    <TableCell key={cell.id} className="p-1 border-r border-border">
                                                        <Input
                                                            value={editValues.notesOwn}
                                                            onChange={e => handleChange('notesOwn', e.target.value)}
                                                            className="w-full text-xs"
                                                        />
                                                    </TableCell>
                                                );
                                            }
                                            if (cell.column.id === 'notes') {
                                                return (
                                                    <TableCell key={cell.id} className="p-1 border-r border-border">
                                                        <Input
                                                            value={editValues.notes}
                                                            onChange={e => handleChange('notes', e.target.value)}
                                                            className="w-full text-xs"
                                                        />
                                                    </TableCell>
                                                );
                                            }
                                            if (cell.column.id === 'status') {
                                                return (
                                                    <TableCell key={cell.id} className="p-1 border-r border-border">
                                                        <select
                                                            value={editValues.status}
                                                            onChange={e => handleChange('status', e.target.value)}
                                                            className="w-full p-1 text-xs border border-gray-300 rounded-md"
                                                        >
                                                            <option value="pending">Pendiente</option>
                                                            <option value="confirmed">Confirmado</option>
                                                            <option value="delivered">Entregado</option>
                                                            <option value="cancelled">Cancelado</option>
                                                        </select>
                                                    </TableCell>
                                                );
                                            }
                                            if (cell.column.id === 'clientType') {
                                                return (
                                                    <TableCell key={cell.id} className="p-1 border-r border-border">
                                                        <select
                                                            value={editValues.clientType}
                                                            onChange={e => handleChange('clientType', e.target.value)}
                                                            className="w-full p-1 text-xs border border-gray-300 rounded-md"
                                                        >
                                                            <option value="minorista">Minorista</option>
                                                            <option value="mayorista">Mayorista</option>
                                                        </select>
                                                    </TableCell>
                                                );
                                            }
                                            if (cell.column.id === 'paymentMethod') {
                                                return (
                                                    <TableCell key={cell.id} className="p-1 border-r border-border">
                                                        <Input
                                                            value={editValues.paymentMethod}
                                                            onChange={e => handleChange('paymentMethod', e.target.value)}
                                                            className="w-full text-xs"
                                                        />
                                                    </TableCell>
                                                );
                                            }
                                            if (cell.column.id === 'total') {
                                                return (
                                                    <TableCell key={cell.id} className="p-1 border-r border-border">
                                                        <Input
                                                            type="number"
                                                            value={editValues.total}
                                                            onChange={e => handleChange('total', e.target.value)}
                                                            className="w-full text-xs"
                                                        />
                                                    </TableCell>
                                                );
                                            }
                                            if (cell.column.id === 'subTotal') {
                                                return (
                                                    <TableCell key={cell.id} className="p-1 border-r border-border">
                                                        <Input
                                                            type="number"
                                                            value={editValues.subTotal}
                                                            onChange={e => handleChange('subTotal', e.target.value)}
                                                            className="w-full text-xs"
                                                        />
                                                    </TableCell>
                                                );
                                            }
                                            if (cell.column.id === 'shippingPrice') {
                                                return (
                                                    <TableCell key={cell.id} className="p-1 border-r border-border">
                                                        <Input
                                                            type="number"
                                                            value={editValues.shippingPrice}
                                                            onChange={e => handleChange('shippingPrice', e.target.value)}
                                                            className="w-full text-xs"
                                                        />
                                                    </TableCell>
                                                );
                                            }
                                            if (cell.column.id === 'address_address') {
                                                return (
                                                    <TableCell key={cell.id} className="p-1 border-r border-border">
                                                        <Input
                                                            value={editValues.address}
                                                            onChange={e => handleChange('address', e.target.value)}
                                                            className="w-full text-xs"
                                                            placeholder="Dirección"
                                                        />
                                                    </TableCell>
                                                );
                                            }
                                            if (cell.column.id === 'address_city') {
                                                return (
                                                    <TableCell key={cell.id} className="p-1 border-r border-border">
                                                        <Input
                                                            value={editValues.city}
                                                            onChange={e => handleChange('city', e.target.value)}
                                                            className="w-full text-xs"
                                                            placeholder="Ciudad"
                                                        />
                                                    </TableCell>
                                                );
                                            }
                                            if (cell.column.id === 'address_phone') {
                                                return (
                                                    <TableCell key={cell.id} className="p-1 border-r border-border">
                                                        <Input
                                                            value={editValues.phone}
                                                            onChange={e => handleChange('phone', e.target.value)}
                                                            className="w-full text-xs"
                                                            placeholder="Teléfono"
                                                        />
                                                    </TableCell>
                                                );
                                            }
                                            if (cell.column.id === 'user_name' || cell.column.id === 'name') {
                                                console.log('DEBUG user_name:', { id: cell.column.id, editValues });
                                                return (
                                                    <TableCell key={cell.id} className="p-1 border-r border-border">
                                                        <div className="flex gap-1">
                                                            <Input
                                                                value={editValues.userName}
                                                                onChange={e => handleChange('userName', e.target.value)}
                                                                className="w-1/2 text-xs"
                                                                placeholder="Nombre"
                                                            />
                                                            <Input
                                                                value={editValues.userLastName}
                                                                onChange={e => handleChange('userLastName', e.target.value)}
                                                                className="w-1/2 text-xs"
                                                                placeholder="Apellido"
                                                            />
                                                        </div>
                                                    </TableCell>
                                                );
                                            }
                                            if (cell.column.id === 'user_lastName') {
                                                return (
                                                    <TableCell key={cell.id} className="p-1 border-r border-border">
                                                        <Input
                                                            value={editValues.userLastName}
                                                            onChange={e => handleChange('userLastName', e.target.value)}
                                                            className="w-full text-xs"
                                                            placeholder="Apellido"
                                                        />
                                                    </TableCell>
                                                );
                                            }
                                            if (cell.column.id === 'user_email' || cell.column.id === 'email') {
                                                return (
                                                    <TableCell key={cell.id} className="p-1 border-r border-border">
                                                        <Input
                                                            value={editValues.userEmail}
                                                            onChange={e => handleChange('userEmail', e.target.value)}
                                                            className="w-full text-xs"
                                                        />
                                                    </TableCell>
                                                );
                                            }
                                            if (cell.column.id === 'deliveryArea.schedule') {
                                                return (
                                                    <TableCell key={cell.id} className="p-1 border-r border-border">
                                                        <Input
                                                            value={editValues.deliveryAreaSchedule}
                                                            onChange={e => handleChange('deliveryAreaSchedule', e.target.value)}
                                                            className="w-full text-xs"
                                                        />
                                                    </TableCell>
                                                );
                                            }
                                            if (cell.column.id === 'items') {
                                                return (
                                                    <TableCell key={cell.id} className="p-1 border-r border-border">
                                                        <div className="space-y-1">
                                                            {editValues.items?.map((item: any, index: number) => (
                                                                <div key={index} className="flex gap-1">
                                                                    <select
                                                                        value={item.name || ''}
                                                                        onChange={e => {
                                                                            const newItems = [...editValues.items];
                                                                            newItems[index] = {
                                                                                ...newItems[index],
                                                                                name: e.target.value,
                                                                                id: e.target.value
                                                                            };
                                                                            handleChange('items', newItems);
                                                                        }}
                                                                        className="flex-1 p-1 text-xs border border-gray-300 rounded-md"
                                                                    >
                                                                        <option value="">Seleccionar producto</option>
                                                                        {getProductsByClientType(editValues.clientType).map(product => (
                                                                            <option key={product} value={product}>
                                                                                {product}
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                    <Input
                                                                        type="number"
                                                                        value={item.options?.[0]?.quantity || 1}
                                                                        onChange={e => {
                                                                            const newItems = [...editValues.items];
                                                                            newItems[index] = {
                                                                                ...newItems[index],
                                                                                options: [{
                                                                                    ...newItems[index].options?.[0],
                                                                                    quantity: parseInt(e.target.value) || 1
                                                                                }]
                                                                            };
                                                                            handleChange('items', newItems);
                                                                        }}
                                                                        className="w-12 p-1 text-xs"
                                                                        placeholder="Qty"
                                                                    />
                                                                </div>
                                                            ))}
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => {
                                                                    const newItems = [...editValues.items, {
                                                                        id: '',
                                                                        name: '',
                                                                        description: '',
                                                                        images: [],
                                                                        options: [{ name: 'Default', price: 0, quantity: 1 }],
                                                                        price: 0,
                                                                        salesCount: 0,
                                                                        discountApllied: 0,
                                                                    }];
                                                                    handleChange('items', newItems);
                                                                }}
                                                                className="w-full text-xs"
                                                            >
                                                                + Agregar Item
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                );
                                            }
                                        }
                                        return (
                                            <TableCell
                                                key={cell.id}
                                                className={`p-1 border-r border-border ${extraClass}`}
                                                style={{
                                                    width: index === 0 ? '60px' :  // Fecha
                                                        index === 1 ? '100px' : // Tipo Cliente
                                                            index === 2 ? '90px' : // Día Entrega
                                                                index === 3 ? '100px' : // Rango Horario
                                                                    index === 4 ? '110px' : // Notas Cliente
                                                                        index === 5 ? '130px' : // Cliente
                                                                            index === 6 ? '140px' : // Dirección
                                                                                index === 7 ? '100px' : // Teléfono
                                                                                    index === 8 ? '125px' : // Items
                                                                                        index === 9 ? '100px' : // Medio de pago
                                                                                            index === 10 ? '95px' : // Estado
                                                                                                index === 11 ? '100px' :// Total
                                                                                                    index === 12 ? '150px' : // Notas
                                                                                                        index === 13 ? '180px' : // Mail
                                                                                                            '150px'
                                                }}
                                            >
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </TableCell>
                                        );
                                    })}
                                    {/* Botón de acción */}
                                    <TableCell className="p-1 border-r border-border">
                                        {editingRowId === row.id ? (
                                            <div className="flex gap-2">
                                                <Button size="icon" variant="default" onClick={() => handleSave(row)} disabled={loading}><Save className="w-4 h-4" /></Button>
                                                <Button size="icon" variant="outline" onClick={handleCancel} disabled={loading}><X className="w-4 h-4" /></Button>
                                            </div>
                                        ) : (
                                            <div className="flex gap-2">
                                                <Button size="icon" variant="outline" onClick={() => handleEditClick(row)}><Pencil className="w-4 h-4" /></Button>
                                                <Button size="icon" variant="destructive" onClick={() => handleDelete(row)} disabled={loading}><Trash2 className="w-4 h-4" /></Button>
                                            </div>
                                        )}
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
            <div className="flex items-center justify-between space-x-2 py-4">
                <div className="text-sm text-muted-foreground">
                    Mostrando {table.getRowModel().rows.length} de {total} órdenes.
                </div>
                <div className="space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                    >
                        Anterior
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                    >
                        Siguiente
                    </Button>
                </div>
            </div>
        </div>
    );
} 