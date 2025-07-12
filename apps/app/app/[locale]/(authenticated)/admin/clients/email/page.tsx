import { getDictionary } from '@repo/internationalization';
import { getClientsByCategory, getEmailTemplates } from '@repo/data-services';
import { getCurrentUser } from '@repo/data-services/src/services/authService';
import { EmailClientsViewServer } from './components/EmailClientsViewServer';

interface EmailPageProps {
    params: Promise<{
        locale: string;
    }>;
    searchParams: Promise<{
        category?: string;
        type?: string;
        visibility?: 'all' | 'hidden' | 'visible';
    }>;
}

export default async function EmailPage({ params, searchParams }: EmailPageProps) {
    const { locale } = await params;
    const { category, type, visibility } = await searchParams;

    const user = await getCurrentUser();
    if (!user) {
        throw new Error('Usuario no autenticado');
    }

    const [dictionary, clients, emailTemplates] = await Promise.all([
        getDictionary(locale),
        getClientsByCategory(category, type as 'behavior' | 'spending'),
        getEmailTemplates(user.id)
    ]);

    return (
        <EmailClientsViewServer
            category={category}
            type={type}
            visibility={visibility}
            dictionary={dictionary}
            clients={clients}
            emailTemplates={emailTemplates}
        />
    );
} 