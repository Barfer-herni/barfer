// Exportar funciones del servidor
export * from './server-permissions';

// Exportar funciones del cliente (con alias para evitar conflictos)
export {
    getCategoryPermission as getCategoryPermissionClient,
    isCategoryPermission,
    getCategoryNameFromPermission,
    getCategoryPermissions,
    hasAllCategoriesPermission as hasAllCategoriesPermissionClient,
    hasCategoryPermission,
    getCategoryPermissionCount,
    getAvailableCategoriesForPermissions as getAvailableCategoriesForPermissionsClient
} from './client-permissions';

// Exportar componentes
export * from './components/PermissionGate';
export * from './components/sign-in';
export * from './components/sign-up'; 