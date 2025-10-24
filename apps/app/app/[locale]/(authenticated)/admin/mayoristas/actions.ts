'use server';

import {
    getMayoristas,
    getMayoristaById,
    createMayorista,
    updateMayorista,
    deleteMayorista,
    addKilosMes,
    getVentasPorZona,
    type MayoristaCreateInput,
    type MayoristaUpdateInput,
} from '@repo/data-services';
import { revalidatePath } from 'next/cache';

export async function getMayoristasAction({
    pageIndex = 0,
    pageSize = 50,
    search = '',
    zona,
    activo = true,
    sortBy = 'nombre',
    sortDesc = false,
}: {
    pageIndex?: number;
    pageSize?: number;
    search?: string;
    zona?: string;
    activo?: boolean;
    sortBy?: string;
    sortDesc?: boolean;
}) {
    'use server';

    return await getMayoristas({
        pageIndex,
        pageSize,
        search,
        zona: zona as any,
        activo,
        sortBy,
        sortDesc,
    });
}

export async function getMayoristaByIdAction(id: string) {
    'use server';

    return await getMayoristaById(id);
}

export async function createMayoristaAction(data: MayoristaCreateInput) {
    'use server';

    try {
        const result = await createMayorista(data);

        if (result.success) {
            revalidatePath('/admin/mayoristas');
        }

        return result;
    } catch (error) {
        return {
            success: false,
            error: (error as Error).message,
        };
    }
}

export async function updateMayoristaAction(id: string, data: MayoristaUpdateInput) {
    'use server';

    try {
        const result = await updateMayorista(id, data);

        if (result.success) {
            revalidatePath('/admin/mayoristas');
        }

        return result;
    } catch (error) {
        return {
            success: false,
            error: (error as Error).message,
        };
    }
}

export async function deleteMayoristaAction(id: string) {
    'use server';

    try {
        const result = await deleteMayorista(id);

        if (result.success) {
            revalidatePath('/admin/mayoristas');
        }

        return result;
    } catch (error) {
        return {
            success: false,
            error: (error as Error).message,
        };
    }
}

export async function addKilosMesAction(
    id: string,
    mes: number,
    anio: number,
    kilos: number
) {
    'use server';

    try {
        const result = await addKilosMes(id, mes, anio, kilos);

        if (result.success) {
            revalidatePath('/admin/mayoristas');
        }

        return result;
    } catch (error) {
        return {
            success: false,
            error: (error as Error).message,
        };
    }
}

export async function getVentasPorZonaAction() {
    'use server';

    return await getVentasPorZona();
}

export async function getPuntosVentaStatsAction(from?: string, to?: string) {
    'use server';

    const { getPuntosVentaStats } = await import('@repo/data-services');
    return await getPuntosVentaStats(from, to);
}

export async function getProductosMatrixAction(from?: string, to?: string) {
    'use server';

    const { getProductosMatrix } = await import('@repo/data-services');

    // Convertir fechas from/to a year/month para obtener los productNames
    let year: number;
    let month: number;

    if (from) {
        const fromDate = new Date(from);
        year = fromDate.getFullYear();
        month = fromDate.getMonth() + 1; // JavaScript months are 0-based, we need 1-based
    } else {
        // Si no se proporciona fecha, usar la fecha actual
        const now = new Date();
        year = now.getFullYear();
        month = now.getMonth() + 1;
    }

    // Pasar las fechas específicas para el filtrado de la matriz
    return await getProductosMatrix(year, month, from, to);
}

