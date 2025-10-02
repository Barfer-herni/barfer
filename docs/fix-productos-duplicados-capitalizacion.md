# Fix: Productos Duplicados por Diferente Capitalización

## Descripción del Problema

Los productos RAW aparecían duplicados en el selector de creación de órdenes porque:

1. **Diferentes capitalizaciones:** Los productos se guardaban con variaciones como:
   - "Orejas x100" (primera letra mayúscula)
   - "OREJAS X100" (todo mayúsculas)
   - "orejas x100" (todo minúsculas)

2. **Precios de múltiples meses:** Se estaban tomando precios de varios meses en lugar de solo el mes vigente

3. **Fechas efectivas futuras:** Algunos precios tenían fecha efectiva futura pero se mostraban como vigentes

## Soluciones Aplicadas

### 1. Normalización en Query de Productos (`getProductsForSelect`)

**Archivo:** `/packages/data-services/src/services/barfer/pricesService.ts` (línea ~467-532)

Se agregó normalización a mayúsculas en el pipeline de MongoDB:

```typescript
{
    // Normalizar a mayúsculas para agrupar correctamente
    $addFields: {
        sectionUpper: { $toUpper: "$section" },
        productUpper: { $toUpper: "$product" },
        weightUpper: { 
            $cond: [
                { $eq: ["$weight", null] },
                null,
                { $toUpper: "$weight" }
            ]
        }
    }
},
{
    $group: {
        _id: {
            section: "$sectionUpper",
            product: "$productUpper",
            weight: "$weightUpper"
        },
        latestPrice: { $first: "$$ROOT" }
    }
}
```

**Qué hace:**
- Convierte `section`, `product` y `weight` a mayúsculas antes de agrupar
- Agrupa productos que son iguales pero con diferente capitalización
- Solo muestra uno por grupo (el más reciente)

### 2. Filtro por Fecha Efectiva

Se agregó filtro para solo tomar precios vigentes:

```typescript
$match: { 
    isActive: true,
    effectiveDate: { $lte: todayStr }  // Solo precios vigentes a hoy
}
```

**Qué hace:**
- Solo toma precios cuya fecha efectiva sea menor o igual a hoy
- Evita que aparezcan precios futuros que aún no están vigentes
- Mantiene un solo precio por mes

### 3. Script de Normalización

**Archivo:** `/packages/data-services/src/services/barfer/normalizePricesCapitalization.ts`

Se crearon dos funciones:

#### `normalizePricesCapitalization()`
Normaliza todos los precios existentes a mayúsculas:
- Convierte `section`, `product` y `weight` a mayúsculas
- Actualiza los registros en la base de datos
- Retorna cantidad de precios actualizados

#### `removeDuplicatePrices()`
Elimina precios duplicados:
1. Primero normaliza la capitalización
2. Busca duplicados (misma section, product, weight, priceType)
3. Mantiene el más reciente (por effectiveDate)
4. Desactiva (`isActive: false`) los duplicados antiguos

### 4. Script Ejecutable

**Archivo:** `/scripts/normalize-prices.ts`

Script para ejecutar desde terminal:

```bash
pnpm tsx scripts/normalize-prices.ts
```

**Qué hace:**
1. Normaliza todos los precios a mayúsculas
2. Elimina duplicados dejando solo el más reciente
3. Muestra un resumen de los cambios

## Cómo Usar el Script de Limpieza

### Opción 1: Desde Terminal (Recomendado)

```bash
cd /Users/nicolas/Desktop/barfer
pnpm tsx scripts/normalize-prices.ts
```

### Opción 2: Desde el código

Puedes llamar las funciones directamente:

```typescript
import { normalizePricesCapitalization, removeDuplicatePrices } from '@repo/data-services';

// Normalizar capitalización
const result1 = await normalizePricesCapitalization();
console.log(result1.message);

// Eliminar duplicados
const result2 = await removeDuplicatePrices();
console.log(result2.message);
```

### Opción 3: Desde acciones del Admin

Se crearon dos acciones en `/apps/app/app/[locale]/(authenticated)/admin/prices/actions.ts`:
- `normalizePricesCapitalizationAction()`
- `removeDuplicatePricesAction()`

Puedes llamarlas desde un botón en la UI si lo deseas.

## Resultado Esperado

### Antes:
```
Dropdown de productos:
- RAW - Orejas x100
- RAW - OREJAS X100
- RAW - orejas x100
- RAW - Pollo 100grs
- RAW - POLLO 100GRS
```

### Después:
```
Dropdown de productos:
- RAW - OREJAS X100
- RAW - POLLO 100GRS
```

## Cambios en Archivos

### Modificados:
1. `/packages/data-services/src/services/barfer/pricesService.ts`
   - Función `getProductsForSelect` (línea ~467-550)

2. `/packages/data-services/src/services/barfer/index.ts`
   - Exports nuevos (línea ~62)

3. `/apps/app/app/[locale]/(authenticated)/admin/prices/actions.ts`
   - Nuevas acciones (línea ~490-550)

### Creados:
1. `/packages/data-services/src/services/barfer/normalizePricesCapitalization.ts`
2. `/scripts/normalize-prices.ts`

## Prevención a Futuro

Para evitar que vuelva a pasar:

1. **Al inicializar precios:** Los arrays en `initializePricesForPeriod` y `initializeBarferPrices` ya tienen todo en mayúsculas

2. **Al crear precios manualmente:** Siempre usar mayúsculas:
   ```typescript
   {
       section: 'RAW',
       product: 'OREJAS X100',  // ✅ Todo mayúsculas
       weight: undefined
   }
   ```

3. **Validación:** El query de `getProductsForSelect` ahora normaliza automáticamente, así que aunque haya variaciones, se agruparán correctamente

## Troubleshooting

### Si siguen apareciendo duplicados:

1. **Ejecuta el script de limpieza:**
   ```bash
   pnpm tsx scripts/normalize-prices.ts
   ```

2. **Verifica la fecha efectiva:**
   Los precios con fecha futura no deberían aparecer. Si aparecen, revisa que la fecha esté en formato correcto: `"YYYY-MM-DD"`

3. **Revisa los precios manualmente:**
   Busca en MongoDB precios duplicados:
   ```javascript
   db.prices.find({ 
       section: "RAW", 
       product: /orejas/i,  // case insensitive
       isActive: true 
   })
   ```

4. **Desactiva precios antiguos:**
   Si hay precios de meses anteriores que ya no necesitas:
   ```javascript
   db.prices.updateMany(
       { 
           effectiveDate: { $lt: "2025-10-01" },
           isActive: true
       },
       { 
           $set: { isActive: false }
       }
   )
   ```

## Fecha

2 de Octubre de 2025

