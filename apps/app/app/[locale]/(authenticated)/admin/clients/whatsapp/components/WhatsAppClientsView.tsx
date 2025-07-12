'use client';

import { useState } from 'react';
import { Button } from '@repo/design-system/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/design-system/components/ui/card';
import { Textarea } from '@repo/design-system/components/ui/textarea';
import { Badge } from '@repo/design-system/components/ui/badge';
import { ArrowLeft, MessageCircle, Send, Users } from 'lucide-react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import type { Dictionary } from '@repo/internationalization';
import type { ClientForTable } from '@repo/data-services/src/services/barfer/analytics/getClientsByCategory';
import type { WhatsAppTemplateData } from '@repo/data-services';
import { WhatsAppClientsTable } from './WhatsAppClientsTable';
import { WhatsAppTemplateSelectorClient } from './WhatsAppTemplateSelectorClient';
import { type VisibilityFilterType } from '../../components/VisibilityFilter';

interface WhatsAppClientsViewProps {
    category?: string;
    type?: string;
    visibility?: 'all' | 'hidden' | 'visible';
    dictionary: Dictionary;
    clients: ClientForTable[];
    whatsappTemplates: WhatsAppTemplateData[];
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

export function WhatsAppClientsView({ category, type, visibility, dictionary, clients, whatsappTemplates }: WhatsAppClientsViewProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [selectedClients, setSelectedClients] = useState<string[]>([]);
    const [whatsappMessage, setWhatsappMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilterType>(visibility || 'all');
    const [hiddenClients, setHiddenClients] = useState<Set<string>>(new Set());

    // Traducir categoría y tipo
    const categoryTitle = category
        ? (type === 'behavior'
            ? translateBehaviorCategory(category)
            : translateSpendingCategory(category))
        : 'Todos';

    const typeTitle = type ? translateType(type) : '';

    // Filter clients based on visibility filter
    const filteredClients = clients.filter(client => {
        const isHidden = hiddenClients.has(client.email);

        switch (visibilityFilter) {
            case 'all':
                return true;
            case 'hidden':
                return isHidden;
            case 'visible':
                return !isHidden;
            default:
                return true;
        }
    });

    const handleVisibilityFilterChange = (filter: VisibilityFilterType) => {
        setVisibilityFilter(filter);

        // Update URL with new filter
        const newSearchParams = new URLSearchParams(searchParams);
        if (filter === 'all') {
            newSearchParams.delete('visibility');
        } else {
            newSearchParams.set('visibility', filter);
        }

        router.push(`${pathname}?${newSearchParams.toString()}`);
    };

    const handleSendMessages = async () => {
        if (selectedClients.length === 0) {
            alert('Selecciona al menos un cliente');
            return;
        }

        if (!whatsappMessage.trim()) {
            alert('Escribe un mensaje para enviar');
            return;
        }

        setIsLoading(true);

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
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6 p-4 sm:p-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button
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
                            onClick={handleSendMessages}
                            disabled={isLoading || selectedClients.length === 0 || !whatsappMessage.trim()}
                            className="min-w-[140px] bg-green-600 hover:bg-green-700"
                        >
                            {isLoading ? 'Enviando...' : 'Enviar WhatsApp'}
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
                        onHiddenClientsChange={setHiddenClients}
                    />
                </CardContent>
            </Card>
        </div>
    );
} 