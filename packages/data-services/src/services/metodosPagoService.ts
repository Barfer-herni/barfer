import { database } from '@repo/database';

export interface MetodoPagoData {
    id: string;
    nombre: string;
    descripcion?: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateMetodoPagoInput {
    nombre: string;
    descripcion?: string;
    isActive?: boolean;
}

export interface UpdateMetodoPagoInput {
    nombre?: string;
    descripcion?: string;
    isActive?: boolean;
}

/**
 * Obtener todos los métodos de pago activos
 */
export async function getAllMetodosPago(): Promise<{
    success: boolean;
    metodosPago?: MetodoPagoData[];
    total?: number;
    message?: string;
    error?: string;
}> {
    try {
        const metodosPago = await database.metodoPago.findMany({
            where: {
                isActive: true
            },
            orderBy: {
                nombre: 'asc'
            }
        });

        return {
            success: true,
            metodosPago: metodosPago as MetodoPagoData[],
            total: metodosPago.length
        };
    } catch (error) {
        console.error('Error in getAllMetodosPago:', error);
        return {
            success: false,
            message: 'Error al obtener los métodos de pago',
            error: 'GET_ALL_METODOS_PAGO_ERROR'
        };
    }
}

/**
 * Crear un nuevo método de pago
 */
export async function createMetodoPago(data: CreateMetodoPagoInput): Promise<{
    success: boolean;
    metodoPago?: MetodoPagoData;
    message?: string;
    error?: string;
}> {
    try {
        // Verificar si ya existe un método de pago con ese nombre
        const existingMetodoPago = await database.metodoPago.findUnique({
            where: { nombre: data.nombre.toUpperCase() }
        });

        if (existingMetodoPago) {
            return {
                success: false,
                message: 'Ya existe un método de pago con ese nombre',
                error: 'METODO_PAGO_ALREADY_EXISTS'
            };
        }

        const metodoPago = await database.metodoPago.create({
            data: {
                nombre: data.nombre.toUpperCase(),
                descripcion: data.descripcion,
                isActive: data.isActive ?? true
            }
        });

        return {
            success: true,
            metodoPago: metodoPago as MetodoPagoData,
            message: 'Método de pago creado exitosamente'
        };
    } catch (error) {
        console.error('Error in createMetodoPago:', error);
        return {
            success: false,
            message: 'Error al crear el método de pago',
            error: 'CREATE_METODO_PAGO_ERROR'
        };
    }
}

/**
 * Actualizar un método de pago existente
 */
export async function updateMetodoPago(id: string, data: UpdateMetodoPagoInput): Promise<{
    success: boolean;
    metodoPago?: MetodoPagoData;
    message?: string;
    error?: string;
}> {
    try {
        const metodoPago = await database.metodoPago.update({
            where: { id },
            data: {
                ...data,
                nombre: data.nombre ? data.nombre.toUpperCase() : undefined,
                updatedAt: new Date()
            }
        });

        return {
            success: true,
            metodoPago: metodoPago as MetodoPagoData,
            message: 'Método de pago actualizado exitosamente'
        };
    } catch (error) {
        console.error('Error in updateMetodoPago:', error);
        return {
            success: false,
            message: 'Error al actualizar el método de pago',
            error: 'UPDATE_METODO_PAGO_ERROR'
        };
    }
}

/**
 * Desactivar un método de pago (soft delete)
 */
export async function deleteMetodoPago(id: string): Promise<{
    success: boolean;
    message?: string;
    error?: string;
}> {
    try {
        await database.metodoPago.update({
            where: { id },
            data: {
                isActive: false,
                updatedAt: new Date()
            }
        });

        return {
            success: true,
            message: 'Método de pago desactivado exitosamente'
        };
    } catch (error) {
        console.error('Error in deleteMetodoPago:', error);
        return {
            success: false,
            message: 'Error al desactivar el método de pago',
            error: 'DELETE_METODO_PAGO_ERROR'
        };
    }
}

/**
 * Inicializar métodos de pago por defecto
 */
export async function initializeMetodosPago(): Promise<{
    success: boolean;
    message?: string;
    error?: string;
    created?: number;
}> {
    try {
        const metodosPagoPredefinidos = [
            'EFECTIVO',
            'TRANSFERENCIA',
            'MERCADO PAGO',
            'TARJETA DEBITO',
            'TARJETA CREDITO',
            'CHEQUE'
        ];

        let created = 0;

        for (const nombre of metodosPagoPredefinidos) {
            const exists = await database.metodoPago.findUnique({
                where: { nombre }
            });

            if (!exists) {
                await database.metodoPago.create({
                    data: { nombre }
                });
                created++;
            }
        }

        return {
            success: true,
            message: `Inicialización completada. ${created} métodos de pago creados.`,
            created
        };
    } catch (error) {
        console.error('Error in initializeMetodosPago:', error);
        return {
            success: false,
            message: 'Error al inicializar los métodos de pago',
            error: 'INITIALIZE_METODOS_PAGO_ERROR'
        };
    }
} 