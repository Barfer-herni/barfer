import { getCategorySales, getProductsByTimePeriod } from '@repo/data-services/src/services/barfer';
import { CategoriesAnalyticsClient } from './CategoriesAnalyticsClient';

interface CategoriesAnalyticsTabProps {
    dateFilter: {
        from: Date;
        to: Date;
    };
    compareFilter?: {
        from: Date;
        to: Date;
    };
}

export async function CategoriesAnalyticsTab({ dateFilter, compareFilter }: CategoriesAnalyticsTabProps) {
    try {
        const [allCategories, progressData] = await Promise.all([
            getCategorySales('all', 10, dateFilter.from, dateFilter.to),
            getProductsByTimePeriod(dateFilter.from, dateFilter.to)
        ]);

        // Datos del período de comparación (si está habilitado)
        let compareAllCategories, compareProgressData;
        if (compareFilter) {
            [compareAllCategories, compareProgressData] = await Promise.all([
                getCategorySales('all', 10, compareFilter.from, compareFilter.to),
                getProductsByTimePeriod(compareFilter.from, compareFilter.to)
            ]);
        }

        return (
            <CategoriesAnalyticsClient
                allCategories={allCategories}
                pendingCategories={[]}
                confirmedCategories={[]}
                compareAllCategories={compareAllCategories}
                comparePendingCategories={[]}
                compareConfirmedCategories={[]}
                progressData={progressData}
                compareProgressData={compareProgressData}
                isComparing={!!compareFilter}
                dateFilter={dateFilter}
                compareFilter={compareFilter}
            />
        );
    } catch (error) {
        console.error('Error loading categories analytics:', error);
        return (
            <div className="p-4 border rounded-lg">
                <p className="text-sm text-red-600">Error al cargar datos de categorías</p>
            </div>
        );
    }
} 