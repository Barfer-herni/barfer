# Implementación de Órdenes Mayoristas

## Descripción

Esta implementación permite que cuando se cree una orden con `orderType: 'mayorista'`, se guarde automáticamente en dos colecciones:
1. **`orders`** - Colección principal de órdenes (como siempre)
2. **`mayoristas`** - Nueva colección específica para órdenes mayoristas

## Características

- **Doble guardado**: Las órdenes mayoristas se guardan en ambas colecciones
- **Sin fecha**: La colección `mayoristas` no incluye el campo `fecha` como se solicitó
- **Estructura de items preservada**: Los items se guardan exactamente como en la colección principal
- **Fallback graceful**: Si falla el guardado en `mayoristas`, la orden principal se crea igualmente
- **Índices optimizados**: La colección `mayoristas` incluye índices para consultas eficientes
- **Búsqueda y autocompletado**: Búsqueda de mayoristas existentes con autocompletado de campos

## Funcionalidad de Búsqueda y Autocompletado

### Componente MayoristaSearch

Cuando se selecciona `orderType: 'mayorista'` en el formulario de creación de órdenes, aparece automáticamente un campo de búsqueda que permite:

1. **Buscar mayoristas existentes** por nombre, email o teléfono
2. **Autocompletar automáticamente** todos los campos del formulario:
   - Nombre y apellido del cliente
   - Email
   - Teléfono
   - Dirección completa
   - Ciudad
   - Campos adicionales (entre calles, piso, departamento)

### Características del Autocompletado

- **Búsqueda en tiempo real** con debounce de 300ms
- **Resultados paginados** (máximo 10 resultados por búsqueda)
- **Interfaz intuitiva** con iconos y información clara
- **Limpieza automática** cuando se cambia el tipo de orden
- **Indicadores visuales** del estado de búsqueda y selección

### Flujo de Uso

1. Usuario selecciona `orderType: 'mayorista'`
2. Aparece el campo de búsqueda de mayoristas
3. Usuario escribe para buscar (mínimo 2 caracteres)
4. Se muestran resultados con información relevante
5. Al seleccionar un mayorista, se autocompletan todos los campos
6. Usuario puede modificar cualquier campo si es necesario
7. Al crear la orden, se guarda en ambas colecciones

### Mapeo de Productos para Autocompletado

El sistema incluye una función inteligente de mapeo **bidireccional** que convierte entre los nombres de productos de la base de datos y las opciones del select del formulario:

#### Problema Resuelto
- **En la DB**: `items[0].name = "BOX PERRO POLLO"`, `items[0].options[0].name = "5KG"`
- **En el select**: Opción `"Barfer box Perro Pollo 5kg"` (formato combinado)

#### Funciones de Mapeo

##### 1. DB → Select (Para Autocompletado)
```typescript
mapDBProductToSelectOption(dbProductName: string, dbOptionName: string): string
```
Convierte nombres de la DB hacia opciones del select para autocompletar campos.

##### 2. Select → DB (Para Guardado)
```typescript
mapSelectOptionToDBFormat(selectOption: string): { name: string, option: string }
```
Convierte opciones del select hacia el formato de la DB para guardar correctamente.

#### Ejemplos de Mapeo Bidireccional

| DB Product | DB Option | Select Option | Mapeo Inverso |
|------------|-----------|---------------|---------------|
| `BOX PERRO POLLO` | `5KG` | `Barfer box Perro Pollo 5kg` | ✅ Funciona |
| `BOX PERRO CERDO` | `10KG` | `Barfer box Perro Cerdo 10kg` | ✅ Funciona |
| `BIG DOG POLLO` | `15KG` | `BIG DOG (15kg) - POLLO` | ✅ Funciona |
| `TRAQUEA` | `X1` | `Traquea X1` | ✅ Funciona |
| `POLLO` | `40GRS` | `Pollo 40grs` | ✅ Funciona |

#### Flujo Completo del Mapeo

1. **Autocompletado**: DB → Select
   - `"BOX PERRO POLLO" + "5KG"` → `"Barfer box Perro Pollo 5kg"`

2. **Guardado**: Select → DB  
   - `"Barfer box Perro Pollo 5kg"` → `"BOX PERRO POLLO" + "5KG"`

#### Categorías Mapeadas
- **Barfer Box**: Perro/Gato con Pollo, Vaca, Cerdo, Cordero (5kg/10kg)
- **Big Dog**: Pollo, Vaca (15kg)
- **Productos Raw**: Traquea, Orejas, Pollo, Hígado, Cornalitos
- **Complementos**: Cornalitos, Caldo, Huesos, Garras

#### Testing del Mapeo Bidireccional
```bash
pnpm run script test-product-mapping
```
Este comando prueba tanto el mapeo DB→Select como Select→DB.

## Estructura de la Colección Mayoristas

```typescript
interface MayoristaOrder {
    _id?: string;
    status: 'pending' | 'confirmed' | 'delivered' | 'cancelled';
    total: number;
    subTotal: number;
    shippingPrice: number;
    notes: string;
    notesOwn: string;
    address: {
        address: string;
        city: string;
        phone: string;
        betweenStreets?: string;
        floorNumber?: string;
        departmentNumber?: string;
    };
    user: {
        name: string;
        lastName: string;
        email: string;
    };
    items: OrderItem[]; // Misma estructura que en orders
    deliveryArea: DeliveryArea;
    paymentMethod: string;
    orderType: 'mayorista'; // Siempre 'mayorista'
    deliveryDay: string;
    whatsappContactedAt?: string;
    createdAt: string;
    updatedAt: string;
}
```

## Servicios Disponibles

### Creación y Gestión
- `createMayoristaOrder(data)` - Crear orden mayorista directamente
- `getMayoristaOrderById(id)` - Obtener orden por ID
- `updateMayoristaOrder(id, data)` - Actualizar orden
- `deleteMayoristaOrder(id)` - Eliminar orden

### Tabla de Admin
- `getMayoristaOrdersForTable(options)` - Con paginación y filtros
- `getMayoristaOrdersStats()` - Estadísticas para dashboard

### Búsqueda y Autocompletado
- `MayoristaSearch` - Componente React para búsqueda
- Búsqueda por nombre, email, teléfono o dirección
- Autocompletado automático de campos del formulario

## Uso Automático

Cuando se crea una orden a través de `createOrder()` con `orderType: 'mayorista'`, automáticamente:

1. Se valida y guarda en la colección `orders`
2. Se prepara una copia sin el campo `fecha`
3. Se guarda en la colección `mayoristas`
4. Si falla el guardado en `mayoristas`, se registra un warning pero no falla la orden principal

## Configuración de MongoDB

### Crear la Colección

```bash
# Desde el directorio raíz del proyecto
pnpm run script create-mayoristas-collection
```

### Índices Creados

- `user.email` - Para búsquedas por email
- `status` - Para filtros por estado
- `orderType` - Para filtros por tipo
- `createdAt` - Para ordenamiento y filtros de fecha
- `deliveryDay` - Para filtros de día de entrega

## Testing

### Probar la Funcionalidad

```bash
# Probar búsqueda y autocompletado
pnpm run script test-mayorista-search
```

Este comando:
1. Prueba la búsqueda de mayoristas existentes
2. Crea un mayorista de prueba
3. Verifica que se pueda encontrar en la búsqueda
4. Valida la funcionalidad completa

## Ejemplo de Uso

```typescript
import { createOrder } from '@repo/data-services';

// Crear una orden mayorista
const orderData = {
    orderType: 'mayorista',
    total: 1500,
    // ... otros campos
};

const result = await createOrder(orderData);

if (result.success) {
    // La orden se guardó en ambas colecciones
    console.log('Order created successfully');
} else {
    console.error('Failed to create order:', result.error);
}
```

## Monitoreo

Los logs incluyen información sobre el guardado dual:

- ✅ `Order successfully saved to both orders and mayoristas collections`
- ⚠️ `Warning: Order created but failed to save to mayoristas collection: [error]`

## Consideraciones de Performance

- El guardado dual es asíncrono y no bloquea la respuesta principal
- Los índices optimizan las consultas de la tabla de admin
- La paginación previene cargas excesivas de datos
- La búsqueda tiene debounce para evitar consultas excesivas
- Los resultados de búsqueda se limitan a 10 para mejor performance

## Mantenimiento

### Backup
La colección `mayoristas` se puede respaldar independientemente de `orders`.

### Migración
Si es necesario, se pueden migrar órdenes existentes usando:

```typescript
import { getOrders } from '@repo/data-services';
import { createMayoristaOrder } from '@repo/data-services';

const orders = await getOrders();
const mayoristaOrders = orders.filter(order => order.orderType === 'mayorista');

for (const order of mayoristaOrders) {
    await createMayoristaOrder(order);
}
```

## Troubleshooting

### Error: "Collection mayoristas does not exist"
Ejecutar: `pnpm run script create-mayoristas-collection`

### Error: "Failed to save to mayoristas collection"
Verificar logs para identificar el problema específico. La orden principal se crea correctamente.

### Performance lenta en consultas
Verificar que los índices estén creados correctamente en MongoDB.

### Error en búsqueda de mayoristas
Verificar que la colección `mayoristas` tenga datos y que los índices estén creados.

### Autocompletado no funciona
Verificar que el componente `MayoristaSearch` esté importado correctamente y que la función `handleMayoristaSelect` esté implementada.
