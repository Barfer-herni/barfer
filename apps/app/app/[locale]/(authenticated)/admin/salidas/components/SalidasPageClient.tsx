'use client'

import { useState } from 'react';
import { Dictionary } from '@repo/internationalization';
import { Button } from '@repo/design-system/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/design-system/components/ui/card';
import { Table2, BarChart3 } from 'lucide-react';
import { SalidasTable } from './SalidasTable';

interface Salida {
    id: string;
    fecha: Date;
    detalle: string;
    categoria: string;
    tipo: 'ORDINARIO' | 'EXTRAORDINARIO';
    marca?: string | null;
    monto: number;
    formaPago: 'EFECTIVO' | 'TRANSFERENCIA' | 'TARJETA_DEBITO' | 'TARJETA_CREDITO' | 'MERCADO_PAGO' | 'OTRO';
    tipoRegistro: 'BLANCO' | 'NEGRO';
    createdAt: Date;
    updatedAt: Date;
}

interface SalidasPageClientProps {
    salidas: Salida[];
    dictionary: Dictionary;
}

export function SalidasPageClient({ salidas, dictionary }: SalidasPageClientProps) {
    const [activeTab, setActiveTab] = useState<'tabla' | 'estadisticas'>('tabla');

    return (
        <>
            {/* Botones de navegación */}
            <div className="mb-6 px-5">
                <div className="flex gap-2">
                    <Button
                        onClick={() => setActiveTab('tabla')}
                        variant={activeTab === 'tabla' ? 'default' : 'outline'}
                        className="flex items-center gap-2"
                    >
                        <Table2 className="h-4 w-4" />
                        Tabla
                    </Button>
                    <Button
                        onClick={() => setActiveTab('estadisticas')}
                        variant={activeTab === 'estadisticas' ? 'default' : 'outline'}
                        className="flex items-center gap-2"
                    >
                        <BarChart3 className="h-4 w-4" />
                        Estadísticas
                    </Button>
                </div>
            </div>

            {/* Contenido según la pestaña activa */}
            <div className="px-5">
                {activeTab === 'tabla' && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Tabla de Salidas</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <SalidasTable salidas={salidas} />
                        </CardContent>
                    </Card>
                )}

                {activeTab === 'estadisticas' && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Estadísticas de Salidas</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-center h-40 text-muted-foreground">
                                <p>Estadísticas en desarrollo...</p>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </>
    );
} 