'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Dictionary } from '@repo/internationalization';
import { Button } from '@repo/design-system/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/design-system/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@repo/design-system/components/ui/select';
import { Plus, Package, ShoppingCart, BarChart3, CalendarIcon, Edit2, Save, X } from 'lucide-react';
import { Calendar } from '@repo/design-system/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@repo/design-system/components/ui/popover';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@repo/design-system/lib/utils';
import { Input } from '@repo/design-system/components/ui/input';
import { toast } from '@repo/design-system/hooks/use-toast';
import { AddStockModal } from './AddStockModal';
import { DetalleTable } from './DetalleTable';
import { CreatePuntoEnvioModal } from './CreatePuntoEnvioModal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/design-system/components/ui/tabs';
import {
    getExpressOrdersAction,
    getStockByPuntoEnvioAction,
    getDetalleEnvioByPuntoEnvioAction,
    getProductsForStockAction,
    updateStockAction,
    createStockAction,
} from '../actions';
import type { DeliveryArea, Order, Stock, DetalleEnvio, PuntoEnvio, ProductForStock } from '@repo/data-services';
import { OrdersDataTable } from '../../table/components/OrdersDataTable';
import type { ColumnDef, PaginationState, SortingState } from '@tanstack/react-table';
import { createExpressColumns } from './expressColumns';
import { ResumenGeneralTables } from './ResumenGeneralTables';

interface ExpressPageClientProps {
    dictionary: Dictionary;
    initialPuntosEnvio: PuntoEnvio[];
    canEdit: boolean;
    canDelete: boolean;
    isAdmin?: boolean;
}

export function ExpressPageClient({ dictionary, initialPuntosEnvio, canEdit, canDelete, isAdmin = true }: ExpressPageClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();

    // Obtener valores iniciales de la URL
    const initialPuntoIdFromUrl = searchParams.get('puntoId');
    const initialTabFromUrl = searchParams.get('tab') || 'orders';

    const [showAddStockModal, setShowAddStockModal] = useState(false);
    const [showCreatePuntoEnvioModal, setShowCreatePuntoEnvioModal] = useState(false);

    // Inicializar estado con valor de URL si existe
    const [selectedPuntoEnvio, setSelectedPuntoEnvio] = useState<string>(initialPuntoIdFromUrl || '');
    const [activeTab, setActiveTab] = useState<string>(initialTabFromUrl);

    const [puntosEnvio, setPuntosEnvio] = useState<PuntoEnvio[]>(initialPuntosEnvio);

    // Función auxiliar para actualizar URL
    const updateUrlParams = useCallback((param: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value) {
            params.set(param, value);
        } else {
            params.delete(param);
        }
        router.replace(`${pathname}?${params.toString()}`);
    }, [searchParams, pathname, router]);

    // Manejar cambio de punto de envío
    const handlePuntoEnvioChange = (value: string) => {
        setSelectedPuntoEnvio(value);
        updateUrlParams('puntoId', value);
    };

    // Manejar cambio de tab
    const handleTabChange = (value: string) => {
        setActiveTab(value);
        updateUrlParams('tab', value);
    };

    // Debug: verificar datos recibidos
    useEffect(() => {
        // Si hay un puntoId en la URL pero no está seleccionado en el estado (casos borde), sincronizar
        if (initialPuntoIdFromUrl && selectedPuntoEnvio !== initialPuntoIdFromUrl) {
            setSelectedPuntoEnvio(initialPuntoIdFromUrl);
        }
    }, [initialPuntoIdFromUrl]);

    // Datos de las tablas
    const [orders, setOrders] = useState<Order[]>([]);
    const [stock, setStock] = useState<Stock[]>([]);
    const [detalle, setDetalle] = useState<DetalleEnvio[]>([]);
    const [productsForStock, setProductsForStock] = useState<ProductForStock[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    // Estado local para los valores editados (sin necesidad de modo edición)
    const [localStockValues, setLocalStockValues] = useState<Record<string, { stockInicial: number; llevamos: number }>>({});
    // Ref para mantener los valores actuales del estado (para acceder sin setState)
    const localStockValuesRef = useRef<Record<string, { stockInicial: number; llevamos: number }>>({});
    // Refs para los timeouts de debounce - usar stockId como clave (no stockId-field)
    const saveTimeouts = useRef<Record<string, NodeJS.Timeout>>({});
    // Refs para flags que previenen creación duplicada
    const savingFlags = useRef<Record<string, boolean>>({});

    // Obtener parámetros de paginación y filtros de la URL para procesamiento local
    const pageFromUrl = Number(searchParams.get('page')) || 1;
    const pageSizeFromUrl = Number(searchParams.get('pageSize')) || 50; // Default a 50 como estaba antes
    const searchFromUrl = searchParams.get('search') || '';
    const fromFromUrl = searchParams.get('from');
    const toFromUrl = searchParams.get('to');
    const orderTypeFromUrl = searchParams.get('orderType');
    const sortFromUrl = searchParams.get('sort');

    // Procesar órdenes: Filtrar -> Ordenar -> Paginar
    // 1. Filtrar y Ordenar
    const filteredAndSortedOrders = useMemo(() => {
        let result = [...orders];

        // A. Filtrar por Búsqueda
        if (searchFromUrl) {
            const searchLower = searchFromUrl.toLowerCase();
            result = result.filter(order =>
                (order.user?.name || '').toLowerCase().includes(searchLower) ||
                (order.user?.lastName || '').toLowerCase().includes(searchLower) ||
                (order.user?.email || '').toLowerCase().includes(searchLower) ||
                (order.total?.toString() || '').includes(searchLower) ||
                (typeof order._id === 'string' && order._id.includes(searchLower)) ||
                (order.items || []).some((item: any) =>
                    (item.name || '').toLowerCase().includes(searchLower) ||
                    (item.fullName || '').toLowerCase().includes(searchLower)
                ) ||
                // Búsqueda por dirección
                (order.address?.address || '').toLowerCase().includes(searchLower) ||
                (order.address?.city || '').toLowerCase().includes(searchLower)
            );
        }

        // B. Filtrar por Rango de Fechas
        if (fromFromUrl || toFromUrl) {
            const fromDate = fromFromUrl ? new Date(fromFromUrl) : null;
            const toDate = toFromUrl ? new Date(toFromUrl) : null;
            // Ajustar al fin del día para 'to'
            if (toDate) toDate.setHours(23, 59, 59, 999);
            // Ajustar al inicio del día para 'from' (aunque new Date("yyyy-mm-dd") ya es inicio UTC o local depende parsing,
            // mejor asegurar y usar comparación simple de fechas)

            result = result.filter(order => {
                const orderDate = new Date(order.createdAt);
                if (fromDate && orderDate < fromDate) return false;
                if (toDate && orderDate > toDate) return false;
                return true;
            });
        }

        // C. Filtrar por Tipo de Orden
        if (orderTypeFromUrl && orderTypeFromUrl !== 'all') {
            result = result.filter(order => order.orderType === orderTypeFromUrl);
        }

        // D. Ordenar
        if (sortFromUrl) {
            const [sortId, sortDesc] = sortFromUrl.split('.');
            const isDesc = sortDesc === 'desc';

            result.sort((a: any, b: any) => {
                // Obtener valor para ordenar
                let valA = a[sortId];
                let valB = b[sortId];

                // Manejar casos especiales (objetos anidados)
                if (sortId === 'user.name') {
                    valA = `${a.user?.name || ''} ${a.user?.lastName || ''}`.trim();
                    valB = `${b.user?.name || ''} ${b.user?.lastName || ''}`.trim();
                } else if (sortId === 'total' || sortId === 'shippingPrice') {
                    valA = Number(valA || 0);
                    valB = Number(valB || 0);
                }

                // Comparación nula segura
                if (valA === valB) return 0;
                if (valA === null || valA === undefined) return 1;
                if (valB === null || valB === undefined) return -1;

                if (valA < valB) return isDesc ? 1 : -1;
                if (valA > valB) return isDesc ? -1 : 1;
                return 0;
            });
        } else {
            // Default sort: createdAt desc
            result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }

        return result;
    }, [orders, searchFromUrl, fromFromUrl, toFromUrl, orderTypeFromUrl, sortFromUrl]);

    // 2. Paginar
    const paginatedOrders = useMemo(() => {
        const startIndex = (pageFromUrl - 1) * pageSizeFromUrl;
        return filteredAndSortedOrders.slice(startIndex, startIndex + pageSizeFromUrl);
    }, [filteredAndSortedOrders, pageFromUrl, pageSizeFromUrl]);



    // Cargar productos para stock al montar el componente
    useEffect(() => {
        const loadProductsForStock = async () => {
            try {
                const result = await getProductsForStockAction();
                if (result.success && result.products) {
                    setProductsForStock(result.products);
                }
            } catch (error) {
                console.error('Error loading products for stock:', error);
            }
        };
        loadProductsForStock();
    }, []);

    const handlePuntosEnvioRefresh = async () => {
        router.refresh();
        // Recargar la lista de puntos de envío
        const { getAllPuntosEnvioAction } = await import('../actions');
        const result = await getAllPuntosEnvioAction();
        if (result.success && result.puntosEnvio) {
            setPuntosEnvio(result.puntosEnvio);
        }
    };

    // Si no es admin y hay puntos de envío, seleccionar automáticamente si no hay selección (URL o estado)
    useEffect(() => {
        if (!isAdmin && puntosEnvio.length > 0 && !selectedPuntoEnvio) {
            const firstPunto = puntosEnvio[0].nombre || '';
            handlePuntoEnvioChange(firstPunto);
        }
    }, [isAdmin, puntosEnvio, selectedPuntoEnvio]);

    // Cargar datos cuando se selecciona un punto de envío o cambia la fecha
    useEffect(() => {
        if (selectedPuntoEnvio) {
            loadTablasData(selectedPuntoEnvio);
        } else {
            setOrders([]);
            setStock([]);
            setDetalle([]);
        }
    }, [selectedPuntoEnvio, selectedDate]);

    const loadTablasData = async (puntoEnvio: string, options: { skipLocalUpdate?: boolean; silent?: boolean } = {}) => {
        const { skipLocalUpdate = false, silent = false } = options;
        if (!silent) setIsLoading(true);
        try {
            // Si es 'all', traemos todas las órdenes sin filtro de punto
            const ordersPromise = getExpressOrdersAction(puntoEnvio === 'all' ? undefined : puntoEnvio);

            // Si es 'all', no traemos stock ni detalle específico por ahora (o podríamos adaptarlo luego)
            const stockPromise = puntoEnvio === 'all' ? Promise.resolve({ success: true, stock: [] }) : getStockByPuntoEnvioAction(puntoEnvio);
            const detallePromise = puntoEnvio === 'all' ? Promise.resolve({ success: true, detalleEnvio: [] }) : getDetalleEnvioByPuntoEnvioAction(puntoEnvio);

            const [ordersResult, stockResult, detalleResult] = await Promise.all([
                ordersPromise,
                stockPromise,
                detallePromise,
            ]);

            if (ordersResult.success) {
                setOrders(ordersResult.orders || []);
            }
            if (stockResult.success && stockResult.stock) {
                setStock(stockResult.stock);
                // Inicializar valores locales con los datos del servidor
                if (!skipLocalUpdate) {
                    const initialValues: Record<string, { stockInicial: number; llevamos: number }> = {};
                    stockResult.stock.forEach(s => {
                        const key = String(s._id);
                        initialValues[key] = {
                            stockInicial: s.stockInicial,
                            llevamos: s.llevamos,
                        };
                    });
                    setLocalStockValues(initialValues);
                    localStockValuesRef.current = initialValues;
                }
            }
            if (detalleResult.success) {
                setDetalle(detalleResult.detalleEnvio || []);
            }
        } catch (error) {
            console.error('Error loading tablas data:', error);
        } finally {
            if (!silent) setIsLoading(false);
        }
    };

    // Normalizar nombre de producto para comparación (remover prefijos como "BOX PERRO", "BOX GATO", "BIG DOG")
    const normalizeProductName = useCallback((productName: string): string => {
        let normalized = (productName || '').toUpperCase().trim();
        // Remover prefijos comunes
        normalized = normalized.replace(/^BOX\s+PERRO\s+/i, '');
        normalized = normalized.replace(/^BOX\s+GATO\s+/i, '');
        normalized = normalized.replace(/^BIG\s+DOG\s+/i, '');
        // Remover peso si está en el nombre
        normalized = normalized.replace(/\s+\d+KG.*$/i, '');
        return normalized.trim();
    }, []);

    // Normalizar peso para comparación (eliminar espacios y convertir a mayúsculas)
    const normalizeWeight = useCallback((weight: string | null | undefined): string => {
        if (!weight) return '';
        return (weight || '').toUpperCase().trim().replace(/\s+/g, '');
    }, []);

    // Comparar si dos productos son el mismo (producto y peso)
    const isSameProduct = useCallback((stockItem: Stock, product: ProductForStock): boolean => {
        const stockProductNormalized = normalizeProductName(stockItem.producto || '');
        const productNormalized = normalizeProductName(product.product || '');
        const stockWeightNormalized = normalizeWeight(stockItem.peso);
        const productWeightNormalized = normalizeWeight(product.weight);

        return stockProductNormalized === productNormalized && stockWeightNormalized === productWeightNormalized;
    }, [normalizeProductName, normalizeWeight]);

    // Filtrar stock por fecha seleccionada
    const getStockForDate = useCallback((): Stock[] => {
        if (!selectedDate) return [];
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        return stock.filter(s => {
            // Comparar directamente el string de fecha (primeros 10 caracteres)
            // para evitar problemas de zona horaria
            const stockDateStr = String(s.fecha).substring(0, 10);
            return stockDateStr === dateStr;
        });
    }, [selectedDate, stock]);

    // Calcular automáticamente los pedidos del día para un producto específico
    const calculatePedidosDelDia = useCallback((product?: ProductForStock): number => {
        if (!selectedPuntoEnvio || !selectedDate || !product) return 0;

        const dateStr = format(selectedDate, 'yyyy-MM-dd');

        // Filtrar órdenes del día para este punto de envío que contengan el producto específico
        const ordersOfDay = orders.filter(order => {
            if (!order.puntoEnvio || order.puntoEnvio !== selectedPuntoEnvio) return false;

            // Comparar por fecha de creación (sin importar el estado)
            const orderDate = new Date(order.createdAt);
            const orderDateStr = format(orderDate, 'yyyy-MM-dd');
            if (orderDateStr !== dateStr) return false;

            // Verificar si la orden contiene el producto específico
            if (!order.items || order.items.length === 0) return false;

            return true;
        });

        // Sumar cantidades de los items que coinciden
        let totalQuantity = 0;
        const sectionUpper = (product.section || '').toUpperCase();
        const productName = (product.product || '').toUpperCase().trim();
        const productWeight = product.weight ? (product.weight || '').toUpperCase().trim().replace(/\s+/g, '') : null;

        ordersOfDay.forEach(order => {
            order.items.forEach((item: any) => {
                const itemProduct = (item.name || '').toUpperCase().trim();

                // --- VALIDACIÓN DE SECCIÓN ---
                // Evitar mezclar PERRO con GATO
                if (sectionUpper.includes('GATO')) {
                    if (!itemProduct.includes('GATO')) return; // Item no es de gato
                } else if (sectionUpper.includes('PERRO')) {
                    // Si la sección es perro, el item debe ser perro o big dog
                    // O al menos NO debe ser de Gato (por si hay nombres genéricos, aunque Express usa BOX PERRO/GATO)
                    if (itemProduct.includes('GATO')) return;
                    // Opcional: Requerir PERRO o BIG DOG explícitamente si los nombres son consistentes
                    if (!itemProduct.includes('PERRO') && !itemProduct.includes('BIG DOG')) return;
                }

                let isMatch = false;

                // 1. Comparación directa
                if (itemProduct === productName) isMatch = true;

                // 2. Comparación si el nombre del item incluye el nombre del producto
                else if (itemProduct.includes(productName)) {
                    // Verificar si hay peso
                    if (productWeight) {
                        let weightMatch = false;
                        if (item.options && item.options.length > 0) {
                            const itemWeight = (item.options[0]?.name || '').toUpperCase().trim().replace(/\s+/g, '');
                            if (itemWeight === productWeight) weightMatch = true;
                        } else if (itemProduct.replace(/\s+/g, '').includes(productWeight)) {
                            weightMatch = true;
                        }
                        if (weightMatch) isMatch = true;
                    } else {
                        isMatch = true;
                    }
                }
                // 3. Comparación removiendo prefijos comunes
                else {
                    let extractedProductName = itemProduct;
                    extractedProductName = extractedProductName.replace(/^BOX\s+PERRO\s+/i, '');
                    extractedProductName = extractedProductName.replace(/^BOX\s+GATO\s+/i, '');
                    extractedProductName = extractedProductName.replace(/^BIG\s+DOG\s+/i, '');
                    extractedProductName = extractedProductName.replace(/\s+\d+KG.*$/i, '');
                    extractedProductName = extractedProductName.trim();

                    if (extractedProductName === productName) {
                        if (productWeight) {
                            if (item.options && item.options.length > 0) {
                                const itemWeight = (item.options[0]?.name || '').toUpperCase().trim().replace(/\s+/g, '');
                                if (itemWeight === productWeight) isMatch = true;
                            } else if (itemProduct.replace(/\s+/g, '').includes(productWeight)) {
                                isMatch = true;
                            }
                        } else {
                            isMatch = true;
                        }
                    }
                }

                if (isMatch) {
                    const qty = item.quantity || item.options?.[0]?.quantity || 1;
                    totalQuantity += qty;
                    if (product.product?.includes('VACA')) {
                        console.log(`[DEBUG] Adding ${qty} to VACA from Order ${order._id?.substring(0, 8)}`);
                    }
                }
            });
        });

        return totalQuantity;
    }, [selectedPuntoEnvio, selectedDate, orders]);

    // Función para guardar automáticamente con debounce
    const saveStockValue = useCallback((stockId: string, field: 'stockInicial' | 'llevamos', value: number, product?: ProductForStock) => {
        // Limpiar timeout anterior si existe (usar solo stockId como clave)
        if (saveTimeouts.current[stockId]) {
            clearTimeout(saveTimeouts.current[stockId]);
        }

        // Actualizar estado local inmediatamente (sin recargar)
        setLocalStockValues(prev => {
            const updated = {
                ...prev,
                [stockId]: {
                    ...prev[stockId],
                    [field]: value,
                }
            };

            // Actualizar ref para acceso directo
            localStockValuesRef.current = updated;

            // Actualizar también el estado de stock local para reflejar cambios inmediatamente
            setStock(prevStock => {
                const stockItem = prevStock.find(s => String(s._id) === stockId);
                if (stockItem) {
                    const currentValues = updated[stockId] || { stockInicial: stockItem.stockInicial, llevamos: stockItem.llevamos };
                    return prevStock.map(s =>
                        String(s._id) === stockId
                            ? { ...s, [field]: value, stockFinal: currentValues.stockInicial - currentValues.llevamos }
                            : s
                    );
                }
                return prevStock;
            });

            return updated;
        });

        // Guardar en servidor después de 1 segundo de inactividad
        saveTimeouts.current[stockId] = setTimeout(async () => {
            try {
                // Verificar si ya se está guardando este registro (evitar duplicados)
                if (savingFlags.current[stockId]) {
                    return;
                }

                // Obtener valores actualizados del estado local usando ref (no setState)
                const currentValues = localStockValuesRef.current[stockId] || {};
                const currentStockInicial = currentValues.stockInicial ?? 0;
                const currentLlevamos = currentValues.llevamos ?? 0;
                // Marcar como guardando
                savingFlags.current[stockId] = true;

                // Recalcular pedidos del día actualizado para guardar
                // Nota: si no pasamos product para actualizaciones, podríamos perder precisión,
                // pero normalmente product viene del contexto de render o se puede buscar.
                // En este caso, saveStockValue recibe product como argumento opcional, asegurarnos de pasarlo en el JSX.
                let currentPedidosDelDia = 0;

                // Buscar producto si no está presente (caso de update existente donde product puede venir undefined)
                let targetProduct = product;
                if (!targetProduct && !stockId.startsWith('new-')) {
                    // Intentar encontrar el producto en productsForStock basado en el stock actual
                    const currentStock = stock.find(s => String(s._id) === stockId);
                    if (currentStock) {
                        targetProduct = productsForStock.find(p => isSameProduct(currentStock, p));
                    }
                }

                if (targetProduct) {
                    currentPedidosDelDia = calculatePedidosDelDia(targetProduct);
                } else {
                    // Si no se encuentra el producto, intentar usar el valor guardado
                    const currentStock = stock.find(s => String(s._id) === stockId);
                    currentPedidosDelDia = currentStock?.pedidosDelDia || 0;
                }

                // Fórmula: stockInicial + llevamos - pedidosDelDia = stockFinal
                const stockFinal = currentStockInicial + currentLlevamos - currentPedidosDelDia;


                // Guardar en servidor
                try {
                    if (stockId.startsWith('new-')) {
                        // Verificar si ya existe un registro para este producto antes de crear
                        const stockForDate = getStockForDate();
                        if (product) {
                            // Buscar stock existente usando comparación normalizada
                            const existingStock = stockForDate.find(s => isSameProduct(s, product));

                            if (existingStock) {
                                // Si ya existe, actualizar en lugar de crear
                                const updateData: any = {
                                    stockInicial: currentStockInicial,
                                    llevamos: currentLlevamos,
                                    stockFinal,
                                    pedidosDelDia: calculatePedidosDelDia(product),
                                };
                                const result = await updateStockAction(String(existingStock._id), updateData);
                                if (result.success && result.stock) {
                                    const newId = String(result.stock._id);
                                    setLocalStockValues(prevLocal => {
                                        const { [stockId]: _, ...rest } = prevLocal;
                                        const updated = { ...rest, [newId]: { stockInicial: result.stock!.stockInicial, llevamos: result.stock!.llevamos } };
                                        localStockValuesRef.current = updated;
                                        return updated;
                                    });
                                    setStock(prev => prev.map(s =>
                                        String(s._id) === String(existingStock._id) ? result.stock! : s
                                    ));
                                }
                            } else {
                                // Crear nuevo registro solo si no existe
                                if (!selectedPuntoEnvio || !selectedDate || !product) return;

                                const dateStr = format(selectedDate, 'yyyy-MM-dd');
                                const pedidosDelDiaCalculado = calculatePedidosDelDia(product);
                                const stockData: any = {
                                    puntoEnvio: selectedPuntoEnvio,
                                    producto: product.product,
                                    peso: product.weight || undefined,
                                    stockInicial: currentStockInicial,
                                    llevamos: currentLlevamos,
                                    stockFinal,
                                    pedidosDelDia: pedidosDelDiaCalculado,
                                    fecha: dateStr, // Enviar formato YYYY-MM-DD
                                };

                                const result = await createStockAction(stockData);
                                if (result.success && result.stock) {
                                    // Actualizar estado local con el nuevo ID
                                    const newId = String(result.stock._id);
                                    setLocalStockValues(prevLocal => {
                                        const { [stockId]: _, ...rest } = prevLocal;
                                        const updated = { ...rest, [newId]: { stockInicial: result.stock!.stockInicial, llevamos: result.stock!.llevamos } };
                                        localStockValuesRef.current = updated;
                                        return updated;
                                    });
                                    setStock(prev => [...prev, result.stock!]);
                                }
                            }
                        }
                    } else {
                        // Actualizar registro existente
                        const updateData: any = {
                            stockInicial: currentStockInicial,
                            llevamos: currentLlevamos,
                            stockFinal,
                        };

                        // Si tenemos el producto, actualizar también pedidosDelDia
                        if (product) {
                            updateData.pedidosDelDia = calculatePedidosDelDia(product);
                        }

                        const result = await updateStockAction(stockId, updateData);
                        if (result.success && result.stock) {
                            // Actualizar estado local sin recargar
                            setStock(prev => prev.map(s =>
                                String(s._id) === stockId ? result.stock! : s
                            ));
                            // Actualizar también localStockValues con los valores del servidor
                            setLocalStockValues(prev => ({
                                ...prev,
                                [stockId]: {
                                    stockInicial: result.stock!.stockInicial,
                                    llevamos: result.stock!.llevamos,
                                }
                            }));
                            localStockValuesRef.current = {
                                ...localStockValuesRef.current,
                                [stockId]: {
                                    stockInicial: result.stock!.stockInicial,
                                    llevamos: result.stock!.llevamos,
                                }
                            };
                        }
                    }
                } catch (error) {
                    console.error('Error saving stock:', error);
                    // Revertir cambios locales en caso de error
                    if (selectedPuntoEnvio) {
                        loadTablasData(selectedPuntoEnvio, { skipLocalUpdate: true });
                    }
                } finally {
                    // Remover flag de guardando
                    delete savingFlags.current[stockId];
                }
            } catch (error) {
                console.error('Error in save timeout:', error);
                delete savingFlags.current[stockId];
            }
            delete saveTimeouts.current[stockId];
        }, 1000);
    }, [selectedPuntoEnvio, selectedDate, stock, getStockForDate, calculatePedidosDelDia, isSameProduct, normalizeProductName, normalizeWeight]);


    // Función para crear stock si no existe
    const handleCreateStockForProduct = async (product: ProductForStock) => {
        if (!selectedPuntoEnvio || !selectedDate) return;

        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        const pedidosDelDiaCalculado = calculatePedidosDelDia(product);

        try {
            const result = await createStockAction({
                puntoEnvio: selectedPuntoEnvio,
                producto: product.product,
                peso: product.weight || undefined,
                stockInicial: 0,
                llevamos: 0,
                pedidosDelDia: pedidosDelDiaCalculado,
                stockFinal: 0,
                fecha: dateStr, // Enviar formato YYYY-MM-DD
            });

            if (result.success) {
                toast({
                    title: '¡Éxito!',
                    description: 'Registro de stock creado',
                });
                if (selectedPuntoEnvio) {
                    loadTablasData(selectedPuntoEnvio);
                }
            } else {
                toast({
                    title: 'Error',
                    description: result.message || 'Error al crear el stock',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Error al crear el stock',
                variant: 'destructive',
            });
        }
    };

    // Función para determinar el orden de los productos
    const getProductOrder = (product: string, section: string): number => {
        const productUpper = product.toUpperCase();
        const sectionUpper = section.toUpperCase();

        // PERRO POLLO (pero no BIG DOG POLLO)
        if (sectionUpper === 'PERRO' && productUpper.includes('POLLO') && !productUpper.includes('BIG DOG')) {
            return 1;
        }
        // PERRO VACA (pero no BIG DOG VACA)
        if (sectionUpper === 'PERRO' && productUpper.includes('VACA') && !productUpper.includes('BIG DOG')) {
            return 2;
        }
        // PERRO CERDO
        if (sectionUpper === 'PERRO' && productUpper.includes('CERDO')) {
            return 3;
        }
        // PERRO CORDERO
        if (sectionUpper === 'PERRO' && productUpper.includes('CORDERO')) {
            return 4;
        }
        // BIG DOG POLLO
        if (productUpper.includes('BIG DOG POLLO')) {
            return 5;
        }
        // BIG DOG VACA
        if (productUpper.includes('BIG DOG VACA')) {
            return 6;
        }
        // GATO POLLO
        if (sectionUpper === 'GATO' && productUpper.includes('POLLO')) {
            return 7;
        }
        // GATO VACA
        if (sectionUpper === 'GATO' && productUpper.includes('VACA')) {
            return 8;
        }
        // GATO CORDERO
        if (sectionUpper === 'GATO' && productUpper.includes('CORDERO')) {
            return 9;
        }
        // HUESOS CARNOSOS
        if (productUpper.includes('HUESOS CARNOSOS') || productUpper.includes('HUESO CARNOSO')) {
            return 10;
        }
        // BOX DE COMPLEMENTOS
        if (productUpper.includes('BOX DE COMPLEMENTOS') || productUpper.includes('BOX COMPLEMENTOS')) {
            return 11;
        }

        // Productos no especificados van al final
        return 999;
    };

    // Función para determinar el color de fondo de la fila según el producto
    const getProductRowColor = (product: string, section: string): string => {
        const productUpper = product.toUpperCase();
        const sectionUpper = section.toUpperCase();

        // PERRO POLLO (5KG, 10KG, BIG DOG POLLO) y GATO POLLO: amarillo
        if (productUpper.includes('POLLO') && (sectionUpper === 'PERRO' || sectionUpper === 'GATO')) {
            return 'bg-yellow-100 hover:bg-yellow-200';
        }

        // VACA: rojo más oscuro (antes era claro)
        if (productUpper.includes('VACA')) {
            return 'bg-red-300 hover:bg-red-400';
        }

        // CERDO: rosa claro (antes era más oscuro)
        if (productUpper.includes('CERDO')) {
            return 'bg-pink-100 hover:bg-pink-200';
        }

        // CORDERO: violeta
        if (productUpper.includes('CORDERO')) {
            return 'bg-violet-100 hover:bg-violet-200';
        }

        // HUESOS CARNOSOS: marrón fuerte
        if (productUpper.includes('HUESOS CARNOSOS') || productUpper.includes('HUESO CARNOSO')) {
            return 'bg-amber-700 text-white hover:bg-amber-800';
        }

        // BOX DE COMPLEMENTOS: color piel medio marrón
        if (productUpper.includes('BOX DE COMPLEMENTOS') || productUpper.includes('BOX COMPLEMENTOS')) {
            return 'bg-stone-200 hover:bg-stone-300';
        }

        // Color por defecto
        return 'hover:bg-gray-50';
    };

    return (
        <div className="h-full w-full">
            <div className="mb-5 p-5">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">
                            {dictionary.app.admin.navigation.gestionEnvioExpressStock || 'Gestión de Envío Express y Stock'}
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Gestiona los puntos de envío express, su stock y órdenes asociadas.
                        </p>
                    </div>
                </div>
            </div>

            <div className="px-5">
                {/* Selector de punto de envío */}
                <div className="mb-6">
                    <div className="flex items-center gap-4">
                        <div className="flex-1">
                            <label className="text-sm font-medium mb-2 block">
                                Seleccionar Punto de Envío
                            </label>
                            <Select
                                value={selectedPuntoEnvio}
                                onValueChange={handlePuntoEnvioChange}
                                disabled={!isAdmin && puntosEnvio.length > 0}
                            >
                                <SelectTrigger className="w-full max-w-md">
                                    <SelectValue placeholder={puntosEnvio.length === 0 ? "No hay puntos de envío disponibles" : "Selecciona un punto de envío..."} />
                                </SelectTrigger>
                                <SelectContent>
                                    {isAdmin && (
                                        <SelectItem value="all" className="font-bold border-b mb-1">
                                            Todos los puntos (Resumen General)
                                        </SelectItem>
                                    )}
                                    {puntosEnvio.length === 0 ? (
                                        <SelectItem value="" disabled>
                                            No hay puntos de envío
                                        </SelectItem>
                                    ) : (
                                        puntosEnvio.map((punto) => (
                                            <SelectItem key={String(punto._id)} value={punto.nombre}>
                                                {punto.nombre}
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                        {isAdmin && (
                            <Button onClick={() => setShowCreatePuntoEnvioModal(true)} variant="outline">
                                <Plus className="mr-2 h-4 w-4" />
                                Nuevo Punto
                            </Button>
                        )}
                    </div>
                </div>

                {/* Date Picker - Global for all tabs */}
                <div className="mb-6 flex items-center gap-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <div className="flex items-center gap-2">
                        <CalendarIcon className="h-5 w-5 text-gray-500" />
                        <span className="font-medium text-gray-700">Fecha seleccionada:</span>
                    </div>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn(
                                    "w-[240px] justify-start text-left font-normal bg-white",
                                    !selectedDate && "text-muted-foreground"
                                )}
                            >
                                {selectedDate ? (
                                    format(selectedDate, "PPP", { locale: es })
                                ) : (
                                    <span>Seleccionar fecha</span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={(date) => date && setSelectedDate(date)}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                    {selectedDate && (
                        <span className="text-sm text-muted-foreground ml-2">
                            {format(selectedDate, "EEEE", { locale: es })}
                        </span>
                    )}
                </div>

                {/* Mostrar Resumen General si está seleccionado "all" */}
                {selectedPuntoEnvio === 'all' && (
                    <ResumenGeneralTables
                        orders={orders}
                        puntosEnvio={puntosEnvio}
                        productsForStock={productsForStock}
                        selectedDate={selectedDate}
                    />
                )}

                {/* Mostrar Tabs normales si hay un punto específico seleccionado */}
                {selectedPuntoEnvio && selectedPuntoEnvio !== 'all' && (
                    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                        <TabsList className={isAdmin ? "grid w-full grid-cols-3" : "grid w-full grid-cols-2"}>
                            <TabsTrigger value="orders" className="flex items-center gap-2">
                                <ShoppingCart className="h-4 w-4" />
                                Órdenes ({orders.length})
                            </TabsTrigger>
                            <TabsTrigger value="stock" className="flex items-center gap-2">
                                <Package className="h-4 w-4" />
                                Stock ({stock.length})
                            </TabsTrigger>
                            {isAdmin && (
                                <TabsTrigger value="detalle" className="flex items-center gap-2">
                                    <BarChart3 className="h-4 w-4" />
                                    Detalle ({detalle.length})
                                </TabsTrigger>
                            )}
                        </TabsList>

                        <TabsContent value="orders" className="mt-6">
                            {isLoading ? (
                                <Card>
                                    <CardContent className="py-8">
                                        <div className="text-center text-muted-foreground">
                                            <p>Cargando órdenes...</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : orders.length === 0 ? (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Órdenes Express</CardTitle>
                                        <CardDescription>
                                            Órdenes con paymentMethod: "bank-transfer" asociadas a este punto de envío
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-center py-8 text-muted-foreground">
                                            <p>No hay órdenes express para este punto de envío</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : (
                                <OrdersDataTable
                                    columns={createExpressColumns(async () => {
                                        // Recargar los datos visualmente
                                        if (selectedPuntoEnvio) {
                                            await loadTablasData(selectedPuntoEnvio, { silent: false });
                                            router.refresh();
                                        }
                                    })}
                                    data={paginatedOrders}
                                    pageCount={Math.ceil(filteredAndSortedOrders.length / pageSizeFromUrl)}
                                    total={filteredAndSortedOrders.length}
                                    pagination={{
                                        pageIndex: pageFromUrl - 1,
                                        pageSize: pageSizeFromUrl,
                                    }}
                                    sorting={sortFromUrl ? [{
                                        id: sortFromUrl.split('.')[0],
                                        desc: sortFromUrl.split('.')[1] === 'desc'
                                    }] : [{ id: 'createdAt', desc: true }]}
                                    canEdit={canEdit}
                                    canDelete={canDelete}
                                    onOrderUpdated={async () => {
                                        // Recargar los datos visualmente para confirmar
                                        if (selectedPuntoEnvio) {
                                            await loadTablasData(selectedPuntoEnvio, { silent: false });
                                            router.refresh(); // Forzar actualización de componentes servidor también
                                        }
                                    }}
                                />
                            )}
                        </TabsContent>

                        <TabsContent value="stock" className="mt-6">
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle>Stock</CardTitle>
                                            <CardDescription>
                                                Gestión de stock día a día para este punto de envío
                                            </CardDescription>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        className={cn(
                                                            'w-[240px] justify-start text-left font-normal',
                                                            !selectedDate && 'text-muted-foreground'
                                                        )}
                                                    >
                                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                                        {selectedDate ? format(selectedDate, 'PPP', { locale: es }) : 'Seleccionar fecha'}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="end">
                                                    <div className="flex flex-col">
                                                        <Calendar
                                                            mode="single"
                                                            selected={selectedDate}
                                                            onSelect={(date) => date && setSelectedDate(date)}
                                                            initialFocus
                                                            locale={es}
                                                        />
                                                        <div className="border-t p-3">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => setSelectedDate(new Date())}
                                                                className="w-full"
                                                            >
                                                                Hoy
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                            <Button onClick={() => setShowAddStockModal(true)} disabled={!selectedPuntoEnvio}>
                                                <Plus className="h-4 w-4 mr-2" />
                                                Agregar producto
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {isLoading ? (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <p>Cargando stock...</p>
                                        </div>
                                    ) : !selectedPuntoEnvio ? (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <p>Selecciona un punto de envío para ver el stock</p>
                                        </div>
                                    ) : productsForStock.length === 0 ? (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <p>Cargando productos...</p>
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="border-b bg-gray-50">
                                                        <th className="text-left p-2 font-semibold">Sección</th>
                                                        <th className="text-left p-2 font-semibold">Producto</th>
                                                        <th className="text-left p-2 font-semibold">Peso/Sabor</th>
                                                        <th className="text-right p-2 font-semibold">Stock Inicial</th>
                                                        <th className="text-right p-2 font-semibold">Llevamos</th>
                                                        <th className="text-right p-2 font-semibold">Pedidos del Día</th>
                                                        <th className="text-right p-2 font-semibold">Stock Final</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {[...productsForStock].sort((a, b) => {
                                                        const orderA = getProductOrder(a.product, a.section);
                                                        const orderB = getProductOrder(b.product, b.section);

                                                        // Si tienen el mismo orden, ordenar por peso
                                                        if (orderA === orderB) {
                                                            const weightA = (a.weight || '').toUpperCase();
                                                            const weightB = (b.weight || '').toUpperCase();
                                                            return weightA.localeCompare(weightB);
                                                        }

                                                        return orderA - orderB;
                                                    }).map((product) => {
                                                        // Buscar registros de stock para este producto en la fecha seleccionada
                                                        const stockForDate = getStockForDate();
                                                        // Usar la función de comparación normalizada
                                                        const stockRecords = stockForDate.filter(s => isSameProduct(s, product));

                                                        // Si hay múltiples registros, tomar solo el más reciente (por fecha de creación)
                                                        const uniqueStockRecord = stockRecords.length > 0
                                                            ? stockRecords.sort((a, b) => {
                                                                const dateA = new Date(a.createdAt || a.fecha || 0).getTime();
                                                                const dateB = new Date(b.createdAt || b.fecha || 0).getTime();
                                                                return dateB - dateA;
                                                            })[0]
                                                            : null;

                                                        // Obtener el color de la fila para este producto
                                                        const rowColorClass = getProductRowColor(product.product, product.section);

                                                        // Calcular pedidos del día en vivo
                                                        const pedidosDelDia = calculatePedidosDelDia(product);

                                                        // Si no hay registros, mostrar una fila vacía con campos siempre editables
                                                        if (!uniqueStockRecord) {
                                                            const emptyId = `new-${product.section}-${product.product}-${product.weight || 'no-weight'}`;
                                                            const localValues = localStockValues[emptyId] || { stockInicial: 0, llevamos: 0 };
                                                            const stockInicial = localValues.stockInicial ?? 0;
                                                            const llevamos = localValues.llevamos ?? 0;
                                                            const stockFinalCalculado = stockInicial + llevamos - pedidosDelDia;

                                                            return (
                                                                <tr key={`${product.section}-${product.product}-${product.weight || 'no-weight'}`} className={`border-b ${rowColorClass}`}>
                                                                    <td className="p-2 font-bold text-gray-700">{product.section}</td>
                                                                    <td className="p-2 font-bold">{product.product}</td>
                                                                    <td className="p-2 font-bold text-gray-600">{product.weight || '-'}</td>
                                                                    <td className="p-2 text-right">
                                                                        <div className="flex justify-end">
                                                                            <Input
                                                                                type="number"
                                                                                min="0"
                                                                                value={stockInicial}
                                                                                onChange={(e) => {
                                                                                    const inputValue = e.target.value;
                                                                                    if (inputValue === '') return;
                                                                                    const newValue = Number(inputValue);
                                                                                    if (!isNaN(newValue) && newValue >= 0) {
                                                                                        saveStockValue(emptyId, 'stockInicial', newValue, product);
                                                                                    }
                                                                                }}
                                                                                onBlur={(e) => {
                                                                                    const inputValue = e.target.value;
                                                                                    if (inputValue === '' || isNaN(Number(inputValue))) {
                                                                                        saveStockValue(emptyId, 'stockInicial', 0, product);
                                                                                    }
                                                                                }}
                                                                                onKeyDown={(e) => {
                                                                                    if (stockInicial === 0 && /[0-9]/.test(e.key) &&
                                                                                        e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'Tab' &&
                                                                                        e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'Enter') {
                                                                                        e.preventDefault();
                                                                                        saveStockValue(emptyId, 'stockInicial', Number(e.key), product);
                                                                                    }
                                                                                }}
                                                                                className="w-20 text-right h-8 font-bold"
                                                                            />
                                                                        </div>
                                                                    </td>
                                                                    <td className="p-2 text-right">
                                                                        <div className="flex justify-end">
                                                                            <Input
                                                                                type="number"
                                                                                min="0"
                                                                                value={llevamos}
                                                                                onChange={(e) => {
                                                                                    const inputValue = e.target.value;
                                                                                    if (inputValue === '') return;
                                                                                    const newValue = Number(inputValue);
                                                                                    if (!isNaN(newValue) && newValue >= 0) {
                                                                                        saveStockValue(emptyId, 'llevamos', newValue, product);
                                                                                    }
                                                                                }}
                                                                                onBlur={(e) => {
                                                                                    const inputValue = e.target.value;
                                                                                    if (inputValue === '' || isNaN(Number(inputValue))) {
                                                                                        saveStockValue(emptyId, 'llevamos', 0, product);
                                                                                    }
                                                                                }}
                                                                                onKeyDown={(e) => {
                                                                                    if (llevamos === 0 && /[0-9]/.test(e.key) &&
                                                                                        e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'Tab' &&
                                                                                        e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'Enter') {
                                                                                        e.preventDefault();
                                                                                        saveStockValue(emptyId, 'llevamos', Number(e.key), product);
                                                                                    }
                                                                                }}
                                                                                className="w-20 text-right h-8 font-bold"
                                                                            />
                                                                        </div>
                                                                    </td>
                                                                    <td className="p-2 text-center">
                                                                        <span className="font-semibold text-gray-700">{pedidosDelDia}</span>
                                                                    </td>
                                                                    <td className="p-2 text-right font-bold">
                                                                        {stockFinalCalculado}
                                                                    </td>
                                                                </tr>
                                                            );
                                                        }

                                                        // Si hay registro, usar sus valores
                                                        const stockId = String(uniqueStockRecord._id);
                                                        const localValues = localStockValues[stockId] || {
                                                            stockInicial: uniqueStockRecord.stockInicial,
                                                            llevamos: uniqueStockRecord.llevamos
                                                        };
                                                        const stockInicial = localValues.stockInicial ?? uniqueStockRecord.stockInicial ?? 0;
                                                        const llevamos = localValues.llevamos ?? uniqueStockRecord.llevamos ?? 0;
                                                        const displayStockFinal = stockInicial + llevamos - pedidosDelDia;

                                                        return (
                                                            <tr key={`${product.section}-${product.product}-${product.weight || 'no-weight'}-${stockId}`} className={`border-b ${rowColorClass}`}>
                                                                <td className="p-2 font-bold text-gray-700">{product.section}</td>
                                                                <td className="p-2 font-bold">{product.product}</td>
                                                                <td className="p-2 font-bold text-gray-600">{product.weight || '-'}</td>
                                                                <td className="p-2 text-right">
                                                                    <div className="flex justify-end">
                                                                        <Input
                                                                            type="number"
                                                                            min="0"
                                                                            value={stockInicial}
                                                                            onChange={(e) => {
                                                                                const inputValue = e.target.value;
                                                                                const newValue = inputValue === '' ? 0 : (parseInt(inputValue, 10) || 0);
                                                                                if (!isNaN(newValue) && newValue >= 0) {
                                                                                    saveStockValue(stockId, 'stockInicial', newValue, product);
                                                                                }
                                                                            }}
                                                                            onBlur={(e) => {
                                                                                const inputValue = e.target.value;
                                                                                const finalValue = inputValue === '' || isNaN(Number(inputValue)) ? 0 : parseInt(inputValue, 10);
                                                                                if (!isNaN(finalValue) && finalValue >= 0) {
                                                                                    saveStockValue(stockId, 'stockInicial', finalValue, product);
                                                                                }
                                                                            }}
                                                                            onKeyDown={(e) => {
                                                                                if (stockInicial === 0 && /[0-9]/.test(e.key) &&
                                                                                    e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'Tab' &&
                                                                                    e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'Enter') {
                                                                                    e.preventDefault();
                                                                                    saveStockValue(stockId, 'stockInicial', Number(e.key), product);
                                                                                }
                                                                            }}
                                                                            className="w-20 text-right h-8 font-bold"
                                                                        />
                                                                    </div>
                                                                </td>
                                                                <td className="p-2 text-right">
                                                                    <div className="flex justify-end">
                                                                        <Input
                                                                            type="number"
                                                                            min="0"
                                                                            value={llevamos}
                                                                            onChange={(e) => {
                                                                                const inputValue = e.target.value;
                                                                                const newValue = inputValue === '' ? 0 : (parseInt(inputValue, 10) || 0);
                                                                                if (!isNaN(newValue) && newValue >= 0) {
                                                                                    saveStockValue(stockId, 'llevamos', newValue, product);
                                                                                }
                                                                            }}
                                                                            onBlur={(e) => {
                                                                                const inputValue = e.target.value;
                                                                                const finalValue = inputValue === '' || isNaN(Number(inputValue)) ? 0 : parseInt(inputValue, 10);
                                                                                if (!isNaN(finalValue) && finalValue >= 0) {
                                                                                    saveStockValue(stockId, 'llevamos', finalValue, product);
                                                                                }
                                                                            }}
                                                                            onKeyDown={(e) => {
                                                                                if (llevamos === 0 && /[0-9]/.test(e.key) &&
                                                                                    e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'Tab' &&
                                                                                    e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'Enter') {
                                                                                    e.preventDefault();
                                                                                    saveStockValue(stockId, 'llevamos', Number(e.key), product);
                                                                                }
                                                                            }}
                                                                            className="w-20 text-right h-8 font-bold"
                                                                        />
                                                                    </div>
                                                                </td>
                                                                <td className="p-2 text-center">
                                                                    <span className="font-semibold text-gray-700">{pedidosDelDia}</span>
                                                                </td>
                                                                <td className="p-2 text-right font-bold">
                                                                    {displayStockFinal}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {
                            isAdmin && (
                                <TabsContent value="detalle" className="mt-6">
                                    {(() => {
                                        // Calcular totales
                                        const totalEnvios = orders.length; // Usar órdenes filtradas por fecha y punto de envío si es necesario
                                        const totalIngresos = orders.reduce((sum, order) => sum + (order.total || 0), 0);
                                        const totalCostoEnvio = orders.reduce((sum, order) => sum + (order.shippingPrice || 0), 0);
                                        const porcentajeCosto = totalIngresos > 0 ? ((totalCostoEnvio / totalIngresos) * 100).toFixed(1) : '0';
                                        const costoEnvioPromedio = totalEnvios > 0 ? totalCostoEnvio / totalEnvios : 0;

                                        return (
                                            <div className="grid gap-4 md:grid-cols-4 mb-6">
                                                <Card>
                                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                                        <CardTitle className="text-sm font-medium">
                                                            Cantidad de Envíos
                                                        </CardTitle>
                                                        <Package className="h-4 w-4 text-muted-foreground" />
                                                    </CardHeader>
                                                    <CardContent>
                                                        <div className="text-2xl font-bold">{totalEnvios}</div>
                                                    </CardContent>
                                                </Card>
                                                <Card>
                                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                                        <CardTitle className="text-sm font-medium">
                                                            Costo de Envío Total
                                                        </CardTitle>
                                                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                                                    </CardHeader>
                                                    <CardContent>
                                                        <div className="text-2xl font-bold">
                                                            {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(totalCostoEnvio)}
                                                        </div>
                                                        <p className="text-xs text-muted-foreground">
                                                            Equivale al {porcentajeCosto}% de los ingresos
                                                        </p>
                                                    </CardContent>
                                                </Card>
                                                <Card>
                                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                                        <CardTitle className="text-sm font-medium">
                                                            Costo de Envío Promedio
                                                        </CardTitle>
                                                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                                                    </CardHeader>
                                                    <CardContent>
                                                        <div className="text-2xl font-bold">
                                                            {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(costoEnvioPromedio)}
                                                        </div>
                                                        <p className="text-xs text-muted-foreground">
                                                            Por pedido
                                                        </p>
                                                    </CardContent>
                                                </Card>
                                                <Card>
                                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                                        <CardTitle className="text-sm font-medium">
                                                            Ingresos Totales
                                                        </CardTitle>
                                                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                                                    </CardHeader>
                                                    <CardContent>
                                                        <div className="text-2xl font-bold">
                                                            {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(totalIngresos)}
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </div>
                                        );
                                    })()}

                                    {isLoading ? (
                                        <Card>
                                            <CardContent className="py-8">
                                                <div className="text-center text-muted-foreground">
                                                    <p>Cargando detalle...</p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ) : detalle.length === 0 ? (
                                        <Card>
                                            <CardContent className="py-8">
                                                <div className="text-center text-muted-foreground">
                                                    <p>No hay datos de detalle disponibles para el punto de envío seleccionado.</p>
                                                    <p className="text-sm mt-2">Los datos de detalle se generan automáticamente cuando se procesan los envíos.</p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ) : (
                                        <DetalleTable data={detalle} />
                                    )}
                                </TabsContent>
                            )
                        }
                    </Tabs >
                )
                }
            </div >

            {selectedPuntoEnvio && selectedPuntoEnvio !== 'all' && (
                <AddStockModal
                    open={showAddStockModal}
                    onOpenChange={setShowAddStockModal}
                    puntoEnvio={selectedPuntoEnvio}
                    defaultDate={selectedDate}
                    onStockCreated={() => {
                        if (selectedPuntoEnvio) {
                            loadTablasData(selectedPuntoEnvio);
                        }
                    }}
                />
            )}

            <CreatePuntoEnvioModal
                open={showCreatePuntoEnvioModal}
                onOpenChange={setShowCreatePuntoEnvioModal}
                onPuntoEnvioCreated={() => {
                    handlePuntosEnvioRefresh();
                }}
            />
        </div >
    );
}

