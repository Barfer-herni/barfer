'use client';

import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@repo/design-system/components/ui/dialog';
import { Button } from '@repo/design-system/components/ui/button';
import { Card } from '@repo/design-system/components/ui/card';
import { Badge } from '@repo/design-system/components/ui/badge';
import { Table2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { getProductosMatrixAction } from '../actions';
import type { ProductoMatrixData } from '@repo/data-services';

type SortDirection = 'asc' | 'desc' | null;

export function ProductosMatrix() {
    const [matrix, setMatrix] = useState<ProductoMatrixData[]>([]);
    const [productNames, setProductNames] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [sortColumn, setSortColumn] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<SortDirection>(null);

    const handleOpen = async () => {
        setIsOpen(true);
        setLoading(true);
        try {
            console.log('🔄 Cargando matriz de productos...');
            const result = await getProductosMatrixAction();
            console.log('📊 Resultado:', result);

            if (result.success && result.matrix && result.productNames) {
                console.log(`✅ ${result.matrix.length} puntos de venta, ${result.productNames.length} productos`);
                setMatrix(result.matrix);
                setProductNames(result.productNames);
            } else {
                console.error('❌ Error:', result.error);
            }
        } catch (error) {
            console.error('❌ Error al cargar matriz:', error);
        } finally {
            setLoading(false);
        }
    };

    // Función para ordenar columnas
    const handleSort = (columnName: string) => {
        if (sortColumn === columnName) {
            // Si es la misma columna, cambiar dirección
            if (sortDirection === 'desc') {
                setSortDirection('asc');
            } else if (sortDirection === 'asc') {
                setSortDirection(null);
                setSortColumn(null);
            } else {
                setSortDirection('desc');
            }
        } else {
            // Nueva columna
            setSortColumn(columnName);
            setSortDirection('desc');
        }
    };

    // Datos ordenados
    const sortedMatrix = useMemo(() => {
        if (!sortColumn || !sortDirection) return matrix;

        return [...matrix].sort((a, b) => {
            let aValue: number;
            let bValue: number;

            if (sortColumn === 'totalKilos') {
                aValue = a.totalKilos;
                bValue = b.totalKilos;
            } else {
                aValue = a.productos[sortColumn] || 0;
                bValue = b.productos[sortColumn] || 0;
            }

            if (sortDirection === 'asc') {
                return aValue - bValue;
            } else {
                return bValue - aValue;
            }
        });
    }, [matrix, sortColumn, sortDirection]);

    // Ícono de ordenamiento
    const SortIcon = ({ column }: { column: string }) => {
        if (sortColumn !== column) {
            return <ArrowUpDown className="w-3 h-3 ml-1 text-gray-400" />;
        }
        if (sortDirection === 'desc') {
            return <ArrowDown className="w-3 h-3 ml-1 text-blue-600" />;
        }
        return <ArrowUp className="w-3 h-3 ml-1 text-blue-600" />;
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    onClick={handleOpen}
                    className="border-blue-500 text-blue-600 hover:bg-blue-50"
                >
                    <Table2 className="w-4 h-4 mr-2" />
                    Matriz de Productos
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle>Matriz de Productos por Punto de Venta</DialogTitle>
                    <p className="text-sm text-gray-500">
                        Kilos comprados de cada producto por punto de venta. Haz clic en las columnas para ordenar.
                    </p>
                </DialogHeader>

                {loading ? (
                    <div className="flex items-center justify-center p-12">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                            <p className="mt-4 text-gray-600">Calculando matriz...</p>
                        </div>
                    </div>
                ) : sortedMatrix.length === 0 ? (
                    <div className="text-center p-12">
                        <div className="text-gray-500 mb-4">
                            No hay datos disponibles
                        </div>
                        <p className="text-sm text-gray-400">
                            Asegúrate de crear órdenes mayoristas con punto de venta seleccionado.
                        </p>
                    </div>
                ) : (
                    <div className="flex-1 overflow-auto">
                        <Card className="p-4">
                            {/* Resumen */}
                            <div className="mb-4 flex gap-4">
                                <Badge variant="outline" className="px-4 py-2">
                                    {sortedMatrix.length} puntos de venta
                                </Badge>
                                <Badge variant="outline" className="px-4 py-2">
                                    {productNames.length} productos
                                </Badge>
                                <Badge variant="outline" className="px-4 py-2">
                                    {sortedMatrix.reduce((sum, row) => sum + row.totalKilos, 0).toLocaleString('es-AR')} kg totales
                                </Badge>
                            </div>

                            {/* Tabla con scroll horizontal */}
                            <div className="overflow-x-auto border rounded-lg">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 sticky top-0 z-10">
                                        <tr>
                                            <th className="px-4 py-3 text-left font-medium text-gray-700 border-r bg-gray-100 sticky left-0 z-20">
                                                Punto de Venta
                                            </th>
                                            <th
                                                className="px-3 py-3 text-center font-medium text-gray-700 border-r bg-gray-100 cursor-pointer hover:bg-gray-200"
                                                onClick={() => handleSort('totalKilos')}
                                            >
                                                <div className="flex items-center justify-center">
                                                    Total KG
                                                    <SortIcon column="totalKilos" />
                                                </div>
                                            </th>
                                            {productNames.map((productName) => (
                                                <th
                                                    key={productName}
                                                    className="px-3 py-3 text-center font-medium text-gray-700 border-r cursor-pointer hover:bg-gray-200 whitespace-nowrap"
                                                    onClick={() => handleSort(productName)}
                                                >
                                                    <div className="flex items-center justify-center">
                                                        {productName}
                                                        <SortIcon column={productName} />
                                                    </div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {sortedMatrix.map((row) => (
                                            <tr key={row.puntoVentaId} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 font-medium text-gray-900 border-r bg-white sticky left-0 z-10">
                                                    {row.puntoVentaNombre}
                                                </td>
                                                <td className="px-3 py-3 text-center font-semibold text-green-600 border-r bg-green-50">
                                                    {row.totalKilos > 0 ? (
                                                        `${row.totalKilos.toLocaleString('es-AR')}`
                                                    ) : (
                                                        <span className="text-gray-400">--</span>
                                                    )}
                                                </td>
                                                {productNames.map((productName) => {
                                                    const kilos = row.productos[productName] || 0;
                                                    return (
                                                        <td
                                                            key={productName}
                                                            className={`px-3 py-3 text-center border-r ${kilos > 0 ? 'font-medium text-gray-900' : 'text-gray-400'
                                                                }`}
                                                        >
                                                            {kilos > 0 ? kilos.toLocaleString('es-AR') : '--'}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

