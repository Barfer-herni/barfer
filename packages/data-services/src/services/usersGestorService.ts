'use server';

import { getCollection, ObjectId } from '@repo/database';
import bcrypt from 'bcryptjs';

export type UserRole = 'admin' | 'user';

export interface UserGestor {
    _id?: string;
    id: string; // Alias para compatibilidad - siempre requerido
    email: string;
    name: string;
    lastName: string;
    role: UserRole;
    password?: string; // Opcional - solo se incluye internamente para verificación
    permissions: string[];
    createdAt?: Date | string;
    updatedAt?: Date | string;
}

export interface UserGestorCreateInput {
    email: string;
    name: string;
    lastName: string;
    role: UserRole;
    password: string;
    permissions?: string[];
}

export interface UserGestorUpdateInput {
    email?: string;
    name?: string;
    lastName?: string;
    role?: UserRole;
    password?: string;
    permissions?: string[];
}

/**
 * Crear un nuevo usuario
 */
export async function createUserGestor(data: UserGestorCreateInput): Promise<{
    success: boolean;
    user?: UserGestor;
    message?: string;
    error?: string;
}> {
    try {
        const usersCollection = await getCollection('users_gestor');

        // Verificar si ya existe un usuario con ese email
        const existingUser = await usersCollection.findOne({
            email: data.email
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

        const now = new Date();
        const newUser = {
            email: data.email,
            name: data.name,
            lastName: data.lastName,
            role: data.role,
            password: hashedPassword,
            permissions: Array.from(permissionsWithDefault),
            createdAt: now,
            updatedAt: now
        };

        const result = await usersCollection.insertOne(newUser);

        if (!result.insertedId) {
            return {
                success: false,
                message: 'Error al crear el usuario',
                error: 'INSERT_FAILED'
            };
        }

        // Retornar usuario sin contraseña
        return {
            success: true,
            user: {
                _id: result.insertedId.toString(),
                id: result.insertedId.toString(),
                email: newUser.email,
                name: newUser.name,
                lastName: newUser.lastName,
                role: newUser.role,
                permissions: newUser.permissions,
                createdAt: newUser.createdAt,
                updatedAt: newUser.updatedAt
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
export async function getUserGestorById(userId: string): Promise<UserGestor | null> {
    try {
        const usersCollection = await getCollection('users_gestor');

        const user = await usersCollection.findOne({
            _id: new ObjectId(userId)
        });

        if (!user) {
            return null;
        }

        // Retornar usuario sin contraseña
        return {
            _id: user._id.toString(),
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            lastName: user.lastName,
            role: user.role,
            permissions: Array.isArray(user.permissions) ? user.permissions : [],
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        };
    } catch (error) {
        console.error('Error al obtener usuario por ID:', error);
        return null;
    }
}

/**
 * Obtener un usuario por email (incluye password para verificación)
 */
export async function getUserGestorByEmail(email: string): Promise<(UserGestor & { password: string }) | null> {
    try {
        const usersCollection = await getCollection('users_gestor');

        const user = await usersCollection.findOne({
            email: email
        });

        if (!user) {
            return null;
        }

        return {
            _id: user._id.toString(),
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            lastName: user.lastName,
            role: user.role,
            password: user.password, // Incluir password para verificación
            permissions: Array.isArray(user.permissions) ? user.permissions : [],
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        };
    } catch (error) {
        console.error('Error al obtener usuario por email:', error);
        return null;
    }
}

/**
 * Obtener todos los usuarios excluyendo al usuario actual
 */
export async function getAllUsersGestor(excludeUserId?: string): Promise<UserGestor[]> {
    try {
        const usersCollection = await getCollection('users_gestor');

        const query = excludeUserId ? {
            _id: { $ne: new ObjectId(excludeUserId) }
        } : {};

        const users = await usersCollection
            .find(query)
            .sort({ createdAt: -1 })
            .toArray();

        // Mapear para no incluir passwords
        return users.map(user => ({
            _id: user._id.toString(),
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            lastName: user.lastName,
            role: user.role,
            permissions: Array.isArray(user.permissions) ? user.permissions : [],
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        }));
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        return [];
    }
}

/**
 * Actualizar un usuario existente
 */
export async function updateUserGestor(
    userId: string,
    data: UserGestorUpdateInput
): Promise<UserGestor | null> {
    try {
        const usersCollection = await getCollection('users_gestor');

        const updateData: any = {
            updatedAt: new Date()
        };

        if (data.name !== undefined) updateData.name = data.name;
        if (data.lastName !== undefined) updateData.lastName = data.lastName;
        if (data.email !== undefined) updateData.email = data.email;
        if (data.role !== undefined) updateData.role = data.role;
        if (data.permissions !== undefined) updateData.permissions = data.permissions;

        // Solo hashear la contraseña si se proporciona una nueva
        if (data.password) {
            updateData.password = await bcrypt.hash(data.password, 12);
        }

        const result = await usersCollection.findOneAndUpdate(
            { _id: new ObjectId(userId) },
            { $set: updateData },
            { returnDocument: 'after' }
        );

        if (!result) {
            return null;
        }

        const user = result;

        return {
            _id: user._id.toString(),
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            lastName: user.lastName,
            role: user.role,
            permissions: Array.isArray(user.permissions) ? user.permissions : [],
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        };
    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        return null;
    }
}

/**
 * Eliminar un usuario
 */
export async function deleteUserGestor(userId: string): Promise<{
    success: boolean;
    message?: string;
}> {
    try {
        const usersCollection = await getCollection('users_gestor');

        const result = await usersCollection.deleteOne({
            _id: new ObjectId(userId)
        });

        if (result.deletedCount === 0) {
            return {
                success: false,
                message: 'Usuario no encontrado'
            };
        }

        return { success: true };
    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        return {
            success: false,
            message: 'Error al eliminar el usuario'
        };
    }
}

/**
 * Verificar credenciales de usuario con hash
 */
export async function verifyUserGestorCredentials(
    email: string,
    password: string
): Promise<{
    success: boolean;
    user?: {
        id: string;
        email: string;
        name: string;
        lastName: string;
        role: UserRole;
    };
    message?: string;
    error?: string;
}> {
    try {
        const user = await getUserGestorByEmail(email);

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
                id: user.id!,
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
export async function changeUserGestorPassword(
    userId: string,
    currentPassword: string,
    newPassword: string
): Promise<{
    success: boolean;
    message?: string;
    error?: string;
}> {
    try {
        const usersCollection = await getCollection('users_gestor');

        // Primero obtener el usuario para verificar la contraseña actual
        const user = await usersCollection.findOne({
            _id: new ObjectId(userId)
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
        await usersCollection.updateOne(
            { _id: new ObjectId(userId) },
            {
                $set: {
                    password: hashedNewPassword,
                    updatedAt: new Date()
                }
            }
        );

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

