import { getDictionary } from '@repo/internationalization';
import type { Locale } from '@repo/internationalization';
import { getSalidasPaginatedAction } from './actions';
import { SalidasPageClient } from './components/SalidasPageClient';
import { getCurrentUserWithPermissions, canViewSalidaStatistics } from '@repo/auth/server-permissions';

interface SalidasPageProps {
    params: Promise<{ locale: Locale }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function SalidasPage({ params, searchParams }: SalidasPageProps) {
    const { locale } = await params;
    const dictionary = await getDictionary(locale);

    // Obtener todos los parámetros de búsqueda
    const searchParamsResolved = await searchParams || {};

    // Parámetros de paginación
    const currentPage = Number(searchParamsResolved.page) || 1;
    const currentPageSize = Number(searchParamsResolved.pageSize) || 50;

    // Parámetros de filtros
    const filters: {
        searchTerm?: string;
        categoriaId?: string;
        marca?: string;
        metodoPagoId?: string;
        tipo?: 'ORDINARIO' | 'EXTRAORDINARIO';
        tipoRegistro?: 'BLANCO' | 'NEGRO';
        fecha?: string;
    } = {
        searchTerm: typeof searchParamsResolved.searchTerm === 'string' ? searchParamsResolved.searchTerm : undefined,
        categoriaId: typeof searchParamsResolved.categoriaId === 'string' ? searchParamsResolved.categoriaId : undefined,
        marca: typeof searchParamsResolved.marca === 'string' ? searchParamsResolved.marca : undefined,
        metodoPagoId: typeof searchParamsResolved.metodoPagoId === 'string' ? searchParamsResolved.metodoPagoId : undefined,
        tipo: (searchParamsResolved.tipo === 'ORDINARIO' || searchParamsResolved.tipo === 'EXTRAORDINARIO')
            ? searchParamsResolved.tipo as 'ORDINARIO' | 'EXTRAORDINARIO'
            : undefined,
        tipoRegistro: (searchParamsResolved.tipoRegistro === 'BLANCO' || searchParamsResolved.tipoRegistro === 'NEGRO')
            ? searchParamsResolved.tipoRegistro as 'BLANCO' | 'NEGRO'
            : undefined,
        fecha: typeof searchParamsResolved.fecha === 'string' ? searchParamsResolved.fecha : undefined,
    };

    // Obtener usuario actual con permisos
    const userWithPermissions = await getCurrentUserWithPermissions();
    const userPermissions = Array.isArray(userWithPermissions?.permissions)
        ? userWithPermissions.permissions.filter((p): p is string => typeof p === 'string')
        : [];

    // Verificar si puede ver estadísticas
    const canViewStats = await canViewSalidaStatistics();

    // Obtener salidas paginadas con filtros
    const result = await getSalidasPaginatedAction({
        pageIndex: currentPage - 1,
        pageSize: currentPageSize,
        filters,
    });

    const salidas = result.success ? (result.salidas || []) : [];
    const total = result.total || 0;
    const pageCount = result.pageCount || 0;

    return (
        <div className="h-full w-full">
            <div className="mb-5 p-5">
                <h1 className="text-2xl font-bold">
                    Gestión de Salidas
                </h1>
                <p className="text-muted-foreground">
                    Administra y visualiza todas las salidas de dinero del negocio.
                </p>
            </div>

            <SalidasPageClient
                salidas={salidas}
                dictionary={dictionary}
                userPermissions={userPermissions}
                canViewStatistics={canViewStats}
                pagination={{
                    pageIndex: currentPage - 1,
                    pageSize: currentPageSize,
                }}
                pageCount={pageCount}
                total={total}
                initialFilters={filters}
            />
        </div>
    );
} 