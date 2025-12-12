import { getDictionary } from '@repo/internationalization';
import type { Locale } from '@repo/internationalization';
import { ExpressPageClient } from './components/ExpressPageClient';
import { getDeliveryAreasWithPuntoEnvioAction } from './actions';
import { getCurrentUserWithPermissions } from '@repo/auth/server-permissions';
import { columns } from '../table/components/columns';

export default async function GestionEnvioExpressStockPage({
    params,
}: {
    params: Promise<{ locale: Locale }>;
}) {
    const { locale } = await params;
    const dictionary = await getDictionary(locale);
    const deliveryAreasResult = await getDeliveryAreasWithPuntoEnvioAction();
    const deliveryAreas = deliveryAreasResult.success ? (deliveryAreasResult.deliveryAreas || []) : [];

    // Obtener permisos del usuario
    const userWithPermissions = await getCurrentUserWithPermissions();
    const canEdit = userWithPermissions?.permissions.includes('table:edit') || false;
    const canDelete = userWithPermissions?.permissions.includes('table:delete') || false;

    return (
        <ExpressPageClient
            dictionary={dictionary}
            initialDeliveryAreas={deliveryAreas}
            columns={columns}
            canEdit={canEdit}
            canDelete={canDelete}
        />
    );
}

