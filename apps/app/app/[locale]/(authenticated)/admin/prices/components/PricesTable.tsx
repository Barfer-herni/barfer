'use client'

import { useState } from 'react';
import { Dictionary } from '@repo/internationalization';
import { PriceSection, PriceType } from '@repo/database';
import { updatePriceAction, initializeDefaultPricesAction } from '../actions';
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
import { Card, CardContent, CardHeader, CardTitle } from '@repo/design-system/components/ui/card';
import { Checkbox } from '@repo/design-system/components/ui/checkbox';
import { Label } from '@repo/design-system/components/ui/label';
import { Separator } from '@repo/design-system/components/ui/separator';
import { toast } from '@repo/design-system/hooks/use-toast';
import { Pencil, Check, X, Filter, RotateCcw } from 'lucide-react';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@repo/design-system/components/ui/collapsible';

interface Price {
    id: string;
    section: PriceSection;
    product: string;
    weight?: string | null;
    priceType: PriceType;
    price: number;
    isActive: boolean;
}

interface PricesTableProps {
    prices: Price[];
    dictionary: Dictionary;
}

interface ProductRow {
    section: PriceSection;
    product: string;
    weight: string | null;
    efectivo: Price | null;
    transferencia: Price | null;
    mayorista: Price | null;
}

interface Filters {
    sections: PriceSection[];
    weights: string[];
    priceTypes: PriceType[];
}

export function PricesTable({ prices, dictionary }: PricesTableProps) {
    const [isUpdating, setIsUpdating] = useState<string | null>(null);
    const [localPrices, setLocalPrices] = useState<Price[]>(prices);
    const [isInitializing, setIsInitializing] = useState(false);
    const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState<number>(0);
    const [showFilters, setShowFilters] = useState(false);

    // Estados de filtros
    const [filters, setFilters] = useState<Filters>({
        sections: [],
        weights: [],
        priceTypes: [],
    });

    // Obtener valores únicos para los filtros
    const getUniqueValues = () => {
        const sections = [...new Set(localPrices.map(p => p.section))];
        const weights = [...new Set(localPrices.map(p => p.weight).filter((w): w is string => w !== null))];
        const priceTypes = [...new Set(localPrices.map(p => p.priceType))];

        return { sections, weights, priceTypes };
    };

    const { sections: availableSections, weights: availableWeights, priceTypes: availablePriceTypes } = getUniqueValues();

    // Agrupar precios por producto y peso para crear filas
    const groupedPrices = () => {
        const groups: { [key: string]: ProductRow } = {};

        // Filtrar precios basado en los filtros activos
        let filteredPrices = localPrices;

        // Filtro por sección
        if (filters.sections.length > 0) {
            filteredPrices = filteredPrices.filter(p => filters.sections.includes(p.section));
        }

        // Filtro por peso
        if (filters.weights.length > 0) {
            filteredPrices = filteredPrices.filter(p => {
                // Incluir productos sin peso si "Sin peso" está seleccionado
                if (filters.weights.includes('Sin peso') && !p.weight) return true;
                return p.weight && filters.weights.includes(p.weight);
            });
        }

        // Filtro por tipo de precio
        if (filters.priceTypes.length > 0) {
            filteredPrices = filteredPrices.filter(p => filters.priceTypes.includes(p.priceType));
        }

        filteredPrices.forEach(price => {
            const key = `${price.section}-${price.product}-${price.weight || 'no-weight'}`;

            if (!groups[key]) {
                groups[key] = {
                    section: price.section,
                    product: price.product,
                    weight: price.weight || null,
                    efectivo: null,
                    transferencia: null,
                    mayorista: null,
                };
            }

            if (price.priceType === 'EFECTIVO') {
                groups[key].efectivo = price;
            } else if (price.priceType === 'TRANSFERENCIA') {
                groups[key].transferencia = price;
            } else if (price.priceType === 'MAYORISTA') {
                groups[key].mayorista = price;
            }
        });

        // Convertir a array y ordenar por sección y producto
        return Object.values(groups).sort((a, b) => {
            if (a.section !== b.section) {
                // Orden: PERRO, GATO, OTROS
                const sectionOrder = { PERRO: 1, GATO: 2, OTROS: 3 };
                return sectionOrder[a.section] - sectionOrder[b.section];
            }
            if (a.product !== b.product) {
                // Orden personalizado para productos específicos
                const getProductOrder = (product: string) => {
                    // Primero los productos con orden específico
                    const specificOrder: { [key: string]: number } = {
                        'VACA': 1,
                        'HUESOS CARNOSOS 5KG': 2,
                        'COMPLEMENTOS': 3,
                        'GARRAS': 4,
                        'CORNALITOS': 5,
                        'HUESOS RECREATIVOS': 6,
                        'CALDO DE HUESOS': 7,
                    };

                    return specificOrder[product] || 999; // Los productos sin orden específico van al final
                };

                const orderA = getProductOrder(a.product);
                const orderB = getProductOrder(b.product);

                // Si los órdenes son diferentes, usar el orden específico
                if (orderA !== orderB) {
                    return orderA - orderB;
                }

                // Si ambos tienen el mismo orden (999 = sin orden específico), usar orden alfabético
                return a.product.localeCompare(b.product);
            }
            // Ordenar pesos: 5KG antes que 10KG, null al final
            if (a.weight && b.weight) {
                return a.weight.localeCompare(b.weight);
            }
            if (a.weight && !b.weight) return -1;
            if (!a.weight && b.weight) return 1;
            return 0;
        });
    };

    const handleFilterChange = (type: keyof Filters, value: string, checked: boolean) => {
        setFilters(prev => {
            if (type === 'sections') {
                const sections = checked
                    ? [...prev.sections, value as PriceSection]
                    : prev.sections.filter(item => item !== value);
                return { ...prev, sections };
            } else if (type === 'weights') {
                const weights = checked
                    ? [...prev.weights, value]
                    : prev.weights.filter(item => item !== value);
                return { ...prev, weights };
            } else if (type === 'priceTypes') {
                const priceTypes = checked
                    ? [...prev.priceTypes, value as PriceType]
                    : prev.priceTypes.filter(item => item !== value);
                return { ...prev, priceTypes };
            }
            return prev;
        });
    };

    const clearAllFilters = () => {
        setFilters({
            sections: [],
            weights: [],
            priceTypes: [],
        });
    };

    const hasActiveFilters = filters.sections.length > 0 || filters.weights.length > 0 || filters.priceTypes.length > 0;

    const handleStartEdit = (price: Price) => {
        setEditingPriceId(price.id);
        setEditValue(price.price);
    };

    const handleCancelEdit = () => {
        setEditingPriceId(null);
        setEditValue(0);
    };

    const handleSaveEdit = async (priceId: string) => {
        setIsUpdating(priceId);
        try {
            const result = await updatePriceAction(priceId, editValue);
            if (result.success) {
                // Actualizar el estado local
                setLocalPrices(prev =>
                    prev.map(p =>
                        p.id === priceId ? { ...p, price: editValue } : p
                    )
                );
                setEditingPriceId(null);
                toast({
                    title: "Precio actualizado",
                    description: "El precio se ha actualizado correctamente.",
                });
            } else {
                toast({
                    title: "Error",
                    description: result.message || "Error al actualizar el precio",
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error('Error updating price:', error);
            toast({
                title: "Error",
                description: "Error al actualizar el precio",
                variant: "destructive"
            });
        } finally {
            setIsUpdating(null);
        }
    };

    const handleInitializePrices = async () => {
        setIsInitializing(true);
        try {
            const result = await initializeDefaultPricesAction();
            if (result.success) {
                toast({
                    title: "Precios inicializados",
                    description: result.message,
                });
                // Recargar la página para mostrar los nuevos precios
                window.location.reload();
            } else {
                toast({
                    title: "Error",
                    description: result.message || "Error al inicializar precios",
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error('Error initializing prices:', error);
            toast({
                title: "Error",
                description: "Error al inicializar los precios",
                variant: "destructive"
            });
        } finally {
            setIsInitializing(false);
        }
    };

    const renderPriceInput = (price: Price | null, placeholder: string = "—") => {
        if (!price) {
            return (
                <TableCell className="text-center text-muted-foreground">
                    {placeholder}
                </TableCell>
            );
        }

        const isEditing = editingPriceId === price.id;
        const isLoading = isUpdating === price.id;

        return (
            <TableCell>
                <div className="flex items-center gap-2 justify-center">
                    {isEditing ? (
                        <>
                            <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={editValue}
                                onChange={(e) => setEditValue(parseFloat(e.target.value) || 0)}
                                disabled={isLoading}
                                className="w-20 text-center"
                                placeholder="0.00"
                                autoFocus
                            />
                            <div className="flex gap-1">
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleSaveEdit(price.id)}
                                    disabled={isLoading}
                                    className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                >
                                    <Check className="h-3 w-3" />
                                </Button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={handleCancelEdit}
                                    disabled={isLoading}
                                    className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            </div>
                        </>
                    ) : (
                        <>
                            <span className="font-mono text-center min-w-[60px]">
                                ${price.price.toFixed(2)}
                            </span>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleStartEdit(price)}
                                disabled={isLoading}
                                className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                                <Pencil className="h-3 w-3" />
                            </Button>
                        </>
                    )}
                </div>
            </TableCell>
        );
    };

    const getSectionLabel = (section: PriceSection) => {
        switch (section) {
            case 'PERRO': return 'PERRO';
            case 'GATO': return 'GATO';
            case 'OTROS': return 'OTROS';
            default: return section;
        }
    };

    const getSectionColor = (section: PriceSection) => {
        switch (section) {
            case 'PERRO': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'GATO': return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'OTROS': return 'bg-green-100 text-green-800 border-green-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getProductRowColor = (product: string) => {
        const productUpper = product.toUpperCase();

        if (productUpper.includes('POLLO')) {
            return 'bg-yellow-100 hover:bg-yellow-200';
        }
        if (productUpper.includes('VACA')) {
            return 'bg-red-100 hover:bg-red-200';
        }
        if (productUpper.includes('CERDO')) {
            return 'bg-pink-100 hover:bg-pink-200';
        }
        if (productUpper.includes('CORDERO')) {
            return 'bg-violet-100 hover:bg-violet-200';
        }
        if (productUpper.includes('HUESOS CARNOSOS')) {
            return 'bg-amber-100 hover:bg-amber-200';
        }

        return 'hover:bg-muted/30'; // Color por defecto
    };

    const rows = groupedPrices();

    if (localPrices.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground mb-6">
                    No hay precios configurados. ¿Deseas inicializar la tabla con la estructura por defecto?
                </p>
                <Button
                    onClick={handleInitializePrices}
                    disabled={isInitializing}
                    size="lg"
                >
                    {isInitializing ? "Inicializando..." : "Inicializar Precios por Defecto"}
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Controles de filtros */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowFilters(!showFilters)}
                        className={showFilters ? 'bg-blue-50 border-blue-200' : ''}
                    >
                        <Filter className="h-4 w-4 mr-2" />
                        Filtros
                        {hasActiveFilters && (
                            <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
                                {filters.sections.length + filters.weights.length + filters.priceTypes.length}
                            </Badge>
                        )}
                    </Button>

                    {hasActiveFilters && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearAllFilters}
                            className="text-muted-foreground"
                        >
                            <RotateCcw className="h-4 w-4 mr-1" />
                            Limpiar
                        </Button>
                    )}
                </div>

                <p className="text-sm text-muted-foreground">
                    Mostrando {rows.length} productos
                </p>
            </div>

            {/* Panel de filtros */}
            <Collapsible open={showFilters}>
                <CollapsibleContent>
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium">Filtrar precios</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Filtro por Sección */}
                                <div>
                                    <Label className="text-sm font-medium mb-3 block">Sección</Label>
                                    <div className="space-y-2">
                                        {availableSections.map((section) => (
                                            <div key={section} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`section-${section}`}
                                                    checked={filters.sections.includes(section)}
                                                    onCheckedChange={(checked) =>
                                                        handleFilterChange('sections', section, checked as boolean)
                                                    }
                                                />
                                                <Label
                                                    htmlFor={`section-${section}`}
                                                    className="text-sm font-normal cursor-pointer"
                                                >
                                                    {getSectionLabel(section)}
                                                </Label>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Filtro por Peso */}
                                <div>
                                    <Label className="text-sm font-medium mb-3 block">Peso</Label>
                                    <div className="space-y-2">
                                        {availableWeights.map((weight) => (
                                            <div key={weight} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`weight-${weight}`}
                                                    checked={filters.weights.includes(weight)}
                                                    onCheckedChange={(checked) =>
                                                        handleFilterChange('weights', weight, checked as boolean)
                                                    }
                                                />
                                                <Label
                                                    htmlFor={`weight-${weight}`}
                                                    className="text-sm font-normal cursor-pointer"
                                                >
                                                    {weight}
                                                </Label>
                                            </div>
                                        ))}
                                        {/* Opción para productos sin peso */}
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="weight-none"
                                                checked={filters.weights.includes('Sin peso')}
                                                onCheckedChange={(checked) =>
                                                    handleFilterChange('weights', 'Sin peso', checked as boolean)
                                                }
                                            />
                                            <Label
                                                htmlFor="weight-none"
                                                className="text-sm font-normal cursor-pointer"
                                            >
                                                Sin peso
                                            </Label>
                                        </div>
                                    </div>
                                </div>

                                {/* Filtro por Tipo de Precio */}
                                <div>
                                    <Label className="text-sm font-medium mb-3 block">Tipo de Precio</Label>
                                    <div className="space-y-2">
                                        {availablePriceTypes.map((priceType) => (
                                            <div key={priceType} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`price-type-${priceType}`}
                                                    checked={filters.priceTypes.includes(priceType)}
                                                    onCheckedChange={(checked) =>
                                                        handleFilterChange('priceTypes', priceType, checked as boolean)
                                                    }
                                                />
                                                <Label
                                                    htmlFor={`price-type-${priceType}`}
                                                    className="text-sm font-normal cursor-pointer"
                                                >
                                                    {priceType.charAt(0) + priceType.slice(1).toLowerCase()}
                                                </Label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </CollapsibleContent>
            </Collapsible>

            {/* Tabla de precios */}
            <div className="rounded-lg border">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead className="font-semibold">Sección</TableHead>
                            <TableHead className="font-semibold">Producto</TableHead>
                            <TableHead className="font-semibold text-center">Peso</TableHead>
                            <TableHead className="font-semibold text-center">Efectivo</TableHead>
                            <TableHead className="font-semibold text-center">Transferencia</TableHead>
                            <TableHead className="font-semibold text-center">Mayorista</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rows.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    {hasActiveFilters ?
                                        'No hay productos que coincidan con los filtros seleccionados.' :
                                        'No hay productos disponibles.'
                                    }
                                </TableCell>
                            </TableRow>
                        ) : (
                            rows.map((row, index) => {
                                const key = `${row.section}-${row.product}-${row.weight || 'no-weight'}`;

                                return (
                                    <TableRow key={key} className={getProductRowColor(row.product)}>
                                        <TableCell>
                                            <Badge
                                                variant="outline"
                                                className={`${getSectionColor(row.section)} font-medium`}
                                            >
                                                {getSectionLabel(row.section)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {row.product}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {row.weight ? (
                                                <Badge variant="secondary" className="font-mono">
                                                    {row.weight}
                                                </Badge>
                                            ) : (
                                                <span className="text-muted-foreground">—</span>
                                            )}
                                        </TableCell>
                                        {renderPriceInput(row.efectivo)}
                                        {renderPriceInput(row.transferencia)}
                                        {renderPriceInput(row.mayorista, "—")}
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="text-sm text-muted-foreground">
                <p>• Haz clic en el icono ✏️ para editar un precio</p>
                <p>• Usa ✅ para guardar o ❌ para cancelar</p>
                <p>• "—" indica que ese tipo de precio no está disponible</p>
                <p>• Total de precios configurados: {localPrices.length}</p>
            </div>
        </div>
    );
} 