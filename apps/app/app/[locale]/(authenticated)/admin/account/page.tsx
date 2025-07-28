import { getCurrentUser } from '@repo/data-services/src/services/authService';
import { getAllUsers } from '@repo/data-services/src/services/userService';
import { getDictionary } from '@repo/internationalization';
import { hasPermission, requirePermission } from '@repo/auth/server-permissions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/design-system/components/ui/tabs';
import { ProfileSection } from './components/ProfileSection';
import { PasswordSection } from './components/PasswordSection';
import { UsersSection } from './components/UsersSection';
import { CategoryPermissionsManager } from './components/CategoryPermissionsManager';

interface AccountPageProps {
    params: Promise<{ locale: string }>;
}

export default async function AccountPage({ params }: AccountPageProps) {
    // Verificar permisos básicos
    await requirePermission('account:view_own');
    const { locale } = await params;

    // Obtener datos en el servidor
    const [currentUser, dictionary] = await Promise.all([
        getCurrentUser(),
        getDictionary(locale)
    ]);

    if (!currentUser) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <p className="text-muted-foreground">Usuario no encontrado</p>
                </div>
            </div>
        );
    }

    // Verificar si puede gestionar usuarios para obtener la lista
    const canManageUsers = await hasPermission('account:manage_users');
    const users = canManageUsers ? await getAllUsers(currentUser.id) : []; // Excluir al usuario actual

    return (
        <div className="space-y-6 p-4 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h1 className="text-2xl md:text-3xl font-bold">
                    Gestión de Cuenta
                </h1>
                <div className="text-sm text-muted-foreground">
                    Configuración y usuarios
                </div>
            </div>

            <Tabs defaultValue="profile" className="space-y-4">
                <div className="overflow-x-auto">
                    <TabsList className={`grid w-full ${canManageUsers ? 'grid-cols-3' : 'grid-cols-1'} min-w-[300px] md:min-w-0`}>
                        <TabsTrigger value="profile" className="text-sm">
                            Mi Perfil
                        </TabsTrigger>
                        {canManageUsers && (
                            <>
                                <TabsTrigger value="users" className="text-sm">
                                    Gestión de Usuarios
                                </TabsTrigger>
                                <TabsTrigger value="permissions" className="text-sm">
                                    Permisos por Categoría
                                </TabsTrigger>
                            </>
                        )}
                    </TabsList>
                </div>

                <TabsContent value="profile" className="space-y-4">
                    <ProfileSection currentUser={currentUser} dictionary={dictionary} />
                    <PasswordSection currentUser={currentUser} dictionary={dictionary} />
                </TabsContent>

                {canManageUsers && (
                    <>
                        <TabsContent value="users" className="space-y-4">
                            <UsersSection
                                users={users}
                                currentUser={currentUser}
                                dictionary={dictionary}
                            />
                        </TabsContent>
                        <TabsContent value="permissions" className="space-y-4">
                            <CategoryPermissionsManager
                                users={users}
                                currentUser={currentUser}
                                dictionary={dictionary}
                            />
                        </TabsContent>
                    </>
                )}
            </Tabs>
        </div>
    );
} 