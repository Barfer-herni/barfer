'use client';

import { useState } from 'react';
import { Button } from '@repo/design-system/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/design-system/components/ui/card';
import { Badge } from '@repo/design-system/components/ui/badge';
import { ArrowLeft, Mail, Send, Users, Clock, CalendarIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { Dictionary } from '@repo/internationalization';
import type { ClientForTable } from '@repo/data-services/src/services/barfer/analytics/getClientsByCategory';
import type { EmailTemplateData } from '@repo/data-services';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@repo/design-system/components/ui/dialog';
import { Input } from '@repo/design-system/components/ui/input';
import { Label } from '@repo/design-system/components/ui/label';
import { ClientsTable } from './ClientsTable';
import { TemplateSelectorClient } from './TemplateSelectorClient';
import { sendBulkEmailAction, scheduleEmailCampaignAction } from '../actions';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@repo/design-system/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@repo/design-system/components/ui/popover';
import { Calendar } from '@repo/design-system/components/ui/calendar';
import { ToggleGroup, ToggleGroupItem } from '@repo/design-system/components/ui/toggle-group';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface EmailClientsViewClientProps {
    category?: string;
    type?: string;
    dictionary: Dictionary;
    clients: ClientForTable[];
    emailTemplates: EmailTemplateData[];
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

type ScheduleFrequency = 'once' | 'daily' | 'weekly' | 'monthly';

export function EmailClientsViewClient({
    category,
    type,
    dictionary,
    clients,
    emailTemplates
}: EmailClientsViewClientProps) {
    const router = useRouter();
    const [selectedClients, setSelectedClients] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // State for scheduling dialog
    const [showScheduleDialog, setShowScheduleDialog] = useState(false);
    const [campaignName, setCampaignName] = useState('');
    const [scheduleFrequency, setScheduleFrequency] = useState<ScheduleFrequency>('daily');
    const [scheduleTime, setScheduleTime] = useState('09:00');
    const [scheduleWeeklyDays, setScheduleWeeklyDays] = useState<string[]>(['1']);
    const [scheduleMonthlyDay, setScheduleMonthlyDay] = useState('1');
    const [scheduleOnceDate, setScheduleOnceDate] = useState<Date | undefined>(new Date());

    // State management for templates, now local to this component
    const [localTemplates, setLocalTemplates] = useState(emailTemplates);
    const [selectedTemplateId, setSelectedTemplateId] = useState('custom');
    const [customSubject, setCustomSubject] = useState('');
    const [customContent, setCustomContent] = useState('');


    const categoryTitle = category ? (type === 'behavior' ? translateBehaviorCategory(category) : translateSpendingCategory(category)) : 'Todos';
    const typeTitle = type ? translateType(type) : '';

    const handleTemplateChange = (templateId: string) => {
        setSelectedTemplateId(templateId);
        if (templateId === 'custom') {
            setCustomSubject('');
            setCustomContent('');
        } else {
            const template = localTemplates.find(t => t.id === templateId);
            if (template) {
                setCustomSubject(template.subject);
                setCustomContent(template.content);
            }
        }
    };

    const buildCronString = (): string => {
        const [hour, minute] = scheduleTime.split(':');

        switch (scheduleFrequency) {
            case 'daily':
                return `${minute} ${hour} * * *`;
            case 'weekly':
                return `${minute} ${hour} * * ${scheduleWeeklyDays.join(',')}`;
            case 'monthly':
                return `${minute} ${hour} ${scheduleMonthlyDay} * *`;
            case 'once':
                if (!scheduleOnceDate) return '';
                return `${scheduleOnceDate.getMinutes()} ${scheduleOnceDate.getHours()} ${scheduleOnceDate.getDate()} ${scheduleOnceDate.getMonth() + 1} *`;
            default:
                return '';
        }
    };

    const handleSendEmails = async () => {
        if (selectedClients.length === 0) {
            alert('Selecciona al menos un cliente');
            return;
        }

        if (!customSubject.trim() || !customContent.trim()) {
            alert('Completa el asunto y el mensaje del email');
            return;
        }

        setIsLoading(true);
        try {
            const result = await sendBulkEmailAction(
                customSubject.trim(),
                customContent.trim(),
                selectedClients
            );
            if (result.success) {
                alert(result.message || 'Emails enviados exitosamente');
                setSelectedClients([]);
            } else {
                alert(`Error al enviar emails: ${result.error}`);
            }
        } catch (error) {
            alert('Error al enviar emails. Intenta nuevamente.');
            console.error('Email send error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleScheduleCampaign = async () => {
        if (!campaignName.trim()) {
            alert('Completa el nombre de la campaña.');
            return;
        }
        if (selectedTemplateId === 'custom') {
            alert('Por favor, selecciona un template guardado para programar una campaña.');
            return;
        }
        if (!category || !type || (type !== 'behavior' && type !== 'spending')) {
            alert('La categoría o el tipo de cliente no son válidos.');
            return;
        }
        const scheduleCron = buildCronString();
        if (!scheduleCron) {
            alert('La configuración del horario es inválida.');
            return;
        }

        setIsLoading(true);
        try {
            const result = await scheduleEmailCampaignAction(
                campaignName,
                scheduleCron,
                { category, type },
                selectedTemplateId
            );
            if (result.success) {
                alert(result.message);
                setShowScheduleDialog(false);
                setCampaignName('');
            } else {
                alert(`Error al programar la campaña: ${result.error}`);
            }
        } catch (error) {
            alert('Ocurrió un error inesperado. Intenta nuevamente.');
            console.error('Schedule campaign error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const isTemplateSelected = selectedTemplateId && selectedTemplateId !== 'custom';

    return (
        <div className="space-y-6 p-4 sm:p-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => router.back()} className="text-muted-foreground">
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Volver
                </Button>
                <div className="flex-1">
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Mail className="h-6 w-6 text-blue-600" />
                        Envío de Emails
                    </h1>
                    <div className="text-sm sm:text-base text-muted-foreground">
                        Categoría: <Badge variant="outline">{categoryTitle}</Badge>
                        {type && <> • Tipo: <Badge variant="outline">{typeTitle}</Badge></>}
                    </div>
                </div>
            </div>

            {/* Template Selector */}
            <TemplateSelectorClient
                templates={localTemplates}
                selectedTemplateId={selectedTemplateId}
                customSubject={customSubject}
                customContent={customContent}
                onTemplateChange={handleTemplateChange}
                onSubjectChange={setCustomSubject}
                onContentChange={setCustomContent}
                onTemplateCreated={() => router.refresh()}
            />

            {/* Action Buttons */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Send className="h-5 w-5" />
                        Acciones de Envío
                    </CardTitle>
                    <CardDescription>
                        Envía esta comunicación ahora o prográmala para el futuro.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Users className="h-4 w-4" />
                                {selectedClients.length} cliente(s) seleccionado(s) para envío inmediato
                            </div>
                            <div className="flex items-center gap-2">
                                <Button onClick={() => setShowScheduleDialog(true)} variant="outline" disabled={isLoading || !isTemplateSelected}>
                                    <Clock className="mr-2 h-4 w-4" />
                                    Programar Campaña
                                </Button>
                                <Button onClick={handleSendEmails} disabled={isLoading || selectedClients.length === 0 || !customSubject.trim() || !customContent.trim()} className="min-w-[120px]">
                                    <Send className="mr-2 h-4 w-4" />
                                    {isLoading ? 'Enviando...' : 'Enviar Ahora'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Clients Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Clientes Disponibles</CardTitle>
                    <CardDescription>
                        Selecciona los clientes a los que deseas enviar el email
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ClientsTable
                        clients={clients}
                        selectedClients={selectedClients}
                        onSelectionChange={setSelectedClients}
                        dictionary={dictionary}
                    />
                </CardContent>
            </Card>

            {/* Schedule Campaign Dialog */}
            <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Programar Nueva Campaña</DialogTitle>
                        <div className="text-sm text-muted-foreground">
                            La campaña se enviará a los clientes de la categoría{' '}
                            <Badge variant="secondary">{categoryTitle}</Badge> según el horario que definas.
                        </div>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <Label htmlFor="campaign-name">Nombre de la Campaña</Label>
                            <Input
                                id="campaign-name"
                                value={campaignName}
                                onChange={(e) => setCampaignName(e.target.value)}
                                placeholder="Ej: Bienvenida a nuevos clientes"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="schedule-frequency">Frecuencia</Label>
                                <Select value={scheduleFrequency} onValueChange={(v) => setScheduleFrequency(v as ScheduleFrequency)}>
                                    <SelectTrigger id="schedule-frequency">
                                        <SelectValue placeholder="Seleccionar frecuencia" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="once">Una vez</SelectItem>
                                        <SelectItem value="daily">Diariamente</SelectItem>
                                        <SelectItem value="weekly">Semanalmente</SelectItem>
                                        <SelectItem value="monthly">Mensualmente</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="schedule-time">Hora de envío</Label>
                                <Input
                                    id="schedule-time"
                                    type="time"
                                    value={scheduleTime}
                                    onChange={(e) => setScheduleTime(e.target.value)}
                                />
                            </div>
                        </div>

                        {scheduleFrequency === 'once' && (
                            <div>
                                <Label>Fecha de Envío</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="w-full justify-start text-left font-normal"
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {scheduleOnceDate ? format(scheduleOnceDate, 'PPP', { locale: es }) : <span>Elige una fecha</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={scheduleOnceDate}
                                            onSelect={setScheduleOnceDate}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        )}

                        {scheduleFrequency === 'weekly' && (
                            <div>
                                <Label>Días de la semana</Label>
                                <ToggleGroup
                                    type="multiple"
                                    variant="outline"
                                    value={scheduleWeeklyDays}
                                    onValueChange={(value) => value.length > 0 && setScheduleWeeklyDays(value)}
                                    className="flex-wrap justify-start"
                                >
                                    <ToggleGroupItem value="1">L</ToggleGroupItem>
                                    <ToggleGroupItem value="2">M</ToggleGroupItem>
                                    <ToggleGroupItem value="3">X</ToggleGroupItem>
                                    <ToggleGroupItem value="4">J</ToggleGroupItem>
                                    <ToggleGroupItem value="5">V</ToggleGroupItem>
                                    <ToggleGroupItem value="6">S</ToggleGroupItem>
                                    <ToggleGroupItem value="0">D</ToggleGroupItem>
                                </ToggleGroup>
                            </div>
                        )}

                        {scheduleFrequency === 'monthly' && (
                            <div>
                                <Label htmlFor="schedule-monthly-day">Día del mes (1-31)</Label>
                                <Input
                                    id="schedule-monthly-day"
                                    type="number"
                                    min="1"
                                    max="31"
                                    value={scheduleMonthlyDay}
                                    onChange={(e) => setScheduleMonthlyDay(e.target.value)}
                                />
                            </div>
                        )}

                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowScheduleDialog(false)}>Cancelar</Button>
                        <Button onClick={handleScheduleCampaign} disabled={isLoading}>
                            {isLoading ? 'Programando...' : 'Guardar Campaña'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
} 