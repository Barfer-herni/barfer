'use server';

import { getCurrentUser } from '@repo/auth/server';
import resend, { BulkEmailTemplate } from '@repo/email';
import { keys } from '@repo/email/keys';
import { createScheduledEmailCampaign, createEmailTemplate, deleteEmailTemplate, getClientsByCategory } from '@repo/data-services';
import { revalidatePath } from 'next/cache';
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

        if (!selectedClients || selectedClients.length === 0) {
            return {
                success: false,
                error: 'No se ha seleccionado ningún cliente.'
            };
        }

        // Para el plan gratuito de Resend y sin un dominio verificado,
        // es necesario usar el dominio `resend.dev`.
        const fromEmail = 'Barfer <ventas@barferalimento.com>';

        // 1. Construir los payloads para el envío por lotes
        const emailPayloads = selectedClients.map((client) => {
            return {
                from: fromEmail,
                to: [client],
                subject: subject,
                react: BulkEmailTemplate({
                    clientName: client,
                    content: content,
                }),
            }
        });

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

export async function scheduleEmailCampaignAction(
    campaignName: string,
    scheduleCron: string,
    targetAudience: { type: 'behavior' | 'spending'; category: string },
    emailTemplateId: string
) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return { success: false, error: 'Usuario no autenticado' };
        }

        const userId = user.id || (user as any)._id;
        if (!userId) {
            return { success: false, error: 'ID de usuario no disponible' };
        }

        await createScheduledEmailCampaign(userId, {
            name: campaignName,
            scheduleCron: scheduleCron,
            targetAudience: targetAudience,
            status: 'ACTIVE',
            emailTemplate: {
                connect: {
                    id: emailTemplateId,
                },
            },
        });

        // Revalidar la ruta para que en el futuro se puedan ver las campañas creadas
        revalidatePath('/admin/clients/email');

        return { success: true, message: 'Campaña programada exitosamente.' };

    } catch (error) {
        console.error('Error al programar la campaña:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido',
        };
    }
}

export async function createEmailTemplateAction(
    name: string,
    subject: string,
    content: string,
    description?: string
) {
    "use server"
    try {
        const user = await getCurrentUser();
        if (!user) {
            return { success: false, error: 'Usuario no autenticado' };
        }

        const userId = user.id || (user as any)._id;
        if (!userId) {
            return { success: false, error: 'ID de usuario no disponible' };
        }

        await createEmailTemplate(userId, {
            name,
            subject,
            content,
            description,
            isDefault: false
        });

        revalidatePath('/admin/clients/email');
        return { success: true };
    } catch (error) {
        console.error('Error al crear template de email:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido'
        };
    }
}

export async function deleteEmailTemplateAction(templateId: string) {
    "use server"
    try {
        const user = await getCurrentUser();
        if (!user) {
            return { success: false, error: 'Usuario no autenticado' };
        }

        const userId = user.id || (user as any)._id;
        if (!userId) {
            return { success: false, error: 'ID de usuario no disponible' };
        }

        await deleteEmailTemplate(templateId, userId);

        revalidatePath('/admin/clients/email');
        return { success: true };
    } catch (error) {
        console.error('Error al eliminar template de email:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido'
        };
    }
} 