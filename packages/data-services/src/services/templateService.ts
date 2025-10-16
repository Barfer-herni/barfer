'use server';

import { revalidatePath } from 'next/cache';
import { getCollection, ObjectId } from '@repo/database';
import type {
    EmailTemplateData,
    WhatsAppTemplateData,
    CreateEmailTemplateData,
    CreateWhatsAppTemplateData,
    UpdateEmailTemplateData,
    UpdateWhatsAppTemplateData
} from '../types/template';

// ==========================================
// EMAIL TEMPLATES
// ==========================================

/**
 * Obtener todos los templates de email del usuario
 */
export async function getEmailTemplates(userId: string): Promise<EmailTemplateData[]> {
    try {
        const collection = await getCollection('email_templates');

        const templates = await collection
            .find({
                $or: [
                    { createdBy: userId },
                    { isDefault: true }
                ]
            })
            .sort({ isDefault: -1, createdAt: -1 }) // Templates por defecto primero
            .toArray();

        return templates.map(template => ({
            id: template._id.toString(),
            name: template.name,
            subject: template.subject,
            content: template.content,
            description: template.description,
            isDefault: template.isDefault,
            createdBy: template.createdBy,
            createdAt: template.createdAt,
            updatedAt: template.updatedAt
        }));
    } catch (error) {
        console.error('Error al obtener templates de email:', error);
        throw new Error('No se pudieron obtener los templates de email');
    }
}

/**
 * Crear un nuevo template de email
 */
export async function createEmailTemplate(
    userId: string,
    data: CreateEmailTemplateData
): Promise<EmailTemplateData> {
    try {
        const collection = await getCollection('email_templates');

        const now = new Date();
        const newTemplate = {
            name: data.name,
            subject: data.subject,
            content: data.content,
            description: data.description,
            isDefault: data.isDefault || false,
            createdBy: userId,
            createdAt: now,
            updatedAt: now
        };

        const result = await collection.insertOne(newTemplate);

        revalidatePath('/admin/clients/email');

        return {
            id: result.insertedId.toString(),
            ...newTemplate
        };
    } catch (error) {
        console.error('Error al crear template de email:', error);
        throw new Error('No se pudo crear el template de email');
    }
}

/**
 * Actualizar un template de email
 */
export async function updateEmailTemplate(
    templateId: string,
    userId: string,
    data: UpdateEmailTemplateData
): Promise<EmailTemplateData> {
    try {
        const collection = await getCollection('email_templates');

        // Verificar que el usuario pueda editar este template
        const existingTemplate = await collection.findOne({
            _id: new ObjectId(templateId),
            createdBy: userId // Solo puede editar sus propios templates
        });

        if (!existingTemplate) {
            throw new Error('Template no encontrado o sin permisos para editarlo');
        }

        const updateData: any = {
            updatedAt: new Date()
        };

        if (data.name !== undefined) updateData.name = data.name;
        if (data.subject !== undefined) updateData.subject = data.subject;
        if (data.content !== undefined) updateData.content = data.content;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.isDefault !== undefined) updateData.isDefault = data.isDefault;

        const result = await collection.findOneAndUpdate(
            { _id: new ObjectId(templateId) },
            { $set: updateData },
            { returnDocument: 'after' }
        );

        if (!result) {
            throw new Error('No se pudo actualizar el template');
        }

        revalidatePath('/admin/clients/email');

        return {
            id: result._id.toString(),
            name: result.name,
            subject: result.subject,
            content: result.content,
            description: result.description,
            isDefault: result.isDefault,
            createdBy: result.createdBy,
            createdAt: result.createdAt,
            updatedAt: result.updatedAt
        };
    } catch (error) {
        console.error('Error al actualizar template de email:', error);
        throw new Error('No se pudo actualizar el template de email');
    }
}

/**
 * Eliminar un template de email
 */
export async function deleteEmailTemplate(templateId: string, userId: string): Promise<void> {
    try {
        const collection = await getCollection('email_templates');

        // Verificar que el template existe
        const existingTemplate = await collection.findOne({
            _id: new ObjectId(templateId)
        });

        if (!existingTemplate) {
            throw new Error('Template no encontrado');
        }

        await collection.deleteOne({
            _id: new ObjectId(templateId)
        });

        revalidatePath('/admin/clients/email');
    } catch (error) {
        console.error('Error al eliminar template de email:', error);
        throw new Error('No se pudo eliminar el template de email');
    }
}

// ==========================================
// WHATSAPP TEMPLATES
// ==========================================

/**
 * Obtener todos los templates de WhatsApp del usuario
 */
export async function getWhatsAppTemplates(userId: string): Promise<WhatsAppTemplateData[]> {
    try {
        const collection = await getCollection('whatsapp_templates');

        const templates = await collection
            .find({
                $or: [
                    { createdBy: userId },
                    { isDefault: true }
                ]
            })
            .sort({ isDefault: -1, createdAt: -1 }) // Templates por defecto primero
            .toArray();

        return templates.map(template => ({
            id: template._id.toString(),
            name: template.name,
            content: template.content,
            description: template.description,
            isDefault: template.isDefault,
            createdBy: template.createdBy,
            createdAt: template.createdAt,
            updatedAt: template.updatedAt
        }));
    } catch (error) {
        console.error('Error al obtener templates de WhatsApp:', error);
        throw new Error('No se pudieron obtener los templates de WhatsApp');
    }
}

/**
 * Crear un nuevo template de WhatsApp
 */
export async function createWhatsAppTemplate(
    userId: string,
    data: CreateWhatsAppTemplateData
): Promise<WhatsAppTemplateData> {
    try {
        const collection = await getCollection('whatsapp_templates');

        const now = new Date();
        const newTemplate = {
            name: data.name,
            content: data.content,
            description: data.description,
            isDefault: data.isDefault || false,
            createdBy: userId,
            createdAt: now,
            updatedAt: now
        };

        const result = await collection.insertOne(newTemplate);

        revalidatePath('/admin/clients/whatsapp');

        return {
            id: result.insertedId.toString(),
            ...newTemplate
        };
    } catch (error) {
        console.error('Error al crear template de WhatsApp:', error);
        throw new Error('No se pudo crear el template de WhatsApp');
    }
}

/**
 * Actualizar un template de WhatsApp
 */
export async function updateWhatsAppTemplate(
    templateId: string,
    userId: string,
    data: UpdateWhatsAppTemplateData
): Promise<WhatsAppTemplateData> {
    try {
        const collection = await getCollection('whatsapp_templates');

        // Verificar que el usuario pueda editar este template
        const existingTemplate = await collection.findOne({
            _id: new ObjectId(templateId),
            createdBy: userId // Solo puede editar sus propios templates
        });

        if (!existingTemplate) {
            throw new Error('Template no encontrado o sin permisos para editarlo');
        }

        const updateData: any = {
            updatedAt: new Date()
        };

        if (data.name !== undefined) updateData.name = data.name;
        if (data.content !== undefined) updateData.content = data.content;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.isDefault !== undefined) updateData.isDefault = data.isDefault;

        const result = await collection.findOneAndUpdate(
            { _id: new ObjectId(templateId) },
            { $set: updateData },
            { returnDocument: 'after' }
        );

        if (!result) {
            throw new Error('No se pudo actualizar el template');
        }

        revalidatePath('/admin/clients/whatsapp');

        return {
            id: result._id.toString(),
            name: result.name,
            content: result.content,
            description: result.description,
            isDefault: result.isDefault,
            createdBy: result.createdBy,
            createdAt: result.createdAt,
            updatedAt: result.updatedAt
        };
    } catch (error) {
        console.error('Error al actualizar template de WhatsApp:', error);
        throw new Error('No se pudo actualizar el template de WhatsApp');
    }
}

/**
 * Eliminar un template de WhatsApp
 */
export async function deleteWhatsAppTemplate(templateId: string, userId: string): Promise<void> {
    try {
        const collection = await getCollection('whatsapp_templates');

        // Verificar que el template existe
        const existingTemplate = await collection.findOne({
            _id: new ObjectId(templateId)
        });

        if (!existingTemplate) {
            throw new Error('Template no encontrado');
        }

        await collection.deleteOne({
            _id: new ObjectId(templateId)
        });

        revalidatePath('/admin/clients/whatsapp');
    } catch (error) {
        console.error('Error al eliminar template de WhatsApp:', error);
        throw new Error('No se pudo eliminar el template de WhatsApp');
    }
} 