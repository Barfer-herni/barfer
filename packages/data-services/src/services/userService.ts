'use server'

import { revalidatePath } from 'next/cache';
import { UserData, UserFormData } from '../types/user';
import {
    createUserGestor,
    getUserGestorById,
    getAllUsersGestor,
    updateUserGestor,
    deleteUserGestor,
    verifyUserGestorCredentials,
    changeUserGestorPassword,
    type UserRole
} from './usersGestorService';

/**
 * Crear un nuevo usuario
 */
export async function createUser(data: UserFormData & { role: UserRole; permissions?: string[]; puntoEnvio?: string | string[] }) {
    return await createUserGestor(data);
}

/**
 * Obtener un usuario por ID
 */
export async function getUserById(userId: string) {
    try {
        return await getUserGestorById(userId);
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
        return await getAllUsersGestor(excludeUserId) as UserData[];
    } catch (error) {
        console.error("Error al obtener usuarios:", error);
        throw new Error("No se pudieron obtener los usuarios");
    }
}

/**
 * Actualizar un usuario existente
 */
export async function updateUser(userId: string, data: UserFormData & { role?: UserRole; permissions?: string[]; puntoEnvio?: string | string[] }) {
    "use server";
    try {
        const user = await updateUserGestor(userId, {
            name: data.name,
            lastName: data.lastName,
            email: data.email,
            role: data.role,
            password: data.password || undefined,
            permissions: data.permissions,
            puntoEnvio: data.puntoEnvio
        });

        if (!user) {
            throw new Error("No se pudo actualizar el usuario");
        }

        revalidatePath('/admin/account');

        return user as UserData;
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
        const result = await deleteUserGestor(userId);

        if (!result.success) {
            throw new Error(result.message || "No se pudo eliminar el usuario");
        }

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
    return await verifyUserGestorCredentials(email, password);
}

/**
 * Cambiar contraseña de un usuario
 */
export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
    return await changeUserGestorPassword(userId, currentPassword, newPassword);
} 