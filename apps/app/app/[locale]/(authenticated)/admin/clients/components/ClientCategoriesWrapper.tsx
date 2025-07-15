import { getClientCategoriesStats } from '@repo/data-services';
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

    return (
        <ClientCategoriesServer
            behaviorCategories={behaviorCategories}
            spendingCategories={spendingCategories}
            dictionary={dictionary}
        />
    );
} 