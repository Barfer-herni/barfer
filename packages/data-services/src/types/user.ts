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
    puntoEnvio?: string | string[]; // Punto(s) de envío asignado(s) al usuario (string para retrocompatibilidad, string[] para múltiples)
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
    puntoEnvio?: string | string[]; // Punto(s) de envío asignado(s) al usuario (string para retrocompatibilidad, string[] para múltiples)
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