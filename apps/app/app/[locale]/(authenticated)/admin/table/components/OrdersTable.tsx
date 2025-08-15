'use client';

import { useRef, useEffect } from 'react';
import {
    flexRender,
    getCoreRowModel,
    getSortedRowModel,
    useReactTable,
    type Table as TanstackTable,
} from '@tanstack/react-table';
import { Pencil, Save, Trash2, X } from 'lucide-react';

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
    createLocalDateISO
} from '../helpers';
import type { DataTableProps } from '../types';

interface OrdersTableProps<TData extends { _id: string }, TValue> extends DataTableProps<TData, TValue> {
    editingRowId: string | null;
    editValues: any;
    loading: boolean;
    rowSelection: Record<string, boolean>;
    productSearchFilter: string;
    canEdit?: boolean;
    canDelete?: boolean;
    onEditClick: (row: any) => void;
    onCancel: () => void;
    onSave: (row: any) => void;
    onDelete: (row: any) => void;
    onEditValueChange: (field: string, value: any) => void;
    onRowSelectionChange: (selection: Record<string, boolean>) => void;
    onProductSearchChange: (value: string) => void;
    onPaginationChange: (pageIndex: number, pageSize: number) => void;
    onSortingChange: (sorting: any) => void;
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
    onEditClick,
    onCancel,
    onSave,
    onDelete,
    onEditValueChange,
    onRowSelectionChange,
    onProductSearchChange,
    onPaginationChange,
    onSortingChange,
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
                                                asc: ' 🔼',
                                                desc: ' 🔽',
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
                                        return renderEditableCell(cell, index, editValues, onEditValueChange, productSearchFilter, onProductSearchChange);
                                    }

                                    // Aplicar color de fondo para celdas específicas
                                    const dateBgColor = (cell.column.id === 'deliveryDay' || cell.column.id === 'fecha')
                                        ? getDateCellBackgroundColor((row.original as any).deliveryDay)
                                        : '';

                                    const statusBgColor = cell.column.id === 'status'
                                        ? getStatusCellBackgroundColor((row.original as any).status, (row.original as any).paymentMethod)
                                        : '';

                                    return (
                                        <TableCell
                                            key={cell.id}
                                            className={`px-0 py-1 border-r border-border ${dateBgColor} ${statusBgColor} text-center${dateBgColor ? ' force-dark-black' : ''}`}
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
                                        <div className="flex gap-2 justify-center">
                                            {canEdit && (
                                                <Button size="icon" variant="default" onClick={() => onSave(row)} disabled={loading}>
                                                    <Save className="w-4 h-4" />
                                                </Button>
                                            )}
                                            <Button size="icon" variant="outline" onClick={onCancel} disabled={loading}>
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="flex gap-2 justify-center">
                                            {canEdit && (
                                                <Button size="icon" variant="outline" onClick={() => onEditClick(row)}>
                                                    <Pencil className="w-4 h-4" />
                                                </Button>
                                            )}
                                            {canDelete && (
                                                <Button size="icon" variant="destructive" onClick={() => onDelete(row)} disabled={loading}>
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
                <div className="text-sm text-muted-foreground">
                    Mostrando {table.getRowModel().rows.length} de {total} órdenes.
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
function findMatchingProduct(itemName: string, availableProducts: string[]): string {
    if (!itemName) return '';

    // Buscar coincidencia exacta primero
    const exactMatch = availableProducts.find(product => product === itemName);
    if (exactMatch) return exactMatch;

    // Buscar coincidencia parcial (case insensitive)
    const normalizedItemName = itemName.toLowerCase();
    const partialMatch = availableProducts.find(product => {
        const normalizedProduct = product.toLowerCase();
        // Comprobar si el producto contiene las palabras clave del item
        const itemWords = normalizedItemName.split(' ').filter(word => word.length > 2);
        return itemWords.every(word => normalizedProduct.includes(word));
    });

    if (partialMatch) return partialMatch;

    // Buscar por palabras clave específicas
    const keywordMatches: { [key: string]: string[] } = {
        'gato cordero': ['Barfer box Gato Cordero 5kg'],
        'gato pollo': ['Barfer box Gato Pollo 5kg'],
        'gato vaca': ['Barfer box Gato Vaca 5kg'],
        'perro pollo': ['Barfer box Perro Pollo 5kg', 'Barfer box Perro Pollo 10kg'],
        'perro vaca': ['Barfer box Perro Vaca 5kg', 'Barfer box Perro Vaca 10kg'],
        'perro cerdo': ['Barfer box Perro Cerdo 5kg', 'Barfer box Perro Cerdo 10kg'],
        'perro cordero': ['Barfer box Perro Cordero 5kg', 'Barfer box Perro Cordero 10kg'],
        'big dog': ['BIG DOG (15kg) - POLLO', 'BIG DOG (15kg) - VACA'],
    };

    for (const [keyword, products] of Object.entries(keywordMatches)) {
        if (normalizedItemName.includes(keyword)) {
            // Si hay múltiples opciones, devolver la primera (5kg por defecto)
            return products[0];
        }
    }

    // Si no se encuentra coincidencia, devolver el nombre original
    return itemName;
}

function renderEditableCell(cell: any, index: number, editValues: any, onEditValueChange: (field: string, value: any) => void, productSearchFilter: string, onProductSearchChange: (value: string) => void) {
    if (cell.column.id === 'notesOwn') {
        console.log('Matched notesOwn condition');
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
        console.log('Matched status condition');
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
        console.log('Matched orderType condition');
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
        console.log('Matched paymentMethod condition');
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
        console.log('Matched deliveryDay condition');
        const bgColor = getDateCellBackgroundColor(editValues.deliveryDay || '');
        return (
            <TableCell key={cell.id} className={`px-0 py-1 border-r border-border ${bgColor}`}>
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
                            className="w-full text-xs text-center"
                        />
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
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
                    </PopoverContent>
                </Popover>
            </TableCell>
        );
    }

    if (cell.column.id === 'items') {
        console.log('Matched items condition');
        console.log('renderEditableCell - editValues.items:', editValues.items);
        console.log('renderEditableCell - available products:', getFilteredProducts(editValues.orderType, productSearchFilter));
        console.log('renderEditableCell - orderType:', editValues.orderType);
        console.log('renderEditableCell - productSearchFilter:', productSearchFilter);

        editValues.items?.forEach((item: any, index: number) => {
            console.log(`renderEditableCell - Item ${index} FULL:`, item);
            console.log(`renderEditableCell - Item ${index} ANALYSIS:`, {
                id: item.id,
                name: item.name,
                options: item.options,
                hasName: !!item.name,
                hasId: !!item.id,
                nameValue: item.name,
                idValue: item.id,
                selectValue: item.name || item.id || '',
                quantity: item.options?.[0]?.quantity,
                allKeys: Object.keys(item || {}),
                rawItem: JSON.stringify(item)
            });
        });
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
                                    value={findMatchingProduct(item.name || item.id || '', getFilteredProducts(editValues.orderType, productSearchFilter))}
                                    onChange={e => {
                                        const newItems = [...editValues.items];
                                        newItems[itemIndex] = {
                                            ...newItems[itemIndex],
                                            name: e.target.value,
                                            id: e.target.value
                                        };
                                        onEditValueChange('items', newItems);
                                    }}
                                    className="flex-1 p-1 text-xs border border-gray-300 rounded-md text-center"
                                >
                                    <option value="">Seleccionar producto</option>
                                    {getFilteredProducts(editValues.orderType, productSearchFilter).map(product => (
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
                                            newItems[itemIndex] = {
                                                ...newItems[itemIndex],
                                                options: [{
                                                    ...newItems[itemIndex].options?.[0],
                                                    quantity: quantity
                                                }]
                                            };
                                            onEditValueChange('items', newItems);
                                        }
                                    }}
                                    className="w-12 p-1 text-xs text-center"
                                    placeholder="Qty"
                                />
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
            </TableCell>
        );
    }

    // Caso especial para la columna Cliente (user_name) - mostrar nombre y apellido
    if (cell.column.id === 'user_name') {
        console.log('Matched user_name condition');
        console.log('Rendering user_name cell - editValues.userName:', editValues.userName, 'editValues.userLastName:', editValues.userLastName);
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
        console.log('Matched address_address condition');
        console.log('Rendering address_address cell - editValues.address:', editValues.address, 'editValues.city:', editValues.city);
        return (
            <TableCell key={cell.id} className="px-0 py-1 border-r border-border">
                <div className="space-y-1">
                    <Input
                        placeholder="Dirección"
                        value={editValues.address || ''}
                        onChange={e => onEditValueChange('address', e.target.value)}
                        className="w-full p-1 text-xs"
                    />
                    <Input
                        placeholder="Ciudad"
                        value={editValues.city || ''}
                        onChange={e => onEditValueChange('city', e.target.value)}
                        className="w-full p-1 text-xs"
                    />
                </div>
            </TableCell>
        );
    }

    // Caso especial para la columna Rango Horario (deliveryArea_schedule)
    if (cell.column.id === 'deliveryArea_schedule') {
        console.log('Matched deliveryArea_schedule condition');
        console.log('Rendering deliveryArea_schedule cell - editValues.deliveryAreaSchedule:', editValues.deliveryAreaSchedule);
        return (
            <TableCell key={cell.id} className="px-0 py-1 border-r border-border">
                <Input
                    placeholder="Ej: Lunes a Viernes de 10hs a 17hs"
                    value={editValues.deliveryAreaSchedule || ''}
                    onChange={e => onEditValueChange('deliveryAreaSchedule', e.target.value)}
                    className="w-full p-1 text-xs"
                />
            </TableCell>
        );
    }

    // Caso especial para la columna Teléfono (address_phone)
    if (cell.column.id === 'address_phone') {
        console.log('Matched address_phone condition');
        console.log('Rendering address_phone cell - editValues.phone:', editValues.phone);
        return (
            <TableCell key={cell.id} className="px-0 py-1 border-r border-border">
                <Input
                    placeholder="Teléfono"
                    value={editValues.phone || ''}
                    onChange={e => onEditValueChange('phone', e.target.value)}
                    className="w-full p-1 text-xs"
                />
            </TableCell>
        );
    }

    // Caso especial para la columna Email (user_email)
    if (cell.column.id === 'user_email') {
        console.log('Matched user_email condition');
        console.log('Rendering user_email cell - editValues.userEmail:', editValues.userEmail);
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
        'address_address': 'address',
        'address_city': 'city',
        'address_phone': 'phone',
        'deliveryArea_schedule': 'deliveryAreaSchedule',
        // 'notes': 'notes', // Removido para evitar conflictos con el caso específico
    };

    const fieldKey = fieldMapping[cell.column.id] || cell.column.id;
    console.log('General mapping - cell.column.id:', cell.column.id, 'fieldKey:', fieldKey, 'fieldKey in editValues:', fieldKey in editValues);
    console.log('All editValues keys:', Object.keys(editValues));

    if (fieldKey in editValues) {
        console.log('Using general mapping for:', cell.column.id, 'with fieldKey:', fieldKey);
        return (
            <TableCell key={cell.id} className="px-0 py-1 border-r border-border">
                <Input
                    type={cell.column.id === 'total' ? 'number' : 'text'}
                    value={editValues[fieldKey] || ''}
                    onChange={e => onEditValueChange(fieldKey, e.target.value)}
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