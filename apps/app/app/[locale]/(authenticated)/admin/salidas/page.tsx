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

    // Obtener parámetros de paginación
    const { page, pageSize } = await searchParams || {
        page: '1',
        pageSize: '50',
    };

    const currentPage = Number(page) || 1;
    const currentPageSize = Number(pageSize) || 50;

    // Obtener usuario actual con permisos
    const userWithPermissions = await getCurrentUserWithPermissions();
    const userPermissions = Array.isArray(userWithPermissions?.permissions)
        ? userWithPermissions.permissions.filter((p): p is string => typeof p === 'string')
        : [];

    // Verificar si puede ver estadísticas
    const canViewStats = await canViewSalidaStatistics();

    // Obtener salidas paginadas
    const result = await getSalidasPaginatedAction({
        pageIndex: currentPage - 1,
        pageSize: currentPageSize,
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
            />
        </div>
    );
} 