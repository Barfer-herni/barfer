'use server';

import { getCollection, ObjectId } from '@repo/database';

export interface ScheduledEmailCampaignData {
    id: string;
    name: string;
    scheduleCron: string;
    targetAudience: {
        type: 'behavior' | 'spending';
        category: string;
    };
    status: 'ACTIVE' | 'PAUSED' | 'COMPLETED';
    emailTemplateId: string;
    userId: string;
    lastRun?: Date;
    nextRun?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface ScheduledWhatsAppCampaignData {
    id: string;
    name: string;
    scheduleCron: string;
    targetAudience: {
        type: 'behavior' | 'spending';
        category: string;
    };
    status: 'ACTIVE' | 'PAUSED' | 'COMPLETED';
    whatsappTemplateId: string;
    userId: string;
    lastRun?: Date;
    nextRun?: Date;
    createdAt: Date;
    updatedAt: Date;
}

// ==========================================
// EMAIL CAMPAIGNS
// ==========================================

export async function getActiveScheduledEmailCampaigns(): Promise<ScheduledEmailCampaignData[]> {
    try {
        const collection = await getCollection('scheduled_email_campaigns');

        const campaigns = await collection
            .find({ status: 'ACTIVE' })
            .toArray();

        return campaigns.map(campaign => ({
            id: campaign._id.toString(),
            name: campaign.name,
            scheduleCron: campaign.scheduleCron,
            targetAudience: campaign.targetAudience,
            status: campaign.status,
            emailTemplateId: campaign.emailTemplateId,
            userId: campaign.userId,
            lastRun: campaign.lastRun,
            nextRun: campaign.nextRun,
            createdAt: campaign.createdAt,
            updatedAt: campaign.updatedAt
        }));
    } catch (error) {
        console.error('Error al obtener campañas de email activas:', error);
        throw new Error('No se pudieron obtener las campañas de email');
    }
}

export async function createScheduledEmailCampaign(
    userId: string,
    data: {
        name: string;
        scheduleCron: string;
        targetAudience: {
            type: 'behavior' | 'spending';
            category: string;
        };
        status: 'ACTIVE' | 'PAUSED' | 'COMPLETED';
        emailTemplate: {
            connect: {
                id: string;
            };
        };
    }
): Promise<ScheduledEmailCampaignData> {
    try {
        const collection = await getCollection('scheduled_email_campaigns');

        const now = new Date();
        const newCampaign = {
            name: data.name,
            scheduleCron: data.scheduleCron,
            targetAudience: data.targetAudience,
            status: data.status,
            emailTemplateId: data.emailTemplate.connect.id,
            userId: userId,
            createdAt: now,
            updatedAt: now
        };

        const result = await collection.insertOne(newCampaign);

        return {
            id: result.insertedId.toString(),
            ...newCampaign
        };
    } catch (error) {
        console.error('Error al crear campaña de email:', error);
        throw new Error('No se pudo crear la campaña de email');
    }
}

export async function updateScheduledEmailCampaign(
    campaignId: string,
    data: {
        name?: string;
        scheduleCron?: string;
        status?: 'ACTIVE' | 'PAUSED' | 'COMPLETED';
        lastRun?: Date;
        nextRun?: Date;
    }
): Promise<ScheduledEmailCampaignData | null> {
    try {
        const collection = await getCollection('scheduled_email_campaigns');

        const updateData: any = {
            updatedAt: new Date()
        };

        if (data.name !== undefined) updateData.name = data.name;
        if (data.scheduleCron !== undefined) updateData.scheduleCron = data.scheduleCron;
        if (data.status !== undefined) updateData.status = data.status;
        if (data.lastRun !== undefined) updateData.lastRun = data.lastRun;
        if (data.nextRun !== undefined) updateData.nextRun = data.nextRun;

        const result = await collection.findOneAndUpdate(
            { _id: new ObjectId(campaignId) },
            { $set: updateData },
            { returnDocument: 'after' }
        );

        if (!result) {
            return null;
        }

        return {
            id: result._id.toString(),
            name: result.name,
            scheduleCron: result.scheduleCron,
            targetAudience: result.targetAudience,
            status: result.status,
            emailTemplateId: result.emailTemplateId,
            userId: result.userId,
            lastRun: result.lastRun,
            nextRun: result.nextRun,
            createdAt: result.createdAt,
            updatedAt: result.updatedAt
        };
    } catch (error) {
        console.error('Error al actualizar campaña de email:', error);
        throw new Error('No se pudo actualizar la campaña de email');
    }
}

export async function deleteScheduledEmailCampaign(campaignId: string): Promise<void> {
    try {
        const collection = await getCollection('scheduled_email_campaigns');

        await collection.deleteOne({
            _id: new ObjectId(campaignId)
        });
    } catch (error) {
        console.error('Error al eliminar campaña de email:', error);
        throw new Error('No se pudo eliminar la campaña de email');
    }
}

// ==========================================
// WHATSAPP CAMPAIGNS
// ==========================================

export async function getActiveScheduledWhatsAppCampaigns(): Promise<ScheduledWhatsAppCampaignData[]> {
    try {
        const collection = await getCollection('scheduled_whatsapp_campaigns');

        const campaigns = await collection
            .find({ status: 'ACTIVE' })
            .toArray();

        return campaigns.map(campaign => ({
            id: campaign._id.toString(),
            name: campaign.name,
            scheduleCron: campaign.scheduleCron,
            targetAudience: campaign.targetAudience,
            status: campaign.status,
            whatsappTemplateId: campaign.whatsappTemplateId,
            userId: campaign.userId,
            lastRun: campaign.lastRun,
            nextRun: campaign.nextRun,
            createdAt: campaign.createdAt,
            updatedAt: campaign.updatedAt
        }));
    } catch (error) {
        console.error('Error al obtener campañas de WhatsApp activas:', error);
        throw new Error('No se pudieron obtener las campañas de WhatsApp');
    }
}

export async function createScheduledWhatsAppCampaign(
    userId: string,
    data: {
        name: string;
        scheduleCron: string;
        targetAudience: {
            type: 'behavior' | 'spending';
            category: string;
        };
        status: 'ACTIVE' | 'PAUSED' | 'COMPLETED';
        whatsappTemplate: {
            connect: {
                id: string;
            };
        };
    }
): Promise<ScheduledWhatsAppCampaignData> {
    try {
        const collection = await getCollection('scheduled_whatsapp_campaigns');

        const now = new Date();
        const newCampaign = {
            name: data.name,
            scheduleCron: data.scheduleCron,
            targetAudience: data.targetAudience,
            status: data.status,
            whatsappTemplateId: data.whatsappTemplate.connect.id,
            userId: userId,
            createdAt: now,
            updatedAt: now
        };

        const result = await collection.insertOne(newCampaign);

        return {
            id: result.insertedId.toString(),
            ...newCampaign
        };
    } catch (error) {
        console.error('Error al crear campaña de WhatsApp:', error);
        throw new Error('No se pudo crear la campaña de WhatsApp');
    }
}

export async function updateScheduledWhatsAppCampaign(
    campaignId: string,
    data: {
        name?: string;
        scheduleCron?: string;
        status?: 'ACTIVE' | 'PAUSED' | 'COMPLETED';
        lastRun?: Date;
        nextRun?: Date;
    }
): Promise<ScheduledWhatsAppCampaignData | null> {
    try {
        const collection = await getCollection('scheduled_whatsapp_campaigns');

        const updateData: any = {
            updatedAt: new Date()
        };

        if (data.name !== undefined) updateData.name = data.name;
        if (data.scheduleCron !== undefined) updateData.scheduleCron = data.scheduleCron;
        if (data.status !== undefined) updateData.status = data.status;
        if (data.lastRun !== undefined) updateData.lastRun = data.lastRun;
        if (data.nextRun !== undefined) updateData.nextRun = data.nextRun;

        const result = await collection.findOneAndUpdate(
            { _id: new ObjectId(campaignId) },
            { $set: updateData },
            { returnDocument: 'after' }
        );

        if (!result) {
            return null;
        }

        return {
            id: result._id.toString(),
            name: result.name,
            scheduleCron: result.scheduleCron,
            targetAudience: result.targetAudience,
            status: result.status,
            whatsappTemplateId: result.whatsappTemplateId,
            userId: result.userId,
            lastRun: result.lastRun,
            nextRun: result.nextRun,
            createdAt: result.createdAt,
            updatedAt: result.updatedAt
        };
    } catch (error) {
        console.error('Error al actualizar campaña de WhatsApp:', error);
        throw new Error('No se pudo actualizar la campaña de WhatsApp');
    }
}

export async function deleteScheduledWhatsAppCampaign(campaignId: string): Promise<void> {
    try {
        const collection = await getCollection('scheduled_whatsapp_campaigns');

        await collection.deleteOne({
            _id: new ObjectId(campaignId)
        });
    } catch (error) {
        console.error('Error al eliminar campaña de WhatsApp:', error);
        throw new Error('No se pudo eliminar la campaña de WhatsApp');
    }
} 