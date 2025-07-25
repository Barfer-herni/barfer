import { getQuantityStatsByMonth, debugQuantityStats, testProductData } from '@repo/data-services/src/services/barfer';
import { QuantityAnalyticsClient } from './QuantityAnalyticsClient';

interface QuantityAnalyticsTabProps {
    dateFilter: {
        from: Date;
        to: Date;
    };
    compareFilter?: {
        from: Date;
        to: Date;
    };
}

export async function QuantityAnalyticsTab({ dateFilter, compareFilter }: QuantityAnalyticsTabProps) {
    try {
        // Para la tabla de cantidad total KG, siempre mostrar todos los datos del año actual
        // independientemente del filtro de fechas
        const currentYear = new Date().getFullYear();
        const yearStart = new Date(currentYear, 0, 1); // 1 de enero del año actual
        const yearEnd = new Date(currentYear, 11, 31, 23, 59, 59, 999); // 31 de diciembre del año actual



        // Obtener datos del año completo (ignorando el filtro de fechas)
        const quantityStats = await getQuantityStatsByMonth(yearStart, yearEnd);

        // Para comparación, usar el mismo período del año anterior si está habilitado
        let compareQuantityStats;
        if (compareFilter) {
            const previousYear = currentYear - 1;
            const previousYearStart = new Date(previousYear, 0, 1);
            const previousYearEnd = new Date(previousYear, 11, 31, 23, 59, 59, 999);
            compareQuantityStats = await getQuantityStatsByMonth(previousYearStart, previousYearEnd);
        }

        return (
            <QuantityAnalyticsClient
                dateFilter={dateFilter}
                compareFilter={compareFilter}
                quantityStats={quantityStats}
                compareQuantityStats={compareQuantityStats}
            />
        );
    } catch (error) {
        console.error('Error loading quantity analytics:', error);
        return (
            <div className="p-4 border rounded-lg">
                <p className="text-sm text-red-600">Error al cargar datos de cantidad total KG</p>
            </div>
        );
    }
} 