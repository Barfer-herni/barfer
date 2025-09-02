import { getCurrentUserWithPermissions } from '@repo/auth/server-permissions';
import { hasPermission } from '@repo/auth/server-permissions';

async function testPricesPermissions() {
    console.log('🔍 Probando sistema de permisos de precios...\n');

    try {
        // Obtener usuario actual con permisos
        const userWithPermissions = await getCurrentUserWithPermissions();

        if (!userWithPermissions) {
            console.log('❌ No hay usuario autenticado');
            return;
        }

        console.log('👤 Usuario:', userWithPermissions.name);
        console.log('📧 Email:', userWithPermissions.email);
        console.log('🎭 Rol:', userWithPermissions.role);
        console.log('🔑 Permisos:', userWithPermissions.permissions);
        console.log('');

        // Verificar permisos específicos de precios
        const canViewPrices = await hasPermission('prices:view');
        const canEditPrices = await hasPermission('prices:edit');

        console.log('📊 Permisos de precios:');
        console.log('  - Ver precios (prices:view):', canViewPrices ? '✅' : '❌');
        console.log('  - Editar precios (prices:edit):', canEditPrices ? '✅' : '❌');
        console.log('');

        // Verificar si tiene todos los permisos de admin
        const isAdmin = userWithPermissions.role.toLowerCase() === 'admin';
        console.log('👑 Es admin:', isAdmin ? '✅' : '❌');

        if (isAdmin) {
            console.log('💡 Los admins tienen todos los permisos automáticamente');
        } else {
            console.log('💡 Usuario regular - permisos basados en la lista de permisos');
        }

        console.log('\n🎯 Resultado:');
        if (canViewPrices && canEditPrices) {
            console.log('✅ Usuario puede VER y EDITAR precios');
        } else if (canViewPrices && !canEditPrices) {
            console.log('👁️ Usuario puede SOLO VER precios (no puede editar)');
        } else if (!canViewPrices) {
            console.log('🚫 Usuario NO puede ver precios');
        }

    } catch (error) {
        console.error('❌ Error al probar permisos:', error);
    }
}

testPricesPermissions();
