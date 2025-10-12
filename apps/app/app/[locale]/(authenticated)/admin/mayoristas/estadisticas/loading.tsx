import { Card } from '@repo/design-system/components/ui/card';
import { Skeleton } from '@repo/design-system/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@repo/design-system/components/ui/button';
import Link from 'next/link';

export default function EstadisticasLoading() {
    return (
        <div className="h-full w-full">
            <div className="mb-5 p-5">
                <div className="flex items-center gap-4 mb-4">
                    <Link href="/admin/mayoristas">
                        <Button variant="ghost" size="sm">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Volver a Puntos de Venta
                        </Button>
                    </Link>
                </div>
                <div>
                    <h1 className="text-2xl font-bold">
                        Estadísticas de Puntos de Venta
                    </h1>
                    <p className="text-muted-foreground">
                        Análisis detallado de compras y frecuencia por punto de venta
                    </p>
                </div>
            </div>

            <div className="px-5 space-y-6">
                {/* Cards de resumen - Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Card key={i} className="p-6">
                            <div className="flex items-center gap-4">
                                <Skeleton className="h-12 w-12 rounded-full" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-8 w-16" />
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>

                {/* Tabla - Skeleton */}
                <Card className="p-6">
                    <div className="flex items-center justify-center py-12">
                        <div className="text-center space-y-4">
                            <div className="relative">
                                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto"></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="h-12 w-12 rounded-full bg-purple-100"></div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <p className="text-lg font-semibold text-gray-700">
                                    Calculando estadísticas...
                                </p>
                                <p className="text-sm text-gray-500">
                                    Analizando datos de puntos de venta y pedidos
                                </p>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}

