'use server'

import { revalidatePath } from 'next/cache';
import { UserData, UserFormData } from '../types/user';
import { database } from '@repo/database';
import { UserRole } from '@repo/database';
import bcrypt from 'bcryptjs';

/**
 * Crear un nuevo usuario
 */
export async function createUser(data: UserFormData & { role: UserRole; permissions?: string[] }) {
    try {
        // Verificar si ya existe un usuario con ese email
        const existingUser = await database.user.findUnique({
            where: { email: data.email },
        });

        if (existingUser) {
            return {
                success: false,
                message: 'Ya existe un usuario con este email',
                error: 'EMAIL_ALREADY_EXISTS'
            };
        }

        // Hash de la contraseña
        const hashedPassword = await bcrypt.hash(data.password, 12);

        // Asegurarse de que el permiso 'account:view_own' siempre esté presente
        const permissionsWithDefault = new Set(data.permissions || []);
        permissionsWithDefault.add('account:view_own');

        // Crear el usuario con contraseña hasheada y los permisos del formulario
        const user = await database.user.create({
            data: {
                name: data.name,
                lastName: data.lastName,
                email: data.email,
                password: hashedPassword,
                role: data.role,
                permissions: Array.from(permissionsWithDefault),
            },
        });

        // Retornar usuario sin contraseña
        return {
            success: true,
            user: {
                id: user.id,
                name: user.name,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
                permissions: Array.isArray(user.permissions) ? user.permissions : [],
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            }
        };
    } catch (error) {
        console.error('Error al crear usuario:', error);
        return {
            success: false,
            message: 'Error interno del servidor al crear el usuario',
            error: 'SERVER_ERROR'
        };
    }
}

/**
 * Obtener un usuario por ID
 */
export async function getUserById(userId: string) {
    try {
        const user = await database.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            return null;
        }

        // Retornar usuario sin contraseña
        return {
            id: user.id,
            name: user.name,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            permissions: Array.isArray(user.permissions) ? user.permissions : [],
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
    } catch (error) {
        console.error('Error al obtener usuario por ID:', error);
        throw new Error('No se pudo obtener el usuario');
    }
}

/**
 * Obtener todos los usuarios excluyendo al usuario actual
 */
export async function getAllUsers(excludeUserId?: string) {
    try {
        // Implementación real con la base de datos
        const users = await database.user.findMany({
            where: excludeUserId ? {
                id: { not: excludeUserId }
            } : undefined,
            orderBy: { createdAt: 'desc' },
        });

        // Mapear para no incluir passwords
        return users.map(user => ({
            id: user.id,
            name: user.name,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            permissions: Array.isArray(user.permissions) ? user.permissions : [],
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        })) as UserData[];
    } catch (error) {
        console.error("Error al obtener usuarios:", error);
        throw new Error("No se pudieron obtener los usuarios");
    }
}

/**
 * Actualizar un usuario existente
 */
export async function updateUser(userId: string, data: UserFormData & { role?: UserRole; permissions?: string[] }) {
    "use server";
    try {
        const updateData: any = {
            name: data.name,
            lastName: data.lastName,
            email: data.email,
            role: data.role,
        };

        // Solo incluir permissions si se proporciona
        if (data.permissions !== undefined) {
            updateData.permissions = data.permissions;
        }

        // Solo hashear la contraseña si se proporciona una nueva
        if (data.password) {
            updateData.password = await bcrypt.hash(data.password, 12);
        }

        // Actualizar usuario en la base de datos
        const user = await database.user.update({
            where: { id: userId },
            data: updateData,
        });

        revalidatePath('/admin/account');

        // Devolver usuario sin password
        return {
            id: user.id,
            name: user.name,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            permissions: Array.isArray(user.permissions) ? user.permissions : [],
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        } as UserData;
    } catch (error) {
        console.error("Error al actualizar usuario:", error);
        throw new Error("No se pudo actualizar el usuario");
    }
}

/**
 * Eliminar un usuario
 */
export async function deleteUser(userId: string) {
    "use server";
    try {
        // Eliminar usuario de la base de datos
        await database.user.delete({
            where: { id: userId },
        });

        revalidatePath('/admin/account');
        return { success: true };
    } catch (error) {
        console.error("Error al eliminar usuario:", error);
        throw new Error("No se pudo eliminar el usuario");
    }
}

/**
 * Verificar credenciales de usuario con hash
 */
export async function verifyUserCredentials(email: string, password: string) {
    try {
        const user = await database.user.findUnique({
            where: { email },
        });
        if (!user) {
            console.log('❌ Usuario no encontrado en la base de datos');
            return { success: false, message: 'Credenciales inválidas' };
        }
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            console.log('❌ Contraseña incorrecta');
            return { success: false, message: 'Credenciales inválidas' };
        }
        return {
            success: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                lastName: user.lastName,
                role: user.role
            }
        };
    } catch (error) {
        console.error('💥 Error al verificar credenciales:', error);
        console.error('📋 Detalles del error:', {
            name: error instanceof Error ? error.name : 'Unknown',
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : 'No stack trace'
        });
        return {
            success: false,
            message: 'Error interno del servidor al verificar credenciales',
            error: 'SERVER_ERROR'
        };
    }
}

/**
 * Cambiar contraseña de un usuario
 */
export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
    try {
        // Primero obtener el usuario para verificar la contraseña actual
        const user = await database.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            return {
                success: false,
                message: 'Usuario no encontrado',
                error: 'USER_NOT_FOUND'
            };
        }

        // Verificar que la contraseña actual sea correcta
        const passwordMatch = await bcrypt.compare(currentPassword, user.password);

        if (!passwordMatch) {
            return {
                success: false,
                message: 'La contraseña actual no es correcta',
                error: 'INVALID_CURRENT_PASSWORD'
            };
        }

        // Hashear la nueva contraseña
        const hashedNewPassword = await bcrypt.hash(newPassword, 12);

        // Actualizar la contraseña
        await database.user.update({
            where: { id: userId },
            data: { password: hashedNewPassword },
        });

        return {
            success: true,
            message: 'Contraseña actualizada exitosamente'
        };

    } catch (error) {
        console.error('Error al cambiar contraseña:', error);
        return {
            success: false,
            message: 'Error interno del servidor',
            error: 'SERVER_ERROR'
        };
    }
} 