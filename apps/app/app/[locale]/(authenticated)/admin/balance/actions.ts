'use server'

import { getBalanceMonthly } from '@repo/data-services';

// Obtener balance mensual
export async function getBalanceMonthlyAction(startDate?: Date, endDate?: Date) {
    return await getBalanceMonthly(startDate, endDate);
} 