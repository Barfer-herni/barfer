'use server'

import 'server-only';
import { revalidatePath } from 'next/cache';
import { database } from '@repo/database';
import { PriceSection, PriceType } from '@repo/database';

/**
 * Tipos para el servicio de precios de Barfer
 */
export interface BarferPriceData {
    id: string;
    section: PriceSection;
    product: string;
    weight?: string | null;
    priceType: PriceType;
    price: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface BarferUpdatePriceData {
    price: number;
}

/**
 * Obtener todos los precios de Barfer
 */
export async function getAllPrices() {
    try {
        const prices = await database.price.findMany({
            orderBy: [
                { section: 'asc' },
                { product: 'asc' },
                { weight: 'asc' },
                { priceType: 'asc' }
            ],
        });

        return {
            success: true,
            prices,
            total: prices.length
        };
    } catch (error) {
        console.error('Error getting prices:', error);
        return {
            success: false,
            message: 'Error al obtener los precios',
            error: 'GET_PRICES_ERROR',
            prices: [],
            total: 0
        };
    }
}

/**
 * Actualizar el precio de un producto específico
 */
export async function updateProductPrice(priceId: string, updateData: BarferUpdatePriceData) {
    try {
        // Verificar que el precio existe
        const existingPrice = await database.price.findUnique({
            where: { id: priceId },
        });

        if (!existingPrice) {
            return {
                success: false,
                message: 'Precio no encontrado',
                error: 'PRICE_NOT_FOUND'
            };
        }

        // Actualizar el precio
        const updatedPrice = await database.price.update({
            where: { id: priceId },
            data: {
                price: updateData.price,
                updatedAt: new Date(),
            },
        });

        // Revalidar la página de precios
        revalidatePath('/admin/prices');

        return {
            success: true,
            price: updatedPrice,
            message: 'Precio actualizado exitosamente'
        };
    } catch (error) {
        console.error('Error updating price:', error);
        return {
            success: false,
            message: 'Error al actualizar el precio',
            error: 'UPDATE_PRICE_ERROR'
        };
    }
}

/**
 * Inicializar precios por defecto de Barfer
 */
export async function initializeBarferPrices() {
    try {
        const defaultPrices = [
            // PERRO - POLLO
            { section: 'PERRO' as PriceSection, product: 'POLLO', weight: '5KG', priceType: 'EFECTIVO' as PriceType, price: 0 },
            { section: 'PERRO' as PriceSection, product: 'POLLO', weight: '5KG', priceType: 'TRANSFERENCIA' as PriceType, price: 0 },
            { section: 'PERRO' as PriceSection, product: 'POLLO', weight: '5KG', priceType: 'MAYORISTA' as PriceType, price: 0 },
            { section: 'PERRO' as PriceSection, product: 'POLLO', weight: '10KG', priceType: 'EFECTIVO' as PriceType, price: 0 },
            { section: 'PERRO' as PriceSection, product: 'POLLO', weight: '10KG', priceType: 'TRANSFERENCIA' as PriceType, price: 0 },
            { section: 'PERRO' as PriceSection, product: 'POLLO', weight: '10KG', priceType: 'MAYORISTA' as PriceType, price: 0 },

            // PERRO - VACA
            { section: 'PERRO' as PriceSection, product: 'VACA', weight: '5KG', priceType: 'EFECTIVO' as PriceType, price: 0 },
            { section: 'PERRO' as PriceSection, product: 'VACA', weight: '5KG', priceType: 'TRANSFERENCIA' as PriceType, price: 0 },
            { section: 'PERRO' as PriceSection, product: 'VACA', weight: '5KG', priceType: 'MAYORISTA' as PriceType, price: 0 },
            { section: 'PERRO' as PriceSection, product: 'VACA', weight: '10KG', priceType: 'EFECTIVO' as PriceType, price: 0 },
            { section: 'PERRO' as PriceSection, product: 'VACA', weight: '10KG', priceType: 'TRANSFERENCIA' as PriceType, price: 0 },
            { section: 'PERRO' as PriceSection, product: 'VACA', weight: '10KG', priceType: 'MAYORISTA' as PriceType, price: 0 },

            // PERRO - CERDO
            { section: 'PERRO' as PriceSection, product: 'CERDO', weight: '5KG', priceType: 'EFECTIVO' as PriceType, price: 0 },
            { section: 'PERRO' as PriceSection, product: 'CERDO', weight: '5KG', priceType: 'TRANSFERENCIA' as PriceType, price: 0 },
            { section: 'PERRO' as PriceSection, product: 'CERDO', weight: '5KG', priceType: 'MAYORISTA' as PriceType, price: 0 },
            { section: 'PERRO' as PriceSection, product: 'CERDO', weight: '10KG', priceType: 'EFECTIVO' as PriceType, price: 0 },
            { section: 'PERRO' as PriceSection, product: 'CERDO', weight: '10KG', priceType: 'TRANSFERENCIA' as PriceType, price: 0 },
            { section: 'PERRO' as PriceSection, product: 'CERDO', weight: '10KG', priceType: 'MAYORISTA' as PriceType, price: 0 },

            // PERRO - CORDERO
            { section: 'PERRO' as PriceSection, product: 'CORDERO', weight: '5KG', priceType: 'EFECTIVO' as PriceType, price: 0 },
            { section: 'PERRO' as PriceSection, product: 'CORDERO', weight: '5KG', priceType: 'TRANSFERENCIA' as PriceType, price: 0 },
            { section: 'PERRO' as PriceSection, product: 'CORDERO', weight: '5KG', priceType: 'MAYORISTA' as PriceType, price: 0 },
            { section: 'PERRO' as PriceSection, product: 'CORDERO', weight: '10KG', priceType: 'EFECTIVO' as PriceType, price: 0 },
            { section: 'PERRO' as PriceSection, product: 'CORDERO', weight: '10KG', priceType: 'TRANSFERENCIA' as PriceType, price: 0 },
            { section: 'PERRO' as PriceSection, product: 'CORDERO', weight: '10KG', priceType: 'MAYORISTA' as PriceType, price: 0 },

            // PERRO - BIG DOG
            { section: 'PERRO' as PriceSection, product: 'BIG DOG VACA', weight: null, priceType: 'EFECTIVO' as PriceType, price: 0 },
            { section: 'PERRO' as PriceSection, product: 'BIG DOG VACA', weight: null, priceType: 'TRANSFERENCIA' as PriceType, price: 0 },
            { section: 'PERRO' as PriceSection, product: 'BIG DOG VACA', weight: null, priceType: 'MAYORISTA' as PriceType, price: 0 },
            { section: 'PERRO' as PriceSection, product: 'BIG DOG POLLO', weight: null, priceType: 'EFECTIVO' as PriceType, price: 0 },
            { section: 'PERRO' as PriceSection, product: 'BIG DOG POLLO', weight: null, priceType: 'TRANSFERENCIA' as PriceType, price: 0 },
            { section: 'PERRO' as PriceSection, product: 'BIG DOG POLLO', weight: null, priceType: 'MAYORISTA' as PriceType, price: 0 },

            // GATO
            { section: 'GATO' as PriceSection, product: 'POLLO', weight: '5KG', priceType: 'EFECTIVO' as PriceType, price: 0 },
            { section: 'GATO' as PriceSection, product: 'POLLO', weight: '5KG', priceType: 'TRANSFERENCIA' as PriceType, price: 0 },
            { section: 'GATO' as PriceSection, product: 'POLLO', weight: '5KG', priceType: 'MAYORISTA' as PriceType, price: 0 },
            { section: 'GATO' as PriceSection, product: 'VACA', weight: '5KG', priceType: 'EFECTIVO' as PriceType, price: 0 },
            { section: 'GATO' as PriceSection, product: 'VACA', weight: '5KG', priceType: 'TRANSFERENCIA' as PriceType, price: 0 },
            { section: 'GATO' as PriceSection, product: 'VACA', weight: '5KG', priceType: 'MAYORISTA' as PriceType, price: 0 },
            { section: 'GATO' as PriceSection, product: 'CORDERO', weight: '5KG', priceType: 'EFECTIVO' as PriceType, price: 0 },
            { section: 'GATO' as PriceSection, product: 'CORDERO', weight: '5KG', priceType: 'TRANSFERENCIA' as PriceType, price: 0 },
            { section: 'GATO' as PriceSection, product: 'CORDERO', weight: '5KG', priceType: 'MAYORISTA' as PriceType, price: 0 },

            // OTROS
            { section: 'OTROS' as PriceSection, product: 'HUESOS CARNOSOS 5KG', weight: null, priceType: 'EFECTIVO' as PriceType, price: 0 },
            { section: 'OTROS' as PriceSection, product: 'HUESOS CARNOSOS 5KG', weight: null, priceType: 'TRANSFERENCIA' as PriceType, price: 0 },
            { section: 'OTROS' as PriceSection, product: 'HUESOS CARNOSOS 5KG', weight: null, priceType: 'MAYORISTA' as PriceType, price: 0 },
            { section: 'OTROS' as PriceSection, product: 'COMPLEMENTOS', weight: null, priceType: 'EFECTIVO' as PriceType, price: 0 },
            { section: 'OTROS' as PriceSection, product: 'COMPLEMENTOS', weight: null, priceType: 'TRANSFERENCIA' as PriceType, price: 0 },
            { section: 'OTROS' as PriceSection, product: 'COMPLEMENTOS', weight: null, priceType: 'MAYORISTA' as PriceType, price: 0 },
            { section: 'OTROS' as PriceSection, product: 'CORNALITOS', weight: null, priceType: 'MAYORISTA' as PriceType, price: 0 },
            { section: 'OTROS' as PriceSection, product: 'GARRAS', weight: null, priceType: 'MAYORISTA' as PriceType, price: 0 },
            { section: 'OTROS' as PriceSection, product: 'CALDO DE HUESOS', weight: null, priceType: 'MAYORISTA' as PriceType, price: 0 },
            { section: 'OTROS' as PriceSection, product: 'HUESOS RECREATIVOS', weight: null, priceType: 'MAYORISTA' as PriceType, price: 0 },
        ];

        let created = 0;
        let skipped = 0;

        for (const priceData of defaultPrices) {
            try {
                // Verificar si ya existe
                const existing = await database.price.findFirst({
                    where: {
                        section: priceData.section,
                        product: priceData.product,
                        weight: priceData.weight,
                        priceType: priceData.priceType
                    }
                });

                if (!existing) {
                    await database.price.create({
                        data: {
                            section: priceData.section,
                            product: priceData.product,
                            weight: priceData.weight,
                            priceType: priceData.priceType,
                            price: priceData.price,
                            isActive: true,
                        },
                    });
                    created++;
                } else {
                    skipped++;
                }
            } catch (error) {
                console.error(`Error creating price for ${priceData.product}:`, error);
                skipped++;
            }
        }

        revalidatePath('/admin/prices');

        return {
            success: true,
            message: `Inicialización completada: ${created} precios creados, ${skipped} precios omitidos (ya existían)`,
            stats: { created, skipped }
        };
    } catch (error) {
        console.error('Error initializing Barfer prices:', error);
        return {
            success: false,
            message: 'Error al inicializar los precios por defecto',
            error: 'INITIALIZE_BARFER_PRICES_ERROR'
        };
    }
} 