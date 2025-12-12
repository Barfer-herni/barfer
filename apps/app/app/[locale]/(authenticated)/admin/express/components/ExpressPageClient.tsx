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
import { Plus, Package, ShoppingCart, BarChart3 } from 'lucide-react';
import { AddStockModal } from './AddStockModal';
import { DetalleTable } from './DetalleTable';
import { CreatePuntoEnvioModal } from './CreatePuntoEnvioModal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/design-system/components/ui/tabs';
import {
    getExpressOrdersAction,
    getStockByPuntoEnvioAction,
    getDetalleEnvioByPuntoEnvioAction,
} from '../actions';
import type { DeliveryArea, Order, Stock, DetalleEnvio } from '@repo/data-services';
import { OrdersDataTable } from '../../table/components/OrdersDataTable';
import type { ColumnDef, PaginationState, SortingState } from '@tanstack/react-table';

interface ExpressPageClientProps {
    dictionary: Dictionary;
    initialDeliveryAreas: DeliveryArea[];
    columns: ColumnDef<any, any>[];
    canEdit: boolean;
    canDelete: boolean;
}

export function ExpressPageClient({ dictionary, initialDeliveryAreas, columns, canEdit, canDelete }: ExpressPageClientProps) {
    const router = useRouter();
    const [showAddStockModal, setShowAddStockModal] = useState(false);
    const [showCreatePuntoEnvioModal, setShowCreatePuntoEnvioModal] = useState(false);
    const [selectedPuntoEnvio, setSelectedPuntoEnvio] = useState<string>('');
    const [deliveryAreas, setDeliveryAreas] = useState<DeliveryArea[]>(initialDeliveryAreas);
    
    // Datos de las tablas
    const [orders, setOrders] = useState<Order[]>([]);
    const [stock, setStock] = useState<Stock[]>([]);
    const [detalle, setDetalle] = useState<DetalleEnvio[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    
    // Paginación y ordenamiento para órdenes
    const [pagination, setPagination] = useState<PaginationState>({
        pageIndex: 0,
        pageSize: 50,
    });
    const [sorting, setSorting] = useState<SortingState>([{
        id: 'createdAt',
        desc: true,
    }]);

    const handleDeliveryAreaRefresh = async () => {
        router.refresh();
        // Recargar la lista de delivery areas
        const { getDeliveryAreasWithPuntoEnvioAction } = await import('../actions');
        const result = await getDeliveryAreasWithPuntoEnvioAction();
        if (result.success && result.deliveryAreas) {
            setDeliveryAreas(result.deliveryAreas);
        }
    };

    // Cargar datos cuando se selecciona un punto de envío
    useEffect(() => {
        if (selectedPuntoEnvio) {
            loadTablasData(selectedPuntoEnvio);
        } else {
            setOrders([]);
            setStock([]);
            setDetalle([]);
        }
    }, [selectedPuntoEnvio]);

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
                                    <SelectValue placeholder="Selecciona un punto de envío..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {deliveryAreas.map((area) => (
                                        <SelectItem key={area._id} value={area.puntoEnvio || ''}>
                                            {area.puntoEnvio || area.description}
                                        </SelectItem>
                                    ))}
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
                                    columns={columns}
                                    data={orders}
                                    pageCount={Math.ceil(orders.length / pagination.pageSize)}
                                    total={orders.length}
                                    pagination={pagination}
                                    sorting={sorting}
                                    canEdit={canEdit}
                                    canDelete={canDelete}
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
                                                Gestión de stock para este punto de envío
                                            </CardDescription>
                                        </div>
                                        <Button onClick={() => setShowAddStockModal(true)}>
                                            <Plus className="h-4 w-4 mr-2" />
                                            Agregar Stock
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {isLoading ? (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <p>Cargando stock...</p>
                                        </div>
                                    ) : stock.length === 0 ? (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <p>No hay registros de stock para este punto de envío</p>
                                            <p className="text-sm mt-2">Haz clic en "Agregar Stock" para crear un registro</p>
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="border-b">
                                                        <th className="text-left p-2">Producto</th>
                                                        <th className="text-left p-2">Peso</th>
                                                        <th className="text-right p-2">Stock Inicial</th>
                                                        <th className="text-right p-2">Llevamos</th>
                                                        <th className="text-right p-2">Pedidos del Día</th>
                                                        <th className="text-right p-2">Stock Final</th>
                                                        <th className="text-left p-2">Fecha</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {stock.map((item) => (
                                                        <tr key={String(item._id)} className="border-b">
                                                            <td className="p-2">{item.producto}</td>
                                                            <td className="p-2">{item.peso || '-'}</td>
                                                            <td className="p-2 text-right">{item.stockInicial}</td>
                                                            <td className="p-2 text-right">{item.llevamos}</td>
                                                            <td className="p-2 text-right">{item.pedidosDelDia}</td>
                                                            <td className="p-2 text-right">{item.stockFinal}</td>
                                                            <td className="p-2">
                                                                {new Date(item.fecha).toLocaleDateString()}
                                                            </td>
                                                        </tr>
                                                    ))}
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
                    onStockCreated={() => {
                        loadTablasData(selectedPuntoEnvio);
                    }}
                />
            )}

            <CreatePuntoEnvioModal
                open={showCreatePuntoEnvioModal}
                onOpenChange={setShowCreatePuntoEnvioModal}
                onPuntoEnvioCreated={() => {
                    handleDeliveryAreaRefresh();
                }}
            />
        </div>
    );
}

