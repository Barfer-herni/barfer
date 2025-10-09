import { Suspense } from 'react';
import { getDictionary } from '@repo/internationalization';
import { PermissionGate } from '@repo/auth/components/PermissionGate';
import { ClientStatsServer } from './components/ClientStatsServer';
import { ClientCategoriesWrapper } from './components/ClientCategoriesWrapper';
import { ClientStatsLoading, ClientCategoriesLoading } from './components/LoadingStates';

interface ClientsPageProps {
    params: Promise<{
        locale: string;
    }>;
}

export default async function ClientsPage({ params }: ClientsPageProps) {
    const { locale } = await params;
    const dictionary = await getDictionary(locale);

    return (
        <div className="space-y-6 p-4 sm:p-6">
            {/* Header */}
            <div className="space-y-2">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                    {dictionary.app.admin.clients.title}
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground">
                    {dictionary.app.admin.clients.description}
                </p>
            </div>

            {/* Gestión de Clientes (Analytics) - Requiere permiso específico */}
            <PermissionGate
                permission="clients:view_analytics"
                fallback={
                    <div className="p-6 border rounded-lg bg-muted/50">
                        <p className="text-sm text-muted-foreground text-center">
                            No tienes permisos para ver la gestión de clientes.
                        </p>
                    </div>
                }
            >
                {/* Stats Overview - Carga independiente */}
                <Suspense fallback={<ClientStatsLoading />}>
                    <ClientStatsServer dictionary={dictionary} />
                </Suspense>

                {/* Categories Tabs - Carga independiente */}
                <Suspense fallback={<ClientCategoriesLoading />}>
                    <ClientCategoriesWrapper dictionary={dictionary} />
                </Suspense>
            </PermissionGate>
        </div>
    );
} 