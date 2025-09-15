# Migración de Precios: Prisma → MongoDB

## 🎯 Objetivo

Migrar el sistema de precios de Prisma/PostgreSQL a MongoDB para implementar un **historial completo de precios** que permita:

- ✅ Ver precios por mes/año específico ("¿cuánto costaba en mayo?")
- ✅ Análisis de evolución de precios
- ✅ Comparaciones entre períodos
- ✅ Identificar productos con mayor variabilidad
- ✅ Mantener historial completo sin perder datos

## 📋 Cambios Implementados

### 1. Nuevos Tipos MongoDB (`packages/data-services/src/types/barfer.ts`)

```typescript
export interface Price {
    _id: string;
    section: PriceSection;
    product: string;
    weight?: string;
    priceType: PriceType;
    price: number;
    isActive: boolean;
    // 🆕 Campos de historial
    effectiveDate: string; // YYYY-MM-DD
    month: number;         // 1-12 para consultas rápidas
    year: number;          // Para consultas rápidas
    createdAt: string;
    updatedAt: string;
}
```

### 2. Nuevo Servicio de Precios (`packages/data-services/src/services/barfer/pricesService.ts`)

**Funciones principales:**
- `getAllPrices()` - Obtener todos los precios activos
- `getPrices(query)` - Filtrar precios con criterios específicos
- `createPrice(data)` - Crear nuevo precio con fecha efectiva
- `updatePrice(id, data)` - Actualizar precio (crea nueva entrada para historial)
- `getCurrentPrices()` - Obtener precios más recientes por producto
- `getPriceHistory(...)` - Historial completo de un producto
- `getPriceStats()` - Estadísticas generales

### 3. Servicio de Análisis Histórico (`packages/data-services/src/services/barfer/priceHistoryService.ts`)

**Funciones de análisis:**
- `getPricesByMonth(month, year)` - Precios de un mes específico
- `getPriceEvolution(...)` - Evolución temporal de un producto
- `comparePricesPeriods(period1, period2)` - Comparar dos períodos
- `getMostVolatilePrices()` - Productos con mayor variabilidad
- `getPriceChangesSummary(year)` - Resumen de cambios por mes

### 4. Script de Migración (`scripts/migrate-prices-to-mongo.ts`)

Script automatizado para migrar datos existentes de Prisma a MongoDB.

## 🚀 Pasos de Migración

### Paso 1: Ejecutar la Migración

```bash
# Migrar datos de Prisma a MongoDB
npx tsx scripts/migrate-prices-to-mongo.ts

# Verificar la migración
npx tsx scripts/migrate-prices-to-mongo.ts verify
```

### Paso 2: Actualizar Referencias en el Código

Buscar y reemplazar las importaciones:

```typescript
// ❌ Antes (Prisma)
import { database } from '@repo/database';
const prices = await database.price.findMany();

// ✅ Después (MongoDB)
import { getAllPrices } from '@repo/data-services/services/barfer/pricesService';
const { prices } = await getAllPrices();
```

### Paso 3: Actualizar Componentes/Páginas

```typescript
// ❌ Antes
import { PriceSection, PriceType } from '@repo/database';

// ✅ Después
import type { PriceSection, PriceType, Price } from '@repo/data-services/types/barfer';
```

### Paso 4: Probar Funcionalidades

1. **Crear precios nuevos**
2. **Actualizar precios existentes** (debería crear nueva entrada)
3. **Consultar historial** por mes/año
4. **Verificar que las páginas cargan correctamente**

### Paso 5: Limpiar Código Prisma (Opcional)

Una vez verificado que todo funciona:

```typescript
// Remover de schema.prisma
model Price { ... } // ← Eliminar este modelo

// Actualizar servicios que usen database.price
// Remover imports innecesarios de @repo/database
```

## 📊 Ejemplos de Uso

### Consultar Precios de Mayo 2024

```typescript
import { getPricesByMonth } from '@repo/data-services/services/barfer/priceHistoryService';

const { prices } = await getPricesByMonth(5, 2024);
console.log('Precios de Mayo 2024:', prices);
```

### Ver Evolución de un Producto

```typescript
import { getPriceEvolution } from '@repo/data-services/services/barfer/priceHistoryService';

const { evolution } = await getPriceEvolution(
    'PERRO', 
    'POLLO', 
    '5KG', 
    'EFECTIVO'
);
```

### Comparar Dos Meses

```typescript
import { comparePricesPeriods } from '@repo/data-services/services/barfer/priceHistoryService';

const { comparison } = await comparePricesPeriods(
    { month: 4, year: 2024 }, // Abril 2024
    { month: 5, year: 2024 }  // Mayo 2024
);
```

### Crear Precio con Fecha Específica

```typescript
import { createPrice } from '@repo/data-services/services/barfer/pricesService';

await createPrice({
    section: 'PERRO',
    product: 'POLLO',
    weight: '5KG',
    priceType: 'EFECTIVO',
    price: 15000,
    effectiveDate: '2024-06-01' // Efectivo desde el 1 de junio
});
```

## 🔍 Verificación Post-Migración

### Checklist de Verificación

- [ ] ✅ Los precios se muestran correctamente en la interfaz
- [ ] ✅ Se pueden crear nuevos precios
- [ ] ✅ Se pueden actualizar precios (y se crea historial)
- [ ] ✅ Las consultas por fecha funcionan
- [ ] ✅ Los filtros por sección/tipo funcionan
- [ ] ✅ No hay errores en consola
- [ ] ✅ Las páginas cargan en tiempo razonable

### Consultas de Verificación MongoDB

```javascript
// Contar total de precios
db.prices.countDocuments()

// Ver precios por sección
db.prices.aggregate([
  { $group: { _id: "$section", count: { $sum: 1 } } }
])

// Ver precios de un mes específico
db.prices.find({ month: 5, year: 2024 })

// Verificar índices (recomendado para performance)
db.prices.createIndex({ section: 1, product: 1, priceType: 1 })
db.prices.createIndex({ month: 1, year: 1 })
db.prices.createIndex({ effectiveDate: -1 })
```

## 📈 Ventajas del Nuevo Sistema

### ✅ Historial Completo
- Cada cambio de precio se guarda como un documento separado
- Nunca se pierde información histórica
- Fácil consulta por fechas

### ✅ Consultas Optimizadas
- Campos `month` y `year` para consultas rápidas
- Índices MongoDB para performance
- Agregaciones eficientes

### ✅ Flexibilidad
- Precios con fecha efectiva futura
- Análisis comparativos entre períodos
- Identificación de tendencias

### ✅ Escalabilidad
- MongoDB maneja grandes volúmenes de datos históricos
- Consultas paralelas
- Agregaciones complejas eficientes

## 🚨 Consideraciones Importantes

### Cambio de Comportamiento

**Antes (Prisma):** Actualizar precio modificaba el registro existente
```typescript
// Se perdía el valor anterior
await database.price.update({ where: { id }, data: { price: newPrice } })
```

**Ahora (MongoDB):** Actualizar precio crea nueva entrada y desactiva la anterior
```typescript
// Se mantiene historial completo
await updatePrice(id, { price: newPrice, effectiveDate: '2024-06-01' })
```

### Migración de Código Existente

Buscar en el código referencias a:
- `database.price.*`
- `PriceSection`, `PriceType` importados de `@repo/database`
- Lógica que asuma que solo hay un precio por producto

### Performance

- Las consultas históricas pueden ser más lentas con muchos datos
- Recomendado crear índices apropiados
- Considerar límites en consultas de historial

## 🎉 ¡Listo!

Con estos cambios tendrás un sistema completo de historial de precios que te permitirá:

- 📊 **Análisis temporal:** "¿Cómo evolucionaron los precios este año?"
- 📈 **Comparaciones:** "¿Cuánto subieron los precios desde enero?"
- 🔍 **Auditoría:** "¿Cuándo cambió el precio de este producto?"
- 📱 **Reportes:** Generar reportes de evolución de precios

¡El sistema está diseñado para crecer con tu negocio y proporcionarte insights valiosos sobre la evolución de tus precios! 🚀
