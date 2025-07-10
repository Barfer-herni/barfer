'use server';

import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { ImageFormData } from "../types/image";
import { format } from 'date-fns';

// Configuración para Cloudflare R2
const s3Client = new S3Client({
    endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
    credentials: {
        accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
    },
    region: 'auto',
});

const BUCKET_NAME = 'r2-lucasdev';

export interface S3UploadResponse {
    url: string;
    key: string;
}

/**
 * Subir una imagen a Cloudflare R2
 */
export async function uploadR2Image(formData: ImageFormData): Promise<S3UploadResponse> {
    try {
        let fileBuffer: Buffer;
        let fileName: string;
        let contentType: string;

        // Manejar diferentes tipos de input
        if (formData.file) {
            // Si viene un archivo directo
            fileBuffer = Buffer.from(await formData.file.arrayBuffer());
            fileName = formData.name.replace(/\s+/g, '-').toLowerCase();
            contentType = formData.file.type || 'image/jpeg';
        } else if (formData.url.startsWith('data:')) {
            // Si viene base64
            const res = await fetch(formData.url);
            const blob = await res.blob();
            fileBuffer = Buffer.from(await blob.arrayBuffer());
            fileName = `${formData.name.replace(/\s+/g, '-').toLowerCase()}.jpg`;
            contentType = 'image/jpeg';
        } else {
            throw new Error('No se proporcionó un archivo válido');
        }

        // Generar key único con timestamp
        const timestamp = format(new Date(), 'yyyyMMdd_HHmmss');
        const key = `${formData.folder}/${timestamp}-${fileName}`;

        const upload = new Upload({
            client: s3Client,
            params: {
                Bucket: BUCKET_NAME,
                Key: key,
                Body: fileBuffer,
                ACL: 'public-read',
                ContentType: contentType,
            },
        });

        const result = await upload.done();

        if (!result.Location || !result.Key) {
            throw new Error('Error al subir el archivo a R2');
        }

        // Formatear URL para Cloudflare R2
        const url = formatR2Url(result.Key);

        if (!url) {
            throw new Error('Error al generar URL del archivo');
        }

        return {
            url,
            key: result.Key,
        };
    } catch (error) {
        console.error("Error uploading image to R2:", error);
        throw new Error("Failed to upload image to R2");
    }
}

/**
 * Actualizar una imagen existente en R2
 */
export async function updateR2Image(key: string, formData: ImageFormData): Promise<string> {
    try {
        if (!key || !formData.file) {
            throw new Error('Parámetros inválidos para actualizar imagen');
        }

        let fileBuffer: Buffer;
        let contentType: string;

        if (formData.file) {
            fileBuffer = Buffer.from(await formData.file.arrayBuffer());
            contentType = formData.file.type || 'image/jpeg';
        } else {
            throw new Error('No se proporcionó un archivo válido');
        }

        const upload = new Upload({
            client: s3Client,
            params: {
                Bucket: BUCKET_NAME,
                Key: key,
                Body: fileBuffer,
                ACL: 'public-read',
                ContentType: contentType,
            },
        });

        const result = await upload.done();

        if (!result.Key || !result.Location) {
            throw new Error('Error al actualizar el archivo en R2');
        }

        const url = formatR2Url(result.Key);

        if (!url) {
            throw new Error('Error al generar URL del archivo actualizado');
        }

        return url;
    } catch (error) {
        console.error("Error updating image in R2:", error);
        throw new Error("Error al actualizar el archivo");
    }
}

/**
 * Eliminar una imagen de R2
 */
export async function deleteR2Image(key: string): Promise<boolean> {
    try {
        const deleteCommand = new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
        });

        await s3Client.send(deleteCommand);
        return true;
    } catch (error) {
        console.error("Error deleting image from R2:", error);
        throw new Error("Error al eliminar el archivo");
    }
}

/**
 * Formatear URL de Cloudflare R2 para acceso público
 */
function formatR2Url(key: string): string {
    // Tu dominio público R2
    const publicDomain = process.env.CLOUDFLARE_R2_PUBLIC_DOMAIN;

    return `${publicDomain}/${key}`;
} 