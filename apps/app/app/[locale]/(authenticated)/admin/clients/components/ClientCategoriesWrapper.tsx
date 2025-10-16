import { getClientCategoriesStats } from '@repo/data-services';
import { getCurrentUserWithPermissions } from '@repo/auth/server-permissions';
import { ClientCategoriesServer } from './ClientCategoriesServer';
import type { Dictionary } from '@repo/internationalization';

interface ClientCategoriesWrapperProps {
    dictionary: Dictionary;
}

/**
 * Server Component wrapper que obtiene las estadísticas de categorías
 * y las pasa al componente cliente interactivo
 */
export async function ClientCategoriesWrapper({ dictionary }: ClientCategoriesWrapperProps) {
    const { behaviorCategories, spendingCategories } = await getClientCategoriesStats();

    // Obtener permisos del usuario actual
    const userWithPermissions = await getCurrentUserWithPermissions();
    const canSendEmail = userWithPermissions?.permissions.includes('clients:send_email') ?? false;
    const canSendWhatsApp = userWithPermissions?.permissions.includes('clients:send_whatsapp') ?? false;

    return (
        <ClientCategoriesServer
            behaviorCategories={behaviorCategories}
            spendingCategories={spendingCategories}
            dictionary={dictionary}
            canSendEmail={canSendEmail}
            canSendWhatsApp={canSendWhatsApp}
        />
    );
} 