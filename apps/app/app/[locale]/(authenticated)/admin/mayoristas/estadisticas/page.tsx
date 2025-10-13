import { getPuntosVentaStatsAction } from '../actions';
import { EstadisticasPageClient } from './components/EstadisticasPageClient';

export default async function EstadisticasPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const { from, to } = await searchParams || {};

    const fromDate = from as string | undefined;
    const toDate = to as string | undefined;

    const result = await getPuntosVentaStatsAction(fromDate, toDate);
    const stats = result.success && result.stats ? result.stats : [];

    return (
        <EstadisticasPageClient
            stats={stats}
            fromInicial={fromDate}
            toInicial={toDate}
        />
    );
}

