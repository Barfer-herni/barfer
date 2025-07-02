'use server';

import { getCurrentUser } from '@repo/auth/server';
import resend, { BulkEmailTemplate } from '@repo/email';
import { keys } from '@repo/email/keys';
// import { getClientsByCategory } from '@repo/data-services';

interface ClientData {
    id: string;
    name: string;
    email: string;
}

export async function sendBulkEmailAction(
    subject: string,
    content: string,
    selectedClients: string[]
) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return { success: false, error: 'Usuario no autenticado' };
        }

        if (!resend) {
            return {
                success: false,
                error: 'Servicio de email no configurado. Configura RESEND_TOKEN en las variables de entorno.'
            };
        }

        const emailKeys = keys();
        // Para el plan gratuito de Resend y sin un dominio verificado,
        // es necesario usar el dominio `resend.dev`.
        const fromEmail = 'Barfer <ventas@barferalimento.com>';

        // Obtener datos de clientes (reales o testing)
        let clientsData: ClientData[];

        if (selectedClients.includes('test-email-1') || selectedClients.includes('test-email-2')) {
            // Modo testing - usar emails específicos
            const testClients = [
                { id: 'test-email-1', name: 'Lucas', email: 'heredialucasfac22@gmail.com' },
                { id: 'test-email-2', name: 'Nicolás', email: 'nicolascaliari28@gmail.com' }
            ];
            clientsData = testClients.filter(client => selectedClients.includes(client.id));
        } else {
            // MODO DE PRUEBA: Se ha desactivado temporalmente el envío a clientes reales.
            clientsData = [];
        }

        if (clientsData.length === 0) {
            return {
                success: false,
                error: 'No se encontraron clientes válidos'
            };
        }

        // 1. Construir los payloads para el envío por lotes
        const emailPayloads = clientsData.map((client) => ({
            from: fromEmail,
            to: [client.email],
            subject: subject,
            react: BulkEmailTemplate({
                clientName: client.name,
                content: content,
            }),
        }));

        // 2. Enviar el lote de emails con un solo llamado a la API
        const { data, error } = await resend.batch.send(emailPayloads);

        // 3. Manejar la respuesta del lote
        if (error) {
            console.error('❌ Error enviando lote de emails:', error);
            return {
                success: false,
                error: `Error al enviar el lote: ${error.message}`,
            };
        }

        const successCount = data?.data.length ?? 0;

        return {
            success: successCount > 0,
            message: `${successCount} emails enviados exitosamente en un lote.`,
        };

    } catch (error) {
        console.error('Error al enviar emails:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido'
        };
    }
} 