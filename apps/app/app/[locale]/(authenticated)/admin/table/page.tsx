import { getOrders } from '@repo/data-services/src/services/barfer';
import { getDictionary } from '@repo/internationalization';
import type { Locale } from '@repo/internationalization';
import { columns } from './components/columns';
import { OrdersDataTable } from './components/OrdersDataTable';
import type { PaginationState, SortingState } from '@tanstack/react-table';

export default async function TablePage({
    params,
    searchParams,
}: {
    params: Promise<{ locale: Locale }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const { locale } = await params;
    const { page, pageSize, search, sort, from, to, orderType } = await searchParams || { page: '1', pageSize: '50', search: '', sort: 'createdAt.desc', from: '', to: '', clientType: '' };

    const currentPage = Number(page) || 1;
    const currentPageSize = Number(pageSize) || 50;
    const currentSearch = (search as string) || '';
    const currentSort = (sort as string) || 'createdAt.desc';
    const [sortId, sortOrder] = currentSort.split('.');
    const fromDate = from as string | undefined;
    const toDate = to as string | undefined;
    const currentOrderType = (orderType as string) || '';

    const pagination: PaginationState = {
        pageIndex: currentPage - 1,
        pageSize: currentPageSize,
    };

    const sorting: SortingState = [{
        id: sortId,
        desc: sortOrder === 'desc',
    }];

    const { orders, pageCount, total } = await getOrders({
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
        search: currentSearch,
        sorting,
        from: fromDate,
        to: toDate,
        orderType: currentOrderType,
    });
    //mmm
    const dictionary = await getDictionary(locale);

    return (
        <div className="h-full w-full">
            <div className="mb-5 p-5">
                <h1 className="text-2xl font-bold">
                    {/* TODO: Move to dictionary */}
                    Tabla de Órdenes
                </h1>
                <p className="text-muted-foreground">
                    {/* TODO: Move to dictionary */}
                    Una lista de todas las órdenes en el sistema.
                </p>
            </div>
            <div>
                <OrdersDataTable
                    columns={columns}
                    data={orders}
                    pageCount={pageCount}
                    total={total}
                    pagination={pagination}
                    sorting={sorting}
                />
            </div>
        </div>
    );
} 