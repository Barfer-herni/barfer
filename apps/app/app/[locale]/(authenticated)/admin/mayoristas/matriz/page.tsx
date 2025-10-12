import { getProductosMatrixAction } from '../actions';
import { Card } from '@repo/design-system/components/ui/card';
import { Badge } from '@repo/design-system/components/ui/badge';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@repo/design-system/components/ui/button';
import Link from 'next/link';
import { MatrixTableClient } from '../components/MatrixTableClient';

export default async function MatrizPage() {
    const result = await getProductosMatrixAction();
    const matrix = result.success && result.matrix ? result.matrix : [];
    const productNames = result.success && result.productNames ? result.productNames : [];

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

            {matrix.length === 0 ? (
                <div className="text-center p-12">
                    <div className="text-gray-500 mb-4">
                        No hay datos disponibles
                    </div>
                    <p className="text-sm text-gray-400">
                        Asegúrate de crear órdenes mayoristas con punto de venta seleccionado.
                    </p>
                </div>
            ) : (
                <div className="px-5 space-y-6">
                    {/* Resumen */}
                    <div className="flex gap-4">
                        <Badge variant="outline" className="px-4 py-2">
                            {matrix.length} puntos de venta
                        </Badge>
                        <Badge variant="outline" className="px-4 py-2">
                            {productNames.length} productos
                        </Badge>
                        <Badge variant="outline" className="px-4 py-2">
                            {matrix.reduce((sum, row) => sum + row.totalKilos, 0).toLocaleString('es-AR')} kg totales
                        </Badge>
                    </div>

                    {/* Tabla con client component para sorting */}
                    <Card className="p-6">
                        <MatrixTableClient matrix={matrix} productNames={productNames} />
                    </Card>
                </div>
            )}
        </div>
    );
}

