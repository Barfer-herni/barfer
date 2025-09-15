'use client'

import { useState, useEffect } from 'react';
import { Dictionary } from '@repo/internationalization';
import { PriceSection, PriceType } from '@repo/database';
import { updatePriceAction, getPricesByMonthAction, getAllPricesAction, initializePricesForPeriodAction, deletePriceAction, fixBigDogWeightAction, cleanBigDogDuplicatesAction, recreateBigDogProductsAction, ensureBigDogPricesCurrentMonthAction } from '../actions';
import { CreateProductModal } from './CreateProductModal';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/design-system/components/ui/select';
import { Checkbox } from '@repo/design-system/components/ui/checkbox';
import { Label } from '@repo/design-system/components/ui/label';
import { Separator } from '@repo/design-system/components/ui/separator';
import { toast } from '@repo/design-system/hooks/use-toast';
import { Pencil, Check, X, Filter, RotateCcw, Trash2 } from 'lucide-react';
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
    userPermissions: string[];
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
    month: number | null;
    year: number | null;
}

export function PricesTable({ prices, dictionary, userPermissions }: PricesTableProps) {
    const [isUpdating, setIsUpdating] = useState<string | null>(null);
    const [localPrices, setLocalPrices] = useState<Price[]>(prices);
    const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState<number | string>(0);
    const [showFilters, setShowFilters] = useState(true);
    const [isLoadingPrices, setIsLoadingPrices] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isInitializingPeriod, setIsInitializingPeriod] = useState(false);
    const [deletingPriceId, setDeletingPriceId] = useState<string | null>(null);
    const [isFixingBigDog, setIsFixingBigDog] = useState(false);
    const [isCleaningDuplicates, setIsCleaningDuplicates] = useState(false);
    const [isRecreatingBigDog, setIsRecreatingBigDog] = useState(false);
    const [isEnsuringCurrentMonth, setIsEnsuringCurrentMonth] = useState(false);

    // Verificar permisos del usuario
    const canEditPrices = userPermissions.includes('prices:edit');

    // Estados de filtros - Inicializar con mes y año actual
    const getCurrentDate = () => {
        const now = new Date();
        return {
            month: now.getMonth() + 1, // getMonth() devuelve 0-11, necesitamos 1-12
            year: now.getFullYear()
        };
    };

    const [filters, setFilters] = useState<Filters>(() => {
        const { month, year } = getCurrentDate();
        return {
            sections: [],
            weights: [],
            priceTypes: [],
            month,
            year,
        };
    });

    // Obtener valores únicos para los filtros
    const getUniqueValues = () => {
        const sections = [...new Set(localPrices.map(p => p.section))];
        const weights = [...new Set(localPrices.map(p => p.weight).filter((w): w is string => w !== null))];
        const priceTypes = [...new Set(localPrices.map(p => p.priceType))];

        return { sections, weights, priceTypes };
    };

    const { sections: availableSections, weights: availableWeights, priceTypes: availablePriceTypes } = getUniqueValues();

    // Cargar precios del mes/año actual al montar el componente
    useEffect(() => {
        const { month, year } = getCurrentDate();
        loadPricesByDate(month, year);
    }, []); // Solo ejecutar una vez al montar

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
                    // Detectar productos que empiecen con BIG DOG
                    if (product.startsWith('BIG DOG')) {
                        return 0; // BIG DOG productos arriba de todo
                    }

                    // Normalizar producto para comparación (eliminar espacios extra y mayúsculas)
                    const normalizedProduct = product.trim().toUpperCase();

                    // Primero los productos con orden específico - usar includes para mayor flexibilidad
                    if (normalizedProduct.includes('VACA')) return 1;
                    if (normalizedProduct.includes('HUESOS CARNOSOS')) return 2;
                    if (normalizedProduct.includes('BOX') && normalizedProduct.includes('COMPLEMENTOS')) return 3;
                    if (normalizedProduct === 'COMPLEMENTOS') return 3;
                    if (normalizedProduct.includes('GARRAS')) return 4;
                    if (normalizedProduct.includes('CORNALITOS')) return 5;
                    if (normalizedProduct.includes('HUESOS RECREATIVOS')) return 6;
                    if (normalizedProduct.includes('CALDO')) return 7;

                    return 999; // Los productos sin orden específico van al final
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
            month: null,
            year: null,
        });
    };

    // Función para cargar precios por fecha
    const loadPricesByDate = async (month: number, year: number) => {
        setIsLoadingPrices(true);
        try {
            const result = await getPricesByMonthAction(month, year);
            if (result.success) {
                const transformedPrices = (result.prices || []).map((price: any) => ({
                    id: String(price._id), // Convertir explícitamente a string
                    section: price.section as PriceSection,
                    product: String(price.product),
                    weight: price.weight ? String(price.weight) : null,
                    priceType: price.priceType as PriceType,
                    price: Number(price.price),
                    isActive: Boolean(price.isActive)
                }));
                setLocalPrices(transformedPrices);
                toast({
                    title: "Precios cargados",
                    description: `Mostrando precios de ${getMonthName(month)} ${year}`,
                });
            } else {
                toast({
                    title: "Error",
                    description: result.message || "Error al cargar precios por fecha",
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error('Error loading prices by date:', error);
            toast({
                title: "Error",
                description: "Error al cargar los precios por fecha",
                variant: "destructive"
            });
        } finally {
            setIsLoadingPrices(false);
        }
    };

    // Función para obtener el nombre del mes
    const getMonthName = (month: number) => {
        const months = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];
        return months[month - 1];
    };

    // Función para crear un nuevo producto
    const handleCreateProduct = () => {
        setIsCreateModalOpen(true);
    };

    // Función que se ejecuta después de crear un producto
    const handleProductCreated = async () => {
        // Recargar los precios según los filtros actuales
        await loadPricesByDate(filters.month!, filters.year!);
    };

    // Función para inicializar precios para el período actual
    const handleInitializePricesForPeriod = async () => {
        if (!filters.month || !filters.year) return;

        setIsInitializingPeriod(true);
        try {
            const result = await initializePricesForPeriodAction(filters.month, filters.year);
            if (result.success) {
                toast({
                    title: "Precios inicializados",
                    description: `Se han creado los precios base para ${getMonthName(filters.month)} ${filters.year}`,
                });
                // Recargar los precios para mostrar los nuevos datos
                await loadPricesByDate(filters.month, filters.year);
            } else {
                toast({
                    title: "Error",
                    description: result.message || "Error al inicializar precios",
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error('Error initializing prices for period:', error);
            toast({
                title: "Error",
                description: "Error al inicializar precios para el período",
                variant: "destructive"
            });
        } finally {
            setIsInitializingPeriod(false);
        }
    };

    // Función para eliminar un precio
    const handleDeletePrice = async (priceId: string) => {
        setDeletingPriceId(priceId);
        try {
            const result = await deletePriceAction(priceId);
            if (result.success) {
                // Actualizar el estado local removiendo el precio eliminado
                setLocalPrices(prev => prev.filter(p => p.id !== priceId));
                toast({
                    title: "Precio eliminado",
                    description: "El precio se ha eliminado correctamente.",
                });
            } else {
                toast({
                    title: "Error",
                    description: result.message || "Error al eliminar el precio",
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error('Error deleting price:', error);
            toast({
                title: "Error",
                description: "Error al eliminar el precio",
                variant: "destructive"
            });
        } finally {
            setDeletingPriceId(null);
        }
    };

    // Función para corregir el peso de productos BIG DOG
    const handleFixBigDogWeight = async () => {
        setIsFixingBigDog(true);
        try {
            const result = await fixBigDogWeightAction();
            if (result.success) {
                toast({
                    title: "Productos BIG DOG corregidos",
                    description: result.message || "Se corrigieron los pesos de productos BIG DOG",
                });
                // Recargar los precios para mostrar los cambios
                await loadPricesByDate(filters.month!, filters.year!);
            } else {
                toast({
                    title: "Error",
                    description: result.message || "Error al corregir productos BIG DOG",
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error('Error fixing BIG DOG weight:', error);
            toast({
                title: "Error",
                description: "Error al corregir productos BIG DOG",
                variant: "destructive"
            });
        } finally {
            setIsFixingBigDog(false);
        }
    };

    // Función para limpiar duplicados de productos BIG DOG
    const handleCleanBigDogDuplicates = async () => {
        setIsCleaningDuplicates(true);
        try {
            const result = await cleanBigDogDuplicatesAction();
            if (result.success) {
                toast({
                    title: "Duplicados BIG DOG eliminados",
                    description: result.message || "Se eliminaron los productos BIG DOG duplicados",
                });
                // Recargar los precios para mostrar los cambios
                await loadPricesByDate(filters.month!, filters.year!);
            } else {
                toast({
                    title: "Error",
                    description: result.message || "Error al limpiar duplicados BIG DOG",
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error('Error cleaning BIG DOG duplicates:', error);
            toast({
                title: "Error",
                description: "Error al limpiar duplicados BIG DOG",
                variant: "destructive"
            });
        } finally {
            setIsCleaningDuplicates(false);
        }
    };

    // Función para recrear completamente los productos BIG DOG
    const handleRecreateBigDogProducts = async () => {
        setIsRecreatingBigDog(true);
        try {
            const result = await recreateBigDogProductsAction();
            if (result.success) {
                toast({
                    title: "Productos BIG DOG recreados",
                    description: result.message || "Se recrearon completamente los productos BIG DOG",
                });
                // Recargar los precios para mostrar los cambios
                await loadPricesByDate(filters.month!, filters.year!);
            } else {
                toast({
                    title: "Error",
                    description: result.message || "Error al recrear productos BIG DOG",
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error('Error recreating BIG DOG products:', error);
            toast({
                title: "Error",
                description: "Error al recrear productos BIG DOG",
                variant: "destructive"
            });
        } finally {
            setIsRecreatingBigDog(false);
        }
    };

    // Función para asegurar precios BIG DOG en el mes actual
    const handleEnsureBigDogCurrentMonth = async () => {
        setIsEnsuringCurrentMonth(true);
        try {
            const result = await ensureBigDogPricesCurrentMonthAction();
            if (result.success) {
                toast({
                    title: "Precios BIG DOG verificados",
                    description: result.message || "Se verificaron los precios BIG DOG para el mes actual",
                });
                // Recargar los precios para mostrar los cambios
                await loadPricesByDate(filters.month!, filters.year!);
            } else {
                toast({
                    title: "Error",
                    description: result.message || "Error al verificar precios BIG DOG",
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error('Error ensuring BIG DOG current month:', error);
            toast({
                title: "Error",
                description: "Error al verificar precios BIG DOG",
                variant: "destructive"
            });
        } finally {
            setIsEnsuringCurrentMonth(false);
        }
    };

    const hasActiveFilters = filters.sections.length > 0 || filters.weights.length > 0 || filters.priceTypes.length > 0;

    const handleStartEdit = (price: Price) => {
        setEditingPriceId(price.id);
        // Si el precio es 0, mostrar input vacío para mejor UX
        setEditValue(price.price === 0 ? '' : price.price);
    };

    const handleCancelEdit = () => {
        setEditingPriceId(null);
        setEditValue(0);
    };

    const handleSaveEdit = async (priceId: string) => {
        setIsUpdating(priceId);
        try {
            // Convertir editValue a número, si está vacío usar 0
            const numericValue = typeof editValue === 'string' && editValue === '' ? 0 : Number(editValue);

            const result = await updatePriceAction(priceId, numericValue);
            if (result.success) {
                // Actualizar el estado local
                setLocalPrices(prev =>
                    prev.map(p =>
                        p.id === priceId ? { ...p, price: numericValue } : p
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
                                onChange={(e) => {
                                    const value = e.target.value;
                                    // Si está vacío, mantener string vacío
                                    if (value === '') {
                                        setEditValue('');
                                    } else {
                                        // Si tiene valor, convertir a número
                                        const numValue = parseFloat(value);
                                        setEditValue(isNaN(numValue) ? 0 : numValue);
                                    }
                                }}
                                disabled={isLoading}
                                className="w-32 text-center"
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
                            <span className="font-mono text-center min-w-[80px]">
                                ${price.price.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                            </span>
                            {canEditPrices && (
                                <>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleStartEdit(price)}
                                        disabled={isLoading || deletingPriceId === price.id}
                                        className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                    >
                                        <Pencil className="h-3 w-3" />
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleDeletePrice(price.id)}
                                        disabled={isLoading || deletingPriceId === price.id}
                                        className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                        {deletingPriceId === price.id ? (
                                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-600"></div>
                                        ) : (
                                            <Trash2 className="h-3 w-3" />
                                        )}
                                    </Button>
                                </>
                            )}
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

    // Función para crear filas con separadores visuales entre secciones
    const renderRowsWithSeparators = () => {
        if (rows.length === 0) {
            return (
                <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        {hasActiveFilters ?
                            'No hay productos que coincidan con los filtros seleccionados.' :
                            'No hay productos disponibles.'
                        }
                    </TableCell>
                </TableRow>
            );
        }

        const elements: React.ReactElement[] = [];
        let currentSection: PriceSection | null = null;
        let hasShownBigDogSeparator = false;

        rows.forEach((row, index) => {
            const key = `${row.section}-${row.product}-${row.weight || 'no-weight'}`;
            const isBigDog = row.product.startsWith('BIG DOG');

            // Agregar separador si cambiamos de sección
            if (currentSection !== null && currentSection !== row.section) {
                elements.push(
                    <TableRow key={`separator-${row.section}`} className="bg-muted/20">
                        <TableCell colSpan={6} className="py-3">
                            <div className="h-2 bg-muted-foreground/15 rounded-sm"></div>
                        </TableCell>
                    </TableRow>
                );
                hasShownBigDogSeparator = false; // Reset para la nueva sección
            }

            // Agregar separador especial entre BIG DOG y otros productos de PERRO
            if (row.section === 'PERRO' && !isBigDog && !hasShownBigDogSeparator) {
                // Buscar si hay productos BIG DOG antes de este
                const hasBigDogBefore = rows.slice(0, index).some(r =>
                    r.section === 'PERRO' && r.product.startsWith('BIG DOG')
                );

                if (hasBigDogBefore) {
                    elements.push(
                        <TableRow key={`bigdog-separator-${row.product}`} className="bg-orange-50/50">
                            <TableCell colSpan={6} className="py-2">
                                <div className="h-1 bg-orange-200 rounded-sm"></div>
                            </TableCell>
                        </TableRow>
                    );
                    hasShownBigDogSeparator = true;
                }
            }

            currentSection = row.section;

            // Agregar fila del producto
            elements.push(
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
                        ) : row.product.startsWith('BIG DOG') ? (
                            <Badge variant="secondary" className="font-mono">
                                15KG
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
        });

        return elements;
    };

    if (localPrices.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">
                    No hay precios configurados para {getMonthName(filters.month!)} {filters.year}.
                </p>
                {canEditPrices ? (
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Puedes inicializar los precios base para este período y luego editarlos manualmente.
                        </p>
                        <div className="space-y-2">
                            <Button
                                onClick={handleInitializePricesForPeriod}
                                disabled={isInitializingPeriod}
                                className="bg-blue-600 hover:bg-blue-700 w-full"
                            >
                                {isInitializingPeriod ? (
                                    <div className="flex items-center gap-2">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        Inicializando...
                                    </div>
                                ) : (
                                    `Inicializar Precios para ${getMonthName(filters.month!)} ${filters.year}`
                                )}
                            </Button>

                            <Button
                                onClick={handleFixBigDogWeight}
                                disabled={isFixingBigDog}
                                variant="outline"
                                className="w-full border-orange-200 text-orange-700 hover:bg-orange-50"
                            >
                                {isFixingBigDog ? (
                                    <div className="flex items-center gap-2">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600"></div>
                                        Corrigiendo...
                                    </div>
                                ) : (
                                    "🔧 Corregir BIG DOG"
                                )}
                            </Button>

                            <Button
                                onClick={handleCleanBigDogDuplicates}
                                disabled={isCleaningDuplicates}
                                variant="outline"
                                className="w-full border-red-200 text-red-700 hover:bg-red-50"
                            >
                                {isCleaningDuplicates ? (
                                    <div className="flex items-center gap-2">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                                        Limpiando...
                                    </div>
                                ) : (
                                    "🧹 Limpiar Duplicados BIG DOG"
                                )}
                            </Button>

                            <Button
                                onClick={handleRecreateBigDogProducts}
                                disabled={isRecreatingBigDog}
                                variant="outline"
                                className="w-full border-purple-200 text-purple-700 hover:bg-purple-50"
                            >
                                {isRecreatingBigDog ? (
                                    <div className="flex items-center gap-2">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                                        Recreando...
                                    </div>
                                ) : (
                                    "🔄 Recrear BIG DOG (Solución Definitiva)"
                                )}
                            </Button>

                            <Button
                                onClick={handleEnsureBigDogCurrentMonth}
                                disabled={isEnsuringCurrentMonth}
                                variant="outline"
                                className="w-full border-green-200 text-green-700 hover:bg-green-50"
                            >
                                {isEnsuringCurrentMonth ? (
                                    <div className="flex items-center gap-2">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                                        Verificando...
                                    </div>
                                ) : (
                                    "✅ Verificar BIG DOG Mes Actual"
                                )}
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Esto creará todos los productos con precio $0, luego podrás editarlos manualmente.
                        </p>
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground">
                        Contacta al administrador para configurar los productos y precios.
                    </p>
                )}
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

                <div className="text-sm text-muted-foreground">
                    {isLoadingPrices ? (
                        <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                            Cargando precios...
                        </div>
                    ) : (
                        <p>Mostrando {rows.length} productos</p>
                    )}
                </div>
            </div>

            {/* Panel de filtros */}
            <Collapsible open={showFilters}>
                <CollapsibleContent>
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium">Filtrar precios</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                            {/* Filtros de Fecha */}
                            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <Label className="text-sm font-medium mb-3 block text-blue-900">
                                    📅 Filtrar por Período Histórico
                                </Label>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <Label className="text-xs font-medium mb-2 block">Mes</Label>
                                        <Select
                                            value={filters.month?.toString() || "1"}
                                            onValueChange={(value) => {
                                                const month = parseInt(value);
                                                setFilters(prev => ({ ...prev, month }));
                                                loadPricesByDate(month, filters.year!);
                                            }}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Seleccionar mes" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="1">Enero</SelectItem>
                                                <SelectItem value="2">Febrero</SelectItem>
                                                <SelectItem value="3">Marzo</SelectItem>
                                                <SelectItem value="4">Abril</SelectItem>
                                                <SelectItem value="5">Mayo</SelectItem>
                                                <SelectItem value="6">Junio</SelectItem>
                                                <SelectItem value="7">Julio</SelectItem>
                                                <SelectItem value="8">Agosto</SelectItem>
                                                <SelectItem value="9">Septiembre</SelectItem>
                                                <SelectItem value="10">Octubre</SelectItem>
                                                <SelectItem value="11">Noviembre</SelectItem>
                                                <SelectItem value="12">Diciembre</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label className="text-xs font-medium mb-2 block">Año</Label>
                                        <Select
                                            value={filters.year?.toString() || "2025"}
                                            onValueChange={(value) => {
                                                const year = parseInt(value);
                                                setFilters(prev => ({ ...prev, year }));
                                                loadPricesByDate(filters.month!, year);
                                            }}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Seleccionar año" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="2025">2025</SelectItem>
                                                <SelectItem value="2024">2024</SelectItem>
                                                <SelectItem value="2023">2023</SelectItem>
                                                <SelectItem value="2022">2022</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex items-end">
                                        {canEditPrices && (
                                            <Button
                                                variant="default"
                                                size="sm"
                                                onClick={handleCreateProduct}
                                                className="w-full bg-blue-600 hover:bg-blue-700"
                                            >
                                                + Crear Producto
                                            </Button>
                                        )}
                                    </div>
                                </div>
                                <div className="mt-2">
                                    <p className="text-xs text-blue-700">
                                        Mostrando precios de {getMonthName(filters.month!)} {filters.year}
                                    </p>
                                    {rows.length === 0 && canEditPrices && (
                                        <p className="text-xs text-amber-700 mt-1">
                                            ⚠️ No hay precios para este período. Los productos deben ser creados primero en el gestor.
                                        </p>
                                    )}
                                </div>
                            </div>

                            <Separator className="my-4" />

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
                        {renderRowsWithSeparators()}
                    </TableBody>
                </Table>
            </div>

            <div className="text-sm text-muted-foreground">
                <p>• Haz clic en el icono ✏️ para editar un precio</p>
                <p>• Haz clic en el icono 🗑️ para eliminar un precio</p>
                <p>• Usa ✅ para guardar o ❌ para cancelar</p>
                <p>• "—" indica que ese tipo de precio no está disponible</p>
                <p>• Total de precios configurados: {localPrices.length}</p>
            </div>

            {/* Modal para crear producto */}
            <CreateProductModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onProductCreated={handleProductCreated}
                currentMonth={filters.month!}
                currentYear={filters.year!}
            />
        </div>
    );
} 