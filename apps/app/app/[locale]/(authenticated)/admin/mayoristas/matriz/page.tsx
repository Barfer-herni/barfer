import { getProductosMatrixAction } from '../actions';
import { MatrizPageClient } from './components/MatrizPageClient';

export default async function MatrizPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const { from, to } = await searchParams || {};

    const fromDate = from as string | undefined;
    const toDate = to as string | undefined;

    const result = await getProductosMatrixAction(fromDate, toDate);
    const matrix = result.success && result.matrix ? result.matrix : [];
    const productNames = result.success && result.productNames ? result.productNames : [];

    return (
        <MatrizPageClient
            matrix={matrix}
            productNames={productNames}
            fromInicial={fromDate}
            toInicial={toDate}
        />
    );
}
