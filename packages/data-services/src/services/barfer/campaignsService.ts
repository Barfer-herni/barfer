import { database } from '@repo/database';
import type { Prisma } from '@repo/database';

export type ScheduledEmailCampaignData = Prisma.ScheduledEmailCampaignGetPayload<{
    include: {
        emailTemplate: true;
    };
}>;

export async function getActiveScheduledEmailCampaigns(): Promise<ScheduledEmailCampaignData[]> {
    return database.scheduledEmailCampaign.findMany({
        where: {
            status: 'ACTIVE',
        },
        include: {
            emailTemplate: true,
        },
    });
}

export async function createScheduledEmailCampaign(
    userId: string,
    data: Omit<Prisma.ScheduledEmailCampaignCreateInput, 'user'>
) {
    return database.scheduledEmailCampaign.create({
        data: {
            ...data,
            user: {
                connect: {
                    id: userId,
                },
            },
        },
    });
}

// Aquí podrías agregar funciones para WhatsApp, actualizar y eliminar campañas 