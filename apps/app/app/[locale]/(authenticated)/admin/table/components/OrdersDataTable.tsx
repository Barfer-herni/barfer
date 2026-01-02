'use client';

import { useState, useCallback, useTransition, useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { Input } from '@repo/design-system/components/ui/input';
import { Button } from '@repo/design-system/components/ui/button';
import { updateOrderAction, deleteOrderAction, createOrderAction, updateOrdersStatusBulkAction, undoLastChangeAction, getBackupsCountAction, clearAllBackupsAction, calculatePriceAction, duplicateOrderAction } from '../actions';
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
import { RotateCcw, Trash2, Search, Download } from 'lucide-react';
import { generateMayoristaPDF } from '../generateMayoristaPDF';

// Imports de constantes y helpers
import { STATUS_OPTIONS, PAYMENT_METHOD_OPTIONS, ORDER_TYPE_OPTIONS } from '../constants';
import {
    getProductsByClientType,
    getProductsFromDatabase,
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
    onOrderUpdated,
    fontSize = 'text-xs',
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
    const [selectedMayorista, setSelectedMayorista] = useState<any>(null);
    const [isCalculatingPrice, setIsCalculatingPrice] = useState(false);
    const [shouldAutoCalculatePrice, setShouldAutoCalculatePrice] = useState(false);
    const [availableProducts, setAvailableProducts] = useState<string[]>([]);
    const [productsWithDetails, setProductsWithDetails] = useState<Array<{
        section: string;
        product: string;
        weight: string | null;
        formattedName: string;
    }>>([]);
    const [productsLoading, setProductsLoading] = useState(true);
    const [itemPrices, setItemPrices] = useState<Array<{
        name: string;
        weight: string;
        unitPrice: number;
        quantity: number;
        subtotal: number;
    }>>([]);
    const [puntosEnvio, setPuntosEnvio] = useState<Array<{ _id: string; nombre: string }>>([]);

    // Cargar puntos de envío al montar el componente
    useEffect(() => {
        const loadPuntosEnvio = async () => {
            try {
                const { getAllPuntosEnvioAction } = await import('../../express/actions');
                const result = await getAllPuntosEnvioAction();
                if (result.success && result.puntosEnvio) {
                    setPuntosEnvio(result.puntosEnvio.map(p => ({ _id: String(p._id), nombre: p.nombre })));
                }
            } catch (error) {
                console.error('Error loading puntos de envío:', error);
            }
        };
        loadPuntosEnvio();
    }, []);

    // useEffect para calcular precio automáticamente en el formulario de creación
    useEffect(() => {
        const validItems = filterValidItems(createFormData.items);
        if (validItems.length > 0 && createFormData.orderType && createFormData.paymentMethod && !isCalculatingPrice) {
            const timeoutId = setTimeout(() => {
                calculateAutomaticPrice();
            }, 300); // Debounce de 300ms para evitar cálculos excesivos

            return () => clearTimeout(timeoutId);
        } else if (validItems.length === 0 && createFormData.total !== '') {
            // Si no hay items válidos, resetear el total a 0
            setCreateFormData(prev => ({
                ...prev,
                total: ''
            }));
        }
    }, [createFormData.items, createFormData.orderType, createFormData.paymentMethod]);

    // useEffect para calcular precio automáticamente en la edición inline
    useEffect(() => {
        if (editingRowId && shouldAutoCalculatePrice) {
            const validItems = filterValidItems(editValues.items || []);

            if (validItems.length > 0 && editValues.orderType && editValues.paymentMethod && !isCalculatingPrice) {
                const timeoutId = setTimeout(() => {
                    calculateInlinePrice();
                }, 300); // Debounce de 300ms para evitar cálculos excesivos

                return () => {
                    clearTimeout(timeoutId);
                };
            } else if (validItems.length === 0 && editValues.total !== 0) {
                // Si no hay items válidos, resetear el total a 0
                handleChange('total', 0);
            }
        }
    }, [editValues.items, editValues.orderType, editValues.paymentMethod, editingRowId, shouldAutoCalculatePrice]);




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

        // Si el campo está vacío, ejecutar la búsqueda automáticamente para mostrar todos los resultados
        if (value.trim() === '') {
            navigateToSearch('');
        }
    }, [navigateToSearch]);

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

    const handleEditClick = async (row: any) => {
        setEditingRowId(row.id);
        setProductSearchFilter('');
        setShouldAutoCalculatePrice(false); // No calcular automáticamente al inicio

        const orderType = row.original.orderType || 'minorista';

        // Cargar productos inmediatamente para este tipo de orden
        setProductsLoading(true);
        try {
            const result = await getProductsFromDatabase(orderType);
            setAvailableProducts(result.products);
            setProductsWithDetails(result.productsWithDetails);
        } catch (error) {
            console.error('Error cargando productos:', error);
            const fallbackProducts = getProductsByClientType(orderType);
            setAvailableProducts(fallbackProducts);
            setProductsWithDetails(fallbackProducts.map(product => ({
                section: '',
                product: product,
                weight: null,
                formattedName: product
            })));
        } finally {
            setProductsLoading(false);
        }

        const editValuesData = {
            notes: row.original.notes !== undefined && row.original.notes !== null ? row.original.notes : '',
            notesOwn: row.original.notesOwn !== undefined && row.original.notesOwn !== null ? row.original.notesOwn : '',
            status: row.original.status || '',
            orderType: orderType,
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
            items: (row.original.items || []).map((item: any, index: number) => {
                console.log(`🔍 [DEBUG] Procesando item ${index} para edición:`, {
                    item,
                    hasFullName: !!item.fullName,
                    timestamp: new Date().toISOString()
                });

                // Si el item no tiene fullName, generarlo desde el formato de la DB
                if (!item.fullName) {
                    console.log(`🔍 [DEBUG] Generando fullName para item ${index}:`, {
                        name: `"${item.name || ''}"`,
                        option: `"${item.options?.[0]?.name || ''}"`
                    });

                    const selectOption = mapDBProductToSelectOption(
                        item.name || '',
                        item.options?.[0]?.name || ''
                    );

                    console.log(`✅ [DEBUG] fullName generado para item ${index}:`, {
                        originalName: `"${item.name || ''}"`,
                        originalOption: `"${item.options?.[0]?.name || ''}"`,
                        generatedFullName: `"${selectOption}"`,
                        timestamp: new Date().toISOString()
                    });

                    return {
                        ...item,
                        fullName: selectOption
                    };
                }

                console.log(`✅ [DEBUG] Item ${index} ya tiene fullName:`, {
                    name: `"${item.name}"`,
                    fullName: `"${item.fullName}"`,
                    timestamp: new Date().toISOString()
                });

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
        setShouldAutoCalculatePrice(false);
    };

    const handleChange = (field: string, value: any) => {
        // Activar cálculo automático si se modifican campos relevantes
        if (field === 'items' || field === 'orderType' || field === 'paymentMethod') {
            setShouldAutoCalculatePrice(true);
        }

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

    // Función para calcular precio automáticamente en edición inline
    const calculateInlinePrice = async () => {
        const validItems = filterValidItems(editValues.items || []);

        if (validItems.length === 0 || !editValues.orderType || !editValues.paymentMethod) {
            return;
        }

        // Procesar items para convertir fullName de vuelta al formato de la DB
        const processedItems = validItems.map(item => {
            // Solo procesar items que fueron modificados (tienen fullName diferente a name)
            // Items no modificados ya están en formato DB correcto
            const itemToProcess = item.fullName;

            // Solo procesar si hay fullName, es diferente del name, y parece ser una opción del select
            if (itemToProcess && itemToProcess !== item.name && itemToProcess.includes(' - ')) {
                const dbFormat = mapSelectOptionToDBFormat(itemToProcess);
                return {
                    ...item,
                    id: dbFormat.name,
                    name: dbFormat.name,
                    fullName: itemToProcess, // PRESERVAR el fullName original para búsqueda en DB
                    options: [{
                        ...item.options?.[0],
                        name: dbFormat.option
                    }]
                };
            }

            // Si no es una opción del select, mantener el item tal como está
            return item;
        });

        setIsCalculatingPrice(true);
        try {
            const result = await calculatePriceAction(
                processedItems,
                editValues.orderType,
                editValues.paymentMethod
            );

            if (result.success && result.total !== undefined) {
                setEditValues((prev: any) => ({ ...prev, total: result.total! }));
            }
        } catch (error) {
            console.error('Error calculando precio automático en edición inline:', error);
        } finally {
            setIsCalculatingPrice(false);
        }
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

            console.log(`🔍 [DEBUG] GUARDADO - Items filtrados:`, {
                filteredItems,
                timestamp: new Date().toISOString()
            });

            // Procesar items para convertir fullName de vuelta al formato de la DB
            const processedItems = filteredItems.map((item, index) => {
                console.log(`🔍 [DEBUG] GUARDADO - Procesando item ${index}:`, {
                    item,
                    itemToProcess: item.fullName,
                    timestamp: new Date().toISOString()
                });

                // Solo procesar items que fueron modificados (tienen fullName diferente a name)
                // Items no modificados ya están en formato DB correcto
                const itemToProcess = item.fullName;

                // Solo procesar si hay fullName, es diferente del name, y parece ser una opción del select
                if (itemToProcess && itemToProcess !== item.name && itemToProcess.includes(' - ')) {
                    console.log(`🔄 [DEBUG] GUARDADO - Procesando item ${index} con mapSelectOptionToDBFormat:`, {
                        itemToProcess: `"${itemToProcess}"`,
                        originalName: `"${item.name}"`,
                        timestamp: new Date().toISOString()
                    });

                    const dbFormat = mapSelectOptionToDBFormat(itemToProcess);

                    const processedItem = {
                        ...item,
                        id: dbFormat.name,
                        name: dbFormat.name,
                        options: [{
                            ...item.options?.[0],
                            name: dbFormat.option
                        }]
                    };

                    console.log(`✅ [DEBUG] GUARDADO - Item ${index} procesado:`, {
                        originalItem: item,
                        dbFormat,
                        processedItem,
                        timestamp: new Date().toISOString()
                    });

                    return processedItem;
                }

                console.log(`✅ [DEBUG] GUARDADO - Item ${index} no necesita procesamiento:`, {
                    item,
                    reason: !itemToProcess ? 'no fullName' :
                        itemToProcess === item.name ? 'fullName igual a name' :
                            !itemToProcess.includes(' - ') ? 'no contiene -' : 'otro',
                    timestamp: new Date().toISOString()
                });

                // Si no es una opción del select, mantener el item tal como está
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

            console.log(`🔍 [DEBUG] GUARDADO - Datos finales a enviar al backend:`, {
                updateData,
                processedItems,
                timestamp: new Date().toISOString()
            });

            const result = await updateOrderAction(row.id, updateData);
            if (!result.success) throw new Error(result.error || 'Error al guardar');

            setEditingRowId(null);
            setEditValues({});
            setProductSearchFilter('');
            setShouldAutoCalculatePrice(false);

            // Si hay un callback personalizado para actualizar datos, llamarlo
            if (onOrderUpdated) {
                await onOrderUpdated();
            } else {
                // Para la tabla principal, forzar recarga completa
                // Usar startTransition para una actualización suave
                startTransition(() => {
                    router.refresh();
                });

                // También hacer un refresh adicional después de un pequeño delay
                // para asegurar que los datos se actualicen
                setTimeout(() => {
                    router.refresh();
                }, 500);
            }

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

            // Si hay un callback personalizado para actualizar datos, llamarlo
            if (onOrderUpdated) {
                await onOrderUpdated();
            } else {
                // Para la tabla principal, forzar recarga completa
                // Usar startTransition para una actualización suave
                startTransition(() => {
                    router.refresh();
                });

                // También hacer un refresh adicional después de un pequeño delay
                // para asegurar que los datos se actualicen
                setTimeout(() => {
                    router.refresh();
                }, 500);
            }

            updateBackupsCount(); // Actualizar contador después de eliminar
        } catch (e) {
            alert(e instanceof Error ? e.message : 'Error al eliminar la orden');
        } finally {
            setLoading(false);
        }
    };

    const handleDuplicate = async (row: any) => {
        if (!confirm('¿Estás seguro de que quieres duplicar esta orden? Se creará una nueva orden con los mismos datos marcada como "DUPLICADO".')) {
            return;
        }

        setLoading(true);
        try {
            const result = await duplicateOrderAction(row.id);
            if (!result.success) throw new Error(result.error || 'Error al duplicar');

            // Si hay un callback personalizado para actualizar datos, llamarlo
            if (onOrderUpdated) {
                await onOrderUpdated();
            } else {
                // Para la tabla principal, forzar recarga completa
                // Usar startTransition para una actualización suave
                startTransition(() => {
                    router.refresh();
                });

                // También hacer un refresh adicional después de un pequeño delay
                // para asegurar que los datos se actualicen
                setTimeout(() => {
                    router.refresh();
                }, 500);
            }

            alert(result.message || 'Pedido duplicado correctamente');
        } catch (e) {
            alert(e instanceof Error ? e.message : 'Error al duplicar la orden');
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

            // Validar que si hay punto de envío, el método de pago sea bank-transfer
            if (createFormData.puntoEnvio && createFormData.paymentMethod !== 'bank-transfer') {
                alert('Las órdenes express (con punto de envío) deben tener el método de pago "bank-transfer".');
                setLoading(false);
                return;
            }

            // Si hay punto de envío, asegurar que el método de pago sea bank-transfer
            if (createFormData.puntoEnvio) {
                createFormData.paymentMethod = 'bank-transfer';
            }

            // Filtrar items: eliminar los que no tienen nombre o tienen cantidad 0
            const filteredItems = filterValidItems(createFormData.items);

            // Procesar items para convertir fullName de vuelta al formato de la DB
            const processedItems = filteredItems.map(item => {
                // Solo procesar items que fueron modificados (tienen fullName diferente a name)
                // Items no modificados ya están en formato DB correcto
                const itemToProcess = item.fullName;

                // Solo procesar si hay fullName, es diferente del name, y parece ser una opción del select
                if (itemToProcess && itemToProcess !== item.name && itemToProcess.includes(' - ')) {
                    const dbFormat = mapSelectOptionToDBFormat(itemToProcess);
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

                // Si no es una opción del select, mantener el item tal como está
                return item;
            });

            // Construir el objeto de datos de la orden
            const orderDataWithFilteredItems: any = {
                ...createFormData,
                total: totalValue, // Asegurar que sea un número
                items: processedItems,
                deliveryArea: {
                    ...createFormData.deliveryArea,
                    schedule: normalizeScheduleTime(createFormData.deliveryArea.schedule)
                }
            };

            // Incluir el punto_de_venta si fue seleccionado (solo para mayoristas)
            const puntoVentaId = (createFormData as any).puntoVentaId;
            if (puntoVentaId) {
                orderDataWithFilteredItems.punto_de_venta = puntoVentaId;
            }

            // Incluir el puntoEnvio si el método de pago es bank-transfer
            if (createFormData.paymentMethod === 'bank-transfer' && createFormData.puntoEnvio) {
                orderDataWithFilteredItems.puntoEnvio = createFormData.puntoEnvio;
            }

            console.log('📦 Datos de orden a enviar:', {
                orderType: orderDataWithFilteredItems.orderType,
                punto_de_venta: orderDataWithFilteredItems.punto_de_venta,
                puntoVentaIdEnForm: puntoVentaId,
                hasItems: processedItems.length > 0,
                completeData: orderDataWithFilteredItems
            });

            const result = await createOrderAction(orderDataWithFilteredItems);
            if (!result.success) throw new Error(result.error || 'Error al crear');

            setShowCreateModal(false);
            setCreateFormData(createDefaultOrderData());
            setSelectedMayorista(null); // Limpiar mayorista seleccionado
            setItemPrices([]); // Limpiar precios

            // Llamar al callback si está disponible (para express)
            if (onOrderUpdated) {
                await onOrderUpdated();
            } else {
                // Para la tabla principal, forzar recarga completa
                // Usar startTransition para una actualización suave
                startTransition(() => {
                    router.refresh();
                });

                // También hacer un refresh adicional después de un pequeño delay
                // para asegurar que los datos se actualicen
                setTimeout(() => {
                    router.refresh();
                }, 500);
            }
        } catch (e) {
            alert(e instanceof Error ? e.message : 'Error al crear la orden');
        } finally {
            setLoading(false);
        }
    };

    // Función para descargar PDF de orden mayorista
    const handleDownloadPDF = async () => {
        // Validar que sea una orden mayorista
        if (createFormData.orderType !== 'mayorista') {
            alert('La descarga de PDF solo está disponible para órdenes mayoristas.');
            return;
        }

        // No es necesario validar nombre y apellido para generar el PDF

        // Validar que haya productos
        const validItems = filterValidItems(createFormData.items);
        if (validItems.length === 0) {
            alert('Debe agregar al menos un producto para generar el PDF.');
            return;
        }

        // Validar que haya un total
        if (!createFormData.total || createFormData.total === '') {
            alert('Debe especificar un total para generar el PDF.');
            return;
        }

        try {
            // Calcular precios para obtener los precios unitarios reales
            const priceResult = await calculatePriceAction(
                validItems,
                createFormData.orderType,
                createFormData.paymentMethod
            );

            if (!priceResult.success || !priceResult.itemPrices) {
                alert('Error al calcular los precios de los productos. Por favor, intente nuevamente.');
                return;
            }

            // Mapear los items con sus precios calculados
            const itemsWithPrices = validItems.map(item => {
                const itemPrice = priceResult.itemPrices!.find(ip =>
                    ip.name === item.name || ip.name === item.fullName
                );

                return {
                    ...item,
                    price: itemPrice?.unitPrice || 0,
                    options: item.options.map((option: any) => ({
                        ...option,
                        price: itemPrice?.unitPrice || 0
                    }))
                };
            });

            generateMayoristaPDF({
                user: createFormData.user,
                address: createFormData.address,
                items: itemsWithPrices,
                total: Number(createFormData.total),
                deliveryDay: createFormData.deliveryDay,
                paymentMethod: createFormData.paymentMethod,
                notes: createFormData.notes
            });
        } catch (error) {
            console.error('Error al generar PDF:', error);
            alert('Error al generar el PDF. Por favor, intente nuevamente.');
        }
    };

    // Función para calcular precio automáticamente
    const calculateAutomaticPrice = async () => {
        if (isCalculatingPrice) return; // Evitar cálculos múltiples

        const validItems = filterValidItems(createFormData.items);
        if (validItems.length === 0 || !createFormData.orderType || !createFormData.paymentMethod) {
            return;
        }

        // Procesar items para convertir fullName de vuelta al formato de la DB
        const processedItems = validItems.map(item => {
            // Solo procesar items que fueron modificados (tienen fullName diferente a name)
            // Items no modificados ya están en formato DB correcto
            const itemToProcess = item.fullName;

            // Solo procesar si hay fullName, es diferente del name, y parece ser una opción del select
            if (itemToProcess && itemToProcess !== item.name && itemToProcess.includes(' - ')) {
                const dbFormat = mapSelectOptionToDBFormat(itemToProcess);
                return {
                    ...item,
                    id: dbFormat.name,
                    name: dbFormat.name,
                    fullName: itemToProcess, // PRESERVAR el fullName original para búsqueda en DB
                    options: [{
                        ...item.options?.[0],
                        name: dbFormat.option
                    }]
                };
            }

            // Si no es una opción del select, mantener el item tal como está
            return item;
        });

        setIsCalculatingPrice(true);
        try {
            const result = await calculatePriceAction(
                processedItems,
                createFormData.orderType,
                createFormData.paymentMethod
            );

            if (result.success && result.total !== undefined) {
                setCreateFormData(prev => ({
                    ...prev,
                    total: result.total!.toString()
                }));

                // Guardar los precios unitarios para mostrar en la UI
                if (result.itemPrices) {
                    setItemPrices(result.itemPrices);
                }
            }
        } catch (error) {
            console.error('Error calculando precio automático:', error);
        } finally {
            setIsCalculatingPrice(false);
        }
    };

    const handleCreateFormChange = (field: string, value: any) => {
        // Si se está cambiando el tipo de orden, limpiar el mayorista seleccionado
        if (field === 'orderType' && value === 'minorista') {
            setSelectedMayorista(null);
        }

        // Si se están cambiando los items, limpiar los precios almacenados
        if (field === 'items') {
            setItemPrices([]);
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

    // Función para autocompletar campos cuando se selecciona un punto de venta
    const handleMayoristaSelect = (puntoVenta: any | null) => {
        setSelectedMayorista(puntoVenta);

        if (puntoVenta) {
            // Autocompletar campos desde punto de venta
            setCreateFormData(prev => {
                const updatedData = { ...prev };

                // IMPORTANTE: Guardar el _id del punto de venta
                (updatedData as any).puntoVentaId = puntoVenta._id;

                // Autocompletar con los datos del punto de venta
                // Para mayoristas, el nombre del cliente es el nombre del punto de venta
                updatedData.user.name = puntoVenta.nombre || '';
                updatedData.user.lastName = ''; // No se usa en mayoristas
                updatedData.user.email = ''; // No se usa en mayoristas

                // Autocompletar dirección desde contacto del punto de venta
                updatedData.address.address = puntoVenta.contacto?.direccion || '';
                updatedData.address.city = ''; // No se usa en mayoristas
                updatedData.address.phone = puntoVenta.contacto?.telefono || '';
                updatedData.address.betweenStreets = '';
                updatedData.address.floorNumber = '';
                updatedData.address.departmentNumber = '';

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

    // Cargar productos desde la base de datos al inicializar
    useEffect(() => {
        const loadProducts = async () => {
            setProductsLoading(true);
            try {
                const result = await getProductsFromDatabase('minorista'); // Cargar productos minoristas por defecto
                setAvailableProducts(result.products);
                setProductsWithDetails(result.productsWithDetails);
            } catch (error) {
                console.error('Error cargando productos:', error);
                // Fallback a productos hardcodeados
                const fallbackProducts = getProductsByClientType('minorista');
                setAvailableProducts(fallbackProducts);
                setProductsWithDetails(fallbackProducts.map(product => ({
                    section: '',
                    product: product,
                    weight: null,
                    formattedName: product
                })));
            } finally {
                setProductsLoading(false);
            }
        };

        loadProducts();
    }, []);

    // Actualizar productos cuando cambie el tipo de cliente en el formulario de creación
    useEffect(() => {
        const updateProducts = async () => {
            if (createFormData.orderType) {
                setProductsLoading(true);
                try {
                    const result = await getProductsFromDatabase(createFormData.orderType);
                    setAvailableProducts(result.products);
                    setProductsWithDetails(result.productsWithDetails);
                } catch (error) {
                    console.error('Error actualizando productos:', error);
                    const fallbackProducts = getProductsByClientType(createFormData.orderType);
                    setAvailableProducts(fallbackProducts);
                    setProductsWithDetails(fallbackProducts.map(product => ({
                        section: '',
                        product: product,
                        weight: null,
                        formattedName: product
                    })));
                } finally {
                    setProductsLoading(false);
                }
            }
        };

        updateProducts();
    }, [createFormData.orderType]);

    // Actualizar productos cuando cambie el tipo de cliente durante la edición
    useEffect(() => {
        const updateProductsForEdit = async () => {
            if (editValues.orderType) {
                setProductsLoading(true);
                try {
                    const result = await getProductsFromDatabase(editValues.orderType);
                    setAvailableProducts(result.products);
                    setProductsWithDetails(result.productsWithDetails);
                } catch (error) {
                    console.error('Error actualizando productos para edición:', error);
                    const fallbackProducts = getProductsByClientType(editValues.orderType);
                    setAvailableProducts(fallbackProducts);
                    setProductsWithDetails(fallbackProducts.map(product => ({
                        section: '',
                        product: product,
                        weight: null,
                        formattedName: product
                    })));
                } finally {
                    setProductsLoading(false);
                }
            }
        };

        updateProductsForEdit();
    }, [editValues.orderType]);

    // Actualizar contador de backups al cargar
    useEffect(() => {
        updateBackupsCount();
    }, []);

    return (
        <div>
            <div className="flex flex-col gap-4 py-4">
                {/* Filtros de búsqueda */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                    <div className="relative w-full sm:w-80 lg:w-96">
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
                    <div className="flex flex-col sm:flex-row gap-2">
                        <DateRangeFilter />
                        <OrderTypeFilter />
                    </div>
                </div>

                {/* Botones de acción - una fila en desktop, múltiples filas en móvil */}
                <div className="flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-4">
                    {/* En desktop: todos los botones en una fila */}
                    <div className="flex flex-col sm:flex-row lg:flex-row gap-2 lg:gap-2">
                        <Button
                            onClick={handleExport}
                            disabled={isExporting}
                            className="bg-green-600 text-white hover:bg-green-700 flex-1 sm:flex-none lg:flex-none"
                        >
                            {isExporting ? 'Exportando...' : 'Exportar a Excel'}
                        </Button>

                        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
                            <DialogTrigger asChild>
                                <Button variant="default" className="flex-1 sm:flex-none lg:flex-none">Crear Orden</Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle>Crear Nueva Orden</DialogTitle>
                                </DialogHeader>
                                <div className="grid grid-cols-2 gap-4">
                                    {/* 1. TIPO DE PEDIDO - PRIMERO DE TODO */}
                                    <div className="space-y-2 col-span-2">
                                        <Label className="text-base font-semibold">Tipo de Pedido</Label>
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
                                                            ✅ Punto de venta seleccionado: {selectedMayorista.nombre}
                                                        </div>
                                                        <div className="text-xs mt-1 text-green-600">
                                                            Los campos de dirección y contacto se han autocompletado.
                                                            Completa los datos del cliente para esta orden.
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* 2. DATOS DEL CLIENTE */}
                                    <div className="space-y-2 col-span-2">
                                        <Label className="text-base font-semibold">Datos del Cliente</Label>
                                    </div>

                                    {/* Para mayoristas: solo nombre, teléfono y dirección */}
                                    {createFormData.orderType === 'mayorista' ? (
                                        <>
                                            <div className="space-y-2 col-span-2">
                                                <Label>Nombre del Cliente</Label>
                                                <Input
                                                    value={createFormData.user.name}
                                                    onChange={(e) => handleCreateFormChange('user.name', e.target.value)}
                                                    placeholder="Nombre del cliente (ej: nombre del punto de venta)"
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
                                        </>
                                    ) : (
                                        <>
                                            {/* Para minoristas: todos los campos */}
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
                                        </>
                                    )}

                                    {/* 3. MEDIO DE PAGO Y ESTADO */}
                                    <div className="space-y-2 col-span-2 mt-4">
                                        <Label className="text-base font-semibold">Pago y Estado</Label>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Punto de Envío *</Label>
                                        <select
                                            value={createFormData.puntoEnvio || ''}
                                            onChange={(e) => {
                                                const selectedPuntoEnvio = e.target.value;
                                                handleCreateFormChange('puntoEnvio', selectedPuntoEnvio);
                                                // Si se selecciona un punto de envío, establecer automáticamente bank-transfer
                                                if (selectedPuntoEnvio) {
                                                    handleCreateFormChange('paymentMethod', 'bank-transfer');
                                                }
                                            }}
                                            className="w-full p-2 border border-gray-300 rounded-md"
                                            required
                                        >
                                            <option value="">Selecciona un punto de envío...</option>
                                            {puntosEnvio.map((punto) => (
                                                <option key={punto._id} value={punto.nombre}>
                                                    {punto.nombre}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Medio de Pago</Label>
                                        <select
                                            value={createFormData.paymentMethod || 'bank-transfer'}
                                            onChange={(e) => {
                                                const selectedPaymentMethod = e.target.value;
                                                handleCreateFormChange('paymentMethod', selectedPaymentMethod);
                                                // Si se cambia el método de pago y no es bank-transfer, limpiar punto de envío
                                                if (selectedPaymentMethod !== 'bank-transfer') {
                                                    handleCreateFormChange('puntoEnvio', '');
                                                }
                                            }}
                                            className="w-full p-2 border border-gray-300 rounded-md"
                                            disabled={!!createFormData.puntoEnvio}
                                        >
                                            {PAYMENT_METHOD_OPTIONS.map(option => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                        {createFormData.puntoEnvio && (
                                            <p className="text-xs text-gray-500">
                                                El método de pago está fijado en "bank-transfer" para órdenes express
                                            </p>
                                        )}
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

                                    {/* 4. FECHA DE ENTREGA Y RANGO HORARIO */}
                                    <div className="space-y-2 col-span-2 mt-4">
                                        <Label className="text-base font-semibold">Entrega</Label>
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
                                                        const date = createLocalDate(createFormData.deliveryDay);
                                                        return format(date, 'PPP', { locale: es });
                                                    })() : ''}
                                                    placeholder="Seleccionar fecha"
                                                    className={!createFormData.deliveryDay ? "border-red-500 focus:border-red-500" : ""}
                                                />
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0">
                                                <div className="flex flex-col">
                                                    <Calendar
                                                        mode="single"
                                                        selected={createFormData.deliveryDay ? (() => {
                                                            return createLocalDate(createFormData.deliveryDay);
                                                        })() : undefined}
                                                        onSelect={(date) => {
                                                            if (date) {
                                                                handleCreateFormChange('deliveryDay', createLocalDateISO(date));
                                                            }
                                                        }}
                                                        locale={es}
                                                        initialFocus
                                                    />
                                                    <div className="border-t p-3">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => {
                                                                const today = new Date();
                                                                handleCreateFormChange('deliveryDay', createLocalDateISO(today));
                                                            }}
                                                            className="w-full"
                                                        >
                                                            Hoy
                                                        </Button>
                                                    </div>
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                        {!createFormData.deliveryDay && (
                                            <p className="text-sm text-red-500">
                                                La fecha de entrega es obligatoria
                                            </p>
                                        )}
                                    </div>
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

                                    {/* 5. NOTAS */}
                                    <div className="space-y-2 col-span-2 mt-4">
                                        <Label className="text-base font-semibold">Notas</Label>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Notas del Cliente</Label>
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

                                    {/* 6. PRODUCTOS */}
                                    <div className="space-y-2 col-span-2 mt-4">
                                        <Label className="text-base font-semibold">Productos</Label>
                                        <div className="space-y-2">
                                            {createFormData.items?.map((item: any, index: number) => {
                                                const itemName = item.fullName || item.name;

                                                // Buscar el precio de este item
                                                const itemPrice = itemPrices.find(ip =>
                                                    ip.name === itemName
                                                );

                                                // Validar que los valores de precio sean válidos
                                                const hasValidPrice = itemPrice &&
                                                    typeof itemPrice.unitPrice === 'number' &&
                                                    !isNaN(itemPrice.unitPrice) &&
                                                    typeof itemPrice.subtotal === 'number' &&
                                                    !isNaN(itemPrice.subtotal);

                                                return (
                                                    <div key={index} className="flex flex-col gap-2">
                                                        <div className="flex gap-2">
                                                            <select
                                                                value={item.fullName || item.name || ''}
                                                                onChange={(e) => {
                                                                    const newItems = [...createFormData.items];
                                                                    const selectedProductName = e.target.value;

                                                                    // Crear un item temporal para procesar
                                                                    const tempItem = {
                                                                        ...newItems[index],
                                                                        name: selectedProductName,
                                                                        fullName: selectedProductName,
                                                                        // Resetear las options para que no contengan peso del item anterior
                                                                        options: [{ name: 'Default', price: 0, quantity: newItems[index].options?.[0]?.quantity || 1 }]
                                                                    };

                                                                    // Procesar solo este item
                                                                    const processedItem = processSingleItem(tempItem);
                                                                    newItems[index] = processedItem;

                                                                    handleCreateFormChange('items', newItems);
                                                                }}
                                                                className="flex-1 p-2 border border-gray-300 rounded-md"
                                                                disabled={productsLoading}
                                                            >
                                                                <option value="">
                                                                    {productsLoading ? 'Cargando productos...' : 'Seleccionar producto'}
                                                                </option>
                                                                {availableProducts.map(product => (
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
                                                        {/* Mostrar precio unitario y total en inputs solo si son válidos */}
                                                        {hasValidPrice && (
                                                            <div className="flex gap-2 pl-2">
                                                                <div className="flex-1">
                                                                    <Label className="text-xs text-gray-600">Precio Unitario</Label>
                                                                    <Input
                                                                        type="text"
                                                                        value={`$${itemPrice.unitPrice.toLocaleString('es-AR')}`}
                                                                        readOnly
                                                                        className="text-xs bg-gray-50 border-gray-300"
                                                                    />
                                                                </div>
                                                                <div className="flex-1">
                                                                    <Label className="text-xs text-gray-600">Subtotal</Label>
                                                                    <Input
                                                                        type="text"
                                                                        value={`$${itemPrice.subtotal.toLocaleString('es-AR')}`}
                                                                        readOnly
                                                                        className="text-xs bg-gray-50 border-gray-300"
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
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

                                    {/* 7. TOTAL A PAGAR - AL FINAL */}
                                    <div className="space-y-2 col-span-2 mt-6">
                                        <Label className="text-base font-semibold">Total a Pagar</Label>
                                    </div>

                                    <div className="space-y-2 col-span-2">
                                        <Label>Total * {isCalculatingPrice && <span className="text-blue-500">(Calculando...)</span>}</Label>
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
                                            placeholder={isCalculatingPrice ? "Calculando precio..." : "Se calcula automáticamente"}
                                            required
                                            className={isCalculatingPrice ? "bg-blue-50 text-lg font-semibold" : "text-lg font-semibold"}
                                        />
                                        <p className="text-xs text-gray-500">
                                            El precio se calcula automáticamente basado en los productos, tipo de cliente y método de pago.
                                        </p>
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
                                    {/* Botón de descargar PDF - solo para órdenes mayoristas */}
                                    {createFormData.orderType === 'mayorista' && (
                                        <Button
                                            variant="outline"
                                            onClick={handleDownloadPDF}
                                            className="flex items-center gap-2"
                                        >
                                            <Download className="h-4 w-4" />
                                            Descargar PDF
                                        </Button>
                                    )}
                                    <Button onClick={handleCreateOrder} disabled={loading}>
                                        {loading ? 'Creando...' : 'Crear Orden'}
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>

                        {/* Botones de historial (solo si hay backups) */}
                        {backupsCount > 0 && (
                            <>
                                <Button
                                    onClick={handleUndo}
                                    disabled={loading}
                                    variant="outline"
                                    className="text-blue-600 hover:text-blue-700 border-blue-600 flex-1 sm:flex-none lg:flex-none"
                                >
                                    <RotateCcw className="w-4 h-4 mr-2" />
                                    Deshacer último cambio ({backupsCount})
                                </Button>

                                <Button
                                    onClick={handleClearHistory}
                                    disabled={loading}
                                    variant="outline"
                                    className="text-red-600 hover:text-red-700 border-red-600 flex-1 sm:flex-none lg:flex-none"
                                >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Limpiar historial
                                </Button>
                            </>
                        )}

                        {/* Marcar como Entregado */}
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
                            className="flex-1 sm:flex-none lg:flex-none"
                        >
                            Marcar como Entregado
                        </Button>
                    </div>
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
                availableProducts={availableProducts}
                productsWithDetails={productsWithDetails}
                productsLoading={productsLoading}
                onEditClick={handleEditClick}
                onCancel={handleCancel}
                onSave={handleSave}
                onDelete={handleDelete}
                onDuplicate={handleDuplicate}
                onEditValueChange={handleChange}
                onRowSelectionChange={setRowSelection}
                onProductSearchChange={setProductSearchFilter}
                onPaginationChange={navigateToPagination}
                onSortingChange={navigateToSorting}
                isCalculatingPrice={isCalculatingPrice}
                fontSize={fontSize}
            />
        </div>
    );
} 