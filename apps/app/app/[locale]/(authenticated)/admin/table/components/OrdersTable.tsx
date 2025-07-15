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
    getStatusCellBackgroundColor
} from '../helpers';
import type { DataTableProps } from '../types';

interface OrdersTableProps<TData extends { _id: string }, TValue> extends DataTableProps<TData, TValue> {
    editingRowId: string | null;
    editValues: any;
    loading: boolean;
    rowSelection: Record<string, boolean>;
    productSearchFilter: string;
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
                                            <Button size="icon" variant="default" onClick={() => onSave(row)} disabled={loading}>
                                                <Save className="w-4 h-4" />
                                            </Button>
                                            <Button size="icon" variant="outline" onClick={onCancel} disabled={loading}>
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="flex gap-2 justify-center">
                                            <Button size="icon" variant="outline" onClick={() => onEditClick(row)}>
                                                <Pencil className="w-4 h-4" />
                                            </Button>
                                            <Button size="icon" variant="destructive" onClick={() => onDelete(row)} disabled={loading}>
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
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

function renderEditableCell(cell: any, index: number, editValues: any, onEditValueChange: (field: string, value: any) => void, productSearchFilter: string, onProductSearchChange: (value: string) => void) {
    if (cell.column.id === 'notesOwn') {
        return (
            <TableCell key={cell.id} className="px-0 py-1 border-r border-border">
                <Input
                    value={editValues.notesOwn}
                    onChange={e => onEditValueChange('notesOwn', e.target.value)}
                    className="w-full text-xs text-center"
                />
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
                <Popover>
                    <PopoverTrigger asChild>
                        <Input
                            readOnly
                            value={editValues.deliveryDay ? format(new Date(editValues.deliveryDay), 'dd/MM/yyyy') : ''}
                            placeholder="Seleccionar fecha"
                            className="w-full text-xs text-center"
                        />
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar
                            mode="single"
                            selected={editValues.deliveryDay ? new Date(editValues.deliveryDay) : undefined}
                            onSelect={(date) => {
                                if (date) {
                                    onEditValueChange('deliveryDay', date.toISOString());
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
                        <div key={itemIndex} className="flex gap-1">
                            <select
                                value={item.name || ''}
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

    // Campos de entrada básicos
    const fieldMapping: Record<string, string> = {
        'total': 'total',
        'user.name': 'userName',
        'user.email': 'userEmail',
        'address.address': 'address',
        'address.phone': 'phone',
        'deliveryArea.schedule': 'deliveryAreaSchedule',
        'notes': 'notes',
    };

    const fieldKey = fieldMapping[cell.column.id] || cell.column.id;

    if (fieldKey in editValues) {
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