'use client';

import { useState, useEffect } from 'react';
import { Button } from '@repo/design-system/components/ui/button';
import { Input } from '@repo/design-system/components/ui/input';
import { Checkbox } from '@repo/design-system/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/design-system/components/ui/card';
import { Plus, Calendar, Save } from 'lucide-react';
import { getWeeksOfMonth, formatWeekTitle } from '../utils/dateUtils';
import type { Dictionary } from '@repo/internationalization';

interface RepartoEntry {
    id: string;
    text: string;
    isCompleted: boolean;
}

interface WeekData {
    [day: string]: RepartoEntry[];
}

interface RepartosTableProps {
    dictionary: Dictionary;
}

export function RepartosTable({ dictionary }: RepartosTableProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [weeksData, setWeeksData] = useState<{ [weekKey: string]: WeekData }>({});
    const [isEditing, setIsEditing] = useState(false);

    // Obtener las semanas del mes actual
    const weeks = getWeeksOfMonth(currentMonth);

    // Inicializar datos si no existen
    useEffect(() => {
        const initializeData = () => {
            const newData: { [weekKey: string]: WeekData } = {};

            weeks.forEach(week => {
                const weekKey = week.weekKey;
                if (!weeksData[weekKey]) {
                    newData[weekKey] = {
                        lunes: [
                            { id: `${weekKey}-lunes-1`, text: '', isCompleted: false },
                            { id: `${weekKey}-lunes-2`, text: '', isCompleted: false },
                            { id: `${weekKey}-lunes-3`, text: '', isCompleted: false }
                        ],
                        martes: [
                            { id: `${weekKey}-martes-1`, text: '', isCompleted: false },
                            { id: `${weekKey}-martes-2`, text: '', isCompleted: false },
                            { id: `${weekKey}-martes-3`, text: '', isCompleted: false }
                        ],
                        miercoles: [
                            { id: `${weekKey}-miercoles-1`, text: '', isCompleted: false },
                            { id: `${weekKey}-miercoles-2`, text: '', isCompleted: false },
                            { id: `${weekKey}-miercoles-3`, text: '', isCompleted: false }
                        ],
                        jueves: [
                            { id: `${weekKey}-jueves-1`, text: '', isCompleted: false },
                            { id: `${weekKey}-jueves-2`, text: '', isCompleted: false },
                            { id: `${weekKey}-jueves-3`, text: '', isCompleted: false }
                        ],
                        viernes: [
                            { id: `${weekKey}-viernes-1`, text: '', isCompleted: false },
                            { id: `${weekKey}-viernes-2`, text: '', isCompleted: false },
                            { id: `${weekKey}-viernes-3`, text: '', isCompleted: false }
                        ],
                        sabado: [
                            { id: `${weekKey}-sabado-1`, text: '', isCompleted: false },
                            { id: `${weekKey}-sabado-2`, text: '', isCompleted: false },
                            { id: `${weekKey}-sabado-3`, text: '', isCompleted: false }
                        ]
                    };
                }
            });

            if (Object.keys(newData).length > 0) {
                setWeeksData(prev => ({ ...prev, ...newData }));
            }
        };

        initializeData();
    }, [weeks, weeksData]);

    const handleTextChange = (weekKey: string, day: string, rowIndex: number, value: string) => {
        setWeeksData(prev => ({
            ...prev,
            [weekKey]: {
                ...prev[weekKey],
                [day]: prev[weekKey][day].map((entry, index) =>
                    index === rowIndex ? { ...entry, text: value } : entry
                )
            }
        }));
    };

    const handleCheckboxChange = (weekKey: string, day: string, rowIndex: number, checked: boolean) => {
        setWeeksData(prev => ({
            ...prev,
            [weekKey]: {
                ...prev[weekKey],
                [day]: prev[weekKey][day].map((entry, index) =>
                    index === rowIndex ? { ...entry, isCompleted: checked } : entry
                )
            }
        }));
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

    const saveData = () => {
        // Aquí implementarías la lógica para guardar en la base de datos
        console.log('Guardando datos:', weeksData);
        setIsEditing(false);
    };

    const days = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    const dayLabels = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

    return (
        <div className="space-y-6">
            {/* Header con controles */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => changeMonth('prev')}
                    >
                        ← {dictionary.app?.admin?.repartos?.previousMonth || 'Mes anterior'}
                    </Button>

                    <div className="text-xl font-semibold">
                        {currentMonth.toLocaleDateString('es-AR', {
                            month: 'long',
                            year: 'numeric'
                        })}
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => changeMonth('next')}
                    >
                        {dictionary.app?.admin?.repartos?.nextMonth || 'Mes siguiente'} →
                    </Button>
                </div>

                <div className="flex items-center space-x-2">
                    {isEditing ? (
                        <>
                            <Button onClick={saveData} className="flex items-center space-x-2">
                                <Save className="h-4 w-4" />
                                {dictionary.app?.admin?.repartos?.save || 'Guardar'}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setIsEditing(false)}
                            >
                                {dictionary.app?.admin?.repartos?.cancel || 'Cancelar'}
                            </Button>
                        </>
                    ) : (
                        <Button
                            onClick={() => setIsEditing(true)}
                            className="flex items-center space-x-2"
                        >
                            <Plus className="h-4 w-4" />
                            {dictionary.app?.admin?.repartos?.edit || 'Editar'}
                        </Button>
                    )}
                </div>
            </div>

            {/* Tabla de semanas */}
            <div className="space-y-6">
                {weeks.map((week) => (
                    <Card key={week.weekKey}>
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold text-center">
                                {dictionary.app?.admin?.repartos?.week || 'Semana del'} {formatWeekTitle(week.startDate)}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-7 gap-4">
                                {/* Columna de días */}
                                {days.map((day, dayIndex) => (
                                    <div key={day} className="space-y-2">
                                        {/* Header del día */}
                                        <div className="text-center font-medium text-sm text-muted-foreground">
                                            {dayLabels[dayIndex]}
                                        </div>

                                        {/* 3 filas de datos */}
                                        {[0, 1, 2].map((rowIndex) => {
                                            const entry = weeksData[week.weekKey]?.[day]?.[rowIndex];
                                            if (!entry) return null;

                                            return (
                                                <div key={entry.id} className="flex items-center space-x-2">
                                                    {/* Input de texto */}
                                                    <Input
                                                        value={entry.text}
                                                        onChange={(e) => handleTextChange(week.weekKey, day, rowIndex, e.target.value)}
                                                        placeholder={`${dayLabels[dayIndex]} ${rowIndex + 1}`}
                                                        disabled={!isEditing}
                                                        className="text-xs h-8 flex-1"
                                                    />

                                                    {/* Checkbox */}
                                                    <Checkbox
                                                        checked={entry.isCompleted}
                                                        onCheckedChange={(checked) =>
                                                            handleCheckboxChange(week.weekKey, day, rowIndex, checked as boolean)
                                                        }
                                                        disabled={!isEditing}
                                                        className="shrink-0"
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
