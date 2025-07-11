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
import { Search, MessageCircle, Phone, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import type { Dictionary } from '@repo/internationalization';
import type { ClientForTable } from '@repo/data-services/src/services/barfer/analytics/getClientsByCategory';
import { markClientsAsWhatsAppContacted, unmarkClientsAsWhatsAppContacted, getClientsWhatsAppContactStatus } from '../../actions';
import { useToast } from '@repo/design-system/hooks/use-toast';

interface Client extends ClientForTable { }

interface WhatsAppClientsTableProps {
    clients: Client[];
    selectedClients: string[];
    onSelectionChange: (selected: string[]) => void;
    dictionary: Dictionary;
}

type SortField = 'totalSpent' | 'lastOrder' | 'whatsappContacted' | null;
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
    dictionary
}: WhatsAppClientsTableProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [wppContactDates, setWppContactDates] = useState<Map<string, string>>(new Map());
    const [loading, setLoading] = useState(false);
    const [sortField, setSortField] = useState<SortField>(null);
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
    const { toast } = useToast();

    // Cargar el estado de contacto por WhatsApp al montar el componente
    useEffect(() => {
        const loadWhatsAppContactStatus = async () => {
            if (clients.length === 0) return;

            try {
                const clientEmails = clients.map(client => client.email);
                const result = await getClientsWhatsAppContactStatus(clientEmails);

                if (result.success && result.data) {
                    const contactDatesMap = new Map<string, string>();
                    result.data.forEach(item => {
                        if (item.whatsappContactedAt) {
                            contactDatesMap.set(item.clientEmail, item.whatsappContactedAt.toISOString());
                        }
                    });
                    setWppContactDates(contactDatesMap);
                }
            } catch (error) {
                console.error('Error loading WhatsApp contact status:', error);
            }
        };

        loadWhatsAppContactStatus();
    }, [clients]);

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
        } else if (sortField === 'whatsappContacted') {
            const aContactDate = wppContactDates.get(a.email);
            const bContactDate = wppContactDates.get(b.email);

            // Si ambos están contactados, ordenar por fecha
            if (aContactDate && bContactDate) {
                comparison = new Date(aContactDate).getTime() - new Date(bContactDate).getTime();
            }
            // Si solo uno está contactado, el contactado va primero
            else if (aContactDate && !bContactDate) {
                comparison = -1;
            }
            else if (!aContactDate && bContactDate) {
                comparison = 1;
            }
            // Si ninguno está contactado, mantener orden original
            else {
                comparison = 0;
            }
        }

        return sortDirection === 'asc' ? comparison : -comparison;
    });

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            onSelectionChange(sortedClients.map(client => client.id));
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

            // Seleccionar todos los clientes en el rango
            const rangeClientIds: string[] = [];
            for (let i = startIndex; i <= endIndex; i++) {
                if (sortedClients[i]) {
                    rangeClientIds.push(sortedClients[i].id);
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
    }, [selectedClients, onSelectionChange, lastSelectedIndex, sortedClients]);

    const isAllSelected = sortedClients.length > 0 &&
        sortedClients.every(client => selectedClients.includes(client.id));

    return (
        <div className="space-y-4">
            {/* Search */}
            <div className="flex items-center gap-2">
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
                    {sortedClients.length} clientes
                </Badge>
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
                                    variant="ghost"
                                    onClick={() => handleSort('totalSpent')}
                                    className="h-auto p-0 font-normal"
                                >
                                    Total Gastado
                                    {getSortIcon('totalSpent')}
                                </Button>
                            </TableHead>
                            <TableHead>
                                <Button
                                    variant="ghost"
                                    onClick={() => handleSort('whatsappContacted')}
                                    className="h-auto p-0 font-normal"
                                >
                                    WPP Contactado
                                    {getSortIcon('whatsappContacted')}
                                </Button>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedClients.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                    No se encontraron clientes
                                </TableCell>
                            </TableRow>
                        ) : (
                            sortedClients.map((client, index) => {
                                const contactDate = wppContactDates.get(client.email);
                                const isWppSent = !!contactDate;
                                const isSelected = selectedClients.includes(client.id);

                                return (
                                    <TableRow
                                        key={client.id}
                                        className={`
                                            ${isWppSent ? 'bg-yellow-100 hover:bg-yellow-200' : ''}
                                            ${isSelected ? 'bg-blue-50 hover:bg-blue-100' : ''}
                                            cursor-pointer select-none
                                        `}
                                        onClick={(event) => {
                                            console.log('Row clicked:', { clientId: client.id, index, clientName: client.name });
                                            handleRowClick(client.id, index, event);
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
                                        <TableCell className="font-medium">{client.name}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <MessageCircle className="h-4 w-4 text-green-600" />
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

            {/* Summary */}
            {selectedClients.length > 0 && (
                <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="text-sm text-green-700">
                        {selectedClients.length} de {sortedClients.length} clientes seleccionados para WhatsApp
                    </div>
                    <Button
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