'use client';

import { useState, useTransition, useEffect } from 'react';
import { Button } from '@repo/design-system/components/ui/button';
import { Input } from '@repo/design-system/components/ui/input';
import { Checkbox } from '@repo/design-system/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/design-system/components/ui/card';
import { Plus, Save, Loader2 } from 'lucide-react';
import { getWeeksOfMonth, formatWeekTitle } from '../utils/dateUtils';
import {
    saveRepartosWeekAction,
    updateRepartoEntryAction,
    toggleRepartoCompletionAction,
    initializeWeekAction,
    getRepartosDataAction,
    cleanupOldWeeksAction,
    addRowToDayAction,
    removeRowFromDayAction
} from '../actions';
import type { Dictionary } from '@repo/internationalization';
import type { RepartosData, WeekData } from '@repo/data-services';

interface RepartosTableProps {
    data: RepartosData;
    dictionary: Dictionary;
}

export function RepartosTable({ data: initialData, dictionary }: RepartosTableProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [weeksData, setWeeksData] = useState<RepartosData>(initialData);
    const [isEditing, setIsEditing] = useState(false);
    const [isPending, startTransition] = useTransition();

    // Obtener las semanas del mes actual
    const weeks = getWeeksOfMonth(currentMonth);

    // Cargar datos cuando cambie el mes
    useEffect(() => {
        const loadData = async () => {
            const result = await getRepartosDataAction();
            if (result.success && result.data) {
                setWeeksData(result.data);
            }
        };

        loadData();
    }, [currentMonth]);

    const handleTextChange = (weekKey: string, dayKey: string, rowIndex: number, value: string) => {
        // Actualizar estado local inmediatamente
        setWeeksData(prev => ({
            ...prev,
            [weekKey]: {
                ...prev[weekKey],
                [dayKey]: prev[weekKey]?.[dayKey]?.map((entry, index) =>
                    index === rowIndex ? { ...entry, text: value } : entry
                ) || []
            }
        }));

        // Guardar en el servidor
        startTransition(async () => {
            await updateRepartoEntryAction(weekKey, dayKey, rowIndex, { text: value });
        });
    };

    const handleCheckboxChange = (weekKey: string, dayKey: string, rowIndex: number, checked: boolean) => {
        // Actualizar estado local inmediatamente
        setWeeksData(prev => ({
            ...prev,
            [weekKey]: {
                ...prev[weekKey],
                [dayKey]: prev[weekKey]?.[dayKey]?.map((entry, index) =>
                    index === rowIndex ? { ...entry, isCompleted: checked } : entry
                ) || []
            }
        }));

        // Guardar en el servidor
        startTransition(async () => {
            await toggleRepartoCompletionAction(weekKey, dayKey, rowIndex);
        });
    };

    const changeMonth = (direction: 'prev' | 'next') => {
        const newMonth = new Date(currentMonth);
        if (direction === 'prev') {
            newMonth.setMonth(newMonth.getMonth() - 1);
        } else {
            newMonth.setMonth(newMonth.getMonth() + 1);
        }
        setCurrentMonth(newMonth);
    };

    const initializeMissingWeeks = async () => {
        const missingWeeks = weeks.filter(week => !weeksData[week.weekKey]);

        for (const week of missingWeeks) {
            await initializeWeekAction(week.weekKey);
        }

        // Recargar datos después de inicializar
        const result = await getRepartosDataAction();
        if (result.success && result.data) {
            setWeeksData(result.data);
        }
    };

    const saveData = () => {
        startTransition(async () => {
            // Guardar todas las semanas del mes actual
            for (const week of weeks) {
                const weekData = weeksData[week.weekKey];
                if (weekData) {
                    await saveRepartosWeekAction(week.weekKey, weekData);
                }
            }
            setIsEditing(false);
        });
    };

    const handleAddRow = async (weekKey: string, dayKey: string) => {
        const result = await addRowToDayAction(weekKey, dayKey);
        if (result.success) {
            // Recargar datos después de agregar fila
            const dataResult = await getRepartosDataAction();
            if (dataResult.success && dataResult.data) {
                setWeeksData(dataResult.data);
            }
        }
    };

    const handleRemoveRow = async (weekKey: string, dayKey: string, rowIndex: number) => {
        const result = await removeRowFromDayAction(weekKey, dayKey, rowIndex);
        if (result.success) {
            // Recargar datos después de eliminar fila
            const dataResult = await getRepartosDataAction();
            if (dataResult.success && dataResult.data) {
                setWeeksData(dataResult.data);
            }
        }
    };

    const days = ['1', '2', '3', '4', '5', '6']; // Usar números como en el backend
    const dayLabels = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

    return (
        <div className="space-y-6">
            {/* Header con controles */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                {/* Navegación de mes */}
                <div className="flex items-center gap-2 w-full lg:w-auto">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => changeMonth('prev')}
                        className="shrink-0 px-2 sm:px-3"
                    >
                        <span className="sm:hidden">←</span>
                        <span className="hidden sm:inline">← Anterior</span>
                    </Button>

                    <div className="text-sm sm:text-base lg:text-xl font-semibold text-center flex-1 lg:flex-initial px-2 min-w-0">
                        <span className="block truncate">
                            {currentMonth.toLocaleDateString('es-AR', {
                                month: 'long',
                                year: 'numeric'
                            })}
                        </span>
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => changeMonth('next')}
                        className="shrink-0 px-2 sm:px-3"
                    >
                        <span className="sm:hidden">→</span>
                        <span className="hidden sm:inline">Siguiente →</span>
                    </Button>
                </div>

                {/* Botones de acción */}
                <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={initializeMissingWeeks}
                        disabled={isPending}
                        className="flex-1 sm:flex-initial"
                    >
                        {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                        <span className="text-xs sm:text-sm">Inicializar</span>
                    </Button>

                    {isEditing ? (
                        <>
                            <Button
                                size="sm"
                                onClick={saveData}
                                className="flex items-center gap-2 flex-1 sm:flex-initial"
                                disabled={isPending}
                            >
                                {isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Save className="h-4 w-4" />
                                )}
                                <span className="text-xs sm:text-sm">{isPending ? 'Guardando...' : (dictionary.app?.admin?.repartos?.save || 'Guardar')}</span>
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsEditing(false)}
                                disabled={isPending}
                                className="flex-1 sm:flex-initial"
                            >
                                <span className="text-xs sm:text-sm">{dictionary.app?.admin?.repartos?.cancel || 'Cancelar'}</span>
                            </Button>
                        </>
                    ) : (
                        <Button
                            size="sm"
                            onClick={() => setIsEditing(true)}
                            className="flex items-center gap-2 flex-1 sm:flex-initial"
                        >
                            <Plus className="h-4 w-4" />
                            <span className="text-xs sm:text-sm">{dictionary.app?.admin?.repartos?.edit || 'Editar'}</span>
                        </Button>
                    )}
                </div>
            </div>

            {/* Tabla de semanas */}
            <div className="space-y-6">
                {weeks.map((week) => {
                    const weekData = weeksData[week.weekKey];

                    return (
                        <Card key={week.weekKey}>
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold text-center">
                                    {dictionary.app?.admin?.repartos?.week || 'Semana del'} {formatWeekTitle(week.startDate)}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {!weekData ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <p>Esta semana no está inicializada.</p>
                                        <Button
                                            variant="outline"
                                            onClick={async () => {
                                                await initializeWeekAction(week.weekKey);
                                                // Recargar datos después de inicializar
                                                const result = await getRepartosDataAction();
                                                if (result.success && result.data) {
                                                    setWeeksData(result.data);
                                                }
                                            }}
                                            disabled={isPending}
                                            className="mt-2"
                                        >
                                            {isPending ? 'Inicializando...' : 'Inicializar Semana'}
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto -mx-4 px-4">
                                        <div className="grid grid-cols-6 gap-4 min-w-[800px]">
                                            {/* Columna de días */}
                                            {days.map((dayKey, dayIndex) => (
                                                <div key={dayKey} className="space-y-2">
                                                    {/* Header del día */}
                                                    <div className="text-center font-medium text-sm text-muted-foreground whitespace-nowrap">
                                                        {dayLabels[dayIndex]}
                                                    </div>

                                                    {/* Filas de datos dinámicas */}
                                                    {weekData[dayKey]?.map((entry, rowIndex) => (
                                                        <div key={entry.id} className="flex items-center space-x-2">
                                                            {/* Input de texto */}
                                                            <Input
                                                                value={entry.text}
                                                                onChange={(e) => handleTextChange(week.weekKey, dayKey, rowIndex, e.target.value)}
                                                                placeholder={`${dayLabels[dayIndex]} ${rowIndex + 1}`}
                                                                disabled={!isEditing}
                                                                className="text-xs h-8 flex-1"
                                                            />

                                                            {/* Checkbox */}
                                                            <Checkbox
                                                                checked={entry.isCompleted}
                                                                onCheckedChange={(checked) =>
                                                                    handleCheckboxChange(week.weekKey, dayKey, rowIndex, checked as boolean)
                                                                }
                                                                disabled={!isEditing}
                                                                className="shrink-0"
                                                            />

                                                            {/* Botón de eliminar fila */}
                                                            {isEditing && weekData[dayKey].length > 1 && (
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => handleRemoveRow(week.weekKey, dayKey, rowIndex)}
                                                                    className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                                                >
                                                                    ×
                                                                </Button>
                                                            )}
                                                        </div>
                                                    )) || (
                                                            // Fallback para días sin datos
                                                            [0, 1, 2].map((rowIndex) => (
                                                                <div key={rowIndex} className="flex items-center space-x-2">
                                                                    <Input
                                                                        placeholder={`${dayLabels[dayIndex]} ${rowIndex + 1}`}
                                                                        disabled
                                                                        className="text-xs h-8 flex-1"
                                                                    />
                                                                    <Checkbox disabled className="shrink-0" />
                                                                </div>
                                                            ))
                                                        )}

                                                    {/* Botón para agregar filas - ahora abajo de las filas */}
                                                    {isEditing && (
                                                        <div className="flex justify-center space-x-1 mt-2">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleAddRow(week.weekKey, dayKey)}
                                                                className="h-6 w-6 p-0"
                                                            >
                                                                <Plus className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}