'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/design-system/components/ui/card';
import { Button } from '@repo/design-system/components/ui/button';
import { Input } from '@repo/design-system/components/ui/input';
import { Label } from '@repo/design-system/components/ui/label';
import { Badge } from '@repo/design-system/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/design-system/components/ui/select';
import { Switch } from '@repo/design-system/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@repo/design-system/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@repo/design-system/components/ui/alert-dialog';
import { useToast } from '@repo/design-system/hooks/use-toast';
import { User, Mail, Plus, Edit, Trash2, AlertCircle } from 'lucide-react';
import type { UserData } from '@repo/data-services/src/types/user';
import type { UserRole, PuntoEnvio } from '@repo/data-services';
import type { Dictionary } from '@repo/internationalization';
import { createUser, updateUser, deleteUser } from '../actions';

interface UsersSectionProps {
    users: UserData[];
    currentUser: any;
    dictionary: Dictionary;
}

export function UsersSection({ users, currentUser, dictionary }: UsersSectionProps) {
    const { toast } = useToast();
    const router = useRouter();
    const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UserData | null>(null);
    const [deleteUserDialog, setDeleteUserDialog] = useState<{ open: boolean; user: UserData | null }>({ open: false, user: null });
    const [isPending, startTransition] = useTransition();
    const [puntosEnvio, setPuntosEnvio] = useState<PuntoEnvio[]>([]);

    const [userForm, setUserForm] = useState({
        name: '',
        lastName: '',
        email: '',
        password: '',
        role: 'user' as UserRole,
        permissions: [] as string[],
        puntoEnvio: '',
    });

    // Cargar puntos de envío
    useEffect(() => {
        const loadPuntosEnvio = async () => {
            try {
                const { getAllPuntosEnvioAction } = await import('../../express/actions');
                const result = await getAllPuntosEnvioAction();
                if (result.success && result.puntosEnvio) {
                    setPuntosEnvio(result.puntosEnvio);
                }
            } catch (error) {
                console.error('Error loading puntos de envío:', error);
            }
        };
        loadPuntosEnvio();
    }, []);

    const handleCreateUser = () => {
        setEditingUser(null);
        setUserForm({
            name: '',
            lastName: '',
            email: '',
            password: '',
            role: 'user',
            permissions: [
                'account:view_own',    // Permiso básico por defecto
                'account:edit_own',    // Puede editar su perfil
                'account:change_password', // Puede cambiar su contraseña
                'analytics:view',      // Ver estadísticas básicas
                'clients:view',        // Ver clientes
                'table:view',          // Ver órdenes
                'table:edit',          // Editar órdenes
                'table:delete',        // Eliminar órdenes
                'prices:view',         // Ver precios
                'balance:view',        // Ver balance
                'outputs:view',        // Ver salidas
                'outputs:create',      // Crear salidas
                'outputs:edit',        // Editar salidas
                'outputs:delete',      // Eliminar salidas
                'outputs:view_statistics', // Ver estadísticas de salidas
            ], // Permisos básicos por defecto para usuarios normales
            puntoEnvio: '',
        });
        setIsUserDialogOpen(true);
    };

    const handleEditUser = (user: UserData) => {
        setEditingUser(user);
        setUserForm({
            name: user.name,
            lastName: user.lastName,
            email: user.email,
            password: '',
            role: user.role as UserRole,
            permissions: user.permissions || [],
            puntoEnvio: user.puntoEnvio || '',
        });
        setIsUserDialogOpen(true);
    };

    const handleUserSubmit = async () => {
        console.log('🔵 handleUserSubmit llamado', { editingUser: !!editingUser, userForm });
        
        // Validaciones básicas del lado del cliente para UX
        if (!userForm.name || !userForm.lastName || !userForm.email) {
            console.log('❌ Validación fallida: nombre, apellido o email faltante');
            toast({ title: "Error", description: "Nombre, apellido y email son requeridos", variant: "destructive" });
            return;
        }
        if (!editingUser && !userForm.password) {
            console.log('❌ Validación fallida: contraseña faltante para nuevo usuario');
            toast({ title: "Error", description: "La contraseña es requerida para nuevos usuarios", variant: "destructive" });
            return;
        }
        if (userForm.password && userForm.password.length < 6) {
            console.log('❌ Validación fallida: contraseña muy corta', { passwordLength: userForm.password.length });
            toast({ title: "Error", description: "La contraseña debe tener al menos 6 caracteres", variant: "destructive" });
            return;
        }
        
        console.log('✅ Todas las validaciones pasaron, procediendo con startTransition');

        startTransition(async () => {
            console.log('🟡 startTransition ejecutado');
            try {
                const formData = new FormData();
                formData.append('name', userForm.name);
                formData.append('lastName', userForm.lastName);
                formData.append('email', userForm.email);
                formData.append('password', userForm.password);
                formData.append('role', userForm.role);
                formData.append('permissions', JSON.stringify(userForm.permissions));
                if (userForm.puntoEnvio && userForm.puntoEnvio !== '__none__') {
                    formData.append('puntoEnvio', userForm.puntoEnvio);
                }

                console.log('🟢 Llamando a createUser/updateUser', { 
                    isEditing: !!editingUser,
                    formDataEntries: Array.from(formData.entries())
                });

                const result = editingUser
                    ? await updateUser(editingUser.id, formData)
                    : await createUser(formData);

                console.log('🟣 Resultado recibido', result);

                if (result.success) {
                    toast({
                        title: "Éxito",
                        description: result.message,
                    });
                    setIsUserDialogOpen(false);
                    router.refresh();
                } else {
                    toast({
                        title: "Error",
                        description: result.message,
                        variant: "destructive",
                    });
                }
            } catch (error) {
                console.error('🔴 Error en handleUserSubmit:', error);
                toast({
                    title: "Error",
                    description: error instanceof Error ? error.message : 'Error desconocido',
                    variant: "destructive",
                });
            }
        });
    };

    const handleDeleteUser = async (user: UserData) => {
        startTransition(async () => {
            const result = await deleteUser(user.id);
            if (result.success) {
                toast({
                    title: "Éxito",
                    description: result.message,
                });
                setDeleteUserDialog({ open: false, user: null });
                router.refresh();
            } else {
                toast({
                    title: "Error",
                    description: result.message,
                    variant: "destructive",
                });
            }
        });
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex-1">
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                Usuarios del Sistema
                            </CardTitle>
                            <CardDescription>
                                Gestiona los usuarios y sus permisos
                            </CardDescription>
                        </div>
                        <Button className="w-full sm:w-auto" onClick={handleCreateUser}>
                            <Plus className="h-4 w-4 mr-2" />
                            Nuevo Usuario
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {users.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-muted-foreground">
                                    No hay usuarios registrados
                                </p>
                            </div>
                        ) : (
                            users.map((user) => (
                                <div key={user.id} className="flex flex-col lg:flex-row lg:items-center justify-between p-4 border rounded-lg gap-4">
                                    <div className="flex items-center gap-4 flex-1">
                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                            <span className="text-sm font-medium">
                                                {user.name[0]}{user.lastName[0]}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">
                                                {user.name} {user.lastName}
                                            </p>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Mail className="h-3 w-3 shrink-0" />
                                                <span className="truncate">{user.email}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                        <div className="flex-1 sm:text-right space-y-1">
                                            <div className="flex flex-col gap-1">
                                                <Badge
                                                    variant={user.role === 'admin' ? 'default' : 'secondary'}
                                                    className="w-fit"
                                                >
                                                    {user.role === 'admin' ? 'Administrador' : 'Usuario'}
                                                </Badge>
                                                <Badge
                                                    variant={user.permissions.length > 0 ? 'default' : 'destructive'}
                                                    className="w-fit text-xs"
                                                >
                                                    {user.permissions.length > 0 ? `✓ ${user.permissions.length} permisos` : '✗ Sin permisos'}
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                Creado: {new Date(user.createdAt).toLocaleDateString('es-ES')}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleEditUser(user)}
                                                disabled={isPending}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setDeleteUserDialog({ open: true, user })}
                                                disabled={user.id === currentUser?.id || isPending}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>

            <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
                <DialogContent className="max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {editingUser ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
                        </DialogTitle>
                        <DialogDescription>
                            {editingUser ?
                                'Actualiza la información del usuario' :
                                'Completa los campos para crear un nuevo usuario'
                            }
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="user-name">Nombre</Label>
                                <Input
                                    id="user-name"
                                    value={userForm.name}
                                    onChange={(e) => setUserForm(prev => ({ ...prev, name: e.target.value }))}
                                    disabled={isPending}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="user-lastName">Apellido</Label>
                                <Input
                                    id="user-lastName"
                                    value={userForm.lastName}
                                    onChange={(e) => setUserForm(prev => ({ ...prev, lastName: e.target.value }))}
                                    disabled={isPending}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="user-email">Email</Label>
                            <Input
                                id="user-email"
                                type="email"
                                value={userForm.email}
                                onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                                disabled={isPending}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="user-password">
                                Contraseña
                                {editingUser && ' (dejar vacío para no cambiar)'}
                            </Label>
                            <Input
                                id="user-password"
                                type="password"
                                value={userForm.password}
                                onChange={(e) => setUserForm(prev => ({ ...prev, password: e.target.value }))}
                                disabled={isPending}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="user-role">Rol</Label>
                            <Select
                                value={userForm.role}
                                onValueChange={(value: UserRole) => setUserForm(prev => ({ ...prev, role: value }))}
                                disabled={isPending}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="admin">Administrador</SelectItem>
                                    <SelectItem value="user">Usuario</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="user-puntoEnvio">Punto de Envío (opcional)</Label>
                            <Select
                                value={userForm.puntoEnvio || '__none__'}
                                onValueChange={(value) => setUserForm(prev => ({ ...prev, puntoEnvio: value === '__none__' ? '' : value }))}
                                disabled={isPending}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Ninguno (ver todos los puntos de envío)" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__none__">Ninguno (ver todos los puntos de envío)</SelectItem>
                                    {puntosEnvio.filter(p => p.nombre && p.nombre.trim() !== '').map((punto) => (
                                        <SelectItem key={String(punto._id)} value={punto.nombre!}>
                                            {punto.nombre}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                Si se asigna un punto de envío, el usuario solo verá órdenes y stock de ese punto
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label>Permisos del Usuario</Label>
                            <div className="max-h-60 overflow-y-auto space-y-4 p-4 border rounded-lg">
                                {/* Permisos de Vista */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                                        <Label className="text-sm font-medium text-blue-700 dark:text-blue-400">Permisos de Vista</Label>
                                    </div>
                                    <div className="ml-4 space-y-2">
                                        <div className="flex items-center space-x-2">
                                            <Switch
                                                checked={userForm.permissions.includes('analytics:view')}
                                                onCheckedChange={(checked) => {
                                                    if (checked) setUserForm(prev => ({ ...prev, permissions: [...prev.permissions, 'analytics:view'] }));
                                                    else setUserForm(prev => ({ ...prev, permissions: prev.permissions.filter(p => p !== 'analytics:view') }));
                                                }}
                                                disabled={isPending}
                                            />
                                            <Label className="text-sm">Ver estadísticas</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Switch
                                                checked={userForm.permissions.includes('clients:view')}
                                                onCheckedChange={(checked) => {
                                                    if (checked) setUserForm(prev => ({ ...prev, permissions: [...prev.permissions, 'clients:view'] }));
                                                    else setUserForm(prev => ({ ...prev, permissions: prev.permissions.filter(p => p !== 'clients:view') }));
                                                }}
                                                disabled={isPending}
                                            />
                                            <Label className="text-sm">Ver clientes</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Switch
                                                checked={userForm.permissions.includes('clients:view_analytics')}
                                                onCheckedChange={(checked) => {
                                                    if (checked) setUserForm(prev => ({ ...prev, permissions: [...prev.permissions, 'clients:view_analytics'] }));
                                                    else setUserForm(prev => ({ ...prev, permissions: prev.permissions.filter(p => p !== 'clients:view_analytics') }));
                                                }}
                                                disabled={isPending}
                                            />
                                            <Label className="text-sm">Ver gestión de clientes (analytics)</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Switch
                                                checked={userForm.permissions.includes('clients:send_email')}
                                                onCheckedChange={(checked) => {
                                                    if (checked) setUserForm(prev => ({ ...prev, permissions: [...prev.permissions, 'clients:send_email'] }));
                                                    else setUserForm(prev => ({ ...prev, permissions: prev.permissions.filter(p => p !== 'clients:send_email') }));
                                                }}
                                                disabled={isPending}
                                            />
                                            <Label className="text-sm">Enviar emails a clientes</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Switch
                                                checked={userForm.permissions.includes('clients:send_whatsapp')}
                                                onCheckedChange={(checked) => {
                                                    if (checked) setUserForm(prev => ({ ...prev, permissions: [...prev.permissions, 'clients:send_whatsapp'] }));
                                                    else setUserForm(prev => ({ ...prev, permissions: prev.permissions.filter(p => p !== 'clients:send_whatsapp') }));
                                                }}
                                                disabled={isPending}
                                            />
                                            <Label className="text-sm">Enviar WhatsApp a clientes</Label>
                                        </div>
                                    </div>
                                </div>

                                {/* Permisos de Edición */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-orange-500"></div>
                                        <Label className="text-sm font-medium text-orange-700 dark:text-orange-400">Permisos de Edición</Label>
                                    </div>
                                    <div className="ml-4 space-y-2">
                                        <div className="flex items-center space-x-2">
                                            <Switch
                                                checked={userForm.permissions.includes('account:edit_own')}
                                                onCheckedChange={(checked) => {
                                                    if (checked) setUserForm(prev => ({ ...prev, permissions: [...prev.permissions, 'account:edit_own'] }));
                                                    else setUserForm(prev => ({ ...prev, permissions: prev.permissions.filter(p => p !== 'account:edit_own') }));
                                                }}
                                                disabled={isPending}
                                            />
                                            <Label className="text-sm">Editar su propio perfil</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Switch
                                                checked={userForm.permissions.includes('account:change_password')}
                                                onCheckedChange={(checked) => {
                                                    if (checked) setUserForm(prev => ({ ...prev, permissions: [...prev.permissions, 'account:change_password'] }));
                                                    else setUserForm(prev => ({ ...prev, permissions: prev.permissions.filter(p => p !== 'account:change_password') }));
                                                }}
                                                disabled={isPending}
                                            />
                                            <Label className="text-sm">Cambiar su contraseña</Label>
                                        </div>
                                    </div>
                                </div>

                                {/* Permisos de Órdenes */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-green-500"></div>
                                        <Label className="text-sm font-medium text-green-700 dark:text-green-400">Permisos de Órdenes</Label>
                                    </div>
                                    <div className="ml-4 space-y-2">
                                        <div className="flex items-center space-x-2">
                                            <Switch
                                                checked={userForm.permissions.includes('table:view')}
                                                onCheckedChange={(checked) => {
                                                    if (checked) setUserForm(prev => ({ ...prev, permissions: [...prev.permissions, 'table:view'] }));
                                                    else setUserForm(prev => ({ ...prev, permissions: prev.permissions.filter(p => p !== 'table:view') }));
                                                }}
                                                disabled={isPending}
                                            />
                                            <Label className="text-sm">Ver órdenes</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Switch
                                                checked={userForm.permissions.includes('table:edit')}
                                                onCheckedChange={(checked) => {
                                                    if (checked) setUserForm(prev => ({ ...prev, permissions: [...prev.permissions, 'table:edit'] }));
                                                    else setUserForm(prev => ({ ...prev, permissions: prev.permissions.filter(p => p !== 'table:edit') }));
                                                }}
                                                disabled={isPending}
                                            />
                                            <Label className="text-sm">Editar órdenes</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Switch
                                                checked={userForm.permissions.includes('table:delete')}
                                                onCheckedChange={(checked) => {
                                                    if (checked) setUserForm(prev => ({ ...prev, permissions: [...prev.permissions, 'table:delete'] }));
                                                    else setUserForm(prev => ({ ...prev, permissions: prev.permissions.filter(p => p !== 'table:delete') }));
                                                }}
                                                disabled={isPending}
                                            />
                                            <Label className="text-sm">Eliminar órdenes</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Switch
                                                checked={userForm.permissions.includes('table:notify')}
                                                onCheckedChange={(checked) => {
                                                    if (checked) setUserForm(prev => ({ ...prev, permissions: [...prev.permissions, 'table:notify'] }));
                                                    else setUserForm(prev => ({ ...prev, permissions: prev.permissions.filter(p => p !== 'table:notify') }));
                                                }}
                                                disabled={isPending}
                                            />
                                            <Label className="text-sm">Notificar clientes (órdenes)</Label>
                                        </div>
                                    </div>
                                </div>

                                {/* Permisos de Gestión */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-purple-500"></div>
                                        <Label className="text-sm font-medium text-purple-700 dark:text-purple-400">Permisos de Gestión</Label>
                                    </div>
                                    <div className="ml-4 space-y-2">
                                        <div className="flex items-center space-x-2">
                                            <Switch
                                                checked={userForm.permissions.includes('prices:view')}
                                                onCheckedChange={(checked) => {
                                                    if (checked) setUserForm(prev => ({ ...prev, permissions: [...prev.permissions, 'prices:view'] }));
                                                    else setUserForm(prev => ({ ...prev, permissions: prev.permissions.filter(p => p !== 'prices:view') }));
                                                }}
                                                disabled={isPending}
                                            />
                                            <Label className="text-sm">Ver precios</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Switch
                                                checked={userForm.permissions.includes('prices:edit')}
                                                onCheckedChange={(checked) => {
                                                    if (checked) setUserForm(prev => ({ ...prev, permissions: [...prev.permissions, 'prices:edit'] }));
                                                    else setUserForm(prev => ({ ...prev, permissions: prev.permissions.filter(p => p !== 'prices:edit') }));
                                                }}
                                                disabled={isPending}
                                            />
                                            <Label className="text-sm">Editar precios</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Switch
                                                checked={userForm.permissions.includes('balance:view')}
                                                onCheckedChange={(checked) => {
                                                    if (checked) setUserForm(prev => ({ ...prev, permissions: [...prev.permissions, 'balance:view'] }));
                                                    else setUserForm(prev => ({ ...prev, permissions: prev.permissions.filter(p => p !== 'balance:view') }));
                                                }}
                                                disabled={isPending}
                                            />
                                            <Label className="text-sm">Ver balance financiero</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Switch
                                                checked={userForm.permissions.includes('outputs:view')}
                                                onCheckedChange={(checked) => {
                                                    if (checked) setUserForm(prev => ({ ...prev, permissions: [...prev.permissions, 'outputs:view'] }));
                                                    else setUserForm(prev => ({ ...prev, permissions: prev.permissions.filter(p => p !== 'outputs:view') }));
                                                }}
                                                disabled={isPending}
                                            />
                                            <Label className="text-sm">Ver salidas</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Switch
                                                checked={userForm.permissions.includes('outputs:create')}
                                                onCheckedChange={(checked) => {
                                                    if (checked) setUserForm(prev => ({ ...prev, permissions: [...prev.permissions, 'outputs:create'] }));
                                                    else setUserForm(prev => ({ ...prev, permissions: prev.permissions.filter(p => p !== 'outputs:create') }));
                                                }}
                                                disabled={isPending}
                                            />
                                            <Label className="text-sm">Crear salidas</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Switch
                                                checked={userForm.permissions.includes('outputs:edit')}
                                                onCheckedChange={(checked) => {
                                                    if (checked) setUserForm(prev => ({ ...prev, permissions: [...prev.permissions, 'outputs:edit'] }));
                                                    else setUserForm(prev => ({ ...prev, permissions: prev.permissions.filter(p => p !== 'outputs:edit') }));
                                                }}
                                                disabled={isPending}
                                            />
                                            <Label className="text-sm">Editar salidas</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Switch
                                                checked={userForm.permissions.includes('outputs:delete')}
                                                onCheckedChange={(checked) => {
                                                    if (checked) setUserForm(prev => ({ ...prev, permissions: [...prev.permissions, 'outputs:delete'] }));
                                                    else setUserForm(prev => ({ ...prev, permissions: prev.permissions.filter(p => p !== 'outputs:delete') }));
                                                }}
                                                disabled={isPending}
                                            />
                                            <Label className="text-sm">Eliminar salidas</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Switch
                                                checked={userForm.permissions.includes('outputs:view_statistics')}
                                                onCheckedChange={(checked) => {
                                                    if (checked) setUserForm(prev => ({ ...prev, permissions: [...prev.permissions, 'outputs:view_statistics'] }));
                                                    else setUserForm(prev => ({ ...prev, permissions: prev.permissions.filter(p => p !== 'outputs:view_statistics') }));
                                                }}
                                                disabled={isPending}
                                            />
                                            <Label className="text-sm">Ver estadísticas de salidas</Label>
                                        </div>
                                    </div>
                                </div>

                                {/* Permisos de Express */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-teal-500"></div>
                                        <Label className="text-sm font-medium text-teal-700 dark:text-teal-400">Permisos de Express</Label>
                                    </div>
                                    <div className="ml-4 space-y-2">
                                        <div className="flex items-center space-x-2">
                                            <Switch
                                                checked={userForm.permissions.includes('express:view')}
                                                onCheckedChange={(checked) => {
                                                    if (checked) setUserForm(prev => ({ ...prev, permissions: [...prev.permissions, 'express:view'] }));
                                                    else setUserForm(prev => ({ ...prev, permissions: prev.permissions.filter(p => p !== 'express:view') }));
                                                }}
                                                disabled={isPending}
                                            />
                                            <Label className="text-sm">Ver Express</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Switch
                                                checked={userForm.permissions.includes('express:create')}
                                                onCheckedChange={(checked) => {
                                                    if (checked) setUserForm(prev => ({ ...prev, permissions: [...prev.permissions, 'express:create'] }));
                                                    else setUserForm(prev => ({ ...prev, permissions: prev.permissions.filter(p => p !== 'express:create') }));
                                                }}
                                                disabled={isPending}
                                            />
                                            <Label className="text-sm">Crear Express</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Switch
                                                checked={userForm.permissions.includes('express:edit')}
                                                onCheckedChange={(checked) => {
                                                    if (checked) setUserForm(prev => ({ ...prev, permissions: [...prev.permissions, 'express:edit'] }));
                                                    else setUserForm(prev => ({ ...prev, permissions: prev.permissions.filter(p => p !== 'express:edit') }));
                                                }}
                                                disabled={isPending}
                                            />
                                            <Label className="text-sm">Editar Express</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Switch
                                                checked={userForm.permissions.includes('express:delete')}
                                                onCheckedChange={(checked) => {
                                                    if (checked) setUserForm(prev => ({ ...prev, permissions: [...prev.permissions, 'express:delete'] }));
                                                    else setUserForm(prev => ({ ...prev, permissions: prev.permissions.filter(p => p !== 'express:delete') }));
                                                }}
                                                disabled={isPending}
                                            />
                                            <Label className="text-sm">Eliminar Express</Label>
                                        </div>
                                    </div>
                                </div>

                                {/* Permisos de Puntos de Venta */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-purple-500"></div>
                                        <Label className="text-sm font-medium text-purple-700 dark:text-purple-400">Permisos de Puntos de Venta</Label>
                                    </div>
                                    <div className="ml-4 space-y-2">
                                        <div className="flex items-center space-x-2">
                                            <Switch
                                                checked={userForm.permissions.includes('mayoristas:view')}
                                                onCheckedChange={(checked) => {
                                                    if (checked) setUserForm(prev => ({ ...prev, permissions: [...prev.permissions, 'mayoristas:view'] }));
                                                    else setUserForm(prev => ({ ...prev, permissions: prev.permissions.filter(p => p !== 'mayoristas:view') }));
                                                }}
                                                disabled={isPending}
                                            />
                                            <Label className="text-sm">Ver puntos de venta</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Switch
                                                checked={userForm.permissions.includes('mayoristas:create')}
                                                onCheckedChange={(checked) => {
                                                    if (checked) setUserForm(prev => ({ ...prev, permissions: [...prev.permissions, 'mayoristas:create'] }));
                                                    else setUserForm(prev => ({ ...prev, permissions: prev.permissions.filter(p => p !== 'mayoristas:create') }));
                                                }}
                                                disabled={isPending}
                                            />
                                            <Label className="text-sm">Crear puntos de venta</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Switch
                                                checked={userForm.permissions.includes('mayoristas:edit')}
                                                onCheckedChange={(checked) => {
                                                    if (checked) setUserForm(prev => ({ ...prev, permissions: [...prev.permissions, 'mayoristas:edit'] }));
                                                    else setUserForm(prev => ({ ...prev, permissions: prev.permissions.filter(p => p !== 'mayoristas:edit') }));
                                                }}
                                                disabled={isPending}
                                            />
                                            <Label className="text-sm">Editar puntos de venta</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Switch
                                                checked={userForm.permissions.includes('mayoristas:delete')}
                                                onCheckedChange={(checked) => {
                                                    if (checked) setUserForm(prev => ({ ...prev, permissions: [...prev.permissions, 'mayoristas:delete'] }));
                                                    else setUserForm(prev => ({ ...prev, permissions: prev.permissions.filter(p => p !== 'mayoristas:delete') }));
                                                }}
                                                disabled={isPending}
                                            />
                                            <Label className="text-sm">Eliminar puntos de venta</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Switch
                                                checked={userForm.permissions.includes('mayoristas:view_statistics')}
                                                onCheckedChange={(checked) => {
                                                    if (checked) setUserForm(prev => ({ ...prev, permissions: [...prev.permissions, 'mayoristas:view_statistics'] }));
                                                    else setUserForm(prev => ({ ...prev, permissions: prev.permissions.filter(p => p !== 'mayoristas:view_statistics') }));
                                                }}
                                                disabled={isPending}
                                            />
                                            <Label className="text-sm">Ver estadísticas de puntos de venta</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Switch
                                                checked={userForm.permissions.includes('mayoristas:view_matrix')}
                                                onCheckedChange={(checked) => {
                                                    if (checked) setUserForm(prev => ({ ...prev, permissions: [...prev.permissions, 'mayoristas:view_matrix'] }));
                                                    else setUserForm(prev => ({ ...prev, permissions: prev.permissions.filter(p => p !== 'mayoristas:view_matrix') }));
                                                }}
                                                disabled={isPending}
                                            />
                                            <Label className="text-sm">Ver matriz de productos</Label>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <p className="text-sm text-muted-foreground pt-2">
                                Asigna los permisos específicos para el usuario.
                                <br />
                                <span className="text-xs">Nota: Todos los usuarios pueden ver su propia cuenta por defecto.</span>
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsUserDialogOpen(false)} disabled={isPending}>
                            Cancelar
                        </Button>
                        <Button 
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleUserSubmit();
                            }} 
                            disabled={isPending}
                        >
                            {isPending ? (
                                editingUser ? 'Actualizando...' : 'Creando...'
                            ) : (
                                editingUser ? 'Actualizar Usuario' : 'Crear Usuario'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog
                open={deleteUserDialog.open}
                onOpenChange={(open) => setDeleteUserDialog(prev => ({ ...prev, open }))}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-destructive" />
                            Confirmar eliminación
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Estás seguro de que deseas eliminar este usuario?
                            <br />
                            <strong>
                                {deleteUserDialog.user?.name} {deleteUserDialog.user?.lastName}
                            </strong>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deleteUserDialog.user && handleDeleteUser(deleteUserDialog.user)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={isPending}
                        >
                            {isPending ? 'Eliminando...' : 'Eliminar'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
} 