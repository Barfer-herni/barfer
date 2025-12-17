'use client';

import { useRef, useEffect } from 'react';
import {
    flexRender,
    getCoreRowModel,
    getSortedRowModel,
    useReactTable,
    type Table as TanstackTable,
} from '@tanstack/react-table';
import { Pencil, Save, Trash2, X, Copy, Calculator, Download } from 'lucide-react';

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
import { Calendar } from '@repo/design-system/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@repo/design-system/components/ui/popover';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { COLUMN_WIDTHS, STATUS_OPTIONS, PAYMENT_METHOD_OPTIONS, ORDER_TYPE_OPTIONS } from '../constants';
import {
    getFilteredProducts,
    shouldHighlightRow,
    getDateCellBackgroundColor,
    getStatusCellBackgroundColor,
    createLocalDate,
    createLocalDateISO,
    extractWeightFromProductName,
    extractBaseProductName,
    processSingleItem,
    normalizeScheduleTime,
    formatPhoneNumber
} from '../helpers';
import type { DataTableProps } from '../types';
import { generateMayoristaPDF } from '../generateMayoristaPDF';

interface OrdersTableProps<TData extends { _id: string }, TValue> extends DataTableProps<TData, TValue> {
    editingRowId: string | null;
    editValues: any;
    loading: boolean;
    rowSelection: Record<string, boolean>;
    productSearchFilter: string;
    canEdit?: boolean;
    canDelete?: boolean;
    availableProducts: string[];
    productsWithDetails: Array<{
        section: string;
        product: string;
        weight: string | null;
        formattedName: string;
    }>;
    productsLoading: boolean;
    onEditClick: (row: any) => void;
    onCancel: () => void;
    onSave: (row: any) => void;
    onDelete: (row: any) => void;
    onDuplicate: (row: any) => void;
    onEditValueChange: (field: string, value: any) => void;
    onRowSelectionChange: (selection: Record<string, boolean>) => void;
    onProductSearchChange: (value: string) => void;
    onPaginationChange: (pageIndex: number, pageSize: number) => void;
    onSortingChange: (sorting: any) => void;
    isCalculatingPrice?: boolean;
    onForceRecalculatePrice?: () => void;
}

export function OrdersTable<TData extends { _id: string }, TValue>({
    columns,
    data,
    pageCount,
    total,
    pagination,
    sorting,
    editingRowId,
    editValues,
    loading,
    rowSelection,
    productSearchFilter,
    canEdit = false,
    canDelete = false,
    availableProducts,
    productsWithDetails,
    productsLoading,
    onEditClick,
    onCancel,
    onSave,
    onDelete,
    onDuplicate,
    onEditValueChange,
    onRowSelectionChange,
    onProductSearchChange,
    onPaginationChange,
    onSortingChange,
    isCalculatingPrice = false,
    onForceRecalculatePrice,
}: OrdersTableProps<TData, TValue>) {
    const table = useReactTable({
        data,
        columns,
        pageCount,
        state: {
            sorting,
            pagination,
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
            onPaginationChange(newPagination.pageIndex, newPagination.pageSize);
        },
        onSortingChange: (updater) => {
            const newSorting = typeof updater === 'function' ? updater(sorting) : updater;
            onSortingChange(newSorting);
        },
        onRowSelectionChange: (updater) => {
            const newRowSelection = typeof updater === 'function' ? updater(rowSelection) : updater;
            onRowSelectionChange(newRowSelection);
        },
        enableRowSelection: true,
    });

    const headerCheckboxRef = useRef<HTMLInputElement>(null);
    useEffect(() => {
        if (headerCheckboxRef.current) {
            headerCheckboxRef.current.indeterminate = table.getIsSomeRowsSelected() && !table.getIsAllRowsSelected();
        }
    }, [table.getIsSomeRowsSelected(), table.getIsAllRowsSelected()]);

    return (
        <div className="rounded-md border">
            <Table className="table-fixed w-full border-collapse">
                <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                            <TableHead className="px-0 py-1 text-xs border-r border-border" style={{ width: `${COLUMN_WIDTHS.checkbox}px` }}>
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
                                        width: index === 0 ? `${COLUMN_WIDTHS.orderType}px` :
                                            index === 1 ? `${COLUMN_WIDTHS.date}px` :
                                                index === 2 ? `${COLUMN_WIDTHS.schedule}px` :
                                                    index === 3 ? `${COLUMN_WIDTHS.notesOwn}px` :
                                                        index === 4 ? `${COLUMN_WIDTHS.client}px` :
                                                            index === 5 ? `${COLUMN_WIDTHS.address}px` :
                                                                index === 6 ? `${COLUMN_WIDTHS.phone}px` :
                                                                    index === 7 ? `${COLUMN_WIDTHS.items}px` :
                                                                        index === 8 ? `${COLUMN_WIDTHS.paymentMethod}px` :
                                                                            index === 9 ? `${COLUMN_WIDTHS.status}px` :
                                                                                index === 10 ? `${COLUMN_WIDTHS.total}px` :
                                                                                    index === 11 ? `${COLUMN_WIDTHS.notes}px` :
                                                                                        index === 12 ? `${COLUMN_WIDTHS.email}px` : '150px'
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
                                                asc: ' 🔽',
                                                desc: ' 🔼',
                                            }[header.column.getIsSorted() as string] ?? null}
                                        </Button>
                                    )}
                                </TableHead>
                            ))}
                            <TableHead className="px-0 py-1 text-xs border-r border-border text-center" style={{ width: `${COLUMN_WIDTHS.actions}px` }}>
                                Acciones
                            </TableHead>
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
                                        : shouldHighlightRow(row) === 'orange'
                                            ? 'bg-orange-100 dark:bg-orange-900/40'
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
                                    // Edición inline para campos editables
                                    if (editingRowId === row.id) {
                                        return renderEditableCell(cell, index, editValues, onEditValueChange, productSearchFilter, onProductSearchChange, availableProducts, productsLoading, isCalculatingPrice, onForceRecalculatePrice);
                                    }

                                    // Aplicar color de fondo para celdas específicas
                                    const dateBgColor = (cell.column.id === 'deliveryDay' || cell.column.id === 'fecha')
                                        ? getDateCellBackgroundColor((row.original as any).deliveryDay)
                                        : '';

                                    const statusBgColor = cell.column.id === 'status'
                                        ? getStatusCellBackgroundColor((row.original as any).status, (row.original as any).paymentMethod)
                                        : '';

                                    const statusTextColor = cell.column.id === 'status' && (row.original as any).status === 'confirmed'
                                        ? 'text-white'
                                        : '';

                                    return (
                                        <TableCell
                                            key={cell.id}
                                            className={`px-0 py-1 border-r border-border ${dateBgColor} ${statusBgColor} ${statusTextColor} text-center${dateBgColor ? ' force-dark-black' : ''}`}
                                            style={{
                                                width: index === 0 ? `${COLUMN_WIDTHS.orderType}px` :
                                                    index === 1 ? `${COLUMN_WIDTHS.date}px` :
                                                        index === 2 ? `${COLUMN_WIDTHS.schedule}px` :
                                                            index === 3 ? `${COLUMN_WIDTHS.notesOwn}px` :
                                                                index === 4 ? `${COLUMN_WIDTHS.client}px` :
                                                                    index === 5 ? `${COLUMN_WIDTHS.address}px` :
                                                                        index === 6 ? `${COLUMN_WIDTHS.phone}px` :
                                                                            index === 7 ? `${COLUMN_WIDTHS.items}px` :
                                                                                index === 8 ? `${COLUMN_WIDTHS.paymentMethod}px` :
                                                                                    index === 9 ? `${COLUMN_WIDTHS.status}px` :
                                                                                        index === 10 ? `${COLUMN_WIDTHS.total}px` :
                                                                                            index === 11 ? `${COLUMN_WIDTHS.notes}px` :
                                                                                                index === 12 ? `${COLUMN_WIDTHS.email}px` : '150px'
                                            }}
                                        >
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    );
                                })}
                                {/* Botones de acción */}
                                <TableCell className="px-0 py-1 border-r border-border">
                                    {editingRowId === row.id ? (
                                        <div className="flex gap-1 justify-center">
                                            {canEdit && (
                                                <Button size="icon" variant="default" onClick={() => onSave(row)} disabled={loading} title="Guardar cambios">
                                                    <Save className="w-4 h-4" />
                                                </Button>
                                            )}
                                            {/* Botón de descargar PDF - solo para órdenes mayoristas */}
                                            {(editValues.orderType === 'mayorista' || (row.original as any).orderType === 'mayorista') && (
                                                <Button
                                                    size="icon"
                                                    variant="outline"
                                                    onClick={async () => {
                                                        try {
                                                            const rowData = row.original as any;
                                                            const allItems = editValues.items || rowData.items || [];
                                                            
                                                            // IMPORTANTE: Filtrar items válidos igual que al crear
                                                            const { filterValidItems } = await import('../helpers');
                                                            const currentItems = filterValidItems(allItems);
                                                            
                                                            if (currentItems.length === 0) {
                                                                alert('No hay productos válidos para generar el PDF.');
                                                                return;
                                                            }
                                                            
                                                            const currentOrderType = editValues.orderType || rowData.orderType || 'mayorista';
                                                            const currentPaymentMethod = editValues.paymentMethod || rowData.paymentMethod || '';

                                                            // Calcular precios de cada item usando la action
                                                            const { calculatePriceAction } = await import('../actions');
                                                            const priceResult = await calculatePriceAction(
                                                                currentItems,
                                                                currentOrderType,
                                                                currentPaymentMethod
                                                            );

                                                            // Mapear los items con sus precios calculados
                                                            let itemsWithPrices = currentItems;
                                                            if (priceResult.success && priceResult.itemPrices) {
                                                                console.log('🔍 [PDF EDIT] Mapeando precios:', {
                                                                    itemsLength: currentItems.length,
                                                                    pricesLength: priceResult.itemPrices.length,
                                                                    items: currentItems.map((i: any) => ({ name: i.name, fullName: i.fullName })),
                                                                    prices: priceResult.itemPrices.map(p => ({ name: p.name, price: p.unitPrice }))
                                                                });
                                                                
                                                                // CRÍTICO: Mapear por NOMBRE, no por índice
                                                                // itemPrices puede tener menos elementos si algunos items no encontraron precio
                                                                itemsWithPrices = currentItems.map((item: any) => {
                                                                    const itemFullName = item.fullName || item.name;
                                                                    const itemName = item.name;
                                                                    
                                                                    console.log(`🔍 [PDF EDIT] Buscando precio para item:`, {
                                                                        itemName,
                                                                        itemFullName
                                                                    });
                                                                    
                                                                    // Estrategia de búsqueda múltiple para encontrar el precio correcto
                                                                    let priceInfo = priceResult.itemPrices?.find(ip => {
                                                                        // 1. Coincidencia exacta con fullName
                                                                        if (ip.name === itemFullName) {
                                                                            console.log(`✅ Match exacto por fullName: ${ip.name} === ${itemFullName}`);
                                                                            return true;
                                                                        }
                                                                        
                                                                        // 2. Coincidencia exacta con name
                                                                        if (ip.name === itemName) {
                                                                            console.log(`✅ Match exacto por name: ${ip.name} === ${itemName}`);
                                                                            return true;
                                                                        }
                                                                        
                                                                        // 3. El precio contiene el fullName del item
                                                                        if (itemFullName && ip.name.includes(itemFullName)) {
                                                                            console.log(`✅ Match parcial: ${ip.name} contiene ${itemFullName}`);
                                                                            return true;
                                                                        }
                                                                        
                                                                        // 4. El fullName del item contiene el nombre del precio
                                                                        if (itemFullName && itemFullName.includes(ip.name)) {
                                                                            console.log(`✅ Match parcial inverso: ${itemFullName} contiene ${ip.name}`);
                                                                            return true;
                                                                        }
                                                                        
                                                                        return false;
                                                                    });
                                                                    
                                                                    if (!priceInfo) {
                                                                        console.error(`❌ [PDF EDIT] No se encontró precio para:`, {
                                                                            itemName,
                                                                            itemFullName,
                                                                            availablePrices: priceResult.itemPrices?.map(p => p.name)
                                                                        });
                                                                    } else {
                                                                        console.log(`✅ [PDF EDIT] Precio encontrado:`, {
                                                                            item: itemFullName || itemName,
                                                                            price: priceInfo.unitPrice,
                                                                            priceEntry: priceInfo.name
                                                                        });
                                                                    }
                                                                    
                                                                    return {
                                                                        ...item,
                                                                        price: priceInfo?.unitPrice || 0,
                                                                        options: [{
                                                                            ...item.options?.[0],
                                                                            price: priceInfo?.unitPrice || 0,
                                                                            quantity: item.options?.[0]?.quantity || 1
                                                                        }]
                                                                    };
                                                                });
                                                            }

                                                            // Preparar los datos para el PDF
                                                            const pdfData = {
                                                                user: {
                                                                    name: editValues.userName || rowData.user?.name || '',
                                                                    lastName: editValues.userLastName || rowData.user?.lastName || '',
                                                                    email: editValues.userEmail || rowData.user?.email || ''
                                                                },
                                                                address: {
                                                                    address: editValues.address?.address || rowData.address?.address || '',
                                                                    city: editValues.address?.city || rowData.address?.city || '',
                                                                    phone: editValues.address?.phone || rowData.address?.phone || ''
                                                                },
                                                                items: itemsWithPrices,
                                                                total: priceResult.total || editValues.total || rowData.total || 0,
                                                                deliveryDay: editValues.deliveryDay || rowData.deliveryDay || '',
                                                                paymentMethod: editValues.paymentMethod || rowData.paymentMethod || '',
                                                                notes: editValues.notes || rowData.notes || ''
                                                            };

                                                            generateMayoristaPDF(pdfData);
                                                        } catch (error) {
                                                            console.error('Error calculando precios para PDF:', error);
                                                            // Fallback: generar PDF sin precios calculados pero con items filtrados
                                                            const rowData = row.original as any;
                                                            const allItems = editValues.items || rowData.items || [];
                                                            
                                                            // Filtrar items válidos en el fallback también
                                                            const { filterValidItems } = await import('../helpers');
                                                            const validItems = filterValidItems(allItems);
                                                            
                                                            const pdfData = {
                                                                user: {
                                                                    name: editValues.userName || rowData.user?.name || '',
                                                                    lastName: editValues.userLastName || rowData.user?.lastName || '',
                                                                    email: editValues.userEmail || rowData.user?.email || ''
                                                                },
                                                                address: {
                                                                    address: editValues.address?.address || rowData.address?.address || '',
                                                                    city: editValues.address?.city || rowData.address?.city || '',
                                                                    phone: editValues.address?.phone || rowData.address?.phone || ''
                                                                },
                                                                items: validItems,
                                                                total: editValues.total || rowData.total || 0,
                                                                deliveryDay: editValues.deliveryDay || rowData.deliveryDay || '',
                                                                paymentMethod: editValues.paymentMethod || rowData.paymentMethod || '',
                                                                notes: editValues.notes || rowData.notes || ''
                                                            };
                                                            generateMayoristaPDF(pdfData);
                                                        }
                                                    }}
                                                    disabled={loading}
                                                    title="Descargar PDF del pedido"
                                                    className="border-green-500 text-green-600 hover:bg-green-50"
                                                >
                                                    <Download className="w-4 h-4" />
                                                </Button>
                                            )}
                                            <Button size="icon" variant="outline" onClick={onCancel} disabled={loading} title="Cancelar edición">
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="flex gap-1 justify-center">
                                            {canEdit && (
                                                <Button size="icon" variant="outline" onClick={() => onEditClick(row)} title="Editar">
                                                    <Pencil className="w-4 h-4" />
                                                </Button>
                                            )}
                                            <Button size="icon" variant="outline" onClick={() => onDuplicate(row)} disabled={loading} title="Duplicar pedido" className="border-blue-500 text-blue-600 hover:bg-blue-50">
                                                <Copy className="w-4 h-4" />
                                            </Button>
                                            {canDelete && (
                                                <Button size="icon" variant="destructive" onClick={() => onDelete(row)} disabled={loading} title="Eliminar">
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            )}
                                            {!canEdit && !canDelete && (
                                                <span className="text-xs text-muted-foreground px-2">Sin permisos</span>
                                            )}
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
            <div className="flex items-center justify-between space-x-2 py-4">
                <div className="flex items-center gap-4">
                    <div className="text-sm text-muted-foreground">
                        Mostrando {table.getRowModel().rows.length} de {total} órdenes.
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Mostrar:</span>
                        <select
                            value={pagination.pageSize}
                            onChange={e => onPaginationChange(0, Number(e.target.value))}
                            className="p-1 text-sm border rounded-md"
                        >
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                            <option value={200}>200</option>
                        </select>
                        <span className="text-sm text-muted-foreground">registros</span>
                    </div>
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

// Función helper para encontrar el producto coincidente
function findMatchingProduct(itemName: string, availableProducts: string[], itemOption?: string): string {
    if (!itemName) return '';

    // Buscar coincidencia exacta primero
    const exactMatch = availableProducts.find(product => product === itemName);
    if (exactMatch) {
        return exactMatch;
    }

    // Buscar coincidencia parcial (case insensitive)
    const normalizedItemName = itemName.toLowerCase();

    // Primero, encontrar todos los productos que coincidan parcialmente
    const allPartialMatches = availableProducts.filter(product => {
        const normalizedProduct = product.toLowerCase();
        // Comprobar si el producto contiene las palabras clave del item
        const itemWords = normalizedItemName.split(' ').filter(word => word.length > 2);
        const matches = itemWords.every(word => normalizedProduct.includes(word));
        return matches;
    });

    if (allPartialMatches.length > 0) {
        // Si hay múltiples coincidencias parciales y tenemos una opción, intentar encontrar la que coincida con la opción
        if (allPartialMatches.length > 1 && itemOption) {
            const normalizedOption = itemOption.toLowerCase();

            const matchingOption = allPartialMatches.find(product => {
                const productLower = product.toLowerCase();
                const hasOption = productLower.includes(normalizedOption);
                return hasOption;
            });

            if (matchingOption) {
                return matchingOption;
            }
        }

        // Si no se encuentra la opción específica o no hay opción, devolver la primera
        return allPartialMatches[0];
    }

    // Buscar por palabras clave específicas para productos normalizados
    const keywordMatches: { [key: string]: string[] } = {
        'gato cordero': ['BOX GATO CORDERO 5KG'],
        'gato pollo': ['BOX GATO POLLO 5KG'],
        'gato vaca': ['BOX GATO VACA 5KG'],
        'perro pollo': ['BOX PERRO POLLO 5KG', 'BOX PERRO POLLO 10KG'],
        'perro vaca': ['BOX PERRO VACA 5KG', 'BOX PERRO VACA 10KG'],
        'perro cerdo': ['BOX PERRO CERDO 5KG', 'BOX PERRO CERDO 10KG'],
        'perro cordero': ['BOX PERRO CORDERO 5KG', 'BOX PERRO CORDERO 10KG'],
        'big dog': ['BIG DOG POLLO 15KG', 'BIG DOG VACA 15KG'],
        'huesos carnosos': ['HUESOS CARNOSOS 5KG'],
        'complementos': ['BOX COMPLEMENTOS 1U'],
    };

    for (const [keyword, products] of Object.entries(keywordMatches)) {
        if (normalizedItemName.includes(keyword)) {
            // Si hay múltiples opciones, intentar encontrar la que coincida con la opción del item
            if (itemOption && products.length > 1) {
                const normalizedOption = itemOption.toLowerCase();
                const matchingOption = products.find(product => {
                    const productLower = product.toLowerCase();
                    const hasOption = productLower.includes(normalizedOption);
                    return hasOption;
                });
                if (matchingOption) return matchingOption;
            }
            // Si no se encuentra la opción específica o no hay opción, devolver la primera
            return products[0];
        }
    }

    // Si no se encuentra coincidencia, devolver el nombre original
    return itemName;
}

function renderEditableCell(cell: any, index: number, editValues: any, onEditValueChange: (field: string, value: any) => void, productSearchFilter: string, onProductSearchChange: (value: string) => void, availableProducts: string[], productsLoading: boolean, isCalculatingPrice?: boolean, onForceRecalculatePrice?: () => void) {
    if (cell.column.id === 'notesOwn') {
        return (
            <TableCell key={cell.id} className="px-0 py-1 border-r border-border">
                <Input
                    value={editValues.notesOwn || ''}
                    onChange={e => onEditValueChange('notesOwn', e.target.value)}
                    className="w-full text-xs text-center"
                />
            </TableCell>
        );
    }

    // Detectar la columna notes de manera más robusta
    if (cell.column.id === 'notes' || cell.column.columnDef.accessorKey === 'notes' || cell.column.id.includes('notes')) {
        return (
            <TableCell key={cell.id} className="px-3 py-3 border-r border-border min-w-[220px] bg-gray-50">
                <div className="space-y-2">
                    {/* Campo para notas generales */}
                    <div>
                        <label className="text-xs font-medium text-gray-700 block mb-1.5">📝 Notas:</label>
                        <Input
                            value={editValues.notes || ''}
                            onChange={e => onEditValueChange('notes', e.target.value)}
                            className="w-full text-xs h-8 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            placeholder="Notas generales..."
                        />
                    </div>

                    {/* Campo para referencia */}
                    <div>
                        <label className="text-xs font-medium text-gray-700 block mb-1.5">📍 Referencia:</label>
                        <Input
                            value={editValues.address?.reference || ''}
                            onChange={e => onEditValueChange('address', { ...editValues.address, reference: e.target.value })}
                            className="w-full text-xs h-8 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            placeholder="Referencia..."
                        />
                    </div>

                    {/* Campo para piso y departamento */}
                    <div>
                        <label className="text-xs font-medium text-gray-700 block mb-1.5">🏢 Piso/Depto:</label>
                        <div className="flex gap-2">
                            <Input
                                value={editValues.address?.floorNumber || ''}
                                onChange={e => onEditValueChange('address', { ...editValues.address, floorNumber: e.target.value })}
                                className="w-1/2 text-xs h-8 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                placeholder="Piso..."
                            />
                            <Input
                                value={editValues.address?.departmentNumber || ''}
                                onChange={e => onEditValueChange('address', { ...editValues.address, departmentNumber: e.target.value })}
                                className="w-1/2 text-xs h-8 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                placeholder="Depto..."
                            />
                        </div>
                    </div>

                    {/* Campo para entre calles */}
                    <div>
                        <label className="text-xs font-medium text-gray-700 block mb-1.5">🚦 Entre calles:</label>
                        <Input
                            value={editValues.address?.betweenStreets || ''}
                            onChange={e => onEditValueChange('address', { ...editValues.address, betweenStreets: e.target.value })}
                            className="w-full text-xs h-8 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            placeholder="Entre calles..."
                        />
                    </div>
                </div>
            </TableCell>
        );
    }

    if (cell.column.id === 'status') {
        const bgColor = getStatusCellBackgroundColor(editValues.status, editValues.paymentMethod);
        return (
            <TableCell key={cell.id} className={`px-0 py-1 border-r border-border ${bgColor}`}>
                <select
                    value={editValues.status}
                    onChange={e => onEditValueChange('status', e.target.value)}
                    className="w-full p-1 text-xs border border-gray-300 rounded-md text-center"
                >
                    {STATUS_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </TableCell>
        );
    }

    if (cell.column.id === 'orderType') {
        return (
            <TableCell key={cell.id} className="px-0 py-1 border-r border-border">
                <select
                    value={editValues.orderType}
                    onChange={e => onEditValueChange('orderType', e.target.value)}
                    className="w-full p-1 text-xs border border-gray-300 rounded-md text-center"
                >
                    {ORDER_TYPE_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </TableCell>
        );
    }

    if (cell.column.id === 'paymentMethod') {
        return (
            <TableCell key={cell.id} className="px-0 py-1 border-r border-border">
                <select
                    value={editValues.paymentMethod}
                    onChange={e => onEditValueChange('paymentMethod', e.target.value)}
                    className="w-full p-1 text-xs border border-gray-300 rounded-md text-center"
                >
                    {PAYMENT_METHOD_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </TableCell>
        );
    }

    if (cell.column.id === 'deliveryDay' || cell.column.id === 'fecha') {
        const bgColor = getDateCellBackgroundColor(editValues.deliveryDay || '');
        return (
            <TableCell key={cell.id} className={`px-0 py-1 border-r border-border ${bgColor}`}>
                <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-700 flex items-center gap-1">
                        Fecha de Entrega
                        <span className="text-red-500">*</span>
                    </label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Input
                                readOnly
                                value={editValues.deliveryDay ? (() => {
                                    // Usar la función helper para crear una fecha local
                                    const date = createLocalDate(editValues.deliveryDay);
                                    return format(date, 'dd/MM/yyyy');
                                })() : ''}
                                placeholder="Seleccionar fecha"
                                className={`w-full text-xs text-center ${!editValues.deliveryDay ? "border-red-500 focus:border-red-500" : ""}`}
                            />
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <div className="flex flex-col">
                                <Calendar
                                    mode="single"
                                    selected={editValues.deliveryDay ? (() => {
                                        // Usar la función helper para crear una fecha local
                                        return createLocalDate(editValues.deliveryDay);
                                    })() : undefined}
                                    onSelect={(date) => {
                                        if (date) {
                                            // Usar la función helper para crear una fecha ISO local
                                            onEditValueChange('deliveryDay', createLocalDateISO(date));
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
                                            onEditValueChange('deliveryDay', createLocalDateISO(today));
                                        }}
                                        className="w-full text-xs"
                                    >
                                        Hoy
                                    </Button>
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>
                    {!editValues.deliveryDay && (
                        <p className="text-xs text-red-500">
                            La fecha de entrega es obligatoria
                        </p>
                    )}
                </div>
            </TableCell>
        );
    }

    if (cell.column.id === 'items') {
        return (
            <TableCell key={cell.id} className="px-0 py-1 border-r border-border">
                <div className="space-y-1">
                    <Input
                        placeholder="Buscar producto..."
                        value={productSearchFilter}
                        onChange={(e) => onProductSearchChange(e.target.value)}
                        className="w-full p-1 text-xs"
                    />
                    {editValues.items?.map((item: any, itemIndex: number) => (
                        <div key={itemIndex} className="space-y-1">
                            <div className="flex gap-1">
                                <select
                                    value={item.fullName || item.name || ''}
                                    onChange={e => {
                                        const newItems = [...editValues.items];
                                        const selectedProductName = e.target.value;

                                        // Crear un item temporal para procesar
                                        const tempItem = {
                                            ...newItems[itemIndex],
                                            name: selectedProductName,
                                            fullName: selectedProductName,
                                            // Resetear las options para que no contengan peso del item anterior
                                            options: [{ name: 'Default', price: 0, quantity: newItems[itemIndex].options?.[0]?.quantity || 1 }]
                                        };

                                        // Procesar solo este item
                                        const processedItem = processSingleItem(tempItem);
                                        newItems[itemIndex] = processedItem;

                                        onEditValueChange('items', newItems);
                                    }}
                                    className="flex-1 p-1 text-xs border border-gray-300 rounded-md text-left bg-white cursor-pointer"
                                    disabled={productsLoading}
                                    style={{
                                        minHeight: '32px',
                                        appearance: 'auto',
                                        WebkitAppearance: 'menulist',
                                        MozAppearance: 'menulist'
                                    }}
                                >
                                    <option value="">
                                        {productsLoading ? 'Cargando productos...' : `Seleccionar producto (${availableProducts.length} disponibles)`}
                                    </option>
                                    {/* Mostrar el producto actual como primera opción si no está en la lista */}
                                    {(item.fullName || item.name) && !availableProducts.includes(item.fullName || item.name) && (
                                        <option key="current-product" value={item.fullName || item.name}>
                                            {(() => {
                                                console.log('🔍 Item actual para mostrar:', {
                                                    itemName: item.name,
                                                    itemFullName: item.fullName,
                                                    itemOptions: item.options,
                                                    itemWeight: item.options?.[0]?.name,
                                                    itemQuantity: item.options?.[0]?.quantity,
                                                    itemPrice: item.options?.[0]?.price,
                                                    availableProducts: availableProducts.slice(0, 3) // Solo primeros 3 para no saturar
                                                });

                                                // Construir el nombre completo con el peso
                                                const baseName = item.fullName || item.name;
                                                const weight = item.options?.[0]?.name;

                                                // Si el peso existe y no está ya incluido en el nombre, agregarlo
                                                if (weight && weight !== 'Default' && !baseName.includes(weight)) {
                                                    return `${baseName} - ${weight}`;
                                                }

                                                return baseName;
                                            })()}
                                        </option>
                                    )}
                                    {availableProducts
                                        .filter(product => product.toLowerCase().includes(productSearchFilter.toLowerCase()))
                                        .map(product => (
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
                                            const newItems = editValues.items.filter((_: any, i: number) => i !== itemIndex);
                                            onEditValueChange('items', newItems);
                                        } else {
                                            const newItems = [...editValues.items];

                                            // Preservar las opciones existentes del item
                                            const existingOptions = newItems[itemIndex].options || [];
                                            const firstOption = existingOptions[0] || { name: 'Default', price: 0, quantity: 1 };

                                            newItems[itemIndex] = {
                                                ...newItems[itemIndex],
                                                options: [{
                                                    ...firstOption,
                                                    quantity: quantity
                                                }]
                                            };
                                            onEditValueChange('items', newItems);
                                        }
                                    }}
                                    className="w-12 p-1 text-xs text-center"
                                    placeholder="Qty"
                                />
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => {
                                        const newItems = editValues.items.filter((_: any, i: number) => i !== itemIndex);
                                        onEditValueChange('items', newItems);
                                    }}
                                    className="h-8 w-8 p-0"
                                    title="Eliminar producto"
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                            const newItems = [...editValues.items, {
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
                            onEditValueChange('items', newItems);
                        }}
                        className="w-full text-xs"
                    >
                        + Agregar Item
                    </Button>
                </div>
            </TableCell >
        );
    }

    // Caso especial para la columna Cliente (user_name) - mostrar nombre y apellido
    if (cell.column.id === 'user_name') {

        return (
            <TableCell key={cell.id} className="px-0 py-1 border-r border-border">
                <div className="space-y-1">
                    <Input
                        placeholder="Nombre"
                        value={editValues.userName || ''}
                        onChange={e => onEditValueChange('userName', e.target.value)}
                        className="w-full p-1 text-xs"
                    />
                    <Input
                        placeholder="Apellido"
                        value={editValues.userLastName || ''}
                        onChange={e => onEditValueChange('userLastName', e.target.value)}
                        className="w-full p-1 text-xs"
                    />
                </div>
            </TableCell>
        );
    }

    // Caso especial para la columna Dirección (address_address) - mostrar dirección y ciudad
    if (cell.column.id === 'address_address') {
        return (
            <TableCell key={cell.id} className="px-0 py-1 border-r border-border">
                <div className="space-y-1">
                    <Input
                        placeholder="Dirección"
                        value={editValues.address?.address || ''}
                        onChange={e => {
                            console.log('🔥 DIRECCION onChange - new value:', e.target.value);
                            console.log('🔥 DIRECCION onChange - current editValues.address:', editValues.address);
                            console.log('🔥 DIRECCION onChange - will call onEditValueChange with:', { ...editValues.address, address: e.target.value });
                            onEditValueChange('address', { ...editValues.address, address: e.target.value });
                        }}
                        className="w-full p-1 text-xs"
                    />
                    <Input
                        placeholder="Ciudad"
                        value={editValues.address?.city || ''}
                        onChange={e => onEditValueChange('address', { ...editValues.address, city: e.target.value })}
                        className="w-full p-1 text-xs"
                    />
                </div>
            </TableCell>
        );
    }

    // Caso especial para la columna Rango Horario (deliveryArea_schedule)
    if (cell.column.id === 'deliveryArea_schedule') {
        return (
            <TableCell key={cell.id} className="px-0 py-1 border-r border-border">
                <Input
                    placeholder="Ej: De 18 a 19:30hs aprox (acepta . o :)"
                    value={editValues.deliveryAreaSchedule || ''}
                    onChange={e => {
                        // No normalizar en tiempo real, solo guardar el valor tal como lo escribe el usuario
                        onEditValueChange('deliveryAreaSchedule', e.target.value);
                    }}
                    className="w-full p-1 text-xs"
                />
                <p className="text-xs text-gray-500 mt-1">
                    Puedes usar . o : para minutos (ej: 18.30 o 18:30). Se normalizará automáticamente al guardar.
                </p>
            </TableCell>
        );
    }

    // Caso especial para la columna Teléfono (address_phone)
    if (cell.column.id === 'address_phone') {
        return (
            <TableCell key={cell.id} className="px-0 py-1 border-r border-border">
                <Input
                    placeholder="Teléfono (ej: 221 123-4567 o 11-1234-5678)"
                    value={editValues.address?.phone || ''}
                    onChange={e => onEditValueChange('address', { ...editValues.address, phone: e.target.value })}
                    className="w-full p-1 text-xs"
                />
                <p className="text-xs text-gray-500 mt-1">
                    Formato: La Plata (221 XXX-XXXX) o CABA/BA (11-XXXX-XXXX / 15-XXXX-XXXX)
                </p>
            </TableCell>
        );
    }

    // Caso especial para la columna Email (user_email)
    if (cell.column.id === 'user_email') {
        return (
            <TableCell key={cell.id} className="px-0 py-1 border-r border-border">
                <Input
                    placeholder="Email"
                    value={editValues.userEmail || ''}
                    onChange={e => onEditValueChange('userEmail', e.target.value)}
                    className="w-full p-1 text-xs"
                />
            </TableCell>
        );
    }

    // Campos de entrada básicos
    const fieldMapping: Record<string, string> = {
        'total': 'total',
        'user_name': 'userName',
        'user_lastName': 'userLastName',
        'user_email': 'userEmail',
        // 'address_address': 'address', // ← REMOVIDO: Conflicto con caso específico
        // 'address_city': 'city',       // ← REMOVIDO: Conflicto con caso específico  
        // 'address_phone': 'phone',     // ← REMOVIDO: Conflicto con caso específico
        'deliveryArea_schedule': 'deliveryAreaSchedule',
        // 'notes': 'notes', // Removido para evitar conflictos con el caso específico
    };

    const fieldKey = fieldMapping[cell.column.id] || cell.column.id;

    if (fieldKey in editValues) {
        // Renderizado especial para el campo total con indicador de cálculo automático
        if (cell.column.id === 'total') {
            return (
                <TableCell key={cell.id} className="px-0 py-1 border-r border-border">
                    <div className="flex items-center gap-1">
                        <Input
                            type="number"
                            value={editValues[fieldKey] === undefined || editValues[fieldKey] === null ? '' : editValues[fieldKey]}
                            placeholder={isCalculatingPrice ? "Calculando..." : "Auto"}
                            onChange={e => {
                                const value = e.target.value;
                                if (value === '') {
                                    onEditValueChange(fieldKey, undefined);
                                } else {
                                    const numValue = Number(value);
                                    if (!isNaN(numValue)) {
                                        onEditValueChange(fieldKey, numValue);
                                    }
                                }
                            }}
                            className={`flex-1 text-xs text-center ${isCalculatingPrice ? 'bg-blue-50 border-blue-300' : ''}`}
                            disabled={isCalculatingPrice}
                        />
                        {onForceRecalculatePrice && (
                            <Button
                                size="icon"
                                variant="outline"
                                onClick={onForceRecalculatePrice}
                                disabled={isCalculatingPrice}
                                title="Recalcular precio automáticamente"
                                className="h-6 w-6 border-blue-500 text-blue-600 hover:bg-blue-50"
                            >
                                <Calculator className="w-3 h-3" />
                            </Button>
                        )}
                    </div>
                </TableCell>
            );
        }

        return (
            <TableCell key={cell.id} className="px-0 py-1 border-r border-border">
                <Input
                    type="text"
                    value={editValues[fieldKey] === undefined ? '' : editValues[fieldKey]}
                    onChange={e => onEditValueChange(fieldKey, e.target.value || undefined)}
                    className="w-full text-xs text-center"
                />
            </TableCell>
        );
    }

    // Renderizado por defecto para campos no editables
    return (
        <TableCell key={cell.id} className="px-0 py-1 border-r border-border text-center">
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
    );
} 