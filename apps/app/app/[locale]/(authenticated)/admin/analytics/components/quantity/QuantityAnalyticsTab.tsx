import { getQuantityStatsByMonth } from '@repo/data-services/src/services/barfer';
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
    selectedYear?: number; // Año seleccionado por el usuario
}

export async function QuantityAnalyticsTab({ dateFilter, compareFilter, selectedYear }: QuantityAnalyticsTabProps) {
    try {
        // Usar el año seleccionado o el año actual por defecto
        const currentYear = selectedYear || new Date().getFullYear();
        // IMPORTANTE: Usar UTC para evitar problemas de zona horaria (Argentina UTC-3)
        // Esto asegura que coincida con la lógica de Express que compara en UTC
        const yearStart = new Date(Date.UTC(currentYear, 0, 1, 0, 0, 0, 0));
        const yearEnd = new Date(Date.UTC(currentYear, 11, 31, 23, 59, 59, 999));



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
                selectedYear={currentYear}
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