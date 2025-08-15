# Optimización de Análisis Mensuales - Solución de Error de Memoria MongoDB

## 🚨 Problema Original

El error que se presentaba en las estadísticas mensuales era:

```
Error fetching delivery type stats by month: Error: PlanExecutor error during aggregation :: caused by :: Sort exceeded memory limit of 33554432 bytes, but did not opt in to external sorting.
```

Este error ocurría porque la agregación de MongoDB excedía el límite de memoria de 33MB para operaciones de sorting.

## ✅ Soluciones Implementadas

### 1. Optimización del Pipeline de Agregación

**Archivo:** `packages/data-services/src/services/barfer/analytics/getDeliveryTypeStatsByMonth.ts`

#### Cambios principales:

1. **Filtrado temprano de documentos**: Se aplican los filtros de fecha al inicio del pipeline para reducir drasticamente el número de documentos a procesar.

2. **Eliminación de pasos intermedios**: Se simplificó el pipeline eliminando el doble agrupamiento que causaba duplicados innecesarios.

3. **Uso de `allowDiskUse: true`**: Se habilitó el uso de disco para operaciones de sorting que excedan el límite de memoria RAM.

4. **Optimización de proyecciones**: Se filtraron datos nulos antes del sorting para reducir el volumen de datos.

#### Antes vs Después:

**❌ Pipeline Original (problemático):**
```typescript
// Convertir dates -> Filtrar -> AddFields -> Doble agrupamiento -> Sort
pipeline.push(
    { $addFields: { createdAt: ... } },    // Convertir todas las fechas
    { $match: dateCondition },             // Filtrar después de convertir
    { $addFields: { classifications } },    // Agregar campos 
    { $group: { _id: orderId ... } },      // Primer agrupamiento
    { $group: { _id: month ... } },        // Segundo agrupamiento 
    { $sort: { "_id.year": 1, "_id.month": 1 } }  // Sort sin allowDiskUse
);
```

**✅ Pipeline Optimizado:**
```typescript
// Filtrar PRIMERO -> Convertir -> Agrupar UNA VEZ -> Sort con allowDiskUse
pipeline.push(
    { $match: { $expr: { $and: [dateConditions] } } }, // Filtrar PRIMERO
    { $addFields: { createdAt: ..., classifications } }, // Todo junto
    { $group: { _id: { year, month }, ... } },           // Agrupamiento directo
    { $project: { filterNulls } },                       // Limpiar datos
    { $sort: { "_id.year": 1, "_id.month": 1 } }         // Sort optimizado
);

// CON allowDiskUse
collection.aggregate(pipeline, { allowDiskUse: true })
```

### 2. Eliminación de Código de Debug

Se removieron las funciones de debug que también consumían recursos:
- `debugWholesaleOrders()`
- `testWholesaleIssue()`

**Archivo:** `apps/app/app/[locale]/(authenticated)/admin/analytics/components/monthly/MonthlyAnalyticsTab.tsx`

### 3. Creación de Índices Optimizados

**Archivos creados:**
- `scripts/optimize-analytics-indexes.ts`
- `scripts/run-analytics-optimization.ts`

#### Índices creados:

1. **`analytics_monthly_compound`**: Para consultas mensuales
   ```javascript
   { createdAt: 1, orderType: 1, status: 1 }
   ```

2. **`analytics_delivery_type`**: Para análisis de tipos de entrega
   ```javascript
   { 'deliveryArea.sameDayDelivery': 1, orderType: 1, createdAt: 1 }
   ```

3. **`analytics_items_delivery`**: Para análisis de items
   ```javascript
   { 'items.sameDayDelivery': 1, createdAt: 1, orderType: 1 }
   ```

4. **`analytics_date_sort`**: Para ordenamiento por fecha
   ```javascript
   { createdAt: -1 }
   ```

## 🚀 Cómo Aplicar las Optimizaciones

### Paso 1: Los cambios de código ya están aplicados

Los archivos modificados ya contienen las optimizaciones.

### Paso 2: Crear los índices optimizados

```bash
# Crear índices para optimizar consultas
pnpm analytics:optimize

# Si necesitas eliminar los índices
pnpm analytics:drop-indexes
```

### Paso 3: Verificar el funcionamiento

1. Ve a las estadísticas en **Admin → Analytics → Por Mes**
2. Verifica que las consultas se ejecuten sin errores
3. Observa que la velocidad de carga sea notablemente mejor

## 📊 Mejoras de Rendimiento Esperadas

### Antes de la optimización:
- ❌ Error de memoria al procesar grandes volúmenes de datos
- ❌ Timeouts en consultas complejas
- ❌ Alto consumo de recursos del servidor

### Después de la optimización:
- ✅ Sin errores de memoria gracias a `allowDiskUse`
- ✅ Consultas 3-5x más rápidas gracias a los índices
- ✅ Menos carga en el servidor MongoDB
- ✅ Pipeline más eficiente con menos pasos

## 🔧 Detalles Técnicos

### ¿Por qué funcionan estas optimizaciones?

1. **Filtrado temprano**: Reduce el conjunto de datos desde el inicio
2. **allowDiskUse**: Permite usar disco cuando la memoria RAM no es suficiente
3. **Índices compuestos**: MongoDB puede usar índices para acelerar filtros y sorts
4. **Pipeline simplificado**: Menos pasos = menos overhead

### Monitoreo

Para monitorear el rendimiento de las consultas:

```javascript
// En MongoDB, puedes usar explain() para ver el plan de ejecución
db.orders.aggregate(pipeline).explain("executionStats")
```

## 🎯 Archivos Modificados

1. **`packages/data-services/src/services/barfer/analytics/getDeliveryTypeStatsByMonth.ts`**
   - Optimización completa del pipeline de agregación
   - Eliminación de código de debug

2. **`apps/app/app/[locale]/(authenticated)/admin/analytics/components/monthly/MonthlyAnalyticsTab.tsx`**
   - Eliminación de llamadas a funciones de debug

3. **`scripts/optimize-analytics-indexes.ts`** (nuevo)
   - Script para crear/eliminar índices optimizados

4. **`scripts/run-analytics-optimization.ts`** (nuevo)
   - Ejecutor del script de optimización

5. **`package.json`**
   - Agregados scripts para ejecutar optimizaciones

## 📝 Notas Importantes

- Los índices consumen espacio en disco adicional
- Es recomendable ejecutar la creación de índices durante horarios de bajo tráfico
- Los índices se crean con `background: true` para no bloquear la base de datos
- Esta optimización es especialmente importante para bases de datos con gran cantidad de órdenes

## 🔮 Optimizaciones Futuras

Si en el futuro se presentan problemas similares:

1. **Paginación**: Implementar paginación en consultas muy grandes
2. **Cache**: Agregar cache Redis para resultados de análisis frecuentes
3. **Agregaciones pre-calculadas**: Crear vistas materializadas para datos históricos
4. **Sharding**: Considerar particionamiento horizontal si el volumen crece significativamente
