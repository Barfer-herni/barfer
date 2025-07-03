'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@repo/design-system/components/ui/card';
import { Button } from '@repo/design-system/components/ui/button';
import { Input } from '@repo/design-system/components/ui/input';
import { Textarea } from '@repo/design-system/components/ui/textarea';
import { Label } from '@repo/design-system/components/ui/label';
import type { EmailTemplateData } from '@repo/data-services';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@repo/design-system/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@repo/design-system/components/ui/dialog';
import { Save, Trash2 } from 'lucide-react';
import { createEmailTemplateAction, deleteEmailTemplateAction } from '../actions';

interface TemplateSelectorClientProps {
    templates: EmailTemplateData[];
    selectedTemplateId: string;
    customSubject: string;
    customContent: string;
    onTemplateChange: (templateId: string) => void;
    onSubjectChange: (subject: string) => void;
    onContentChange: (content: string) => void;
    onTemplateCreated: () => void;
}

export function TemplateSelectorClient({
    templates,
    selectedTemplateId,
    customSubject,
    customContent,
    onTemplateChange,
    onSubjectChange,
    onContentChange,
    onTemplateCreated
}: TemplateSelectorClientProps) {
    // State for the save dialog
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [templateName, setTemplateName] = useState('');
    const [templateDescription, setTemplateDescription] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // State for deleting a template
    const [isDeleting, setIsDeleting] = useState(false);

    const handleSaveTemplate = async () => {
        if (!templateName.trim() || !customSubject.trim() || !customContent.trim()) {
            alert('Completa todos los campos requeridos');
            return;
        }

        setIsSaving(true);
        try {
            const result = await createEmailTemplateAction(
                templateName.trim(),
                customSubject.trim(),
                customContent.trim(),
                templateDescription.trim() || undefined
            );

            if (result.success) {
                alert('Template guardado exitosamente');
                setShowSaveDialog(false);
                setTemplateName('');
                setTemplateDescription('');
                onTemplateCreated(); // Trigger revalidation
            } else {
                alert(`Error al guardar el template: ${result.error}`);
            }
        } catch (error) {
            console.error('Error saving template:', error);
            alert(`Error al guardar el template: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteTemplate = async (templateId: string) => {
        if (!confirm('¿Estás seguro de que quieres eliminar este template?')) {
            return;
        }

        setIsDeleting(true);
        try {
            const result = await deleteEmailTemplateAction(templateId);

            if (result.success) {
                alert('Template eliminado exitosamente');
                onTemplateCreated(); // Trigger revalidation
            } else {
                alert(`Error al eliminar el template: ${result.error}`);
            }
        } catch (error) {
            console.error('Error deleting template:', error);
            alert(`Error al eliminar el template: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        } finally {
            setIsDeleting(false);
        }
    };

    const canSaveAsTemplate = customSubject.trim() && customContent.trim() &&
        (selectedTemplateId === 'custom' || selectedTemplateId === '');

    return (
        <Card>
            <CardHeader>
                <CardTitle>📧 Seleccionar Template de Email</CardTitle>
                <CardDescription>
                    Elige un template predefinido o crea un mensaje personalizado
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <Label htmlFor="template-select">Template</Label>
                    <Select value={selectedTemplateId || 'custom'} onValueChange={onTemplateChange}>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecciona un template..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="custom">✍️ Mensaje personalizado</SelectItem>
                            {templates.map((template) => (
                                <SelectItem key={template.id} value={template.id}>
                                    {template.isDefault ? '⭐ ' : ''}{template.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <Label htmlFor="subject">Asunto del Email</Label>
                    <Input
                        id="subject"
                        value={customSubject}
                        onChange={(e) => onSubjectChange(e.target.value)}
                        placeholder="Escribe el asunto del email..."
                    />
                </div>

                <div>
                    <Label htmlFor="content">Contenido del Email</Label>
                    <Textarea
                        id="content"
                        value={customContent}
                        onChange={(e) => onContentChange(e.target.value)}
                        placeholder="Escribe el contenido del email..."
                        rows={8}
                    />
                </div>

                {selectedTemplateId && selectedTemplateId !== 'custom' && (
                    <div className="text-sm text-muted-foreground">
                        💡 Puedes editar el contenido arriba para personalizar este template
                    </div>
                )}

                {selectedTemplateId && selectedTemplateId !== 'custom' && (
                    (() => {
                        const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
                        if (!selectedTemplate) return null;

                        return (
                            <div className="p-3 border rounded-lg bg-muted/30">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <h4 className="text-sm font-medium flex items-center gap-2">
                                            {selectedTemplate.isDefault ? '⭐' : '📝'} {selectedTemplate.name}
                                        </h4>
                                        {selectedTemplate.description && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {selectedTemplate.description}
                                            </p>
                                        )}
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDeleteTemplate(selectedTemplate.id)}
                                        disabled={isDeleting}
                                        className="text-destructive border-destructive/20 hover:bg-destructive/10"
                                    >
                                        <Trash2 className="h-4 w-4 mr-1" />
                                        {isDeleting ? 'Eliminando...' : 'Eliminar'}
                                    </Button>
                                </div>
                            </div>
                        );
                    })()
                )}

                {canSaveAsTemplate && (
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="text-sm text-muted-foreground">
                            ¿Te gusta este contenido? Guárdalo como template para reutilizarlo
                        </div>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowSaveDialog(true)}
                            className="flex items-center gap-2"
                        >
                            <Save className="h-4 w-4" />
                            Guardar Template
                        </Button>
                    </div>
                )}
            </CardContent>

            {/* Modal para guardar template */}
            <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Guardar como Template</DialogTitle>
                        <DialogDescription>
                            Guarda este contenido como un template reutilizable para futuros envíos
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="template-name">Nombre del Template *</Label>
                            <Input
                                id="template-name"
                                value={templateName}
                                onChange={(e) => setTemplateName(e.target.value)}
                                placeholder="Ej: Promoción Black Friday"
                            />
                        </div>

                        <div>
                            <Label htmlFor="template-description">Descripción (opcional)</Label>
                            <Textarea
                                id="template-description"
                                value={templateDescription}
                                onChange={(e) => setTemplateDescription(e.target.value)}
                                placeholder="Describe cuándo usar este template..."
                                rows={2}
                            />
                        </div>

                        <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
                            <strong>Vista previa:</strong>
                            <div className="mt-2">
                                <div><strong>Asunto:</strong> {customSubject}</div>
                                <div className="mt-1"><strong>Contenido:</strong> {customContent.substring(0, 100)}...</div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowSaveDialog(false)}
                            disabled={isSaving}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSaveTemplate}
                            disabled={isSaving || !templateName.trim()}
                        >
                            {isSaving ? 'Guardando...' : 'Guardar Template'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
} 