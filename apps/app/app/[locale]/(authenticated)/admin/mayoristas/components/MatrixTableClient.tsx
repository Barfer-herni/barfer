'use client';

import { useState, useMemo } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import type { ProductoMatrixData } from '@repo/data-services';

type SortDirection = 'asc' | 'desc' | null;

interface MatrixTableClientProps {
    matrix: ProductoMatrixData[];
    productNames: string[];
}

export function MatrixTableClient({ matrix, productNames }: MatrixTableClientProps) {
    const [sortColumn, setSortColumn] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<SortDirection>(null);

    // Función helper para determinar si un producto está en gramos
    const isProductInGrams = (productName: string): boolean => {
        return productName.toUpperCase().includes('GRS');
    };

    // Función para obtener la unidad de medida de un producto
    const getProductUnit = (productName: string): string => {
        return isProductInGrams(productName) ? 'unidades' : 'kg';
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
                                const quantity = row.productos[productName] || 0;
                                const unit = getProductUnit(productName);
                                return (
                                    <td
                                        key={productName}
                                        className={`px-3 py-3 text-center border-r ${quantity > 0 ? 'font-medium text-gray-900' : 'text-gray-400'
                                            }`}
                                        title={`${quantity} ${unit}`}
                                    >
                                        {quantity > 0 ? quantity.toLocaleString('es-AR') : '--'}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

