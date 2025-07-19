import 'server-only';

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
    // Outputs
    | 'outputs:view'
    | 'outputs:export'

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
        label: 'account',
        mobileLabel: 'accountMobile',
        href: '/admin/account',
        icon: 'User',
        requiredPermissions: ['account:view_own'],
    },
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
        icon: 'Receipt',
        requiredPermissions: ['balance:view'],
    },
    {
        label: 'prices',
        mobileLabel: 'pricesMobile',
        href: '/admin/prices',
        icon: 'Tags',
        requiredPermissions: ['prices:view'],
    },
    {
        label: 'outputs',
        mobileLabel: 'outputsMobile',
        href: '/admin/outputs',
        icon: 'TrendingUp',
        requiredPermissions: ['outputs:view'],
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