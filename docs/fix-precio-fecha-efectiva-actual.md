# Fix: Precios tomando fecha efectiva incorrecta

## Descripción del Problema

Cuando se calculaban precios automáticamente al crear órdenes en octubre, el sistema estaba tomando los precios de septiembre en lugar de los precios del mes actual.

El problema ocurría porque el sistema buscaba el precio más reciente por fecha efectiva (`effectiveDate`) sin validar que dicha fecha fuera menor o igual a la fecha actual.

## Causa Raíz

En los servicios de cálculo de precios, las queries a la base de datos estaban:

1. Filtrando por `isActive: true` ✅
2. Ordenando por `effectiveDate: -1` (más reciente primero) ✅
3. **NO filtrando** por `effectiveDate <= fecha_actual` ❌

### Ejemplo del problema

Si en la base de datos existían estos precios:

```
Producto: BOX PERRO POLLO - 10KG
Precio 1: $5000, effectiveDate: "2024-09-01"
Precio 2: $5500, effectiveDate: "2024-10-15"
```

Y hoy es **2 de octubre de 2024**, el sistema tomaba el Precio 2 ($5500) porque tenía la `effectiveDate` más reciente, aunque esa fecha aún no había llegado.

Lo correcto sería tomar el Precio 1 ($5000) porque es el precio vigente al día de hoy.

## Solución

Se agregó un filtro de fecha efectiva en todas las queries que buscan precios activos para asegurar que solo se tomen precios cuya `effectiveDate` sea menor o igual a la fecha actual:

```typescript
effectiveDate: { $lte: new Date().toISOString().split('T')[0] }
```

Este filtro:
- Obtiene la fecha actual en formato ISO: `"2024-10-02"`
- Usa el operador `$lte` (less than or equal) de MongoDB
- Solo trae precios donde `effectiveDate <= "2024-10-02"`

## Archivos Modificados

### 1. `/packages/data-services/src/services/barfer/exactPricesCalculationService.ts`

**Función:** `getExactProductPrice`

Se agregó el filtro de fecha efectiva en dos lugares:

a) **Query exacto** (línea ~50-57):
```typescript
const query: any = {
    section: section.toUpperCase(),
    product: { $regex: `^${product.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
    priceType,
    isActive: true,
    // Solo tomar precios cuya fecha efectiva sea menor o igual a hoy
    effectiveDate: { $lte: new Date().toISOString().split('T')[0] }
};
```

b) **Query flexible** (línea ~114-121):
```typescript
const flexibleQuery = {
    section: section.toUpperCase(),
    product: { $regex: `^${product.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
    priceType,
    isActive: true,
    // Solo tomar precios cuya fecha efectiva sea menor o igual a hoy
    effectiveDate: { $lte: new Date().toISOString().split('T')[0] }
};
```

### 2. `/packages/data-services/src/services/barfer/pricesCalculationService.ts`

**Función:** `getProductPrice`

Se agregó el filtro de fecha efectiva en dos queries:

a) **Query inicial de búsqueda de producto** (línea ~163-169):
```typescript
const productQuery: any = {
    product: { $regex: `^${searchProduct.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
    priceType,
    isActive: true,
    // Solo tomar precios cuya fecha efectiva sea menor o igual a hoy
    effectiveDate: { $lte: new Date().toISOString().split('T')[0] }
};
```

b) **Query final con sección real** (línea ~237-244):
```typescript
const query: any = {
    section: realSection,
    product: { $regex: `^${searchProduct.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
    priceType,
    isActive: true,
    // Solo tomar precios cuya fecha efectiva sea menor o igual a hoy
    effectiveDate: { $lte: new Date().toISOString().split('T')[0] }
};
```

### 3. `/packages/data-services/src/services/barfer/pricesService.ts`

**Función:** `getCurrentPrices`

Se agregó el filtro de fecha efectiva en el pipeline de agregación (línea ~793-797):
```typescript
const pipeline = [
    {
        $match: { 
            isActive: true,
            // Solo tomar precios cuya fecha efectiva sea menor o igual a hoy
            effectiveDate: { $lte: new Date().toISOString().split('T')[0] }
        }
    },
    {
        $sort: { effectiveDate: -1, createdAt: -1 }
    },
    // ...
];
```

## Flujo Corregido

### Antes del fix:

1. Usuario crea una orden en octubre 2
2. Sistema busca precios para los productos
3. Query: `{ product: "BOX PERRO POLLO", weight: "10KG", priceType: "EFECTIVO", isActive: true }`
4. Ordena por `effectiveDate: -1` (más reciente primero)
5. Toma el precio con `effectiveDate: "2024-10-15"` ❌ (no está vigente aún)
6. Precio incorrecto mostrado al usuario

### Después del fix:

1. Usuario crea una orden en octubre 2
2. Sistema busca precios para los productos
3. Query: `{ product: "BOX PERRO POLLO", weight: "10KG", priceType: "EFECTIVO", isActive: true, effectiveDate: { $lte: "2024-10-02" } }`
4. Ordena por `effectiveDate: -1` (más reciente primero)
5. Toma el precio con `effectiveDate: "2024-09-01"` ✅ (vigente)
6. Precio correcto mostrado al usuario

## Testing

Para verificar que el fix funciona correctamente:

### Escenario 1: Precio actual vigente

1. Asegúrate de tener un precio con `effectiveDate` del mes actual o anterior
2. Crea una nueva orden
3. Agrega productos
4. Calcula el precio automáticamente
5. Verifica que tome el precio correcto del mes actual o el más reciente anterior

### Escenario 2: Precio futuro no vigente

1. Crea un precio con `effectiveDate` del próximo mes (ej: si estamos en octubre 2, crea uno con fecha 2024-11-01)
2. Asegúrate de que haya otro precio anterior (ej: 2024-09-01)
3. Crea una nueva orden
4. Agrega productos
5. Calcula el precio automáticamente
6. Verifica que tome el precio de septiembre (2024-09-01) y NO el de noviembre (2024-11-01)

### Escenario 3: Cambio de mes

1. Cuando cambie el mes (ej: de octubre a noviembre)
2. El sistema automáticamente debe empezar a tomar los precios con `effectiveDate` de noviembre
3. Sin necesidad de modificar nada manualmente

## Impacto

Este fix afecta a:

- ✅ Cálculo automático de precios al crear órdenes
- ✅ Cálculo de precios al editar órdenes
- ✅ Visualización de precios actuales en el gestor de precios
- ✅ PDF de órdenes mayoristas

## Beneficios

1. **Precios correctos**: Los usuarios siempre verán los precios vigentes a la fecha actual
2. **Precios futuros**: Permite cargar precios con fecha efectiva futura sin afectar los cálculos actuales
3. **Transiciones suaves**: Al cambiar de mes, el sistema automáticamente empieza a usar los nuevos precios
4. **Consistencia**: Todos los servicios de cálculo de precios usan la misma lógica

## Casos de Uso

### Caso 1: Planificación de precios

Un administrador puede cargar los precios de noviembre el 25 de octubre con `effectiveDate: "2024-11-01"`. 

- Del 25 al 31 de octubre: El sistema sigue usando los precios de octubre
- A partir del 1 de noviembre: El sistema automáticamente cambia a los precios de noviembre

### Caso 2: Múltiples cambios de precio

Si hay múltiples cambios de precio en un mes:

```
Precio 1: $5000, effectiveDate: "2024-10-01"
Precio 2: $5200, effectiveDate: "2024-10-15"
Precio 3: $5500, effectiveDate: "2024-11-01"
```

- Del 1 al 14 de octubre: usa $5000
- Del 15 al 31 de octubre: usa $5200
- A partir del 1 de noviembre: usa $5500

## Notas Técnicas

- El formato de fecha usado es ISO 8601: `"YYYY-MM-DD"`
- La comparación es a nivel de día (no incluye hora)
- Se usa `new Date().toISOString().split('T')[0]` para obtener solo la parte de fecha
- El operador `$lte` de MongoDB realiza la comparación de strings correctamente debido al formato ISO

## Fecha

2 de Octubre de 2025
