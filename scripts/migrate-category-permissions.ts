#!/usr/bin/env tsx

import { database } from '@repo/database/index';

/**
 * Script para migrar permisos existentes al nuevo sistema dinámico de categorías
 * Este script convierte permisos fijos a permisos dinámicos por categoría
 */

async function migrateCategoryPermissions() {
    console.log('🚀 Iniciando migración de permisos de categorías...');

    try {
        // Obtener todos los usuarios
        const users = await database.user.findMany();
        console.log(`📋 Encontrados ${users.length} usuarios para migrar`);

        let migratedCount = 0;
        let skippedCount = 0;

        for (const user of users) {
            const currentPermissions = Array.isArray(user.permissions) ? user.permissions : [];
            const newPermissions = [...currentPermissions];

            // Mapear permisos antiguos a nuevos
            const permissionMappings = {
                'outputs:view_sueldos': ['outputs:view_category:SUELDOS', 'outputs:view_category:SALARIOS'],
                'outputs:view_sensitive_data': ['outputs:view_category:BONIFICACIONES', 'outputs:view_category:COMISIONES', 'outputs:view_category:PRESTACIONES'],
                'outputs:view_restricted_categories': ['outputs:view_all_categories']
            };

            let hasChanges = false;

            // Migrar permisos antiguos
            for (const [oldPermission, newPermissions] of Object.entries(permissionMappings)) {
                if (currentPermissions.includes(oldPermission)) {
                    // Remover permiso antiguo
                    const index = newPermissions.indexOf(oldPermission);
                    if (index > -1) {
                        newPermissions.splice(index, 1);
                    }

                    // Agregar nuevos permisos
                    for (const newPermission of newPermissions) {
                        if (!newPermissions.includes(newPermission)) {
                            newPermissions.push(newPermission);
                            hasChanges = true;
                        }
                    }
                }
            }

            // Actualizar usuario si hay cambios
            if (hasChanges) {
                await database.user.update({
                    where: { id: user.id },
                    data: { permissions: newPermissions }
                });
                migratedCount++;
                console.log(`✅ Migrado usuario: ${user.name} ${user.lastName}`);
            } else {
                skippedCount++;
                console.log(`⏭️  Saltado usuario: ${user.name} ${user.lastName} (sin cambios necesarios)`);
            }
        }

        console.log('\n🎉 Migración completada exitosamente');
        console.log(`📊 Resumen:`);
        console.log(`   • Usuarios migrados: ${migratedCount}`);
        console.log(`   • Usuarios saltados: ${skippedCount}`);
        console.log(`   • Total procesados: ${users.length}`);

        console.log('\n📝 Notas importantes:');
        console.log('• Los permisos antiguos han sido convertidos a permisos dinámicos por categoría');
        console.log('• Los administradores mantienen acceso completo automáticamente');
        console.log('• Los usuarios normales ahora tienen permisos específicos por categoría');
        console.log('• Puedes gestionar permisos desde Admin > Account > Permisos por Categoría');

    } catch (error) {
        console.error('❌ Error durante la migración:', error);
        process.exit(1);
    }
}

// Ejecutar el script
if (require.main === module) {
    migrateCategoryPermissions()
        .then(() => {
            console.log('\n✅ Script de migración completado exitosamente');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Error fatal:', error);
            process.exit(1);
        });
} 