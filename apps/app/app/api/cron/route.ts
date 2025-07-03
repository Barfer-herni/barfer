import { NextResponse } from 'next/server';
import { getActiveScheduledEmailCampaigns, getClientsByCategory } from '@repo/data-services';
import resend from '@repo/email';
import { CronExpressionParser } from 'cron-parser';

export const dynamic = 'force-dynamic';

export async function GET() {
    console.log('🚀 [Campaign Cron] Job started.');

    if (!resend) {
        console.error('🚨 [Campaign Cron] Resend service not configured. Missing RESEND_TOKEN.');
        return NextResponse.json({ error: 'Email service not configured' }, { status: 500 });
    }

    try {
        const now = new Date();
        const campaigns = await getActiveScheduledEmailCampaigns();
        console.log(`[Campaign Cron] Found ${campaigns.length} active email campaigns to check.`);

        const emailsToSend: any[] = [];

        for (const campaign of campaigns) {
            try {
                const interval = CronExpressionParser.parse(campaign.scheduleCron);
                const previousRun = interval.prev().toDate();

                // Check if the campaign was due in the last 5 minutes.
                // This tolerance handles slight delays in the n8n trigger.
                const fiveMinutes = 5 * 60 * 1000;
                if (now.getTime() - previousRun.getTime() < fiveMinutes) {
                    console.log(`[Campaign Cron] Campaign "${campaign.name}" is due. Preparing to send.`);

                    const audience = campaign.targetAudience as { type: 'behavior' | 'spending'; category: string };
                    let clients = await getClientsByCategory(audience.category, audience.type);

                    if (clients && clients.length > 0) {
                        console.log(`[Campaign Cron] Audience matched. Found ${clients.length} real clients for campaign "${campaign.name}".`);

                        // MODO DE PRUEBA FORZADO PARA EL CRON JOB
                        console.log(' MODO DE PRUEBA ACTIVO: El envío del cron job se redirigirá a los emails de simulación.');
                        clients = [
                            { id: 'test-cron-1', name: 'Lucas (Prueba Cron)', email: 'heredialucasfac22@gmail.com', phone: '', lastOrder: '', totalSpent: 0, totalOrders: 0, behaviorCategory: 'active', spendingCategory: 'standard' },
                            { id: 'test-cron-2', name: 'Nicolás (Prueba Cron)', email: 'nicolascaliari28@gmail.com', phone: '', lastOrder: '', totalSpent: 0, totalOrders: 0, behaviorCategory: 'active', spendingCategory: 'standard' }
                        ];

                        const emailPayloads = clients.map(client => ({
                            to: client.email,
                            from: 'Barfer <ventas@barferalimento.com>',
                            subject: campaign.emailTemplate.subject,
                            html: campaign.emailTemplate.content, // Assuming content is HTML
                        }));
                        emailsToSend.push(...emailPayloads);
                    } else {
                        console.log(`[Campaign Cron] No clients found for audience: ${JSON.stringify(audience)}`);
                    }
                }
            } catch (err: any) {
                console.error(`[Campaign Cron] Error parsing cron string for campaign "${campaign.name}": ${err.message}`);
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

        console.log('✅ [Campaign Cron] Job finished successfully.');
        return NextResponse.json({ message: 'Cron job executed successfully.' });

    } catch (error: any) {
        console.error('🚨 [Campaign Cron] Unhandled error in cron job:', error);
        return NextResponse.json({
            error: error?.message || 'Unknown error'
        }, { status: 500 });
    }
} 