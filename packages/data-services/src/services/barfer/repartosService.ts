import 'server-only';
import { getCollection } from '@repo/database';
import type { RepartoEntry, WeekData, RepartosData } from '../../types/repartos';

const COLLECTION_NAME = 'repartos';

/**
 * Obtiene todos los datos de repartos
 */
export async function getRepartosData(): Promise<RepartosData> {
    try {
        const collection = await getCollection(COLLECTION_NAME);

        // Buscar todos los documentos de semanas
        const weeks = await collection.find({}).toArray();

        const data: RepartosData = {};
        weeks.forEach(week => {
            if (week.weekKey && week.data) {
                data[week.weekKey] = week.data;
            }
        });

        return data;
    } catch (error) {
        console.error('Error getting repartos data:', error);
        return {};
    }
}

/**
 * Obtiene los datos de repartos para una semana específica
 */
export async function getRepartosByWeek(weekKey: string): Promise<WeekData | null> {
    try {
        const collection = await getCollection(COLLECTION_NAME);
        const result = await collection.findOne({ weekKey });

        if (!result || !result.data) {
            return null;
        }

        return result.data;
    } catch (error) {
        console.error('Error getting repartos by week:', error);
        return null;
    }
}

/**
 * Guarda o actualiza los datos de repartos para una semana específica
 */
export async function saveRepartosWeek(weekKey: string, weekData: WeekData): Promise<boolean> {
    try {
        const collection = await getCollection(COLLECTION_NAME);

        // Usar upsert para crear o actualizar el documento de la semana
        const result = await collection.updateOne(
            { weekKey },
            {
                $set: {
                    weekKey,
                    data: weekData,
                    updatedAt: new Date()
                }
            },
            { upsert: true }
        );

        return result.acknowledged;
    } catch (error) {
        console.error('Error saving repartos week:', error);
        return false;
    }
}

/**
 * Actualiza una entrada específica de repartos
 */
export async function updateRepartoEntry(
    weekKey: string,
    dayKey: string,
    rowIndex: number,
    entry: Partial<RepartoEntry>
): Promise<boolean> {
    try {
        const collection = await getCollection(COLLECTION_NAME);

        const result = await collection.updateOne(
            { weekKey },
            {
                $set: {
                    [`data.${dayKey}.${rowIndex}`]: {
                        ...entry,
                        updatedAt: new Date()
                    },
                    updatedAt: new Date()
                }
            }
        );

        return result.acknowledged;
    } catch (error) {
        console.error('Error updating reparto entry:', error);
        return false;
    }
}

/**
 * Marca una entrada como completada
 */
export async function toggleRepartoCompletion(
    weekKey: string,
    dayKey: string,
    rowIndex: number
): Promise<boolean> {
    try {
        const collection = await getCollection(COLLECTION_NAME);

        // Primero obtener el estado actual
        const current = await collection.findOne({ weekKey });
        if (!current || !current.data || !current.data[dayKey]) {
            return false;
        }

        const currentEntry = current.data[dayKey][rowIndex];
        if (!currentEntry) {
            return false;
        }

        const newIsCompleted = !currentEntry.isCompleted;

        const result = await collection.updateOne(
            { weekKey },
            {
                $set: {
                    [`data.${dayKey}.${rowIndex}.isCompleted`]: newIsCompleted,
                    [`data.${dayKey}.${rowIndex}.updatedAt`]: new Date(),
                    updatedAt: new Date()
                }
            }
        );

        return result.acknowledged;
    } catch (error) {
        console.error('Error toggling reparto completion:', error);
        return false;
    }
}

/**
 * Elimina una semana completa de repartos
 */
export async function deleteRepartosWeek(weekKey: string): Promise<boolean> {
    try {
        const collection = await getCollection(COLLECTION_NAME);

        // Eliminar el documento completo de la semana
        const result = await collection.deleteOne({ weekKey });

        return result.acknowledged;
    } catch (error) {
        console.error('Error deleting repartos week:', error);
        return false;
    }
}

/**
 * Obtiene estadísticas de repartos
 */
export async function getRepartosStats(): Promise<{
    totalWeeks: number;
    completedEntries: number;
    totalEntries: number;
    completionRate: number;
}> {
    try {
        const data = await getRepartosData();
        const weeks = Object.keys(data);
        let totalEntries = 0;
        let completedEntries = 0;

        weeks.forEach(weekKey => {
            const weekData = data[weekKey];
            Object.keys(weekData).forEach(dayKey => {
                const dayEntries = weekData[dayKey];
                totalEntries += dayEntries.length;
                completedEntries += dayEntries.filter(entry => entry.isCompleted).length;
            });
        });

        const completionRate = totalEntries > 0 ? (completedEntries / totalEntries) * 100 : 0;

        return {
            totalWeeks: weeks.length,
            completedEntries,
            totalEntries,
            completionRate: Math.round(completionRate * 100) / 100
        };
    } catch (error) {
        console.error('Error getting repartos stats:', error);
        return {
            totalWeeks: 0,
            completedEntries: 0,
            totalEntries: 0,
            completionRate: 0
        };
    }
}

/**
 * Inicializa una semana con datos vacíos
 */
export async function initializeWeek(weekKey: string): Promise<boolean> {
    try {
        const collection = await getCollection(COLLECTION_NAME);

        // Crear estructura inicial para la semana
        const weekData: WeekData = {
            '1': Array(3).fill(null).map(() => ({
                id: crypto.randomUUID(),
                text: '',
                isCompleted: false,
                createdAt: new Date()
            })),
            '2': Array(3).fill(null).map(() => ({
                id: crypto.randomUUID(),
                text: '',
                isCompleted: false,
                createdAt: new Date()
            })),
            '3': Array(3).fill(null).map(() => ({
                id: crypto.randomUUID(),
                text: '',
                isCompleted: false,
                createdAt: new Date()
            })),
            '4': Array(3).fill(null).map(() => ({
                id: crypto.randomUUID(),
                text: '',
                isCompleted: false,
                createdAt: new Date()
            })),
            '5': Array(3).fill(null).map(() => ({
                id: crypto.randomUUID(),
                text: '',
                isCompleted: false,
                createdAt: new Date()
            })),
            '6': Array(3).fill(null).map(() => ({
                id: crypto.randomUUID(),
                text: '',
                isCompleted: false,
                createdAt: new Date()
            }))
        };

        // Crear un documento separado para esta semana
        const result = await collection.insertOne({
            weekKey,
            data: weekData,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        return result.acknowledged;
    } catch (error) {
        console.error('Error initializing week:', error);
        return false;
    }
}

/**
 * Agrega una fila adicional a un día específico
 */
export async function addRowToDay(weekKey: string, dayKey: string): Promise<boolean> {
    try {
        const collection = await getCollection(COLLECTION_NAME);

        // Obtener la semana actual
        const week = await collection.findOne({ weekKey });
        if (!week || !week.data) {
            return false;
        }

        // Crear nueva fila
        const newRow = {
            id: crypto.randomUUID(),
            text: '',
            isCompleted: false,
            createdAt: new Date()
        };

        // Agregar la nueva fila al día
        const result = await collection.updateOne(
            { weekKey },
            {
                $push: { [`data.${dayKey}`]: newRow },
                $set: { updatedAt: new Date() }
            }
        );

        return result.acknowledged;
    } catch (error) {
        console.error('Error adding row to day:', error);
        return false;
    }
}

/**
 * Elimina una fila específica de un día
 */
export async function removeRowFromDay(weekKey: string, dayKey: string, rowIndex: number): Promise<boolean> {
    try {
        const collection = await getCollection(COLLECTION_NAME);

        // Obtener la semana actual
        const week = await collection.findOne({ weekKey });
        if (!week || !week.data || !week.data[dayKey]) {
            return false;
        }

        // Verificar que no eliminemos la última fila (mínimo 1)
        if (week.data[dayKey].length <= 1) {
            return false;
        }

        // Eliminar la fila específica
        const result = await collection.updateOne(
            { weekKey },
            {
                $unset: { [`data.${dayKey}.${rowIndex}`]: "" },
                $set: { updatedAt: new Date() }
            }
        );

        // Reorganizar el array para eliminar espacios vacíos
        if (result.acknowledged) {
            const updatedWeek = await collection.findOne({ weekKey });
            if (updatedWeek && updatedWeek.data && updatedWeek.data[dayKey]) {
                const filteredRows = updatedWeek.data[dayKey].filter(row => row !== null && row !== undefined);

                await collection.updateOne(
                    { weekKey },
                    {
                        $set: {
                            [`data.${dayKey}`]: filteredRows,
                            updatedAt: new Date()
                        }
                    }
                );
            }
        }

        return result.acknowledged;
    } catch (error) {
        console.error('Error removing row from day:', error);
        return false;
    }
}

/**
 * Limpia semanas muy antiguas (más de 6 meses)
 */
export async function cleanupOldWeeks(): Promise<number> {
    try {
        const collection = await getCollection(COLLECTION_NAME);

        // Calcular fecha límite (6 meses atrás)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        // Buscar semanas más antiguas que 6 meses
        const oldWeeks = await collection.find({
            weekKey: {
                $lt: sixMonthsAgo.toISOString().split('T')[0] // Formato YYYY-MM-DD
            }
        }).toArray();

        if (oldWeeks.length === 0) {
            return 0;
        }

        // Eliminar semanas antiguas
        const result = await collection.deleteMany({
            weekKey: {
                $lt: sixMonthsAgo.toISOString().split('T')[0]
            }
        });

        console.log(`Cleaned up ${result.deletedCount} old weeks`);
        return result.deletedCount;
    } catch (error) {
        console.error('Error cleaning up old weeks:', error);
        return 0;
    }
}

// ===== API FUNCTIONS =====

/**
 * API function: Obtiene todos los datos de repartos
 */
export async function apiGetRepartosData() {
    try {
        const data = await getRepartosData();
        return { success: true, data };
    } catch (error) {
        console.error('Error getting repartos data:', error);
        return { success: false, error: 'Failed to get repartos data' };
    }
}

/**
 * API function: Guarda o actualiza una semana de repartos
 */
export async function apiSaveRepartosWeek(weekKey: string, weekData: WeekData) {
    try {
        if (!weekKey || !weekData) {
            return { success: false, error: 'Missing weekKey or weekData' };
        }

        const saved = await saveRepartosWeek(weekKey, weekData);
        if (saved) {
            return { success: true, message: 'Week saved successfully' };
        } else {
            return { success: false, error: 'Failed to save week' };
        }
    } catch (error) {
        console.error('Error saving repartos week:', error);
        return { success: false, error: 'Internal server error' };
    }
}

/**
 * API function: Inicializa una semana con datos vacíos
 */
export async function apiInitializeWeek(weekKey: string) {
    try {
        if (!weekKey) {
            return { success: false, error: 'Missing weekKey' };
        }

        const initialized = await initializeWeek(weekKey);
        if (initialized) {
            return { success: true, message: 'Week initialized successfully' };
        } else {
            return { success: false, error: 'Failed to initialize week' };
        }
    } catch (error) {
        console.error('Error initializing week:', error);
        return { success: false, error: 'Internal server error' };
    }
}

/**
 * API function: Actualiza una entrada específica de repartos
 */
export async function apiUpdateRepartoEntry(
    weekKey: string,
    dayKey: string,
    rowIndex: number,
    entry: Partial<RepartoEntry>
) {
    try {
        if (!weekKey || !dayKey || rowIndex === undefined || !entry) {
            return { success: false, error: 'Missing required fields' };
        }

        const updated = await updateRepartoEntry(weekKey, dayKey, rowIndex, entry);

        if (updated) {
            return { success: true, message: 'Entry updated successfully' };
        } else {
            return { success: false, error: 'Failed to update entry' };
        }
    } catch (error) {
        console.error('Error updating reparto entry:', error);
        return { success: false, error: 'Internal server error' };
    }
}

/**
 * API function: Marca una entrada como completada o no completada
 */
export async function apiToggleRepartoCompletion(
    weekKey: string,
    dayKey: string,
    rowIndex: number
) {
    try {
        if (!weekKey || !dayKey || rowIndex === undefined) {
            return { success: false, error: 'Missing required fields' };
        }

        const toggled = await toggleRepartoCompletion(weekKey, dayKey, rowIndex);

        if (toggled) {
            return { success: true, message: 'Completion status toggled successfully' };
        } else {
            return { success: false, error: 'Failed to toggle completion status' };
        }
    } catch (error) {
        console.error('Error toggling reparto completion:', error);
        return { success: false, error: 'Internal server error' };
    }
}
