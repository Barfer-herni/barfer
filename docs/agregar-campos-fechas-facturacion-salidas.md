# Agregado de Campos de Fechas de Facturación en Salidas

## Descripción

Se agregaron dos nuevos campos a la tabla de salidas para hacer seguimiento del ciclo de facturación:

1. **Fecha que llega la factura** (`fechaLlegaFactura`)
2. **Fecha que pagan la factura** (`fechaPagoFactura`)

## Campos Agregados

### 1. Fecha que llega la factura
- **Campo**: `fechaLlegaFactura`
- **Tipo**: `Date | string | null` (opcional)
- **Descripción**: Fecha en que se recibe la factura del proveedor
- **Uso**: Para hacer seguimiento de cuándo llegan las facturas

### 2. Fecha que pagan la factura
- **Campo**: `fechaPagoFactura`
- **Tipo**: `Date | string | null` (opcional)
- **Descripción**: Fecha en que se efectúa el pago de la factura
- **Uso**: Para hacer seguimiento de cuándo se pagan las facturas

## Archivos Modificados

### 1. `/packages/data-services/src/services/salidasService.ts`

#### Interface SalidaData actualizada:
```typescript
export interface SalidaData {
    // ... campos existentes
    fechaLlegaFactura?: Date | string | null; // Fecha que llega la factura
    fechaPagoFactura?: Date | string | null;  // Fecha que pagan la factura
    // ... resto de campos
}
```

#### Interface CreateSalidaInput actualizada:
```typescript
export interface CreateSalidaInput {
    // ... campos existentes
    fechaLlegaFactura?: Date | string; // Fecha que llega la factura
    fechaPagoFactura?: Date | string;  // Fecha que pagan la factura
}
```

#### Interface UpdateSalidaInput actualizada:
```typescript
export interface UpdateSalidaInput {
    // ... campos existentes
    fechaLlegaFactura?: Date | string; // Fecha que llega la factura
    fechaPagoFactura?: Date | string;  // Fecha que pagan la factura
}
```

### 2. `/apps/app/app/[locale]/(authenticated)/admin/salidas/components/SalidasTable.tsx`

#### Ordenamiento actualizado:
```typescript
type SortField = 'fecha' | 'categoria' | 'proveedor' | 'detalle' | 'tipo' | 'marca' | 'monto' | 'metodoPago' | 'tipoRegistro' | 'fechaLlegaFactura' | 'fechaPagoFactura';
```

#### Lógica de ordenamiento para fechas:
```typescript
case 'fechaLlegaFactura':
    aValue = a.fechaLlegaFactura ? new Date(a.fechaLlegaFactura) : new Date(0);
    bValue = b.fechaLlegaFactura ? new Date(b.fechaLlegaFactura) : new Date(0);
    break;
case 'fechaPagoFactura':
    aValue = a.fechaPagoFactura ? new Date(a.fechaPagoFactura) : new Date(0);
    bValue = b.fechaPagoFactura ? new Date(b.fechaPagoFactura) : new Date(0);
    break;
```

#### Nuevas columnas en la tabla:
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
```

#### Celdas de datos:
```typescript
<TableCell className="w-[120px] text-sm">
    {salida.fechaLlegaFactura ? formatDate(salida.fechaLlegaFactura) : '-'}
</TableCell>
<TableCell className="w-[120px] text-sm">
    {salida.fechaPagoFactura ? formatDate(salida.fechaPagoFactura) : '-'}
</TableCell>
```

## Estructura de la Tabla Actualizada

### Orden de columnas:
```
Fecha | Categoría | Proveedor | Detalle | Tipo | Marca | Monto | Forma de Pago | Registro | Llega Factura | Pago Factura | Acciones
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

## Lógica de Ordenamiento

### Para fechas opcionales:
- Si la fecha existe: Se usa la fecha real para ordenar
- Si la fecha es null/undefined: Se usa `new Date(0)` (1 enero 1970) para que aparezcan al final en orden ascendente

### Comportamiento:
- **Orden ascendente**: Fechas más antiguas primero, sin fecha al final
- **Orden descendente**: Fechas más recientes primero, sin fecha al final

## Casos de Uso

### 1. Seguimiento de Facturación:
- Ver qué facturas han llegado pero no se han pagado
- Identificar facturas vencidas
- Hacer seguimiento de pagos pendientes

### 2. Análisis de Flujo de Caja:
- Calcular días entre llegada y pago de facturas
- Identificar proveedores con pagos más lentos
- Planificar flujo de caja basado en fechas de pago

### 3. Gestión de Proveedores:
- Ver qué proveedores tienen facturas pendientes
- Identificar patrones de pago por proveedor
- Optimizar términos de pago

## Ejemplos de Uso

### Ordenar por fecha de llegada:
1. Hacer clic en "Llega Factura"
2. Ver facturas ordenadas por fecha de llegada
3. Identificar facturas más antiguas sin pagar

### Ordenar por fecha de pago:
1. Hacer clic en "Pago Factura"
2. Ver pagos ordenados cronológicamente
3. Analizar patrones de pago

### Filtrar facturas pendientes:
- Facturas con `fechaLlegaFactura` pero sin `fechaPagoFactura`
- Facturas vencidas (fecha de llegada > fecha actual)

## Próximos Pasos (Para implementar)

### 1. Modales de Creación/Edición:
- Agregar campos de fecha en `AddSalidaModal`
- Agregar campos de fecha en `EditSalidaModal`
- Validar que fecha de pago >= fecha de llegada

### 2. Filtros Avanzados:
- Filtrar por facturas pendientes
- Filtrar por facturas vencidas
- Filtrar por rango de fechas de llegada/pago

### 3. Validaciones:
- Fecha de pago no puede ser anterior a fecha de llegada
- Fechas no pueden ser futuras (excepto fecha de pago planificada)
- Alertas para facturas vencidas

### 4. Reportes:
- Reporte de facturas pendientes
- Análisis de días promedio de pago
- Reporte de proveedores con pagos más lentos

## Base de Datos

### Campos a agregar en MongoDB:
```javascript
// Colección: salidas
{
    // ... campos existentes
    fechaLlegaFactura: Date | null,  // Fecha que llega la factura
    fechaPagoFactura: Date | null    // Fecha que pagan la factura
}
```

### Índices recomendados:
```javascript
// Para búsquedas eficientes
db.salidas.createIndex({ "fechaLlegaFactura": 1 })
db.salidas.createIndex({ "fechaPagoFactura": 1 })
db.salidas.createIndex({ "fechaLlegaFactura": 1, "fechaPagoFactura": 1 })
```

## Beneficios

1. **Seguimiento completo**: Ciclo completo de facturación desde llegada hasta pago
2. **Gestión de flujo de caja**: Mejor planificación de pagos
3. **Análisis de proveedores**: Identificar patrones de pago
4. **Control de vencimientos**: Evitar facturas vencidas
5. **Reportes avanzados**: Análisis de días de pago y eficiencia

## Fecha

2 de Octubre de 2025
