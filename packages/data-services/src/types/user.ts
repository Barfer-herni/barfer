/**
 * User data returned from the database
 */
export interface UserData {
    id: string;
    name: string;
    lastName: string;
    email: string;
    role: string;
    permissions: string[]; // Array de permisos específicos
    puntoEnvio?: string; // Punto de envío asignado al usuario
    createdAt: Date;
    updatedAt: Date;
}

/**
 * User data for form submissions
 */
export interface UserFormData {
    name: string;
    lastName: string;
    email: string;
    password: string;
    puntoEnvio?: string; // Punto de envío asignado al usuario
}

/**
 * User data for display (without sensitive information)
 */
export interface UserDisplay {
    id: string;
    name: string;
    lastName: string;
    email: string;
    role: string;
} 