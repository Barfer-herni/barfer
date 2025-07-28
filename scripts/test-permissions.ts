import { database } from '@repo/database';
import { canViewSalidaCategory } from '@repo/auth/server-permissions';

async function testPermissions() {
    console.log('🧪 Probando sistema de permisos...\n');

    try {
        // 1. Obtener todos los usuarios
        const users = await database.user.findMany({
            select: {
                id: true,
                name: true,
                lastName: true,
                email: true,
                role: true,
                permissions: true
            }
        });

        console.log(`📊 Encontrados ${users.length} usuarios:`);
        users.forEach((user: any) => {
            console.log(`  - ${user.name} ${user.lastName} (${user.email})`);
            console.log(`    Rol: ${user.role}`);
            console.log(`    Permisos: ${Array.isArray(user.permissions) ? user.permissions.join(', ') : 'Ninguno'}`);
            console.log('');
        });

        // 2. Obtener todas las categorías
        const categorias = await database.categoria.findMany({
            select: {
                id: true,
                nombre: true
            }
        });

        console.log(`📋 Encontradas ${categorias.length} categorías:`);
        categorias.forEach((cat: any) => {
            console.log(`  - ${cat.nombre}`);
        });
        console.log('');

        // 3. Simular permisos para un usuario específico
        const testUser = users.find((u: any) => u.role === 'user');
        if (testUser) {
            console.log(`🔍 Probando permisos para: ${testUser.name} ${testUser.lastName}`);

            // Simular diferentes configuraciones de permisos
            const testCases = [
                {
                    name: 'Sin permisos específicos',
                    permissions: ['outputs:view']
                },
                {
                    name: 'Con permiso para todas las categorías',
                    permissions: ['outputs:view', 'outputs:view_all_categories']
                },
                {
                    name: 'Con permisos específicos por categoría',
                    permissions: ['outputs:view', 'outputs:view_category:SUELDOS', 'outputs:view_category:ALIMENTOS']
                }
            ];

            for (const testCase of testCases) {
                console.log(`\n  📝 Caso: ${testCase.name}`);
                console.log(`    Permisos: ${testCase.permissions.join(', ')}`);

                // Actualizar temporalmente los permisos del usuario
                await database.user.update({
                    where: { id: testUser.id },
                    data: { permissions: testCase.permissions }
                });

                // Probar cada categoría
                for (const categoria of categorias) {
                    const canView = await canViewSalidaCategory(categoria.nombre);
                    console.log(`    ${categoria.nombre}: ${canView ? '✅ Puede ver' : '❌ No puede ver'}`);
                }
            }

            // Restaurar permisos originales
            await database.user.update({
                where: { id: testUser.id },
                data: { permissions: testUser.permissions }
            });
        }

        console.log('\n✅ Prueba completada');

    } catch (error) {
        console.error('❌ Error durante la prueba:', error);
    }
}

testPermissions(); 