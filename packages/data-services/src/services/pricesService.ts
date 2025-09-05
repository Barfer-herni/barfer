'use server'

import { revalidatePath } from 'next/cache';
import { database } from '@repo/database';
import { PriceSection, PriceType } from '@repo/database';

/**
 * Tipos para el servicio de precios
 */
export interface PriceData {
    id?: string;
    section: PriceSection;
    product: string;
    weight?: string | null;
    priceType: PriceType;
    price: number;
    isActive?: boolean;
}

export interface PriceFormData {
    section: PriceSection;
    product: string;
    weight?: string;
    priceType: PriceType;
    price: number;
    isActive?: boolean;
}

export interface GetPricesParams {
    section?: PriceSection;
    product?: string;
    priceType?: PriceType;
    isActive?: boolean;
}

/**
 * Obtener todos los precios con filtros opcionales
 */
export async function getPrices(params?: GetPricesParams) {
    try {
        const whereClause: any = {};

        if (params?.section) {
            whereClause.section = params.section;
        }

        if (params?.product) {
            whereClause.product = {
                contains: params.product,
                mode: 'insensitive'
            };
        }

        if (params?.priceType) {
            whereClause.priceType = params.priceType;
        }

        if (params?.isActive !== undefined) {
            whereClause.isActive = params.isActive;
        }

        const prices = await database.price.findMany({
            where: whereClause,
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
        };
    } catch (error) {
        console.error('Error al obtener precios:', error);
        return {
            success: false,
            message: 'Error al obtener los precios',
            error: 'FETCH_PRICES_ERROR'
        };
    }
}

/**
 * Obtener un precio por ID
 */
export async function getPriceById(id: string) {
    try {
        const price = await database.price.findUnique({
            where: { id },
        });

        if (!price) {
            return {
                success: false,
                message: 'Precio no encontrado',
                error: 'PRICE_NOT_FOUND'
            };
        }

        return {
            success: true,
            price,
        };
    } catch (error) {
        console.error('Error al obtener precio:', error);
        return {
            success: false,
            message: 'Error al obtener el precio',
            error: 'FETCH_PRICE_ERROR'
        };
    }
}

/**
 * Crear un nuevo precio
 */
export async function createPrice(data: PriceFormData) {
    try {
        // Verificar si ya existe un precio con la misma combinación
        const existingPrice = await database.price.findFirst({
            where: {
                section: data.section,
                product: data.product,
                weight: data.weight || null,
                priceType: data.priceType
            }
        });

        if (existingPrice) {
            return {
                success: false,
                message: 'Ya existe un precio para esta combinación',
                error: 'PRICE_ALREADY_EXISTS'
            };
        }

        const price = await database.price.create({
            data: {
                section: data.section,
                product: data.product,
                weight: data.weight || null,
                priceType: data.priceType,
                price: data.price,
                isActive: data.isActive ?? true,
            },
        });

        revalidatePath('/admin/prices');

        return {
            success: true,
            price,
            message: 'Precio creado exitosamente'
        };
    } catch (error) {
        console.error('Error al crear precio:', error);
        return {
            success: false,
            message: 'Error al crear el precio',
            error: 'CREATE_PRICE_ERROR'
        };
    }
}

/**
 * Actualizar un precio existente
 */
export async function updatePrice(id: string, data: Partial<PriceFormData>) {
    try {
        const existingPrice = await database.price.findUnique({
            where: { id },
        });

        if (!existingPrice) {
            return {
                success: false,
                message: 'Precio no encontrado',
                error: 'PRICE_NOT_FOUND'
            };
        }

        // Si se está actualizando la combinación única, verificar que no exista ya
        if (data.section || data.product || data.weight !== undefined || data.priceType) {
            const newCombination = {
                section: data.section ?? existingPrice.section,
                product: data.product ?? existingPrice.product,
                weight: data.weight !== undefined ? (data.weight || null) : existingPrice.weight,
                priceType: data.priceType ?? existingPrice.priceType
            };

            const duplicatePrice = await database.price.findFirst({
                where: newCombination
            });

            if (duplicatePrice && duplicatePrice.id !== id) {
                return {
                    success: false,
                    message: 'Ya existe un precio para esta combinación',
                    error: 'PRICE_ALREADY_EXISTS'
                };
            }
        }

        const updatedPrice = await database.price.update({
            where: { id },
            data: {
                ...(data.section && { section: data.section }),
                ...(data.product && { product: data.product }),
                ...(data.weight !== undefined && { weight: data.weight || null }),
                ...(data.priceType && { priceType: data.priceType }),
                ...(data.price !== undefined && { price: data.price }),
                ...(data.isActive !== undefined && { isActive: data.isActive }),
            },
        });

        revalidatePath('/admin/prices');

        return {
            success: true,
            price: updatedPrice,
            message: 'Precio actualizado exitosamente'
        };
    } catch (error) {
        console.error('Error al actualizar precio:', error);
        return {
            success: false,
            message: 'Error al actualizar el precio',
            error: 'UPDATE_PRICE_ERROR'
        };
    }
}

/**
 * Eliminar un precio
 */
export async function deletePrice(id: string) {
    try {
        const existingPrice = await database.price.findUnique({
            where: { id },
        });

        if (!existingPrice) {
            return {
                success: false,
                message: 'Precio no encontrado',
                error: 'PRICE_NOT_FOUND'
            };
        }

        await database.price.delete({
            where: { id },
        });

        revalidatePath('/admin/prices');

        return {
            success: true,
            message: 'Precio eliminado exitosamente'
        };
    } catch (error) {
        console.error('Error al eliminar precio:', error);
        return {
            success: false,
            message: 'Error al eliminar el precio',
            error: 'DELETE_PRICE_ERROR'
        };
    }
}

/**
 * Obtener precio específico para un producto basado en tipo de cliente y método de pago
 */
export async function getProductPrice(
    product: string,
    weight: string | null,
    orderType: 'minorista' | 'mayorista',
    paymentMethod: string
): Promise<{ success: boolean; price?: number; error?: string }> {
    try {
        // Determinar la sección y producto primero para verificar si es solo mayorista
        const productUpper = product.toUpperCase();
        const weightUpper = weight?.toUpperCase() || '';
        const isOnlyMayoristaProduct = productUpper.includes('GARRAS') ||
            productUpper.includes('CALDO') ||
            (productUpper.includes('CORNALITOS') && (weightUpper === '200GRS' || weightUpper === '30GRS')) ||
            productUpper.includes('HUESOS RECREATIVO') ||
            productUpper.includes('HUESO RECREATIVO');

        // Mapear orderType y paymentMethod a PriceType
        let priceType: PriceType;

        if (orderType === 'mayorista' || isOnlyMayoristaProduct) {
            // Si es mayorista O es un producto que solo existe en mayorista
            priceType = 'MAYORISTA';
        } else {
            // Para minorista, depende del método de pago
            if (paymentMethod === 'cash') {
                priceType = 'EFECTIVO';
            } else {
                // transferencia, mercado pago, etc.
                priceType = 'TRANSFERENCIA';
            }
        }

        // Determinar la sección basada en el producto
        let section: PriceSection;

        if (productUpper.includes('GATO')) {
            section = 'GATO';
        } else if (productUpper.includes('PERRO') || productUpper.includes('BOX') || productUpper.includes('BIG DOG')) {
            section = 'PERRO';
        } else if (productUpper.includes('HUESOS') || productUpper.includes('HUESO') ||
            productUpper.includes('COMPLEMENTOS') || productUpper.includes('COMPLEMENTO') ||
            productUpper.includes('GARRAS') || productUpper.includes('CALDO') ||
            productUpper.includes('CORNALITOS') || productUpper.includes('RECREATIVO') ||
            productUpper.includes('BOX DE COMPLEMENTOS')) {
            section = 'OTROS';
        } else {
            section = 'OTROS';
        }

        // Normalizar el nombre del producto para la búsqueda
        let searchProduct = product.toUpperCase();

        // Mapear nombres de productos comunes
        if (searchProduct.includes('BOX') && searchProduct.includes('POLLO')) {
            searchProduct = 'POLLO';
        } else if (searchProduct.includes('BOX') && searchProduct.includes('VACA')) {
            searchProduct = 'VACA';
        } else if (searchProduct.includes('BOX') && searchProduct.includes('CERDO')) {
            searchProduct = 'CERDO';
        } else if (searchProduct.includes('BOX') && searchProduct.includes('CORDERO')) {
            searchProduct = 'CORDERO';
        } else if (searchProduct.includes('BOX') && searchProduct.includes('COMPLEMENTO')) {
            searchProduct = 'BOX DE COMPLEMENTOS';
        } else if (searchProduct.includes('BIG DOG') && searchProduct.includes('VACA')) {
            searchProduct = 'BIG DOG VACA';
        } else if (searchProduct.includes('BIG DOG') && searchProduct.includes('POLLO')) {
            searchProduct = 'BIG DOG POLLO';
        } else if (searchProduct === 'HUESOS CARNOSOS 5KG') {
            // Ya está en el formato correcto, no cambiar nada
            searchProduct = 'HUESOS CARNOSOS 5KG';
        } else if (searchProduct.includes('HUESOS CARNOSOS') ||
            searchProduct.includes('HUESO CARNOSO') ||
            searchProduct.includes('HUESOS CARNOSO') ||
            searchProduct.includes('HUESO CARNOSOS') ||
            (searchProduct.includes('HUESO') && searchProduct.includes('CARNOSO'))) {
            searchProduct = 'HUESOS CARNOSOS 5KG';
        } else if (searchProduct.includes('HUESO RECREATIVO') || searchProduct.includes('HUESOS RECREATIVO')) {
            searchProduct = 'HUESOS RECREATIVOS';
        } else if (searchProduct.includes('COMPLEMENTOS') && !searchProduct.includes('BOX')) {
            searchProduct = 'BOX DE COMPLEMENTOS';
        } else if (searchProduct.includes('GARRAS')) {
            searchProduct = 'GARRAS';
        } else if (searchProduct.includes('CALDO')) {
            searchProduct = 'CALDO DE HUESOS';
        } else if (searchProduct.includes('CORNALITOS') && weight === '200GRS') {
            // CORNALITOS 200GRS usa el peso en la búsqueda
            searchProduct = 'CORNALITOS';
        } else if (searchProduct.includes('CORNALITOS') && weight === '30GRS') {
            // CORNALITOS 30GRS también existe en la DB pero con precio 0
            searchProduct = 'CORNALITOS';
        }

        // Para productos BIG DOG y algunos productos OTROS, el peso puede ser null
        // HUESOS CARNOSOS 5KG tiene el peso en el nombre, por lo que se guarda con weight: null
        // CORNALITOS usa el peso real (200GRS) en la búsqueda, no null
        const searchWeight = (searchProduct.startsWith('BIG DOG') ||
            ['GARRAS', 'CALDO DE HUESOS', 'HUESOS RECREATIVOS', 'BOX DE COMPLEMENTOS', 'HUESOS CARNOSOS 5KG'].includes(searchProduct))
            ? null : weight;

        // Debug: Log del mapeo
        console.log(`🔍 MAPEO DE PRODUCTO:`, {
            original: product,
            mapped: searchProduct,
            section,
            originalWeight: weight,
            searchWeight,
            priceType,
            orderType,
            paymentMethod,
            isOnlyMayoristaProduct,
            forcedMayorista: isOnlyMayoristaProduct && orderType !== 'mayorista'
        });

        // Debug adicional para HUESOS CARNOSOS
        if (product.toUpperCase().includes('HUESO') || product.toUpperCase().includes('CARNOSO')) {
            console.log(`🔍 DEBUG HUESO CARNOSO:`, {
                productUpper: product.toUpperCase(),
                searchProductAfterMapping: searchProduct,
                includesHuesoCarnoso: product.toUpperCase().includes('HUESO CARNOSO'),
                includesHuesosCarnosos: product.toUpperCase().includes('HUESOS CARNOSOS'),
                includesHuesoAndCarnoso: product.toUpperCase().includes('HUESO') && product.toUpperCase().includes('CARNOSO'),
                mappingConditions: {
                    condition1: searchProduct.includes('HUESOS CARNOSOS'),
                    condition2: searchProduct.includes('HUESO CARNOSO'),
                    condition3: searchProduct.includes('HUESOS CARNOSO'),
                    condition4: searchProduct.includes('HUESO CARNOSOS'),
                    condition5: (searchProduct.includes('HUESO') && searchProduct.includes('CARNOSO'))
                }
            });
        }

        // Debug: Parámetros de búsqueda en DB
        console.log(`🔍 BÚSQUEDA EN DB:`, {
            section,
            product: searchProduct,
            weight: searchWeight,
            priceType,
            isActive: true
        });

        // Buscar el precio en la base de datos
        const priceRecord = await database.price.findFirst({
            where: {
                section,
                product: searchProduct,
                weight: searchWeight,
                priceType,
                isActive: true
            }
        });

        console.log(`💰 Precio encontrado:`, priceRecord ? `$${priceRecord.price}` : 'NO ENCONTRADO');

        if (!priceRecord) {
            // Debug: Buscar productos similares para ver qué hay en la DB
            const similarProducts = await database.price.findMany({
                where: {
                    section,
                    isActive: true,
                    OR: [
                        { product: { contains: 'HUESO', mode: 'insensitive' } },
                        { product: { contains: 'CARNOSO', mode: 'insensitive' } }
                    ]
                },
                take: 10
            });

            console.log(`🔍 PRODUCTOS SIMILARES ENCONTRADOS EN DB:`, similarProducts.map(p => ({
                product: p.product,
                weight: p.weight,
                priceType: p.priceType,
                price: p.price
            })));

            return {
                success: false,
                error: `No se encontró precio para ${product} (${weight}) - ${priceType} | Mapeado como: ${searchProduct} en sección ${section}`
            };
        }

        return {
            success: true,
            price: priceRecord.price
        };
    } catch (error) {
        console.error('Error al obtener precio del producto:', error);
        return {
            success: false,
            error: 'Error al obtener el precio del producto'
        };
    }
}

/**
 * Calcular el total de una orden basado en sus items, tipo de cliente y método de pago
 */
export async function calculateOrderTotal(
    items: Array<{
        name: string;
        options: Array<{
            name: string;
            quantity: number;
        }>;
    }>,
    orderType: 'minorista' | 'mayorista',
    paymentMethod: string
): Promise<{ success: boolean; total?: number; itemPrices?: Array<{ name: string; weight: string; unitPrice: number; quantity: number; subtotal: number }>; error?: string }> {
    try {
        let total = 0;
        const itemPrices = [];

        for (const item of items) {
            let weight = item.options[0]?.name || null;
            let productName = item.name;
            const quantity = item.options[0]?.quantity || 1;

            // Manejo especial para BIG DOG
            if (productName.includes('BIG DOG (15kg)') && weight && ['VACA', 'POLLO', 'CORDERO'].includes(weight.toUpperCase())) {
                // Para BIG DOG, el sabor está en weight y el producto debe ser "BIG DOG SABOR"
                productName = `BIG DOG ${weight.toUpperCase()}`;
                weight = null; // BIG DOG no tiene peso específico en la tabla de precios
            }

            const priceResult = await getProductPrice(productName, weight, orderType, paymentMethod);

            if (!priceResult.success || !priceResult.price) {
                console.warn(`No se pudo obtener precio para ${item.name} (${weight}):`, priceResult.error);
                // Continuar con los otros items, no fallar toda la orden
                continue;
            }

            const subtotal = priceResult.price * quantity;
            total += subtotal;

            itemPrices.push({
                name: item.name,
                weight: weight || 'N/A',
                unitPrice: priceResult.price,
                quantity,
                subtotal
            });
        }

        return {
            success: true,
            total,
            itemPrices
        };
    } catch (error) {
        console.error('Error al calcular total de la orden:', error);
        return {
            success: false,
            error: 'Error al calcular el total de la orden'
        };
    }
}

/**
 * Inicializar precios por defecto según la estructura definida
 */
export async function initializeDefaultPrices() {
    try {
        const defaultPrices: PriceFormData[] = [
            // PERRO - POLLO
            { section: 'PERRO', product: 'POLLO', weight: '5KG', priceType: 'EFECTIVO', price: 0 },
            { section: 'PERRO', product: 'POLLO', weight: '5KG', priceType: 'TRANSFERENCIA', price: 0 },
            { section: 'PERRO', product: 'POLLO', weight: '5KG', priceType: 'MAYORISTA', price: 0 },
            { section: 'PERRO', product: 'POLLO', weight: '10KG', priceType: 'EFECTIVO', price: 0 },
            { section: 'PERRO', product: 'POLLO', weight: '10KG', priceType: 'TRANSFERENCIA', price: 0 },
            { section: 'PERRO', product: 'POLLO', weight: '10KG', priceType: 'MAYORISTA', price: 0 },

            // PERRO - VACA
            { section: 'PERRO', product: 'VACA', weight: '5KG', priceType: 'EFECTIVO', price: 0 },
            { section: 'PERRO', product: 'VACA', weight: '5KG', priceType: 'TRANSFERENCIA', price: 0 },
            { section: 'PERRO', product: 'VACA', weight: '5KG', priceType: 'MAYORISTA', price: 0 },
            { section: 'PERRO', product: 'VACA', weight: '10KG', priceType: 'EFECTIVO', price: 0 },
            { section: 'PERRO', product: 'VACA', weight: '10KG', priceType: 'TRANSFERENCIA', price: 0 },
            { section: 'PERRO', product: 'VACA', weight: '10KG', priceType: 'MAYORISTA', price: 0 },

            // PERRO - CERDO
            { section: 'PERRO', product: 'CERDO', weight: '5KG', priceType: 'EFECTIVO', price: 0 },
            { section: 'PERRO', product: 'CERDO', weight: '5KG', priceType: 'TRANSFERENCIA', price: 0 },
            { section: 'PERRO', product: 'CERDO', weight: '5KG', priceType: 'MAYORISTA', price: 0 },
            { section: 'PERRO', product: 'CERDO', weight: '10KG', priceType: 'EFECTIVO', price: 0 },
            { section: 'PERRO', product: 'CERDO', weight: '10KG', priceType: 'TRANSFERENCIA', price: 0 },
            { section: 'PERRO', product: 'CERDO', weight: '10KG', priceType: 'MAYORISTA', price: 0 },

            // PERRO - CORDERO
            { section: 'PERRO', product: 'CORDERO', weight: '5KG', priceType: 'EFECTIVO', price: 0 },
            { section: 'PERRO', product: 'CORDERO', weight: '5KG', priceType: 'TRANSFERENCIA', price: 0 },
            { section: 'PERRO', product: 'CORDERO', weight: '5KG', priceType: 'MAYORISTA', price: 0 },
            { section: 'PERRO', product: 'CORDERO', weight: '10KG', priceType: 'EFECTIVO', price: 0 },
            { section: 'PERRO', product: 'CORDERO', weight: '10KG', priceType: 'TRANSFERENCIA', price: 0 },
            { section: 'PERRO', product: 'CORDERO', weight: '10KG', priceType: 'MAYORISTA', price: 0 },

            // PERRO - BIG DOG
            { section: 'PERRO', product: 'BIG DOG VACA', priceType: 'EFECTIVO', price: 0 },
            { section: 'PERRO', product: 'BIG DOG VACA', priceType: 'TRANSFERENCIA', price: 0 },
            { section: 'PERRO', product: 'BIG DOG VACA', priceType: 'MAYORISTA', price: 0 },
            { section: 'PERRO', product: 'BIG DOG POLLO', priceType: 'EFECTIVO', price: 0 },
            { section: 'PERRO', product: 'BIG DOG POLLO', priceType: 'TRANSFERENCIA', price: 0 },
            { section: 'PERRO', product: 'BIG DOG POLLO', priceType: 'MAYORISTA', price: 0 },

            // GATO
            { section: 'GATO', product: 'POLLO', weight: '5KG', priceType: 'EFECTIVO', price: 0 },
            { section: 'GATO', product: 'POLLO', weight: '5KG', priceType: 'TRANSFERENCIA', price: 0 },
            { section: 'GATO', product: 'POLLO', weight: '5KG', priceType: 'MAYORISTA', price: 0 },
            { section: 'GATO', product: 'VACA', weight: '5KG', priceType: 'EFECTIVO', price: 0 },
            { section: 'GATO', product: 'VACA', weight: '5KG', priceType: 'TRANSFERENCIA', price: 0 },
            { section: 'GATO', product: 'VACA', weight: '5KG', priceType: 'MAYORISTA', price: 0 },
            { section: 'GATO', product: 'CORDERO', weight: '5KG', priceType: 'EFECTIVO', price: 0 },
            { section: 'GATO', product: 'CORDERO', weight: '5KG', priceType: 'TRANSFERENCIA', price: 0 },
            { section: 'GATO', product: 'CORDERO', weight: '5KG', priceType: 'MAYORISTA', price: 0 },

            // OTROS
            { section: 'OTROS', product: 'HUESOS CARNOSOS 5KG', priceType: 'EFECTIVO', price: 0 },
            { section: 'OTROS', product: 'HUESOS CARNOSOS 5KG', priceType: 'TRANSFERENCIA', price: 0 },
            { section: 'OTROS', product: 'HUESOS CARNOSOS 5KG', priceType: 'MAYORISTA', price: 0 },
            { section: 'OTROS', product: 'BOX DE COMPLEMENTOS', priceType: 'EFECTIVO', price: 0 },
            { section: 'OTROS', product: 'BOX DE COMPLEMENTOS', priceType: 'TRANSFERENCIA', price: 0 },
            { section: 'OTROS', product: 'BOX DE COMPLEMENTOS', priceType: 'MAYORISTA', price: 0 },
            { section: 'OTROS', product: 'CORNALITOS', weight: '200GRS', priceType: 'MAYORISTA', price: 0 },
            { section: 'OTROS', product: 'CORNALITOS', weight: '30GRS', priceType: 'MAYORISTA', price: 0 },
            { section: 'OTROS', product: 'GARRAS', priceType: 'MAYORISTA', price: 0 },
            { section: 'OTROS', product: 'CALDO DE HUESOS', priceType: 'MAYORISTA', price: 0 },
            { section: 'OTROS', product: 'HUESOS RECREATIVOS', priceType: 'MAYORISTA', price: 0 },
        ];

        let created = 0;
        let skipped = 0;

        for (const priceData of defaultPrices) {
            const result = await createPrice(priceData);
            if (result.success) {
                created++;
            } else {
                skipped++;
            }
        }

        return {
            success: true,
            message: `Inicialización completada: ${created} precios creados, ${skipped} precios omitidos (ya existían)`,
            stats: { created, skipped }
        };
    } catch (error) {
        console.error('Error al inicializar precios:', error);
        return {
            success: false,
            message: 'Error al inicializar los precios por defecto',
            error: 'INITIALIZE_PRICES_ERROR'
        };
    }
} 