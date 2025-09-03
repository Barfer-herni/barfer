# 📞 Unificación de Formato de Números de Teléfono

## 🎯 Objetivo

Unificar el formato de los números de teléfono en la tabla de órdenes para que se muestren de manera consistente según los estándares argentinos, eliminando prefijos innecesarios como `+54`, `+549`, `+54 9`, `54`, `0`, `0221`, `(221)`, `(+549)`.

## 📋 Reglas de Formateo Implementadas

### La Plata
- **Formato**: `221 XXX-XXXX` (7 dígitos después del 221)
- **Ejemplos**:
  - `5491140756659` → `221 407-5665`
  - `+5491140756659` → `221 407-5665`
  - `02214075665` → `221 407-5665`

### CABA y Resto de Buenos Aires
- **Formato**: `11-XXXX-XXXX` o `15-XXXX-XXXX` (8 dígitos después del 11 o 15)
- **Ejemplos**:
  - `5491140756659` → `11-4075-6659`
  - `+5491140756659` → `11-4075-6659`
  - `1540756659` → `15-4075-6659`

## 🔧 Funciones Implementadas

### 1. `formatPhoneNumber(phone: string): string`
**Ubicación**: `apps/app/app/[locale]/(authenticated)/admin/table/helpers.ts`

Formatea un número de teléfono para mostrar en la interfaz de usuario.

**Características**:
- Elimina prefijos comunes de Argentina (`+54`, `+549`, `54`, `0`, `0221`, `221`)
- Aplica formato visual según la región
- Devuelve el número original si no es válido
- Maneja casos edge (null, undefined, strings vacíos)

### 2. `validateAndNormalizePhone(phone: string): string | null`
**Ubicación**: `apps/app/app/[locale]/(authenticated)/admin/table/helpers.ts`

Valida y normaliza un número de teléfono antes de guardarlo en la base de datos.

**Características**:
- Valida que el número tenga el formato correcto
- Normaliza el número eliminando prefijos
- Devuelve `null` si el número no es válido
- Usado en las acciones de crear y actualizar órdenes

## 📁 Archivos Modificados

### 1. `helpers.ts`
- ✅ Agregada función `formatPhoneNumber`
- ✅ Agregada función `validateAndNormalizePhone`

### 2. `columns.tsx`
- ✅ Importada función `formatPhoneNumber`
- ✅ Actualizada columna de teléfono para usar formato correcto

### 3. `exportOrdersAction.ts`
- ✅ Importada función `formatPhoneNumber`
- ✅ Actualizada exportación para usar formato correcto

### 4. `OrdersTable.tsx`
- ✅ Importada función `formatPhoneNumber`
- ✅ Actualizado campo de edición con placeholder informativo
- ✅ Agregada ayuda visual con formato esperado

### 5. `actions.ts`
- ✅ Importada función `validateAndNormalizePhone`
- ✅ Actualizada `updateOrderAction` para validar teléfonos
- ✅ Actualizada `createOrderAction` para validar teléfonos

## 🧪 Testing

### Script de Prueba
**Ubicación**: `apps/app/app/[locale]/(authenticated)/admin/table/test-phone-formatting.js`

Incluye casos de prueba para:
- Números de La Plata
- Números de CABA y Buenos Aires
- Casos edge e inválidos
- Validación de formato

### Ejecutar Pruebas
```bash
cd apps/app/app/[locale]/(authenticated)/admin/table
node test-phone-formatting.js
```

## 🎨 Mejoras en la UI

### Tabla de Órdenes
- Los números de teléfono ahora se muestran con formato consistente
- Eliminación automática de prefijos innecesarios
- Formato visual mejorado para legibilidad

### Modal de Edición
- Placeholder informativo con ejemplos de formato
- Ayuda visual que explica los formatos esperados
- Validación en tiempo real al guardar

### Exportación Excel
- Los números exportados mantienen el formato correcto
- Consistencia entre visualización y exportación

## 🔒 Validación de Datos

### Al Crear Órdenes
- Validación automática del formato de teléfono
- Mensaje de error descriptivo si el formato es inválido
- Normalización automática de números válidos

### Al Actualizar Órdenes
- Misma validación que en creación
- Preservación de números ya existentes si no se modifican
- Backup automático antes de cambios

## 📊 Beneficios

1. **Consistencia Visual**: Todos los números se muestran con el mismo formato
2. **Mejor Legibilidad**: Formato familiar para usuarios argentinos
3. **Validación Robusta**: Prevención de datos incorrectos
4. **Mantenimiento Simplificado**: Lógica centralizada en helpers
5. **Experiencia de Usuario**: Feedback claro sobre formatos esperados

## 🚀 Próximos Pasos

1. **Monitoreo**: Observar el comportamiento en producción
2. **Feedback**: Recopilar comentarios de usuarios
3. **Optimización**: Ajustar validaciones según necesidades reales
4. **Extensión**: Aplicar formato a otras partes del sistema si es necesario

---

**Nota**: Los cambios son retrocompatibles y no afectan datos existentes. Los números se formatean solo para visualización, manteniendo la funcionalidad existente.
