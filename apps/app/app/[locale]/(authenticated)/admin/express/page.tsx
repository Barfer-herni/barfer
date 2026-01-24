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

    // Obtener permisos del usuario
    const userWithPermissions = await getCurrentUserWithPermissions();
    const canEdit = userWithPermissions?.permissions.includes('express:edit') || false;
    const canDelete = userWithPermissions?.permissions.includes('express:delete') || false;
    const isAdmin = userWithPermissions?.isAdmin || false;

    // Filtrar puntos de envío: si no es admin, solo mostrar los asignados al usuario
    let filteredPuntosEnvio = puntosEnvio;
    if (!isAdmin && userWithPermissions?.puntoEnvio) {
        const userPuntosEnvio = Array.isArray(userWithPermissions.puntoEnvio)
            ? userWithPermissions.puntoEnvio
            : [userWithPermissions.puntoEnvio]; // Retrocompatibilidad: convertir string a array

        // Normalizar nombres para comparación (trim y case-insensitive)
        const normalizedUserPuntos = userPuntosEnvio.map(p => (p || '').trim().toUpperCase());

        filteredPuntosEnvio = puntosEnvio.filter(p => {
            if (!p.nombre) return false;
            const puntoNombreNormalized = p.nombre.trim().toUpperCase();
            const matches = normalizedUserPuntos.includes(puntoNombreNormalized);
            return matches;
        });

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

