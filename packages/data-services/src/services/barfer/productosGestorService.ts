'use server'

import 'server-only';
import { revalidatePath } from 'next/cache';
import { getCollection, ObjectId } from '@repo/database';
import type {
    ProductoGestor,
    CreateProductoGestorData,
    UpdateProductoGestorData,
    PriceSection,
    PriceType
} from '../../types/barfer';

/**
 * Convierte un documento de MongoDB a un objeto ProductoGestor serializable
 */
function transformMongoProductoGestor(mongoDoc: any): ProductoGestor {
    return {
        _id: String(mongoDoc._id),
        section: mongoDoc.section,
        product: mongoDoc.product,
        weight: mongoDoc.weight,
        priceTypes: mongoDoc.priceTypes,
        isActive: mongoDoc.isActive,
        order: mongoDoc.order,
        createdAt: mongoDoc.createdAt,
        updatedAt: mongoDoc.updatedAt
    };
}

/**
 * Obtener todos los productos del gestor
 */
export async function getAllProductosGestor(): Promise<{
    success: boolean;
    productos?: ProductoGestor[];
    total?: number;
    message?: string;
    error?: string;
}> {
    try {
        const collection = await getCollection('productosGestor');

        const mongoProductos = await collection.find(
            { isActive: true },
            {
                sort: {
                    order: 1,
                    section: 1,
                    product: 1,
                    weight: 1
                }
            }
        ).toArray();

        const productos = mongoProductos.map(transformMongoProductoGestor);

        return {
            success: true,
            productos,
            total: productos.length
        };
    } catch (error) {
        console.error('Error getting productos gestor:', error);
        return {
            success: false,
            message: 'Error al obtener los productos',
            error: 'GET_PRODUCTOS_GESTOR_ERROR'
        };
    }
}

/**
 * Crear un nuevo producto en el gestor
 */
export async function createProductoGestor(data: CreateProductoGestorData): Promise<{
    success: boolean;
    producto?: ProductoGestor;
    message?: string;
    error?: string;
}> {
    try {
        const collection = await getCollection('productosGestor');

        // Obtener el próximo número de orden
        const lastProduct = await collection.findOne(
            {},
            { sort: { order: -1 } }
        );
        const nextOrder = lastProduct ? (lastProduct.order || 0) + 1 : 1;

        const now = new Date().toISOString();

        const newProducto: ProductoGestor = {
            _id: new ObjectId(),
            section: data.section,
            product: data.product,
            weight: data.weight,
            priceTypes: data.priceTypes,
            isActive: data.isActive ?? true,
            order: data.order ?? nextOrder,
            createdAt: now,
            updatedAt: now
        };

        await collection.insertOne(newProducto as any);

        revalidatePath('/admin/prices');

        // Convertir ObjectId a string para compatibilidad con Client Components
        const serializedProducto = {
            ...newProducto,
            _id: newProducto._id.toString()
        };

        return {
            success: true,
            producto: serializedProducto,
            message: 'Producto creado exitosamente'
        };
    } catch (error) {
        console.error('Error creating producto gestor:', error);
        return {
            success: false,
            message: 'Error al crear el producto',
            error: 'CREATE_PRODUCTO_GESTOR_ERROR'
        };
    }
}

/**
 * Actualizar un producto del gestor
 */
export async function updateProductoGestor(productoId: string, data: UpdateProductoGestorData): Promise<{
    success: boolean;
    producto?: ProductoGestor;
    message?: string;
    error?: string;
}> {
    try {
        const collection = await getCollection('productosGestor');

        const updatedProducto = await collection.findOneAndUpdate(
            { _id: new ObjectId(productoId) },
            {
                $set: {
                    ...data,
                    updatedAt: new Date().toISOString()
                }
            },
            { returnDocument: 'after' }
        ) as unknown as ProductoGestor | null;

        if (!updatedProducto) {
            return {
                success: false,
                message: 'Producto no encontrado',
                error: 'PRODUCTO_NOT_FOUND'
            };
        }

        revalidatePath('/admin/prices');

        return {
            success: true,
            producto: transformMongoProductoGestor(updatedProducto),
            message: 'Producto actualizado exitosamente'
        };
    } catch (error) {
        console.error('Error updating producto gestor:', error);
        return {
            success: false,
            message: 'Error al actualizar el producto',
            error: 'UPDATE_PRODUCTO_GESTOR_ERROR'
        };
    }
}

/**
 * Eliminar un producto del gestor (marcar como inactivo)
 */
export async function deleteProductoGestor(productoId: string): Promise<{
    success: boolean;
    message?: string;
    error?: string;
}> {
    try {
        const collection = await getCollection('productosGestor');

        const result = await collection.updateOne(
            { _id: new ObjectId(productoId) },
            {
                $set: {
                    isActive: false,
                    updatedAt: new Date().toISOString()
                }
            }
        );

        if (result.matchedCount === 0) {
            return {
                success: false,
                message: 'Producto no encontrado',
                error: 'PRODUCTO_NOT_FOUND'
            };
        }

        revalidatePath('/admin/prices');

        return {
            success: true,
            message: 'Producto eliminado exitosamente'
        };
    } catch (error) {
        console.error('Error deleting producto gestor:', error);
        return {
            success: false,
            message: 'Error al eliminar el producto',
            error: 'DELETE_PRODUCTO_GESTOR_ERROR'
        };
    }
}

/**
 * Inicializar productos por defecto del gestor
 */
export async function initializeProductosGestor(): Promise<{
    success: boolean;
    message?: string;
    created?: number;
    error?: string;
}> {
    try {
        const collection = await getCollection('productosGestor');

        // Verificar si ya existen productos
        const existingCount = await collection.countDocuments({ isActive: true });

        if (existingCount > 0) {
            return {
                success: true,
                message: `Ya existen ${existingCount} productos en el gestor`,
                created: 0
            };
        }

        // Productos por defecto basados en tu estructura real
        const defaultProductos = [
            // PERRO
            { section: 'PERRO' as PriceSection, product: 'BIG DOG POLLO', weight: '15KG', priceTypes: ['EFECTIVO', 'TRANSFERENCIA', 'MAYORISTA'] as PriceType[], order: 1 },
            { section: 'PERRO' as PriceSection, product: 'BIG DOG VACA', weight: '15KG', priceTypes: ['EFECTIVO', 'TRANSFERENCIA', 'MAYORISTA'] as PriceType[], order: 2 },
            { section: 'PERRO' as PriceSection, product: 'VACA', weight: '10KG', priceTypes: ['EFECTIVO', 'TRANSFERENCIA', 'MAYORISTA'] as PriceType[], order: 3 },
            { section: 'PERRO' as PriceSection, product: 'VACA', weight: '5KG', priceTypes: ['EFECTIVO', 'TRANSFERENCIA', 'MAYORISTA'] as PriceType[], order: 4 },
            { section: 'PERRO' as PriceSection, product: 'CERDO', weight: '10KG', priceTypes: ['EFECTIVO', 'TRANSFERENCIA', 'MAYORISTA'] as PriceType[], order: 5 },
            { section: 'PERRO' as PriceSection, product: 'CERDO', weight: '5KG', priceTypes: ['EFECTIVO', 'TRANSFERENCIA', 'MAYORISTA'] as PriceType[], order: 6 },
            { section: 'PERRO' as PriceSection, product: 'CORDERO', weight: '10KG', priceTypes: ['EFECTIVO', 'TRANSFERENCIA', 'MAYORISTA'] as PriceType[], order: 7 },
            { section: 'PERRO' as PriceSection, product: 'CORDERO', weight: '5KG', priceTypes: ['EFECTIVO', 'TRANSFERENCIA', 'MAYORISTA'] as PriceType[], order: 8 },
            { section: 'PERRO' as PriceSection, product: 'POLLO', weight: '10KG', priceTypes: ['EFECTIVO', 'TRANSFERENCIA', 'MAYORISTA'] as PriceType[], order: 9 },
            { section: 'PERRO' as PriceSection, product: 'POLLO', weight: '5KG', priceTypes: ['EFECTIVO', 'TRANSFERENCIA', 'MAYORISTA'] as PriceType[], order: 10 },

            // GATO
            { section: 'GATO' as PriceSection, product: 'VACA', weight: '5KG', priceTypes: ['EFECTIVO', 'TRANSFERENCIA', 'MAYORISTA'] as PriceType[], order: 11 },
            { section: 'GATO' as PriceSection, product: 'CORDERO', weight: '5KG', priceTypes: ['EFECTIVO', 'TRANSFERENCIA', 'MAYORISTA'] as PriceType[], order: 12 },
            { section: 'GATO' as PriceSection, product: 'POLLO', weight: '5KG', priceTypes: ['EFECTIVO', 'TRANSFERENCIA', 'MAYORISTA'] as PriceType[], order: 13 },

            // OTROS
            { section: 'OTROS' as PriceSection, product: 'HUESOS CARNOSOS 5KG', weight: undefined, priceTypes: ['EFECTIVO', 'TRANSFERENCIA', 'MAYORISTA'] as PriceType[], order: 14 },
            { section: 'OTROS' as PriceSection, product: 'BOX DE COMPLEMENTOS', weight: undefined, priceTypes: ['EFECTIVO', 'TRANSFERENCIA', 'MAYORISTA'] as PriceType[], order: 15 },
            { section: 'OTROS' as PriceSection, product: 'GARRAS', weight: undefined, priceTypes: ['MAYORISTA'] as PriceType[], order: 16 },
            { section: 'OTROS' as PriceSection, product: 'CORNALITOS', weight: '200GRS', priceTypes: ['MAYORISTA'] as PriceType[], order: 17 },
            { section: 'OTROS' as PriceSection, product: 'CORNALITOS', weight: '30GRS', priceTypes: ['MAYORISTA'] as PriceType[], order: 18 },
            { section: 'OTROS' as PriceSection, product: 'HUESOS RECREATIVOS', weight: undefined, priceTypes: ['MAYORISTA'] as PriceType[], order: 19 },
            { section: 'OTROS' as PriceSection, product: 'CALDO DE HUESOS', weight: undefined, priceTypes: ['MAYORISTA'] as PriceType[], order: 20 },
        ];

        const now = new Date().toISOString();

        const productosToCreate = defaultProductos.map(item => ({
            section: item.section,
            product: item.product,
            weight: item.weight,
            priceTypes: item.priceTypes,
            isActive: true,
            order: item.order,
            createdAt: now,
            updatedAt: now
        }));

        const result = await collection.insertMany(productosToCreate);

        revalidatePath('/admin/prices');

        return {
            success: true,
            message: `${result.insertedCount} productos inicializados en el gestor`,
            created: result.insertedCount
        };
    } catch (error) {
        console.error('Error initializing productos gestor:', error);
        return {
            success: false,
            message: 'Error al inicializar productos del gestor',
            error: 'INITIALIZE_PRODUCTOS_GESTOR_ERROR'
        };
    }
}
