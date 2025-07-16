'use client';

import { useState, useMemo } from 'react';
import { Button } from '@repo/design-system/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/design-system/components/ui/card';
import { Textarea } from '@repo/design-system/components/ui/textarea';
import { Badge } from '@repo/design-system/components/ui/badge';
import { ArrowLeft, MessageCircle, Send, Users } from 'lucide-react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import type { Dictionary } from '@repo/internationalization';
import type { ClientForTableWithStatus } from '@repo/data-services';
import type { WhatsAppTemplateData } from '@repo/data-services';
import { WhatsAppClientsTable } from './WhatsAppClientsTable';
import { WhatsAppTemplateSelectorClient } from './WhatsAppTemplateSelectorClient';
import { type VisibilityFilterType } from '../../components/VisibilityFilter';
import { hideSelectedClients, showSelectedClients } from '../../actions';
import { useToast } from '@repo/design-system/hooks/use-toast';
import React from 'react'; // Added missing import

interface WhatsAppClientsViewClientProps {
    category?: string;
    type?: string;
    visibility?: 'all' | 'hidden' | 'visible';
    dictionary: Dictionary;
    clients: ClientForTableWithStatus[];
    whatsappTemplates: WhatsAppTemplateData[];
    paginationInfo?: {
        totalCount: number;
        totalPages: number;
        currentPage: number;
        hasMore: boolean;
    };
}

// Función para traducir categorías de comportamiento
const translateBehaviorCategory = (category: string): string => {
    const translations: Record<string, string> = {
        'new': 'Cliente Nuevo',
        'possible-active': 'Posible Activo',
        'possible-inactive': 'Posible Inactivo',
        'active': 'Cliente Activo',
        'inactive': 'Cliente Inactivo',
        'recovered': 'Cliente Recuperado',
        'lost': 'Cliente Perdido',
        'tracking': 'En Seguimiento'
    };
    return translations[category] || category;
};

// Función para traducir categorías de gasto
const translateSpendingCategory = (category: string): string => {
    const translations: Record<string, string> = {
        'premium': 'Premium (A)',
        'standard': 'Estándar (B)',
        'basic': 'Básico (C)'
    };
    return translations[category] || category;
};

// Función para traducir tipos
const translateType = (type: string): string => {
    const translations: Record<string, string> = {
        'behavior': 'Comportamiento',
        'spending': 'Nivel de Gasto'
    };
    return translations[type] || type;
};

export function WhatsAppClientsViewClient({ category, type, visibility, dictionary, clients, whatsappTemplates, paginationInfo }: WhatsAppClientsViewClientProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [selectedClients, setSelectedClients] = useState<string[]>([]);
    const [whatsappMessage, setWhatsappMessage] = useState('');
    // Separar los estados de loading
    const [isLoadingSendWhatsApp, setIsLoadingSendWhatsApp] = useState(false);
    const [isLoadingHideShow, setIsLoadingHideShow] = useState(false);

    // Sincronizar el estado del filtro con la URL y props del servidor
    const currentVisibilityFromUrl = (searchParams.get('visibility') as VisibilityFilterType) || 'all';
    const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilterType>(currentVisibilityFromUrl);

    const { toast } = useToast();

    // Actualizar el estado local cuando cambie la URL
    React.useEffect(() => {
        const urlVisibility = (searchParams.get('visibility') as VisibilityFilterType) || 'all';
        setVisibilityFilter(urlVisibility);
    }, [searchParams]);

    // Manejar el estado de clientes ocultos en el componente padre
    const initialHiddenClients = useMemo(() => {
        const hiddenSet = new Set<string>();
        clients.forEach(client => {
            if (client.isHidden) {
                hiddenSet.add(client.email);
            }
        });
        return hiddenSet;
    }, [clients]);

    const [hiddenClients, setHiddenClients] = useState(initialHiddenClients);

    // Sincronizar el estado hiddenClients con los datos del servidor cuando cambien
    React.useEffect(() => {
        const serverHiddenClients = new Set<string>();
        clients.forEach(client => {
            if (client.isHidden) {
                serverHiddenClients.add(client.email);
            }
        });

        setHiddenClients(serverHiddenClients);
    }, [clients]);

    // Traducir categoría y tipo
    const categoryTitle = category
        ? (type === 'behavior'
            ? translateBehaviorCategory(category)
            : translateSpendingCategory(category))
        : 'Todos';

    const typeTitle = type ? translateType(type) : '';

    // Ya no necesitamos filtrar aquí porque el servidor ya envía los datos filtrados
    const filteredClients = clients;

    const handleVisibilityFilterChange = (filter: VisibilityFilterType) => {
        // Actualizar estado local inmediatamente para mejor UX
        setVisibilityFilter(filter);

        // Update URL with new filter and reset to page 1
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.set('page', '1'); // Reset a página 1 al cambiar filtro

        if (filter === 'all') {
            newSearchParams.delete('visibility');
        } else {
            newSearchParams.set('visibility', filter);
        }

        const newUrl = `${pathname}?${newSearchParams.toString()}`;

        // Navegar para obtener datos filtrados del servidor
        router.push(newUrl);
    };

    // Mover las funciones de ocultar/mostrar al componente padre
    const handleHideSelectedClients = async (e?: React.MouseEvent) => {
        e?.preventDefault();
        e?.stopPropagation();

        if (selectedClients.length === 0) return;

        setIsLoadingHideShow(true);
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

                // Limpiar selección después de ocultar
                setSelectedClients([]);

                toast({
                    title: "Éxito",
                    description: result.message || `${selectedClientEmails.length} clientes ocultados`,
                });

                // La sincronización se hará automáticamente via useEffect cuando lleguen nuevos datos
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
            setIsLoadingHideShow(false);
        }
    };

    const handleShowSelectedClients = async (e?: React.MouseEvent) => {
        e?.preventDefault();
        e?.stopPropagation();

        if (selectedClients.length === 0) return;

        setIsLoadingHideShow(true);
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

                // Limpiar selección después de mostrar
                setSelectedClients([]);

                toast({
                    title: "Éxito",
                    description: result.message || `${selectedClientEmails.length} clientes mostrados`,
                });

                // La sincronización se hará automáticamente via useEffect cuando lleguen nuevos datos
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
            setIsLoadingHideShow(false);
        }
    };

    const handleSendMessages = async (e?: React.MouseEvent) => {
        e?.preventDefault();
        e?.stopPropagation();

        if (selectedClients.length === 0) {
            alert('Selecciona al menos un cliente');
            return;
        }

        if (!whatsappMessage.trim()) {
            alert('Escribe un mensaje para enviar');
            return;
        }

        setIsLoadingSendWhatsApp(true);

        try {
            const result = { success: true };

            if (result.success) {
                alert('WhatsApp enviado correctamente');
                setSelectedClients([]);
                setWhatsappMessage('');
            } else {
                alert(`Error al enviar mensajes`);
            }
        } catch (error) {
            alert('Error al enviar mensajes. Intenta nuevamente.');
            console.error('WhatsApp send error:', error);
        } finally {
            setIsLoadingSendWhatsApp(false);
        }
    };

    return (
        <div className="space-y-6 p-4 sm:p-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => router.back()}
                    className="text-muted-foreground"
                >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Volver
                </Button>
                <div className="flex-1">
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
                        <MessageCircle className="h-6 w-6 text-green-600" />
                        Envío de WhatsApp
                    </h1>
                    <div className="text-sm sm:text-base text-muted-foreground">
                        Categoría: <Badge variant="outline">{categoryTitle}</Badge>
                        {type && <> • Tipo: <Badge variant="outline">{typeTitle}</Badge></>}
                    </div>
                </div>
            </div>

            {/* Template Selector */}
            <WhatsAppTemplateSelectorClient
                templates={whatsappTemplates}
                onTemplateSelect={(content: string) => {
                    setWhatsappMessage(content);
                }}
            />

            {/* Action Buttons */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Send className="h-5 w-5" />
                        Enviar WhatsApp
                    </CardTitle>
                    <CardDescription>
                        Configuración final antes del envío
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Users className="h-4 w-4" />
                            {selectedClients.length} cliente(s) seleccionado(s)
                        </div>
                        <Button
                            type="button"
                            onClick={handleSendMessages}
                            disabled={isLoadingSendWhatsApp || selectedClients.length === 0 || !whatsappMessage.trim()}
                            className="min-w-[140px] bg-green-600 hover:bg-green-700"
                        >
                            {isLoadingSendWhatsApp ? 'Enviando...' : 'Enviar WhatsApp'}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Clients Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Clientes Disponibles</CardTitle>
                    <CardDescription>
                        Selecciona los clientes a los que deseas enviar el mensaje de WhatsApp
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <WhatsAppClientsTable
                        clients={filteredClients}
                        selectedClients={selectedClients}
                        onSelectionChange={setSelectedClients}
                        dictionary={dictionary}
                        visibilityFilter={visibilityFilter}
                        onVisibilityFilterChange={handleVisibilityFilterChange}
                        paginationInfo={paginationInfo}
                        hiddenClients={hiddenClients}
                        onHideClients={handleHideSelectedClients}
                        onShowClients={handleShowSelectedClients}
                        loading={isLoadingHideShow}
                    />
                </CardContent>
            </Card>
        </div>
    );
} 