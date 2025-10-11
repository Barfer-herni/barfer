'use server';

import { WhatsAppTemplateSelectorClient } from './WhatsAppTemplateSelectorClient';
import { createWhatsAppTemplate, deleteWhatsAppTemplate } from '@repo/data-services';
import { getCurrentUser } from '@repo/auth/server';
import { revalidatePath } from 'next/cache';
import type { WhatsAppTemplateData } from '@repo/data-services';

interface WhatsAppTemplateSelectorServerProps {
    templates: WhatsAppTemplateData[];
    onTemplateSelect: (content: string) => void;
    selectedContent?: string | null;
    onTemplateCreated?: () => void;
}

export async function WhatsAppTemplateSelectorServer(props: WhatsAppTemplateSelectorServerProps) {
    const handleCreateTemplate = async (name: string, content: string, description?: string) => {

        try {
            const user = await getCurrentUser();
            if (!user) {
                return { success: false, error: 'Usuario no autenticado' };
            }

            const userId = user.id || (user as any)._id;
            if (!userId) {
                return { success: false, error: 'ID de usuario no disponible' };
            }

            await createWhatsAppTemplate(userId, {
                name,
                content,
                description,
                isDefault: false
            });

            revalidatePath('/admin/clients/whatsapp');
            return { success: true };
        } catch (error) {
            console.error('Error al crear template de WhatsApp:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Error desconocido'
            };
        }
    };

    const handleDeleteTemplate = async (templateId: string) => {

        try {
            const user = await getCurrentUser();
            if (!user) {
                return { success: false, error: 'Usuario no autenticado' };
            }

            await deleteWhatsAppTemplate(templateId, user.id || (user as any)._id);

            revalidatePath('/admin/clients/whatsapp');
            return { success: true };
        } catch (error) {
            console.error('Error al eliminar template de WhatsApp:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Error desconocido'
            };
        }
    };

    return (
        <WhatsAppTemplateSelectorClient
            {...props}
        />
    );
} 