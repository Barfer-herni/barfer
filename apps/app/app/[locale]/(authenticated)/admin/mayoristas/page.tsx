import { getMayoristasAction } from './actions';
import { MayoristasDataTable } from './components/MayoristasDataTable';
import { columns } from './components/columns';
import type { PaginationState, SortingState } from '@tanstack/react-table';

export default async function MayoristasPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const { page, pageSize, search, zona } = await searchParams || {
        page: '1',
        pageSize: '50',
        search: '',
        zona: ''
    };

    const currentPage = Number(page) || 1;
    const currentPageSize = Number(pageSize) || 50;
    const currentSearch = (search as string) || '';
    const currentZona = (zona as string) && (zona as string).trim() !== '' ? (zona as string) : undefined;

    const pagination: PaginationState = {
        pageIndex: currentPage - 1,
        pageSize: currentPageSize,
    };

    const { mayoristas = [], pageCount = 0, total = 0 } = await getMayoristasAction({
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
        search: currentSearch,
        zona: currentZona,
    });

    return (
        <div className="h-full w-full">
            <div className="mb-5 p-5">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold">
                            Puntos de Venta Mayoristas
                        </h1>
                        <p className="text-muted-foreground">
                            Gestión de puntos de venta mayoristas y seguimiento de ventas
                        </p>
                    </div>
                </div>
            </div>
            <div>
                <MayoristasDataTable
                    columns={columns}
                    data={mayoristas}
                    pageCount={pageCount}
                    total={total}
                    pagination={pagination}
                />
            </div>
        </div>
    );
}

