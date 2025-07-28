#!/usr/bin/env tsx

import { ensureSueldosCategory } from '@repo/data-services';

/**
 * Script para inicializar categorías restringidas en el sistema
 * Este script debe ejecutarse una vez al desplegar el sistema
 */

async function initializeRestrictedCategories() {
    console.log('🚀 Inicializando categorías restringidas...');

    try {
        // Inicializar categoría SUELDOS
        console.log('📋 Verificando categoría SUELDOS...');
        const sueldosResult = await ensureSueldosCategory();

        if (sueldosResult.success) {
            console.log(`✅ ${sueldosResult.message}`);
            if (sueldosResult.categoria) {
                console.log(`   ID: ${sueldosResult.categoria.id}`);
                console.log(`   Nombre: ${sueldosResult.categoria.nombre}`);
            }
        } else {
            console.error(`❌ Error al crear categoría SUELDOS: ${sueldosResult.message}`);
        }

        console.log('\n🎉 Inicialización de categorías restringidas completada');
        console.log('\n📝 Notas importantes:');
        console.log('• La categoría SUELDOS está configurada como restringida');
        console.log('• Solo usuarios con permiso "outputs:view_sueldos" pueden ver salidas de esta categoría');
        console.log('• Los usuarios normales no verán las salidas con categoría SUELDOS');
        console.log('• Los administradores siempre pueden ver todas las categorías');

    } catch (error) {
        console.error('❌ Error durante la inicialización:', error);
        process.exit(1);
    }
}

// Ejecutar el script
if (require.main === module) {
    initializeRestrictedCategories()
        .then(() => {
            console.log('\n✅ Script completado exitosamente');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Error fatal:', error);
            process.exit(1);
        });
} 