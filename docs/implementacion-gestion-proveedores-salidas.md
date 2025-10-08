# Implementación: Gestión de Proveedores en Salidas

## Descripción

Se implementó una nueva funcionalidad para gestionar proveedores dentro de la sección de salidas, incluyendo:

1. **Nueva pestaña "Proveedores"** para gestionar el registro de proveedores
2. **Reordenamiento de columnas** en la tabla de salidas: Fecha → Categoría → Proveedor → Detalle
3. **Integración** entre proveedores y salidas para autocompletar datos

## Funcionalidades Implementadas

### 1. Gestión de Proveedores

#### Campos del Proveedor:
- **Nombre**: Nombre de la empresa/proveedor
- **Marca**: Marca asociada (por defecto BARFER)
- **Tipo de Proveedor**: Categoría (Alimentos, Insumos, Servicios, etc.)
- **Teléfono**: Número de contacto
- **Persona de Contacto**: Nombre de la persona con quien se habla
- **Tipo de Pago**: BLANCO (registrado) o NEGRO (no registrado)

#### Operaciones CRUD:
- ✅ **Crear** proveedor
- ✅ **Editar** proveedor
- ✅ **Eliminar** proveedor
- ✅ **Listar** proveedores con filtros y ordenamiento

### 2. Nueva Pestaña en Salidas

Se agregó una cuarta pestaña "Proveedores" con ícono de usuarios (👥) que permite:

- Ver todos los proveedores registrados
- Filtrar por marca, tipo de proveedor, tipo de pago
- Buscar por nombre, teléfono, persona de contacto
- Ordenar por cualquier columna
- Gestionar proveedores (crear, editar, eliminar)

### 3. Reordenamiento de Tabla de Salidas

**Orden anterior:**
```
Fecha | Detalle | Categoría | Tipo | Marca | Monto | Forma de Pago | Registro | Acciones
```

**Orden nuevo:**
```
Fecha | Categoría | Proveedor | Detalle | Tipo | Marca | Monto | Forma de Pago | Registro | Acciones
```

#### Cambios específicos:
- ✅ **Proveedor** agregado como tercera columna
- ✅ **Categoría** movida a segunda posición
- ✅ **Detalle** movido a cuarta posición
- ✅ Ordenamiento por proveedor implementado
- ✅ Filtros actualizados para incluir proveedor

## Archivos Creados

### 1. `/apps/app/app/[locale]/(authenticated)/admin/salidas/components/ProveedoresManager.tsx`
**Componente principal** para gestionar proveedores:
- Tabla con ordenamiento y filtros
- Estados para modales
- Lógica de CRUD
- Mock data para desarrollo

### 2. `/apps/app/app/[locale]/(authenticated)/admin/salidas/components/AddProveedorModal.tsx`
**Modal para crear** nuevos proveedores:
- Formulario con validaciones
- Selectores para tipo de proveedor y marca
- Integración con toast notifications

### 3. `/apps/app/app/[locale]/(authenticated)/admin/salidas/components/EditProveedorModal.tsx`
**Modal para editar** proveedores existentes:
- Pre-carga datos del proveedor
- Mismo formulario que crear
- Validaciones y actualización

### 4. `/apps/app/app/[locale]/(authenticated)/admin/salidas/components/DeleteProveedorDialog.tsx`
**Diálogo para eliminar** proveedores:
- Confirmación de eliminación
- Información del proveedor a eliminar
- Manejo de errores

## Archivos Modificados

### 1. `/apps/app/app/[locale]/(authenticated)/admin/salidas/components/SalidasPageClient.tsx`
- ✅ Agregada pestaña "Proveedores"
- ✅ Import del componente ProveedoresManager
- ✅ Estado para nueva pestaña

### 2. `/apps/app/app/[locale]/(authenticated)/admin/salidas/components/SalidasTable.tsx`
- ✅ Reordenamiento de columnas
- ✅ Agregado campo 'proveedor' al SortField
- ✅ Lógica de ordenamiento por proveedor
- ✅ Nueva columna de proveedor en la tabla
- ✅ Actualizado colSpan para 10 columnas

### 3. `/packages/data-services/src/services/salidasService.ts`
- ✅ Agregado `proveedorId` a SalidaData
- ✅ Agregado objeto `proveedor` con datos completos
- ✅ Actualizado CreateSalidaInput y UpdateSalidaInput

## Estructura de Datos

### ProveedorData Interface:
```typescript
interface ProveedorData {
    id: string;
    nombre: string;                    // Nombre de la empresa
    marca: string;                     // BARFER (por defecto)
    tipoProveedor: string;             // Alimentos, Insumos, Servicios, etc.
    telefono: string;                  // Número de contacto
    personaContacto: string;           // Nombre de la persona
    pagoTipo: 'BLANCO' | 'NEGRO';     // Tipo de pago
    activo: boolean;                   // Estado activo/inactivo
    createdAt: string;                 // Fecha de creación
    updatedAt: string;                 // Fecha de actualización
}
```

### SalidaData Actualizado:
```typescript
interface SalidaData {
    // ... campos existentes
    proveedorId?: string | null;       // ID del proveedor (opcional)
    proveedor?: {                      // Datos completos del proveedor
        id: string;
        nombre: string;
        marca: string;
        tipoProveedor: string;
        telefono: string;
        personaContacto: string;
        pagoTipo: 'BLANCO' | 'NEGRO';
    } | null;
}
```

## Tipos de Proveedor Disponibles

1. **Alimentos** - Proveedores de comida para mascotas
2. **Insumos** - Materiales y productos necesarios
3. **Servicios** - Servicios profesionales
4. **Transporte** - Servicios de envío y logística
5. **Marketing** - Publicidad y promoción
6. **Tecnología** - Software, hardware, servicios IT
7. **Limpieza** - Productos y servicios de limpieza
8. **Mantenimiento** - Reparaciones y mantenimiento
9. **Otros** - Categoría genérica

## Funcionalidades de la Tabla de Proveedores

### Filtros Disponibles:
- **Búsqueda de texto**: Busca en nombre, marca, tipo, teléfono, persona de contacto
- **Marca**: Filtra por marca (BARFER)
- **Tipo de proveedor**: Filtra por categoría
- **Tipo de pago**: Filtra por BLANCO/NEGRO

### Ordenamiento:
- **Nombre** - Orden alfabético
- **Marca** - Orden alfabético
- **Tipo de proveedor** - Orden alfabético
- **Teléfono** - Orden numérico
- **Persona de contacto** - Orden alfabético
- **Tipo de pago** - BLANCO/NEGRO

### Acciones:
- **Crear** - Modal para agregar nuevo proveedor
- **Editar** - Modal para modificar proveedor existente
- **Eliminar** - Diálogo de confirmación para eliminar

## Integración Futura

### Próximos Pasos (Pendientes):

1. **Base de Datos**:
   - Crear tabla `proveedores` en MongoDB
   - Agregar campo `proveedorId` a tabla `salidas`
   - Implementar relaciones entre salidas y proveedores

2. **APIs**:
   - `createProveedorAction()` - Crear proveedor
   - `updateProveedorAction()` - Actualizar proveedor
   - `deleteProveedorAction()` - Eliminar proveedor
   - `getAllProveedoresAction()` - Listar proveedores

3. **Autocompletado**:
   - Al crear/editar salidas, permitir seleccionar proveedor
   - Autocompletar datos del proveedor (teléfono, persona de contacto)
   - Validar que el tipo de pago coincida

4. **Validaciones**:
   - No permitir eliminar proveedores que tengan salidas asociadas
   - Validar formato de teléfono
   - Verificar que el tipo de pago sea consistente

## Mock Data Incluido

Para desarrollo, se incluyeron 2 proveedores de ejemplo:

```typescript
const mockProveedores = [
    {
        id: '1',
        nombre: 'Distribuidora ABC',
        marca: 'BARFER',
        tipoProveedor: 'Alimentos',
        telefono: '221 123-4567',
        personaContacto: 'Juan Pérez',
        pagoTipo: 'BLANCO',
        activo: true
    },
    {
        id: '2',
        nombre: 'Insumos Veterinarios SA',
        marca: 'BARFER',
        tipoProveedor: 'Insumos',
        telefono: '221 987-6543',
        personaContacto: 'María García',
        pagoTipo: 'NEGRO',
        activo: true
    }
];
```

## Uso

### Para acceder a la gestión de proveedores:
1. Ir a `/admin/salidas`
2. Hacer clic en la pestaña **"Proveedores"**
3. Gestionar proveedores (crear, editar, eliminar)

### Para ver proveedores en salidas:
1. En la pestaña **"Tabla"** de salidas
2. La columna **"Proveedor"** aparece como tercera columna
3. Se puede ordenar y filtrar por proveedor

## Beneficios

1. **Organización**: Mejor estructura de datos de salidas
2. **Trazabilidad**: Saber exactamente con qué proveedor se trabajó
3. **Contacto**: Información de contacto rápida y accesible
4. **Clasificación**: Diferenciación entre pagos en blanco y negro
5. **Eficiencia**: Autocompletado futuro de datos al crear salidas

## Fecha

2 de Octubre de 2025
