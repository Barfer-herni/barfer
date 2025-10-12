import { Card } from '@repo/design-system/components/ui/card';
import { Skeleton } from '@repo/design-system/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@repo/design-system/components/ui/button';
import Link from 'next/link';

export default function MatrizLoading() {
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
                        Matriz de Productos por Punto de Venta
                    </h1>
                    <p className="text-muted-foreground">
                        Kilos comprados de cada producto por punto de venta. Haz clic en las columnas para ordenar.
                    </p>
                </div>
            </div>

            <div className="px-5 space-y-6">
                {/* Resumen - Skeleton */}
                <div className="flex gap-4">
                    <Skeleton className="h-10 w-40" />
                    <Skeleton className="h-10 w-32" />
                    <Skeleton className="h-10 w-44" />
                </div>

                {/* Tabla - Skeleton con animación */}
                <Card className="p-6">
                    <div className="flex items-center justify-center py-12">
                        <div className="text-center space-y-4">
                            <div className="relative">
                                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="h-12 w-12 rounded-full bg-blue-100"></div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <p className="text-lg font-semibold text-gray-700">
                                    Generando matriz de productos...
                                </p>
                                <p className="text-sm text-gray-500">
                                    Procesando datos de productos y puntos de venta
                                </p>
                            </div>

                            {/* Barra de progreso animada */}
                            <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden mx-auto">
                                <div className="h-full bg-blue-600 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}

