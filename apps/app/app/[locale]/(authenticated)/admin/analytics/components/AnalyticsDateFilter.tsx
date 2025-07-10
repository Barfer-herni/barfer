'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/design-system/components/ui/card';
import { Button } from '@repo/design-system/components/ui/button';
import { Input } from '@repo/design-system/components/ui/input';
import { Badge } from '@repo/design-system/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@repo/design-system/components/ui/popover';
import { Separator } from '@repo/design-system/components/ui/separator';
import { Switch } from '@repo/design-system/components/ui/switch';
import { Label } from '@repo/design-system/components/ui/label';
import { Calendar, Filter, RotateCcw, X } from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

type DateRange = {
    from: Date;
    to: Date;
    preset?: string;
};

type AnalyticsDateFilter = {
    current: DateRange;
    compareEnabled: boolean;
    previous?: DateRange;
};

interface AnalyticsDateFilterProps {
    compact?: boolean;
    showCompare?: boolean;
}

const DATE_PRESETS = [
    { label: 'Hoy', value: 'today', days: 0 },
    { label: 'Ayer', value: 'yesterday', days: -1 },
    { label: 'Últimos 7 días', value: 'last-7-days', days: 7 },
    { label: 'Últimos 30 días', value: 'last-30-days', days: 30 },
    { label: 'Este mes', value: 'this-month', days: 'current-month' },
    { label: 'Mes pasado', value: 'last-month', days: 'last-month' },
    { label: 'Últimos 3 meses', value: 'last-3-months', days: 90 },
    { label: 'Este año', value: 'this-year', days: 'current-year' },
];

// Función para crear fechas en UTC para evitar problemas de timezone
function createUTCDate(year: number, month: number, day: number, hour = 0, minute = 0, second = 0): Date {
    return new Date(Date.UTC(year, month, day, hour, minute, second));
}

// Función para obtener fecha actual en UTC
function getTodayUTC(): Date {
    const now = new Date();
    return createUTCDate(now.getFullYear(), now.getMonth(), now.getDate());
}

function getDateRangeFromPreset(preset: string): DateRange {
    const todayUTC = getTodayUTC();
    const year = todayUTC.getUTCFullYear();
    const month = todayUTC.getUTCMonth();
    const day = todayUTC.getUTCDate();

    const startOfToday = createUTCDate(year, month, day);
    const endOfToday = createUTCDate(year, month, day, 23, 59, 59);

    switch (preset) {
        case 'today':
            return { from: startOfToday, to: endOfToday, preset };
        case 'yesterday':
            const yesterdayMs = todayUTC.getTime() - (24 * 60 * 60 * 1000);
            const yesterdayDate = new Date(yesterdayMs);
            const startOfYesterday = createUTCDate(yesterdayDate.getUTCFullYear(), yesterdayDate.getUTCMonth(), yesterdayDate.getUTCDate());
            const endOfYesterday = createUTCDate(yesterdayDate.getUTCFullYear(), yesterdayDate.getUTCMonth(), yesterdayDate.getUTCDate(), 23, 59, 59);
            return { from: startOfYesterday, to: endOfYesterday, preset };
        case 'last-7-days':
            const sevenDaysAgoMs = todayUTC.getTime() - (6 * 24 * 60 * 60 * 1000);
            const sevenDaysAgoDate = new Date(sevenDaysAgoMs);
            const startOfSevenDaysAgo = createUTCDate(sevenDaysAgoDate.getUTCFullYear(), sevenDaysAgoDate.getUTCMonth(), sevenDaysAgoDate.getUTCDate());
            return { from: startOfSevenDaysAgo, to: endOfToday, preset };
        case 'last-30-days':
            const thirtyDaysAgoMs = todayUTC.getTime() - (29 * 24 * 60 * 60 * 1000);
            const thirtyDaysAgoDate = new Date(thirtyDaysAgoMs);
            const startOfThirtyDaysAgo = createUTCDate(thirtyDaysAgoDate.getUTCFullYear(), thirtyDaysAgoDate.getUTCMonth(), thirtyDaysAgoDate.getUTCDate());
            return { from: startOfThirtyDaysAgo, to: endOfToday, preset };
        case 'this-month':
            const startOfMonth = createUTCDate(year, month, 1);
            const endOfMonth = createUTCDate(year, month + 1, 0, 23, 59, 59);
            return { from: startOfMonth, to: endOfMonth, preset };
        case 'last-month':
            const startOfLastMonth = createUTCDate(year, month - 1, 1);
            const endOfLastMonth = createUTCDate(year, month, 0, 23, 59, 59);
            return { from: startOfLastMonth, to: endOfLastMonth, preset };
        case 'last-3-months':
            const threeMonthsAgoDate = new Date(year, month - 3, day);
            const startOfThreeMonthsAgo = createUTCDate(threeMonthsAgoDate.getUTCFullYear(), threeMonthsAgoDate.getUTCMonth(), threeMonthsAgoDate.getUTCDate());
            return { from: startOfThreeMonthsAgo, to: endOfToday, preset };
        case 'this-year':
            const startOfYear = createUTCDate(year, 0, 1);
            const endOfYear = createUTCDate(year, 11, 31, 23, 59, 59);
            return { from: startOfYear, to: endOfYear, preset };
        default:
            return getDateRangeFromPreset('last-30-days');
    }
}

function formatDateRange(range: DateRange): string {
    if (range.preset) {
        const preset = DATE_PRESETS.find(p => p.value === range.preset);
        if (preset) return preset.label;
    }

    return `${format(range.from, 'dd/MM/yyyy')} - ${format(range.to, 'dd/MM/yyyy')}`;
}

function formatDateForInput(date: Date): string {
    return format(date, 'yyyy-MM-dd');
}

export function AnalyticsDateFilter({ compact = false, showCompare = true }: AnalyticsDateFilterProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isOpen, setIsOpen] = useState(false);

    // Leer el filtro actual desde searchParams
    const getCurrentFilter = (): AnalyticsDateFilter => {
        const from = searchParams.get('from');
        const to = searchParams.get('to');
        const preset = searchParams.get('preset');
        const compare = searchParams.get('compare') === 'true';
        const compareFrom = searchParams.get('compareFrom');
        const compareTo = searchParams.get('compareTo');

        // Función auxiliar para validar fechas
        const isValidDate = (dateString: string | null): boolean => {
            if (!dateString) return false;
            const date = new Date(dateString);
            return !isNaN(date.getTime());
        };

        const current = from && to && isValidDate(from) && isValidDate(to) ? {
            from: new Date(from),
            to: new Date(to),
            preset: preset || undefined
        } : getDateRangeFromPreset('last-30-days');

        const previous = compare && compareFrom && compareTo && isValidDate(compareFrom) && isValidDate(compareTo) ? {
            from: new Date(compareFrom),
            to: new Date(compareTo)
        } : undefined;

        return {
            current,
            compareEnabled: compare,
            previous
        };
    };

    // Función para detectar si hay filtros activos (diferentes al preset por defecto)
    const hasActiveFilters = (): boolean => {
        const hasQueryParams = searchParams.has('from') || searchParams.has('to') || searchParams.has('preset') || searchParams.has('compare');
        return hasQueryParams;
    };

    const analyticsDateFilter = getCurrentFilter();
    const [tempFilter, setTempFilter] = useState<AnalyticsDateFilter>(analyticsDateFilter);

    // Sincronizar tempFilter cuando cambie la URL (cuando se apliquen cambios)
    const currentSearchParamsString = searchParams.toString();
    const [lastSearchParams, setLastSearchParams] = useState(currentSearchParamsString);

    if (currentSearchParamsString !== lastSearchParams) {
        const updatedFilter = getCurrentFilter();
        setTempFilter(updatedFilter);
        setLastSearchParams(currentSearchParamsString);
    }

    const handlePresetSelect = (presetValue: string) => {
        const newRange = getDateRangeFromPreset(presetValue);
        setTempFilter({
            current: newRange,
            compareEnabled: tempFilter.compareEnabled,
            previous: tempFilter.previous
        });
    };

    const handleCustomDateChange = (field: 'from' | 'to', value: string) => {
        if (!value) return;

        // Crear fecha UTC para evitar problemas de timezone
        const date = new Date(value + 'T00:00:00.000Z');
        const newRange: DateRange = {
            ...tempFilter.current,
            [field]: field === 'to' ? new Date(value + 'T23:59:59.999Z') : date,
            preset: undefined // Clear preset when using custom dates
        };

        setTempFilter({
            current: newRange,
            compareEnabled: tempFilter.compareEnabled,
            previous: tempFilter.previous
        });
    };

    const handleCompareToggle = (enabled: boolean) => {
        setTempFilter({
            ...tempFilter,
            compareEnabled: enabled,
            previous: enabled ? (tempFilter.previous || getDateRangeFromPreset('last-30-days')) : undefined
        });
    };

    const handleCompareDateChange = (field: 'from' | 'to', value: string) => {
        if (!value || !tempFilter.previous) return;

        const date = new Date(value + 'T00:00:00.000Z');
        const newPreviousRange: DateRange = {
            ...tempFilter.previous,
            [field]: field === 'to' ? new Date(value + 'T23:59:59.999Z') : date
        };

        setTempFilter({
            ...tempFilter,
            previous: newPreviousRange
        });
    };

    const handleApply = () => {
        const params = new URLSearchParams();

        // Agregar parámetros del período principal
        params.set('from', tempFilter.current.from.toISOString().split('T')[0]);
        params.set('to', tempFilter.current.to.toISOString().split('T')[0]);
        if (tempFilter.current.preset) {
            params.set('preset', tempFilter.current.preset);
        }

        // Agregar parámetros de comparación si está habilitada
        if (tempFilter.compareEnabled && tempFilter.previous) {
            params.set('compare', 'true');
            params.set('compareFrom', tempFilter.previous.from.toISOString().split('T')[0]);
            params.set('compareTo', tempFilter.previous.to.toISOString().split('T')[0]);
        }

        router.push(`?${params.toString()}`);
        setIsOpen(false);
    };

    const handleCancel = () => {
        setTempFilter(analyticsDateFilter);
        setIsOpen(false);
    };

    const handleReset = () => {
        const params = new URLSearchParams();
        router.push(`?${params.toString()}`);
    };

    const triggerContent = (
        <Button variant="outline" className={compact ? "justify-start text-left font-normal" : "w-full justify-start text-left font-normal min-h-[40px] h-auto"}>
            <Calendar className="mr-2 h-4 w-4 flex-shrink-0" />
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 min-w-0 flex-1">
                <span className="truncate">{formatDateRange(analyticsDateFilter.current)}</span>
                {analyticsDateFilter.compareEnabled && (
                    <Badge variant="secondary" className="text-xs flex-shrink-0 w-fit">
                        vs período 2
                    </Badge>
                )}
            </div>
        </Button>
    );

    const resetButton = hasActiveFilters() && (
        <Button
            onClick={handleReset}
            variant="outline"
            size="sm"
            className="h-10 px-3 text-xs"
            title="Resetear filtros"
        >
            <X className="h-3 w-3 mr-1" />
            Resetear
        </Button>
    );

    const filterContent = (
        <div className="space-y-4 p-4">
            {/* Período Principal */}
            <div>
                <Label className="text-sm font-semibold">Período Principal</Label>

                {/* Presets */}
                <div className="mt-2">
                    <Label className="text-xs text-muted-foreground">Períodos rápidos</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 mt-1">
                        {DATE_PRESETS.map((preset) => (
                            <Button
                                key={preset.value}
                                variant={tempFilter.current.preset === preset.value ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => handlePresetSelect(preset.value)}
                                className="text-xs h-8 px-2"
                            >
                                {preset.label}
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Custom Date Range */}
                <div className="mt-3">
                    <Label className="text-xs text-muted-foreground">Rango personalizado</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                        <div>
                            <Label className="text-xs text-muted-foreground">Desde</Label>
                            <Input
                                type="date"
                                value={formatDateForInput(tempFilter.current.from)}
                                onChange={(e) => handleCustomDateChange('from', e.target.value)}
                                className="text-sm h-8"
                            />
                        </div>
                        <div>
                            <Label className="text-xs text-muted-foreground">Hasta</Label>
                            <Input
                                type="date"
                                value={formatDateForInput(tempFilter.current.to)}
                                onChange={(e) => handleCustomDateChange('to', e.target.value)}
                                className="text-sm h-8"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {showCompare && (
                <>
                    <Separator />

                    {/* Comparación */}
                    <div>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                            <div className="flex-1 min-w-0">
                                <Label className="text-sm font-semibold">Comparar Períodos</Label>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Compara con un segundo período personalizado
                                </p>
                            </div>
                            <Switch
                                checked={tempFilter.compareEnabled}
                                onCheckedChange={handleCompareToggle}
                                className="flex-shrink-0"
                            />
                        </div>

                        {tempFilter.compareEnabled && (
                            <div>
                                <Label className="text-xs text-muted-foreground">Período de comparación</Label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                                    <div>
                                        <Label className="text-xs text-muted-foreground">Desde</Label>
                                        <Input
                                            type="date"
                                            value={tempFilter.previous ? formatDateForInput(tempFilter.previous.from) : ''}
                                            onChange={(e) => handleCompareDateChange('from', e.target.value)}
                                            className="text-sm h-8"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-xs text-muted-foreground">Hasta</Label>
                                        <Input
                                            type="date"
                                            value={tempFilter.previous ? formatDateForInput(tempFilter.previous.to) : ''}
                                            onChange={(e) => handleCompareDateChange('to', e.target.value)}
                                            className="text-sm h-8"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}

            <Separator />

            {/* Actions */}
            <div className="flex gap-2">
                <Button onClick={handleApply} size="sm" className="flex-1 h-8">
                    Aplicar
                </Button>
                <Button onClick={handleCancel} variant="outline" size="sm" className="flex-1 h-8">
                    Cancelar
                </Button>
                <Button onClick={handleReset} variant="ghost" size="sm" className="h-8 px-2">
                    <RotateCcw className="h-3 w-3" />
                </Button>
            </div>
        </div>
    );

    if (compact) {
        return (
            <div className="flex gap-2 items-start">
                <div className="flex-1">
                    <Popover open={isOpen} onOpenChange={setIsOpen}>
                        <PopoverTrigger asChild>
                            {triggerContent}
                        </PopoverTrigger>
                        <PopoverContent align="start" className="p-0 w-[95vw] sm:w-[600px] max-w-[95vw]">
                            {filterContent}
                        </PopoverContent>
                    </Popover>
                </div>
                {resetButton}
            </div>
        );
    }

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Filter className="h-5 w-5" />
                            Filtro de Fechas
                        </CardTitle>
                        <CardDescription>
                            Selecciona el período para analizar los datos
                        </CardDescription>
                    </div>
                    {resetButton}
                </div>
            </CardHeader>
            <CardContent className="pt-0">
                <Popover open={isOpen} onOpenChange={setIsOpen}>
                    <PopoverTrigger asChild>
                        {triggerContent}
                    </PopoverTrigger>
                    <PopoverContent align="start" className="p-0 w-[95vw] sm:w-[600px] max-w-[95vw]">
                        {filterContent}
                    </PopoverContent>
                </Popover>

                {/* Summary */}
                <div className="mt-4 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm">
                        <span className="text-muted-foreground flex-shrink-0">Período Principal:</span>
                        <Badge variant="outline" className="text-xs w-fit">
                            {formatDateRange(analyticsDateFilter.current)}
                        </Badge>
                    </div>
                    {analyticsDateFilter.compareEnabled && analyticsDateFilter.previous && (
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm">
                            <span className="text-muted-foreground flex-shrink-0">Período de Comparación:</span>
                            <Badge variant="secondary" className="text-xs w-fit">
                                {formatDateRange(analyticsDateFilter.previous)}
                            </Badge>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
} 