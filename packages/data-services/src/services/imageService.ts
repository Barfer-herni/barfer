'use server'

import 'server-only';
import { getCollection } from '@repo/database';
import { format } from 'date-fns';
import { revalidatePath } from 'next/cache';
import { ImageFormData } from '../types/image';

/**
 * Obtener todas las imágenes
 */
export async function getAllImages() {
    try {
        // MOCKUP: Replace with actual database call
        let images = [
            { id: '1', name: 'Image 1', alt: 'Description 1', url: 'https://example.com/image1.jpg', type: 'IMAGE', createdAt: new Date() },
            { id: '2', name: 'Image 2', alt: 'Description 2', url: 'https://example.com/image2.jpg', type: 'IMAGE', createdAt: new Date() }
        ];

        // Original implementation:
        // const images = await db.media.findMany({
        //     orderBy: { createdAt: 'desc' },
        // });
        // return images;
    } catch (error) {
        console.error("Error fetching images:", error);
        throw new Error("Failed to fetch images");
    }
}

/**
 * Obtener una imagen por ID
 */
export async function getImageById(imageId: string) {
    try {
        // MOCKUP: Replace with actual database call
        return {
            id: imageId,
            name: 'Sample Image',
            alt: 'Sample Alt',
            url: 'https://example.com/image.jpg',
            type: 'IMAGE',
            createdAt: new Date()
        };

        // Original implementation:
        // const image = await db.media.findUnique({
        //     where: { id: imageId },
        // });
        // return image;
    } catch (error) {
        console.error("Error fetching image:", error);
        throw new Error("Failed to fetch image");
    }
}

/**
 * Crear una nueva imagen
 */
export async function createImage(data: ImageFormData) {
    "use server";
    try {
        // MOCKUP: Replace with actual database call
        const newImage = {
            id: Date.now().toString(),
            name: data.name,
            alt: data.alt || null,
            url: data.url,
            type: 'IMAGE',
            createdAt: new Date()
        };

        // Original implementation:
        // const image = await db.media.create({
        //     data: {
        //         name: data.name,
        //         alt: data.alt || null,
        //         url: data.url,
        //         type: 'IMAGE',
        //     },
        // });
        revalidatePath('/admin/dashboard');
        return newImage;
    } catch (error) {
        console.error("Error creating image:", error);
        throw new Error("Failed to create image");
    }
}

/**
 * Actualizar una imagen existente
 */
export async function updateImage(imageId: string, data: ImageFormData) {
    "use server";
    try {
        // MOCKUP: Replace with actual database call
        const newImage = {
            id: Date.now().toString(),
            name: data.name,
            alt: data.alt || null,
            url: data.url,
            type: 'IMAGE',
            createdAt: new Date()
        };

        // Original implementation:
        // const image = await db.media.update({
        //     where: { id: imageId },
        //     data: {
        //         name: data.name,
        //         alt: data.alt || null,
        //         url: data.url,
        //     },
        // });
        revalidatePath('/admin/dashboard');
        return newImage;
    } catch (error) {
        console.error("Error updating image:", error);
        throw new Error("Failed to update image");
    }
}

/**
 * Eliminar una imagen
 */
export async function deleteImage(imageId: string) {
    "use server";
    try {
        // MOCKUP: Replace with actual database call
        console.log('Deleting image:', imageId);

        // Original implementation:
        // await db.media.delete({
        //     where: { id: imageId },
        // });
        revalidatePath('/admin/dashboard');
        return { success: true };
    } catch (error) {
        console.error("Error deleting image:", error);
        throw new Error("Failed to delete image");
    }
}