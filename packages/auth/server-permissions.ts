import { getCurrentUser } from '@repo/data-services/src/services/authService';

/**
 * Sistema de permisos del lado del servidor
 */

// Tipos de permisos disponibles
export type Permission =
    // Analytics
    | 'analytics:view'
    | 'analytics:export'
    // Users
    | 'users:view'
    | 'users:create'
    | 'users:edit'
    | 'users:delete'
    // Account
    | 'account:view_own'
    | 'account:edit_own'
    | 'account:change_password'
    | 'account:manage_users'
    // Admin
    | 'admin:full_access'
    | 'admin:system_settings'
    // Clients
    | 'clients:view'
    | 'clients:create'
    | 'clients:edit'
    | 'clients:delete'
    | 'clients:view_analytics'
    // Table
    | 'table:view'
    | 'table:export'
    | 'table:delete'
    | 'table:edit'
    // Balance
    | 'balance:view'
    | 'balance:export'
    // Prices
    | 'prices:view'
    | 'prices:edit'
    // Balance  
    | 'balance:view'
    | 'balance:export'
    // Outputs/Salidas
    | 'outputs:view'
    | 'outputs:export'
    | 'outputs:create'
    | 'outputs:edit'
    | 'outputs:delete'
    | 'outputs:view_statistics'
    // Permisos dinámicos por categoría (se generan automáticamente)
    | 'outputs:view_all_categories'
    | `outputs:view_category:${string}`
    // Mayoristas
    | 'mayoristas:view'
    | 'mayoristas:create'
    | 'mayoristas:edit'
    | 'mayoristas:delete'

// Permisos por defecto para admins (siempre tienen todos)
export const ADMIN_PERMISSIONS: Permission[] = [
    'analytics:view',
    'analytics:export',
    'users:view',
    'users:create',
    'users:edit',
    'users:delete',
    'account:view_own',
    'account:edit_own',
    'account:change_password',
    'account:manage_users',
    'admin:full_access',
    'admin:system_settings',
    'clients:view',
    'clients:create',
    'clients:edit',
    'clients:delete',
    'clients:view_analytics',
    'table:view',
    'table:export',
    'table:delete',
    'table:edit',
    'balance:view',
    'balance:export',
    'prices:view',
    'prices:edit',
    'outputs:view',
    'outputs:export',
    'outputs:create',
    'outputs:edit',
    'outputs:delete',
    'outputs:view_statistics',
    'outputs:view_all_categories',
    'mayoristas:view',
    'mayoristas:create',
    'mayoristas:edit',
    'mayoristas:delete',
];

/**
 * Obtiene el usuario actual y sus permisos desde las cookies
 */
export async function getCurrentUserWithPermissions() {
    const user = await getCurrentUser();
    if (!user) {
        return null;
    }

    const isAdmin = user.role.toLowerCase() === 'admin';
    const isUser = user.role.toLowerCase() === 'user';

    // Si es admin, tiene todos los permisos siempre
    if (isAdmin) {
        return {
            ...user,
            permissions: ADMIN_PERMISSIONS,
            isAdmin: true,
            isUser: false,
        };
    }

    // Si es usuario normal, usar sus permisos personalizados
    if (isUser) {
        return {
            ...user,
            permissions: user.permissions, // Usar permisos del usuario desde la BD
            isAdmin: false,
            isUser: true,
        };
    }

    // Rol desconocido - sin permisos
    return {
        ...user,
        permissions: [],
        isAdmin: false,
        isUser: true,
    };
}

/**
 * Verifica si el usuario actual tiene un permiso específico
 */
export async function hasPermission(permission: Permission): Promise<boolean> {
    const userWithPermissions = await getCurrentUserWithPermissions();
    if (!userWithPermissions) return false;

    return userWithPermissions.permissions.includes(permission);
}

/**
 * Verifica si el usuario actual tiene todos los permisos especificados
 */
export async function hasAllPermissions(permissions: Permission[]): Promise<boolean> {
    const userWithPermissions = await getCurrentUserWithPermissions();
    if (!userWithPermissions) return false;

    return permissions.every(permission => userWithPermissions.permissions.includes(permission));
}

/**
 * Verifica si el usuario actual tiene al menos uno de los permisos especificados
 */
export async function hasAnyPermission(permissions: Permission[]): Promise<boolean> {
    const userWithPermissions = await getCurrentUserWithPermissions();
    if (!userWithPermissions) return false;

    return permissions.some(permission => userWithPermissions.permissions.includes(permission));
}

/**
 * Verifica si el usuario actual es administrador
 */
export async function isAdmin(): Promise<boolean> {
    const userWithPermissions = await getCurrentUserWithPermissions();
    return userWithPermissions?.isAdmin || false;
}

/**
 * Middleware para verificar permisos - lanza error si no tiene permisos
 */
export async function requirePermission(permission: Permission): Promise<void> {
    const hasAccess = await hasPermission(permission);
    if (!hasAccess) {
        throw new Error(`Access denied: Missing permission ${permission}`);
    }
}

/**
 * Middleware para verificar si es admin - lanza error si no es admin
 */
export async function requireAdmin(): Promise<void> {
    const userIsAdmin = await isAdmin();
    if (!userIsAdmin) {
        throw new Error('Access denied: Admin privileges required');
    }
}

/**
 * Verifica si el usuario puede ver una categoría específica de salidas
 */
export async function canViewSalidaCategory(categoryName: string): Promise<boolean> {
    const userWithPermissions = await getCurrentUserWithPermissions();
    if (!userWithPermissions) {
        return false;
    }

    // Log temporal para debug
    console.log(`🔍 Verificando categoría "${categoryName}" para usuario ${userWithPermissions.name}`);
    console.log(`  Permisos: ${userWithPermissions.permissions.join(', ')}`);

    // Los admins pueden ver todo
    if (userWithPermissions.isAdmin) {
        console.log(`  ✅ Admin - puede ver todo`);
        return true;
    }

    // Verificar si tiene el permiso general para ver todas las categorías
    if (userWithPermissions.permissions.includes('outputs:view_all_categories')) {
        console.log(`  ✅ Tiene permiso para ver todas las categorías`);
        return true;
    }

    // Verificar permisos específicos por categoría
    const categoryPermission = `outputs:view_category:${categoryName.toUpperCase()}`;
    if (userWithPermissions.permissions.includes(categoryPermission)) {
        console.log(`  ✅ Tiene permiso específico: ${categoryPermission}`);
        return true;
    }

    // Si no tiene permisos específicos para esta categoría, no puede verla
    console.log(`  ❌ No tiene permisos para esta categoría`);
    return false;
}

/**
 * Verifica si el usuario actual puede ver las estadísticas de salidas
 */
export async function canViewSalidaStatistics(): Promise<boolean> {
    const userWithPermissions = await getCurrentUserWithPermissions();
    if (!userWithPermissions) return false;

    // Los admins pueden ver las estadísticas
    if (userWithPermissions.isAdmin) return true;

    // Verificar si tiene el permiso específico para ver estadísticas
    return userWithPermissions.permissions.includes('outputs:view_statistics');
}

/**
 * Obtiene las categorías que el usuario puede ver
 */
export async function getViewableCategories(): Promise<string[]> {
    const userWithPermissions = await getCurrentUserWithPermissions();
    if (!userWithPermissions) return [];

    // Los admins pueden ver todas las categorías
    if (userWithPermissions.isAdmin) return ['*']; // '*' significa todas las categorías

    const viewableCategories: string[] = [];

    // Si tiene permiso para ver todas las categorías
    if (userWithPermissions.permissions.includes('outputs:view_all_categories')) {
        viewableCategories.push('*');
        return viewableCategories;
    }

    // Obtener permisos específicos por categoría
    for (const permission of userWithPermissions.permissions) {
        if (typeof permission === 'string' && permission.startsWith('outputs:view_category:')) {
            const categoryName = permission.replace('outputs:view_category:', '');
            viewableCategories.push(categoryName);
        }
    }

    return viewableCategories;
}

/**
 * Genera el permiso para una categoría específica
 */
export function getCategoryPermission(categoryName: string): string {
    return `outputs:view_category:${categoryName.toUpperCase()}`;
}

/**
 * Obtiene todas las categorías disponibles para asignar permisos
 */
export async function getAvailableCategoriesForPermissions(): Promise<string[]> {
    try {
        const { getAllCategorias } = await import('@repo/data-services');
        const result = await getAllCategorias();

        if (result.success && result.categorias) {
            return result.categorias.map(cat => cat.nombre);
        }

        return [];
    } catch (error) {
        console.error('Error getting available categories:', error);
        return [];
    }
}

/**
 * Configuración del sidebar basada en permisos
 */
export interface SidebarItem {
    label: string;
    mobileLabel: string;
    href: string;
    icon: string;
    requiredPermissions: Permission[];
    adminOnly?: boolean;
}

export const SIDEBAR_CONFIG: SidebarItem[] = [
    {
        label: 'analytics',
        mobileLabel: 'analyticsMobile',
        href: '/admin/analytics',
        icon: 'BarChart3',
        requiredPermissions: ['analytics:view'],
    },
    {
        label: 'clients',
        mobileLabel: 'clientsMobile',
        href: '/admin/clients',
        icon: 'Users',
        requiredPermissions: ['clients:view'],
    },
    {
        label: 'table',
        mobileLabel: 'tableMobile',
        href: '/admin/table',
        icon: 'Table',
        requiredPermissions: ['table:view'],
    },
    {
        label: 'balance',
        mobileLabel: 'balanceMobile',
        href: '/admin/balance',
        icon: 'TrendingUp',
        requiredPermissions: ['balance:view'],
    },
    {
        label: 'prices',
        mobileLabel: 'pricesMobile',
        href: '/admin/prices',
        icon: 'Receipt',
        requiredPermissions: ['prices:view'],
    },
    {
        label: 'outputs',
        mobileLabel: 'outputsMobile',
        href: '/admin/salidas',
        icon: 'MinusCircle',
        requiredPermissions: ['outputs:view'],
    },
    {
        label: 'repartos',
        mobileLabel: 'repartosMobile',
        href: '/admin/repartos',
        icon: 'Truck',
        requiredPermissions: ['table:view'], // Usar el mismo permiso que table por ahora
    },
    {
        label: 'mayoristas',
        mobileLabel: 'mayoristasMobile',
        href: '/admin/mayoristas',
        icon: 'Store',
        requiredPermissions: ['mayoristas:view'],
    },
];

/**
 * Obtiene los elementos del sidebar autorizados para el usuario actual
 */
export async function getAuthorizedSidebarItems(): Promise<SidebarItem[]> {
    const userWithPermissions = await getCurrentUserWithPermissions();
    if (!userWithPermissions) return [];

    const authorizedItems = [];

    for (const item of SIDEBAR_CONFIG) {
        // Si es adminOnly y el usuario no es admin, no incluir
        if (item.adminOnly && !userWithPermissions.isAdmin) {
            continue;
        }

        // Verificar si tiene todos los permisos requeridos
        const hasRequiredPermissions = item.requiredPermissions.every(
            permission => userWithPermissions.permissions.includes(permission)
        );

        if (hasRequiredPermissions) {
            authorizedItems.push(item);
        }
    }

    return authorizedItems;
} 