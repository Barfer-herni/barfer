import { getDictionary } from '@repo/internationalization';
import type { Locale } from '@repo/internationalization';
import { getSalidasPaginatedAction } from './actions';
import { SalidasPageClient } from './components/SalidasPageClient';
import { getCurrentUserWithPermissions, canViewSalidaStatistics } from '@repo/auth/server-permissions';
import { subDays } from 'date-fns';

interface SalidasPageProps {
    params: Promise<{ locale: Locale }>;
    searchParams: Promise<{ 
        [key: string]: string | string[] | undefined;
        from?: string;
        to?: string;
        preset?: string;
    }>;
}

export default async function SalidasPage({ params, searchParams }: SalidasPageProps) {
    const { locale } = await params;
    const dictionary = await getDictionary(locale);

    // Obtener todos los parámetros de búsqueda
    const searchParamsResolved = await searchParams || {};

    // Parámetros de paginación
    const currentPage = Number(searchParamsResolved.page) || 1;
    const currentPageSize = Number(searchParamsResolved.pageSize) || 50;

    // Convertir searchParams a fechas o usar un rango por defecto
    const dateFilter = searchParamsResolved.from && searchParamsResolved.to ? {
        from: new Date(searchParamsResolved.from + 'T00:00:00.000Z'),
        to: new Date(searchParamsResolved.to + 'T23:59:59.999Z')
    } : {
        // Por defecto: últimos 30 días
        from: subDays(new Date(), 30),
        to: new Date()
    };

    // Parámetros de filtros
    const filters: {
        searchTerm?: string;
        categoriaId?: string;
        metodoPagoId?: string;
        tipo?: 'ORDINARIO' | 'EXTRAORDINARIO';
        tipoRegistro?: 'BLANCO' | 'NEGRO';
        fechaDesde?: Date;
        fechaHasta?: Date;
    } = {
        searchTerm: typeof searchParamsResolved.searchTerm === 'string' ? searchParamsResolved.searchTerm : undefined,
        categoriaId: typeof searchParamsResolved.categoriaId === 'string' ? searchParamsResolved.categoriaId : undefined,
        metodoPagoId: typeof searchParamsResolved.metodoPagoId === 'string' ? searchParamsResolved.metodoPagoId : undefined,
        tipo: (searchParamsResolved.tipo === 'ORDINARIO' || searchParamsResolved.tipo === 'EXTRAORDINARIO')
            ? searchParamsResolved.tipo as 'ORDINARIO' | 'EXTRAORDINARIO'
            : undefined,
        tipoRegistro: (searchParamsResolved.tipoRegistro === 'BLANCO' || searchParamsResolved.tipoRegistro === 'NEGRO')
            ? searchParamsResolved.tipoRegistro as 'BLANCO' | 'NEGRO'
            : undefined,
        fechaDesde: dateFilter.from,
        fechaHasta: dateFilter.to,
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