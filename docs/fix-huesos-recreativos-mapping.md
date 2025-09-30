# Fix: Bug en mapeo de HUESOS RECREATIVOS

## Descripción del Problema

Cuando se creaba una orden con el producto **HUESOS RECREATIVOS**, el precio se calculaba correctamente pero al guardar la orden, el producto se guardaba incorrectamente como **HUESOS CARNOSOS**.

## Causa Raíz

El bug estaba en el archivo `/packages/data-services/src/services/barfer/productMapping.ts`, específicamente en la función `mapSelectOptionToDBFormat`.

El problema era el orden de las verificaciones de productos que contienen "huesos":

```typescript
// CÓDIGO ANTERIOR (INCORRECTO)
// Mapear Huesos (pero no si es caldo de huesos)
if (normalizedSelect.includes('huesos') && !normalizedSelect.includes('caldo')) {
    return { name: 'HUESOS CARNOSOS', option: '5KG' };
}

// Esta verificación nunca se alcanzaba porque la anterior ya capturaba todos los "huesos"
if (normalizedSelect.includes('hueso recreativo')) {
    return { name: 'HUESO RECREATIVO', option: '' };
}
```

### ¿Por qué fallaba?

Cuando el usuario seleccionaba "OTROS - HUESOS RECREATIVOS":
1. La función `mapSelectOptionToDBFormat` recibía el texto del select
2. Evaluaba `normalizedSelect.includes('huesos')` → **true** ✅
3. Evaluaba `!normalizedSelect.includes('caldo')` → **true** ✅
4. Retornaba `{ name: 'HUESOS CARNOSOS', option: '5KG' }` ❌
5. Nunca llegaba a la verificación específica de "hueso recreativo"

## Solución

Se reorganizó el orden de las verificaciones para que la verificación específica de "HUESO RECREATIVO" ocurra **ANTES** de la verificación genérica de "huesos":

```typescript
// CÓDIGO NUEVO (CORRECTO)
// Mapear HUESO RECREATIVO - IMPORTANTE: debe ir ANTES que la verificación genérica de huesos
if (normalizedSelect.includes('hueso recreativo') || normalizedSelect.includes('huesos recreativos')) {
    return { name: 'HUESOS RECREATIVOS', option: '' };
}

// Mapear Huesos Carnosos (pero no si es caldo de huesos o hueso recreativo)
if (normalizedSelect.includes('huesos') && !normalizedSelect.includes('caldo') && !normalizedSelect.includes('recreativo')) {
    return { name: 'HUESOS CARNOSOS', option: '5KG' };
}
```

### Mejoras implementadas:

1. **Verificación específica primero**: La verificación de "HUESOS RECREATIVOS" ahora ocurre antes de la verificación genérica
2. **Múltiples variantes**: Se aceptan tanto "hueso recreativo" como "huesos recreativos" (singular y plural)
3. **Exclusión explícita**: La verificación de "huesos carnosos" ahora excluye explícitamente productos que contengan "recreativo"

## Archivos Modificados

- `/packages/data-services/src/services/barfer/productMapping.ts`: Función `mapSelectOptionToDBFormat` (líneas 157-165)

## Testing

Para verificar que el fix funciona correctamente:

1. Crear una nueva orden
2. Seleccionar el producto "OTROS - HUESOS RECREATIVOS"
3. Agregar una cantidad (ej: 1)
4. Calcular el precio (debería mostrar el precio correcto de HUESOS RECREATIVOS)
5. Guardar la orden
6. Verificar que el producto guardado en la base de datos sea "HUESOS RECREATIVOS" y no "HUESOS CARNOSOS"

## Lecciones Aprendidas

1. **Orden de verificaciones importa**: Cuando se tienen verificaciones con condiciones genéricas y específicas, las específicas deben ir primero
2. **Documentar con comentarios**: Los comentarios "IMPORTANTE: debe ir ANTES" ayudan a futuros desarrolladores a entender el orden crítico
3. **Verificaciones exhaustivas**: Incluir múltiples variantes (singular/plural) hace el código más robusto
4. **Exclusiones explícitas**: Agregar `!normalizedSelect.includes('recreativo')` hace que la intención del código sea más clara

## Fecha

30 de Septiembre de 2025
