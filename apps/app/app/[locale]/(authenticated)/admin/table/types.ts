import type { ColumnDef, SortingState, PaginationState } from '@tanstack/react-table';

export interface DataTableProps<TData extends { _id: string }, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    pageCount: number;
    total: number;
    pagination: PaginationState;
    sorting: SortingState;
    canEdit?: boolean;
    canDelete?: boolean;
    onOrderUpdated?: () => void | Promise<void>;
}

export interface EditValues {
    notes: string;
    notesOwn: string;
    status: string;
    orderType: 'minorista' | 'mayorista';
    address: {
        reference: string;
        floorNumber: string;
        departmentNumber: string;
        betweenStreets: string;
        address: string;
        city: string;
        phone: string;
    };
    city: string;
    phone: string;
    paymentMethod: string;
    userName: string;
    userLastName: string;
    userEmail: string;
    total: number;
    subTotal: number;
    shippingPrice: number;
    deliveryAreaSchedule: string;
    items: any[];
    deliveryDay: string;
}

export interface CreateFormData {
    status: string;
    total: number;
    subTotal: number;
    shippingPrice: number;
    notes: string;
    notesOwn: string;
    paymentMethod: string;
    orderType: 'minorista' | 'mayorista';
    address: {
        address: string;
        city: string;
        phone: string;
        betweenStreets: string;
        floorNumber: string;
        departmentNumber: string;
    };
    user: {
        name: string;
        lastName: string;
        email: string;
    };
    items: any[];
    deliveryArea: {
        _id: string;
        description: string;
        coordinates: any[];
        schedule: string;
        orderCutOffHour: number;
        enabled: boolean;
        sameDayDelivery: boolean;
        sameDayDeliveryDays: any[];
        whatsappNumber: string;
        sheetName: string;
    };
    deliveryDay: string;
}

export interface ExportParams {
    search?: string;
    from?: string;
    to?: string;
    orderType?: string;
} 