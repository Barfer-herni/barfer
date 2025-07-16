'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Checkbox } from '@repo/design-system/components/ui/checkbox';
import { Button } from '@repo/design-system/components/ui/button';
import { Input } from '@repo/design-system/components/ui/input';
import { Badge } from '@repo/design-system/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@repo/design-system/components/ui/table';
import { Search, Phone, ArrowUpDown, ArrowUp, ArrowDown, EyeOff, Eye } from 'lucide-react';
import type { Dictionary } from '@repo/internationalization';
import type { ClientForTableWithStatus } from '@repo/data-services';
import { VisibilityFilter, type VisibilityFilterType } from '../../components/VisibilityFilter';
import { Pagination } from '../../components/Pagination';

interface Client extends ClientForTableWithStatus { }

interface WhatsAppClientsTableProps {
    clients: Client[];
    selectedClients: string[];
    onSelectionChange: (selected: string[]) => void;
    dictionary: Dictionary;
    visibilityFilter: VisibilityFilterType;
    onVisibilityFilterChange: (filter: VisibilityFilterType) => void;
    hiddenClients: Set<string>;
    onHideClients: () => void;
    onShowClients: () => void;
    loading: boolean;
    paginationInfo?: {
        totalCount: number;
        totalPages: number;
        currentPage: number;
        hasMore: boolean;
    };
}

type SortField = 'totalSpent' | 'lastOrder' | null;
type SortDirection = 'asc' | 'desc';

const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 0
    }).format(amount);
};

const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
};

export function WhatsAppClientsTable({
    clients,
    selectedClients,
    onSelectionChange,
    dictionary,
    visibilityFilter,
    onVisibilityFilterChange,
    hiddenClients,
    onHideClients,
    onShowClients,
    loading,
    paginationInfo
}: WhatsAppClientsTableProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const [searchTerm, setSearchTerm] = useState('');
    const [sortField, setSortField] = useState<SortField>(null);
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);

    const pageSize = 50;
    const currentPage = paginationInfo?.currentPage || 1;
    const serverTotalItems = paginationInfo?.totalCount || clients.length;

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc');
        }
    };

    const getSortIcon = (field: SortField) => {
        if (sortField !== field) {
            return <ArrowUpDown className="h-4 w-4" />;
        }
        return sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
    };

    const filteredClients = clients.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.phone.includes(searchTerm)
    );

    // Aplicar ordenamiento
    const sortedClients = [...filteredClients].sort((a, b) => {
        if (!sortField) return 0;

        let comparison = 0;
        if (sortField === 'totalSpent') {
            comparison = a.totalSpent - b.totalSpent;
        } else if (sortField === 'lastOrder') {
            comparison = new Date(a.lastOrder).getTime() - new Date(b.lastOrder).getTime();
        }

        return sortDirection === 'asc' ? comparison : -comparison;
    });

    // Como el servidor ya envía los clientes paginados, usamos todos los clientes que llegaron
    const paginatedClients = sortedClients;
    const totalItems = paginatedClients.length;

    const handlePageChange = (page: number) => {
        // Crear nuevos searchParams con la página actualizada
        const newSearchParams = new URLSearchParams(searchParams.toString());
        newSearchParams.set('page', page.toString());

        // Navegar a la nueva URL usando la ruta completa
        router.push(`${pathname}?${newSearchParams.toString()}`);

        // Limpiar selecciones al cambiar de página
        onSelectionChange([]);
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            onSelectionChange(paginatedClients.map(client => client.id));
        } else {
            onSelectionChange([]);
        }
    };

    const handleSelectClient = (clientId: string, checked: boolean) => {
        if (checked) {
            onSelectionChange([...selectedClients, clientId]);
        } else {
            onSelectionChange(selectedClients.filter(id => id !== clientId));
        }

        // Actualizar el lastSelectedIndex para el checkbox también
        const clientIndex = paginatedClients.findIndex(client => client.id === clientId);
        if (clientIndex !== -1) {
            setLastSelectedIndex(clientIndex);
        }
    };

    // Nueva función para manejar clicks en filas con selección avanzada
    const handleRowClick = useCallback((clientId: string, index: number, event: React.MouseEvent) => {
        // Prevenir la propagación si se hace click en el checkbox
        if ((event.target as HTMLElement).closest('[role="checkbox"]')) {
            return;
        }

        event.preventDefault();

        if (event.shiftKey && lastSelectedIndex !== null) {
            // Selección de rango con Shift+Click (comportamiento Excel)
            const startIndex = Math.min(lastSelectedIndex, index);
            const endIndex = Math.max(lastSelectedIndex, index);

            // Seleccionar todos los clientes en el rango (en la página actual)
            const rangeClientIds: string[] = [];
            for (let i = startIndex; i <= endIndex; i++) {
                if (paginatedClients[i]) {
                    rangeClientIds.push(paginatedClients[i].id);
                }
            }

            // Reemplazar la selección actual con solo el rango seleccionado
            onSelectionChange(rangeClientIds);
        } else if (event.ctrlKey || event.metaKey) {
            // Selección múltiple con Ctrl+Click
            if (selectedClients.includes(clientId)) {
                onSelectionChange(selectedClients.filter(id => id !== clientId));
            } else {
                onSelectionChange([...selectedClients, clientId]);
            }
            setLastSelectedIndex(index);
        } else {
            // Click normal - toggle individual (más seguro)
            if (selectedClients.includes(clientId)) {
                onSelectionChange(selectedClients.filter(id => id !== clientId));
            } else {
                onSelectionChange([...selectedClients, clientId]);
            }
            setLastSelectedIndex(index);
        }
    }, [selectedClients, onSelectionChange, lastSelectedIndex, paginatedClients]);

    const isAllSelected = paginatedClients.length > 0 &&
        paginatedClients.every(client => selectedClients.includes(client.id));

    return (
        <div className="space-y-4">
            {/* Search and Actions */}
            <div className="flex items-center gap-2 flex-wrap">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por nombre o teléfono..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                    />
                </div>
                <Badge variant="secondary">
                    {totalItems} clientes totales
                </Badge>
                <VisibilityFilter
                    currentFilter={visibilityFilter}
                    onFilterChange={onVisibilityFilterChange}
                />
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onHideClients();
                    }}
                    disabled={selectedClients.length === 0 || loading}
                    className="flex items-center gap-2 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border-yellow-200"
                >
                    <EyeOff className="h-4 w-4" />
                    {loading ? 'Ocultando...' : `Ocultar seleccionados (${selectedClients.length})`}
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onShowClients();
                    }}
                    disabled={selectedClients.length === 0 || loading}
                    className="flex items-center gap-2 bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                >
                    <Eye className="h-4 w-4" />
                    {loading ? 'Mostrando...' : `Mostrar seleccionados (${selectedClients.length})`}
                </Button>
            </div>

            {/* Help text */}
            <div className="text-xs text-muted-foreground bg-blue-50 p-3 rounded-lg">
                💡 <strong>Consejos de selección:</strong> Click en cualquier parte de la fila para agregar/quitar de la selección.
                Usa <kbd className="px-1 py-0.5 bg-white rounded text-xs">Shift+Click</kbd> para seleccionar rangos completos,
                <kbd className="px-1 py-0.5 bg-white rounded text-xs">Ctrl+Click</kbd> para agregar/quitar elementos individuales.
                <br />
                <strong>Debug:</strong> lastSelectedIndex = {lastSelectedIndex}, selected = {selectedClients.length}
            </div>

            {/* Table */}
            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-12">
                                <Checkbox
                                    checked={isAllSelected}
                                    onCheckedChange={handleSelectAll}
                                    aria-label="Seleccionar todos"
                                />
                            </TableHead>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Teléfono</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => handleSort('lastOrder')}
                                    className="h-auto p-0 font-normal"
                                >
                                    Último Pedido
                                    {getSortIcon('lastOrder')}
                                </Button>
                            </TableHead>
                            <TableHead>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => handleSort('totalSpent')}
                                    className="h-auto p-0 font-normal"
                                >
                                    Total Gastado
                                    {getSortIcon('totalSpent')}
                                </Button>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedClients.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    No se encontraron clientes
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedClients.map((client, index) => {
                                const isSelected = selectedClients.includes(client.id);
                                const isHidden = hiddenClients.has(client.email);

                                return (
                                    <TableRow
                                        key={client.id}
                                        className={`
                                            ${isHidden ? 'bg-gray-100 hover:bg-gray-200' : ''}
                                            ${isSelected ? 'bg-blue-50 hover:bg-blue-100' : ''}
                                            cursor-pointer
                                        `}
                                        onClick={(event) => {
                                            // Solo seleccionar fila si no se está seleccionando texto
                                            if (window.getSelection()?.toString().length === 0) {
                                                handleRowClick(client.id, index, event);
                                            }
                                        }}
                                    >
                                        <TableCell onClick={(e) => e.stopPropagation()}>
                                            <Checkbox
                                                checked={isSelected}
                                                onCheckedChange={(checked) =>
                                                    handleSelectClient(client.id, checked as boolean)
                                                }
                                                aria-label={`Seleccionar ${client.name}`}
                                            />
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                {client.name}
                                                {isHidden && <EyeOff className="h-4 w-4 text-gray-500" />}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Phone className="h-4 w-4 text-green-600" />
                                                <span className="font-mono text-sm">{client.phone}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Phone className="h-4 w-4 text-muted-foreground" />
                                                {client.email}
                                            </div>
                                        </TableCell>
                                        <TableCell>{formatDate(client.lastOrder)}</TableCell>
                                        <TableCell className="font-medium text-left">
                                            {formatCurrency(client.totalSpent)}
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            <Pagination
                currentPage={currentPage}
                totalItems={serverTotalItems}
                pageSize={pageSize}
                onPageChange={handlePageChange}
                className="mt-4"
            />

            {/* Summary */}
            {selectedClients.length > 0 && (
                <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="text-sm text-green-700">
                        {selectedClients.length} de {totalItems} clientes seleccionados
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onSelectionChange([])}
                        className="border-green-200 text-green-700 hover:bg-green-100"
                    >
                        Limpiar selección
                    </Button>
                </div>
            )}
        </div>
    );
} 