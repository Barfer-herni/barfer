import 'server-only';
import { getCollection } from '@repo/database';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface PaymentByTimePeriod {
    period: string;
    date: string;
    efectivoOrders: number;
    efectivoRevenue: number;
    transferenciaOrders: number;
    transferenciaRevenue: number;
    tarjetaOrders: number;
    tarjetaRevenue: number;
    totalOrders: number;
    totalRevenue: number;
}

type TimePeriodType = 'daily' | 'weekly' | 'monthly';

/**
 * Obtiene estadísticas de pagos agrupadas por período de tiempo
 */
export async function getPaymentsByTimePeriod(
    startDate: Date,
    endDate: Date,
    periodType: TimePeriodType = 'daily'
): Promise<PaymentByTimePeriod[]> {
    try {
        const collection = await getCollection('orders');
        const pipeline: any[] = [];

        // Filtro de fechas
        pipeline.push({
            $match: {
                createdAt: {
                    $gte: startDate,
                    $lte: endDate
                }
            }
        });

        // Agrupar por período
        let groupId: any;
        switch (periodType) {
            case 'daily':
                groupId = {
                    year: { $year: '$createdAt' },
                    month: { $month: '$createdAt' },
                    day: { $dayOfMonth: '$createdAt' }
                };
                break;
            case 'weekly':
                groupId = {
                    year: { $year: '$createdAt' },
                    week: { $week: '$createdAt' }
                };
                break;
            case 'monthly':
                groupId = {
                    year: { $year: '$createdAt' },
                    month: { $month: '$createdAt' }
                };
                break;
        }

        pipeline.push({
            $group: {
                _id: groupId,
                // Efectivo - 'cash'
                efectivoOrders: {
                    $sum: { $cond: [{ $eq: ['$paymentMethod', 'cash'] }, 1, 0] }
                },
                efectivoRevenue: {
                    $sum: { $cond: [{ $eq: ['$paymentMethod', 'cash'] }, '$total', 0] }
                },
                // Transferencia - 'bank-transfer'
                transferenciaOrders: {
                    $sum: { $cond: [{ $eq: ['$paymentMethod', 'bank-transfer'] }, 1, 0] }
                },
                transferenciaRevenue: {
                    $sum: { $cond: [{ $eq: ['$paymentMethod', 'bank-transfer'] }, '$total', 0] }
                },
                // Tarjeta/Digital - 'mercado-pago'
                tarjetaOrders: {
                    $sum: { $cond: [{ $eq: ['$paymentMethod', 'mercado-pago'] }, 1, 0] }
                },
                tarjetaRevenue: {
                    $sum: { $cond: [{ $eq: ['$paymentMethod', 'mercado-pago'] }, '$total', 0] }
                },
                // Totales
                totalOrders: { $sum: 1 },
                totalRevenue: { $sum: '$total' }
            }
        });

        // Ordenar por fecha
        pipeline.push({
            $sort: periodType === 'weekly'
                ? { '_id.year': 1, '_id.week': 1 }
                : { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
        });

        const result = await collection.aggregate(pipeline).toArray();

        // Formatear resultados
        const formattedResult: PaymentByTimePeriod[] = result.map((item: any) => {
            let period: string;
            let date: string;

            switch (periodType) {
                case 'daily':
                    period = `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`;
                    date = format(new Date(item._id.year, item._id.month - 1, item._id.day), 'dd/MM/yyyy', { locale: es });
                    break;
                case 'weekly':
                    period = `${item._id.year}-W${String(item._id.week).padStart(2, '0')}`;
                    date = `Semana ${item._id.week}, ${item._id.year}`;
                    break;
                case 'monthly':
                    period = `${item._id.year}-${String(item._id.month).padStart(2, '0')}`;
                    date = format(new Date(item._id.year, item._id.month - 1), 'MMMM yyyy', { locale: es });
                    break;
                default:
                    period = '';
                    date = '';
            }

            return {
                period,
                date,
                efectivoOrders: item.efectivoOrders,
                efectivoRevenue: item.efectivoRevenue,
                transferenciaOrders: item.transferenciaOrders,
                transferenciaRevenue: item.transferenciaRevenue,
                tarjetaOrders: item.tarjetaOrders,
                tarjetaRevenue: item.tarjetaRevenue,
                otherOrders: item.otherOrders,
                otherRevenue: item.otherRevenue,
                totalOrders: item.totalOrders,
                totalRevenue: item.totalRevenue
            };
        });

        return formattedResult;
    } catch (error) {
        console.error('Error fetching payments by time period:', error);
        throw error;
    }
} 