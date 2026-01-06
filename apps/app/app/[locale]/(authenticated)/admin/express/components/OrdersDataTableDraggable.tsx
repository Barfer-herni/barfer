'use client';

import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { OrdersDataTable } from '../../table/components/OrdersDataTable';
import type { DataTableProps } from '../../table/types';

interface OrdersDataTableDraggableProps<TData extends { _id: string }, TValue> extends DataTableProps<TData, TValue> {
    onDragEnd: (event: DragEndEvent) => void;
    isDragDisabled?: boolean;
}

export function OrdersDataTableDraggable<TData extends { _id: string }, TValue>({
    onDragEnd,
    isDragDisabled = false,
    ...props
}: OrdersDataTableDraggableProps<TData, TValue>) {
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // Requiere mover 8px antes de activar el drag (evita clicks accidentales)
            },
        }),
        useSensor(KeyboardSensor)
    );

    // Crear array de IDs para SortableContext
    const itemIds = props.data.map((item) => String(item._id));

    if (isDragDisabled) {
        // Si el drag está deshabilitado, renderizar la tabla normal
        return <OrdersDataTable {...props} />;
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={onDragEnd}
            modifiers={[restrictToVerticalAxis]}
        >
            <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
                <OrdersDataTable {...props} />
            </SortableContext>
        </DndContext>
    );
}

