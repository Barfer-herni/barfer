# Sistema de Permisos Dinámicos por Categorías - Salidas

## 📋 Descripción

Este sistema implementa un control granular y dinámico de permisos para las categorías de salidas, permitiendo que los administradores configuren qué categorías puede ver cada usuario de forma flexible.

## 🔐 Permisos Implementados

### Permisos Dinámicos por Categoría

- `outputs:view_all_categories` - Acceso a todas las categorías (equivalente a admin)
- `outputs:view_category:NOMBRE_CATEGORIA` - Acceso específico a una categoría

### Sistema Dinámico

El sistema genera automáticamente permisos para cada categoría existente:
- `outputs:view_category:SUELDOS`
- `outputs:view_category:GASTOS`
- `outputs:view_category:SERVICIOS`
- `outputs:view_category:SUMINISTROS`
- etc.

## 👥 Roles y Permisos

### Administradores
- **Acceso completo**: Pueden ver todas las categorías automáticamente
- **Gestión de permisos**: Pueden configurar permisos de otros usuarios
- **Permisos automáticos**: Tienen todos los permisos del sistema

### Usuarios Normales
- **Permisos por defecto**: Solo `outputs:view` (sin acceso a categorías específicas)
- **Categorías visibles**: Solo las categorías para las que tienen permisos específicos
- **Configuración dinámica**: Los administradores pueden asignar permisos por categoría

## 🚀 Configuración Inicial

### 1. Ejecutar Script de Inicialización

```bash
pnpm run init-categories
```

### 2. Migrar Permisos Existentes (si aplica)

```bash
pnpm run migrate-permissions
```

Este script convierte permisos antiguos al nuevo sistema dinámico.

## 🔧 Funcionalidades Implementadas

### Gestión Dinámica de Permisos
- **Interfaz de administración**: Admin > Account > Permisos por Categoría
- **Asignación granular**: Seleccionar categorías específicas por usuario
- **Vista previa**: Ver qué categorías puede ver cada usuario
- **Actualización en tiempo real**: Los cambios se aplican inmediatamente

### Filtrado Automático
- **Tabla de Salidas**: Los usuarios solo ven categorías permitidas
- **Estadísticas**: Los gráficos y analytics respetan los permisos
- **Búsqueda**: Los filtros solo muestran categorías permitidas
- **Analytics**: Todas las funciones filtran por permisos

### Mensajes Informativos
- **Aviso de permisos**: Los usuarios ven un mensaje cuando tienen acceso limitado
- **Transparencia**: Se informa sobre categorías ocultas sin revelar detalles

## 📊 Comportamiento por Rol

### Usuario Normal (sin permisos específicos)
```
✅ Puede ver: Solo categorías básicas (si las tiene asignadas)
❌ No puede ver: Categorías sin permisos específicos
⚠️ Ve mensaje: "Solo puedes ver las categorías para las que tienes permisos..."
```

### Usuario con Permisos Específicos
```
✅ Puede ver: Categorías específicas asignadas por el administrador
❌ No puede ver: Categorías no asignadas
```

### Usuario con `outputs:view_all_categories`
```
✅ Puede ver: Todas las categorías
```

### Administrador
```
✅ Puede ver: Todas las categorías sin restricciones
✅ Puede gestionar: Permisos de todos los usuarios
```

## 🛠️ Gestión de Permisos

### Interfaz de Administración

1. Ir a **Admin > Account > Permisos por Categoría**
2. Seleccionar un usuario de la lista
3. Configurar permisos:
   - **Ver todas las categorías**: Acceso completo
   - **Categorías específicas**: Seleccionar categorías individuales
4. Guardar cambios

### Asignación de Permisos

#### Opción 1: Todas las Categorías
- Marcar "Ver todas las categorías"
- El usuario tendrá acceso completo

#### Opción 2: Categorías Específicas
- Desmarcar "Ver todas las categorías"
- Seleccionar categorías individuales
- El usuario solo verá las categorías seleccionadas

### Crear Nuevas Categorías

1. Crear la categoría en el sistema
2. El permiso se genera automáticamente: `outputs:view_category:NUEVA_CATEGORIA`
3. Asignar el permiso a usuarios según necesidad

## 🔍 Testing

### Verificar Funcionalidad

1. **Crear usuario normal** sin permisos específicos
2. **Asignar permisos específicos** desde la interfaz de administración
3. **Crear salida con categoría específica**
4. **Verificar que el usuario ve/no ve según sus permisos**
5. **Modificar permisos** y verificar cambios en tiempo real

### Comandos de Testing

```bash
# Ejecutar tests
pnpm test

# Verificar permisos
pnpm run dev
# Luego navegar a /admin/account/permissions con diferentes usuarios
```

## 📝 Notas Importantes

- **Los administradores siempre tienen acceso completo**
- **Los filtros se aplican en tiempo real**
- **Los permisos se verifican en cada request**
- **Las estadísticas se recalculan automáticamente**
- **La interfaz se actualiza dinámicamente**

## 🚨 Consideraciones de Seguridad

- **No se almacenan datos sensibles en el frontend**
- **Verificación doble**: Frontend + Backend
- **Permisos granulares** para control preciso
- **Fallback seguro** si no hay permisos definidos
- **Auditoría de cambios** en permisos de usuarios

## 🔄 Migración desde Sistema Anterior

Si tienes un sistema anterior con permisos fijos:

1. **Ejecutar migración**: `pnpm run migrate-permissions`
2. **Verificar conversión**: Los permisos antiguos se convierten automáticamente
3. **Configurar nuevos permisos**: Usar la interfaz de administración
4. **Probar funcionalidad**: Verificar que todo funciona correctamente

### Mapeo de Permisos Antiguos

| Permiso Antiguo | Nuevos Permisos |
|-----------------|-----------------|
| `outputs:view_sueldos` | `outputs:view_category:SUELDOS`, `outputs:view_category:SALARIOS` |
| `outputs:view_sensitive_data` | `outputs:view_category:BONIFICACIONES`, `outputs:view_category:COMISIONES`, `outputs:view_category:PRESTACIONES` |
| `outputs:view_restricted_categories` | `outputs:view_all_categories` | 