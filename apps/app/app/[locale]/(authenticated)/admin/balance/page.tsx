import { getDictionary } from '@repo/internationalization';
import type { Locale } from '@repo/internationalization';
import { getBalanceMonthlyAction } from './actions';
import { BalanceTable } from './components/BalanceTable';

interface BalancePageProps {
    params: Promise<{ locale: Locale }>;
    searchParams: Promise<{ year?: string }>;
}

export default async function BalancePage({ params, searchParams }: BalancePageProps) {
    const { locale } = await params;
    const { year: yearParam } = await searchParams;
    const dictionary = await getDictionary(locale);

    // Usar el año seleccionado o el año actual por defecto
    const selectedYear = yearParam ? parseInt(yearParam) : new Date().getFullYear();
    const startDate = new Date(selectedYear, 0, 1); // 1 de enero del año seleccionado
    const endDate = new Date(selectedYear, 11, 31, 23, 59, 59); // 31 de diciembre del año seleccionado

    const result = await getBalanceMonthlyAction(startDate, endDate);
    const balanceData = result.success ? (result.data || []) : [];

    return (
        <div className="h-full w-full">
            <div className="mb-5 p-5">
                <h1 className="text-2xl font-bold">
                    Balance Financiero
                </h1>
                <p className="text-muted-foreground">
                    Análisis mensual de entradas y salidas del negocio.
                </p>
            </div>

            <div className="px-5">
                <BalanceTable data={balanceData} dictionary={dictionary} selectedYear={selectedYear} />
            </div>
        </div>
    );
} 