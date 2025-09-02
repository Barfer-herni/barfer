'use client';

import { useState, useCallback, useTransition, useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { Input } from '@repo/design-system/components/ui/input';
import { Button } from '@repo/design-system/components/ui/button';
import { updateOrderAction, deleteOrderAction, createOrderAction, updateOrdersStatusBulkAction, undoLastChangeAction, getBackupsCountAction, clearAllBackupsAction } from '../actions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@repo/design-system/components/ui/dialog';
import { Label } from '@repo/design-system/components/ui/label';
import { Textarea } from '@repo/design-system/components/ui/textarea';
import { DateRangeFilter } from './DateRangeFilter';
import { OrderTypeFilter } from './OrderTypeFilter';
import { MayoristaSearch } from './MayoristaSearch';
import { exportOrdersAction } from '../exportOrdersAction';
import { Calendar } from '@repo/design-system/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@repo/design-system/components/ui/popover';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { RotateCcw, Trash2, Search } from 'lucide-react';
import type { MayoristaOrder } from '@repo/data-services/src/types/barfer';

// Imports de constantes y helpers
import { STATUS_OPTIONS, PAYMENT_METHOD_OPTIONS, ORDER_TYPE_OPTIONS } from '../constants';
import {
    getProductsByClientType,
    getFilteredProducts,
    createDefaultOrderData,
    filterValidItems,
    buildExportFileName,
    downloadBase64File,
    createLocalDate,
    createLocalDateISO,
    extractWeightFromProductName,
    extractBaseProductName,
    processSingleItem,
    mapDBProductToSelectOption,
    normalizeScheduleTime,
    mapSelectOptionToDBFormat
} from '../helpers';
import type { DataTableProps } from '../types';
import { OrdersTable } from './OrdersTable';

export function OrdersDataTable<TData extends { _id: string }, TValue>({
    columns,
    data,
    pageCount,
    total,
    pagination,
    sorting,
    canEdit = false,
    canDelete = false,
}: DataTableProps<TData, TValue>) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Estado local simplificado
    const [editingRowId, setEditingRowId] = useState<string | null>(null);
    const [editValues, setEditValues] = useState<any>({});
    const [loading, setLoading] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createFormData, setCreateFormData] = useState(createDefaultOrderData());
    const [isExporting, setIsExporting] = useState(false);
    const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
    const [productSearchFilter, setProductSearchFilter] = useState('');
    const [searchInput, setSearchInput] = useState(searchParams.get('search') ?? '');
    const [isPending, startTransition] = useTransition();
    const [backupsCount, setBackupsCount] = useState(0);
    const [selectedMayorista, setSelectedMayorista] = useState<MayoristaOrder | null>(null);




    // Funciones de navegación optimizadas
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

    const navigateToSorting = useCallback((newSorting: any) => {
        startTransition(() => {
            const params = new URLSearchParams(searchParams);
            if (newSorting.length > 0) {
                params.set('sort', `${newSorting[0].id}.${newSorting[0].desc ? 'desc' : 'asc'}`);
            } else {
                params.delete('sort');
            }
            router.push(`${pathname}?${params.toString()}`);
        });
    }, [pathname, router, searchParams]);

    // Debounced search con useCallback
    const debouncedSearch = useCallback(
        (() => {
            let timeoutId: NodeJS.Timeout;
            return (value: string) => {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => {
                    navigateToSearch(value);
                }, 500);
            };
        })(),
        [navigateToSearch]
    );

    // Función para manejar cambios en el filtro de búsqueda
    const handleSearchChange = useCallback((value: string) => {
        setSearchInput(value);
        // Ya no usamos debounce, solo actualizamos el estado local
    }, []);

    // Función para manejar la búsqueda cuando se presiona Enter
    const handleSearchSubmit = useCallback((value: string) => {
        navigateToSearch(value);
    }, [navigateToSearch]);

    // Función para manejar la tecla Enter en el input
    const handleSearchKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            handleSearchSubmit(searchInput);
        }
    }, [searchInput, handleSearchSubmit]);

    const handleEditClick = (row: any) => {
        setEditingRowId(row.id);
        setProductSearchFilter('');
        const editValuesData = {
            notes: row.original.notes !== undefined && row.original.notes !== null ? row.original.notes : '',
            notesOwn: row.original.notesOwn !== undefined && row.original.notesOwn !== null ? row.original.notesOwn : '',
            status: row.original.status || '',
            orderType: row.original.orderType || 'minorista',
            address: {
                reference: row.original.address?.reference || '',
                floorNumber: row.original.address?.floorNumber || '',
                departmentNumber: row.original.address?.departmentNumber || '',
                betweenStreets: row.original.address?.betweenStreets || '',
                address: row.original.address?.address || '',
                city: row.original.address?.city || '',
                phone: row.original.address?.phone || '',
            },
            city: row.original.address?.city || '',
            phone: row.original.address?.phone || '',
            paymentMethod: row.original.paymentMethod || '',
            userName: row.original.user?.name || '',
            userLastName: row.original.user?.lastName || '',
            userEmail: row.original.user?.email || '',
            total: row.original.total || 0,
            subTotal: row.original.subTotal || 0,
            shippingPrice: row.original.shippingPrice || 0,
            deliveryAreaSchedule: normalizeScheduleTime(row.original.deliveryArea?.schedule || ''),
            items: (row.original.items || []).map((item: any) => {
                // Si el item no tiene fullName, generarlo desde el formato de la DB
                if (!item.fullName) {
                    const selectOption = mapDBProductToSelectOption(
                        item.name || '',
                        item.options?.[0]?.name || ''
                    );
                    return {
                        ...item,
                        fullName: selectOption
                    };
                }
                return item;
            }),
            deliveryDay: row.original.deliveryDay || '',
        };

        setEditValues(editValuesData);
    };

    const handleCancel = () => {
        setEditingRowId(null);
        setEditValues({});
        setProductSearchFilter('');
    };

    const handleChange = (field: string, value: any) => {
        setEditValues((prev: any) => {
            // Verificar si el campo es 'address' y es un objeto
            if (field === 'address' && typeof value === 'object' && value !== null) {
                return {
                    ...prev,
                    [field]: {
                        ...prev.address, // Preserve existing address properties
                        ...value         // Merge in new properties
                    }
                };
            }

            // Para otros campos, usar el comportamiento normal
            return { ...prev, [field]: value };
        });
    };

    const handleSave = async (row: any) => {
        setLoading(true);
        try {
            // Validar que la fecha de entrega sea obligatoria
            if (!editValues.deliveryDay || editValues.deliveryDay === '') {
                alert('El campo Fecha de Entrega es obligatorio. Debe seleccionar una fecha.');
                setLoading(false);
                return;
            }

            // Filtrar items: eliminar los que no tienen nombre o tienen cantidad 0
            const filteredItems = filterValidItems(editValues.items);

            // Procesar items para convertir fullName de vuelta al formato de la DB
            const processedItems = filteredItems.map(item => {
                // Si el item tiene fullName (opción del select), convertirlo al formato de la DB
                if (item.fullName && item.fullName !== item.name) {
                    const dbFormat = mapSelectOptionToDBFormat(item.fullName);
                    return {
                        ...item,
                        id: dbFormat.name,
                        name: dbFormat.name,
                        options: [{
                            ...item.options?.[0],
                            name: dbFormat.option
                        }]
                    };
                }
                // Si no tiene fullName o es igual al name, mantener como está
                return item;
            });

            const updateData = {
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
                    address: editValues.address.address,
                    city: editValues.address.city,
                    phone: editValues.address.phone,
                    reference: editValues.address.reference,
                    floorNumber: editValues.address.floorNumber,
                    departmentNumber: editValues.address.departmentNumber,
                    betweenStreets: editValues.address.betweenStreets,
                },
                user: {
                    ...row.original.user,
                    name: editValues.userName,
                    lastName: editValues.userLastName,
                    email: editValues.userEmail,
                },
                deliveryArea: {
                    ...row.original.deliveryArea,
                    schedule: normalizeScheduleTime(editValues.deliveryAreaSchedule),
                },
                items: processedItems,
                deliveryDay: editValues.deliveryDay,
            };

            const result = await updateOrderAction(row.id, updateData);
            if (!result.success) throw new Error(result.error || 'Error al guardar');

            setEditingRowId(null);
            setEditValues({});
            setProductSearchFilter('');

            // Hacer refresh para mostrar los cambios actualizados
            router.refresh();

            updateBackupsCount(); // Actualizar contador después de guardar
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
            updateBackupsCount(); // Actualizar contador después de eliminar
        } catch (e) {
            alert(e instanceof Error ? e.message : 'Error al eliminar la orden');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateOrder = async () => {
        setLoading(true);
        try {
            // Validar que el total sea obligatorio
            if (createFormData.total === '' || createFormData.total === null || createFormData.total === undefined) {
                alert('El campo Total es obligatorio. Debe ingresar un valor.');
                setLoading(false);
                return;
            }

            // Validar que el total sea un número válido
            const totalValue = Number(createFormData.total);
            if (isNaN(totalValue) || totalValue < 0) {
                alert('El campo Total debe ser un número válido mayor o igual a 0.');
                setLoading(false);
                return;
            }

            // Validar que la fecha de entrega sea obligatoria
            if (!createFormData.deliveryDay || createFormData.deliveryDay === '') {
                alert('El campo Fecha de Entrega es obligatorio. Debe seleccionar una fecha.');
                setLoading(false);
                return;
            }

            // Filtrar items: eliminar los que no tienen nombre o tienen cantidad 0
            const filteredItems = filterValidItems(createFormData.items);

            // Procesar items para convertir fullName de vuelta al formato de la DB
            const processedItems = filteredItems.map(item => {
                // Si el item tiene fullName (opción del select), convertirlo al formato de la DB
                if (item.fullName && item.fullName !== item.name) {
                    const dbFormat = mapSelectOptionToDBFormat(item.fullName);
                    return {
                        ...item,
                        id: dbFormat.name,
                        name: dbFormat.name,
                        options: [{
                            ...item.options?.[0],
                            name: dbFormat.option
                        }]
                    };
                }
                // Si no tiene fullName o es igual al name, mantener como está
                return item;
            });

            const orderDataWithFilteredItems = {
                ...createFormData,
                total: totalValue, // Asegurar que sea un número
                items: processedItems,
                deliveryArea: {
                    ...createFormData.deliveryArea,
                    schedule: normalizeScheduleTime(createFormData.deliveryArea.schedule)
                }
            };

            const result = await createOrderAction(orderDataWithFilteredItems);
            if (!result.success) throw new Error(result.error || 'Error al crear');
            setShowCreateModal(false);
            setCreateFormData(createDefaultOrderData());
            setSelectedMayorista(null); // Limpiar mayorista seleccionado
            router.refresh();
        } catch (e) {
            alert(e instanceof Error ? e.message : 'Error al crear la orden');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateFormChange = (field: string, value: any) => {
        // Si se está cambiando el tipo de orden, limpiar el mayorista seleccionado
        if (field === 'orderType' && value === 'minorista') {
            setSelectedMayorista(null);
        }

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

                return newData;
            });
        } else {
            setCreateFormData(prev => ({ ...prev, [field]: value }));
        }
    };

    // Función para autocompletar campos cuando se selecciona un mayorista
    const handleMayoristaSelect = (mayorista: MayoristaOrder | null) => {
        setSelectedMayorista(mayorista);

        if (mayorista) {
            // Autocompletar todos los campos con la información del mayorista
            setCreateFormData(prev => {
                const updatedData = { ...prev };

                // Autocompletar usuario
                updatedData.user.name = mayorista.user.name || '';
                updatedData.user.lastName = mayorista.user.lastName || '';
                updatedData.user.email = mayorista.user.email || '';

                // Autocompletar dirección
                updatedData.address.address = mayorista.address.address || '';
                updatedData.address.city = mayorista.address.city || '';
                updatedData.address.phone = mayorista.address.phone || '';
                updatedData.address.betweenStreets = mayorista.address.betweenStreets || '';
                updatedData.address.floorNumber = mayorista.address.floorNumber || '';
                updatedData.address.departmentNumber = mayorista.address.departmentNumber || '';

                // Autocompletar campos adicionales
                updatedData.total = mayorista.total?.toString() || '0';
                updatedData.subTotal = mayorista.subTotal || 0;
                updatedData.shippingPrice = mayorista.shippingPrice || 0;
                updatedData.paymentMethod = mayorista.paymentMethod || '';
                updatedData.notes = mayorista.notes || '';
                updatedData.notesOwn = mayorista.notesOwn || '';

                // Autocompletar área de entrega
                if (mayorista.deliveryArea) {
                    updatedData.deliveryArea.schedule = normalizeScheduleTime(mayorista.deliveryArea.schedule || '');
                    updatedData.deliveryArea.description = mayorista.deliveryArea.description || '';
                    (updatedData.deliveryArea as any).coordinates = mayorista.deliveryArea.coordinates || [];
                    updatedData.deliveryArea.orderCutOffHour = mayorista.deliveryArea.orderCutOffHour || 18;
                    updatedData.deliveryArea.enabled = mayorista.deliveryArea.enabled || true;
                    updatedData.deliveryArea.sameDayDelivery = mayorista.deliveryArea.sameDayDelivery || false;
                    (updatedData.deliveryArea as any).sameDayDeliveryDays = mayorista.deliveryArea.sameDayDeliveryDays || [];
                    updatedData.deliveryArea.whatsappNumber = mayorista.deliveryArea.whatsappNumber || '';
                    updatedData.deliveryArea.sheetName = mayorista.deliveryArea.sheetName || '';
                }

                // Autocompletar items
                if (mayorista.items && mayorista.items.length > 0) {
                    updatedData.items = mayorista.items.map(item => {
                        // Mapear el producto de la DB hacia la opción del select
                        const selectOption = mapDBProductToSelectOption(
                            item.name || '',
                            item.options?.[0]?.name || ''
                        );

                        return {
                            id: item.id || '',
                            name: item.name || '',
                            fullName: selectOption, // Usar la opción mapeada del select
                            description: item.description || '',
                            images: [],
                            options: item.options?.map(option => ({
                                name: option.name || '',
                                price: option.price || 0,
                                quantity: (option as any).quantity || 1,
                            })) || [{ name: 'Default', price: 0, quantity: 1 }],
                            price: item.price || 0,
                            salesCount: item.salesCount || 0,
                            discountApllied: item.discountApllied || 0,
                        };
                    });
                }

                // Mantener el orderType como 'mayorista'
                updatedData.orderType = 'mayorista' as const;

                return updatedData;
            });
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
                const fileName = buildExportFileName(from || undefined, to || undefined);
                downloadBase64File(result.data, fileName);
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

    // Función para deshacer el último cambio
    const handleUndo = async () => {
        setLoading(true);
        try {
            const result = await undoLastChangeAction();
            if (!result.success) {
                alert(result.error || 'No hay cambios para deshacer');
                return;
            }

            router.refresh();
            updateBackupsCount(); // Actualizar contador después de deshacer
            alert('Cambio deshecho correctamente');
        } catch (e) {
            alert(e instanceof Error ? e.message : 'Error al deshacer el cambio');
        } finally {
            setLoading(false);
        }
    };

    // Función para obtener la cantidad de backups
    const updateBackupsCount = async () => {
        try {
            const result = await getBackupsCountAction();
            if (result.success && result.count !== undefined) {
                setBackupsCount(result.count);
            }
        } catch (error) {
            console.error('Error getting backups count:', error);
        }
    };

    // Función para limpiar todos los backups
    const handleClearHistory = async () => {
        if (!confirm('¿Estás seguro de que quieres limpiar todo el historial de cambios? Esta acción no se puede deshacer.')) {
            return;
        }

        setLoading(true);
        try {
            const result = await clearAllBackupsAction();
            if (!result.success) {
                alert(result.error || 'Error al limpiar el historial');
                return;
            }

            setBackupsCount(0);
            alert('Historial de cambios limpiado correctamente');
        } catch (e) {
            alert(e instanceof Error ? e.message : 'Error al limpiar el historial');
        } finally {
            setLoading(false);
        }
    };

    // Actualizar contador de backups al cargar
    useEffect(() => {
        updateBackupsCount();
    }, []);

    return (
        <div>
            <div className="flex flex-col gap-4 py-4">
                <div className="flex items-center gap-4 flex-wrap">
                    <div className="relative max-w-sm">
                        <Input
                            placeholder="Buscar en todas las columnas (presiona Enter)..."
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

                    {/* Botón de Deshacer */}
                    {backupsCount > 0 && (
                        <Button
                            onClick={handleUndo}
                            disabled={loading}
                            variant="outline"
                            className="text-blue-600 hover:text-blue-700 border-blue-600"
                        >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Deshacer último cambio ({backupsCount})
                        </Button>
                    )}

                    {/* Botón de Limpiar Historial */}
                    {backupsCount > 0 && (
                        <Button
                            onClick={handleClearHistory}
                            disabled={loading}
                            variant="outline"
                            className="text-red-600 hover:text-red-700 border-red-600"
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Limpiar historial
                        </Button>
                    )}

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
                                        {PAYMENT_METHOD_OPTIONS.map(option => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Estado</Label>
                                    <select
                                        value={createFormData.status}
                                        onChange={(e) => handleCreateFormChange('status', e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded-md"
                                    >
                                        {STATUS_OPTIONS.map(option => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Tipo de Cliente</Label>
                                    <select
                                        value={createFormData.orderType}
                                        onChange={(e) => handleCreateFormChange('orderType', e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded-md"
                                    >
                                        {ORDER_TYPE_OPTIONS.map(option => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Búsqueda de mayorista existente - solo mostrar cuando sea mayorista */}
                                {createFormData.orderType === 'mayorista' && (
                                    <div className="space-y-2 col-span-2">
                                        <MayoristaSearch
                                            onMayoristaSelect={handleMayoristaSelect}
                                            disabled={loading}
                                        />

                                        {/* Indicador de mayorista seleccionado */}
                                        {selectedMayorista && (
                                            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                                                <div className="text-sm text-green-800">
                                                    <div className="font-medium">
                                                        ✅ Mayorista seleccionado: {selectedMayorista.user.name} {selectedMayorista.user.lastName}
                                                    </div>
                                                    <div className="text-xs mt-1 text-green-600">
                                                        Los campos de cliente y dirección se han autocompletado.
                                                        Puedes modificar cualquier campo si es necesario.
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <Label>Rango Horario</Label>
                                    <Input
                                        value={createFormData.deliveryArea.schedule}
                                        onChange={(e) => {
                                            // No normalizar en tiempo real, solo guardar el valor tal como lo escribe el usuario
                                            handleCreateFormChange('deliveryArea.schedule', e.target.value);
                                        }}
                                        placeholder="Ej: De 18 a 19:30hs aprox (acepta . o :)"
                                    />
                                    <p className="text-xs text-gray-500">
                                        Puedes usar . o : para minutos (ej: 18.30 o 18:30). Se normalizará automáticamente al guardar.
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <Label>Total *</Label>
                                    <Input
                                        type="number"
                                        value={createFormData.total === '' ? '' : createFormData.total}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            if (value === '') {
                                                handleCreateFormChange('total', '');
                                            } else {
                                                const numValue = Number(value);
                                                if (!isNaN(numValue)) {
                                                    handleCreateFormChange('total', numValue);
                                                }
                                            }
                                        }}
                                        placeholder="Ingrese el total"
                                        required
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
                                    <Label className="flex items-center gap-1">
                                        Fecha de Entrega
                                        <span className="text-red-500">*</span>
                                    </Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Input
                                                readOnly
                                                value={createFormData.deliveryDay ? (() => {
                                                    // Usar la función helper para crear una fecha local
                                                    const date = createLocalDate(createFormData.deliveryDay);
                                                    return format(date, 'PPP', { locale: es });
                                                })() : ''}
                                                placeholder="Seleccionar fecha"
                                                className={!createFormData.deliveryDay ? "border-red-500 focus:border-red-500" : ""}
                                            />
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar
                                                mode="single"
                                                selected={createFormData.deliveryDay ? (() => {
                                                    // Usar la función helper para crear una fecha local
                                                    return createLocalDate(createFormData.deliveryDay);
                                                })() : undefined}
                                                onSelect={(date) => {
                                                    if (date) {
                                                        // Usar la función helper para crear una fecha ISO local
                                                        handleCreateFormChange('deliveryDay', createLocalDateISO(date));
                                                    }
                                                }}
                                                locale={es}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    {!createFormData.deliveryDay && (
                                        <p className="text-sm text-red-500">
                                            La fecha de entrega es obligatoria
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-2 col-span-2">
                                    <Label>Items</Label>
                                    <div className="space-y-2">
                                        {createFormData.items?.map((item: any, index: number) => (
                                            <div key={index} className="flex gap-2">
                                                <select
                                                    value={item.fullName || item.name || ''}
                                                    onChange={(e) => {
                                                        const newItems = [...createFormData.items];
                                                        const selectedProductName = e.target.value;

                                                        // Crear un item temporal para procesar
                                                        const tempItem = {
                                                            ...newItems[index],
                                                            name: selectedProductName,
                                                            fullName: selectedProductName
                                                        };

                                                        // Procesar solo este item
                                                        const processedItem = processSingleItem(tempItem);
                                                        newItems[index] = processedItem;

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

                                                            // Preservar las opciones existentes del item
                                                            const existingOptions = newItems[index].options || [];
                                                            const firstOption = existingOptions[0] || { name: 'Default', price: 0, quantity: 1 };

                                                            newItems[index] = {
                                                                ...newItems[index],
                                                                options: [{
                                                                    ...firstOption,
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
                                                    fullName: '',
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
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        setSelectedMayorista(null); // Limpiar mayorista seleccionado
                                    }}
                                >
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
                                const result = await updateOrdersStatusBulkAction(selectedIds, 'confirmed');
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
            <OrdersTable
                columns={columns}
                data={data}
                pageCount={pageCount}
                total={total}
                pagination={pagination}
                sorting={sorting}
                editingRowId={editingRowId}
                editValues={editValues}
                loading={loading}
                rowSelection={rowSelection}
                productSearchFilter={productSearchFilter}
                canEdit={canEdit}
                canDelete={canDelete}
                onEditClick={handleEditClick}
                onCancel={handleCancel}
                onSave={handleSave}
                onDelete={handleDelete}
                onEditValueChange={handleChange}
                onRowSelectionChange={setRowSelection}
                onProductSearchChange={setProductSearchFilter}
                onPaginationChange={navigateToPagination}
                onSortingChange={navigateToSorting}
            />
        </div>
    );
} 