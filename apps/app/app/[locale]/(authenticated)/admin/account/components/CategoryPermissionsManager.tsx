'use client'

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/design-system/components/ui/card';
import { Button } from '@repo/design-system/components/ui/button';
import { Checkbox } from '@repo/design-system/components/ui/checkbox';
import { Badge } from '@repo/design-system/components/ui/badge';
import { Separator } from '@repo/design-system/components/ui/separator';
import { Alert, AlertDescription } from '@repo/design-system/components/ui/alert';
import { Eye, EyeOff, Shield, Users, Settings } from 'lucide-react';
import { toast } from '@repo/design-system/hooks/use-toast';
import { Dictionary } from '@repo/internationalization';
import { updateUserCategoryPermissions, getAvailableCategoriesAction } from '../actions';

// Funciones de permisos del cliente (definidas localmente para evitar importaciones problemáticas)
function getCategoryPermission(categoryName: string): string {
    return `outputs:view_category:${categoryName.toUpperCase()}`;
}

function hasAllCategoriesPermission(permissions: string[]): boolean {
    return permissions.includes('outputs:view_all_categories');
}

function getCategoryPermissionCount(permissions: string[]): number {
    return permissions.filter(p => p.startsWith('outputs:view_category:')).length;
}

interface CategoryPermissionsManagerProps {
    users: any[]; // Cambiar a any para compatibilidad
    currentUser: any; // Cambiar a any para compatibilidad
    dictionary: Dictionary;
}

interface CategoryPermission {
    name: string;
    permission: string;
    isRestricted: boolean;
}

export function CategoryPermissionsManager({
    users,
    currentUser,
    dictionary
}: CategoryPermissionsManagerProps) {
    const [availableCategories, setAvailableCategories] = useState<string[]>([]);
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const [userCategoryPermissions, setUserCategoryPermissions] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingCategories, setIsLoadingCategories] = useState(true);

    // Cargar categorías disponibles
    useEffect(() => {
        const loadCategories = async () => {
            try {
                const result = await getAvailableCategoriesAction();
                if (result.success) {
                    setAvailableCategories(result.categories);
                } else {
                    setAvailableCategories([]);
                }
            } catch (error) {
                console.error('Error loading categories:', error);
                toast({
                    title: "Error",
                    description: "No se pudieron cargar las categorías",
                    variant: "destructive"
                });
                setAvailableCategories([]);
            } finally {
                setIsLoadingCategories(false);
            }
        };

        loadCategories();
    }, []);

    // Generar permisos de categorías
    const categoryPermissions: CategoryPermission[] = availableCategories.map(category => ({
        name: category,
        permission: getCategoryPermission(category),
        isRestricted: false // Por defecto, todas las categorías están disponibles
    }));

    const handleUserSelect = (user: any) => {
        setSelectedUser(user);
        // Cargar permisos actuales del usuario
        const userPermissions = new Set<string>();
        if (Array.isArray(user.permissions)) {
            user.permissions.forEach((p: any) => {
                if (typeof p === 'string') {
                    userPermissions.add(p);
                }
            });
        }
        setUserCategoryPermissions(userPermissions);
    };

    const handlePermissionToggle = (permission: string, checked: boolean) => {
        const newPermissions = new Set(userCategoryPermissions);

        if (checked) {
            newPermissions.add(permission);
        } else {
            newPermissions.delete(permission);
        }

        setUserCategoryPermissions(newPermissions);
    };

    const handleSavePermissions = async () => {
        if (!selectedUser) return;

        setIsLoading(true);
        try {
            const updatedPermissions = Array.from(userCategoryPermissions);

            const result = await updateUserCategoryPermissions(selectedUser.id, updatedPermissions);

            if (result.success) {
                toast({
                    title: "Éxito",
                    description: result.message,
                });
                // Recargar la página para actualizar los datos
                window.location.reload();
            } else {
                toast({
                    title: "Error",
                    description: result.message,
                    variant: "destructive"
                });
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "No se pudieron guardar los permisos",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    const getUserPermissionCount = (user: any) => {
        const userPermissions = Array.isArray(user.permissions) ? user.permissions : [];
        return getCategoryPermissionCount(userPermissions);
    };

    const hasAllCategoriesPermissionForUser = (user: any) => {
        const userPermissions = Array.isArray(user.permissions) ? user.permissions : [];
        return hasAllCategoriesPermission(userPermissions);
    };

    if (isLoadingCategories) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Gestión de Permisos por Categoría
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-2 text-sm text-muted-foreground">Cargando categorías...</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Información del sistema */}
            <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                    <strong>Sistema de Permisos por Categoría:</strong> Los administradores pueden configurar qué categorías de salidas puede ver cada usuario.
                    Los usuarios solo verán las categorías para las que tienen permisos específicos.
                </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Lista de usuarios */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Usuarios
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {users.map((user) => {
                                const categoryCount = getUserPermissionCount(user);
                                const hasAllAccess = hasAllCategoriesPermissionForUser(user);

                                return (
                                    <div
                                        key={user.id}
                                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${selectedUser?.id === user.id
                                                ? 'border-primary bg-primary/5'
                                                : 'border-border hover:border-primary/50'
                                            }`}
                                        onClick={() => handleUserSelect(user)}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium">{user.name} {user.lastName}</p>
                                                <p className="text-sm text-muted-foreground">{user.email}</p>
                                            </div>
                                            <div className="text-right">
                                                {hasAllAccess ? (
                                                    <Badge variant="default" className="text-xs">
                                                        <Eye className="h-3 w-3 mr-1" />
                                                        Todas las categorías
                                                    </Badge>
                                                ) : categoryCount > 0 ? (
                                                    <Badge variant="secondary" className="text-xs">
                                                        <Eye className="h-3 w-3 mr-1" />
                                                        {categoryCount} categorías
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-xs">
                                                        <EyeOff className="h-3 w-3 mr-1" />
                                                        Sin permisos
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Configuración de permisos */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Settings className="h-5 w-5" />
                            Configurar Permisos
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {selectedUser ? (
                            <div className="space-y-4">
                                <div>
                                    <h4 className="font-medium mb-2">
                                        Permisos para: {selectedUser.name} {selectedUser.lastName}
                                    </h4>
                                    <p className="text-sm text-muted-foreground">
                                        Selecciona las categorías que este usuario puede ver
                                    </p>
                                </div>

                                <Separator />

                                {/* Opción para todas las categorías */}
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="all-categories"
                                        checked={userCategoryPermissions.has('outputs:view_all_categories')}
                                        onCheckedChange={(checked) =>
                                            handlePermissionToggle('outputs:view_all_categories', checked as boolean)
                                        }
                                    />
                                    <label
                                        htmlFor="all-categories"
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    >
                                        Ver todas las categorías
                                    </label>
                                </div>

                                <Separator />

                                {/* Categorías específicas */}
                                <div className="space-y-3">
                                    <h5 className="text-sm font-medium">Categorías específicas:</h5>
                                    {categoryPermissions.map((category) => (
                                        <div key={category.permission} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={category.permission}
                                                checked={userCategoryPermissions.has(category.permission)}
                                                onCheckedChange={(checked) =>
                                                    handlePermissionToggle(category.permission, checked as boolean)
                                                }
                                                disabled={userCategoryPermissions.has('outputs:view_all_categories')}
                                            />
                                            <label
                                                htmlFor={category.permission}
                                                className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                            >
                                                {category.name}
                                            </label>
                                        </div>
                                    ))}
                                </div>

                                <Separator />

                                <Button
                                    onClick={handleSavePermissions}
                                    disabled={isLoading}
                                    className="w-full"
                                >
                                    {isLoading ? 'Guardando...' : 'Guardar Permisos'}
                                </Button>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>Selecciona un usuario para configurar sus permisos</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
} 