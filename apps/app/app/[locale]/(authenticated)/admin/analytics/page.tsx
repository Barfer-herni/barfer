import { DailyAnalyticsTab } from './components/daily/DailyAnalyticsTab';
import { MonthlyAnalyticsTab } from './components/monthly/MonthlyAnalyticsTab';
import { ProductsAnalyticsTab } from './components/products/ProductsAnalyticsTab';
import { CategoriesAnalyticsTab } from './components/categories/CategoriesAnalyticsTab';
import { PaymentsAnalyticsTab } from './components/payments/PaymentsAnalyticsTab';
import { FrequencyAnalyticsTab } from './components/frequency/FrequencyAnalyticsTab';
import { QuantityAnalyticsTab } from './components/quantity/QuantityAnalyticsTab';
import { AnalyticsTabsWrapper } from './components/AnalyticsTabsWrapper';
import { AnalyticsDateFilter } from './components/AnalyticsDateFilter';
import { subDays, startOfDay, endOfDay } from 'date-fns';

interface AnalyticsPageProps {
    searchParams: Promise<{
        from?: string;
        to?: string;
        preset?: string;
        compare?: string;
        compareFrom?: string;
        compareTo?: string;
        quantityYear?: string; // Año para la sección de cantidad total KG
    }>;
}

export default async function AnalyticsPage({ searchParams }: AnalyticsPageProps) {
    // Await searchParams ya que es una promesa en Next.js 15
    const params = await searchParams;

    // Convertir searchParams a fechas o usar un rango más amplio por defecto
    const dateFilter = params.from && params.to ? {
        from: new Date(params.from + 'T00:00:00.000Z'), // Forzar UTC
        to: new Date(params.to + 'T23:59:59.999Z')     // Forzar UTC
    } : {
        // Por defecto: últimos 365 días para incluir más datos históricos y categorías como BIG DOG
        from: (() => {
            const now = new Date();
            const oneYearAgo = subDays(now, 365);
            return new Date(Date.UTC(
                oneYearAgo.getUTCFullYear(),
                oneYearAgo.getUTCMonth(),
                oneYearAgo.getUTCDate(),
                0, 0, 0, 0
            ));
        })(),
        to: (() => {
            const now = new Date();
            return new Date(Date.UTC(
                now.getUTCFullYear(),
                now.getUTCMonth(),
                now.getUTCDate(),
                23, 59, 59, 999
            ));
        })()
    };

    // Período de comparación (opcional)
    const compareFilter = params.compare === 'true' && params.compareFrom && params.compareTo ? {
        from: new Date(params.compareFrom + 'T00:00:00.000Z'),
        to: new Date(params.compareTo + 'T23:59:59.999Z')
    } : undefined;

    return (
        <div className="space-y-6 p-4 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h1 className="text-2xl md:text-3xl font-bold">Estadísticas</h1>
                <div className="text-sm text-muted-foreground">
                    Análisis detallado del negocio
                </div>
            </div>

            {/* Filtro de fechas global */}
            <AnalyticsDateFilter />

            <AnalyticsTabsWrapper
                dailyTab={<DailyAnalyticsTab dateFilter={dateFilter} compareFilter={compareFilter} />}
                monthlyTab={<MonthlyAnalyticsTab dateFilter={dateFilter} compareFilter={compareFilter} />}
                productsTab={<ProductsAnalyticsTab dateFilter={dateFilter} compareFilter={compareFilter} />}
                categoriesTab={<CategoriesAnalyticsTab dateFilter={dateFilter} compareFilter={compareFilter} />}
                paymentsTab={<PaymentsAnalyticsTab dateFilter={dateFilter} compareFilter={compareFilter} />}
                frequencyTab={<FrequencyAnalyticsTab dateFilter={dateFilter} compareFilter={compareFilter} />}
                quantityTab={<QuantityAnalyticsTab dateFilter={dateFilter} compareFilter={compareFilter} selectedYear={params.quantityYear ? parseInt(params.quantityYear) : undefined} />}
            />
        </div>
    );
} 