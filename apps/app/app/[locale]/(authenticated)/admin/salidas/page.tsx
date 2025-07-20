import { getDictionary } from '@repo/internationalization';
import type { Locale } from '@repo/internationalization';
import { getAllSalidasAction } from './actions';
import { SalidasPageClient } from './components/SalidasPageClient';

interface SalidasPageProps {
    params: Promise<{ locale: Locale }>;
}

export default async function SalidasPage({ params }: SalidasPageProps) {
    const { locale } = await params;
    const dictionary = await getDictionary(locale);

    // Obtener todas las salidas
    const result = await getAllSalidasAction();
    const salidas = result.success ? (result.salidas || []) : [];

    return (
        <div className="h-full w-full">
            <div className="mb-5 p-5">
                <h1 className="text-2xl font-bold">
                    Gestión de Salidas
                </h1>
                <p className="text-muted-foreground">
                    Administra y visualiza todas las salidas de dinero del negocio.
                </p>
            </div>

            <SalidasPageClient salidas={salidas} dictionary={dictionary} />
        </div>
    );
} 