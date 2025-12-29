'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
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

interface ExpressPageClientProps {
    dictionary: Dictionary;
    initialPuntosEnvio: PuntoEnvio[];
    canEdit: boolean;
    canDelete: boolean;
    isAdmin?: boolean;
}

export function ExpressPageClient({ dictionary, initialPuntosEnvio, canEdit, canDelete, isAdmin = true }: ExpressPageClientProps) {
    const router = useRouter();
    const [showAddStockModal, setShowAddStockModal] = useState(false);
    const [showCreatePuntoEnvioModal, setShowCreatePuntoEnvioModal] = useState(false);
    const [selectedPuntoEnvio, setSelectedPuntoEnvio] = useState<string>('');
    const [puntosEnvio, setPuntosEnvio] = useState<PuntoEnvio[]>(initialPuntosEnvio);
    
    // Debug: verificar datos recibidos
    useEffect(() => {
        console.log('ExpressPageClient - initialPuntosEnvio:', initialPuntosEnvio);
        console.log('ExpressPageClient - puntosEnvio state:', puntosEnvio);
    }, [initialPuntosEnvio, puntosEnvio]);
    
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
    
    // Paginación y ordenamiento para órdenes
    const [pagination, setPagination] = useState<PaginationState>({
        pageIndex: 0,
        pageSize: 50,
    });
    const [sorting, setSorting] = useState<SortingState>([{
        id: 'createdAt',
        desc: true,
    }]);

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

    // Si no es admin y hay puntos de envío, seleccionar automáticamente (solo debería haber uno)
    useEffect(() => {
        if (!isAdmin && puntosEnvio.length > 0 && !selectedPuntoEnvio) {
            setSelectedPuntoEnvio(puntosEnvio[0].nombre || '');
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

    const loadTablasData = async (puntoEnvio: string, skipLocalUpdate = false) => {
        setIsLoading(true);
        try {
            const [ordersResult, stockResult, detalleResult] = await Promise.all([
                getExpressOrdersAction(puntoEnvio),
                getStockByPuntoEnvioAction(puntoEnvio),
                getDetalleEnvioByPuntoEnvioAction(puntoEnvio),
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
            setIsLoading(false);
        }
    };

    // Filtrar stock por fecha seleccionada
    const getStockForDate = useCallback((): Stock[] => {
        if (!selectedDate) return [];
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        return stock.filter(s => {
            const stockDate = new Date(s.fecha);
            const stockDateStr = format(stockDate, 'yyyy-MM-dd');
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
            
            const productName = (product.product || '').toUpperCase().trim();
            const productWeight = product.weight ? (product.weight || '').toUpperCase().trim().replace(/\s+/g, '') : null;
            
            return order.items.some((item: any) => {
                const itemProduct = (item.name || '').toUpperCase().trim();
                
                // Extraer el nombre del producto de item.name
                // item.name puede ser "BOX PERRO POLLO", "BOX GATO POLLO", "BIG DOG POLLO", etc.
                // product.product es solo "POLLO", "VACA", etc.
                let extractedProductName = itemProduct;
                
                // Remover prefijos comunes
                extractedProductName = extractedProductName.replace(/^BOX\s+PERRO\s+/i, '');
                extractedProductName = extractedProductName.replace(/^BOX\s+GATO\s+/i, '');
                extractedProductName = extractedProductName.replace(/^BIG\s+DOG\s+/i, '');
                extractedProductName = extractedProductName.replace(/\s+\d+KG.*$/i, ''); // Remover peso del nombre si está
                extractedProductName = extractedProductName.trim();
                
                // Comparar nombre del producto extraído con product.product
                if (extractedProductName !== productName && itemProduct !== productName && !itemProduct.includes(productName)) {
                    return false;
                }
                
                // Si hay peso especificado en el producto, comparar también el peso
                if (productWeight) {
                    // El peso normalmente está en item.options[0].name (ej: "5KG")
                    if (item.options && item.options.length > 0) {
                        const itemWeight = (item.options[0]?.name || '').toUpperCase().trim().replace(/\s+/g, '');
                        if (itemWeight === productWeight) return true;
                    }
                    
                    // También buscar el peso en el nombre del producto (ej: "BOX PERRO POLLO 5KG")
                    if (itemProduct.replace(/\s+/g, '').includes(productWeight)) return true;
                    
                    return false;
                }
                
                // Si no hay peso especificado en el producto, considerar que coincide solo con el nombre
                return true;
            });
        });
        
        return ordersOfDay.length;
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
                const stockFinal = currentStockInicial - currentLlevamos;
                
                // Marcar como guardando
                savingFlags.current[stockId] = true;
                
                // Guardar en servidor
                try {
                    if (stockId.startsWith('new-')) {
                        // Verificar si ya existe un registro para este producto antes de crear
                        const stockForDate = getStockForDate();
                        if (product) {
                            const existingStock = stockForDate.find(s => {
                                const sProducto = (s.producto || '').toUpperCase().trim();
                                const sPeso = (s.peso || '').toUpperCase().trim();
                                const pProduct = (product.product || '').toUpperCase().trim();
                                const pWeight = (product.weight || '').toUpperCase().trim();
                                return sProducto === pProduct && sPeso === pWeight;
                            });
                            
                            if (existingStock) {
                                // Si ya existe, actualizar en lugar de crear
                                const updateData: any = {
                                    stockInicial: currentStockInicial,
                                    llevamos: currentLlevamos,
                                    stockFinal,
                                };
                                const result = await updateStockAction(String(existingStock._id), updateData);
                                if (result.success && result.stock) {
                                    const newId = String(result.stock._id);
                                    setLocalStockValues(prevLocal => {
                                        const { [stockId]: _, ...rest } = prevLocal;
                                        return { ...rest, [newId]: { stockInicial: currentStockInicial, llevamos: currentLlevamos } };
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
                                    fecha: dateStr,
                                };

                                const result = await createStockAction(stockData);
                                if (result.success && result.stock) {
                                    // Actualizar estado local con el nuevo ID
                                    const newId = String(result.stock._id);
                                    setLocalStockValues(prevLocal => {
                                        const { [stockId]: _, ...rest } = prevLocal;
                                        const updated = { ...rest, [newId]: { stockInicial: currentStockInicial, llevamos: currentLlevamos } };
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
                        const result = await updateStockAction(stockId, updateData);
                        if (result.success && result.stock) {
                            // Actualizar estado local sin recargar
                            setStock(prev => prev.map(s => 
                                String(s._id) === stockId ? result.stock! : s
                            ));
                        }
                    }
                } catch (error) {
                    console.error('Error saving stock:', error);
                    // Revertir cambios locales en caso de error
                    if (selectedPuntoEnvio) {
                        loadTablasData(selectedPuntoEnvio, true);
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
    }, [selectedPuntoEnvio, selectedDate, stock, getStockForDate, calculatePedidosDelDia]);


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
                fecha: new Date(dateStr).toISOString(),
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

        // VACA: rojo
        if (productUpper.includes('VACA')) {
            return 'bg-red-100 hover:bg-red-200';
        }

        // CERDO: marrón medio rosa
        if (productUpper.includes('CERDO')) {
            return 'bg-rose-200 hover:bg-rose-300';
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
                                onValueChange={setSelectedPuntoEnvio}
                                disabled={!isAdmin && puntosEnvio.length > 0}
                            >
                                <SelectTrigger className="w-full max-w-md">
                                    <SelectValue placeholder={puntosEnvio.length === 0 ? "No hay puntos de envío disponibles" : "Selecciona un punto de envío..."} />
                                </SelectTrigger>
                                <SelectContent>
                                    {puntosEnvio.length === 0 ? (
                                        <SelectItem value="" disabled>
                                            No hay puntos de envío disponibles
                                        </SelectItem>
                                    ) : (
                                        puntosEnvio.map((punto) => (
                                            <SelectItem key={String(punto._id)} value={punto.nombre || ''}>
                                                {punto.nombre || 'Sin nombre'}
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                        {isAdmin && (
                        <div className="flex items-end">
                            <Button onClick={() => setShowCreatePuntoEnvioModal(true)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Crear Punto de Envío
                            </Button>
                        </div>
                        )}
                    </div>
                </div>

                {!selectedPuntoEnvio && (
                    <Card>
                        <CardContent className="py-8">
                            <div className="text-center text-muted-foreground">
                                <p>Selecciona un punto de envío para ver sus datos</p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {selectedPuntoEnvio && (
                    <Tabs defaultValue="orders" className="w-full">
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
                                    columns={createExpressColumns(() => {
                                        // Recargar los datos después de actualizar una orden
                                        if (selectedPuntoEnvio) {
                                            loadTablasData(selectedPuntoEnvio);
                                        }
                                    })}
                                    data={orders}
                                    pageCount={Math.ceil(orders.length / pagination.pageSize)}
                                    total={orders.length}
                                    pagination={pagination}
                                    sorting={sorting}
                                    canEdit={canEdit}
                                    canDelete={canDelete}
                                    onOrderUpdated={() => {
                                        // Recargar los datos después de actualizar una orden
                                        if (selectedPuntoEnvio) {
                                            loadTablasData(selectedPuntoEnvio);
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
                                                        const stockRecords = stockForDate.filter(s => {
                                                            const sProducto = (s.producto || '').toUpperCase().trim();
                                                            const sPeso = (s.peso || '').toUpperCase().trim();
                                                            const pProduct = (product.product || '').toUpperCase().trim();
                                                            const pWeight = (product.weight || '').toUpperCase().trim();
                                                            
                                                            return sProducto === pProduct && sPeso === pWeight;
                                                        });

                                                        // Si hay múltiples registros, tomar solo el más reciente (por fecha de creación)
                                                        // Esto evita mostrar filas duplicadas
                                                        const uniqueStockRecord = stockRecords.length > 0 
                                                            ? stockRecords.sort((a, b) => {
                                                                const dateA = new Date(a.createdAt || a.fecha || 0).getTime();
                                                                const dateB = new Date(b.createdAt || b.fecha || 0).getTime();
                                                                return dateB - dateA; // Más reciente primero
                                                            })[0]
                                                            : null;

                                                        // Obtener el color de la fila para este producto
                                                        const rowColorClass = getProductRowColor(product.product, product.section);

                                                        // Si no hay registros, mostrar una fila vacía con campos siempre editables
                                                        if (!uniqueStockRecord) {
                                                            const emptyId = `new-${product.section}-${product.product}-${product.weight || 'no-weight'}`;
                                                            const localValues = localStockValues[emptyId] || { stockInicial: 0, llevamos: 0 };
                                                            const stockInicial = localValues.stockInicial ?? 0;
                                                            const llevamos = localValues.llevamos ?? 0;
                                                            const stockFinalCalculado = stockInicial - llevamos;
                                                            
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
                                                                                    const newValue = e.target.value === '' ? 0 : Number(e.target.value) || 0;
                                                                                    saveStockValue(emptyId, 'stockInicial', newValue, product);
                                                                                }}
                                                                                onKeyDown={(e) => {
                                                                                    if (e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'Tab' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') {
                                                                                        if (stockInicial === 0 && /[0-9]/.test(e.key)) {
                                                                                            e.preventDefault();
                                                                                            saveStockValue(emptyId, 'stockInicial', Number(e.key), product);
                                                                                        }
                                                                                    }
                                                                                }}
                                                                                className="w-20 h-8 text-right font-bold"
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
                                                                                    const newValue = e.target.value === '' ? 0 : Number(e.target.value) || 0;
                                                                                    saveStockValue(emptyId, 'llevamos', newValue, product);
                                                                                }}
                                                                                onKeyDown={(e) => {
                                                                                    if (e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'Tab' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') {
                                                                                        if (llevamos === 0 && /[0-9]/.test(e.key)) {
                                                                                            e.preventDefault();
                                                                                            saveStockValue(emptyId, 'llevamos', Number(e.key), product);
                                                                                        }
                                                                                    }
                                                                                }}
                                                                                className="w-20 h-8 text-right font-bold"
                                                                            />
                                                                        </div>
                                                                    </td>
                                                                    <td className="p-2 font-bold text-right">
                                                                        <span className="text-gray-700">{calculatePedidosDelDia()}</span>
                                                                    </td>
                                                                    <td className="p-2 text-right font-bold">{stockFinalCalculado}</td>
                                                                    <td className="p-2 text-center"></td>
                                                                </tr>
                                                            );
                                                        }

                                                        // Mostrar solo un registro de stock por producto (el más reciente) - siempre editable
                                                        const stockId = String(uniqueStockRecord._id);
                                                        const localValues = localStockValues[stockId] || { 
                                                            stockInicial: uniqueStockRecord.stockInicial, 
                                                            llevamos: uniqueStockRecord.llevamos 
                                                        };
                                                        const stockInicial = localValues.stockInicial ?? uniqueStockRecord.stockInicial ?? 0;
                                                        const llevamos = localValues.llevamos ?? uniqueStockRecord.llevamos ?? 0;
                                                        const displayStockFinal = stockInicial - llevamos;
                                                        
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
                                                                                const newValue = e.target.value === '' ? 0 : Number(e.target.value) || 0;
                                                                                saveStockValue(stockId, 'stockInicial', newValue, product);
                                                                            }}
                                                                            onKeyDown={(e) => {
                                                                                if (e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'Tab' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') {
                                                                                    if (stockInicial === 0 && /[0-9]/.test(e.key)) {
                                                                                        e.preventDefault();
                                                                                        saveStockValue(stockId, 'stockInicial', Number(e.key), product);
                                                                                    }
                                                                                }
                                                                            }}
                                                                            className="w-20 h-8 text-right font-bold"
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
                                                                                const newValue = e.target.value === '' ? 0 : Number(e.target.value) || 0;
                                                                                saveStockValue(stockId, 'llevamos', newValue, product);
                                                                            }}
                                                                            onKeyDown={(e) => {
                                                                                if (e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'Tab' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') {
                                                                                    if (llevamos === 0 && /[0-9]/.test(e.key)) {
                                                                                        e.preventDefault();
                                                                                        saveStockValue(stockId, 'llevamos', Number(e.key), product);
                                                                                    }
                                                                                }
                                                                            }}
                                                                            className="w-20 h-8 text-right font-bold"
                                                                        />
                                                                    </div>
                                                                </td>
                                                                <td className="p-2 font-bold text-right">
                                                                    <span className="text-gray-700">{calculatePedidosDelDia(product)}</span>
                                                                </td>
                                                                <td className="p-2 text-right font-bold">{displayStockFinal}</td>
                                                                <td className="p-2 text-center"></td>
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

                        {isAdmin && (
                        <TabsContent value="detalle" className="mt-6">
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
                        )}
                    </Tabs>
                )}
            </div>

            {selectedPuntoEnvio && (
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
        </div>
    );
}

