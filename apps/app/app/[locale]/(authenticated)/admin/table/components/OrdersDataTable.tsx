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
import { updateOrderAction, deleteOrderAction, createOrderAction, migrateClientTypeAction, updateOrdersStatusBulkAction } from '../actions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@repo/design-system/components/ui/dialog';
import { Label } from '@repo/design-system/components/ui/label';
import { Textarea } from '@repo/design-system/components/ui/textarea';
import { DateRangeFilter } from './DateRangeFilter';
import { OrderTypeFilter } from './ClientTypeFilter';
import { exportOrdersAction } from '../exportOrdersAction';
import { Calendar } from '@repo/design-system/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@repo/design-system/components/ui/popover';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

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
        orderType: 'minorista' as 'minorista' | 'mayorista',
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
        deliveryDay: '',
    });
    const [isExporting, setIsExporting] = React.useState(false);
    const [isMigrating, setIsMigrating] = React.useState(false);
    const [rowSelection, setRowSelection] = React.useState<Record<string, boolean>>({});
    const [productSearchFilter, setProductSearchFilter] = React.useState('');

    // Lista de productos disponibles
    const availableProducts = [
        'Barfer box Gato Vaca 5kg',
        'Barfer box Perro Pollo 5kg',
        'Barfer box Perro Pollo 10kg',
        'Barfer box Perro Cerdo 5kg',
        'Barfer box Perro Cerdo 10kg',
        'Barfer box Gato Pollo 5kg',
        'Barfer box Gato Cordero 5kg',
        'Barfer box Perro Vaca 5kg',
        'Barfer box Perro Vaca 10kg',
        'Barfer box Perro Cordero 5kg',
        'Barfer box Perro Cordero 10kg',
        'BIG DOG (15kg) - POLLO',
        'BIG DOG (15kg) - VACA',
        'HUESOS CARNOSOS - 5KG',
        'Box de Complementos - 1 U',
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
        'Cornalitos 30grs',
        'Orejas'
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
        // Excluir 'Cornalitos' y 'Orejas' para minorista en cualquier lista
        const forbidden = ['Cornalitos', 'Orejas'];
        const allProducts = [...availableProducts, ...rawProducts, ...complementProducts];
        const filtered = allProducts.filter(product => !forbidden.some(f => product.trim().toLowerCase().startsWith(f.toLowerCase())));
        // Eliminar duplicados
        return [...new Set(filtered)];
    };

    // Función para filtrar productos por búsqueda
    const getFilteredProducts = (clientType: 'minorista' | 'mayorista', searchTerm: string) => {
        const products = getProductsByClientType(clientType);
        if (!searchTerm) return products;

        return products.filter(product =>
            product.toLowerCase().includes(searchTerm.toLowerCase())
        );
    };

    // Función para determinar el color de la fila
    const shouldHighlightRow = (row: any) => {
        const status = row.original.status?.toLowerCase();
        if (status === 'delivered') return 'green';
        return null;
    };

    // Función para determinar el color de fondo de la celda de fecha
    const getDateCellBackgroundColor = (deliveryDay: string) => {
        if (!deliveryDay) return '';

        const date = new Date(deliveryDay);
        const day = date.getDay();

        switch (day) {
            case 1: // Lunes
                return 'bg-green-100';
            case 2: // Martes
                return 'bg-yellow-100';
            case 3: // Miércoles
                return 'bg-red-100';
            case 4: // Jueves
                return 'bg-yellow-600';
            case 6: // Sábado
                return 'bg-blue-100';
            default:
                return '';
        }
    };

    // Función para determinar el color de fondo de la celda de estado
    const getStatusCellBackgroundColor = (status: string, paymentMethod: string) => {
        if (status === 'pending' && paymentMethod !== 'cash') {
            return 'bg-red-500';
        }
        return '';
    };

    const table = useReactTable({
        data,
        columns,
        pageCount,
        state: {
            sorting,
            pagination,
            globalFilter,
            rowSelection,
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
        onRowSelectionChange: setRowSelection,
        enableRowSelection: true,
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
        setProductSearchFilter('');
        setEditValues({
            notes: row.original.notes || '',
            notesOwn: row.original.notesOwn || '',
            status: row.original.status || '',
            orderType: row.original.orderType || 'minorista',
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
            deliveryDay: row.original.deliveryDay ? new Date(row.original.deliveryDay).toISOString() : '',
        });
    };

    const handleCancel = () => {
        setEditingRowId(null);
        setEditValues({});
        setProductSearchFilter('');
    };

    const handleChange = (field: string, value: any) => {
        setEditValues((prev: any) => ({ ...prev, [field]: value }));
    };

    const handleSave = async (row: any) => {
        setLoading(true);
        try {
            // Filtrar items: eliminar los que no tienen nombre o tienen cantidad 0
            const filteredItems = editValues.items?.filter((item: any) => {
                const hasName = item.name && item.name.trim() !== '';
                const hasQuantity = item.options?.[0]?.quantity > 0;
                return hasName && hasQuantity;
            }) || [];

            const result = await updateOrderAction(row.id, {
                notes: editValues.notes,
                notesOwn: editValues.notesOwn,
                status: editValues.status,
                orderType: editValues.orderType,
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
                items: filteredItems,
                deliveryDay: editValues.deliveryDay,
            });
            if (!result.success) throw new Error(result.error || 'Error al guardar');
            setEditingRowId(null);
            setEditValues({});
            setProductSearchFilter('');
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
            // Filtrar items: eliminar los que no tienen nombre o tienen cantidad 0
            const filteredItems = createFormData.items?.filter((item: any) => {
                const hasName = item.name && item.name.trim() !== '';
                const hasQuantity = item.options?.[0]?.quantity > 0;
                return hasName && hasQuantity;
            }) || [];

            const orderDataWithFilteredItems = {
                ...createFormData,
                items: filteredItems
            };

            const result = await createOrderAction(orderDataWithFilteredItems);
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
                orderType: 'minorista' as 'minorista' | 'mayorista',
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
                deliveryDay: '',
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
            const orderType = searchParams.get('orderType');

            const result = await exportOrdersAction({
                search: search || '',
                from: from || '',
                to: to || '',
                orderType: orderType && orderType !== 'all' ? orderType : '',
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

    const headerCheckboxRef = React.useRef<HTMLInputElement>(null);
    React.useEffect(() => {
        if (headerCheckboxRef.current) {
            headerCheckboxRef.current.indeterminate = table.getIsSomeRowsSelected() && !table.getIsAllRowsSelected();
        }
    }, [table.getIsSomeRowsSelected(), table.getIsAllRowsSelected()]);

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
                    <OrderTypeFilter />
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
                                        value={createFormData.orderType}
                                        onChange={(e) => handleCreateFormChange('orderType', e.target.value)}
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
                                <div className="space-y-2">
                                    <Label>Fecha de Entrega</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Input
                                                readOnly
                                                value={createFormData.deliveryDay ? format(new Date(createFormData.deliveryDay), 'PPP', { locale: es }) : ''}
                                                placeholder="Seleccionar fecha"
                                            />
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar
                                                mode="single"
                                                selected={createFormData.deliveryDay ? new Date(createFormData.deliveryDay) : undefined}
                                                onSelect={(date) => {
                                                    if (date) {
                                                        handleCreateFormChange('deliveryDay', date.toISOString());
                                                    }
                                                }}
                                                locale={es}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
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
                                                    {getProductsByClientType(createFormData.orderType).map(product => (
                                                        <option key={product} value={product}>
                                                            {product}
                                                        </option>
                                                    ))}
                                                </select>
                                                <Input
                                                    type="number"
                                                    value={item.options?.[0]?.quantity || 1}
                                                    onChange={(e) => {
                                                        const quantity = parseInt(e.target.value) || 0;

                                                        if (quantity <= 0) {
                                                            // Eliminar el item si la cantidad es 0 o menor
                                                            const newItems = createFormData.items.filter((_: any, i: number) => i !== index);
                                                            handleCreateFormChange('items', newItems);
                                                        } else {
                                                            // Actualizar la cantidad
                                                            const newItems = [...createFormData.items];
                                                            newItems[index] = {
                                                                ...newItems[index],
                                                                options: [{
                                                                    ...newItems[index].options?.[0],
                                                                    quantity: quantity
                                                                }]
                                                            };
                                                            handleCreateFormChange('items', newItems);
                                                        }
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
                    <Button
                        variant="default"
                        disabled={Object.keys(rowSelection).length === 0 || loading}
                        onClick={async () => {
                            const selectedIds = Object.keys(rowSelection).filter((id) => rowSelection[id]);
                            setLoading(true);
                            try {
                                const result = await updateOrdersStatusBulkAction(selectedIds, 'delivered');
                                if (result.success) {
                                    setRowSelection({});
                                    router.refresh();
                                } else {
                                    alert('No se pudo actualizar el estado.');
                                }
                            } catch (e) {
                                alert('Ocurrió un error al actualizar las órdenes.');
                            } finally {
                                setLoading(false);
                            }
                        }}
                    >
                        Marcar como Entregado
                    </Button>
                </div>
            </div>
            <div className="rounded-md border">
                <Table className="table-fixed w-full border-collapse">
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                <TableHead className="px-0 py-1 text-xs border-r border-border" style={{ width: '32px' }}>
                                    <div className="flex justify-center">
                                        <input
                                            type="checkbox"
                                            ref={headerCheckboxRef}
                                            checked={table.getIsAllRowsSelected()}
                                            onChange={table.getToggleAllRowsSelectedHandler()}
                                        />
                                    </div>
                                </TableHead>
                                {headerGroup.headers.map((header, index) => (
                                    <TableHead
                                        key={header.id}
                                        className="px-0 py-1 text-xs border-r border-border"
                                        style={{
                                            width: index === 0 ? '80px' :  // Tipo Cliente
                                                index === 1 ? '70px' : // Fecha (antes Día Entrega)
                                                    index === 2 ? '100px' : // Rango Horario
                                                        index === 3 ? '110px' : // Notas Cliente
                                                            index === 4 ? '130px' : // Cliente
                                                                index === 5 ? '140px' : // Dirección
                                                                    index === 6 ? '100px' : // Teléfono
                                                                        index === 7 ? '220px' : // Items
                                                                            index === 8 ? '100px' : // Medio de pago
                                                                                index === 9 ? '85px' : // Estado
                                                                                    index === 10 ? '100px' :// Total
                                                                                        index === 11 ? '150px' : // Notas
                                                                                            index === 12 ? '180px' : // Mail
                                                                                                '150px'
                                        }}
                                    >
                                        {header.isPlaceholder ? null : (
                                            <Button
                                                variant="ghost"
                                                onClick={header.column.getToggleSortingHandler()}
                                                disabled={!header.column.getCanSort()}
                                                className="h-6 px-1 text-xs w-full justify-center"
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
                                <TableHead className="px-0 py-1 text-xs border-r border-border text-center" style={{ width: '80px' }}>Acciones</TableHead>
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && 'selected'}
                                    className={
                                        shouldHighlightRow(row) === 'green'
                                            ? 'bg-green-100 dark:bg-green-900/40'
                                            : ''
                                    }
                                >
                                    <TableCell className="px-0 py-1 border-r border-border">
                                        <div className="flex justify-center">
                                            <input
                                                type="checkbox"
                                                checked={row.getIsSelected()}
                                                onChange={row.getToggleSelectedHandler()}
                                            />
                                        </div>
                                    </TableCell>
                                    {row.getVisibleCells().map((cell, index) => {
                                        let extraClass = '';
                                        // Edición inline para campos editables
                                        if (editingRowId === row.id) {
                                            console.log('Columna:', cell.column.id);
                                            if (cell.column.id === 'notesOwn') {
                                                return (
                                                    <TableCell key={cell.id} className="px-0 py-1 border-r border-border">
                                                        <Input
                                                            value={editValues.notesOwn}
                                                            onChange={e => handleChange('notesOwn', e.target.value)}
                                                            className="w-full text-xs text-center"
                                                        />
                                                    </TableCell>
                                                );
                                            }
                                            if (cell.column.id === 'notes') {
                                                // Extraer info de dirección como en columns.tsx
                                                const address = (row.original as any)['address'] || {};
                                                let addressInfo = '';
                                                const parts = [];
                                                if (address.betweenStreets) parts.push(`Entre: ${address.betweenStreets}`);
                                                if (address.floorNumber) parts.push(`Piso: ${address.floorNumber}`);
                                                if (address.departmentNumber) parts.push(`Depto: ${address.departmentNumber}`);
                                                addressInfo = parts.join(' | ');
                                                // Combinar nota y dirección en el input
                                                const combinedValue = addressInfo ? `${editValues.notes}${editValues.notes ? ' | ' : ''}${addressInfo}` : editValues.notes;
                                                return (
                                                    <TableCell key={cell.id} className="px-0 py-1 border-r border-border">
                                                        <Input
                                                            value={combinedValue}
                                                            onChange={e => handleChange('notes', e.target.value.split(' | ')[0])}
                                                            className="w-full text-xs text-center"
                                                            placeholder="Nota del cliente y dirección"
                                                        />
                                                    </TableCell>
                                                );
                                            }
                                            if (cell.column.id === 'status') {
                                                const bgColor = getStatusCellBackgroundColor(editValues.status, editValues.paymentMethod);
                                                return (
                                                    <TableCell key={cell.id} className={`px-0 py-1 border-r border-border ${bgColor}`}>
                                                        <select
                                                            value={editValues.status}
                                                            onChange={e => handleChange('status', e.target.value)}
                                                            className="w-full p-1 text-xs border border-gray-300 rounded-md text-center"
                                                        >
                                                            <option value="pending">Pendiente</option>
                                                            <option value="confirmed">Confirmado</option>
                                                            <option value="delivered">Entregado</option>
                                                            <option value="cancelled">Cancelado</option>
                                                        </select>
                                                    </TableCell>
                                                );
                                            }
                                            if (cell.column.id === 'orderType') {
                                                return (
                                                    <TableCell key={cell.id} className="px-0 py-1 border-r border-border">
                                                        <select
                                                            value={editValues.orderType}
                                                            onChange={e => handleChange('orderType', e.target.value)}
                                                            className="w-full p-1 text-xs border border-gray-300 rounded-md text-center"
                                                        >
                                                            <option value="minorista">Minorista</option>
                                                            <option value="mayorista">Mayorista</option>
                                                        </select>
                                                    </TableCell>
                                                );
                                            }
                                            if (cell.column.id === 'paymentMethod') {
                                                return (
                                                    <TableCell key={cell.id} className="px-0 py-1 border-r border-border">
                                                        <select
                                                            value={editValues.paymentMethod}
                                                            onChange={e => handleChange('paymentMethod', e.target.value)}
                                                            className="w-full p-1 text-xs border border-gray-300 rounded-md text-center"
                                                        >
                                                            <option value="">Seleccionar</option>
                                                            <option value="mercado-pago">Mercado Pago</option>
                                                            <option value="cash">Efectivo</option>
                                                            <option value="bank-transfer">Transferencia Bancaria</option>
                                                            <option value="transfer">Transferencia</option>
                                                        </select>
                                                    </TableCell>
                                                );
                                            }
                                            if (cell.column.id === 'total') {
                                                return (
                                                    <TableCell key={cell.id} className="px-0 py-1 border-r border-border">
                                                        <Input
                                                            type="number"
                                                            value={editValues.total}
                                                            onChange={e => handleChange('total', e.target.value)}
                                                            className="w-full text-xs text-center"
                                                        />
                                                    </TableCell>
                                                );
                                            }
                                            if (cell.column.id === 'subTotal') {
                                                return (
                                                    <TableCell key={cell.id} className="px-0 py-1 border-r border-border">
                                                        <Input
                                                            type="number"
                                                            value={editValues.subTotal}
                                                            onChange={e => handleChange('subTotal', e.target.value)}
                                                            className="w-full text-xs text-center"
                                                        />
                                                    </TableCell>
                                                );
                                            }
                                            if (cell.column.id === 'shippingPrice') {
                                                return (
                                                    <TableCell key={cell.id} className="px-0 py-1 border-r border-border">
                                                        <Input
                                                            type="number"
                                                            value={editValues.shippingPrice}
                                                            onChange={e => handleChange('shippingPrice', e.target.value)}
                                                            className="w-full text-xs text-center"
                                                        />
                                                    </TableCell>
                                                );
                                            }
                                            if (cell.column.id === 'address_address') {
                                                return (
                                                    <TableCell key={cell.id} className="px-0 py-1 border-r border-border">
                                                        <Input
                                                            value={editValues.address}
                                                            onChange={e => handleChange('address', e.target.value)}
                                                            className="w-full text-xs text-center"
                                                            placeholder="Dirección"
                                                        />
                                                    </TableCell>
                                                );
                                            }
                                            if (cell.column.id === 'address_city') {
                                                return (
                                                    <TableCell key={cell.id} className="px-0 py-1 border-r border-border">
                                                        <Input
                                                            value={editValues.city}
                                                            onChange={e => handleChange('city', e.target.value)}
                                                            className="w-full text-xs text-center"
                                                            placeholder="Ciudad"
                                                        />
                                                    </TableCell>
                                                );
                                            }
                                            if (cell.column.id === 'address_phone') {
                                                return (
                                                    <TableCell key={cell.id} className="px-0 py-1 border-r border-border">
                                                        <Input
                                                            value={editValues.phone}
                                                            onChange={e => handleChange('phone', e.target.value)}
                                                            className="w-full text-xs text-center"
                                                            placeholder="Teléfono"
                                                        />
                                                    </TableCell>
                                                );
                                            }
                                            if (cell.column.id === 'user_name' || cell.column.id === 'name') {
                                                console.log('DEBUG user_name:', { id: cell.column.id, editValues });
                                                return (
                                                    <TableCell key={cell.id} className="px-0 py-1 border-r border-border">
                                                        <div className="flex gap-1">
                                                            <Input
                                                                value={editValues.userName}
                                                                onChange={e => handleChange('userName', e.target.value)}
                                                                className="w-1/2 text-xs text-center"
                                                                placeholder="Nombre"
                                                            />
                                                            <Input
                                                                value={editValues.userLastName}
                                                                onChange={e => handleChange('userLastName', e.target.value)}
                                                                className="w-1/2 text-xs text-center"
                                                                placeholder="Apellido"
                                                            />
                                                        </div>
                                                    </TableCell>
                                                );
                                            }
                                            if (cell.column.id === 'user_lastName') {
                                                return (
                                                    <TableCell key={cell.id} className="px-0 py-1 border-r border-border">
                                                        <Input
                                                            value={editValues.userLastName}
                                                            onChange={e => handleChange('userLastName', e.target.value)}
                                                            className="w-full text-xs text-center"
                                                            placeholder="Apellido"
                                                        />
                                                    </TableCell>
                                                );
                                            }
                                            if (cell.column.id === 'user_email' || cell.column.id === 'email') {
                                                return (
                                                    <TableCell key={cell.id} className="px-0 py-1 border-r border-border">
                                                        <Input
                                                            value={editValues.userEmail}
                                                            onChange={e => handleChange('userEmail', e.target.value)}
                                                            className="w-full text-xs text-center"
                                                        />
                                                    </TableCell>
                                                );
                                            }
                                            if (cell.column.id === 'deliveryArea.schedule' || cell.column.id === 'deliveryArea_schedule') {
                                                return (
                                                    <TableCell key={cell.id} className="px-0 py-1 border-r border-border">
                                                        <Input
                                                            value={editValues.deliveryAreaSchedule}
                                                            onChange={e => handleChange('deliveryAreaSchedule', e.target.value)}
                                                            className="w-full text-xs text-center"
                                                        />
                                                    </TableCell>
                                                );
                                            }
                                            if (cell.column.id === 'items') {
                                                return (
                                                    <TableCell key={cell.id} className="px-0 py-1 border-r border-border">
                                                        <div className="space-y-1">
                                                            {/* Buscador de productos */}
                                                            <Input
                                                                placeholder="Buscar producto..."
                                                                value={productSearchFilter}
                                                                onChange={(e) => setProductSearchFilter(e.target.value)}
                                                                className="w-full p-1 text-xs"
                                                            />
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
                                                                        className="flex-1 p-1 text-xs border border-gray-300 rounded-md text-center"
                                                                    >
                                                                        <option value="">Seleccionar producto</option>
                                                                        {getFilteredProducts(editValues.orderType, productSearchFilter).map(product => (
                                                                            <option key={product} value={product}>
                                                                                {product}
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                    <Input
                                                                        type="number"
                                                                        value={item.options?.[0]?.quantity || 1}
                                                                        onChange={e => {
                                                                            const quantity = parseInt(e.target.value) || 0;

                                                                            if (quantity <= 0) {
                                                                                // Eliminar el item si la cantidad es 0 o menor
                                                                                const newItems = editValues.items.filter((_: any, i: number) => i !== index);
                                                                                handleChange('items', newItems);
                                                                            } else {
                                                                                // Actualizar la cantidad
                                                                                const newItems = [...editValues.items];
                                                                                newItems[index] = {
                                                                                    ...newItems[index],
                                                                                    options: [{
                                                                                        ...newItems[index].options?.[0],
                                                                                        quantity: quantity
                                                                                    }]
                                                                                };
                                                                                handleChange('items', newItems);
                                                                            }
                                                                        }}
                                                                        className="w-12 p-1 text-xs text-center"
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
                                            if (cell.column.id === 'deliveryDay' || cell.column.id === 'fecha') {
                                                const bgColor = getDateCellBackgroundColor(editValues.deliveryDay || '');
                                                return (
                                                    <TableCell key={cell.id} className={`px-0 py-1 border-r border-border ${bgColor}`}>
                                                        <Popover>
                                                            <PopoverTrigger asChild>
                                                                <Input
                                                                    readOnly
                                                                    value={editValues.deliveryDay ? format(new Date(editValues.deliveryDay), 'dd/MM/yyyy') : ''}
                                                                    placeholder="Seleccionar fecha"
                                                                    className="w-full text-xs text-center"
                                                                />
                                                            </PopoverTrigger>
                                                            <PopoverContent className="w-auto p-0">
                                                                <Calendar
                                                                    mode="single"
                                                                    selected={editValues.deliveryDay ? new Date(editValues.deliveryDay) : undefined}
                                                                    onSelect={(date) => {
                                                                        if (date) {
                                                                            handleChange('deliveryDay', date.toISOString());
                                                                        }
                                                                    }}
                                                                    locale={es}
                                                                    initialFocus
                                                                />
                                                            </PopoverContent>
                                                        </Popover>
                                                    </TableCell>
                                                );
                                            }
                                        }
                                        // Aplicar color de fondo para la celda de fecha
                                        let dateBgColor = '';
                                        if (cell.column.id === 'deliveryDay' || cell.column.id === 'fecha') {
                                            const deliveryDay = (row.original as any).deliveryDay;
                                            dateBgColor = getDateCellBackgroundColor(deliveryDay);
                                        }

                                        // Aplicar color de fondo para la celda de estado
                                        let statusBgColor = '';
                                        if (cell.column.id === 'status') {
                                            const status = (row.original as any).status;
                                            const paymentMethod = (row.original as any).paymentMethod;
                                            statusBgColor = getStatusCellBackgroundColor(status, paymentMethod);
                                        }

                                        return (
                                            <TableCell
                                                key={cell.id}
                                                className={`px-0 py-1 border-r border-border ${extraClass} ${dateBgColor} ${statusBgColor} text-center${dateBgColor ? ' force-dark-black' : ''}`}
                                                style={{
                                                    width: index === 0 ? '80px' :  // Tipo Cliente
                                                        index === 1 ? '70px' : // Fecha (antes Día Entrega)
                                                            index === 2 ? '100px' : // Rango Horario
                                                                index === 3 ? '110px' : // Notas Cliente
                                                                    index === 4 ? '130px' : // Cliente
                                                                        index === 5 ? '140px' : // Dirección
                                                                            index === 6 ? '100px' : // Teléfono
                                                                                index === 7 ? '220px' : // Items
                                                                                    index === 8 ? '100px' : // Medio de pago
                                                                                        index === 9 ? '85px' : // Estado
                                                                                            index === 10 ? '100px' :// Total
                                                                                                index === 11 ? '150px' : // Notas
                                                                                                    index === 12 ? '180px' : // Mail
                                                                                                        '150px'
                                                }}
                                            >
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </TableCell>
                                        );
                                    })}
                                    {/* Botón de acción */}
                                    <TableCell className="px-0 py-1 border-r border-border">
                                        {editingRowId === row.id ? (
                                            <div className="flex gap-2 justify-center">
                                                <Button size="icon" variant="default" onClick={() => handleSave(row)} disabled={loading}><Save className="w-4 h-4" /></Button>
                                                <Button size="icon" variant="outline" onClick={handleCancel} disabled={loading}><X className="w-4 h-4" /></Button>
                                            </div>
                                        ) : (
                                            <div className="flex gap-2 justify-center">
                                                <Button size="icon" variant="outline" onClick={() => handleEditClick(row)}><Pencil className="w-4 h-4" /></Button>
                                                <Button size="icon" variant="destructive" onClick={() => handleDelete(row)} disabled={loading}><Trash2 className="w-4 h-4" /></Button>
                                            </div>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length + 2} className="h-24 text-center">
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