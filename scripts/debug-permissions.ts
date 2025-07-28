import { database } from '../packages/database/index.js';
import { canViewSalidaCategory } from '../packages/auth/server-permissions.js';

async function debugPermissions() {
    console.log('🔍 Debuggeando sistema de permisos...\n');

    try {
        // 1. Obtener un usuario de prueba
        const testUser = await database.user.findFirst({
            where: { role: 'user' },
            select: {
                id: true,
                name: true,
                lastName: true,
                email: true,
                role: true,
                permissions: true
            }
        });

        if (!testUser) {
            console.log('❌ No se encontró ningún usuario de prueba');
            return;
        }

        console.log(`👤 Usuario de prueba: ${testUser.name} ${testUser.lastName}`);
        console.log(`📧 Email: ${testUser.email}`);
        console.log(`🏷️ Rol: ${testUser.role}`);
        console.log(`🔑 Permisos actuales: ${Array.isArray(testUser.permissions) ? testUser.permissions.join(', ') : 'Ninguno'}`);
        console.log('');

        // 2. Obtener todas las categorías
        const categorias = await database.categoria.findMany({
            select: {
                id: true,
                nombre: true
            }
        });

        console.log(`📋 Categorías disponibles (${categorias.length}):`);
        categorias.forEach((cat: any) => {
            console.log(`  - ${cat.nombre}`);
        });
        console.log('');

        // 3. Simular diferentes configuraciones de permisos
        const testCases = [
            {
                name: 'Sin permisos específicos (solo outputs:view)',
                permissions: ['outputs:view']
            },
            {
                name: 'Con permiso para todas las categorías',
                permissions: ['outputs:view', 'outputs:view_all_categories']
            },
            {
                name: 'Con permisos específicos por categoría',
                permissions: ['outputs:view', 'outputs:view_category:SUELDOS', 'outputs:view_category:ALIMENTOS']
            },
            {
                name: 'Sin ningún permiso',
                permissions: []
            }
        ];

        for (const testCase of testCases) {
            console.log(`\n🧪 Caso: ${testCase.name}`);
            console.log(`🔑 Permisos: ${testCase.permissions.join(', ')}`);

            // Actualizar temporalmente los permisos del usuario
            await database.user.update({
                where: { id: testUser.id },
                data: { permissions: testCase.permissions }
            });

            console.log('📊 Resultados por categoría:');
            // Probar cada categoría
            for (const categoria of categorias) {
                const canView = await canViewSalidaCategory(categoria.nombre);
                console.log(`  ${categoria.nombre}: ${canView ? '✅ Puede ver' : '❌ No puede ver'}`);
            }
        }

        // Restaurar permisos originales
        await database.user.update({
            where: { id: testUser.id },
            data: { permissions: testUser.permissions }
        });

        console.log('\n✅ Debug completado');

    } catch (error) {
        console.error('❌ Error durante el debug:', error);
    }
}

debugPermissions(); 