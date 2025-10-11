'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@repo/design-system/components/ui/input';
import { Label } from '@repo/design-system/components/ui/label';
import { Button } from '@repo/design-system/components/ui/button';
import { Search, X, Store } from 'lucide-react';
import { searchMayoristasAction } from '../actions';
import type { Mayorista } from '@repo/data-services';

interface MayoristaSearchProps {
    onMayoristaSelect: (mayorista: Mayorista | null) => void;
    disabled?: boolean;
}

export function MayoristaSearch({ onMayoristaSelect, disabled = false }: MayoristaSearchProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<Mayorista[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [selectedMayorista, setSelectedMayorista] = useState<Mayorista | null>(null);
    const searchRef = useRef<HTMLDivElement>(null);

    // Cerrar resultados al hacer clic fuera
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowResults(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Buscar puntos de venta usando Server Action
    const searchMayoristas = async (term: string) => {
        if (!term.trim() || term.length < 2) {
            setSearchResults([]);
            setShowResults(false);
            return;
        }

        setIsSearching(true);
        try {
            const result = await searchMayoristasAction(term);

            if (result.success && result.puntosVenta) {
                setSearchResults(result.puntosVenta);
                setShowResults(true);
            } else {
                setSearchResults([]);
                setShowResults(false);
                if (result.error) {
                    console.warn('Search warning:', result.error);
                }
            }
        } catch (error) {
            console.error('Error searching puntos de venta:', error);
            setSearchResults([]);
            setShowResults(false);
        } finally {
            setIsSearching(false);
        }
    };

    // Manejar cambio en el término de búsqueda
    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
        if (selectedMayorista) {
            setSelectedMayorista(null);
        }

        // Debounce la búsqueda
        const timeoutId = setTimeout(() => {
            searchMayoristas(value);
        }, 300);

        return () => clearTimeout(timeoutId);
    };

    // Seleccionar un punto de venta
    const handleMayoristaSelect = (puntoVenta: Mayorista) => {
        setSelectedMayorista(puntoVenta);
        setSearchTerm(`${puntoVenta.nombre} - ${puntoVenta.zona}`);
        setShowResults(false);
        onMayoristaSelect(puntoVenta);
    };

    // Limpiar selección
    const handleClearSelection = () => {
        setSelectedMayorista(null);
        setSearchTerm('');
        setSearchResults([]);
        setShowResults(false);
        onMayoristaSelect(null);
    };

    // Formatear información del punto de venta para mostrar
    const formatMayoristaInfo = (puntoVenta: Mayorista) => {
        return {
            name: puntoVenta.nombre || 'Sin nombre',
            zona: puntoVenta.zona || 'Sin zona',
            phone: puntoVenta.contacto?.telefono || 'Sin teléfono',
            direccion: puntoVenta.contacto?.direccion || 'Sin dirección'
        };
    };

    return (
        <div className="space-y-2" ref={searchRef}>
            <Label>Buscar Punto de Venta Existente</Label>
            <div className="relative">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        placeholder="Buscar por nombre, dirección o teléfono..."
                        className="pl-10 pr-10"
                        disabled={disabled}
                    />
                    {selectedMayorista && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleClearSelection}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>

                {/* Resultados de búsqueda */}
                {showResults && searchResults.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {searchResults.map((puntoVenta) => {
                            const info = formatMayoristaInfo(puntoVenta);
                            return (
                                <button
                                    key={puntoVenta._id}
                                    type="button"
                                    onClick={() => handleMayoristaSelect(puntoVenta)}
                                    className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                                >
                                    <div className="flex items-center space-x-3">
                                        <Store className="w-4 h-4 text-blue-600" />
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-gray-900 truncate">
                                                {info.name}
                                            </div>
                                            <div className="text-sm text-gray-500 truncate">
                                                🏷️ {info.zona}
                                            </div>
                                            <div className="text-xs text-gray-400 truncate">
                                                📞 {info.phone} • 📍 {info.direccion}
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Estado de búsqueda */}
                {isSearching && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg p-3">
                        <div className="text-center text-gray-500">
                            Buscando puntos de venta...
                        </div>
                    </div>
                )}

                {/* Sin resultados */}
                {showResults && !isSearching && searchResults.length === 0 && searchTerm.length >= 2 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg p-3">
                        <div className="text-center text-gray-500">
                            No se encontraron puntos de venta con ese criterio
                        </div>
                    </div>
                )}
            </div>

            {/* Información del punto de venta seleccionado */}
            {selectedMayorista && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="text-sm text-blue-800">
                        <div className="font-medium">
                            🏪 Punto de venta seleccionado: {selectedMayorista.nombre}
                        </div>
                        <div className="text-xs mt-1">
                            Los campos se autocompletarán con la información de este punto de venta
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
