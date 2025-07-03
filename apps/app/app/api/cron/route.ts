import { NextResponse } from 'next/server';
import { getActiveScheduledEmailCampaigns, getClientsByCategory } from '@repo/data-services';
import resend, { BulkEmailTemplate } from '@repo/email';
import { CronExpressionParser } from 'cron-parser';

export const dynamic = 'force-dynamic';

export async function GET() {
    const now = new Date();
    console.log(`🚀 [Campaign Cron] Job started at ${now.toISOString()} (UTC)`);

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
                const timeSincePrev = now.getTime() - previousRun.getTime();
                const timeToNext = nextRun.getTime() - now.getTime();

                const isDue = timeSincePrev < twoMinutes || (timeToNext > 0 && timeToNext < twoMinutes);

                console.log(`\n[Campaign Cron] Checking campaign "${campaign.name}"...`);
                console.log(` -> Current time:           ${now.toISOString()}`);
                console.log(` -> Cron expression:        ${campaign.scheduleCron}`);
                console.log(` -> Previous scheduled run: ${previousRun.toISOString()}`);
                console.log(` -> Next scheduled run:     ${nextRun.toISOString()}`);
                console.log(` -> Time since last run:    ${Math.round(timeSincePrev / 1000)} seconds`);
                console.log(` -> Time to next run:       ${Math.round(timeToNext / 1000)} seconds`);
                console.log(` -> Is due (within 2 min):   ${isDue}`);

                if (isDue) {
                    console.log(`[Campaign Cron] ✔️ Campaign "${campaign.name}" is due. Preparing to send.`);

                    const audience = campaign.targetAudience as { type: 'behavior' | 'spending'; category: string };
                    const clients = await getClientsByCategory(audience.category, audience.type);

                    if (clients && clients.length > 0) {
                        console.log(`[Campaign Cron] Audience matched. Found ${clients.length} real clients for campaign "${campaign.name}".`);

                        const emailPayloads = clients.map(client => ({
                            to: client.email,
                            from: 'Barfer <ventas@barferalimento.com>',
                            subject: campaign.emailTemplate.subject,
                            react: BulkEmailTemplate({
                                clientName: client.name,
                                content: campaign.emailTemplate.content,
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

        console.log('✅ [Campaign Cron] Job finished successfully.');
        return NextResponse.json({ message: 'Cron job executed successfully.' });

    } catch (error: any) {
        console.error('🚨 [Campaign Cron] Unhandled error in cron job:', error);
        return NextResponse.json({
            error: error?.message || 'Unknown error'
        }, { status: 500 });
    }
} 