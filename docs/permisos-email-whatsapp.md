# Permisos de Email y WhatsApp para Clientes

## 📋 Resumen

Se agregaron nuevos permisos granulares para controlar el acceso a los botones de Email y WhatsApp en las tarjetas de categorías de clientes (Cliente Activo, Cliente Recuperado, etc.). Esto permite dar acceso a la visualización de clientes sin que puedan usar las funcionalidades de comunicación.

## 🔐 Nuevos Permisos

### Permisos Agregados

1. **`clients:send_email`**
   - Permite acceder a `/admin/clients/email`
   - Permite enviar emails masivos a clientes
   - Permite crear y gestionar templates de email
   - Permite programar campañas de email

2. **`clients:send_whatsapp`**
   - Permite acceder a `/admin/clients/whatsapp`
   - Permite enviar mensajes de WhatsApp a clientes
   - Permite crear y gestionar templates de WhatsApp

## 📝 Permisos de Clientes (Completos)

Ahora el sistema de permisos de clientes está organizado así:

### Vista
- **`clients:view`** - Acceso básico a la sección de clientes
- **`clients:view_analytics`** - Ver gestión de clientes y analytics (estadísticas, categorización)

### Comunicación (NUEVO)
- **`clients:send_email`** - Enviar emails a clientes
- **`clients:send_whatsapp`** - Enviar WhatsApp a clientes

### Edición
- **`clients:create`** - Crear nuevos clientes
- **`clients:edit`** - Editar clientes existentes
- **`clients:delete`** - Eliminar clientes

## 🔧 Cambios Implementados

### 1. Definición de Permisos (`packages/auth/server-permissions.ts`)

```typescript
export type Permission =
    // ... otros permisos
    // Clients
    | 'clients:view'
    | 'clients:create'
    | 'clients:edit'
    | 'clients:delete'
    | 'clients:view_analytics'
    | 'clients:send_email'        // ← NUEVO
    | 'clients:send_whatsapp'     // ← NUEVO
```

### 2. Middleware de Rutas (`apps/app/middleware.ts`)

Se agregaron las rutas protegidas:

```typescript
const ROUTE_PERMISSIONS: Record<string, string[]> = {
  // ... otras rutas
  '/admin/clients': ['clients:view'],
  '/admin/clients/email': ['clients:send_email'],       // ← NUEVO
  '/admin/clients/whatsapp': ['clients:send_whatsapp'], // ← NUEVO
};
```

### 3. Interfaz de Gestión de Usuarios (`UsersSection.tsx`)

Se agregaron dos nuevos switches en la sección de "Permisos de Vista":

- ✅ Switch para "Enviar emails a clientes"
- ✅ Switch para "Enviar WhatsApp a clientes"

### 4. PermissionGate en Páginas

Ambas páginas ahora verifican los permisos antes de mostrar el contenido:

**Email Page:**
```typescript
<PermissionGate
    permission="clients:send_email"
    fallback={<div>No tienes permisos para enviar emails a clientes.</div>}
>
    <EmailClientsViewServer ... />
</PermissionGate>
```

**WhatsApp Page:**
```typescript
<PermissionGate
    permission="clients:send_whatsapp"
    fallback={<div>No tienes permisos para enviar WhatsApp a clientes.</div>}
>
    <WhatsAppClientsViewServer ... />
</PermissionGate>
```

## 🎯 Casos de Uso

### Caso 1: Usuario con acceso solo a visualización
```typescript
permissions: [
  'clients:view',
  'clients:view_analytics'
]
```
- ✅ Puede ver la lista de clientes
- ✅ Puede ver estadísticas y categorización
- ❌ No ve botones de Email ni WhatsApp en las tarjetas
- ❌ No puede acceder a las páginas de email/whatsapp

### Caso 2: Usuario con acceso a comunicación
```typescript
permissions: [
  'clients:view',
  'clients:view_analytics',
  'clients:send_email',
  'clients:send_whatsapp'
]
```
- ✅ Puede ver la lista de clientes
- ✅ Puede ver estadísticas y categorización
- ✅ Ve ambos botones (Email y WhatsApp) en las tarjetas
- ✅ Puede acceder y usar ambas funcionalidades de comunicación

### Caso 3: Usuario solo con acceso a email
```typescript
permissions: [
  'clients:view',
  'clients:send_email'
]
```
- ✅ Puede ver la lista de clientes
- ✅ Ve solo el botón de Email en las tarjetas
- ✅ Puede acceder a la funcionalidad de email
- ❌ No ve el botón de WhatsApp
- ❌ No puede acceder a la página de WhatsApp

## 🔄 Flujo de Implementación

1. **Admin asigna permisos**
   - Va a `/admin/account`
   - Selecciona un usuario
   - Activa los switches correspondientes
   - Guarda cambios

2. **Usuario intenta acceder**
   - El middleware verifica el permiso en la ruta
   - Si no tiene permiso → redirect a `/access-denied`
   - Si tiene permiso → acceso concedido

3. **Verificación en página**
   - El `PermissionGate` hace una verificación adicional
   - Si no tiene permiso → muestra fallback
   - Si tiene permiso → muestra contenido

## ✅ Ventajas de esta Implementación

1. **Granularidad**: Control fino sobre qué puede hacer cada usuario
2. **Seguridad**: Verificación en múltiples niveles (middleware + componente)
3. **Flexibilidad**: Fácil agregar más permisos en el futuro
4. **UX**: Mensajes claros cuando no hay permisos
5. **Mantenibilidad**: Código organizado y fácil de entender

## 🔮 Extensiones Futuras

Si se necesitan permisos más específicos, se pueden agregar:

- `clients:send_email:scheduled` - Solo campañas programadas
- `clients:send_whatsapp:bulk` - Solo envíos masivos
- `clients:manage_templates` - Gestionar templates sin enviar
- `clients:view_communication_history` - Ver historial de comunicaciones

## 📚 Archivos Modificados

### Permisos y Seguridad
1. `/packages/auth/server-permissions.ts` - Definición de permisos
2. `/apps/app/middleware.ts` - Rutas protegidas

### UI de Gestión de Permisos
3. `/apps/app/app/[locale]/(authenticated)/admin/account/components/UsersSection.tsx` - UI de permisos

### Protección de Páginas
4. `/apps/app/app/[locale]/(authenticated)/admin/clients/email/page.tsx` - Protección de email
5. `/apps/app/app/[locale]/(authenticated)/admin/clients/whatsapp/page.tsx` - Protección de WhatsApp

### Control de Botones en Tarjetas
6. `/apps/app/app/[locale]/(authenticated)/admin/clients/components/ClientCategoryCard.tsx` - Botones condicionales
7. `/apps/app/app/[locale]/(authenticated)/admin/clients/components/ClientCategoriesServer.tsx` - Props de permisos
8. `/apps/app/app/[locale]/(authenticated)/admin/clients/components/ClientCategoriesWrapper.tsx` - Obtención de permisos

### Documentación
9. `/docs/permisos-email-whatsapp.md` - Esta documentación

## 🎯 Control de Botones en Tarjetas

Los botones de Email y WhatsApp en las tarjetas de categorías de clientes ahora se muestran condicionalmente según los permisos del usuario:

### Comportamiento

- **Sin permisos**: No se muestran los botones de Email ni WhatsApp en las tarjetas
- **Solo Email**: Solo aparece el botón "Email" en las tarjetas
- **Solo WhatsApp**: Solo aparece el botón "WhatsApp" en las tarjetas  
- **Ambos permisos**: Aparecen ambos botones

### Implementación

1. **ClientCategoryCard**: Recibe props `canSendEmail` y `canSendWhatsApp` para controlar qué botones mostrar
2. **ClientCategoriesServer**: Propaga los permisos a todas las tarjetas (tanto behavior como spending)
3. **ClientCategoriesWrapper**: Obtiene los permisos del usuario actual y los pasa hacia abajo

Esta implementación asegura que los usuarios solo vean las opciones de comunicación para las que tienen permisos, mejorando la experiencia de usuario y la seguridad.

## 🧪 Testing

Para probar los nuevos permisos:

### Prueba 1: Sin permisos de comunicación
1. Crear un usuario de prueba con rol "user"
2. Asignar solo `clients:view` y `clients:view_analytics`
3. Iniciar sesión con ese usuario
4. Ir a `/admin/clients`
5. **Verificar**: Las tarjetas NO muestran botones de Email ni WhatsApp
6. Intentar acceder directamente a `/admin/clients/email` → debe redirigir a access-denied

### Prueba 2: Solo permiso de Email
1. Agregar permiso `clients:send_email` al usuario
2. Refrescar la página de clientes
3. **Verificar**: Las tarjetas ahora muestran solo el botón "Email"
4. Click en botón Email → debe navegar correctamente y mostrar la página
5. Intentar acceder a `/admin/clients/whatsapp` → debe redirigir a access-denied

### Prueba 3: Ambos permisos
1. Agregar permiso `clients:send_whatsapp` al usuario
2. Refrescar la página de clientes
3. **Verificar**: Las tarjetas muestran ambos botones (Email y WhatsApp)
4. Probar ambos botones → deben navegar correctamente
5. Verificar que puede usar ambas funcionalidades completamente

---

**Fecha de implementación**: 2025-10-16
**Versión**: 1.0

