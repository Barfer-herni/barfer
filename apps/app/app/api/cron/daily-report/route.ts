import { NextResponse } from 'next/server';
import resend, { BulkEmailTemplate } from '@repo/email';
import { getRevenueByDay } from '@repo/data-services';

const TEST_EMAILS = [
    { name: 'Lucas', email: 'heredialucasfac22@gmail.com' },
    { name: 'Nicolás', email: 'nicolascaliari28@gmail.com' },
];

export const dynamic = 'force-dynamic'; // Asegura que la ruta no sea cacheada estáticamente

export async function GET() {
    try {
        if (!resend) {
            return NextResponse.json({
                error: 'Servicio de email no configurado. Configura RESEND_TOKEN.'
            }, { status: 500 });
        }

        // 1. Calcular las fechas para "ayer"
        const endDate = new Date();
        endDate.setHours(0, 0, 0, 0); // Inicio del día de hoy
        const startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 1); // Inicio del día de ayer

        // 2. Obtener datos de ingresos y órdenes de ayer
        const dailyData = await getRevenueByDay(startDate, endDate);

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

        const { data, error } = await resend.batch.send(emailPayloads);

        if (error) {
            console.error('❌ Error enviando reporte diario:', error);
            return NextResponse.json({ error: `Error al enviar el reporte: ${error.message}` }, { status: 500 });
        }

        return NextResponse.json({ message: `${data?.data?.length ?? 0} reportes diarios enviados.` });

    } catch (error) {
        console.error('Error en el cron job de reporte diario:', error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Error desconocido'
        }, { status: 500 });
    }
} 