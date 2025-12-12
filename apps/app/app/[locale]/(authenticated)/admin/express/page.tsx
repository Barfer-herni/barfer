import { getDictionary } from '@repo/internationalization';
import type { Locale } from '@repo/internationalization';
import { ExpressPageClient } from './components/ExpressPageClient';
import { getAllPuntosEnvioAction } from './actions';
import { getCurrentUserWithPermissions } from '@repo/auth/server-permissions';
import { columns } from '../table/components/columns';

export default async function GestionEnvioExpressStockPage({
    params,
}: {
    params: Promise<{ locale: Locale }>;
}) {
    const { locale } = await params;
    const dictionary = await getDictionary(locale);
    const puntosEnvioResult = await getAllPuntosEnvioAction();
    const puntosEnvio = puntosEnvioResult.success ? (puntosEnvioResult.puntosEnvio || []) : [];
    
    // Debug en servidor
    console.log('GestionEnvioExpressStockPage - puntosEnvioResult:', JSON.stringify(puntosEnvioResult, null, 2));
    console.log('GestionEnvioExpressStockPage - puntosEnvio:', puntosEnvio);

    // Obtener permisos del usuario
    const userWithPermissions = await getCurrentUserWithPermissions();
    const canEdit = userWithPermissions?.permissions.includes('table:edit') || false;
    const canDelete = userWithPermissions?.permissions.includes('table:delete') || false;

    return (
        <ExpressPageClient
            dictionary={dictionary}
            initialPuntosEnvio={puntosEnvio}
            columns={columns}
            canEdit={canEdit}
            canDelete={canDelete}
        />
    );
}

