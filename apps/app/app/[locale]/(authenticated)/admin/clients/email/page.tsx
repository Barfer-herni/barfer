import { getDictionary } from '@repo/internationalization';
import { getClientsPaginatedWithStatus, getEmailTemplates } from '@repo/data-services';
import { getCurrentUser } from '@repo/data-services/src/services/authService';
import { EmailClientsViewServer } from './components/EmailClientsViewServer';
import { PermissionGate } from '@repo/auth/components/PermissionGate';

interface EmailPageProps {
    params: Promise<{
        locale: string;
    }>;
    searchParams: Promise<{
        category?: string;
        type?: string;
        visibility?: 'all' | 'hidden' | 'visible';
        page?: string;
    }>;
}

export default async function EmailPage({ params, searchParams }: EmailPageProps) {
    const { locale } = await params;
    const { category, type, visibility, page: pageParam } = await searchParams;

    const user = await getCurrentUser();
    if (!user) {
        throw new Error('Usuario no autenticado');
    }

    const page = parseInt(pageParam || '1', 10);

    const userId = user.id || (user as any)._id;

    const [dictionary, clientsResult, emailTemplates] = await Promise.all([
        getDictionary(locale),
        getClientsPaginatedWithStatus({
            category,
            type: type as 'behavior' | 'spending',
            page,
            pageSize: 50
        }),
        getEmailTemplates(userId)
    ]);

    // Extraer solo los clientes para mantener compatibilidad
    const clients = clientsResult.clients;

    return (
        <PermissionGate
            permission="clients:send_email"
            fallback={
                <div className="p-6 border rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground text-center">
                        No tienes permisos para enviar emails a clientes.
                    </p>
                </div>
            }
        >
            <EmailClientsViewServer
                category={category}
                type={type}
                visibility={visibility}
                dictionary={dictionary}
                clients={clients}
                emailTemplates={emailTemplates}
                paginationInfo={{
                    totalCount: clientsResult.totalCount,
                    totalPages: clientsResult.totalPages,
                    currentPage: page,
                    hasMore: clientsResult.hasMore
                }}
            />
        </PermissionGate>
    );
} 