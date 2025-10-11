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
}: {
    pageIndex?: number;
    pageSize?: number;
    search?: string;
    zona?: string;
    activo?: boolean;
}) {
    'use server';

    return await getMayoristas({
        pageIndex,
        pageSize,
        search,
        zona: zona as any,
        activo,
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

export async function getPuntosVentaStatsAction() {
    'use server';

    const { getPuntosVentaStats } = await import('@repo/data-services');
    return await getPuntosVentaStats();
}

export async function getProductosMatrixAction() {
    'use server';

    const { getProductosMatrix } = await import('@repo/data-services');
    return await getProductosMatrix();
}

