'use client'

import { useState, useEffect } from 'react';
import { Dictionary } from '@repo/internationalization';
import { getAllSalidasAction } from '../actions';
import { Button } from '@repo/design-system/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/design-system/components/ui/card';
import { Table2, BarChart3, Tag, Users } from 'lucide-react';
import { SalidasTable } from './SalidasTable';
import { SalidasEstadisticas } from './SalidasEstadisticas';
import { CategoriasManager } from './CategoriasManager';
import { ProveedoresManager } from './ProveedoresManager';
import { SalidaMongoData } from '@repo/data-services';

interface SalidasPageClientProps {
    salidas: SalidaMongoData[];
    dictionary: Dictionary;
    userPermissions?: string[];
    canViewStatistics?: boolean;
}

export function SalidasPageClient({ salidas: initialSalidas, dictionary, userPermissions = [], canViewStatistics = false }: SalidasPageClientProps) {
    const [activeTab, setActiveTab] = useState<'tabla' | 'estadisticas' | 'categorias' | 'proveedores'>('tabla');
    const [salidas, setSalidas] = useState<SalidaMongoData[]>(initialSalidas);
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
                    {canViewStatistics && (
                        <Button
                            onClick={() => setActiveTab('estadisticas')}
                            variant={activeTab === 'estadisticas' ? 'default' : 'outline'}
                            className="flex items-center gap-2"
                        >
                            <BarChart3 className="h-4 w-4" />
                            Estadísticas
                        </Button>
                    )}
                    {canViewStatistics && (
                        <Button
                            onClick={() => setActiveTab('categorias')}
                            variant={activeTab === 'categorias' ? 'default' : 'outline'}
                            className="flex items-center gap-2"
                        >
                            <Tag className="h-4 w-4" />
                            Categorías
                        </Button>
                    )}
                    <Button
                        onClick={() => setActiveTab('proveedores')}
                        variant={activeTab === 'proveedores' ? 'default' : 'outline'}
                        className="flex items-center gap-2"
                    >
                        <Users className="h-4 w-4" />
                        Proveedores
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
                            <SalidasTable
                                salidas={salidas}
                                onRefreshSalidas={refreshSalidas}
                                userPermissions={userPermissions}
                            />
                        </CardContent>
                    </Card>
                )}

                {activeTab === 'estadisticas' && canViewStatistics && (
                    <SalidasEstadisticas onRefreshData={refreshSalidas} />
                )}

                {activeTab === 'categorias' && canViewStatistics && (
                    <CategoriasManager />
                )}

                {activeTab === 'proveedores' && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Gestión de Proveedores</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ProveedoresManager />
                        </CardContent>
                    </Card>
                )}
            </div>
        </>
    );
} 