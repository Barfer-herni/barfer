export interface WeekInfo {
    weekKey: string;
    startDate: Date;
    endDate: Date;
}

/**
 * Obtiene todas las semanas del mes que empiezan en lunes
 * @param date - Fecha del mes para el cual obtener las semanas
 * @returns Array de semanas del mes
 */
export function getWeeksOfMonth(date: Date): WeekInfo[] {
    const year = date.getFullYear();
    const month = date.getMonth();

    // Obtener el primer día del mes
    const firstDayOfMonth = new Date(year, month, 1);

    // Obtener el último día del mes
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // Encontrar el primer lunes del mes o el lunes anterior
    const firstMonday = getPreviousMonday(firstDayOfMonth);

    // Encontrar el último domingo del mes o el domingo siguiente
    const lastSunday = getNextSunday(lastDayOfMonth);

    const weeks: WeekInfo[] = [];
    let currentMonday = new Date(firstMonday);

    while (currentMonday <= lastSunday) {
        const weekEnd = new Date(currentMonday);
        weekEnd.setDate(currentMonday.getDate() + 6); // 6 días después = domingo

        weeks.push({
            weekKey: formatWeekKey(currentMonday),
            startDate: new Date(currentMonday),
            endDate: weekEnd
        });

        // Siguiente lunes
        currentMonday.setDate(currentMonday.getDate() + 7);
    }

    return weeks;
}

/**
 * Obtiene el lunes anterior a una fecha dada
 * @param date - Fecha de referencia
 * @returns Fecha del lunes anterior
 */
function getPreviousMonday(date: Date): Date {
    const dayOfWeek = date.getDay();
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // 0 = domingo, 1 = lunes

    const monday = new Date(date);
    monday.setDate(date.getDate() - daysToSubtract);
    return monday;
}

/**
 * Obtiene el domingo siguiente a una fecha dada
 * @param date - Fecha de referencia
 * @returns Fecha del domingo siguiente
 */
function getNextSunday(date: Date): Date {
    const dayOfWeek = date.getDay();
    const daysToAdd = dayOfWeek === 0 ? 0 : 7 - dayOfWeek; // 0 = domingo

    const sunday = new Date(date);
    sunday.setDate(date.getDate() + daysToAdd);
    return sunday;
}

/**
 * Formatea la clave de la semana (YYYY-MM-DD)
 * @param date - Fecha del lunes de la semana
 * @returns Clave formateada de la semana
 */
function formatWeekKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Formatea el título de la semana para mostrar
 * @param startDate - Fecha de inicio de la semana (lunes)
 * @returns Título formateado de la semana
 */
export function formatWeekTitle(startDate: Date): string {
    return startDate.toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit'
    });
}

/**
 * Obtiene el nombre del mes en español
 * @param date - Fecha
 * @returns Nombre del mes en español
 */
export function getMonthName(date: Date): string {
    return date.toLocaleDateString('es-AR', { month: 'long' });
}

/**
 * Obtiene el año de una fecha
 * @param date - Fecha
 * @returns Año
 */
export function getYear(date: Date): number {
    return date.getFullYear();
}
