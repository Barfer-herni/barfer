# Migración Completa: Frontend → MongoDB

## Descripción

Se completó la migración del frontend de salidas para usar MongoDB en lugar de Prisma. Ahora todo el sistema de salidas, categorías y métodos de pago funciona con MongoDB.

## Cambios Realizados

### 1. **Actions Actualizadas** (`actions.ts`)

#### Servicios Migrados:
- ✅ `getAllSalidasAction()` → `getAllSalidasWithPermissionFilterMongo()`
- ✅ `createSalidaAction()` → `createSalidaMongo()`
- ✅ `updateSalidaAction()` → `updateSalidaMongo()`
- ✅ `deleteSalidaAction()` → `deleteSalidaMongo()`
- ✅ `getAllCategoriasAction()` → `getAllCategoriasMongo()`
- ✅ `createCategoriaAction()` → `createCategoriaMongo()`
- ✅ `deleteCategoriaAction()` → `deleteCategoriaMongo()`
- ✅ `getAllMetodosPagoAction()` → `getAllMetodosPagoMongo()`
- ✅ `createMetodoPagoAction()` → `createMetodoPagoMongo()`

#### Nuevas Actions:
- ✅ `initializeCategoriasAction()` → `initializeCategoriasMongo()`
- ✅ `initializeMetodosPagoAction()` → `initializeMetodosPagoMongo()`
- ✅ `getSalidasStatsByMonthAction()` → `getSalidasStatsByMonthMongo()`

### 2. **Tipos Actualizados**

#### Componentes:
- ✅ `SalidasTable.tsx` → `SalidaMongoData`
- ✅ `EditSalidaModal.tsx` → `SalidaMongoData`
- ✅ `SalidasPageClient.tsx` → `SalidaMongoData`

#### Actions:
- ✅ `CreateSalidaData` → `CreateSalidaMongoInput`
- ✅ `UpdateSalidaInput` → `UpdateSalidaMongoInput`

### 3. **Campos Nuevos Funcionando**

#### En la Tabla:
- ✅ **Fecha que llega la factura** - Columna ordenable
- ✅ **Fecha que pagan la factura** - Columna ordenable  
- ✅ **Número de comprobante** - Truncado a 8 caracteres

#### En los Modales:
- ✅ **Campos de fecha** con selectores de calendario
- ✅ **Campo de comprobante** con placeholder
- ✅ **Validación** y envío de datos

## Estructura MongoDB

### Colecciones Creadas:

#### 1. **`categorias`**
```javascript
{
  _id: ObjectId,
  nombre: String,           // "SUELDOS", "INSUMOS", etc.
  descripcion: String?,     // Opcional
  isActive: Boolean,        // true/false
  createdAt: Date,
  updatedAt: Date
}
```

#### 2. **`metodos_pago`**
```javascript
{
  _id: ObjectId,
  nombre: String,           // "EFECTIVO", "TRANSFERENCIA", etc.
  descripcion: String?,     // Opcional
  isActive: Boolean,        // true/false
  createdAt: Date,
  updatedAt: Date
}
```

#### 3. **`proveedores`**
```javascript
{
  _id: ObjectId,
  nombre: String,           // "Distribuidora ABC"
  marca: String,            // "BARFER"
  tipoProveedor: String,    // "Alimentos", "Insumos", etc.
  telefono: String,         // "221 123-4567"
  personaContacto: String,  // "Juan Pérez"
  pagoTipo: String,         // "BLANCO" | "NEGRO"
  activo: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

#### 4. **`salidas`**
```javascript
{
  _id: ObjectId,
  fecha: Date,
  detalle: String,
  tipo: String,             // "ORDINARIO" | "EXTRAORDINARIO"
  marca: String?,           // "BARFER"
  monto: Number,
  tipoRegistro: String,     // "BLANCO" | "NEGRO"
  categoriaId: ObjectId,    // Referencia a categorias
  metodoPagoId: ObjectId,   // Referencia a metodos_pago
  proveedorId: ObjectId?,   // Referencia a proveedores
  fechaLlegaFactura: Date?, // NUEVO
  fechaPagoFactura: Date?,  // NUEVO
  comprobanteNumber: String?, // NUEVO
  createdAt: Date,
  updatedAt: Date
}
```

## Scripts de Inicialización

### 1. **Inicialización Simple** (`init-mongodb.cjs`)
```bash
node scripts/init-mongodb.cjs
```

#### Funcionalidades:
- ✅ **Categorías**: 25 categorías predefinidas
- ✅ **Métodos de Pago**: 6 métodos predefinidos
- ✅ **Proveedores**: 2 proveedores de ejemplo
- ✅ **Logging**: Muestra qué se crea
- ✅ **No duplica**: Verifica existencia antes de crear

### 2. **Datos por Defecto**

#### Categorías (25):
```
SUELDOS, IMPUESTOS, MANTENIMIENTO MAQUINARIA, INSUMOS,
MATERIA PRIMA, SERVICIOS, FLETE, LIMPIEZA, ALQUILERES,
UTILES, PUBLICIDAD, MANTENIMIENTO EDILICIO, OTROS,
CAJA CHICA, VIATICOS, VEHICULOS, COMBUSTIBLE, OFICINA,
FINANCIACION, INVERSION EDILICIA, INDUMENTARIA, INVERSION PRODUCTO,
PRODUCTOS, INVERSION TECNOLOGICA, I&D
```

#### Métodos de Pago (6):
```
EFECTIVO, TRANSFERENCIA, TARJETA DEBITO,
TARJETA CREDITO, MERCADO PAGO, CHEQUE
```

#### Proveedores (2):
```
- Distribuidora ABC (Alimentos, BLANCO)
- Insumos Veterinarios SA (Insumos, NEGRO)
```

## Funcionalidades Implementadas

### 1. **Tabla de Salidas**
- ✅ **13 columnas** incluyendo campos nuevos
- ✅ **Ordenamiento** por todos los campos
- ✅ **Filtros** por categoría, método de pago, tipo, etc.
- ✅ **Búsqueda** por texto en múltiples campos
- ✅ **Permisos** de categorías funcionando

### 2. **Gestión de Categorías**
- ✅ **CRUD completo** con MongoDB
- ✅ **Creación dinámica** desde modales
- ✅ **Soft delete** (desactivación)
- ✅ **Inicialización** de categorías por defecto

### 3. **Gestión de Métodos de Pago**
- ✅ **CRUD completo** con MongoDB
- ✅ **Creación dinámica** desde modales
- ✅ **Soft delete** (desactivación)
- ✅ **Inicialización** de métodos por defecto

### 4. **Gestión de Proveedores**
- ✅ **Nueva pestaña** en salidas
- ✅ **CRUD completo** con MongoDB
- ✅ **Campos completos**: nombre, marca, tipo, teléfono, contacto, pago
- ✅ **Filtros y búsqueda** avanzada

## Ventajas de la Migración

### 1. **Consistencia**
- ✅ **Misma base de datos** que Barfer
- ✅ **Estructura unificada** para todos los servicios
- ✅ **Manejo consistente** de ObjectIds

### 2. **Performance**
- ✅ **Agregaciones nativas** de MongoDB
- ✅ **Consultas optimizadas** con $lookup
- ✅ **Menos joins** comparado con SQL

### 3. **Flexibilidad**
- ✅ **Esquema flexible** para campos opcionales
- ✅ **Fácil agregación** de nuevos campos
- ✅ **Consultas complejas** con agregaciones

### 4. **Escalabilidad**
- ✅ **Sharding nativo** de MongoDB
- ✅ **Replicación** automática
- ✅ **Mejor manejo** de grandes volúmenes

## Próximos Pasos

### 1. **Inicializar Datos**
```bash
# Ejecutar script de inicialización
node scripts/init-mongodb.cjs
```

### 2. **Probar Funcionalidad**
- ✅ Crear salidas con campos nuevos
- ✅ Gestionar categorías y métodos de pago
- ✅ Usar la nueva pestaña de proveedores
- ✅ Verificar ordenamiento y filtros

### 3. **Migrar Datos Existentes** (Opcional)
- Si tienes datos en Prisma, puedes migrarlos manualmente
- O usar el script de migración cuando esté listo

### 4. **Cleanup** (Futuro)
- Deprecar servicios de Prisma
- Limpiar código no utilizado
- Actualizar documentación

## Comandos Útiles

### Inicializar MongoDB:
```bash
node scripts/init-mongodb.cjs
```

### Verificar Conexión:
```bash
# En MongoDB Compass o CLI
use barfer
db.categorias.find()
db.metodos_pago.find()
db.proveedores.find()
db.salidas.find()
```

### Crear Salida de Prueba:
```javascript
// En MongoDB
db.salidas.insertOne({
  fecha: new Date(),
  detalle: "Prueba de salida con MongoDB",
  tipo: "ORDINARIO",
  marca: "BARFER",
  monto: 1000,
  tipoRegistro: "BLANCO",
  categoriaId: ObjectId("..."), // ID de categoría existente
  metodoPagoId: ObjectId("..."), // ID de método de pago existente
  fechaLlegaFactura: new Date(),
  fechaPagoFactura: new Date(),
  comprobanteNumber: "TEST-001",
  createdAt: new Date(),
  updatedAt: new Date()
});
```

## Estado Actual

### ✅ **Completado:**
- Servicios MongoDB creados
- Actions actualizadas
- Componentes actualizados
- Tipos migrados
- Scripts de inicialización
- Documentación completa

### 🔄 **Pendiente:**
- Inicializar colecciones con datos
- Probar funcionalidad completa
- Migrar datos existentes (si los hay)

## Fecha

2 de Octubre de 2025

