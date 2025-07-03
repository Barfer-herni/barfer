import { NextResponse } from 'next/server';
import resend, { BulkEmailTemplate } from '@repo/email';
import { getRevenueByDay } from '@repo/data-services';

const TEST_EMAILS = [
    { name: 'Lucas', email: 'heredialucasfac22@gmail.com' },
    { name: 'Nicolás', email: 'nicolascaliari28@gmail.com' },
];

export const dynamic = 'force-dynamic'; // Asegura que la ruta no sea cacheada estáticamente

export async function GET() {
    console.log("🚀 [Cron Job] Starting daily report task.");
    try {
        if (!resend) {
            console.error("🚨 [Cron Job] Resend service not configured. Missing RESEND_TOKEN.");
            return NextResponse.json({
                error: 'Servicio de email no configurado. Configura RESEND_TOKEN.'
            }, { status: 500 });
        }

        // 1. Calcular las fechas para "ayer"
        const endDate = new Date();
        endDate.setHours(0, 0, 0, 0); // Inicio del día de hoy
        const startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 1); // Inicio del día de ayer

        console.log(`🗓️  [Cron Job] Calculating report for period: ${startDate.toISOString()} to ${endDate.toISOString()}`);

        // 2. Obtener datos de ingresos y órdenes de ayer
        console.log("📊 [Cron Job] Fetching daily data...");
        const dailyData = await getRevenueByDay(startDate, endDate);
        console.log("✅ [Cron Job] Daily data fetched:", JSON.stringify(dailyData, null, 2));

        let reportData;

        if (dailyData && dailyData.length > 0) {
            const yesterdayData = dailyData[0];
            reportData = {
                dailyRevenue: yesterdayData.revenue,
                orderCount: yesterdayData.orders,
                newClients: 5, // Valor estático por ahora
            };
        } else {
            // Si no hay datos, enviar un reporte en ceros
            reportData = {
                dailyRevenue: 0,
                orderCount: 0,
                newClients: 0,
            };
        }

        console.log("📝 [Cron Job] Report data prepared:", JSON.stringify(reportData, null, 2));

        const fromEmail = 'Barfer <ventas@barferalimento.com>';

        const emailPayloads = TEST_EMAILS.map((client) => ({
            from: fromEmail,
            to: [client.email],
            subject: `📈 Reporte Diario - ${startDate.toLocaleDateString('es-AR')}`,
            react: BulkEmailTemplate({
                clientName: client.name,
                content: `Reporte diario de ${startDate.toLocaleDateString('es-AR')}:
- Ingresos: ${reportData.dailyRevenue}
- Órdenes: ${reportData.orderCount}
- Clientes nuevos: ${reportData.newClients}`,
            }),
        }));

        console.log(`📧 [Cron Job] Preparing to send ${emailPayloads.length} emails.`);
        const { data, error } = await resend.batch.send(emailPayloads);

        if (error) {
            console.error('❌ [Cron Job] Error sending daily report:', error);
            return NextResponse.json({ error: `Error al enviar el reporte: ${error.message}` }, { status: 500 });
        }

        console.log(`✅ [Cron Job] ${data?.data?.length ?? 0} daily reports sent successfully.`);
        return NextResponse.json({ message: `${data?.data?.length ?? 0} reportes diarios enviados.` });

    } catch (error) {
        console.error('🚨 [Cron Job] Unhandled error in daily report cron job:', error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Error desconocido'
        }, { status: 500 });
    }
} 