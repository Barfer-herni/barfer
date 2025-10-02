'use server'

import 'server-only';
import { revalidatePath } from 'next/cache';
import { getCollection, ObjectId } from '@repo/database';
import type {
    Price,
    PriceSection,
    PriceType,
    CreatePriceData,
    UpdatePriceData,
    PriceHistoryQuery,
    PriceHistory,
    PriceStats
} from '../../types/barfer';

/**
 * Convierte un documento de MongoDB a un objeto Price serializable
 */
function transformMongoPrice(mongoDoc: any): Price {
    return {
        _id: String(mongoDoc._id),
        section: mongoDoc.section,
        product: mongoDoc.product,
        weight: mongoDoc.weight,
        priceType: mongoDoc.priceType,
        price: mongoDoc.price,
        isActive: mongoDoc.isActive,
        effectiveDate: mongoDoc.effectiveDate,
        month: mongoDoc.month,
        year: mongoDoc.year,
        createdAt: mongoDoc.createdAt,
        updatedAt: mongoDoc.updatedAt
    };
}

/**
 * Obtener todos los precios activos
 */
export async function getAllPrices(): Promise<{
    success: boolean;
    prices: Price[];
    total: number;
    message?: string;
    error?: string;
}> {
    try {
        const collection = await getCollection('prices');

        const mongoPrices = await collection.find(
            { isActive: true },
            {
                sort: {
                    section: 1,
                    product: 1,
                    weight: 1,
                    priceType: 1,
                    effectiveDate: -1
                }
            }
        ).toArray();

        const prices = mongoPrices.map(transformMongoPrice);

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
 * Obtener precios por filtros específicos (incluye historial)
 */
export async function getPrices(query: PriceHistoryQuery): Promise<{
    success: boolean;
    prices: Price[];
    total: number;
    message?: string;
    error?: string;
}> {
    try {
        const collection = await getCollection('prices');

        // Construir el filtro
        const filter: any = {};

        if (query.section) filter.section = query.section;
        if (query.product) filter.product = query.product;
        if (query.weight !== undefined) filter.weight = query.weight;
        if (query.priceType) filter.priceType = query.priceType;
        if (query.isActive !== undefined) filter.isActive = query.isActive;
        if (query.month) filter.month = query.month;
        if (query.year) filter.year = query.year;
        if (query.effectiveDate) filter.effectiveDate = query.effectiveDate;

        const mongoPrices = await collection.find(filter, {
            sort: {
                section: 1,
                product: 1,
                weight: 1,
                priceType: 1,
                effectiveDate: -1
            }
        }).toArray();

        const prices = mongoPrices.map(transformMongoPrice);

        return {
            success: true,
            prices,
            total: prices.length
        };
    } catch (error) {
        console.error('Error getting filtered prices:', error);
        return {
            success: false,
            message: 'Error al obtener los precios filtrados',
            error: 'GET_FILTERED_PRICES_ERROR',
            prices: [],
            total: 0
        };
    }
}

/**
 * Obtener historial de precios para un producto específico
 */
export async function getPriceHistory(
    section: PriceSection,
    product: string,
    weight: string | undefined,
    priceType: PriceType
): Promise<{
    success: boolean;
    history?: PriceHistory;
    message?: string;
    error?: string;
}> {
    try {
        const collection = await getCollection('prices');

        const filter: any = {
            section,
            product,
            priceType
        };

        if (weight !== undefined) {
            filter.weight = weight;
        }

        const prices = await collection.find(filter, {
            sort: { effectiveDate: -1 }
        }).toArray() as unknown as Price[];

        const history: PriceHistory = {
            product,
            section,
            weight,
            priceType,
            history: prices.map((price: Price) => ({
                price: price.price,
                effectiveDate: price.effectiveDate,
                month: price.month,
                year: price.year,
                createdAt: price.createdAt
            }))
        };

        return {
            success: true,
            history
        };
    } catch (error) {
        console.error('Error getting price history:', error);
        return {
            success: false,
            message: 'Error al obtener el historial de precios',
            error: 'GET_PRICE_HISTORY_ERROR'
        };
    }
}

/**
 * Crear un nuevo precio (con fecha efectiva)
 */
export async function createPrice(data: CreatePriceData): Promise<{
    success: boolean;
    price?: Price;
    message?: string;
    error?: string;
}> {
    try {
        const collection = await getCollection('prices');

        // Determinar la fecha efectiva
        const effectiveDate = data.effectiveDate || new Date().toISOString().split('T')[0];
        const effectiveDateObj = new Date(effectiveDate);

        const now = new Date().toISOString();

        const newPrice: Price = {
            _id: new ObjectId(),
            section: data.section,
            product: data.product,
            weight: data.weight,
            priceType: data.priceType,
            price: data.price,
            isActive: data.isActive ?? true,
            effectiveDate,
            month: effectiveDateObj.getMonth() + 1, // getMonth() returns 0-11
            year: effectiveDateObj.getFullYear(),
            createdAt: now,
            updatedAt: now
        };

        await collection.insertOne(newPrice as any);

        // Revalidar la página de precios
        revalidatePath('/admin/prices');

        // Convertir ObjectId a string para compatibilidad con Client Components
        const serializedPrice = {
            ...newPrice,
            _id: newPrice._id.toString()
        };

        return {
            success: true,
            price: serializedPrice,
            message: 'Precio creado exitosamente'
        };
    } catch (error) {
        console.error('Error creating price:', error);
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
export async function updatePrice(priceId: string, data: UpdatePriceData): Promise<{
    success: boolean;
    price?: Price;
    message?: string;
    error?: string;
}> {
    try {
        const collection = await getCollection('prices');

        // Buscar el precio existente
        const existingPrice = await collection.findOne({
            _id: new ObjectId(priceId)
        }) as unknown as Price | null;

        if (!existingPrice) {
            return {
                success: false,
                message: 'Precio no encontrado',
                error: 'PRICE_NOT_FOUND'
            };
        }

        // Actualizar directamente el precio existente
        const updatedPrice = await collection.findOneAndUpdate(
            { _id: new ObjectId(priceId) },
            {
                $set: {
                    price: data.price ?? existingPrice.price,
                    isActive: data.isActive ?? existingPrice.isActive,
                    updatedAt: new Date().toISOString()
                }
            },
            { returnDocument: 'after' }
        ) as unknown as Price;

        if (!updatedPrice) {
            return {
                success: false,
                message: 'No se pudo actualizar el precio',
                error: 'UPDATE_FAILED'
            };
        }

        revalidatePath('/admin/prices');

        return {
            success: true,
            price: transformMongoPrice(updatedPrice),
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
 * Eliminar un precio por ID
 */
export async function deletePrice(priceId: string): Promise<{
    success: boolean;
    message?: string;
    error?: string;
}> {
    try {
        const collection = await getCollection('prices');

        // Verificar que el precio existe
        const existingPrice = await collection.findOne({
            _id: new ObjectId(priceId)
        });

        if (!existingPrice) {
            return {
                success: false,
                message: 'Precio no encontrado',
                error: 'PRICE_NOT_FOUND'
            };
        }

        // Eliminar el precio
        const result = await collection.deleteOne({
            _id: new ObjectId(priceId)
        });

        if (result.deletedCount === 0) {
            return {
                success: false,
                message: 'No se pudo eliminar el precio',
                error: 'DELETE_FAILED'
            };
        }

        revalidatePath('/admin/prices');

        return {
            success: true,
            message: 'Precio eliminado exitosamente'
        };
    } catch (error) {
        console.error('Error deleting price:', error);
        return {
            success: false,
            message: 'Error al eliminar el precio',
            error: 'DELETE_PRICE_ERROR'
        };
    }
}

/**
 * Obtener todos los productos únicos con sus metadatos
 */
export async function getAllUniqueProducts(): Promise<{
    success: boolean;
    products: Array<{
        section: PriceSection;
        product: string;
        weight: string | null;
        priceTypes: PriceType[];
        totalPrices: number;
        isActive: boolean;
    }>;
    message?: string;
    error?: string;
}> {
    try {
        const collection = await getCollection('prices');

        // Agrupar por producto único (section + product + weight)
        const pipeline = [
            {
                $group: {
                    _id: {
                        section: "$section",
                        product: "$product",
                        weight: "$weight"
                    },
                    priceTypes: { $addToSet: "$priceType" },
                    totalPrices: { $sum: 1 },
                    isActive: { $max: { $cond: ["$isActive", 1, 0] } },
                    latestUpdate: { $max: "$updatedAt" }
                }
            },
            {
                $project: {
                    section: "$_id.section",
                    product: "$_id.product",
                    weight: "$_id.weight",
                    priceTypes: 1,
                    totalPrices: 1,
                    isActive: { $eq: ["$isActive", 1] },
                    latestUpdate: 1
                }
            },
            {
                $sort: {
                    section: 1,
                    product: 1,
                    weight: 1
                }
            }
        ];

        const products = await collection.aggregate(pipeline).toArray();

        return {
            success: true,
            products: products.map(p => ({
                section: p.section,
                product: p.product,
                weight: p.weight,
                priceTypes: p.priceTypes,
                totalPrices: p.totalPrices,
                isActive: p.isActive
            }))
        };
    } catch (error) {
        console.error('Error getting unique products:', error);
        return {
            success: false,
            message: 'Error al obtener los productos únicos',
            error: 'GET_UNIQUE_PRODUCTS_ERROR',
            products: []
        };
    }
}

/**
 * Obtener productos únicos formateados para select de items
 * Combina section, product y weight para formar el nombre completo del producto
 */
export async function getProductsForSelect(): Promise<{
    success: boolean;
    products: string[];
    productsWithDetails: Array<{
        section: PriceSection;
        product: string;
        weight: string | null;
        formattedName: string;
    }>;
    message?: string;
    error?: string;
}> {
    try {
        const collection = await getCollection('prices');

        // Obtener fecha actual en formato correcto
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

        console.log('🔍 getProductsForSelect - Filtrando con fecha:', todayStr);

        // Agrupar por producto único (section + product + weight) y obtener solo activos vigentes
        const pipeline = [
            {
                $match: {
                    isActive: true,
                    // Solo tomar precios cuya fecha efectiva sea menor o igual a hoy
                    effectiveDate: { $lte: todayStr }
                }
            },
            {
                $sort: { effectiveDate: -1, createdAt: -1 }
            },
            {
                // Normalizar a mayúsculas para agrupar correctamente
                $addFields: {
                    sectionUpper: { $toUpper: "$section" },
                    productUpper: { $toUpper: "$product" },
                    weightUpper: {
                        $cond: [
                            { $eq: ["$weight", null] },
                            null,
                            { $toUpper: "$weight" }
                        ]
                    }
                }
            },
            {
                $group: {
                    _id: {
                        section: "$sectionUpper",
                        product: "$productUpper",
                        weight: "$weightUpper"
                    },
                    latestPrice: { $first: "$$ROOT" }
                }
            },
            {
                $replaceRoot: { newRoot: "$latestPrice" }
            },
            {
                $project: {
                    section: { $toUpper: "$section" },
                    product: { $toUpper: "$product" },
                    weight: {
                        $cond: [
                            { $eq: ["$weight", null] },
                            null,
                            { $toUpper: "$weight" }
                        ]
                    }
                }
            },
            {
                $sort: {
                    section: 1,
                    product: 1,
                    weight: 1
                }
            }
        ];

        const products = await collection.aggregate(pipeline).toArray();

        // Formatear productos para el select: "section - product - weight"
        const productsWithDetails = products.map(p => {
            const parts = [p.section, p.product];
            if (p.weight) {
                parts.push(p.weight);
            }
            const formattedName = parts.join(' - ');

            return {
                section: p.section,
                product: p.product,
                weight: p.weight,
                formattedName
            };
        });

        const formattedProducts = productsWithDetails.map(p => p.formattedName);

        // Eliminar duplicados de productos y detalles
        const uniqueProducts = [...new Set(formattedProducts)];
        const uniqueProductsWithDetails = productsWithDetails.filter((product, index, self) =>
            index === self.findIndex(p => p.formattedName === product.formattedName)
        );

        return {
            success: true,
            products: uniqueProducts,
            productsWithDetails: uniqueProductsWithDetails
        };
    } catch (error) {
        console.error('Error getting products for select:', error);
        return {
            success: false,
            message: 'Error al obtener los productos para el select',
            error: 'GET_PRODUCTS_FOR_SELECT_ERROR',
            products: [],
            productsWithDetails: []
        };
    }
}

/**
 * Eliminar todos los precios de un producto específico
 */
export async function deleteProductPrices(section: PriceSection, product: string, weight: string | null): Promise<{
    success: boolean;
    deletedCount: number;
    message?: string;
    error?: string;
}> {
    try {
        const collection = await getCollection('prices');

        const filter: any = {
            section,
            product
        };

        if (weight !== null) {
            filter.weight = weight;
        } else {
            filter.$or = [
                { weight: null },
                { weight: { $exists: false } }
            ];
        }

        const result = await collection.deleteMany(filter);

        revalidatePath('/admin/prices');

        return {
            success: true,
            deletedCount: result.deletedCount,
            message: `Se eliminaron ${result.deletedCount} precios del producto ${product}`
        };
    } catch (error) {
        console.error('Error deleting product prices:', error);
        return {
            success: false,
            message: 'Error al eliminar los precios del producto',
            error: 'DELETE_PRODUCT_PRICES_ERROR',
            deletedCount: 0
        };
    }
}

/**
 * Actualizar todos los precios de un producto específico
 */
export async function updateProductPrices(
    oldSection: PriceSection,
    oldProduct: string,
    oldWeight: string | null,
    newData: {
        section?: PriceSection;
        product?: string;
        weight?: string | null;
    }
): Promise<{
    success: boolean;
    updatedCount: number;
    message?: string;
    error?: string;
}> {
    try {
        const collection = await getCollection('prices');

        const filter: any = {
            section: oldSection,
            product: oldProduct
        };

        if (oldWeight !== null) {
            filter.weight = oldWeight;
        } else {
            // Para productos sin peso específico, buscar documentos donde weight es null o no existe
            filter.$or = [
                { weight: null },
                { weight: { $exists: false } }
            ];
        }

        console.log('🔧 FILTER DEBUG:', {
            oldSection,
            oldProduct,
            oldWeight,
            filter
        });

        const updateData: any = {
            updatedAt: new Date().toISOString()
        };

        if (newData.section) updateData.section = newData.section;
        if (newData.product) updateData.product = newData.product;

        // Solo agregar weight si no es null
        if (newData.weight !== undefined && newData.weight !== null) {
            updateData.weight = newData.weight;
        }

        // Preparar la operación de actualización
        let updateOperation: any = { $set: updateData };

        // Si el peso es null, necesitamos usar $unset para eliminar el campo
        if (newData.weight !== undefined && newData.weight === null) {
            updateOperation = {
                $set: updateData,
                $unset: { weight: "" }
            };
        }

        console.log('🔧 UPDATE PRODUCT PRICES DEBUG:', {
            filter,
            updateOperation,
            oldWeight,
            newWeight: newData.weight
        });

        const result = await collection.updateMany(filter, updateOperation);

        console.log('🔧 UPDATE RESULT:', {
            matchedCount: result.matchedCount,
            modifiedCount: result.modifiedCount,
            acknowledged: result.acknowledged
        });

        revalidatePath('/admin/prices');

        return {
            success: true,
            updatedCount: result.modifiedCount,
            message: `Se actualizaron ${result.modifiedCount} precios del producto`
        };
    } catch (error) {
        console.error('Error updating product prices:', error);
        return {
            success: false,
            message: 'Error al actualizar los precios del producto',
            error: 'UPDATE_PRODUCT_PRICES_ERROR',
            updatedCount: 0
        };
    }
}

/**
 * Actualizar tipos de precio de un producto
 */
export async function updateProductPriceTypes(
    section: PriceSection,
    product: string,
    weight: string | null,
    oldPriceTypes: PriceType[],
    newPriceTypes: PriceType[]
): Promise<{
    success: boolean;
    addedCount: number;
    removedCount: number;
    message?: string;
    error?: string;
}> {
    try {
        const collection = await getCollection('prices');

        const filter: any = {
            section,
            product
        };

        if (weight !== null) {
            filter.weight = weight;
        } else {
            filter.$or = [
                { weight: null },
                { weight: { $exists: false } }
            ];
        }

        // Tipos de precio a agregar
        const typesToAdd = newPriceTypes.filter(type => !oldPriceTypes.includes(type));
        // Tipos de precio a quitar
        const typesToRemove = oldPriceTypes.filter(type => !newPriceTypes.includes(type));

        let addedCount = 0;
        let removedCount = 0;

        // Eliminar precios de tipos que ya no se necesitan
        if (typesToRemove.length > 0) {
            const removeFilter = { ...filter, priceType: { $in: typesToRemove } };
            const removeResult = await collection.deleteMany(removeFilter);
            removedCount = removeResult.deletedCount;
        }

        // Agregar precios para tipos nuevos (con precio 0)
        if (typesToAdd.length > 0) {
            const currentDate = new Date();
            const currentMonth = currentDate.getMonth() + 1;
            const currentYear = currentDate.getFullYear();

            const newPrices = typesToAdd.map(priceType => ({
                section,
                product,
                weight: weight || null,
                priceType,
                price: 0,
                isActive: true,
                effectiveDate: `${currentYear}-${String(currentMonth).padStart(2, '0')}-15`,
                month: currentMonth,
                year: currentYear,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }));

            const insertResult = await collection.insertMany(newPrices);
            addedCount = insertResult.insertedCount;
        }

        revalidatePath('/admin/prices');

        return {
            success: true,
            addedCount,
            removedCount,
            message: `Se agregaron ${addedCount} tipos de precio y se eliminaron ${removedCount} tipos de precio`
        };
    } catch (error) {
        console.error('Error updating product price types:', error);
        return {
            success: false,
            message: 'Error al actualizar los tipos de precio del producto',
            error: 'UPDATE_PRODUCT_PRICE_TYPES_ERROR',
            addedCount: 0,
            removedCount: 0
        };
    }
}

/**
 * Obtener precios actuales (último precio activo por producto)
 */
export async function getCurrentPrices(): Promise<{
    success: boolean;
    prices: Price[];
    total: number;
    message?: string;
    error?: string;
}> {
    try {
        const collection = await getCollection('prices');

        // Agregación para obtener el precio más reciente por producto
        const pipeline = [
            {
                $match: {
                    isActive: true,
                    // Solo tomar precios cuya fecha efectiva sea menor o igual a hoy
                    effectiveDate: { $lte: new Date().toISOString().split('T')[0] }
                }
            },
            {
                $sort: { effectiveDate: -1, createdAt: -1 }
            },
            {
                $group: {
                    _id: {
                        section: "$section",
                        product: "$product",
                        weight: "$weight",
                        priceType: "$priceType"
                    },
                    latestPrice: { $first: "$$ROOT" }
                }
            },
            {
                $replaceRoot: { newRoot: "$latestPrice" }
            },
            {
                $sort: {
                    section: 1,
                    product: 1,
                    weight: 1,
                    priceType: 1
                }
            }
        ];

        const prices = await collection.aggregate(pipeline).toArray() as unknown as Price[];

        return {
            success: true,
            prices,
            total: prices.length
        };
    } catch (error) {
        console.error('Error getting current prices:', error);
        return {
            success: false,
            message: 'Error al obtener los precios actuales',
            error: 'GET_CURRENT_PRICES_ERROR',
            prices: [],
            total: 0
        };
    }
}

/**
 * Obtener estadísticas de precios
 */
export async function getPriceStats(): Promise<{
    success: boolean;
    stats?: PriceStats;
    message?: string;
    error?: string;
}> {
    try {
        const collection = await getCollection('prices');

        const [
            totalPrices,
            pricesBySection,
            pricesByType,
            averagePriceBySection,
            thisMonthChanges,
            recentChanges
        ] = await Promise.all([
            // Total de precios activos
            collection.countDocuments({ isActive: true }),

            // Precios por sección
            collection.aggregate([
                { $match: { isActive: true } },
                { $group: { _id: "$section", count: { $sum: 1 } } }
            ]).toArray(),

            // Precios por tipo
            collection.aggregate([
                { $match: { isActive: true } },
                { $group: { _id: "$priceType", count: { $sum: 1 } } }
            ]).toArray(),

            // Precio promedio por sección
            collection.aggregate([
                { $match: { isActive: true } },
                { $group: { _id: "$section", avgPrice: { $avg: "$price" } } }
            ]).toArray(),

            // Cambios de este mes
            collection.countDocuments({
                month: new Date().getMonth() + 1,
                year: new Date().getFullYear()
            }),

            // Cambios más recientes (últimos 10)
            collection.find({}, {
                sort: { createdAt: -1 },
                limit: 10
            }).toArray()
        ]);

        const stats: PriceStats = {
            totalPrices,
            pricesBySection: pricesBySection.reduce((acc: Record<PriceSection, number>, item: any) => {
                acc[item._id as PriceSection] = item.count;
                return acc;
            }, {} as Record<PriceSection, number>),
            pricesByType: pricesByType.reduce((acc: Record<PriceType, number>, item: any) => {
                acc[item._id as PriceType] = item.count;
                return acc;
            }, {} as Record<PriceType, number>),
            averagePriceBySection: averagePriceBySection.reduce((acc: Record<PriceSection, number>, item: any) => {
                acc[item._id as PriceSection] = Math.round(item.avgPrice * 100) / 100;
                return acc;
            }, {} as Record<PriceSection, number>),
            priceChangesThisMonth: thisMonthChanges,
            mostRecentChanges: recentChanges as unknown as Price[]
        };

        return {
            success: true,
            stats
        };
    } catch (error) {
        console.error('Error getting price stats:', error);
        return {
            success: false,
            message: 'Error al obtener las estadísticas de precios',
            error: 'GET_PRICE_STATS_ERROR'
        };
    }
}

/**
 * Inicializar precios por defecto para un período específico
 */
export async function initializePricesForPeriod(month: number, year: number): Promise<{
    success: boolean;
    message?: string;
    error?: string;
    created?: number;
}> {
    try {
        const collection = await getCollection('prices');

        // Verificar si ya existen precios para este período
        const existingCount = await collection.countDocuments({
            month,
            year
        });

        if (existingCount > 0) {
            return {
                success: true,
                message: `Ya existen ${existingCount} precios para ${month}/${year}`,
                created: 0
            };
        }

        // Productos correctos según la estructura real del usuario
        const defaultPrices = [
            // PERRO - En el orden correcto
            { section: 'PERRO' as PriceSection, product: 'BIG DOG POLLO', weight: '15KG', priceType: 'EFECTIVO' as PriceType, price: 0 },
            { section: 'PERRO' as PriceSection, product: 'BIG DOG POLLO', weight: '15KG', priceType: 'TRANSFERENCIA' as PriceType, price: 0 },
            { section: 'PERRO' as PriceSection, product: 'BIG DOG POLLO', weight: '15KG', priceType: 'MAYORISTA' as PriceType, price: 0 },

            { section: 'PERRO' as PriceSection, product: 'BIG DOG VACA', weight: '15KG', priceType: 'EFECTIVO' as PriceType, price: 0 },
            { section: 'PERRO' as PriceSection, product: 'BIG DOG VACA', weight: '15KG', priceType: 'TRANSFERENCIA' as PriceType, price: 0 },
            { section: 'PERRO' as PriceSection, product: 'BIG DOG VACA', weight: '15KG', priceType: 'MAYORISTA' as PriceType, price: 0 },

            { section: 'PERRO' as PriceSection, product: 'VACA', weight: '10KG', priceType: 'EFECTIVO' as PriceType, price: 0 },
            { section: 'PERRO' as PriceSection, product: 'VACA', weight: '10KG', priceType: 'TRANSFERENCIA' as PriceType, price: 0 },
            { section: 'PERRO' as PriceSection, product: 'VACA', weight: '10KG', priceType: 'MAYORISTA' as PriceType, price: 0 },

            { section: 'PERRO' as PriceSection, product: 'VACA', weight: '5KG', priceType: 'EFECTIVO' as PriceType, price: 0 },
            { section: 'PERRO' as PriceSection, product: 'VACA', weight: '5KG', priceType: 'TRANSFERENCIA' as PriceType, price: 0 },
            { section: 'PERRO' as PriceSection, product: 'VACA', weight: '5KG', priceType: 'MAYORISTA' as PriceType, price: 0 },

            { section: 'PERRO' as PriceSection, product: 'CERDO', weight: '10KG', priceType: 'EFECTIVO' as PriceType, price: 0 },
            { section: 'PERRO' as PriceSection, product: 'CERDO', weight: '10KG', priceType: 'TRANSFERENCIA' as PriceType, price: 0 },
            { section: 'PERRO' as PriceSection, product: 'CERDO', weight: '10KG', priceType: 'MAYORISTA' as PriceType, price: 0 },

            { section: 'PERRO' as PriceSection, product: 'CERDO', weight: '5KG', priceType: 'EFECTIVO' as PriceType, price: 0 },
            { section: 'PERRO' as PriceSection, product: 'CERDO', weight: '5KG', priceType: 'TRANSFERENCIA' as PriceType, price: 0 },
            { section: 'PERRO' as PriceSection, product: 'CERDO', weight: '5KG', priceType: 'MAYORISTA' as PriceType, price: 0 },

            { section: 'PERRO' as PriceSection, product: 'CORDERO', weight: '10KG', priceType: 'EFECTIVO' as PriceType, price: 0 },
            { section: 'PERRO' as PriceSection, product: 'CORDERO', weight: '10KG', priceType: 'TRANSFERENCIA' as PriceType, price: 0 },
            { section: 'PERRO' as PriceSection, product: 'CORDERO', weight: '10KG', priceType: 'MAYORISTA' as PriceType, price: 0 },

            { section: 'PERRO' as PriceSection, product: 'CORDERO', weight: '5KG', priceType: 'EFECTIVO' as PriceType, price: 0 },
            { section: 'PERRO' as PriceSection, product: 'CORDERO', weight: '5KG', priceType: 'TRANSFERENCIA' as PriceType, price: 0 },
            { section: 'PERRO' as PriceSection, product: 'CORDERO', weight: '5KG', priceType: 'MAYORISTA' as PriceType, price: 0 },

            { section: 'PERRO' as PriceSection, product: 'POLLO', weight: '10KG', priceType: 'EFECTIVO' as PriceType, price: 0 },
            { section: 'PERRO' as PriceSection, product: 'POLLO', weight: '10KG', priceType: 'TRANSFERENCIA' as PriceType, price: 0 },
            { section: 'PERRO' as PriceSection, product: 'POLLO', weight: '10KG', priceType: 'MAYORISTA' as PriceType, price: 0 },

            { section: 'PERRO' as PriceSection, product: 'POLLO', weight: '5KG', priceType: 'EFECTIVO' as PriceType, price: 0 },
            { section: 'PERRO' as PriceSection, product: 'POLLO', weight: '5KG', priceType: 'TRANSFERENCIA' as PriceType, price: 0 },
            { section: 'PERRO' as PriceSection, product: 'POLLO', weight: '5KG', priceType: 'MAYORISTA' as PriceType, price: 0 },

            // GATO - Solo los productos que realmente tienes
            { section: 'GATO' as PriceSection, product: 'VACA', weight: '5KG', priceType: 'EFECTIVO' as PriceType, price: 0 },
            { section: 'GATO' as PriceSection, product: 'VACA', weight: '5KG', priceType: 'TRANSFERENCIA' as PriceType, price: 0 },
            { section: 'GATO' as PriceSection, product: 'VACA', weight: '5KG', priceType: 'MAYORISTA' as PriceType, price: 0 },

            { section: 'GATO' as PriceSection, product: 'CORDERO', weight: '5KG', priceType: 'EFECTIVO' as PriceType, price: 0 },
            { section: 'GATO' as PriceSection, product: 'CORDERO', weight: '5KG', priceType: 'TRANSFERENCIA' as PriceType, price: 0 },
            { section: 'GATO' as PriceSection, product: 'CORDERO', weight: '5KG', priceType: 'MAYORISTA' as PriceType, price: 0 },

            { section: 'GATO' as PriceSection, product: 'POLLO', weight: '5KG', priceType: 'EFECTIVO' as PriceType, price: 0 },
            { section: 'GATO' as PriceSection, product: 'POLLO', weight: '5KG', priceType: 'TRANSFERENCIA' as PriceType, price: 0 },
            { section: 'GATO' as PriceSection, product: 'POLLO', weight: '5KG', priceType: 'MAYORISTA' as PriceType, price: 0 },

            // OTROS - Solo los productos reales con los tipos de precio correctos
            { section: 'OTROS' as PriceSection, product: 'HUESOS CARNOSOS 5KG', weight: undefined, priceType: 'EFECTIVO' as PriceType, price: 0 },
            { section: 'OTROS' as PriceSection, product: 'HUESOS CARNOSOS 5KG', weight: undefined, priceType: 'TRANSFERENCIA' as PriceType, price: 0 },
            { section: 'OTROS' as PriceSection, product: 'HUESOS CARNOSOS 5KG', weight: undefined, priceType: 'MAYORISTA' as PriceType, price: 0 },

            { section: 'OTROS' as PriceSection, product: 'BOX DE COMPLEMENTOS', weight: undefined, priceType: 'EFECTIVO' as PriceType, price: 0 },
            { section: 'OTROS' as PriceSection, product: 'BOX DE COMPLEMENTOS', weight: undefined, priceType: 'TRANSFERENCIA' as PriceType, price: 0 },
            { section: 'OTROS' as PriceSection, product: 'BOX DE COMPLEMENTOS', weight: undefined, priceType: 'MAYORISTA' as PriceType, price: 0 },

            // Productos que solo tienen MAYORISTA
            { section: 'OTROS' as PriceSection, product: 'GARRAS', weight: undefined, priceType: 'MAYORISTA' as PriceType, price: 0 },
            { section: 'OTROS' as PriceSection, product: 'CORNALITOS', weight: '200GRS', priceType: 'MAYORISTA' as PriceType, price: 0 },
            { section: 'OTROS' as PriceSection, product: 'HUESOS RECREATIVOS', weight: undefined, priceType: 'MAYORISTA' as PriceType, price: 0 },
            { section: 'OTROS' as PriceSection, product: 'CALDO DE HUESOS', weight: undefined, priceType: 'MAYORISTA' as PriceType, price: 0 },

            // RAW - Productos solo para mayorista
            { section: 'RAW' as PriceSection, product: 'HIGADO 100GRS', weight: undefined, priceType: 'MAYORISTA' as PriceType, price: 0 },
            { section: 'RAW' as PriceSection, product: 'HIGADO 40GRS', weight: undefined, priceType: 'MAYORISTA' as PriceType, price: 0 },
            { section: 'RAW' as PriceSection, product: 'POLLO 100GRS', weight: undefined, priceType: 'MAYORISTA' as PriceType, price: 0 },
            { section: 'RAW' as PriceSection, product: 'POLLO 40GRS', weight: undefined, priceType: 'MAYORISTA' as PriceType, price: 0 },
            { section: 'RAW' as PriceSection, product: 'CORNALITOS 30GRS', weight: undefined, priceType: 'MAYORISTA' as PriceType, price: 0 },
            { section: 'RAW' as PriceSection, product: 'TRAQUEA X1', weight: undefined, priceType: 'MAYORISTA' as PriceType, price: 0 },
            { section: 'RAW' as PriceSection, product: 'TRAQUEA X2', weight: undefined, priceType: 'MAYORISTA' as PriceType, price: 0 },
            { section: 'RAW' as PriceSection, product: 'OREJA X1', weight: undefined, priceType: 'MAYORISTA' as PriceType, price: 0 },
            { section: 'RAW' as PriceSection, product: 'OREJA X50', weight: undefined, priceType: 'MAYORISTA' as PriceType, price: 0 },
            { section: 'RAW' as PriceSection, product: 'OREJAS X100', weight: undefined, priceType: 'MAYORISTA' as PriceType, price: 0 },
        ];

        const now = new Date().toISOString();
        const effectiveDate = `${year}-${month.toString().padStart(2, '0')}-01`;

        const pricesToCreate = defaultPrices.map(item => ({
            section: item.section,
            product: item.product,
            weight: item.weight,
            priceType: item.priceType,
            price: item.price,
            isActive: true,
            effectiveDate,
            month,
            year,
            createdAt: now,
            updatedAt: now
        }));

        const result = await collection.insertMany(pricesToCreate);

        revalidatePath('/admin/prices');

        return {
            success: true,
            message: `${result.insertedCount} precios inicializados para ${month}/${year}`,
            created: result.insertedCount
        };
    } catch (error) {
        console.error('Error initializing prices for period:', error);
        return {
            success: false,
            message: 'Error al inicializar precios para el período',
            error: 'INITIALIZE_PERIOD_ERROR'
        };
    }
}

/**
 * Inicializar precios por defecto de Barfer en MongoDB
 */
export async function initializeBarferPrices(): Promise<{
    success: boolean;
    message?: string;
    stats?: { created: number; skipped: number };
    error?: string;
}> {
    try {
        const collection = await getCollection('prices');

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
            { section: 'PERRO' as PriceSection, product: 'BIG DOG VACA', weight: '15KG', priceType: 'EFECTIVO' as PriceType, price: 0 },
            { section: 'PERRO' as PriceSection, product: 'BIG DOG VACA', weight: '15KG', priceType: 'TRANSFERENCIA' as PriceType, price: 0 },
            { section: 'PERRO' as PriceSection, product: 'BIG DOG VACA', weight: '15KG', priceType: 'MAYORISTA' as PriceType, price: 0 },
            { section: 'PERRO' as PriceSection, product: 'BIG DOG POLLO', weight: '15KG', priceType: 'EFECTIVO' as PriceType, price: 0 },
            { section: 'PERRO' as PriceSection, product: 'BIG DOG POLLO', weight: '15KG', priceType: 'TRANSFERENCIA' as PriceType, price: 0 },
            { section: 'PERRO' as PriceSection, product: 'BIG DOG POLLO', weight: '15KG', priceType: 'MAYORISTA' as PriceType, price: 0 },

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
            { section: 'OTROS' as PriceSection, product: 'HUESOS CARNOSOS 5KG', weight: undefined, priceType: 'EFECTIVO' as PriceType, price: 0 },
            { section: 'OTROS' as PriceSection, product: 'HUESOS CARNOSOS 5KG', weight: undefined, priceType: 'TRANSFERENCIA' as PriceType, price: 0 },
            { section: 'OTROS' as PriceSection, product: 'HUESOS CARNOSOS 5KG', weight: undefined, priceType: 'MAYORISTA' as PriceType, price: 0 },
            { section: 'OTROS' as PriceSection, product: 'BOX DE COMPLEMENTOS', weight: undefined, priceType: 'EFECTIVO' as PriceType, price: 0 },
            { section: 'OTROS' as PriceSection, product: 'BOX DE COMPLEMENTOS', weight: undefined, priceType: 'TRANSFERENCIA' as PriceType, price: 0 },
            { section: 'OTROS' as PriceSection, product: 'BOX DE COMPLEMENTOS', weight: undefined, priceType: 'MAYORISTA' as PriceType, price: 0 },
            { section: 'OTROS' as PriceSection, product: 'CORNALITOS', weight: '200GRS', priceType: 'MAYORISTA' as PriceType, price: 0 },
            { section: 'OTROS' as PriceSection, product: 'GARRAS', weight: undefined, priceType: 'MAYORISTA' as PriceType, price: 0 },
            { section: 'OTROS' as PriceSection, product: 'CALDO DE HUESOS', weight: undefined, priceType: 'MAYORISTA' as PriceType, price: 0 },
            { section: 'OTROS' as PriceSection, product: 'HUESOS RECREATIVOS', weight: undefined, priceType: 'MAYORISTA' as PriceType, price: 0 },

            // RAW - Productos solo para mayorista
            { section: 'RAW' as PriceSection, product: 'HIGADO 100GRS', weight: undefined, priceType: 'MAYORISTA' as PriceType, price: 0 },
            { section: 'RAW' as PriceSection, product: 'HIGADO 40GRS', weight: undefined, priceType: 'MAYORISTA' as PriceType, price: 0 },
            { section: 'RAW' as PriceSection, product: 'POLLO 100GRS', weight: undefined, priceType: 'MAYORISTA' as PriceType, price: 0 },
            { section: 'RAW' as PriceSection, product: 'POLLO 40GRS', weight: undefined, priceType: 'MAYORISTA' as PriceType, price: 0 },
            { section: 'RAW' as PriceSection, product: 'CORNALITOS 30GRS', weight: undefined, priceType: 'MAYORISTA' as PriceType, price: 0 },
            { section: 'RAW' as PriceSection, product: 'TRAQUEA X1', weight: undefined, priceType: 'MAYORISTA' as PriceType, price: 0 },
            { section: 'RAW' as PriceSection, product: 'TRAQUEA X2', weight: undefined, priceType: 'MAYORISTA' as PriceType, price: 0 },
            { section: 'RAW' as PriceSection, product: 'OREJA X1', weight: undefined, priceType: 'MAYORISTA' as PriceType, price: 0 },
            { section: 'RAW' as PriceSection, product: 'OREJA X50', weight: undefined, priceType: 'MAYORISTA' as PriceType, price: 0 },
            { section: 'RAW' as PriceSection, product: 'OREJAS X100', weight: undefined, priceType: 'MAYORISTA' as PriceType, price: 0 },
        ];

        let created = 0;
        let skipped = 0;
        const now = new Date();
        const effectiveDate = now.toISOString().split('T')[0];
        const nowIso = now.toISOString();

        for (const priceData of defaultPrices) {
            try {
                // Verificar si ya existe un precio activo para esta combinación
                const existing = await collection.findOne({
                    section: priceData.section,
                    product: priceData.product,
                    weight: priceData.weight,
                    priceType: priceData.priceType,
                    isActive: true
                });

                if (!existing) {
                    const newPrice: Omit<Price, '_id'> = {
                        section: priceData.section,
                        product: priceData.product,
                        weight: priceData.weight,
                        priceType: priceData.priceType,
                        price: priceData.price,
                        isActive: true,
                        effectiveDate,
                        month: now.getMonth() + 1,
                        year: now.getFullYear(),
                        createdAt: nowIso,
                        updatedAt: nowIso
                    };

                    await collection.insertOne(newPrice as any);
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