/**
 * Funciones de permisos que pueden usarse en el cliente
 */

/**
 * Genera el permiso para una categoría específica
 */
export function getCategoryPermission(categoryName: string): string {
    return `outputs:view_category:${categoryName.toUpperCase()}`;
}

/**
 * Verifica si un permiso es de categoría
 */
export function isCategoryPermission(permission: string): boolean {
    return permission.startsWith('outputs:view_category:');
}

/**
 * Extrae el nombre de la categoría de un permiso
 */
export function getCategoryNameFromPermission(permission: string): string {
    return permission.replace('outputs:view_category:', '');
}

/**
 * Obtiene todos los permisos de categoría de una lista de permisos
 */
export function getCategoryPermissions(permissions: string[]): string[] {
    return permissions.filter(isCategoryPermission);
}

/**
 * Verifica si un usuario tiene permiso para ver todas las categorías
 */
export function hasAllCategoriesPermission(permissions: string[]): boolean {
    return permissions.includes('outputs:view_all_categories');
}

/**
 * Verifica si un usuario tiene permiso para una categoría específica
 */
export function hasCategoryPermission(permissions: string[], categoryName: string): boolean {
    const categoryPermission = getCategoryPermission(categoryName);
    return permissions.includes(categoryPermission);
}

/**
 * Cuenta cuántos permisos de categoría tiene un usuario
 */
export function getCategoryPermissionCount(permissions: string[]): number {
    return getCategoryPermissions(permissions).length;
} 