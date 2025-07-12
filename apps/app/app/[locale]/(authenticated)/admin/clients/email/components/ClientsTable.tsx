'use client';

import { useState, useEffect, useCallback } from 'react';
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
import { Search, Mail, ArrowUpDown, ArrowUp, ArrowDown, MessageCircle, EyeOff, Eye } from 'lucide-react';
import type { Dictionary } from '@repo/internationalization';
import type { ClientForTable } from '@repo/data-services/src/services/barfer/analytics/getClientsByCategory';
import { markClientsAsWhatsAppContacted, unmarkClientsAsWhatsAppContacted, getClientsWhatsAppContactStatus, hideSelectedClients, showSelectedClients, getClientsVisibilityStatus } from '../../actions';
import { useToast } from '@repo/design-system/hooks/use-toast';
import { VisibilityFilter, type VisibilityFilterType } from '../../components/VisibilityFilter';
import { Pagination } from '../../components/Pagination';

interface Client extends ClientForTable { }

type SortField = 'totalSpent' | 'lastOrder' | 'name' | 'email' | 'whatsappContactedAt';
type SortDirection = 'asc' | 'desc';

interface ClientsTableProps {
    clients: Client[];
    selectedClients: string[];
    onSelectionChange: (selected: string[]) => void;
    dictionary: Dictionary;
    visibilityFilter: VisibilityFilterType;
    onVisibilityFilterChange: (filter: VisibilityFilterType) => void;
    onHiddenClientsChange?: (hiddenClients: Set<string>) => void;
}

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

export function ClientsTable({
    clients,
    selectedClients,
    onSelectionChange,
    dictionary,
    visibilityFilter,
    onVisibilityFilterChange,
    onHiddenClientsChange
}: ClientsTableProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortField, setSortField] = useState<SortField>('totalSpent');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [wppContactDates, setWppContactDates] = useState<Map<string, string>>(new Map());
    const [hiddenClients, setHiddenClients] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);
    const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const { toast } = useToast();

    const pageSize = 50;

    // Cargar el estado de contacto por WhatsApp y visibilidad al montar el componente
    useEffect(() => {
        const loadClientStatus = async () => {
            if (clients.length === 0) return;

            try {
                const clientEmails = clients.map(client => client.email);
                const [contactResult, visibilityResult] = await Promise.all([
                    getClientsWhatsAppContactStatus(clientEmails),
                    getClientsVisibilityStatus(clientEmails)
                ]);

                if (contactResult.success && contactResult.data) {
                    const contactDatesMap = new Map<string, string>();
                    contactResult.data.forEach(item => {
                        if (item.whatsappContactedAt) {
                            contactDatesMap.set(item.clientEmail, item.whatsappContactedAt.toISOString());
                        }
                    });
                    setWppContactDates(contactDatesMap);
                }

                if (visibilityResult.success && visibilityResult.data) {
                    const hiddenSet = new Set<string>();
                    visibilityResult.data.forEach(item => {
                        if (item.isHidden) {
                            hiddenSet.add(item.clientEmail);
                        }
                    });
                    setHiddenClients(hiddenSet);
                    // Notificar al componente padre sobre los clientes ocultos
                    onHiddenClientsChange?.(hiddenSet);
                }
            } catch (error) {
                console.error('Error loading client status:', error);
            }
        };

        loadClientStatus();
    }, [clients]);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc');
        }
    };

    const handleMarkAsWhatsAppContacted = async () => {
        if (selectedClients.length === 0) return;

        setLoading(true);
        try {
            // Obtener los emails de los clientes seleccionados
            const selectedClientEmails = clients
                .filter(client => selectedClients.includes(client.id))
                .map(client => client.email);

            const result = await markClientsAsWhatsAppContacted(selectedClientEmails);

            if (result.success) {
                // Actualizar el estado local
                const newContactDates = new Map(wppContactDates);
                const currentDate = new Date().toISOString();
                selectedClientEmails.forEach(email => {
                    newContactDates.set(email, currentDate);
                });
                setWppContactDates(newContactDates);

                // Limpiar selección después de marcar
                onSelectionChange([]);

                toast({
                    title: "Éxito",
                    description: result.message || `${selectedClientEmails.length} clientes marcados como contactados por WhatsApp`,
                });
            } else {
                toast({
                    title: "Error",
                    description: result.error || "Error al marcar clientes como contactados",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error('Error marking clients as WhatsApp contacted:', error);
            toast({
                title: "Error",
                description: "Error interno del servidor",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleUnmarkAsWhatsAppContacted = async () => {
        if (selectedClients.length === 0) return;

        setLoading(true);
        try {
            // Obtener los emails de los clientes seleccionados
            const selectedClientEmails = clients
                .filter(client => selectedClients.includes(client.id))
                .map(client => client.email);

            const result = await unmarkClientsAsWhatsAppContacted(selectedClientEmails);

            if (result.success) {
                // Actualizar el estado local
                const newContactDates = new Map(wppContactDates);
                selectedClientEmails.forEach(email => {
                    newContactDates.delete(email);
                });
                setWppContactDates(newContactDates);

                // Limpiar selección después de desmarcar
                onSelectionChange([]);

                toast({
                    title: "Éxito",
                    description: result.message || `${selectedClientEmails.length} clientes desmarcados como contactados por WhatsApp`,
                });
            } else {
                toast({
                    title: "Error",
                    description: result.error || "Error al desmarcar clientes como contactados",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error('Error unmarking clients as WhatsApp contacted:', error);
            toast({
                title: "Error",
                description: "Error interno del servidor",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleHideSelectedClients = async () => {
        if (selectedClients.length === 0) return;

        setLoading(true);
        try {
            const selectedClientEmails = clients
                .filter(client => selectedClients.includes(client.id))
                .map(client => client.email);

            const result = await hideSelectedClients(selectedClientEmails);

            if (result.success) {
                // Actualizar el estado local
                const newHiddenClients = new Set(hiddenClients);
                selectedClientEmails.forEach(email => {
                    newHiddenClients.add(email);
                });
                setHiddenClients(newHiddenClients);
                // Notificar al componente padre sobre los clientes ocultos
                onHiddenClientsChange?.(newHiddenClients);

                // Limpiar selección después de ocultar
                onSelectionChange([]);

                toast({
                    title: "Éxito",
                    description: result.message || `${selectedClientEmails.length} clientes ocultados`,
                });
            } else {
                toast({
                    title: "Error",
                    description: result.error || "Error al ocultar clientes",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error('Error hiding clients:', error);
            toast({
                title: "Error",
                description: "Error interno del servidor",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleShowSelectedClients = async () => {
        if (selectedClients.length === 0) return;

        setLoading(true);
        try {
            const selectedClientEmails = clients
                .filter(client => selectedClients.includes(client.id))
                .map(client => client.email);

            const result = await showSelectedClients(selectedClientEmails);

            if (result.success) {
                // Actualizar el estado local
                const newHiddenClients = new Set(hiddenClients);
                selectedClientEmails.forEach(email => {
                    newHiddenClients.delete(email);
                });
                setHiddenClients(newHiddenClients);
                // Notificar al componente padre sobre los clientes ocultos
                onHiddenClientsChange?.(newHiddenClients);

                // Limpiar selección después de mostrar
                onSelectionChange([]);

                toast({
                    title: "Éxito",
                    description: result.message || `${selectedClientEmails.length} clientes mostrados`,
                });
            } else {
                toast({
                    title: "Error",
                    description: result.error || "Error al mostrar clientes",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error('Error showing clients:', error);
            toast({
                title: "Error",
                description: "Error interno del servidor",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const sortClients = (clientsToSort: Client[]) => {
        return [...clientsToSort].sort((a, b) => {
            let aValue: any;
            let bValue: any;

            switch (sortField) {
                case 'totalSpent':
                    aValue = a.totalSpent;
                    bValue = b.totalSpent;
                    break;
                case 'lastOrder':
                    aValue = new Date(a.lastOrder).getTime();
                    bValue = new Date(b.lastOrder).getTime();
                    break;
                case 'name':
                    aValue = a.name.toLowerCase();
                    bValue = b.name.toLowerCase();
                    break;
                case 'email':
                    aValue = a.email.toLowerCase();
                    bValue = b.email.toLowerCase();
                    break;
                case 'whatsappContactedAt':
                    // Ordenar por fecha de contacto de WhatsApp (los no contactados van al final)
                    const aContacted = wppContactDates.has(a.email);
                    const bContacted = wppContactDates.has(b.email);
                    if (aContacted && !bContacted) return -1;
                    if (!aContacted && bContacted) return 1;
                    return 0;
                default:
                    return 0;
            }

            if (sortDirection === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });
    };

    const filteredClients = clients.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const sortedClients = sortClients(filteredClients);

    // Paginación
    const totalItems = sortedClients.length;
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedClients = sortedClients.slice(startIndex, endIndex);

    // Reset a página 1 cuando cambian los filtros
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, visibilityFilter]);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
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
        const clientIndex = sortedClients.findIndex(client => client.id === clientId);
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

            console.log('Shift+Click rango:', { startIndex, endIndex, rangeClientIds, lastSelectedIndex, currentIndex: index });

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

    const isIndeterminate = selectedClients.length > 0 && !isAllSelected;

    const getSortIcon = (field: SortField) => {
        if (sortField !== field) {
            return <ArrowUpDown className="h-4 w-4" />;
        }
        return sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
    };

    return (
        <div className="space-y-4">
            {/* Search and Actions */}
            <div className="flex items-center gap-2 flex-wrap">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por nombre o email..."
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
                    variant="outline"
                    size="sm"
                    onClick={handleMarkAsWhatsAppContacted}
                    disabled={selectedClients.length === 0 || loading}
                    className="flex items-center gap-2"
                >
                    <MessageCircle className="h-4 w-4" />
                    {loading ? 'Marcando...' : `Marcar seleccionados como WPP Enviado (${selectedClients.length})`}
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleUnmarkAsWhatsAppContacted}
                    disabled={selectedClients.length === 0 || loading}
                    className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
                >
                    <MessageCircle className="h-4 w-4" />
                    {loading ? 'Desmarcando...' : `Desmarcar seleccionados (${selectedClients.length})`}
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleHideSelectedClients}
                    disabled={selectedClients.length === 0 || loading}
                    className="flex items-center gap-2 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border-yellow-200"
                >
                    <EyeOff className="h-4 w-4" />
                    {loading ? 'Ocultando...' : `Ocultar seleccionados (${selectedClients.length})`}
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleShowSelectedClients}
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
                            <TableHead>
                                <Button
                                    variant="ghost"
                                    onClick={() => handleSort('name')}
                                    className="h-auto p-0 font-medium"
                                >
                                    Nombre
                                    {getSortIcon('name')}
                                </Button>
                            </TableHead>
                            <TableHead>
                                <Button
                                    variant="ghost"
                                    onClick={() => handleSort('email')}
                                    className="h-auto p-0 font-medium"
                                >
                                    Email
                                    {getSortIcon('email')}
                                </Button>
                            </TableHead>
                            <TableHead>Teléfono</TableHead>
                            <TableHead>
                                <Button
                                    variant="ghost"
                                    onClick={() => handleSort('lastOrder')}
                                    className="h-auto p-0 font-medium"
                                >
                                    Último Pedido
                                    {getSortIcon('lastOrder')}
                                </Button>
                            </TableHead>
                            <TableHead>
                                <Button
                                    variant="ghost"
                                    onClick={() => handleSort('totalSpent')}
                                    className="h-auto p-0 font-medium"
                                >
                                    Total Gastado
                                    {getSortIcon('totalSpent')}
                                </Button>
                            </TableHead>
                            <TableHead>
                                <Button
                                    variant="ghost"
                                    onClick={() => handleSort('whatsappContactedAt')}
                                    className="h-auto p-0 font-medium"
                                >
                                    WPP Contactado
                                    {getSortIcon('whatsappContactedAt')}
                                </Button>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedClients.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                    No se encontraron clientes
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedClients.map((client, index) => {
                                const contactDate = wppContactDates.get(client.email);
                                const isWppSent = !!contactDate;
                                const isSelected = selectedClients.includes(client.id);
                                const isHidden = hiddenClients.has(client.email);

                                return (
                                    <TableRow
                                        key={client.id}
                                        className={`
                                            ${isWppSent ? 'bg-yellow-100 hover:bg-yellow-200' : ''}
                                            ${isHidden ? 'bg-gray-100 hover:bg-gray-200' : ''}
                                            ${isSelected ? 'bg-blue-50 hover:bg-blue-100' : ''}
                                            cursor-pointer
                                        `}
                                        onClick={(event) => {
                                            // Solo seleccionar fila si no se está seleccionando texto
                                            if (window.getSelection()?.toString().length === 0) {
                                                console.log('Row clicked:', { clientId: client.id, index, clientName: client.name });
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
                                                <Mail className="h-4 w-4 text-muted-foreground" />
                                                {client.email}
                                            </div>
                                        </TableCell>
                                        <TableCell>{client.phone}</TableCell>
                                        <TableCell>{formatDate(client.lastOrder)}</TableCell>
                                        <TableCell className="font-medium">
                                            {formatCurrency(client.totalSpent)}
                                        </TableCell>
                                        <TableCell>
                                            {contactDate ? (
                                                <div className="text-xs">
                                                    {formatDate(contactDate)}
                                                </div>
                                            ) : (
                                                <div className="text-xs text-gray-500">
                                                    No contactado
                                                </div>
                                            )}
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
                totalItems={totalItems}
                pageSize={pageSize}
                onPageChange={handlePageChange}
                className="mt-4"
            />

            {/* Summary */}
            {selectedClients.length > 0 && (
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="text-sm text-muted-foreground">
                        {selectedClients.length} de {totalItems} clientes seleccionados
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onSelectionChange([])}
                    >
                        Limpiar selección
                    </Button>
                </div>
            )}
        </div>
    );
} 