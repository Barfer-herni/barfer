'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/design-system/components/ui/card';
import { QuantityTable } from './QuantityTable';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ProductQuantity {
    month: string;
    // Productos Perro
    pollo: number;
    vaca: number;
    cerdo: number;
    cordero: number;
    bigDogPollo: number;
    bigDogVaca: number;
    totalPerro: number;
    // Productos Gato
    gatoPollo: number;
    gatoVaca: number;
    gatoCordero: number;
    totalGato: number;
    // Otros
    huesosCarnosos: number;
    // Total del mes
    totalMes: number;
}

interface QuantityStatsByType {
    minorista: ProductQuantity[];
    sameDay: ProductQuantity[];
    mayorista: ProductQuantity[];
}

interface QuantityAnalyticsClientProps {
    dateFilter: {
        from: Date;
        to: Date;
    };
    compareFilter?: {
        from: Date;
        to: Date;
    };
    quantityStats?: QuantityStatsByType;
    compareQuantityStats?: QuantityStatsByType;
}

export function QuantityAnalyticsClient({
    dateFilter,
    compareFilter,
    quantityStats,
    compareQuantityStats
}: QuantityAnalyticsClientProps) {
    const formatDateRange = (from: Date, to: Date) => {
        if (!from || !to) {
            return 'Período no válido';
        }
        return `${format(from, 'dd/MM/yyyy', { locale: es })} - ${format(to, 'dd/MM/yyyy', { locale: es })}`;
    };

    // Función para calcular los totales generales sumando todos los tipos de pedidos
    const getTotalData = (stats?: QuantityStatsByType): ProductQuantity[] => {
        if (!stats) return [];

        const minorista = stats.minorista || [];
        const sameDay = stats.sameDay || [];
        const mayorista = stats.mayorista || [];

        // Obtener todos los meses únicos
        const allMonths = new Set([
            ...minorista.map(m => m.month),
            ...sameDay.map(m => m.month),
            ...mayorista.map(m => m.month)
        ]);

        return Array.from(allMonths).sort().map(month => {
            const minoristaMonth = minorista.find(m => m.month === month);
            const sameDayMonth = sameDay.find(m => m.month === month);
            const mayoristaMonth = mayorista.find(m => m.month === month);

            return {
                month,
                // Productos Perro - sumar todos los tipos
                pollo: (minoristaMonth?.pollo || 0) + (sameDayMonth?.pollo || 0) + (mayoristaMonth?.pollo || 0),
                vaca: (minoristaMonth?.vaca || 0) + (sameDayMonth?.vaca || 0) + (mayoristaMonth?.vaca || 0),
                cerdo: (minoristaMonth?.cerdo || 0) + (sameDayMonth?.cerdo || 0) + (mayoristaMonth?.cerdo || 0),
                cordero: (minoristaMonth?.cordero || 0) + (sameDayMonth?.cordero || 0) + (mayoristaMonth?.cordero || 0),
                bigDogPollo: (minoristaMonth?.bigDogPollo || 0) + (sameDayMonth?.bigDogPollo || 0) + (mayoristaMonth?.bigDogPollo || 0),
                bigDogVaca: (minoristaMonth?.bigDogVaca || 0) + (sameDayMonth?.bigDogVaca || 0) + (mayoristaMonth?.bigDogVaca || 0),
                totalPerro: (minoristaMonth?.totalPerro || 0) + (sameDayMonth?.totalPerro || 0) + (mayoristaMonth?.totalPerro || 0),
                // Productos Gato - sumar todos los tipos
                gatoPollo: (minoristaMonth?.gatoPollo || 0) + (sameDayMonth?.gatoPollo || 0) + (mayoristaMonth?.gatoPollo || 0),
                gatoVaca: (minoristaMonth?.gatoVaca || 0) + (sameDayMonth?.gatoVaca || 0) + (mayoristaMonth?.gatoVaca || 0),
                gatoCordero: (minoristaMonth?.gatoCordero || 0) + (sameDayMonth?.gatoCordero || 0) + (mayoristaMonth?.gatoCordero || 0),
                totalGato: (minoristaMonth?.totalGato || 0) + (sameDayMonth?.totalGato || 0) + (mayoristaMonth?.totalGato || 0),
                // Otros - sumar todos los tipos
                huesosCarnosos: (minoristaMonth?.huesosCarnosos || 0) + (sameDayMonth?.huesosCarnosos || 0) + (mayoristaMonth?.huesosCarnosos || 0),
                // Total del mes - sumar todos los tipos
                totalMes: (minoristaMonth?.totalMes || 0) + (sameDayMonth?.totalMes || 0) + (mayoristaMonth?.totalMes || 0)
            };
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h2 className="text-xl font-semibold">Cantidad Total KG</h2>
                <div className="text-sm text-muted-foreground">
                    Todos los meses del {new Date().getFullYear()}
                </div>
            </div>

            {/* Tabla de Minoristas */}
            <QuantityTable
                data={quantityStats?.minorista || []}
                title="Minoristas"
                description="Cantidad total en KG por mes para pedidos minoristas"
            />

            {/* Tabla de Envíos en el Día */}
            <QuantityTable
                data={quantityStats?.sameDay || []}
                title="Envíos en el Día"
                description="Cantidad total en KG por mes para envíos en el día"
            />

            {/* Tabla de Mayoristas */}
            <QuantityTable
                data={quantityStats?.mayorista || []}
                title="Mayoristas"
                description="Cantidad total en KG por mes para pedidos mayoristas"
            />

            {/* Tabla de Totales Generales */}
            <QuantityTable
                data={getTotalData(quantityStats)}
                title="Totales Generales"
                description="Cantidad total en KG por mes sumando todos los tipos de pedidos (Minoristas + Envíos en el Día + Mayoristas)"
            />

            {/* Datos de comparación */}
            {compareFilter && compareQuantityStats && (
                <>
                    <div className="mt-8">
                        <h3 className="text-lg font-semibold mb-4">
                            Comparación con año anterior ({new Date().getFullYear() - 1})
                        </h3>
                    </div>

                    {/* Tabla de comparación - Minoristas */}
                    <QuantityTable
                        data={compareQuantityStats.minorista || []}
                        title="Minoristas (Comparación)"
                        description="Cantidad total en KG por mes para pedidos minoristas - Período de comparación"
                    />

                    {/* Tabla de comparación - Envíos en el Día */}
                    <QuantityTable
                        data={compareQuantityStats.sameDay || []}
                        title="Envíos en el Día (Comparación)"
                        description="Cantidad total en KG por mes para envíos en el día - Período de comparación"
                    />

                    {/* Tabla de comparación - Mayoristas */}
                    <QuantityTable
                        data={compareQuantityStats.mayorista || []}
                        title="Mayoristas (Comparación)"
                        description="Cantidad total en KG por mes para pedidos mayoristas - Período de comparación"
                    />

                    {/* Tabla de comparación - Totales Generales */}
                    <QuantityTable
                        data={getTotalData(compareQuantityStats)}
                        title="Totales Generales (Comparación)"
                        description="Cantidad total en KG por mes sumando todos los tipos de pedidos - Período de comparación"
                    />
                </>
            )}
        </div>
    );
} 