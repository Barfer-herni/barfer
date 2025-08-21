'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@repo/design-system/components/ui/input';
import { Label } from '@repo/design-system/components/ui/label';
import { Button } from '@repo/design-system/components/ui/button';
import { Search, X, User } from 'lucide-react';
import { searchMayoristasAction } from '../actions';
import type { MayoristaOrder } from '@repo/data-services/src/types/barfer';

interface MayoristaSearchProps {
    onMayoristaSelect: (mayorista: MayoristaOrder) => void;
    disabled?: boolean;
}

export function MayoristaSearch({ onMayoristaSelect, disabled = false }: MayoristaSearchProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<MayoristaOrder[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [selectedMayorista, setSelectedMayorista] = useState<MayoristaOrder | null>(null);
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

    // Buscar mayoristas usando Server Action
    const searchMayoristas = async (term: string) => {
        if (!term.trim() || term.length < 2) {
            setSearchResults([]);
            setShowResults(false);
            return;
        }

        setIsSearching(true);
        try {
            const result = await searchMayoristasAction(term);

            if (result.success && result.orders) {
                setSearchResults(result.orders);
                setShowResults(true);
            } else {
                setSearchResults([]);
                setShowResults(false);
                if (result.error) {
                    console.warn('Search warning:', result.error);
                }
            }
        } catch (error) {
            console.error('Error searching mayoristas:', error);
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

    // Seleccionar un mayorista
    const handleMayoristaSelect = (mayorista: MayoristaOrder) => {
        setSelectedMayorista(mayorista);
        setSearchTerm(`${mayorista.user.name} ${mayorista.user.lastName} - ${mayorista.user.email}`);
        setShowResults(false);
        onMayoristaSelect(mayorista);
    };

    // Limpiar selección
    const handleClearSelection = () => {
        setSelectedMayorista(null);
        setSearchTerm('');
        setSearchResults([]);
        setShowResults(false);
        onMayoristaSelect(null as any);
    };

    // Formatear información del mayorista para mostrar
    const formatMayoristaInfo = (mayorista: MayoristaOrder) => {
        const name = `${mayorista.user.name} ${mayorista.user.lastName}`.trim();
        const email = mayorista.user.email;
        const phone = mayorista.address.phone;
        const city = mayorista.address.city;

        return {
            name: name || 'Sin nombre',
            email: email || 'Sin email',
            phone: phone || 'Sin teléfono',
            city: city || 'Sin ciudad'
        };
    };

    return (
        <div className="space-y-2" ref={searchRef}>
            <Label>Buscar Mayorista Existente</Label>
            <div className="relative">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        placeholder="Buscar por nombre, email o teléfono..."
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
                        {searchResults.map((mayorista) => {
                            const info = formatMayoristaInfo(mayorista);
                            return (
                                <button
                                    key={mayorista._id}
                                    type="button"
                                    onClick={() => handleMayoristaSelect(mayorista)}
                                    className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                                >
                                    <div className="flex items-center space-x-3">
                                        <User className="w-4 h-4 text-gray-400" />
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-gray-900 truncate">
                                                {info.name}
                                            </div>
                                            <div className="text-sm text-gray-500 truncate">
                                                {info.email}
                                            </div>
                                            <div className="text-xs text-gray-400 truncate">
                                                {info.phone} • {info.city}
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
                            Buscando mayoristas...
                        </div>
                    </div>
                )}

                {/* Sin resultados */}
                {showResults && !isSearching && searchResults.length === 0 && searchTerm.length >= 2 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg p-3">
                        <div className="text-center text-gray-500">
                            No se encontraron mayoristas con ese criterio
                        </div>
                    </div>
                )}
            </div>

            {/* Información del mayorista seleccionado */}
            {selectedMayorista && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="text-sm text-blue-800">
                        <div className="font-medium">
                            Mayorista seleccionado: {selectedMayorista.user.name} {selectedMayorista.user.lastName}
                        </div>
                        <div className="text-xs mt-1">
                            Los campos se autocompletarán con la información de este mayorista
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
