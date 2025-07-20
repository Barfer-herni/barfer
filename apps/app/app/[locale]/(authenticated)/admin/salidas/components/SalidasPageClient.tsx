'use client'

import { useState, useEffect } from 'react';
import { Dictionary } from '@repo/internationalization';
import { getAllSalidasAction } from '../actions';
import { Button } from '@repo/design-system/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/design-system/components/ui/card';
import { Table2, BarChart3 } from 'lucide-react';
import { SalidasTable } from './SalidasTable';
import { SalidaData } from '@repo/data-services';

interface SalidasPageClientProps {
    salidas: SalidaData[];
    dictionary: Dictionary;
}

export function SalidasPageClient({ salidas: initialSalidas, dictionary }: SalidasPageClientProps) {
    const [activeTab, setActiveTab] = useState<'tabla' | 'estadisticas'>('tabla');
    const [salidas, setSalidas] = useState<SalidaData[]>(initialSalidas);
    const [isLoading, setIsLoading] = useState(false);

    const refreshSalidas = async () => {
        setIsLoading(true);
        try {
            const result = await getAllSalidasAction();
            if (result.success) {
                setSalidas(result.salidas || []);
            }
        } catch (error) {
            console.error('Error refreshing salidas:', error);
        } finally {
            setIsLoading(false);
        }
    };

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
                            <SalidasTable salidas={salidas} onRefreshSalidas={refreshSalidas} />
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