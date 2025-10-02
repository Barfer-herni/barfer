/**
 * Script para normalizar y limpiar precios duplicados
 * 
 * Ejecutar con: pnpm tsx scripts/normalize-prices.ts
 */

import { normalizePricesCapitalization, removeDuplicatePrices } from '../packages/data-services/src/services/barfer/normalizePricesCapitalization';

async function main() {
    console.log('🚀 Iniciando normalización de precios...\n');

    // Paso 1: Normalizar capitalización
    console.log('📝 Paso 1: Normalizando capitalización a mayúsculas...');
    const normalizeResult = await normalizePricesCapitalization();

    if (normalizeResult.success) {
        console.log(`✅ ${normalizeResult.message}`);
        console.log(`   Actualizados: ${normalizeResult.updated} precios\n`);
    } else {
        console.error(`❌ Error: ${normalizeResult.error}\n`);
        process.exit(1);
    }

    // Paso 2: Eliminar duplicados
    console.log('🧹 Paso 2: Eliminando precios duplicados...');
    const removeResult = await removeDuplicatePrices();

    if (removeResult.success) {
        console.log(`✅ ${removeResult.message}`);
        console.log(`   Desactivados: ${removeResult.removed} precios duplicados\n`);
    } else {
        console.error(`❌ Error: ${removeResult.error}\n`);
        process.exit(1);
    }

    console.log('🎉 ¡Proceso completado exitosamente!');
    console.log('\n📊 Resumen:');
    console.log(`   - Precios normalizados: ${normalizeResult.updated}`);
    console.log(`   - Duplicados desactivados: ${removeResult.removed}`);

    process.exit(0);
}

main().catch(error => {
    console.error('💥 Error ejecutando el script:', error);
    process.exit(1);
});

