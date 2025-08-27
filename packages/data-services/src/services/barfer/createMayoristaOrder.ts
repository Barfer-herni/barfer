import 'server-only';
import { getCollection, ObjectId } from '@repo/database';
import { z } from 'zod';
import { format } from 'date-fns';
import type { MayoristaPerson } from '../../types/barfer';

const mayoristaPersonSchema = z.object({
    user: z.object({
        name: z.string(),
        lastName: z.string(),
        email: z.string().email().optional().or(z.literal('')),
    }),
    address: z.object({
        address: z.string(),
        city: z.string(),
        phone: z.string(),
        betweenStreets: z.string().optional(),
        floorNumber: z.string().optional(),
        departmentNumber: z.string().optional(),
    }),
});

export async function createMayoristaPerson(data: z.infer<typeof mayoristaPersonSchema>): Promise<{ success: boolean; mayorista?: MayoristaPerson; error?: string; isNew?: boolean }> {
    try {
        // Validar los datos de entrada
        const validatedData = mayoristaPersonSchema.parse(data);

        const collection = await getCollection('mayoristas');

        // Verificar si ya existe un mayorista con el mismo nombre
        const existingMayorista = await collection.findOne({
            'user.name': validatedData.user.name,
            'user.lastName': validatedData.user.lastName
        });

        if (existingMayorista) {
            // Si ya existe, retornar el existente
            const mayoristaWithStringId = {
                ...existingMayorista,
                _id: existingMayorista._id.toString(),
            } as MayoristaPerson;

            return {
                success: true,
                mayorista: mayoristaWithStringId,
                isNew: false
            };
        }

        // Si no existe, crear uno nuevo con solo los datos personales
        const newMayoristaPerson = {
            ...validatedData,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        // Insertar el nuevo mayorista en la base de datos
        const result = await collection.insertOne(newMayoristaPerson);

        if (!result.insertedId) {
            return { success: false, error: 'Failed to create mayorista person' };
        }

        // Obtener el mayorista creado
        const createdMayorista = await collection.findOne({ _id: result.insertedId });

        if (!createdMayorista) {
            return { success: false, error: 'Mayorista person created but not found' };
        }

        // Convertir ObjectId a string para la respuesta
        const mayoristaWithStringId = {
            ...createdMayorista,
            _id: createdMayorista._id.toString(),
        } as MayoristaPerson;

        return {
            success: true,
            mayorista: mayoristaWithStringId,
            isNew: true
        };
    } catch (error) {
        console.error('Error creating mayorista person:', error);
        if (error instanceof z.ZodError) {
            return { success: false, error: `Validation error: ${error.errors.map(e => e.message).join(', ')}` };
        }
        return { success: false, error: 'Internal server error' };
    }
}

// Función para obtener todos los mayoristas
export async function getMayoristaPersons(): Promise<{ success: boolean; mayoristas?: MayoristaPerson[]; error?: string }> {
    try {
        const collection = await getCollection('mayoristas');
        const mayoristas = await collection.find({}).toArray();

        // Convertir ObjectIds a strings
        const mayoristasWithStringIds = mayoristas.map(mayorista => ({
            ...mayorista,
            _id: mayorista._id.toString(),
        })) as MayoristaPerson[];

        return { success: true, mayoristas: mayoristasWithStringIds };
    } catch (error) {
        console.error('Error getting mayorista persons:', error);
        return { success: false, error: 'Internal server error' };
    }
}

// Función para obtener un mayorista por ID
export async function getMayoristaPersonById(id: string): Promise<{ success: boolean; mayorista?: MayoristaPerson; error?: string }> {
    try {
        const collection = await getCollection('mayoristas');
        const mayorista = await collection.findOne({ _id: new ObjectId(id) });

        if (!mayorista) {
            return { success: false, error: 'Mayorista person not found' };
        }

        // Convertir ObjectId a string
        const mayoristaWithStringId = {
            ...mayorista,
            _id: mayorista._id.toString(),
        } as MayoristaPerson;

        return { success: true, mayorista: mayoristaWithStringId };
    } catch (error) {
        console.error('Error getting mayorista person by ID:', error);
        return { success: false, error: 'Internal server error' };
    }
}

// Función para buscar mayoristas por nombre
export async function findMayoristaByName(name: string, lastName: string): Promise<{ success: boolean; mayorista?: MayoristaPerson; error?: string }> {
    try {
        const collection = await getCollection('mayoristas');
        const mayorista = await collection.findOne({
            'user.name': name,
            'user.lastName': lastName
        });

        if (!mayorista) {
            return { success: false, error: 'Mayorista not found' };
        }

        // Convertir ObjectId a string
        const mayoristaWithStringId = {
            ...mayorista,
            _id: mayorista._id.toString(),
        } as MayoristaPerson;

        return { success: true, mayorista: mayoristaWithStringId };
    } catch (error) {
        console.error('Error finding mayorista by name:', error);
        return { success: false, error: 'Internal server error' };
    }
}

// Función para actualizar un mayorista
export async function updateMayoristaPerson(id: string, data: Partial<MayoristaPerson>): Promise<{ success: boolean; mayorista?: MayoristaPerson; error?: string }> {
    try {
        const collection = await getCollection('mayoristas');

        // Agregar timestamp de actualización
        const updateData = {
            ...data,
            updatedAt: new Date(),
        };

        const result = await collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
        );

        if (result.matchedCount === 0) {
            return { success: false, error: 'Mayorista person not found' };
        }

        // Obtener el mayorista actualizado
        const updatedMayorista = await collection.findOne({ _id: new ObjectId(id) });

        if (!updatedMayorista) {
            return { success: false, error: 'Mayorista person updated but not found' };
        }

        // Convertir ObjectId a string
        const mayoristaWithStringId = {
            ...updatedMayorista,
            _id: updatedMayorista._id.toString(),
        } as MayoristaPerson;

        return { success: true, mayorista: mayoristaWithStringId };
    } catch (error) {
        console.error('Error updating mayorista person:', error);
        return { success: false, error: 'Internal server error' };
    }
}

// Función para eliminar un mayorista
export async function deleteMayoristaPerson(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        const collection = await getCollection('mayoristas');
        const result = await collection.deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 0) {
            return { success: false, error: 'Mayorista person not found' };
        }

        return { success: true };
    } catch (error) {
        console.error('Error deleting mayorista person:', error);
        return { success: false, error: 'Internal server error' };
    }
}

// Función para buscar mayoristas por término de búsqueda
export async function searchMayoristas(searchTerm: string): Promise<{ success: boolean; mayoristas?: MayoristaPerson[]; error?: string }> {
    try {
        if (!searchTerm || searchTerm.length < 2) {
            return { success: true, mayoristas: [] };
        }

        const collection = await getCollection('mayoristas');

        // Buscar por nombre, apellido, email o teléfono
        const mayoristas = await collection.find({
            $or: [
                { 'user.name': { $regex: searchTerm, $options: 'i' } },
                { 'user.lastName': { $regex: searchTerm, $options: 'i' } },
                { 'user.email': { $regex: searchTerm, $options: 'i' } },
                { 'address.phone': { $regex: searchTerm, $options: 'i' } }
            ]
        }).limit(10).toArray();

        // Convertir ObjectIds a strings
        const mayoristasWithStringIds = mayoristas.map(mayorista => ({
            ...mayorista,
            _id: mayorista._id.toString(),
        })) as MayoristaPerson[];

        return { success: true, mayoristas: mayoristasWithStringIds };
    } catch (error) {
        console.error('Error searching mayoristas:', error);
        return { success: false, error: 'Internal server error' };
    }
}
