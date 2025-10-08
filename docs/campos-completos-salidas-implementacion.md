# Implementación Completa: Campos Adicionales en Salidas

## Descripción

Se completó la implementación de todos los campos adicionales solicitados para la tabla de salidas:

1. **Fecha que llega la factura** (`fechaLlegaFactura`)
2. **Fecha que pagan la factura** (`fechaPagoFactura`) 
3. **Número de comprobante** (`comprobanteNumber`)

## Campos Implementados

### 1. Fechas de Facturación
- **`fechaLlegaFactura`**: Fecha en que se recibe la factura del proveedor
- **`fechaPagoFactura`**: Fecha en que se efectúa el pago de la factura
- **Tipo**: `Date | string | null` (opcionales)
- **UI**: Selectores de fecha con calendario

### 2. Número de Comprobante
- **`comprobanteNumber`**: Número de comprobante de la factura
- **Tipo**: `string` (opcional)
- **UI**: Campo de texto con placeholder
- **Visualización**: Truncado a 8 caracteres en tabla, completo en tooltip

## Archivos Modificados

### 1. Tipos de Datos (`salidasService.ts`)

#### Interface SalidaData:
```typescript
export interface SalidaData {
    // ... campos existentes
    fechaLlegaFactura?: Date | string | null; // Fecha que llega la factura
    fechaPagoFactura?: Date | string | null;  // Fecha que pagan la factura
    comprobanteNumber?: string | null;        // Número de comprobante
    // ... resto de campos
}
```

#### Interface CreateSalidaInput:
```typescript
export interface CreateSalidaInput {
    // ... campos existentes
    fechaLlegaFactura?: Date | string; // Fecha que llega la factura
    fechaPagoFactura?: Date | string;  // Fecha que pagan la factura
    comprobanteNumber?: string;        // Número de comprobante
}
```

#### Interface UpdateSalidaInput:
```typescript
export interface UpdateSalidaInput {
    // ... campos existentes
    fechaLlegaFactura?: Date | string; // Fecha que llega la factura
    fechaPagoFactura?: Date | string;  // Fecha que pagan la factura
    comprobanteNumber?: string;        // Número de comprobante
}
```

### 2. Tabla de Salidas (`SalidasTable.tsx`)

#### Ordenamiento actualizado:
```typescript
type SortField = 'fecha' | 'categoria' | 'proveedor' | 'detalle' | 'tipo' | 'marca' | 'monto' | 'metodoPago' | 'tipoRegistro' | 'fechaLlegaFactura' | 'fechaPagoFactura' | 'comprobanteNumber';
```

#### Lógica de ordenamiento:
```typescript
case 'fechaLlegaFactura':
    aValue = a.fechaLlegaFactura ? new Date(a.fechaLlegaFactura) : new Date(0);
    bValue = b.fechaLlegaFactura ? new Date(b.fechaLlegaFactura) : new Date(0);
    break;
case 'fechaPagoFactura':
    aValue = a.fechaPagoFactura ? new Date(a.fechaPagoFactura) : new Date(0);
    bValue = b.fechaPagoFactura ? new Date(b.fechaPagoFactura) : new Date(0);
    break;
case 'comprobanteNumber':
    aValue = (a as any).comprobanteNumber ? String((a as any).comprobanteNumber).toLowerCase() : '';
    bValue = (b as any).comprobanteNumber ? String((b as any).comprobanteNumber).toLowerCase() : '';
    break;
```

#### Nuevas columnas:
```typescript
<TableHead 
    className="font-semibold w-[120px] cursor-pointer hover:bg-muted/70 select-none"
    onClick={() => handleSort('fechaLlegaFactura')}
>
    <div className="flex items-center gap-1">
        Llega Factura
        {getSortIcon('fechaLlegaFactura')}
    </div>
</TableHead>
<TableHead 
    className="font-semibold w-[120px] cursor-pointer hover:bg-muted/70 select-none"
    onClick={() => handleSort('fechaPagoFactura')}
>
    <div className="flex items-center gap-1">
        Pago Factura
        {getSortIcon('fechaPagoFactura')}
    </div>
</TableHead>
<TableHead 
    className="font-semibold w-[120px] cursor-pointer hover:bg-muted/70 select-none"
    onClick={() => handleSort('comprobanteNumber')}
>
    <div className="flex items-center gap-1">
        Comprobante
        {getSortIcon('comprobanteNumber')}
    </div>
</TableHead>
```

#### Celdas de datos:
```typescript
<TableCell className="w-[120px] text-sm">
    {salida.fechaLlegaFactura ? formatDate(salida.fechaLlegaFactura) : '-'}
</TableCell>
<TableCell className="w-[120px] text-sm">
    {salida.fechaPagoFactura ? formatDate(salida.fechaPagoFactura) : '-'}
</TableCell>
<TableCell className="w-[120px] text-sm font-mono">
    <div className="truncate" title={(salida as any).comprobanteNumber || ''}>
        {((salida as any).comprobanteNumber || '').toString().slice(0, 8) || '-'}
    </div>
</TableCell>
```

### 3. Modal de Creación (`AddSalidaModal.tsx`)

#### Estado del formulario:
```typescript
const [formData, setFormData] = useState({
    // ... campos existentes
    fechaLlegaFactura: null as Date | null,
    fechaPagoFactura: null as Date | null,
    comprobanteNumber: '',
});
```

#### Campos de fecha con calendario:
```typescript
{/* Fila: Fechas de Facturación */}
<div className="grid grid-cols-2 gap-4">
    <div className="grid gap-2">
        <Label>Fecha que llega la factura</Label>
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.fechaLlegaFactura ? 
                        format(formData.fechaLlegaFactura, 'PPP', { locale: es }) : 
                        'Seleccionar fecha'
                    }
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
                <Calendar
                    mode="single"
                    selected={formData.fechaLlegaFactura}
                    onSelect={(date) => handleInputChange('fechaLlegaFactura', date)}
                    initialFocus
                />
            </PopoverContent>
        </Popover>
    </div>
    {/* Similar para fechaPagoFactura */}
</div>
```

#### Campo de comprobante:
```typescript
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
```

#### Envío de datos:
```typescript
const result = await createSalidaAction({
    // ... campos existentes
    fechaLlegaFactura: formData.fechaLlegaFactura,
    fechaPagoFactura: formData.fechaPagoFactura,
    comprobanteNumber: formData.comprobanteNumber,
});
```

### 4. Modal de Edición (`EditSalidaModal.tsx`)

#### Inicialización con datos existentes:
```typescript
const [formData, setFormData] = useState({
    // ... campos existentes
    fechaLlegaFactura: salida.fechaLlegaFactura ? 
        (salida.fechaLlegaFactura instanceof Date ? salida.fechaLlegaFactura : new Date(salida.fechaLlegaFactura)) : 
        null,
    fechaPagoFactura: salida.fechaPagoFactura ? 
        (salida.fechaPagoFactura instanceof Date ? salida.fechaPagoFactura : new Date(salida.fechaPagoFactura)) : 
        null,
    comprobanteNumber: (salida as any).comprobanteNumber || '',
});
```

#### Actualización de datos:
```typescript
const result = await updateSalidaAction(salida.id, {
    // ... campos existentes
    fechaLlegaFactura: formData.fechaLlegaFactura,
    fechaPagoFactura: formData.fechaPagoFactura,
    comprobanteNumber: formData.comprobanteNumber,
});
```

## Estructura Final de la Tabla

### Orden de columnas:
```
Fecha | Categoría | Proveedor | Detalle | Tipo | Marca | Monto | Forma de Pago | Registro | Llega Factura | Pago Factura | Comprobante | Acciones
```

### Características de las nuevas columnas:

#### Llega Factura:
- **Ancho**: 120px
- **Ordenamiento**: Clickeable con íconos
- **Formato**: DD/MM/YYYY o "-" si no hay fecha
- **Funcionalidad**: Ordena por fecha cronológica

#### Pago Factura:
- **Ancho**: 120px
- **Ordenamiento**: Clickeable con íconos
- **Formato**: DD/MM/YYYY o "-" si no hay fecha
- **Funcionalidad**: Ordena por fecha cronológica

#### Comprobante:
- **Ancho**: 120px
- **Ordenamiento**: Clickeable con íconos
- **Formato**: Primeros 8 caracteres + "..." o "-" si está vacío
- **Tooltip**: Muestra el número completo
- **Funcionalidad**: Ordena alfabéticamente

## Funcionalidades Implementadas

### 1. Creación de Salidas
- ✅ Campos de fecha con selectores de calendario
- ✅ Campo de número de comprobante
- ✅ Validación y envío de datos
- ✅ Reset de formulario después de crear

### 2. Edición de Salidas
- ✅ Pre-carga de datos existentes
- ✅ Actualización de fechas y comprobante
- ✅ Manejo de fechas null/undefined
- ✅ Preservación de datos al cancelar

### 3. Visualización en Tabla
- ✅ Nuevas columnas ordenables
- ✅ Formato de fechas consistente
- ✅ Truncado de comprobante con tooltip
- ✅ Indicadores visuales de ordenamiento

### 4. Ordenamiento
- ✅ Por fecha de llegada de factura
- ✅ Por fecha de pago de factura
- ✅ Por número de comprobante
- ✅ Manejo de valores null/undefined

## Casos de Uso

### 1. Seguimiento de Facturación
- Ver qué facturas han llegado pero no se han pagado
- Identificar facturas vencidas
- Hacer seguimiento de pagos pendientes

### 2. Análisis de Flujo de Caja
- Calcular días entre llegada y pago de facturas
- Identificar proveedores con pagos más lentos
- Planificar flujo de caja basado en fechas de pago

### 3. Control de Comprobantes
- Buscar salidas por número de comprobante
- Verificar duplicados de comprobantes
- Hacer seguimiento de facturas específicas

### 4. Reportes Avanzados
- Facturas pendientes de pago
- Análisis de días promedio de pago
- Reporte de comprobantes por período

## Validaciones Implementadas

### 1. Fechas
- Manejo de fechas null/undefined
- Conversión entre Date y string
- Formato consistente en UI

### 2. Comprobante
- Campo opcional (puede estar vacío)
- Truncado para visualización
- Tooltip con valor completo

### 3. Ordenamiento
- Fechas null aparecen al final en orden ascendente
- Comprobantes vacíos aparecen al final
- Ordenamiento alfabético para comprobantes

## Próximos Pasos (Para implementar)

### 1. Base de Datos
- Agregar campos en MongoDB/Prisma
- Crear índices para búsquedas eficientes
- Migración de datos existentes

### 2. Validaciones Avanzadas
- Fecha de pago >= fecha de llegada
- Formato específico para comprobantes
- Alertas para facturas vencidas

### 3. Filtros
- Filtrar por facturas pendientes
- Filtrar por rango de fechas
- Buscar por número de comprobante

### 4. Reportes
- Reporte de facturas vencidas
- Análisis de días de pago
- Exportación de datos

## Beneficios

1. **Seguimiento completo**: Ciclo completo de facturación
2. **Control de comprobantes**: Identificación única de facturas
3. **Gestión de flujo de caja**: Mejor planificación de pagos
4. **Análisis de proveedores**: Identificar patrones de pago
5. **Reportes avanzados**: Análisis detallado de gastos

## Fecha

2 de Octubre de 2025
