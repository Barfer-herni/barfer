import { getDictionary } from '@repo/internationalization';
import type { Locale } from '@repo/internationalization';
import { ExpressPageClient } from './components/ExpressPageClient';
import { getAllPuntosEnvioAction } from './actions';
import { getCurrentUserWithPermissions, requirePermission } from '@repo/auth/server-permissions';

export default async function GestionEnvioExpressStockPage({
    params,
}: {
    params: Promise<{ locale: Locale }>;
}) {
    const { locale } = await params;
    
    // Verificar permiso de acceso
    await requirePermission('express:view');
    
    const dictionary = await getDictionary(locale);
    const puntosEnvioResult = await getAllPuntosEnvioAction();
    const puntosEnvio = puntosEnvioResult.success ? (puntosEnvioResult.puntosEnvio || []) : [];
    
    // Debug en servidor
    console.log('GestionEnvioExpressStockPage - puntosEnvioResult:', JSON.stringify(puntosEnvioResult, null, 2));
    console.log('GestionEnvioExpressStockPage - puntosEnvio:', puntosEnvio);

    // Obtener permisos del usuario
    const userWithPermissions = await getCurrentUserWithPermissions();
    const canEdit = userWithPermissions?.permissions.includes('express:edit') || false;
    const canDelete = userWithPermissions?.permissions.includes('express:delete') || false;
    const isAdmin = userWithPermissions?.isAdmin || false;
    
    // Filtrar puntos de envío: si no es admin, solo mostrar el asignado al usuario
    let filteredPuntosEnvio = puntosEnvio;
    if (!isAdmin && userWithPermissions?.puntoEnvio) {
        const userPuntoEnvio = userWithPermissions.puntoEnvio;
        filteredPuntosEnvio = puntosEnvio.filter(p => p.nombre === userPuntoEnvio);
    } else if (!isAdmin) {
        // Si no es admin y no tiene punto de envío asignado, mostrar array vacío
        filteredPuntosEnvio = [];
    }

    return (
        <ExpressPageClient
            dictionary={dictionary}
            initialPuntosEnvio={filteredPuntosEnvio}
            canEdit={canEdit}
            canDelete={canDelete}
            isAdmin={isAdmin}
        />
    );
}

