import { getDictionary } from '@repo/internationalization';
import type { Locale } from '@repo/internationalization';
import { getRepartosDataAction } from './actions';
import { RepartosTable } from './components/RepartosTable';

interface RepartosPageProps {
    params: Promise<{ locale: Locale }>;
}

export default async function RepartosPage({ params }: RepartosPageProps) {
    const { locale } = await params;
    const dictionary = await getDictionary(locale);

    // Obtener datos de repartos
    const result = await getRepartosDataAction();
    const repartosData = result.success ? (result.data || {}) : {};

    return (
        <div className="h-full w-full">
            <div className="mb-5 p-5">
                <h1 className="text-2xl font-bold">
                    {dictionary.app?.admin?.repartos?.title || 'Control de Repartos'}
                </h1>
                <p className="text-muted-foreground">
                    {dictionary.app?.admin?.repartos?.description || 'Gestión semanal de repartos y entregas.'}
                </p>
            </div>

            <div className="px-5">
                <RepartosTable data={repartosData} dictionary={dictionary} />
            </div>
        </div>
    );
}