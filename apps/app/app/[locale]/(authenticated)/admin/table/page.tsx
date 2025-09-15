import { getOrders } from '@repo/data-services/src/services/barfer';
import { getDictionary } from '@repo/internationalization';
import type { Locale } from '@repo/internationalization';
import { columns } from './components/columns';
import { OrdersDataTable } from './components/OrdersDataTable';
import type { PaginationState, SortingState } from '@tanstack/react-table';
import { getCurrentUserWithPermissions } from '@repo/auth/server-permissions';
import { DebugPriceCalculationButton } from './components/DebugPriceCalculationButton';

export default async function TablePage({
    params,
    searchParams,
}: {
    params: Promise<{ locale: Locale }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const { locale } = await params;
    const { page, pageSize, search, sort, from, to, orderType } = await searchParams || { page: '1', pageSize: '50', search: '', sort: 'deliveryDay.desc', from: '', to: '', clientType: '' };

    const currentPage = Number(page) || 1;
    const currentPageSize = Number(pageSize) || 50;
    const currentSearch = (search as string) || '';
    const currentSort = (sort as string) || 'deliveryDay.desc';
    const [sortId, sortOrder] = currentSort.split('.');
    // Convertir cadenas vacías a undefined para que los filtros funcionen correctamente
    const fromDate = (from as string) && (from as string).trim() !== '' ? (from as string) : undefined;
    const toDate = (to as string) && (to as string).trim() !== '' ? (to as string) : undefined;
    const currentOrderType = (orderType as string) && (orderType as string).trim() !== '' ? (orderType as string) : undefined;

    const pagination: PaginationState = {
        pageIndex: currentPage - 1,
        pageSize: currentPageSize,
    };

    const sorting: SortingState = [{
        id: sortId,
        desc: sortOrder === 'desc',
    }];

    // Obtener permisos del usuario para controlar acceso a botones
    const userWithPermissions = await getCurrentUserWithPermissions();
    const canEdit = userWithPermissions?.permissions.includes('table:edit') || false;
    const canDelete = userWithPermissions?.permissions.includes('table:delete') || false;

    const { orders, pageCount, total } = await getOrders({
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
        search: currentSearch,
        sorting,
        from: fromDate,
        to: toDate,
        orderType: currentOrderType,
    });

    const dictionary = await getDictionary(locale);

    return (
        <div className="h-full w-full">
            <div className="mb-5 p-5">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold">
                            {/* TODO: Move to dictionary */}
                            Tabla de Órdenes
                        </h1>
                        <p className="text-muted-foreground">
                            {/* TODO: Move to dictionary */}
                            Una lista de todas las órdenes en el sistema.
                        </p>
                    </div>
                    <DebugPriceCalculationButton />
                </div>
            </div>
            <div>
                <OrdersDataTable
                    columns={columns}
                    data={orders}
                    pageCount={pageCount}
                    total={total}
                    pagination={pagination}
                    sorting={sorting}
                    canEdit={canEdit}
                    canDelete={canDelete}
                />
            </div>
        </div>
    );
} 