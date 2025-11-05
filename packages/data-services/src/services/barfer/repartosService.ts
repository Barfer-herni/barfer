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
        const weeks = await collection.find({}).sort({ updatedAt: -1 }).toArray();

        const data: RepartosData = {};
        const seenWeekKeys = new Set<string>();

        // Si hay múltiples documentos para la misma semana, usar el más reciente
        weeks.forEach(week => {
            if (week.weekKey && week.data) {
                // Solo tomar el primer documento encontrado para cada weekKey (el más reciente por el sort)
                if (!seenWeekKeys.has(week.weekKey)) {
                    data[week.weekKey] = week.data;
                    seenWeekKeys.add(week.weekKey);
                }
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
        // Si hay múltiples documentos, obtener el más reciente
        const result = await collection.findOne(
            { weekKey },
            { sort: { updatedAt: -1 } }
        );

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

        // Primero verificar si existe un documento para esta semana
        const existing = await collection.findOne({ weekKey }, { sort: { updatedAt: -1 } });

        if (existing) {
            // Si existe, actualizar el más reciente y eliminar duplicados
            const result = await collection.updateOne(
                { _id: existing._id },
                {
                    $set: {
                        weekKey,
                        data: weekData,
                        updatedAt: new Date()
                    }
                }
            );

            // Eliminar duplicados de la misma semana (excepto el que acabamos de actualizar)
            await collection.deleteMany({
                weekKey,
                _id: { $ne: existing._id }
            });

            return result.acknowledged;
        } else {
            // Si no existe, crear uno nuevo
            const result = await collection.insertOne({
                weekKey,
                data: weekData,
                createdAt: new Date(),
                updatedAt: new Date()
            });

            return result.acknowledged;
        }
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

        // Primero obtener el documento actual para preservar los campos existentes
        const currentDoc = await collection.findOne(
            { weekKey },
            { sort: { updatedAt: -1 } } // Si hay duplicados, usar el más reciente
        );

        if (!currentDoc || !currentDoc.data || !currentDoc.data[dayKey] || !currentDoc.data[dayKey][rowIndex]) {
            console.error('Entry not found for update');
            return false;
        }

        // Obtener la entrada actual
        const currentEntry = currentDoc.data[dayKey][rowIndex];

        // Fusionar los campos existentes con los nuevos, preservando id y createdAt
        const updatedEntry: RepartoEntry = {
            ...currentEntry,
            ...entry,
            id: currentEntry.id, // Preservar el id original
            createdAt: currentEntry.createdAt, // Preservar createdAt
            updatedAt: new Date()
        };

        const result = await collection.updateOne(
            { weekKey, _id: currentDoc._id }, // Usar _id específico para evitar actualizar duplicados
            {
                $set: {
                    [`data.${dayKey}.${rowIndex}`]: updatedEntry,
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

        // Primero obtener el estado actual (usar el más reciente si hay duplicados)
        const current = await collection.findOne(
            { weekKey },
            { sort: { updatedAt: -1 } }
        );
        if (!current || !current.data || !current.data[dayKey]) {
            return false;
        }

        const currentEntry = current.data[dayKey][rowIndex];
        if (!currentEntry) {
            return false;
        }

        const newIsCompleted = !currentEntry.isCompleted;

        const result = await collection.updateOne(
            { _id: current._id }, // Usar _id específico para evitar actualizar duplicados
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

        // Verificar si ya existe una semana para esta weekKey
        const existing = await collection.findOne({ weekKey }, { sort: { updatedAt: -1 } });

        if (existing) {
            // Si ya existe, no crear duplicado, solo retornar true
            return true;
        }

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

        // Obtener la semana actual (usar el más reciente si hay duplicados)
        const week = await collection.findOne(
            { weekKey },
            { sort: { updatedAt: -1 } }
        );
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
            { _id: week._id }, // Usar _id específico para evitar actualizar duplicados
            {
                $push: { [`data.${dayKey}`]: newRow as any },
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

        // Obtener la semana actual (usar el más reciente si hay duplicados)
        const week = await collection.findOne(
            { weekKey },
            { sort: { updatedAt: -1 } }
        );
        if (!week || !week.data || !week.data[dayKey]) {
            return false;
        }

        // Verificar que no eliminemos la última fila (mínimo 1)
        if (week.data[dayKey].length <= 1) {
            return false;
        }

        // Crear un nuevo array sin la fila a eliminar
        const filteredRows = week.data[dayKey].filter((_: any, index: number) => index !== rowIndex);

        // Actualizar el documento con el array filtrado
        const result = await collection.updateOne(
            { _id: week._id }, // Usar _id específico para evitar actualizar duplicados
            {
                $set: {
                    [`data.${dayKey}`]: filteredRows,
                    updatedAt: new Date()
                }
            }
        );

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

/**
 * Limpia documentos duplicados, manteniendo solo el más reciente para cada weekKey
 */
export async function cleanupDuplicateWeeks(): Promise<number> {
    try {
        const collection = await getCollection(COLLECTION_NAME);

        // Obtener todos los documentos agrupados por weekKey
        const allWeeks = await collection.find({}).sort({ updatedAt: -1 }).toArray();

        const weekKeyMap = new Map<string, any>();
        const duplicatesToDelete: any[] = [];

        // Identificar duplicados
        allWeeks.forEach(week => {
            if (!week.weekKey) return;

            if (!weekKeyMap.has(week.weekKey)) {
                // Primer documento encontrado (más reciente por el sort), mantenerlo
                weekKeyMap.set(week.weekKey, week);
            } else {
                // Documento duplicado, agregarlo a la lista de eliminación
                duplicatesToDelete.push(week._id);
            }
        });

        if (duplicatesToDelete.length === 0) {
            return 0;
        }

        // Eliminar duplicados
        const result = await collection.deleteMany({
            _id: { $in: duplicatesToDelete }
        });

        console.log(`Cleaned up ${result.deletedCount} duplicate weeks`);
        return result.deletedCount;
    } catch (error) {
        console.error('Error cleaning up duplicate weeks:', error);
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
