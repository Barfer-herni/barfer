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
                </>
            )}
        </div>
    );
} 