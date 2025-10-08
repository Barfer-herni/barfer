'use client'

import { useState, useEffect } from 'react';
import { TipoSalida, TipoRegistro } from '@repo/database';
import {
    createSalidaAction,
    getAllCategoriasAction,
    getAllMetodosPagoAction,
    createCategoriaAction,
    createMetodoPagoAction,
    getAllProveedoresAction,
    searchProveedoresAction,
    testSearchProveedoresAction
} from '../actions';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@repo/design-system/components/ui/dialog';
import { Button } from '@repo/design-system/components/ui/button';
import { Input } from '@repo/design-system/components/ui/input';
import { Label } from '@repo/design-system/components/ui/label';
import { Textarea } from '@repo/design-system/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@repo/design-system/components/ui/select';
import { toast } from '@repo/design-system/hooks/use-toast';
import { Calendar } from '@repo/design-system/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@repo/design-system/components/ui/popover';
import { CalendarIcon, Plus, X, Check, Search, User } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@repo/design-system/lib/utils';

interface AddSalidaModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSalidaCreated: () => void;
}

export function AddSalidaModal({ open, onOpenChange, onSalidaCreated }: AddSalidaModalProps) {
    const [isLoading, setIsLoading] = useState(false);

    const MARCAS_PREDEFINIDAS = ['BARFER'];

    // Estado del formulario
    const [formData, setFormData] = useState({
        fechaFactura: new Date(),
        detalle: '',
        categoriaId: '',
        tipo: 'ORDINARIO' as TipoSalida,
        marca: 'BARFER',
        monto: 0,
        metodoPagoId: '',
        tipoRegistro: 'BLANCO' as TipoRegistro,
        fechaPago: null as Date | null,
        comprobanteNumber: '',
        proveedorId: '',
    });

    // Estados para datos de BD
    const [categoriasDisponibles, setCategorias] = useState<Array<{ id: string, nombre: string }>>([]);
    const [metodosPagoDisponibles, setMetodosPago] = useState<Array<{ id: string, nombre: string }>>([]);
    const [proveedoresDisponibles, setProveedores] = useState<Array<{
        id: string,
        nombre: string,
        detalle: string,
        categoriaId?: string,
        metodoPagoId?: string,
        registro: 'BLANCO' | 'NEGRO',
        categoria?: { _id: string; nombre: string; };
        metodoPago?: { _id: string; nombre: string; };
    }>>([]);

    // Estados para opciones personalizadas
    const [customCategoria, setCustomCategoria] = useState('');
    const [isAddingCategoria, setIsAddingCategoria] = useState(false);
    const [customMetodoPago, setCustomMetodoPago] = useState('');
    const [isAddingMetodoPago, setIsAddingMetodoPago] = useState(false);

    // Estados para búsqueda de proveedor
    const [proveedorSearchTerm, setProveedorSearchTerm] = useState('');
    const [proveedorSearchResults, setProveedorSearchResults] = useState<Array<{
        id: string,
        nombre: string,
        detalle: string,
        categoriaId?: string,
        metodoPagoId?: string,
        registro: 'BLANCO' | 'NEGRO',
        categoria?: { _id: string; nombre: string; };
        metodoPago?: { _id: string; nombre: string; };
    }>>([]);
    const [showProveedorResults, setShowProveedorResults] = useState(false);
    const [selectedProveedor, setSelectedProveedor] = useState<{
        id: string,
        nombre: string,
        detalle: string,
        categoriaId?: string,
        metodoPagoId?: string,
        registro: 'BLANCO' | 'NEGRO',
        categoria?: { _id: string; nombre: string; };
        metodoPago?: { _id: string; nombre: string; };
    } | null>(null);

    const [errors, setErrors] = useState<Record<string, string>>({});

    // Cargar datos de la BD al abrir el modal
    useEffect(() => {
        if (open) {
            loadData();
        }
    }, [open]);

    const loadData = async () => {
        try {
            const [categoriasResult, metodosPagoResult, proveedoresResult] = await Promise.all([
                getAllCategoriasAction(),
                getAllMetodosPagoAction(),
                getAllProveedoresAction()
            ]);

            if (categoriasResult.success && categoriasResult.categorias) {
                setCategorias(categoriasResult.categorias.map(c => ({ id: c._id, nombre: c.nombre })));
            }

            if (metodosPagoResult.success && metodosPagoResult.metodosPago) {
                // Filtrar solo EFECTIVO y TRANSFERENCIA
                const metodosFiltrados = metodosPagoResult.metodosPago
                    .filter(m => m.nombre === 'EFECTIVO' || m.nombre === 'TRANSFERENCIA')
                    .map(m => ({ id: m._id, nombre: m.nombre }));
                setMetodosPago(metodosFiltrados);
            }

            if (proveedoresResult.success && proveedoresResult.proveedores) {
                setProveedores(proveedoresResult.proveedores.map(p => ({
                    id: p._id,
                    nombre: p.nombre,
                    detalle: p.detalle,
                    categoriaId: p.categoriaId || undefined,
                    metodoPagoId: p.metodoPagoId || undefined,
                    registro: p.registro,
                    categoria: p.categoria,
                    metodoPago: p.metodoPago
                })));
            }
        } catch (error) {
            console.error('Error loading data:', error);
        }
    };

    // Funciones para manejar opciones personalizadas
    const handleAddCategoria = async () => {
        if (customCategoria.trim()) {
            const result = await createCategoriaAction(customCategoria.trim());
            if (result.success && result.categoria) {
                const newCategoria = { id: result.categoria._id, nombre: result.categoria.nombre };
                setCategorias([...categoriasDisponibles, newCategoria]);
                handleInputChange('categoriaId', newCategoria.id);
                setCustomCategoria('');
                setIsAddingCategoria(false);
            }
        }
    };

    const handleAddMetodoPago = async () => {
        if (customMetodoPago.trim()) {
            const result = await createMetodoPagoAction(customMetodoPago.trim());
            if (result.success && result.metodoPago) {
                const newMetodoPago = { id: result.metodoPago._id, nombre: result.metodoPago.nombre };
                setMetodosPago([...metodosPagoDisponibles, newMetodoPago]);
                handleInputChange('metodoPagoId', newMetodoPago.id);
                setCustomMetodoPago('');
                setIsAddingMetodoPago(false);
            }
        }
    };

    // Funciones para búsqueda de proveedor
    const handleProveedorSearch = async (searchTerm: string) => {
        setProveedorSearchTerm(searchTerm);

        if (searchTerm.length < 2) {
            setProveedorSearchResults([]);
            setShowProveedorResults(false);
            return;
        }

        try {
            console.log('🔍 Buscando proveedores con término:', searchTerm);
            // Usar función de prueba temporalmente
            const result = await testSearchProveedoresAction(searchTerm);
            console.log('📊 Resultado de búsqueda:', result);

            if (result.success && result.proveedores) {
                console.log('✅ Proveedores encontrados:', result.proveedores.length);
                const formattedResults = result.proveedores.map(p => ({
                    id: p._id,
                    nombre: p.nombre,
                    detalle: p.detalle,
                    categoriaId: p.categoriaId,
                    metodoPagoId: p.metodoPagoId,
                    registro: p.registro,
                    categoria: p.categoria,
                    metodoPago: p.metodoPago
                }));
                console.log('🔄 Resultados formateados:', formattedResults);
                setProveedorSearchResults(formattedResults);
                setShowProveedorResults(true);
            } else {
                console.log('❌ No se encontraron proveedores o error:', result);
                setProveedorSearchResults([]);
                setShowProveedorResults(true);
            }
        } catch (error) {
            console.error('❌ Error searching proveedores:', error);
            setProveedorSearchResults([]);
            setShowProveedorResults(false);
        }
    };

    const handleProveedorSelect = (proveedor: typeof selectedProveedor) => {
        if (!proveedor) return;

        setSelectedProveedor(proveedor);
        setProveedorSearchTerm(proveedor.nombre);
        setShowProveedorResults(false);

        // Guardar el ID del proveedor
        handleInputChange('proveedorId', proveedor.id);

        // Autocompletar campos
        if (proveedor.categoriaId) {
            handleInputChange('categoriaId', proveedor.categoriaId);
        }
        if (proveedor.metodoPagoId) {
            handleInputChange('metodoPagoId', proveedor.metodoPagoId);
        }
        handleInputChange('tipoRegistro', proveedor.registro);

        // Actualizar detalle con información del proveedor
        if (proveedor.detalle) {
            const currentDetalle = formData.detalle;
            const newDetalle = currentDetalle ? `${currentDetalle} - ${proveedor.detalle}` : proveedor.detalle;
            handleInputChange('detalle', newDetalle);
        }
    };

    const clearProveedorSelection = () => {
        setSelectedProveedor(null);
        setProveedorSearchTerm('');
        setProveedorSearchResults([]);
        setShowProveedorResults(false);
        handleInputChange('proveedorId', '');
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.detalle.trim()) {
            newErrors.detalle = 'El detalle es requerido';
        }

        if (!formData.categoriaId.trim()) {
            newErrors.categoriaId = 'La categoría es requerida';
        }

        if (!formData.metodoPagoId.trim()) {
            newErrors.metodoPagoId = 'El método de pago es requerido';
        }

        if (formData.monto <= 0) {
            newErrors.monto = 'El monto debe ser mayor a 0';
        }

        if (!formData.fechaFactura) {
            newErrors.fechaFactura = 'La fecha de factura es requerida';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsLoading(true);

        try {
            const result = await createSalidaAction({
                fechaFactura: formData.fechaFactura,
                detalle: formData.detalle,
                categoriaId: formData.categoriaId,
                tipo: formData.tipo,
                marca: 'BARFER',
                monto: formData.monto,
                metodoPagoId: formData.metodoPagoId,
                tipoRegistro: formData.tipoRegistro,
                fechaPago: formData.fechaPago || undefined,
                comprobanteNumber: formData.comprobanteNumber,
                proveedorId: formData.proveedorId || undefined,
            });

            if (result.success) {
                toast({
                    title: "¡Éxito!",
                    description: result.message || "Salida creada correctamente",
                });

                // Resetear formulario
                setFormData({
                    fechaFactura: new Date(),
                    detalle: '',
                    categoriaId: '',
                    tipo: 'ORDINARIO',
                    marca: 'BARFER',
                    monto: 0,
                    metodoPagoId: '',
                    tipoRegistro: 'BLANCO',
                    fechaPago: null,
                    comprobanteNumber: '',
                    proveedorId: '',
                });
                setErrors({});

                // Resetear estados de campos personalizados
                setCustomCategoria('');
                setIsAddingCategoria(false);
                setCustomMetodoPago('');
                setIsAddingMetodoPago(false);

                // Resetear estados de búsqueda de proveedor
                clearProveedorSelection();

                onSalidaCreated();
                onOpenChange(false);
            } else {
                toast({
                    title: "Error",
                    description: result.message || "Error al crear la salida",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error('Error creating salida:', error);
            toast({
                title: "Error",
                description: "Ocurrió un error inesperado",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        // Limpiar error del campo
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: ''
            }));
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Agregar Nueva Salida</DialogTitle>
                    <DialogDescription>
                        Completa los datos de la salida de dinero.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        {/* Fecha */}
                        <div className="grid gap-2">
                            <Label htmlFor="fecha">Fecha *</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            'justify-start text-left font-normal',
                                            !formData.fechaFactura && 'text-muted-foreground',
                                            errors.fechaFactura && 'border-red-500'
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {formData.fechaFactura ? (
                                            format(formData.fechaFactura, 'PPP', { locale: es })
                                        ) : (
                                            'Seleccionar fecha de factura'
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={formData.fechaFactura}
                                        onSelect={(date) => handleInputChange('fechaFactura', date)}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                            {errors.fechaFactura && (
                                <span className="text-sm text-red-500">{errors.fechaFactura}</span>
                            )}
                        </div>

                        {/* Búsqueda de Proveedor */}
                        <div className="grid gap-2">
                            <Label htmlFor="proveedor">Proveedor (Opcional)</Label>
                            <div className="relative">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                    <Input
                                        id="proveedor"
                                        placeholder="Buscar proveedor por nombre..."
                                        value={proveedorSearchTerm}
                                        onChange={(e) => handleProveedorSearch(e.target.value)}
                                        className="pl-10 pr-10"
                                    />
                                    {selectedProveedor && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={clearProveedorSelection}
                                            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100"
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    )}
                                </div>

                                {/* Resultados de búsqueda */}
                                {showProveedorResults && proveedorSearchResults.length > 0 && (
                                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                        {proveedorSearchResults.map((proveedor) => (
                                            <div
                                                key={proveedor.id}
                                                className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                                onClick={() => handleProveedorSelect(proveedor)}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <User className="h-4 w-4 text-gray-400" />
                                                    <div className="flex-1">
                                                        <div className="font-medium text-sm">{proveedor.nombre}</div>
                                                        <div className="text-xs text-gray-500">{proveedor.detalle}</div>
                                                        {proveedor.categoria && (
                                                            <div className="text-xs text-blue-600">
                                                                {proveedor.categoria.nombre}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-gray-400">
                                                        {proveedor.registro}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Mensaje cuando no hay resultados */}
                                {showProveedorResults && proveedorSearchResults.length === 0 && proveedorSearchTerm.length >= 2 && (
                                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg p-4 text-center text-gray-500 text-sm">
                                        No se encontraron proveedores
                                    </div>
                                )}
                            </div>
                            {selectedProveedor && (
                                <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
                                    ✓ Proveedor seleccionado: {selectedProveedor.nombre} - {selectedProveedor.detalle}
                                </div>
                            )}
                        </div>

                        {/* Detalle */}
                        <div className="grid gap-2">
                            <Label htmlFor="detalle">Detalle *</Label>
                            <Textarea
                                id="detalle"
                                placeholder="Describe el motivo de la salida..."
                                value={formData.detalle}
                                onChange={(e) => handleInputChange('detalle', e.target.value)}
                                className={errors.detalle ? 'border-red-500' : ''}
                            />
                            {errors.detalle && (
                                <span className="text-sm text-red-500">{errors.detalle}</span>
                            )}
                        </div>

                        {/* Fila: Categoría y Marca */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Categoría *</Label>
                                {isAddingCategoria ? (
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Nueva categoría..."
                                            value={customCategoria}
                                            onChange={(e) => setCustomCategoria(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleAddCategoria();
                                                }
                                            }}
                                        />
                                        <Button
                                            type="button"
                                            size="sm"
                                            onClick={handleAddCategoria}
                                            className="px-2"
                                        >
                                            <Check className="h-3 w-3" />
                                        </Button>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={() => setIsAddingCategoria(false)}
                                            className="px-2"
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="flex gap-2">
                                        <Select
                                            value={formData.categoriaId}
                                            onValueChange={(value) => {
                                                if (value === 'ADD_NEW') {
                                                    setIsAddingCategoria(true);
                                                } else {
                                                    handleInputChange('categoriaId', value);
                                                }
                                            }}
                                        >
                                            <SelectTrigger className={errors.categoriaId ? 'border-red-500' : ''}>
                                                <SelectValue placeholder="Seleccionar categoría..." />
                                            </SelectTrigger>
                                            <SelectContent className="max-h-60">
                                                {categoriasDisponibles.map((cat) => (
                                                    <SelectItem key={cat.id} value={cat.id}>
                                                        {cat.nombre}
                                                    </SelectItem>
                                                ))}
                                                <SelectItem value="ADD_NEW" className="text-blue-600 font-medium">
                                                    <div className="flex items-center gap-2">
                                                        <Plus className="h-3 w-3" />
                                                        Agregar nueva categoría
                                                    </div>
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                                {errors.categoriaId && (
                                    <span className="text-sm text-red-500">{errors.categoriaId}</span>
                                )}
                            </div>

                            <div className="grid gap-2">
                                <Label>Marca</Label>
                                <Input
                                    value="BARFER"
                                    disabled
                                    className="bg-gray-50"
                                />
                            </div>
                        </div>

                        {/* Fila: Tipo y Monto */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Tipo de Salida *</Label>
                                <Select
                                    value={formData.tipo}
                                    onValueChange={(value: TipoSalida) => handleInputChange('tipo', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ORDINARIO">Ordinario</SelectItem>
                                        <SelectItem value="EXTRAORDINARIO">Extraordinario</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="monto">Monto *</Label>
                                <Input
                                    id="monto"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="0.00"
                                    value={formData.monto || ''}
                                    onChange={(e) => handleInputChange('monto', parseFloat(e.target.value) || 0)}
                                    className={errors.monto ? 'border-red-500' : ''}
                                />
                                {errors.monto && (
                                    <span className="text-sm text-red-500">{errors.monto}</span>
                                )}
                            </div>
                        </div>

                        {/* Fila: Forma de Pago y Tipo de Registro */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Método de Pago *</Label>
                                {isAddingMetodoPago ? (
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Nuevo método de pago..."
                                            value={customMetodoPago}
                                            onChange={(e) => setCustomMetodoPago(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleAddMetodoPago();
                                                }
                                            }}
                                        />
                                        <Button
                                            type="button"
                                            size="sm"
                                            onClick={handleAddMetodoPago}
                                            className="px-2"
                                        >
                                            <Check className="h-3 w-3" />
                                        </Button>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={() => setIsAddingMetodoPago(false)}
                                            className="px-2"
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </div>
                                ) : (
                                    <Select
                                        value={formData.metodoPagoId}
                                        onValueChange={(value) => {
                                            if (value === 'ADD_NEW') {
                                                setIsAddingMetodoPago(true);
                                            } else {
                                                handleInputChange('metodoPagoId', value);
                                            }
                                        }}
                                    >
                                        <SelectTrigger className={errors.metodoPagoId ? 'border-red-500' : ''}>
                                            <SelectValue placeholder="Seleccionar método..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {metodosPagoDisponibles.map((metodo) => (
                                                <SelectItem key={metodo.id} value={metodo.id}>
                                                    {metodo.nombre}
                                                </SelectItem>
                                            ))}
                                            <SelectItem value="ADD_NEW" className="text-blue-600 font-medium">
                                                <div className="flex items-center gap-2">
                                                    <Plus className="h-3 w-3" />
                                                    Agregar método de pago
                                                </div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                                {errors.metodoPagoId && (
                                    <span className="text-sm text-red-500">{errors.metodoPagoId}</span>
                                )}
                            </div>

                            <div className="grid gap-2">
                                <Label>Tipo de Registro *</Label>
                                <Select
                                    value={formData.tipoRegistro}
                                    onValueChange={(value: TipoRegistro) => handleInputChange('tipoRegistro', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="BLANCO">Blanco (Declarado)</SelectItem>
                                        <SelectItem value="NEGRO">Negro (No Declarado)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Fecha de Pago */}
                        <div className="grid gap-2">
                            <Label>Fecha de Pago</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            'justify-start text-left font-normal',
                                            !formData.fechaPago && 'text-muted-foreground'
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {formData.fechaPago ? (
                                            format(formData.fechaPago, 'PPP', { locale: es })
                                        ) : (
                                            'Seleccionar fecha de pago'
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={formData.fechaPago || undefined}
                                        onSelect={(date) => handleInputChange('fechaPago', date)}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Número de Comprobante */}
                        <div className="grid gap-2">
                            <Label htmlFor="comprobanteNumber">Número de Comprobante</Label>
                            <Input
                                id="comprobanteNumber"
                                placeholder="Ej: 0001-00012345"
                                value={formData.comprobanteNumber}
                                onChange={(e) => handleInputChange('comprobanteNumber', e.target.value)}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isLoading}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Guardando...' : 'Guardar Salida'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
} 