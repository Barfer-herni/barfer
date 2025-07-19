import { getDictionary } from '@repo/internationalization';
import type { Locale } from '@repo/internationalization';
import { getAllPricesAction } from './actions';
import { PricesTable } from './components/PricesTable';

export default async function PricesPage({
    params,
}: {
    params: Promise<{ locale: Locale }>;
}) {
    const { locale } = await params;
    const dictionary = await getDictionary(locale);

    // Obtener todos los precios usando la nueva acción de Barfer
    const result = await getAllPricesAction();
    const prices = result.success ? (result.prices || []) : [];

    return (
        <div className="h-full w-full">
            <div className="mb-5 p-5">
                <h1 className="text-2xl font-bold">
                    Gestión de Precios
                </h1>
                <p className="text-muted-foreground">
                    Administra los precios de todos los productos por sección y tipo de venta.
                </p>
            </div>
            <div>
                <PricesTable
                    prices={prices}
                    dictionary={dictionary}
                />
            </div>
        </div>
    );
} 