# Implementación de Datos Personales de Mayoristas

## Descripción

Esta implementación permite que cuando se cree una orden con `orderType: 'mayorista'`, se guarde automáticamente en dos colecciones:
1. **`orders`** - Colección principal de órdenes (como siempre)
2. **`mayoristas`** - Colección específica para **datos personales** de mayoristas (sin información de órdenes)

## Características Principales

- **Solo datos personales**: La colección `mayoristas` ahora solo almacena información básica del mayorista
- **Sin duplicados**: No se crea un nuevo mayorista si ya existe uno con el mismo nombre y apellido
- **Búsqueda eficiente**: Índices optimizados para búsquedas por nombre, email y teléfono
- **Fallback graceful**: Si falla el guardado en `mayoristas`, la orden principal se crea igualmente
- **Verificación de existencia**: Sistema inteligente que verifica si el mayorista ya existe antes de crear uno nuevo

## Datos Almacenados en Mayoristas

La colección `mayoristas` ahora solo contiene:

```typescript
interface MayoristaPerson {
    _id?: string;
    user: {
        name: string;
        lastName: string;
        email: string;
    };
    address: {
        address: string;
        city: string;
        phone: string;
        betweenStreets?: string;
        floorNumber?: string;
        departmentNumber?: string;
    };
    createdAt: string;
    updatedAt: string;
}
```

**Campos NO incluidos** (ya no se guardan):
- ❌ `status`, `total`, `subTotal`, `shippingPrice`
- ❌ `notes`, `notesOwn`, `paymentMethod`
- ❌ `items`, `deliveryArea`, `deliveryDay`
- ❌ `orderType`, `whatsappContactedAt`

## Flujo de Creación

### 1. Creación de Orden Mayorista
Cuando se crea una orden con `orderType: 'mayorista'`:

1. **Se valida y guarda** en la colección `orders` (completa)
2. **Se extraen solo los datos personales** (user + address)
3. **Se verifica si ya existe** un mayorista con el mismo nombre y apellido
4. **Si existe**: Se retorna el mayorista existente (no se crea duplicado)
5. **Si no existe**: Se crea un nuevo registro en `mayoristas`

### 2. Lógica de Verificación
```typescript
// Verificar si ya existe un mayorista con el mismo nombre
const existingMayorista = await collection.findOne({
    'user.name': validatedData.user.name,
    'user.lastName': validatedData.user.lastName
});

if (existingMayorista) {
    // Retornar el existente sin crear duplicado
    return { success: true, mayorista: existingMayorista, isNew: false };
}
```

## Servicios Disponibles

### Gestión de Mayoristas
- `createMayoristaPerson(data)` - Crear o verificar mayorista existente
- `getMayoristaPersonById(id)` - Obtener mayorista por ID
- `updateMayoristaPerson(id, data)` - Actualizar datos del mayorista
- `deleteMayoristaPerson(id)` - Eliminar mayorista

### Búsqueda y Consultas
- `findMayoristaByName(name, lastName)` - Búsqueda exacta por nombre completo
- `searchMayoristas(searchTerm)` - Búsqueda por término (nombre, email, teléfono)
- `getMayoristaPersons()` - Obtener todos los mayoristas

## Uso Automático

Cuando se crea una orden a través de `createOrder()` con `orderType: 'mayorista'`, automáticamente:

1. ✅ Se valida y guarda en la colección `orders`
2. ✅ Se extraen solo los datos personales (user + address)
3. ✅ Se verifica si ya existe el mayorista
4. ✅ Se crea nuevo mayorista solo si no existe
5. ✅ Si falla el guardado en `mayoristas`, se registra un warning pero no falla la orden principal

## Configuración de MongoDB

### Crear la Colección

```bash
# Desde el directorio raíz del proyecto
pnpm run script create-mayoristas-collection
```

### Índices Creados

- `user.name` - Para búsquedas por nombre
- `user.lastName` - Para búsquedas por apellido
- `user.email` - Para búsquedas por email
- `address.phone` - Para búsquedas por teléfono
- `createdAt` - Para ordenamiento y filtros de fecha
- `updatedAt` - Para seguimiento de modificaciones
- `{user.name: 1, user.lastName: 1}` - Índice compuesto para búsquedas por nombre completo

## Testing

### Probar la Funcionalidad

```bash
# Probar el sistema completo de mayoristas
pnpm run script test-mayorista-search
```

Este comando:
1. ✅ Prueba la búsqueda inicial (debe estar vacía)
2. ✅ Crea un mayorista de prueba
3. ✅ Verifica que se pueda encontrar en la búsqueda
4. ✅ Prueba la búsqueda por nombre completo
5. ✅ Verifica que no se creen duplicados
6. ✅ Prueba búsquedas por email y teléfono

## Ejemplo de Uso

```typescript
import { createOrder } from '@repo/data-services';

// Crear una orden mayorista
const orderData = {
    orderType: 'mayorista',
    total: 1500,
    user: {
        name: 'Juan',
        lastName: 'Pérez',
        email: 'juan.perez@example.com'
    },
    address: {
        address: 'Calle Principal 123',
        city: 'Buenos Aires',
        phone: '123456789'
    },
    // ... otros campos de la orden
};

const result = await createOrder(orderData);

if (result.success) {
    // La orden se guardó en orders
    // Los datos personales se guardaron/verificaron en mayoristas
    console.log('Order created successfully');
} else {
    console.error('Failed to create order:', result.error);
}
```

## Monitoreo

Los logs incluyen información sobre el manejo de mayoristas:

- ✅ `Order created and new mayorista person added to mayoristas collection`
- ✅ `Order created and existing mayorista person found in mayoristas collection`
- ⚠️ `Warning: Order created but failed to save mayorista person data: [error]`

## Ventajas de la Nueva Implementación

### 1. **Sin Duplicados**
- No se crean registros duplicados de mayoristas
- Sistema inteligente que verifica existencia antes de crear

### 2. **Datos Limpios**
- Solo información personal relevante
- Sin datos de órdenes que pueden cambiar
- Estructura más simple y mantenible

### 3. **Performance Mejorada**
- Índices optimizados para búsquedas personales
- Consultas más rápidas sin datos innecesarios
- Menor uso de almacenamiento

### 4. **Mantenimiento Simplificado**
- Actualización de datos personales independiente de órdenes
- Historial de cambios más claro
- Backup más eficiente

## Migración de Datos Existentes

Si tienes datos existentes en la colección `mayoristas` con la estructura anterior, puedes migrarlos:

```typescript
import { getCollection } from '@repo/database';

async function migrateMayoristaData() {
    const collection = await getCollection('mayoristas');
    
    // Obtener todos los registros existentes
    const existingData = await collection.find({}).toArray();
    
    for (const record of existingData) {
        // Extraer solo datos personales
        const personalData = {
            user: record.user,
            address: record.address,
            createdAt: record.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        // Actualizar el registro
        await collection.updateOne(
            { _id: record._id },
            { $set: personalData }
        );
    }
}
```

## Troubleshooting

### Error: "Collection mayoristas does not exist"
Ejecutar: `pnpm run script create-mayoristas-collection`

### Error: "Failed to save mayorista person data"
Verificar logs para identificar el problema específico. La orden principal se crea correctamente.

### Performance lenta en consultas
Verificar que los índices estén creados correctamente en MongoDB.

### Error en búsqueda de mayoristas
Verificar que la colección `mayoristas` tenga datos y que los índices estén creados.

### Mayorista duplicado creado
Verificar que la función `createMayoristaPerson` esté siendo llamada correctamente y que la verificación de existencia funcione.

## Consideraciones de Performance

- La verificación de existencia es eficiente gracias al índice compuesto en nombre y apellido
- Las búsquedas por término tienen límite de 10 resultados para mejor performance
- Los índices están optimizados para las consultas más comunes
- El guardado dual es asíncrono y no bloquea la respuesta principal

## Mantenimiento

### Backup
La colección `mayoristas` ahora es más pequeña y fácil de respaldar.

### Limpieza
Los datos personales se mantienen independientemente de las órdenes, facilitando la limpieza de datos históricos.

### Auditoría
Los timestamps `createdAt` y `updatedAt` permiten seguimiento de cambios en datos personales.
