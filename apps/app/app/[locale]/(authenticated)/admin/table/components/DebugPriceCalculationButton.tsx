'use client';

import { useState } from 'react';
import { debugPriceCalculationAction } from '../actions';

export function DebugPriceCalculationButton() {
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<string | null>(null);

    const handleDebug = async () => {
        setIsLoading(true);
        setResult(null);

        try {
            const debugResult = await debugPriceCalculationAction();

            if (debugResult.success) {
                setResult('✅ Debug completado exitosamente. Revisa la consola del servidor para ver los detalles.');
            } else {
                setResult(`❌ Error: ${debugResult.error}`);
            }
        } catch (error) {
            setResult(`❌ Error inesperado: ${error}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-2">
            <button
                onClick={handleDebug}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isLoading ? 'Ejecutando Debug...' : 'Debug Cálculo de Precios'}
            </button>

            {result && (
                <div className="text-sm p-2 bg-gray-100 rounded-md">
                    {result}
                </div>
            )}
        </div>
    );
}
