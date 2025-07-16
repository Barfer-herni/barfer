import { getDictionary } from '@repo/internationalization';
import { getClientsPaginatedWithStatus, getWhatsAppTemplates } from '@repo/data-services';
import { getCurrentUser } from '@repo/data-services/src/services/authService';
import { WhatsAppClientsViewServer } from './components/WhatsAppClientsViewServer';

interface WhatsAppPageProps {
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

export default async function WhatsAppPage({ params, searchParams }: WhatsAppPageProps) {
    const { locale } = await params;
    const { category, type, visibility, page: pageParam } = await searchParams;

    const user = await getCurrentUser();
    if (!user) {
        throw new Error('Usuario no autenticado');
    }

    const page = parseInt(pageParam || '1', 10);

    const [dictionary, clientsResult, whatsappTemplates] = await Promise.all([
        getDictionary(locale),
        getClientsPaginatedWithStatus({
            category,
            type: type as 'behavior' | 'spending',
            visibility,
            page,
            pageSize: 50
        }),
        getWhatsAppTemplates(user.id)
    ]);

    // Extraer solo los clientes para mantener compatibilidad
    const clients = clientsResult.clients;

    return (
        <WhatsAppClientsViewServer
            category={category}
            type={type}
            visibility={visibility}
            dictionary={dictionary}
            clients={clients}
            whatsappTemplates={whatsappTemplates}
            paginationInfo={{
                totalCount: clientsResult.totalCount,
                totalPages: clientsResult.totalPages,
                currentPage: page,
                hasMore: clientsResult.hasMore
            }}
        />
    );
} 