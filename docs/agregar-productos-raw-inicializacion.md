# Agregado de Productos RAW a la Inicialización de Precios

## Descripción

Se agregaron productos de la sección **RAW** a las funciones de inicialización de precios mensuales. Estos productos son exclusivamente para clientes mayoristas.

## Productos Agregados

Todos los siguientes productos se agregaron con:
- **Sección:** RAW
- **Tipo de precio:** MAYORISTA únicamente
- **Precio inicial:** 0 (para ser editado después)

### Lista de productos RAW agregados:

| Producto | Weight | Descripción |
|----------|--------|-------------|
| HIGADO | 100GRS | Hígado en porciones de 100 gramos |
| HIGADO | 40GRS | Hígado en porciones de 40 gramos |
| POLLO | 100GRS | Pollo en porciones de 100 gramos |
| POLLO | 40GRS | Pollo en porciones de 40 gramos |
| CORNALITOS | 30GRS | Cornalitos en porciones de 30 gramos |
| TRAQUEA | X1 | Traquea individual |
| TRAQUEA | X2 | Pack de 2 traqueas |
| OREJA | X1 | Oreja individual |
| OREJA | X50 | Pack de 50 orejas |
| OREJAS | X100 | Pack de 100 orejas |

## Archivos Modificados

**Archivo:** `/packages/data-services/src/services/barfer/pricesService.ts`

### 1. Función `initializePricesForPeriod` (líneas ~1029-1039)

Esta función se usa cuando se inicializa un mes nuevo específico desde la UI de prices.

```typescript
// RAW - Productos solo para mayorista
{ section: 'RAW' as PriceSection, product: 'HIGADO', weight: '100GRS', priceType: 'MAYORISTA' as PriceType, price: 0 },
{ section: 'RAW' as PriceSection, product: 'HIGADO', weight: '40GRS', priceType: 'MAYORISTA' as PriceType, price: 0 },
{ section: 'RAW' as PriceSection, product: 'POLLO', weight: '100GRS', priceType: 'MAYORISTA' as PriceType, price: 0 },
{ section: 'RAW' as PriceSection, product: 'POLLO', weight: '40GRS', priceType: 'MAYORISTA' as PriceType, price: 0 },
{ section: 'RAW' as PriceSection, product: 'CORNALITOS', weight: '30GRS', priceType: 'MAYORISTA' as PriceType, price: 0 },
{ section: 'RAW' as PriceSection, product: 'TRAQUEA', weight: 'X1', priceType: 'MAYORISTA' as PriceType, price: 0 },
{ section: 'RAW' as PriceSection, product: 'TRAQUEA', weight: 'X2', priceType: 'MAYORISTA' as PriceType, price: 0 },
{ section: 'RAW' as PriceSection, product: 'OREJA', weight: 'X1', priceType: 'MAYORISTA' as PriceType, price: 0 },
{ section: 'RAW' as PriceSection, product: 'OREJA', weight: 'X50', priceType: 'MAYORISTA' as PriceType, price: 0 },
{ section: 'RAW' as PriceSection, product: 'OREJAS', weight: 'X100', priceType: 'MAYORISTA' as PriceType, price: 0 },
```

### 2. Función `initializeBarferPrices` (líneas ~1155-1165)

Esta función se usa para la inicialización inicial de precios cuando la base de datos está vacía.

Los mismos 10 productos se agregaron a esta función con la misma estructura.

## Estructura de Datos

Los productos RAW siguen esta estructura:

```typescript
{
    section: 'RAW',
    product: string,      // Nombre del producto (ej: 'HIGADO', 'POLLO', 'TRAQUEA')
    weight: string,       // Peso o cantidad (ej: '100GRS', '40GRS', 'X1', 'X50')
    priceType: 'MAYORISTA',
    price: 0              // Precio inicial en 0 para ser configurado
}
```

## Diferencias con productos de otras secciones

### Productos PERRO/GATO:
- Tienen 3 tipos de precio: EFECTIVO, TRANSFERENCIA, MAYORISTA
- Ejemplos: BOX PERRO POLLO 5KG, BOX GATO VACA 5KG

### Productos OTROS:
- La mayoría tienen 3 tipos de precio (EFECTIVO, TRANSFERENCIA, MAYORISTA)
- Algunos solo tienen MAYORISTA (GARRAS, CORNALITOS, HUESOS RECREATIVOS, CALDO DE HUESOS)
- Ejemplos: HUESOS CARNOSOS 5KG, BOX DE COMPLEMENTOS

### Productos RAW (nuevos):
- **Solo tienen tipo MAYORISTA**
- Solo disponibles para clientes mayoristas
- Porciones más pequeñas (gramos) o por unidades
- Ejemplos: HIGADO 100GRS, POLLO 40GRS, TRAQUEA X1, OREJA X50

## Notas sobre el campo Weight

El campo `weight` se usa de forma flexible:

1. **Para pesos reales:** Se usa la unidad (ej: "100GRS", "40GRS", "30GRS")
2. **Para cantidades:** Se usa "X" + número (ej: "X1", "X2", "X50", "X100")
3. **Sin peso/cantidad:** Se usa `undefined` (ej: GARRAS, CALDO DE HUESOS)

## Uso

### Para inicializar precios de un mes nuevo:

1. Ir a `/admin/prices`
2. Hacer clic en "Inicializar Mes Nuevo"
3. Seleccionar el mes y año
4. Los productos RAW se crearán automáticamente con precio 0
5. Editar los precios según corresponda

### Para clientes mayoristas:

Los productos RAW ahora estarán disponibles automáticamente en el selector de productos cuando:
- El tipo de orden sea "mayorista"
- Se esté creando o editando una orden

## Validaciones

- Los productos RAW **solo** se muestran para órdenes mayoristas
- Los productos RAW **no** aparecen para clientes minoristas
- Los productos RAW solo tienen precio tipo MAYORISTA

## Consistencia con otros servicios

Los nombres de productos RAW deben coincidir con:

1. **Cálculo de precios** (`pricesCalculationService.ts` y `exactPricesCalculationService.ts`)
2. **Mapeo de productos** (`productMapping.ts`)
3. **Helpers de órdenes** (`helpers.ts` en `/admin/table`)

Asegúrate de que los nombres sean exactamente iguales en mayúsculas:
- ✅ "HIGADO" (correcto)
- ❌ "higado" (incorrecto)
- ❌ "Higado" (incorrecto)

## Fecha

2 de Octubre de 2025
