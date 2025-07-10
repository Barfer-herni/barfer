'use server'

import { revalidatePath } from 'next/cache';
import { GenericData, DataFormData } from '../types/data';
import 'server-only';
import { getCollection } from '@repo/database';
import { format } from 'date-fns';

/**
 * Obtener todos los datos
 */
export async function getAllData(category?: string) {
    try {
        // MOCKUP: Replace with actual database call
        let data = [
            { id: '1', key: 'site_title', value: 'Mi Sitio Web', category: 'settings', createdAt: new Date(), updatedAt: new Date() },
            { id: '2', key: 'contact_email', value: 'contact@example.com', category: 'settings', createdAt: new Date(), updatedAt: new Date() },
            { id: '3', key: 'featured_product', value: 'product-1', category: 'products', createdAt: new Date(), updatedAt: new Date() }
        ] as GenericData[];

        // Filter by category if provided
        if (category) {
            data = data.filter(item => item.category === category);
        }

        return data;

        // Implementation example:
        // const query = category 
        //    ? { where: { category } } 
        //    : {};
        // const data = await db.data.findMany({
        //     ...query,
        //     orderBy: { createdAt: 'desc' },
        // });
        // return data;
    } catch (error) {
        console.error("Error fetching data:", error);
        throw new Error("Failed to fetch data");
    }
}

/**
 * Obtener un dato por ID
 */
export async function getDataById(dataId: string) {
    try {
        // MOCKUP: Replace with actual database call
        return {
            id: dataId,
            key: 'sample_key',
            value: 'Sample Value',
            category: 'settings',
            createdAt: new Date(),
            updatedAt: new Date()
        } as GenericData;

        // Implementation example:
        // const data = await db.data.findUnique({
        //     where: { id: dataId },
        // });
        // return data;
    } catch (error) {
        console.error("Error fetching data:", error);
        throw new Error("Failed to fetch data");
    }
}

/**
 * Obtener un dato por clave
 */
export async function getDataByKey(key: string) {
    try {
        // MOCKUP: Replace with actual database call
        return {
            id: '123',
            key: key,
            value: 'Sample Value for ' + key,
            category: 'settings',
            createdAt: new Date(),
            updatedAt: new Date()
        } as GenericData;

        // Implementation example:
        // const data = await db.data.findUnique({
        //     where: { key },
        // });
        // return data;
    } catch (error) {
        console.error("Error fetching data by key:", error);
        throw new Error("Failed to fetch data by key");
    }
}

/**
 * Crear un nuevo dato
 */
export async function createData(data: DataFormData) {
    "use server";
    try {
        // MOCKUP: Replace with actual database call
        console.log('Creating data with:', data);
        return {
            id: '123',
            key: data.key,
            value: data.value,
            category: data.category,
            createdAt: new Date(),
            updatedAt: new Date()
        } as GenericData;

        // Implementation example:
        // const result = await db.data.create({
        //     data: {
        //         key: data.key,
        //         value: data.value,
        //         category: data.category,
        //     },
        // });
        revalidatePath('/admin/dashboard');
        // return result;
    } catch (error) {
        console.error("Error creating data:", error);
        throw new Error("Failed to create data");
    }
}

/**
 * Actualizar un dato existente
 */
export async function updateData(dataId: string, data: DataFormData) {
    "use server";
    try {
        // MOCKUP: Replace with actual database call
        console.log('Updating data', dataId, 'with:', data);
        const updatedData = {
            id: dataId,
            key: data.key,
            value: data.value,
            category: data.category,
            createdAt: new Date(),
            updatedAt: new Date()
        } as GenericData;

        // Implementation example:
        // const result = await db.data.update({
        //     where: { id: dataId },
        //     data: {
        //         key: data.key,
        //         value: data.value,
        //         category: data.category,
        //     },
        // });
        revalidatePath('/admin/dashboard');
        return updatedData;
    } catch (error) {
        console.error("Error updating data:", error);
        throw new Error("Failed to update data");
    }
}

/**
 * Eliminar un dato
 */
export async function deleteData(dataId: string) {
    "use server";
    try {
        // MOCKUP: Replace with actual database call
        console.log('Deleting data:', dataId);

        // Implementation example:
        // await db.data.delete({
        //     where: { id: dataId },
        // });
        revalidatePath('/admin/dashboard');
        return { success: true };
    } catch (error) {
        console.error("Error deleting data:", error);
        throw new Error("Failed to delete data");
    }
} 