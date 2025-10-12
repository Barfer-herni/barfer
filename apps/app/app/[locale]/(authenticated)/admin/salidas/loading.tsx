import { Card, CardContent, CardHeader } from '@repo/design-system/components/ui/card';
import { Skeleton } from '@repo/design-system/components/ui/skeleton';

export default function SalidasLoading() {
    return (
        <div className="h-full w-full">
            <div className="mb-5 p-5">
                <h1 className="text-2xl font-bold">
                    Gestión de Salidas
                </h1>
                <p className="text-muted-foreground">
                    Administra y visualiza todas las salidas de dinero del negocio.
                </p>
            </div>

            {/* Skeleton para botones de navegación */}
            <div className="mb-6 px-5">
                <div className="flex gap-2">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-32" />
                    <Skeleton className="h-10 w-28" />
                    <Skeleton className="h-10 w-32" />
                </div>
            </div>

            {/* Skeleton para contenido principal */}
            <div className="px-5">
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-48" />
                    </CardHeader>
                    <CardContent>
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
                                        Cargando salidas...
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        Obteniendo registros de salidas del sistema
                                    </p>
                                </div>
                                <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden mx-auto">
                                    <div className="h-full bg-blue-600 rounded-full animate-pulse" style={{ width: '70%' }}></div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

