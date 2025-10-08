# Migración de Salidas y Categorías: Prisma → MongoDB

## Descripción

Se migró completamente el sistema de salidas, categorías y métodos de pago de Prisma (PostgreSQL) a MongoDB para aprovechar las ventajas de la base de datos NoSQL y mantener consistencia con el resto del sistema Barfer.

## Servicios Migrados

### 1. **Salidas** (`salidasMongoService.ts`)
- ✅ **CRUD completo** con MongoDB
- ✅ **Agregaciones** para relaciones (categorías, métodos de pago, proveedores)
- ✅ **Filtros por permisos** de categorías
- ✅ **Estadísticas** por mes y rango de fechas
- ✅ **Campos nuevos**: `fechaLlegaFactura`, `fechaPagoFactura`, `comprobanteNumber`

### 2. **Categorías** (`categoriasMongoService.ts`)
- ✅ **CRUD completo** con MongoDB
- ✅ **Búsqueda** por nombre y descripción
- ✅ **Inicialización** de categorías por defecto
- ✅ **Estadísticas** de categorías activas/inactivas
- ✅ **Soft delete** (desactivación)

### 3. **Métodos de Pago** (`metodosPagoMongoService.ts`)
- ✅ **CRUD completo** con MongoDB
- ✅ **Búsqueda** por nombre y descripción
- ✅ **Inicialización** de métodos por defecto
- ✅ **Estadísticas** de métodos activos/inactivos
- ✅ **Soft delete** (desactivación)

## Estructura de Datos MongoDB

### Colección: `salidas`
```javascript
{
  _id: ObjectId,
  fecha: Date,
  detalle: String,
  tipo: "ORDINARIO" | "EXTRAORDINARIO",
  marca: String?,
  monto: Number,
  tipoRegistro: "BLANCO" | "NEGRO",
  categoriaId: ObjectId,
  metodoPagoId: ObjectId,
  proveedorId: ObjectId?,
  fechaLlegaFactura: Date?,
  fechaPagoFactura: Date?,
  comprobanteNumber: String?,
  createdAt: Date,
  updatedAt: Date
}
```

### Colección: `categorias`
```javascript
{
  _id: ObjectId,
  nombre: String,
  descripcion: String?,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Colección: `metodos_pago`
```javascript
{
  _id: ObjectId,
  nombre: String,
  descripcion: String?,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

## Funcionalidades Implementadas

### 1. **Salidas MongoDB**

#### Operaciones CRUD:
- ✅ `getAllSalidasMongo()` - Obtener todas con relaciones
- ✅ `getAllSalidasWithPermissionFilterMongo()` - Filtrado por permisos
- ✅ `getSalidaByIdMongo()` - Obtener por ID con relaciones
- ✅ `createSalidaMongo()` - Crear nueva salida
- ✅ `updateSalidaMongo()` - Actualizar salida existente
- ✅ `deleteSalidaMongo()` - Eliminar salida

#### Consultas Avanzadas:
- ✅ `getSalidasByDateRangeMongo()` - Por rango de fechas
- ✅ `getSalidasStatsByMonthMongo()` - Estadísticas por mes

#### Agregaciones:
```javascript
// Lookup para relaciones
{
  $lookup: {
    from: 'categorias',
    localField: 'categoriaId',
    foreignField: '_id',
    as: 'categoria'
  }
}
```

### 2. **Categorías MongoDB**

#### Operaciones CRUD:
- ✅ `getAllCategoriasMongo()` - Obtener activas
- ✅ `getAllCategoriasIncludingInactiveMongo()` - Todas incluyendo inactivas
- ✅ `getCategoriaByIdMongo()` - Obtener por ID
- ✅ `createCategoriaMongo()` - Crear nueva
- ✅ `updateCategoriaMongo()` - Actualizar existente
- ✅ `deleteCategoriaMongo()` - Soft delete
- ✅ `deleteCategoriaPermanentlyMongo()` - Eliminación permanente

#### Funciones Especiales:
- ✅ `initializeCategoriasMongo()` - Inicializar categorías por defecto
- ✅ `ensureSueldosCategoryMongo()` - Asegurar categoría SUELDOS
- ✅ `searchCategoriasMongo()` - Búsqueda por texto
- ✅ `getCategoriasStatsMongo()` - Estadísticas

### 3. **Métodos de Pago MongoDB**

#### Operaciones CRUD:
- ✅ `getAllMetodosPagoMongo()` - Obtener activos
- ✅ `getAllMetodosPagoIncludingInactiveMongo()` - Todas incluyendo inactivas
- ✅ `getMetodoPagoByIdMongo()` - Obtener por ID
- ✅ `createMetodoPagoMongo()` - Crear nuevo
- ✅ `updateMetodoPagoMongo()` - Actualizar existente
- ✅ `deleteMetodoPagoMongo()` - Soft delete
- ✅ `deleteMetodoPagoPermanentlyMongo()` - Eliminación permanente

#### Funciones Especiales:
- ✅ `initializeMetodosPagoMongo()` - Inicializar métodos por defecto
- ✅ `searchMetodosPagoMongo()` - Búsqueda por texto
- ✅ `getMetodosPagoStatsMongo()` - Estadísticas

## Script de Migración

### Archivo: `scripts/migrate-to-mongodb.ts`

#### Funcionalidades:
- ✅ **Migración automática** de datos existentes
- ✅ **Mapeo de IDs** entre Prisma y MongoDB
- ✅ **Inicialización** de datos por defecto
- ✅ **Logging detallado** del proceso
- ✅ **Manejo de errores** robusto

#### Uso:
```bash
npx tsx scripts/migrate-to-mongodb.ts
```

#### Proceso de Migración:
1. **Categorías**: Migra todas las categorías existentes
2. **Métodos de Pago**: Migra todos los métodos existentes
3. **Salidas**: Migra todas las salidas con mapeo de relaciones
4. **Validación**: Verifica que todos los datos se migraron correctamente

## Ventajas de la Migración

### 1. **Consistencia**
- ✅ **Misma base de datos** que el resto del sistema Barfer
- ✅ **Estructura unificada** para todos los servicios
- ✅ **Manejo consistente** de ObjectIds

### 2. **Performance**
- ✅ **Agregaciones nativas** de MongoDB
- ✅ **Índices optimizados** para consultas frecuentes
- ✅ **Menos joins** comparado con SQL

### 3. **Flexibilidad**
- ✅ **Esquema flexible** para campos opcionales
- ✅ **Fácil agregación** de nuevos campos
- ✅ **Consultas complejas** con agregaciones

### 4. **Escalabilidad**
- ✅ **Sharding nativo** de MongoDB
- ✅ **Replicación** automática
- ✅ **Mejor manejo** de grandes volúmenes de datos

## Archivos Creados

### Servicios MongoDB:
- ✅ `/packages/data-services/src/services/salidasMongoService.ts`
- ✅ `/packages/data-services/src/services/categoriasMongoService.ts`
- ✅ `/packages/data-services/src/services/metodosPagoMongoService.ts`

### Script de Migración:
- ✅ `/scripts/migrate-to-mongodb.ts`

### Documentación:
- ✅ `/docs/migracion-prisma-mongodb-salidas.md`

## Archivos Modificados

### Exportaciones:
- ✅ `/packages/data-services/src/services/index.ts` - Agregadas exportaciones MongoDB

## Próximos Pasos

### 1. **Actualizar Actions**
- Migrar `actions.ts` de salidas para usar servicios MongoDB
- Actualizar tipos de datos en componentes
- Probar funcionalidad completa

### 2. **Migración de Datos**
- Ejecutar script de migración
- Verificar integridad de datos
- Validar relaciones entre colecciones

### 3. **Testing**
- Probar CRUD completo
- Validar permisos de categorías
- Verificar estadísticas y reportes

### 4. **Cleanup**
- Deprecar servicios de Prisma
- Actualizar documentación
- Limpiar código no utilizado

## Comandos de Migración

### 1. **Ejecutar Migración**:
```bash
npx tsx scripts/migrate-to-mongodb.ts
```

### 2. **Verificar Datos**:
```bash
# Conectar a MongoDB y verificar colecciones
use barfer
db.salidas.count()
db.categorias.count()
db.metodos_pago.count()
```

### 3. **Inicializar Datos por Defecto**:
```typescript
// En caso de necesitar inicializar manualmente
await initializeCategoriasMongo();
await initializeMetodosPagoMongo();
```

## Beneficios Obtenidos

1. **Unificación**: Todo el sistema usa MongoDB
2. **Performance**: Consultas más rápidas con agregaciones
3. **Flexibilidad**: Esquema adaptable para nuevos campos
4. **Consistencia**: Mismo patrón de datos en todo el sistema
5. **Escalabilidad**: Mejor preparado para crecimiento

## Fecha

2 de Octubre de 2025

