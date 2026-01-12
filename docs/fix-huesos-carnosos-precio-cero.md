# Fix: Bug de Precio 0 en HUESOS CARNOSOS al Cambiar Medio de Pago

## Problema

Cuando se editaba un pedido en la tabla de órdenes que contenía el producto "HUESOS CARNOSOS - 5KG - x1" y se cambiaba el medio de pago (de efectivo a mercado pago o viceversa), el precio calculado automáticamente retornaba 0.

## Causa Raíz

El problema estaba en la función `parseFormattedProduct()` del archivo `/barfer/packages/data-services/src/services/barfer/exactPricesCalculationService.ts`.

### Flujo del Bug

1. **Formato en la Base de Datos:**
   - `section`: `'OTROS'`
   - `product`: `'HUESOS CARNOSOS 5KG'`
   - `weight`: `null`

2. **Formato en el Select del Frontend:**
   - `formattedName`: `'OTROS - HUESOS CARNOSOS 5KG'`
   - Al agregar cantidad visual: `'OTROS - HUESOS CARNOSOS 5KG - x1'`

3. **Problema en el Parseo:**
   - La función `parseFormattedProduct()` recibía: `"OTROS - HUESOS CARNOSOS 5KG - x1"`
   - El código intentaba parsear esto como: `section - product - weight`
   - Interpretaba incorrectamente:
     - `section`: `"OTROS"`
     - `product`: `"HUESOS CARNOSOS 5KG"`
     - `weight`: `"x1"` ❌ (incorrecto, debería ser `null`)
   
4. **Resultado:**
   - La búsqueda en la base de datos fallaba porque buscaba con `weight: "x1"` en lugar de `weight: null`
   - Retornaba precio 0

## Solución Implementada

### Parte 1: Fix en `exactPricesCalculationService.ts`

Se modificó la función `parseFormattedProduct()` para:

1. **Eliminar el sufijo de cantidad antes del parseo:**
   ```typescript
   // Eliminar cualquier sufijo de cantidad (ej: " - x1", " - x2", etc.)
   let cleanedProduct = formattedProduct.replace(/\s*-\s*x\d+\s*$/i, '').trim();
   ```

2. **Mejorar el manejo de HUESOS CARNOSOS:**
   ```typescript
   else if (section.toUpperCase() === 'OTROS' && 
            (product.toUpperCase().includes('HUESOS CARNOSOS') || product.toUpperCase().includes('HUESO CARNOSO'))) {
       // Normalizar "HUESO CARNOSO" a "HUESOS CARNOSOS"
       const normalizedProduct = product.toUpperCase().replace('HUESO CARNOSO', 'HUESOS CARNOSOS');
       
       // El producto ya viene con el peso incluido (ej: "HUESOS CARNOSOS 5KG")
       product = normalizedProduct;
       weight = null; // El peso está en el nombre del producto
   }
   ```

### Parte 2: Fix en `helpers.ts`

Se modificó la función `mapDBProductToSelectOption()` para agregar automáticamente "5KG" cuando el producto guardado en la BD es solo "HUESOS CARNOSOS" sin el peso:

```typescript
else if (dbProductName.startsWith('HUESOS CARNOSOS') || dbProductName.startsWith('HUESO CARNOSO')) {
    section = 'OTROS';
    // CORRECCIÓN: Si el producto es solo "HUESOS CARNOSOS" sin el peso, agregar "5KG"
    // porque en la BD de precios se almacena como "HUESOS CARNOSOS 5KG"
    if (dbProductName === 'HUESOS CARNOSOS' || dbProductName === 'HUESO CARNOSO') {
        product = 'HUESOS CARNOSOS 5KG';
    } else {
        product = dbProductName;
    }
    weight = '';
}
```

Este fix es necesario porque algunas órdenes antiguas tienen guardado el producto como "HUESOS CARNOSOS" sin el "5KG", pero en la colección de precios se almacena como "HUESOS CARNOSOS 5KG".

## Archivos Modificados

1. `/barfer/packages/data-services/src/services/barfer/exactPricesCalculationService.ts`
   - Función: `parseFormattedProduct()`
   - Líneas: 183-282
   - Cambio: Elimina sufijo de cantidad antes del parseo y mejora el manejo de HUESOS CARNOSOS

2. `/barfer/apps/app/app/[locale]/(authenticated)/admin/table/helpers.ts`
   - Función: `mapDBProductToSelectOption()`
   - Líneas: 716-732
   - Cambio: Agrega automáticamente "5KG" cuando el producto es solo "HUESOS CARNOSOS" sin peso

## Testing

Para verificar que el fix funciona:

1. Crear un pedido con "HUESOS CARNOSOS - 5KG - x1"
2. Guardar el pedido con medio de pago "efectivo"
3. Editar el pedido y cambiar el medio de pago a "mercado-pago"
4. Verificar que el precio se calcula correctamente (no retorna 0)
5. Cambiar de vuelta a "efectivo" y verificar nuevamente

## Logs de Debug

El fix incluye logs de debug para facilitar el troubleshooting:

```typescript
console.log(`🔧 [DEBUG] parseFormattedProduct - Original: "${formattedProduct}", Limpiado: "${cleanedProduct}"`);
console.log(`🦴 [DEBUG] HUESOS CARNOSOS parseado: section="${section}", product="${product}", weight="${weight}"`);
```

## Impacto

Este fix resuelve el bug sin afectar otros productos. La lógica de parseo para otros productos (BOX PERRO, BOX GATO, BIG DOG, etc.) permanece sin cambios.

## Fecha de Implementación

12 de enero de 2026

## Autor

Asistente AI (Claude Sonnet 4.5) - Solicitado por Nicolas

