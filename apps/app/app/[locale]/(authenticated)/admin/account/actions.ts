'use server';

import { revalidatePath } from 'next/cache';
import {
    changePassword as changePasswordService,
    createUser as createUserService,
    deleteUser as deleteUserService,
    updateUser as updateUserService,
} from '@repo/data-services/src/services/userService';
import type { UserRole } from '@repo/data-services';
import { z } from 'zod';
import { hasPermission } from '@repo/auth/server-permissions';
import { getCurrentUser } from '@repo/data-services/src/services/authService';

// Esquema para la actualización del perfil
const profileSchema = z.object({
    name: z.string().min(1, 'El nombre es requerido'),
    lastName: z.string().min(1, 'El apellido es requerido'),
    email: z.string().email('Email inválido'),
});

// Esquema para el cambio de contraseña
const passwordSchema = z.object({
    currentPassword: z.string().min(1, 'La contraseña actual es requerida'),
    newPassword: z.string().min(6, 'La nueva contraseña debe tener al menos 6 caracteres'),
    confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
});

// Esquema para crear/actualizar usuario
const userSchema = z.object({
    name: z.string().min(1, 'El nombre es requerido'),
    lastName: z.string().min(1, 'El apellido es requerido'),
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').optional().or(z.literal('')),
    role: z.enum(['admin', 'user']),
    permissions: z.array(z.string()),
    puntoEnvio: z.string().optional(),
});

export async function updateProfile(userId: string, formData: FormData) {
    try {
        if (!await hasPermission('account:edit_own')) {
            return { success: false, message: 'No tienes permisos para editar el perfil.' };
        }

        const data = Object.fromEntries(formData.entries());
        const validated = profileSchema.safeParse(data);

        if (!validated.success) {
            return { success: false, message: validated.error.errors[0].message };
        }

        await updateUserService(userId, { ...validated.data, password: '' });

        revalidatePath('/admin/account');
        return { success: true, message: 'Perfil actualizado exitosamente' };
    } catch (error) {
        return { success: false, message: 'Error al actualizar el perfil' };
    }
}

export async function changePassword(userId: string, formData: FormData) {
    try {
        if (!await hasPermission('account:change_password')) {
            return { success: false, message: 'No tienes permisos para cambiar la contraseña.' };
        }

        const data = Object.fromEntries(formData.entries());
        const validated = passwordSchema.safeParse(data);

        if (!validated.success) {
            return { success: false, message: validated.error.errors[0].message };
        }

        const result = await changePasswordService(
            userId,
            validated.data.currentPassword,
            validated.data.newPassword
        );

        if (!result.success) {
            return { success: false, message: result.message || 'Error al cambiar la contraseña' };
        }

        revalidatePath('/admin/account');
        return { success: true, message: 'Contraseña actualizada exitosamente' };

    } catch (error) {
        return { success: false, message: 'Error al cambiar la contraseña' };
    }
}

export async function createUser(formData: FormData) {
    try {
        console.log('🔵 createUser action llamado');
        
        if (!await hasPermission('account:manage_users')) {
            console.log('❌ Sin permisos para crear usuarios');
            return { success: false, message: 'No tienes permisos para crear usuarios.' };
        }

        const data = {
            name: formData.get('name'),
            lastName: formData.get('lastName'),
            email: formData.get('email'),
            password: formData.get('password'),
            role: formData.get('role'),
            permissions: JSON.parse(formData.get('permissions') as string || '[]'),
            puntoEnvio: formData.get('puntoEnvio') || undefined,
        };

        console.log('🟡 Datos parseados:', { ...data, password: data.password ? '[REDACTED]' : undefined });

        const validated = userSchema.safeParse(data);
        if (!validated.success) {
            console.log('❌ Validación falló:', validated.error.errors);
            return { success: false, message: validated.error.errors[0].message };
        }
        if (!validated.data.password) {
            console.log('❌ Password faltante');
            return { success: false, message: "La contraseña es requerida para nuevos usuarios." };
        }

        console.log('🟢 Llamando a createUserService');

        const result = await createUserService({ 
            ...validated.data, 
            role: validated.data.role as UserRole, 
            password: validated.data.password,
            puntoEnvio: validated.data.puntoEnvio || undefined
        });

        console.log('🟣 Resultado de createUserService:', { success: result.success, message: result.message });

        if (!result.success) {
            return { success: false, message: result.message || 'Error al crear el usuario' };
        }

        revalidatePath('/admin/account');
        return { success: true, message: 'Usuario creado exitosamente' };

    } catch (error) {
        console.error('🔴 Error creating user:', error);
        return { success: false, message: error instanceof Error ? error.message : 'Error al crear el usuario' };
    }
}

export async function updateUser(userId: string, formData: FormData) {
    try {
        if (!await hasPermission('account:manage_users')) {
            return { success: false, message: 'No tienes permisos para actualizar usuarios.' };
        }

        const data = {
            name: formData.get('name'),
            lastName: formData.get('lastName'),
            email: formData.get('email'),
            password: formData.get('password'),
            role: formData.get('role'),
            permissions: JSON.parse(formData.get('permissions') as string || '[]'),
            puntoEnvio: formData.get('puntoEnvio') || undefined,
        };

        const validated = userSchema.safeParse(data);
        if (!validated.success) {
            return { success: false, message: validated.error.errors[0].message };
        }

        await updateUserService(userId, {
            name: validated.data.name,
            lastName: validated.data.lastName,
            email: validated.data.email,
            role: validated.data.role as UserRole,
            permissions: validated.data.permissions,
            ...(validated.data.password ? { password: validated.data.password } : {}),
            ...(validated.data.puntoEnvio ? { puntoEnvio: validated.data.puntoEnvio } : {}),
        } as Parameters<typeof updateUserService>[1]);

        revalidatePath('/admin/account');
        return { success: true, message: 'Usuario actualizado exitosamente' };

    } catch (error) {
        return { success: false, message: 'Error al actualizar el usuario' };
    }
}

export async function updateUserCategoryPermissions(userId: string, permissions: string[]) {
    try {
        if (!await hasPermission('account:manage_users')) {
            return { success: false, message: 'No tienes permisos para actualizar permisos de usuarios.' };
        }

        // Obtener usuario actual
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return { success: false, message: 'Usuario no autenticado.' };
        }

        // Verificar que no se está editando a sí mismo
        if (currentUser.id === userId) {
            return { success: false, message: 'No puedes modificar tus propios permisos de categorías.' };
        }

        // Primero obtener el usuario actual
        const user = await import('@repo/data-services/src/services/userService').then(m => m.getUserById(userId));
        if (!user) {
            return { success: false, message: 'Usuario no encontrado' };
        }

        // Actualizar SOLO los permisos del usuario sin tocar otros campos
        const result = await updateUserService(userId, {
            name: user.name,
            lastName: user.lastName,
            email: user.email,
            password: '', // No cambiar contraseña
            permissions: permissions
        });

        if (!result) {
            return { success: false, message: 'Error al actualizar los permisos' };
        }

        revalidatePath('/admin/account');
        return { success: true, message: 'Permisos de categorías actualizados exitosamente' };

    } catch (error) {
        console.error('Error updating user category permissions:', error);
        return { success: false, message: 'Error al actualizar los permisos de categorías' };
    }
}

export async function getAvailableCategoriesAction() {
    try {
        // Usar MongoDB en lugar de Prisma
        const { getCollection } = await import('@repo/database');
        const categoriasCollection = await getCollection('categorias');

        const categorias = await categoriasCollection
            .find({ isActive: true })
            .sort({ nombre: 1 })
            .toArray();

        return {
            success: true,
            categories: categorias.map(cat => cat.nombre)
        };
    } catch (error) {
        console.error('Error getting available categories:', error);
        return { success: false, categories: [] };
    }
}


export async function deleteUser(userId: string) {
    try {
        if (!await hasPermission('account:manage_users')) {
            return { success: false, message: 'No tienes permisos para eliminar usuarios.' };
        }

        await deleteUserService(userId);
        revalidatePath('/admin/account');
        return { success: true, message: 'Usuario eliminado exitosamente' };

    } catch (error) {
        return { success: false, message: 'Error al eliminar el usuario' };
    }
} 