'use server';

import { getCollection, ObjectId } from '@repo/database';

export type MayoristaZona = 'CABA' | 'LA_PLATA' | 'OESTE' | 'NOROESTE' | 'NORTE' | 'SUR';
export type MayoristaFrecuencia = 'SEMANAL' | 'QUINCENAL' | 'MENSUAL' | 'OCASIONAL';
export type MayoristaTipoNegocio = 'SOLO_PET_SHOP' | 'PET_SHOP_VETE' | 'PET_SHOP_PELUQUERIA' | 'COMPLETO';

export interface Mayorista {
    _id?: string;
    nombre: string;
    zona: MayoristaZona;
    frecuencia: MayoristaFrecuencia;
    fechaInicioVentas: Date | string;
    tieneFreezer: boolean;
    capacidadFreezer?: number; // en litros o unidad de medida
    tipoNegocio: MayoristaTipoNegocio;
    kilosPorMes: Array<{
        mes: number; // 1-12
        anio: number;
        kilos: number;
    }>;
    contacto?: {
        telefono?: string;
        email?: string;
        direccion?: string;
    };
    notas?: string;
    activo: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
}

export interface MayoristaCreateInput {
    nombre: string;
    zona: MayoristaZona;
    frecuencia: MayoristaFrecuencia;
    fechaInicioVentas: Date | string;
    tieneFreezer: boolean;
    capacidadFreezer?: number;
    tipoNegocio: MayoristaTipoNegocio;
    contacto?: {
        telefono?: string;
        email?: string;
        direccion?: string;
    };
    notas?: string;
}

export interface MayoristaUpdateInput extends Partial<MayoristaCreateInput> {
    activo?: boolean;
}

/**
 * Obtener todos los mayoristas con paginación y filtros
 */
export async function getMayoristas({
    pageIndex = 0,
    pageSize = 50,
    search = '',
    zona,
    activo = true,
}: {
    pageIndex?: number;
    pageSize?: number;
    search?: string;
    zona?: MayoristaZona;
    activo?: boolean;
}): Promise<{
    success: boolean;
    mayoristas?: Mayorista[];
    total?: number;
    pageCount?: number;
    error?: string;
}> {
    try {
        const mayoristasCollection = await getCollection('puntos_venta');

        // Construir filtro de búsqueda
        const filter: any = { activo };

        if (zona) {
            filter.zona = zona;
        }

        if (search) {
            filter.$or = [
                { nombre: { $regex: search, $options: 'i' } },
                { 'contacto.telefono': { $regex: search, $options: 'i' } },
                { 'contacto.email': { $regex: search, $options: 'i' } },
            ];
        }

        // Obtener total de documentos
        const total = await mayoristasCollection.countDocuments(filter);
        const pageCount = Math.ceil(total / pageSize);

        // Obtener mayoristas con paginación
        const mayoristas = await mayoristasCollection
            .find(filter)
            .sort({ nombre: 1 })
            .skip(pageIndex * pageSize)
            .limit(pageSize)
            .toArray();

        return {
            success: true,
            mayoristas: mayoristas.map(m => ({
                ...m,
                _id: m._id.toString(),
            })) as Mayorista[],
            total,
            pageCount,
        };
    } catch (error) {
        console.error('Error al obtener mayoristas:', error);
        return {
            success: false,
            error: 'Error al obtener los mayoristas',
        };
    }
}

/**
 * Obtener un mayorista por ID
 */
export async function getMayoristaById(
    id: string
): Promise<{
    success: boolean;
    mayorista?: Mayorista;
    error?: string;
}> {
    try {
        const mayoristasCollection = await getCollection('puntos_venta');
        const mayorista = await mayoristasCollection.findOne({ _id: new ObjectId(id) });

        if (!mayorista) {
            return {
                success: false,
                error: 'Mayorista no encontrado',
            };
        }

        return {
            success: true,
            mayorista: {
                ...mayorista,
                _id: mayorista._id.toString(),
            } as Mayorista,
        };
    } catch (error) {
        console.error('Error al obtener mayorista:', error);
        return {
            success: false,
            error: 'Error al obtener el mayorista',
        };
    }
}

/**
 * Crear un nuevo mayorista
 */
export async function createMayorista(
    data: MayoristaCreateInput
): Promise<{
    success: boolean;
    mayorista?: Mayorista;
    error?: string;
}> {
    try {
        const mayoristasCollection = await getCollection('puntos_venta');

        const newMayorista = {
            ...data,
            kilosPorMes: [],
            activo: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const result = await mayoristasCollection.insertOne(newMayorista);

        return {
            success: true,
            mayorista: {
                ...newMayorista,
                _id: result.insertedId.toString(),
            } as Mayorista,
        };
    } catch (error) {
        console.error('Error al crear mayorista:', error);
        return {
            success: false,
            error: 'Error al crear el mayorista',
        };
    }
}

/**
 * Actualizar un mayorista
 */
export async function updateMayorista(
    id: string,
    data: MayoristaUpdateInput
): Promise<{
    success: boolean;
    mayorista?: Mayorista;
    error?: string;
}> {
    try {
        const mayoristasCollection = await getCollection('puntos_venta');

        const updateData = {
            ...data,
            updatedAt: new Date(),
        };

        const result = await mayoristasCollection.findOneAndUpdate(
            { _id: new ObjectId(id) },
            { $set: updateData },
            { returnDocument: 'after' }
        );

        if (!result) {
            return {
                success: false,
                error: 'Mayorista no encontrado',
            };
        }

        return {
            success: true,
            mayorista: {
                ...result,
                _id: result._id.toString(),
            } as Mayorista,
        };
    } catch (error) {
        console.error('Error al actualizar mayorista:', error);
        return {
            success: false,
            error: 'Error al actualizar el mayorista',
        };
    }
}

/**
 * Eliminar (desactivar) un mayorista
 */
export async function deleteMayorista(
    id: string
): Promise<{
    success: boolean;
    error?: string;
}> {
    try {
        const mayoristasCollection = await getCollection('puntos_venta');

        const result = await mayoristasCollection.findOneAndUpdate(
            { _id: new ObjectId(id) },
            {
                $set: {
                    activo: false,
                    updatedAt: new Date(),
                },
            },
            { returnDocument: 'after' }
        );

        if (!result) {
            return {
                success: false,
                error: 'Mayorista no encontrado',
            };
        }

        return {
            success: true,
        };
    } catch (error) {
        console.error('Error al eliminar mayorista:', error);
        return {
            success: false,
            error: 'Error al eliminar el mayorista',
        };
    }
}

/**
 * Agregar registro de kilos vendidos en un mes
 */
export async function addKilosMes(
    id: string,
    mes: number,
    anio: number,
    kilos: number
): Promise<{
    success: boolean;
    error?: string;
}> {
    try {
        const mayoristasCollection = await getCollection('puntos_venta');

        // Primero verificar si ya existe un registro para ese mes/año
        const mayorista = await mayoristasCollection.findOne({ _id: new ObjectId(id) });

        if (!mayorista) {
            return {
                success: false,
                error: 'Mayorista no encontrado',
            };
        }

        // Buscar si ya existe el registro
        const existingIndex = mayorista.kilosPorMes?.findIndex(
            (k: any) => k.mes === mes && k.anio === anio
        ) ?? -1;

        if (existingIndex >= 0) {
            // Actualizar el registro existente
            await mayoristasCollection.updateOne(
                { _id: new ObjectId(id) },
                {
                    $set: {
                        [`kilosPorMes.${existingIndex}.kilos`]: kilos,
                        updatedAt: new Date(),
                    },
                }
            );
        } else {
            // Agregar nuevo registro
            await mayoristasCollection.updateOne(
                { _id: new ObjectId(id) },
                {
                    $push: {
                        kilosPorMes: { mes, anio, kilos },
                    } as any,
                    $set: {
                        updatedAt: new Date(),
                    },
                }
            );
        }

        return {
            success: true,
        };
    } catch (error) {
        console.error('Error al agregar kilos del mes:', error);
        return {
            success: false,
            error: 'Error al agregar los kilos del mes',
        };
    }
}

/**
 * Obtener estadísticas de ventas por zona
 */
export async function getVentasPorZona(): Promise<{
    success: boolean;
    data?: Array<{
        zona: MayoristaZona;
        totalMayoristas: number;
        totalKilosUltimoMes: number;
    }>;
    error?: string;
}> {
    try {
        const mayoristasCollection = await getCollection('puntos_venta');

        const now = new Date();
        const mesActual = now.getMonth() + 1;
        const anioActual = now.getFullYear();

        const result = await mayoristasCollection
            .aggregate([
                { $match: { activo: true } },
                {
                    $project: {
                        zona: 1,
                        kilosUltimoMes: {
                            $filter: {
                                input: '$kilosPorMes',
                                as: 'kilo',
                                cond: {
                                    $and: [
                                        { $eq: ['$$kilo.mes', mesActual] },
                                        { $eq: ['$$kilo.anio', anioActual] },
                                    ],
                                },
                            },
                        },
                    },
                },
                {
                    $group: {
                        _id: '$zona',
                        totalMayoristas: { $sum: 1 },
                        totalKilosUltimoMes: {
                            $sum: {
                                $sum: '$kilosUltimoMes.kilos',
                            },
                        },
                    },
                },
                {
                    $project: {
                        zona: '$_id',
                        totalMayoristas: 1,
                        totalKilosUltimoMes: 1,
                        _id: 0,
                    },
                },
            ])
            .toArray();

        return {
            success: true,
            data: result as any,
        };
    } catch (error) {
        console.error('Error al obtener ventas por zona:', error);
        return {
            success: false,
            error: 'Error al obtener las ventas por zona',
        };
    }
}

