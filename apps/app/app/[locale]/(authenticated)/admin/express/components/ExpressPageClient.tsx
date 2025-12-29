'use client';

import { useState, useEffect } from 'react';
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
}

export function ExpressPageClient({ dictionary, initialPuntosEnvio, canEdit, canDelete }: ExpressPageClientProps) {
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
    const [editingStockId, setEditingStockId] = useState<string | null>(null);
    const [editingField, setEditingField] = useState<string | null>(null);
    const [editValue, setEditValue] = useState<string>('');
    // Estado para mantener los cambios pendientes por fila
    const [pendingChanges, setPendingChanges] = useState<Record<string, { stockInicial?: number; llevamos?: number }>>({});
    
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

    const loadTablasData = async (puntoEnvio: string) => {
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
            if (stockResult.success) {
                setStock(stockResult.stock || []);
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
    const getStockForDate = (): Stock[] => {
        if (!selectedDate) return [];
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        return stock.filter(s => {
            const stockDate = new Date(s.fecha);
            const stockDateStr = format(stockDate, 'yyyy-MM-dd');
            return stockDateStr === dateStr;
        });
    };

    // Calcular automáticamente los pedidos del día basándose en las órdenes
    const calculatePedidosDelDia = (): number => {
        if (!selectedPuntoEnvio || !selectedDate) return 0;
        
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        
        // Filtrar órdenes del día para este punto de envío
        const ordersOfDay = orders.filter(order => {
            if (!order.puntoEnvio || order.puntoEnvio !== selectedPuntoEnvio) return false;
            
            // Comparar por fecha de creación (sin importar el estado)
            const orderDate = new Date(order.createdAt);
            const orderDateStr = format(orderDate, 'yyyy-MM-dd');
            return orderDateStr === dateStr;
        });
        
        return ordersOfDay.length;
    };

    // Función para iniciar modo de edición de una fila completa
    const handleRowEdit = (stockId: string | null, product?: ProductForStock) => {
        const editId = stockId || (product ? `new-${product.section}-${product.product}-${product.weight || 'no-weight'}` : null);
        if (editId) {
            setEditingStockId(editId);
            // Inicializar cambios pendientes con valores actuales
            if (stockId) {
                const currentStock = stock.find(s => String(s._id) === stockId);
                if (currentStock) {
                    setPendingChanges(prev => ({
                        ...prev,
                        [editId]: {
                            stockInicial: currentStock.stockInicial,
                            llevamos: currentStock.llevamos,
                        }
                    }));
                }
            } else if (product) {
                setPendingChanges(prev => ({
                    ...prev,
                    [editId]: {
                        stockInicial: 0,
                        llevamos: 0,
                    }
                }));
            }
        }
    };

    // Función para actualizar un valor en cambios pendientes
    const handlePendingChange = (stockId: string, field: 'stockInicial' | 'llevamos', value: number) => {
        setPendingChanges(prev => ({
            ...prev,
            [stockId]: {
                ...prev[stockId],
                [field]: value,
            }
        }));
    };

    // Función para cancelar edición
    const handleCancelEdit = () => {
        setEditingStockId(null);
        setEditingField(null);
        setEditValue('');
        setPendingChanges({});
    };

    // Función para guardar todos los cambios pendientes de una fila
    const handleSaveRow = async (stockId: string | null, product: ProductForStock) => {
        const editId = stockId || (product ? `new-${product.section}-${product.product}-${product.weight || 'no-weight'}` : null);
        if (!editId) return;

        const changes = pendingChanges[editId];
        if (!changes) {
            handleCancelEdit();
            return;
        }

        // Validar valores
        const stockInicial = changes.stockInicial ?? 0;
        const llevamos = changes.llevamos ?? 0;

        if (stockInicial < 0 || llevamos < 0) {
            toast({
                title: 'Error',
                description: 'Los valores deben ser mayores o iguales a 0',
                variant: 'destructive',
            });
            return;
        }

        // Si no hay stockId, significa que es un nuevo registro
        if (!stockId || stockId.startsWith('new-')) {
            // Buscar si ya existe un registro para este producto en esta fecha
            const stockForDate = getStockForDate();
            const existingStock = stockForDate.find(s => {
                const sProducto = (s.producto || '').toUpperCase().trim();
                const sPeso = (s.peso || '').toUpperCase().trim();
                const pProduct = (product.product || '').toUpperCase().trim();
                const pWeight = (product.weight || '').toUpperCase().trim();
                return sProducto === pProduct && sPeso === pWeight;
            });

            if (existingStock) {
                // Si existe, actualizarlo
                const updateData: any = {
                    stockInicial,
                    llevamos,
                    stockFinal: stockInicial - llevamos,
                };
                try {
                    const result = await updateStockAction(String(existingStock._id), updateData);
                    if (result.success) {
                        toast({
                            title: '¡Éxito!',
                            description: 'Stock actualizado correctamente',
                        });
                        if (selectedPuntoEnvio) {
                            loadTablasData(selectedPuntoEnvio);
                        }
                    } else {
                        toast({
                            title: 'Error',
                            description: result.message || 'Error al actualizar el stock',
                            variant: 'destructive',
                        });
                    }
                } catch (error) {
                    toast({
                        title: 'Error',
                        description: 'Error al actualizar el stock',
                        variant: 'destructive',
                    });
                }
            } else {
                // Si no existe, crear nuevo registro
                if (!selectedPuntoEnvio || !selectedDate) return;
                
                const dateStr = format(selectedDate, 'yyyy-MM-dd');
                // Calcular automáticamente los pedidos del día
                const pedidosDelDiaCalculado = calculatePedidosDelDia();
                const stockData: any = {
                    puntoEnvio: selectedPuntoEnvio,
                    producto: product.product,
                    peso: product.weight || undefined,
                    stockInicial,
                    llevamos,
                    pedidosDelDia: pedidosDelDiaCalculado,
                    fecha: new Date(dateStr).toISOString(),
                    stockFinal: stockInicial - llevamos,
                };

                try {
                    const result = await createStockAction(stockData);
                    if (result.success) {
                        toast({
                            title: '¡Éxito!',
                            description: 'Stock creado correctamente',
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
            }
        } else {
            // Actualizar registro existente
            const updateData: any = {
                stockInicial,
                llevamos,
                stockFinal: stockInicial - llevamos,
            };

            try {
                const result = await updateStockAction(stockId, updateData);
                if (result.success) {
                    toast({
                        title: '¡Éxito!',
                        description: 'Stock actualizado correctamente',
                    });
                    if (selectedPuntoEnvio) {
                        loadTablasData(selectedPuntoEnvio);
                    }
                } else {
                    toast({
                        title: 'Error',
                        description: result.message || 'Error al actualizar el stock',
                        variant: 'destructive',
                    });
                }
            } catch (error) {
                toast({
                    title: 'Error',
                    description: 'Error al actualizar el stock',
                    variant: 'destructive',
                });
            }
        }

        handleCancelEdit();
    };

    // Función para crear stock si no existe
    const handleCreateStockForProduct = async (product: ProductForStock) => {
        if (!selectedPuntoEnvio || !selectedDate) return;

        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        
        try {
            const result = await createStockAction({
                puntoEnvio: selectedPuntoEnvio,
                producto: product.product,
                peso: product.weight || undefined,
                stockInicial: 0,
                llevamos: 0,
                pedidosDelDia: 0,
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
                            <Select value={selectedPuntoEnvio} onValueChange={setSelectedPuntoEnvio}>
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
                        <div className="flex items-end">
                            <Button onClick={() => setShowCreatePuntoEnvioModal(true)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Crear Punto de Envío
                            </Button>
                        </div>
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
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="orders" className="flex items-center gap-2">
                                <ShoppingCart className="h-4 w-4" />
                                Órdenes ({orders.length})
                            </TabsTrigger>
                            <TabsTrigger value="stock" className="flex items-center gap-2">
                                <Package className="h-4 w-4" />
                                Stock ({stock.length})
                            </TabsTrigger>
                            <TabsTrigger value="detalle" className="flex items-center gap-2">
                                <BarChart3 className="h-4 w-4" />
                                Detalle ({detalle.length})
                            </TabsTrigger>
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
                                                    <Calendar
                                                        mode="single"
                                                        selected={selectedDate}
                                                        onSelect={(date) => date && setSelectedDate(date)}
                                                        initialFocus
                                                        locale={es}
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                            <Button onClick={() => setShowAddStockModal(true)} disabled={!selectedPuntoEnvio}>
                                                <Plus className="h-4 w-4 mr-2" />
                                                Agregar Stock
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
                                                        <th className="text-center p-2 font-semibold">Acciones</th>
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

                                                        // Si no hay registros, mostrar una fila vacía con campos editables
                                                        if (!uniqueStockRecord) {
                                                            const emptyId = `new-${product.section}-${product.product}-${product.weight || 'no-weight'}`;
                                                            const isEditing = editingStockId === emptyId;
                                                            const changes = pendingChanges[emptyId] || { stockInicial: 0, llevamos: 0 };
                                                            const stockFinalCalculado = (changes.stockInicial ?? 0) - (changes.llevamos ?? 0);
                                                            
                                                            return (
                                                                <tr key={`${product.section}-${product.product}-${product.weight || 'no-weight'}`} className={`border-b ${rowColorClass}`}>
                                                                    <td className="p-2 font-bold text-gray-700">{product.section}</td>
                                                                    <td className="p-2 font-bold">{product.product}</td>
                                                                    <td className="p-2 font-bold text-gray-600">{product.weight || '-'}</td>
                                                                    <td className="p-2 text-right">
                                                                        {isEditing ? (
                                                                            <div className="flex justify-end">
                                                                                <Input
                                                                                    type="number"
                                                                                    min="0"
                                                                                    value={changes.stockInicial ?? 0}
                                                                                    onChange={(e) => {
                                                                                        const newValue = e.target.value === '' ? 0 : Number(e.target.value) || 0;
                                                                                        handlePendingChange(emptyId, 'stockInicial', newValue);
                                                                                    }}
                                                                                    onKeyDown={(e) => {
                                                                                        if (e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'Tab' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') {
                                                                                            const currentValue = changes.stockInicial ?? 0;
                                                                                            if (currentValue === 0 && /[0-9]/.test(e.key)) {
                                                                                                e.preventDefault();
                                                                                                handlePendingChange(emptyId, 'stockInicial', Number(e.key));
                                                                                            }
                                                                                        }
                                                                                    }}
                                                                                    className="w-20 h-8 text-right font-bold"
                                                                                    autoFocus
                                                                                />
                                                                            </div>
                                                                        ) : (
                                                                            <span className="text-gray-400">-</span>
                                                                        )}
                                                                    </td>
                                                                    <td className="p-2 text-right">
                                                                        {isEditing ? (
                                                                            <div className="flex justify-end">
                                                                                <Input
                                                                                    type="number"
                                                                                    min="0"
                                                                                    value={changes.llevamos ?? 0}
                                                                                    onChange={(e) => {
                                                                                        const newValue = e.target.value === '' ? 0 : Number(e.target.value) || 0;
                                                                                        handlePendingChange(emptyId, 'llevamos', newValue);
                                                                                    }}
                                                                                    onKeyDown={(e) => {
                                                                                        if (e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'Tab' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') {
                                                                                            const currentValue = changes.llevamos ?? 0;
                                                                                            if (currentValue === 0 && /[0-9]/.test(e.key)) {
                                                                                                e.preventDefault();
                                                                                                handlePendingChange(emptyId, 'llevamos', Number(e.key));
                                                                                            }
                                                                                        }
                                                                                    }}
                                                                                    className="w-20 h-8 text-right font-bold"
                                                                                />
                                                                            </div>
                                                                        ) : (
                                                                            <span className="text-gray-400">-</span>
                                                                        )}
                                                                    </td>
                                                                    <td className="p-2 font-bold text-right">
                                                                        <span className="text-gray-700">{calculatePedidosDelDia()}</span>
                                                                    </td>
                                                                    <td className="p-2 text-right font-bold">
                                                                        {isEditing ? stockFinalCalculado : <span className="text-gray-400">-</span>}
                                                                    </td>
                                                                    <td className="p-2 text-center">
                                                                        {isEditing ? (
                                                                            <div className="flex items-center justify-center gap-2">
                                                                                <Button
                                                                                    size="sm"
                                                                                    variant="default"
                                                                                    onClick={() => handleSaveRow(null, product)}
                                                                                    className="h-7 px-2"
                                                                                >
                                                                                    <Save className="h-3 w-3" />
                                                                                </Button>
                                                                                <Button
                                                                                    size="sm"
                                                                                    variant="outline"
                                                                                    onClick={handleCancelEdit}
                                                                                    className="h-7 px-2"
                                                                                >
                                                                                    <X className="h-3 w-3" />
                                                                                </Button>
                                                                            </div>
                                                                        ) : (
                                                                            <Button
                                                                                size="sm"
                                                                                variant="outline"
                                                                                onClick={() => handleRowEdit(null, product)}
                                                                                className="h-7 px-2"
                                                                            >
                                                                                <Edit2 className="h-3 w-3" />
                                                                            </Button>
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            );
                                                        }

                                                        // Mostrar solo un registro de stock por producto (el más reciente)
                                                        const stockId = String(uniqueStockRecord._id);
                                                        const isEditing = editingStockId === stockId;
                                                        const changes = pendingChanges[stockId];
                                                        const displayStockInicial = isEditing ? (changes?.stockInicial ?? uniqueStockRecord.stockInicial) : uniqueStockRecord.stockInicial;
                                                        const displayLlevamos = isEditing ? (changes?.llevamos ?? uniqueStockRecord.llevamos) : uniqueStockRecord.llevamos;
                                                        const displayStockFinal = isEditing 
                                                            ? (displayStockInicial - displayLlevamos)
                                                            : uniqueStockRecord.stockFinal;
                                                        
                                                        return (
                                                            <tr key={`${product.section}-${product.product}-${product.weight || 'no-weight'}-${stockId}`} className={`border-b ${rowColorClass}`}>
                                                                <td className="p-2 font-bold text-gray-700">{product.section}</td>
                                                                <td className="p-2 font-bold">{product.product}</td>
                                                                <td className="p-2 font-bold text-gray-600">{product.weight || '-'}</td>
                                                                <td className="p-2 text-right">
                                                                    {isEditing ? (
                                                                        <div className="flex justify-end">
                                                                            <Input
                                                                                type="number"
                                                                                min="0"
                                                                                value={displayStockInicial}
                                                                                onChange={(e) => {
                                                                                    const newValue = e.target.value === '' ? 0 : Number(e.target.value) || 0;
                                                                                    handlePendingChange(stockId, 'stockInicial', newValue);
                                                                                }}
                                                                                onKeyDown={(e) => {
                                                                                    if (e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'Tab' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') {
                                                                                        const currentValue = displayStockInicial;
                                                                                        if (currentValue === 0 && /[0-9]/.test(e.key)) {
                                                                                            e.preventDefault();
                                                                                            handlePendingChange(stockId, 'stockInicial', Number(e.key));
                                                                                        }
                                                                                    }
                                                                                }}
                                                                                className="w-20 h-8 text-right font-bold"
                                                                                autoFocus
                                                                            />
                                                                        </div>
                                                                    ) : (
                                                                        <span className="font-bold">{uniqueStockRecord.stockInicial}</span>
                                                                    )}
                                                                </td>
                                                                <td className="p-2 text-right">
                                                                    {isEditing ? (
                                                                        <div className="flex justify-end">
                                                                            <Input
                                                                                type="number"
                                                                                min="0"
                                                                                value={displayLlevamos}
                                                                                onChange={(e) => {
                                                                                    const newValue = e.target.value === '' ? 0 : Number(e.target.value) || 0;
                                                                                    handlePendingChange(stockId, 'llevamos', newValue);
                                                                                }}
                                                                                onKeyDown={(e) => {
                                                                                    if (e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'Tab' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') {
                                                                                        const currentValue = displayLlevamos;
                                                                                        if (currentValue === 0 && /[0-9]/.test(e.key)) {
                                                                                            e.preventDefault();
                                                                                            handlePendingChange(stockId, 'llevamos', Number(e.key));
                                                                                        }
                                                                                    }
                                                                                }}
                                                                                className="w-20 h-8 text-right font-bold"
                                                                            />
                                                                        </div>
                                                                    ) : (
                                                                        <span className="font-bold">{uniqueStockRecord.llevamos}</span>
                                                                    )}
                                                                </td>
                                                                <td className="p-2 font-bold text-right">
                                                                    <span className="text-gray-700">{calculatePedidosDelDia()}</span>
                                                                </td>
                                                                <td className="p-2 text-right font-bold">{displayStockFinal}</td>
                                                                <td className="p-2 text-center">
                                                                    {isEditing ? (
                                                                        <div className="flex items-center justify-center gap-2">
                                                                            <Button
                                                                                size="sm"
                                                                                variant="default"
                                                                                onClick={() => handleSaveRow(stockId, product)}
                                                                                className="h-7 px-2"
                                                                            >
                                                                                <Save className="h-3 w-3" />
                                                                            </Button>
                                                                            <Button
                                                                                size="sm"
                                                                                variant="outline"
                                                                                onClick={handleCancelEdit}
                                                                                className="h-7 px-2"
                                                                            >
                                                                                <X className="h-3 w-3" />
                                                                            </Button>
                                                                        </div>
                                                                    ) : (
                                                                        <Button
                                                                            size="sm"
                                                                            variant="outline"
                                                                            onClick={() => handleRowEdit(stockId, product)}
                                                                            className="h-7 px-2"
                                                                        >
                                                                            <Edit2 className="h-3 w-3" />
                                                                        </Button>
                                                                    )}
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

                        <TabsContent value="detalle" className="mt-6">
                            {isLoading ? (
                                <Card>
                                    <CardContent className="py-8">
                                        <div className="text-center text-muted-foreground">
                                            <p>Cargando detalle...</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : (
                                <DetalleTable data={detalle} />
                            )}
                        </TabsContent>
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

