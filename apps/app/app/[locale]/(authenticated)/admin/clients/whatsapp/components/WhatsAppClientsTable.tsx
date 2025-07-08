'use client';

import { useState, useEffect } from 'react';
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
import { markClientsAsWhatsAppContacted, getClientsWhatsAppContactStatus } from '../../actions';
import { useToast } from '@repo/design-system/hooks/use-toast';

interface Client extends ClientForTable { }

interface WhatsAppClientsTableProps {
    clients: Client[];
    selectedClients: string[];
    onSelectionChange: (selected: string[]) => void;
    dictionary: Dictionary;
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

export function WhatsAppClientsTable({
    clients,
    selectedClients,
    onSelectionChange,
    dictionary
}: WhatsAppClientsTableProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [wppContactDates, setWppContactDates] = useState<Map<string, string>>(new Map());
    const [loading, setLoading] = useState(false);
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

    const filteredClients = clients.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.phone.includes(searchTerm)
    );

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            onSelectionChange(filteredClients.map(client => client.id));
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
    };

    const isAllSelected = filteredClients.length > 0 &&
        filteredClients.every(client => selectedClients.includes(client.id));

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
                    {filteredClients.length} clientes
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
                            <TableHead>Último Pedido</TableHead>
                            <TableHead>Total Gastado</TableHead>
                            <TableHead>WPP Contactado</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredClients.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                    No se encontraron clientes
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredClients.map((client) => {
                                const contactDate = wppContactDates.get(client.email);
                                const isWppSent = !!contactDate;
                                return (
                                    <TableRow
                                        key={client.id}
                                        className={isWppSent ? 'bg-yellow-100 hover:bg-yellow-200' : ''}
                                    >
                                        <TableCell>
                                            <Checkbox
                                                checked={selectedClients.includes(client.id)}
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

            {/* Summary */}
            {selectedClients.length > 0 && (
                <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="text-sm text-green-700">
                        {selectedClients.length} de {filteredClients.length} clientes seleccionados para WhatsApp
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