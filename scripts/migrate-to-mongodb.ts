#!/usr/bin/env tsx

/**
 * Script de migración de datos de Prisma (PostgreSQL) a MongoDB
 * 
 * Este script migra:
 * - Categorías
 * - Métodos de Pago
 * - Salidas
 * 
 * Uso: npx tsx scripts/migrate-to-mongodb.ts
 */

import { database } from '../packages/database/index';
import { getCollection, ObjectId } from '../packages/database/mongo-connection';
import {
    initializeCategoriasMongo,
    createCategoriaMongo
} from '../packages/data-services/src/services/categoriasMongoService';
import {
    initializeMetodosPagoMongo,
    createMetodoPagoMongo
} from '../packages/data-services/src/services/metodosPagoMongoService';
import {
    createSalidaMongo
} from '../packages/data-services/src/services/salidasMongoService';

async function migrateCategorias() {
    console.log('🔄 Migrando categorías...');

    try {
        // Obtener categorías de Prisma
        const prismaCategorias = await database.categoria.findMany();
        console.log(`📊 Encontradas ${prismaCategorias.length} categorías en Prisma`);

        // Inicializar categorías por defecto en MongoDB
        await initializeCategoriasMongo();

        // Migrar categorías existentes
        let migrated = 0;
        for (const categoria of prismaCategorias) {
            try {
                const result = await createCategoriaMongo({
                    nombre: categoria.nombre,
                    descripcion: categoria.descripcion,
                    isActive: categoria.isActive
                });

                if (result.success) {
                    migrated++;
                    console.log(`✅ Categoría migrada: ${categoria.nombre}`);
                } else {
                    console.log(`⚠️  Categoría ya existe: ${categoria.nombre}`);
                }
            } catch (error) {
                console.error(`❌ Error migrando categoría ${categoria.nombre}:`, error);
            }
        }

        console.log(`✅ Migración de categorías completada: ${migrated} migradas`);
        return { success: true, migrated };
    } catch (error) {
        console.error('❌ Error en migración de categorías:', error);
        return { success: false, error };
    }
}

async function migrateMetodosPago() {
    console.log('🔄 Migrando métodos de pago...');

    try {
        // Obtener métodos de pago de Prisma
        const prismaMetodosPago = await database.metodoPago.findMany();
        console.log(`📊 Encontrados ${prismaMetodosPago.length} métodos de pago en Prisma`);

        // Inicializar métodos de pago por defecto en MongoDB
        await initializeMetodosPagoMongo();

        // Migrar métodos de pago existentes
        let migrated = 0;
        for (const metodoPago of prismaMetodosPago) {
            try {
                const result = await createMetodoPagoMongo({
                    nombre: metodoPago.nombre,
                    descripcion: metodoPago.descripcion,
                    isActive: metodoPago.isActive
                });

                if (result.success) {
                    migrated++;
                    console.log(`✅ Método de pago migrado: ${metodoPago.nombre}`);
                } else {
                    console.log(`⚠️  Método de pago ya existe: ${metodoPago.nombre}`);
                }
            } catch (error) {
                console.error(`❌ Error migrando método de pago ${metodoPago.nombre}:`, error);
            }
        }

        console.log(`✅ Migración de métodos de pago completada: ${migrated} migrados`);
        return { success: true, migrated };
    } catch (error) {
        console.error('❌ Error en migración de métodos de pago:', error);
        return { success: false, error };
    }
}

async function migrateSalidas() {
    console.log('🔄 Migrando salidas...');

    try {
        // Obtener salidas de Prisma con relaciones
        const prismaSalidas = await database.salida.findMany({
            include: {
                categoria: true,
                metodoPago: true
            }
        });
        console.log(`📊 Encontradas ${prismaSalidas.length} salidas en Prisma`);

        // Obtener mapeo de IDs de Prisma a MongoDB
        const categoriasCollection = await getCollection('categorias');
        const metodosPagoCollection = await getCollection('metodos_pago');

        const categoriasMap = new Map<string, string>();
        const metodosPagoMap = new Map<string, string>();

        // Mapear categorías
        const mongoCategorias = await categoriasCollection.find({}).toArray();
        for (const mongoCat of mongoCategorias) {
            const prismaCat = await database.categoria.findFirst({
                where: { nombre: mongoCat.nombre }
            });
            if (prismaCat) {
                categoriasMap.set(prismaCat.id, mongoCat._id.toString());
            }
        }

        // Mapear métodos de pago
        const mongoMetodosPago = await metodosPagoCollection.find({}).toArray();
        for (const mongoMetodo of mongoMetodosPago) {
            const prismaMetodo = await database.metodoPago.findFirst({
                where: { nombre: mongoMetodo.nombre }
            });
            if (prismaMetodo) {
                metodosPagoMap.set(prismaMetodo.id, mongoMetodo._id.toString());
            }
        }

        // Migrar salidas
        let migrated = 0;
        for (const salida of prismaSalidas) {
            try {
                const mongoCategoriaId = categoriasMap.get(salida.categoriaId);
                const mongoMetodoPagoId = metodosPagoMap.get(salida.metodoPagoId);

                if (!mongoCategoriaId || !mongoMetodoPagoId) {
                    console.log(`⚠️  Saltando salida ${salida.id}: categoría o método de pago no encontrado`);
                    continue;
                }

                const result = await createSalidaMongo({
                    fecha: salida.fecha,
                    detalle: salida.detalle,
                    categoriaId: mongoCategoriaId,
                    tipo: salida.tipo,
                    marca: salida.marca,
                    monto: salida.monto,
                    metodoPagoId: mongoMetodoPagoId,
                    tipoRegistro: salida.tipoRegistro,
                    // Agregar campos nuevos si existen
                    fechaLlegaFactura: (salida as any).fechaLlegaFactura,
                    fechaPagoFactura: (salida as any).fechaPagoFactura,
                    comprobanteNumber: (salida as any).comprobanteNumber
                });

                if (result.success) {
                    migrated++;
                    console.log(`✅ Salida migrada: ${salida.detalle.substring(0, 50)}...`);
                } else {
                    console.log(`❌ Error migrando salida: ${result.message}`);
                }
            } catch (error) {
                console.error(`❌ Error migrando salida ${salida.id}:`, error);
            }
        }

        console.log(`✅ Migración de salidas completada: ${migrated} migradas`);
        return { success: true, migrated };
    } catch (error) {
        console.error('❌ Error en migración de salidas:', error);
        return { success: false, error };
    }
}

async function main() {
    console.log('🚀 Iniciando migración de Prisma a MongoDB...\n');

    try {
        // Migrar categorías
        const categoriasResult = await migrateCategorias();
        if (!categoriasResult.success) {
            throw new Error('Falló migración de categorías');
        }

        console.log('');

        // Migrar métodos de pago
        const metodosPagoResult = await migrateMetodosPago();
        if (!metodosPagoResult.success) {
            throw new Error('Falló migración de métodos de pago');
        }

        console.log('');

        // Migrar salidas
        const salidasResult = await migrateSalidas();
        if (!salidasResult.success) {
            throw new Error('Falló migración de salidas');
        }

        console.log('\n🎉 Migración completada exitosamente!');
        console.log(`📊 Resumen:`);
        console.log(`   - Categorías: ${categoriasResult.migrated} migradas`);
        console.log(`   - Métodos de pago: ${metodosPagoResult.migrated} migrados`);
        console.log(`   - Salidas: ${salidasResult.migrated} migradas`);

    } catch (error) {
        console.error('❌ Error en la migración:', error);
        process.exit(1);
    } finally {
        // Cerrar conexiones
        await database.$disconnect();
        process.exit(0);
    }
}

// Ejecutar migración
if (require.main === module) {
    main().catch(console.error);
}
