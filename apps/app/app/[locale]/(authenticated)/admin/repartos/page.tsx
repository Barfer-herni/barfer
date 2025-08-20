import { getDictionary } from '@repo/internationalization';
import { RepartosTable } from './components/RepartosTable';

interface RepartosPageProps {
    params: Promise<{
        locale: string;
    }>;
}

export default async function RepartosPage({ params }: RepartosPageProps) {
    const { locale } = await params;
    const dictionary = await getDictionary(locale);

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        {dictionary.app?.admin?.repartos?.title || 'Control de Repartos'}
                    </h1>
                    <p className="text-muted-foreground">
                        {dictionary.app?.admin?.repartos?.description || 'Gestión y control de entregas semanales'}
                    </p>
                </div>
            </div>

            <RepartosTable dictionary={dictionary} />
        </div>
    );
}
