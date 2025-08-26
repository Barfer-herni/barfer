'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/design-system/components/ui/card';
import { Badge } from '@repo/design-system/components/ui/badge';
import { Button } from '@repo/design-system/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@repo/design-system/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@repo/design-system/components/ui/command';
import { Filter, Package, ChevronsUpDown } from 'lucide-react';
import { ProductTimelineChart } from '../charts/ProductTimelineChart';

// Duplicating interfaces to avoid import issues in this context
interface ProductSale {
    productId: string;
    productName: string;
    optionName: string;
    quantity: number;
    revenue: number;
    orders: number;
    totalWeight?: number | null;
}

interface ProductEvolution {
    productId: string;
    productName: string;
    optionName: string;
    totalQuantity: number;
    totalRevenue: number;
    confirmedQuantity: number;
    confirmedRevenue: number;
}

interface ProductTimelinePoint {
    period: string;
    totalQuantity: number;
    totalRevenue: number;
    confirmedQuantity: number;
    confirmedRevenue: number;
    products: ProductEvolution[];
}

interface ProductsAnalyticsClientProps {
    allProducts: ProductSale[];
    pendingProducts: ProductSale[];
    confirmedProducts: ProductSale[];
    compareAllProducts?: ProductSale[];
    comparePendingProducts?: ProductSale[];
    compareConfirmedProducts?: ProductSale[];
    timelineData: ProductTimelinePoint[];
    compareTimelineData?: ProductTimelinePoint[];
    isComparing?: boolean;
    dateFilter: { from: Date; to: Date };
    compareFilter?: { from: Date; to: Date };
}

const currencyFormatter = (value: number) => `$${value.toLocaleString('es-AR')}`;

export function ProductsAnalyticsClient({
    allProducts,
    pendingProducts,
    confirmedProducts,
    compareAllProducts,
    comparePendingProducts,
    compareConfirmedProducts,
    timelineData,
    compareTimelineData,
    isComparing = false,
    dateFilter,
    compareFilter
}: ProductsAnalyticsClientProps) {
    const statusFilter = 'all';
    const [selectedProduct, setSelectedProduct] = useState<string>('all');
    const [popoverOpen, setPopoverOpen] = useState(false);

    const productOptions = useMemo(() => {
        const products = allProducts.map((p, index) => ({
            value: `${p.productId}-${p.optionName}`,
            label: `${p.productName} (${p.optionName})`,
        }));
        return [{ value: 'all', label: 'Todos los productos' }, ...products];
    }, [allProducts]);

    const filterTimelineData = (data: ProductTimelinePoint[], productFilter: string): any[] => {
        if (productFilter === 'all' || !data) {
            return data;
        }

        return data.map(point => {
            const product = point.products.find(p => `${p.productId}-${p.optionName}` === productFilter);
            if (product) {
                return {
                    period: point.period,
                    totalQuantity: product.totalQuantity,
                    totalRevenue: product.totalRevenue,
                    confirmedQuantity: product.confirmedQuantity,
                    confirmedRevenue: product.confirmedRevenue,
                };
            }
            return {
                period: point.period,
                totalQuantity: 0,
                totalRevenue: 0,
                confirmedQuantity: 0,
                confirmedRevenue: 0,
            };
        });
    };

    const filteredTimelineData = useMemo(() => filterTimelineData(timelineData, selectedProduct), [timelineData, selectedProduct]);
    const filteredCompareTimelineData = useMemo(() => compareTimelineData ? filterTimelineData(compareTimelineData, selectedProduct) : undefined, [compareTimelineData, selectedProduct]);

    const currentProducts = allProducts;
    const compareProducts = compareAllProducts || [];

    const formatDateRange = (from: Date, to: Date) => {
        return `${from.toLocaleDateString('es-ES')} - ${to.toLocaleDateString('es-ES')}`;
    };

    return (
        <div className="space-y-8">
            {/* Filtros y Listas de Productos - MOVIDO ARRIBA */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Filter className="h-5 w-5" /> Filtro de Rankings de Productos</CardTitle>
                    <CardDescription>Filtra los rankings de productos por estado de la orden.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-2">
                        <Button variant="default">Todas</Button>
                    </div>
                </CardContent>
            </Card>

            {/* Ranking de Productos - MOVIDO ARRIBA */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><Package className="h-5 w-5" /> Ranking (Período Actual)</CardTitle></CardHeader>
                    <CardContent className="space-y-3 max-h-[400px] overflow-y-auto">
                        {currentProducts.map((p, i) => (
                            <div key={`current-${p.productId}-${p.optionName}-${i}`} className="flex items-center justify-between p-2 border rounded-md"><div className="flex items-center gap-3"><Badge variant="outline">#{i + 1}</Badge><div><p className="font-medium text-sm">{p.productName} ({p.optionName})</p><p className="text-xs text-muted-foreground">{p.orders} órdenes</p></div></div><div className="text-right"><p className="font-bold text-sm">{p.quantity} un.</p>{p.totalWeight && <p className="font-bold text-sm text-blue-600">{p.totalWeight.toLocaleString('es-AR')} kg</p>}<p className="text-xs text-muted-foreground">{currencyFormatter(p.revenue)}</p></div></div>
                        ))}
                        {currentProducts.length === 0 && <p className="text-center text-muted-foreground py-4">No hay productos.</p>}
                    </CardContent>
                </Card>
                {isComparing && (
                    <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2"><Package className="h-5 w-5" /> Ranking (Comparación)</CardTitle></CardHeader>
                        <CardContent className="space-y-3 max-h-[400px] overflow-y-auto">
                            {compareProducts.map((p, i) => (
                                <div key={`compare-${p.productId}-${p.optionName}-${i}`} className="flex items-center justify-between p-2 border rounded-md"><div className="flex items-center gap-3"><Badge variant="outline">#{i + 1}</Badge><div><p className="font-medium text-sm">{p.productName} ({p.optionName})</p><p className="text-xs text-muted-foreground">{p.orders} órdenes</p></div></div><div className="text-right"><p className="font-bold text-sm">{p.quantity} un.</p>{p.totalWeight && <p className="font-bold text-sm text-blue-600">{p.totalWeight.toLocaleString('es-AR')} kg</p>}<p className="text-xs text-muted-foreground">{currencyFormatter(p.revenue)}</p></div></div>
                            ))}
                            {compareProducts.length === 0 && <p className="text-center text-muted-foreground py-4">No hay productos para comparar.</p>}
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Gráficos de Línea de Tiempo - SOLO TOTALES */}
            <div className="space-y-8">
                {/* Filtro de Evolución - MOVIDO AQUÍ */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Filter className="h-5 w-5" /> Filtro de Evolución</CardTitle>
                        <CardDescription>Selecciona un producto para ver su evolución específica en los gráficos.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                            <PopoverTrigger asChild>
                                <Button variant="outline" role="combobox" aria-expanded={popoverOpen} className="w-[300px] justify-between">
                                    {selectedProduct === 'all'
                                        ? 'Todos los productos'
                                        : productOptions.find(p => p.value === selectedProduct)?.label || 'Seleccionar producto...'}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[300px] p-0">
                                <Command>
                                    <CommandInput placeholder="Buscar producto..." />
                                    <CommandList>
                                        <CommandEmpty>No se encontraron productos.</CommandEmpty>
                                        <CommandGroup>
                                            {productOptions.map((option, index) => (
                                                <CommandItem
                                                    key={`product-option-${index}-${option.value}`}
                                                    value={option.value}
                                                    onSelect={(currentValue) => {
                                                        setSelectedProduct(currentValue === selectedProduct ? 'all' : currentValue);
                                                        setPopoverOpen(false);
                                                    }}
                                                >
                                                    {option.label}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </CardContent>
                </Card>

                <div>
                    <h3 className="text-2xl font-bold tracking-tight mb-4">Evolución de Unidades Vendidas</h3>
                    <div className={`grid gap-4 ${isComparing ? 'md:grid-cols-2' : 'grid-cols-1'}`}>
                        <Card>
                            <CardHeader>
                                <CardTitle>Período Actual</CardTitle>
                                <CardDescription>{formatDateRange(dateFilter.from, dateFilter.to)}</CardDescription>
                            </CardHeader>
                            <CardContent><ProductTimelineChart data={filteredTimelineData} yKey1="totalQuantity" name1="Total" /></CardContent>
                        </Card>
                        {isComparing && filteredCompareTimelineData && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Período de Comparación</CardTitle>
                                    <CardDescription>{compareFilter && formatDateRange(compareFilter.from, compareFilter.to)}</CardDescription>
                                </CardHeader>
                                <CardContent><ProductTimelineChart data={filteredCompareTimelineData} yKey1="totalQuantity" name1="Total" /></CardContent>
                            </Card>
                        )}
                    </div>
                </div>

                <div>
                    <h3 className="text-2xl font-bold tracking-tight mb-4">Evolución de Ingresos</h3>
                    <div className={`grid gap-4 ${isComparing ? 'md:grid-cols-2' : 'grid-cols-1'}`}>
                        <Card>
                            <CardHeader>
                                <CardTitle>Período Actual</CardTitle>
                                <CardDescription>{formatDateRange(dateFilter.from, dateFilter.to)}</CardDescription>
                            </CardHeader>
                            <CardContent><ProductTimelineChart data={filteredTimelineData} yKey1="totalRevenue" name1="Total" yAxisFormatter={currencyFormatter} /></CardContent>
                        </Card>
                        {isComparing && filteredCompareTimelineData && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Período de Comparación</CardTitle>
                                    <CardDescription>{compareFilter && formatDateRange(compareFilter.from, compareFilter.to)}</CardDescription>
                                </CardHeader>
                                <CardContent><ProductTimelineChart data={filteredCompareTimelineData} yKey1="totalRevenue" name1="Total" yAxisFormatter={currencyFormatter} /></CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
} 