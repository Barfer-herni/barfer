import { getDictionary } from '@repo/internationalization';
import { getClientsByCategory, getWhatsAppTemplates } from '@repo/data-services';
import { getCurrentUser } from '@repo/data-services/src/services/authService';
import { WhatsAppClientsView } from './components/WhatsAppClientsView';

interface WhatsAppPageProps {
    params: Promise<{
        locale: string;
    }>;
    searchParams: Promise<{
        category?: string;
        type?: string;
        visibility?: 'all' | 'hidden' | 'visible';
    }>;
}

export default async function WhatsAppPage({ params, searchParams }: WhatsAppPageProps) {
    const { locale } = await params;
    const { category, type, visibility } = await searchParams;

    const user = await getCurrentUser();
    if (!user) {
        throw new Error('Usuario no autenticado');
    }

    const [dictionary, clients, whatsappTemplates] = await Promise.all([
        getDictionary(locale),
        getClientsByCategory(category, type as 'behavior' | 'spending'),
        getWhatsAppTemplates(user.id)
    ]);

    return (
        <WhatsAppClientsView
            category={category}
            type={type}
            visibility={visibility}
            dictionary={dictionary}
            clients={clients}
            whatsappTemplates={whatsappTemplates}
        />
    );
} 