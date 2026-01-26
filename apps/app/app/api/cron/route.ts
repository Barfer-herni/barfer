import { NextResponse } from 'next/server';
import { getActiveScheduledEmailCampaigns, getClientsByCategory } from '@repo/data-services';
import { getCollection, ObjectId } from '@repo/database';
import resend, { BulkEmailTemplate } from '@repo/email';
import { CronExpressionParser } from 'cron-parser';
import { format } from 'date-fns';
import { differenceInMilliseconds } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET() {
    const now = new Date();
    console.log(`🚀 [Campaign Cron] Job started at ${format(now, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx")} (UTC)`);

    if (!resend) {
        console.error('🚨 [Campaign Cron] Resend service not configured. Missing RESEND_TOKEN.');
        return NextResponse.json({ error: 'Email service not configured' }, { status: 500 });
    }

    try {
        const campaigns = await getActiveScheduledEmailCampaigns();
        console.log(`[Campaign Cron] Found ${campaigns.length} active email campaigns to check.`);

        const emailsToSend: any[] = [];

        for (const campaign of campaigns) {
            try {
                const interval = CronExpressionParser.parse(campaign.scheduleCron, { currentDate: now });
                const previousRun = interval.prev().toDate();
                const nextRun = interval.next().toDate();

                const twoMinutes = 2 * 60 * 1000;
                const timeSincePrev = differenceInMilliseconds(now, previousRun);
                const timeToNext = differenceInMilliseconds(nextRun, now);

                const isDue = timeSincePrev < twoMinutes || (timeToNext > 0 && timeToNext < twoMinutes);

                if (isDue) {
                    // Obtener el template de email desde MongoDB
                    const templatesCollection = await getCollection('email_templates');
                    const emailTemplate = await templatesCollection.findOne({
                        _id: new ObjectId(campaign.emailTemplateId)
                    });

                    if (!emailTemplate) {
                        console.error(`[Campaign Cron] Email template not found: ${campaign.emailTemplateId}`);
                        continue;
                    }

                    const audience = campaign.targetAudience as { type: 'behavior' | 'spending'; category: string };
                    const clients = await getClientsByCategory(audience.category, audience.type);

                    if (clients && clients.length > 0) {

                        const emailPayloads = clients.map(client => ({
                            to: client.email,
                            from: 'Barfer <ventas@barferalimento.com>',
                            subject: emailTemplate.subject,
                            react: BulkEmailTemplate({
                                clientName: client.name,
                                content: emailTemplate.content,
                            }),
                        }));

                        emailsToSend.push(...emailPayloads);
                    } else {
                        console.log(`[Campaign Cron] No clients found for audience: ${JSON.stringify(audience)}`);
                    }
                } else {
                    console.log(`[Campaign Cron] ✖️ Campaign "${campaign.name}" is not due yet. Skipping.`);
                }
            } catch (err: any) {
                console.error(`[Campaign Cron] Error processing campaign "${campaign.name}": ${err.message}`);
            }
        }

        if (emailsToSend.length > 0) {
            console.log(`[Campaign Cron] Sending ${emailsToSend.length} emails in a batch.`);
            const { data, error } = await resend.batch.send(emailsToSend);

            if (error) {
                console.error('[Campaign Cron] Error sending batch emails:', error);
            } else {
                console.log(`[Campaign Cron] Batch email job accepted by Resend. ${emailsToSend.length} emails are being processed.`);
            }
        } else {
            console.log('[Campaign Cron] No emails to send at this time.');
        }

        // TODO: Implement WhatsApp campaigns logic here following the same pattern.

        // Ejecutar rollover de stock (verificación de horario de corte)
        try {
            const { checkAndPerformStockRollover } = await import('@repo/data-services/src/services/barfer/stockRolloverService');
            await checkAndPerformStockRollover();
            console.log('✅ [Stock Cron] Stock rollover check completed');
        } catch (error) {
            console.error('❌ [Stock Cron] Stock rollover failed', error);
        }

        console.log('✅ [Campaign Cron] Job finished successfully.');
        return NextResponse.json({ message: 'Cron job executed successfully.' });

    } catch (error: any) {
        console.error('🚨 [Campaign Cron] Unhandled error in cron job:', error);
        return NextResponse.json({
            error: error?.message || 'Unknown error'
        }, { status: 500 });
    }
} 