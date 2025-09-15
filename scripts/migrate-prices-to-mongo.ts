#!/usr/bin/env tsx

import { database } from '@repo/database';
import { getCollection, ObjectId } from '@repo/database';
import type { Price, PriceSection, PriceType } from '@repo/data-services/types/barfer';

interface PrismaPriceData {
    id: string;
    section: string;
    product: string;
    weight?: string | null;
    priceType: string;
    price: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Script para migrar precios de Prisma a MongoDB
 * Este script:
 * 1. Lee todos los precios de la tabla Prisma
 * 2. Los convierte al formato MongoDB con campos de fecha para historial
 * 3. Los inserta en la colección 'prices' de MongoDB
 */
async function migratePricesToMongo() {
    try {
        console.log('🚀 Iniciando migración de precios de Prisma a MongoDB...\n');

        // 1. Obtener todos los precios de Prisma
        console.log('📖 Obteniendo precios de Prisma...');
        const prismaPrice = await database.price.findMany({
            orderBy: [
                { section: 'asc' },
                { product: 'asc' },
                { weight: 'asc' },
                { priceType: 'asc' }
            ]
        });

        console.log(`✅ Encontrados ${prismaPrice.length} precios en Prisma\n`);

        if (prismaPrice.length === 0) {
            console.log('⚠️  No hay precios para migrar');
            return;
        }

        // 2. Preparar conexión MongoDB
        console.log('🔗 Conectando a MongoDB...');
        const collection = getCollection<Price>('prices');

        // 3. Verificar si ya existen precios en MongoDB
        const existingCount = await collection.countDocuments();
        if (existingCount > 0) {
            console.log(`⚠️  Ya existen ${existingCount} precios en MongoDB`);
            console.log('¿Deseas continuar? Esto podría crear duplicados.');
            // En un script real, podrías usar readline para preguntar al usuario
            // Por ahora, continuamos con un warning
            console.log('⚡ Continuando con la migración...\n');
        }

        // 4. Migrar precios
        console.log('🔄 Migrando precios...');
        let migrated = 0;
        let errors = 0;

        for (const prismaPrice of prismaPrice) {
            try {
                // Convertir el precio de Prisma al formato MongoDB
                const effectiveDate = prismaPrice.createdAt.toISOString().split('T')[0];
                const effectiveDateObj = new Date(effectiveDate);

                const mongoPrice: Price = {
                    _id: new ObjectId().toString(),
                    section: prismaPrice.section as PriceSection,
                    product: prismaPrice.product,
                    weight: prismaPrice.weight || undefined,
                    priceType: prismaPrice.priceType as PriceType,
                    price: prismaPrice.price,
                    isActive: prismaPrice.isActive,
                    effectiveDate,
                    month: effectiveDateObj.getMonth() + 1,
                    year: effectiveDateObj.getFullYear(),
                    createdAt: prismaPrice.createdAt.toISOString(),
                    updatedAt: prismaPrice.updatedAt.toISOString()
                };

                // Verificar si ya existe este precio exacto
                const existing = await collection.findOne({
                    section: mongoPrice.section,
                    product: mongoPrice.product,
                    weight: mongoPrice.weight,
                    priceType: mongoPrice.priceType,
                    price: mongoPrice.price,
                    effectiveDate: mongoPrice.effectiveDate
                });

                if (!existing) {
                    await collection.insertOne(mongoPrice as any);
                    migrated++;

                    if (migrated % 10 === 0) {
                        console.log(`   📦 Migrados ${migrated}/${prismaPrice.length} precios...`);
                    }
                } else {
                    console.log(`   ⚠️  Precio duplicado encontrado para ${mongoPrice.product} ${mongoPrice.priceType} - omitiendo`);
                }
            } catch (error) {
                console.error(`   ❌ Error migrando precio ${prismaPrice.product}:`, error);
                errors++;
            }
        }

        // 5. Resumen
        console.log('\n📊 Resumen de migración:');
        console.log(`✅ Precios migrados exitosamente: ${migrated}`);
        console.log(`❌ Errores: ${errors}`);
        console.log(`📦 Total en Prisma: ${prismaPrice.length}`);

        // 6. Verificar migración
        const finalCount = await collection.countDocuments();
        console.log(`🔍 Total de precios en MongoDB después de la migración: ${finalCount}`);

        // 7. Mostrar algunos ejemplos de precios migrados
        console.log('\n🔍 Ejemplos de precios migrados:');
        const samplePrices = await collection.find({}).limit(5).toArray();
        samplePrices.forEach(price => {
            console.log(`   • ${price.section} - ${price.product} ${price.weight || ''} (${price.priceType}): $${price.price} [${price.effectiveDate}]`);
        });

        console.log('\n🎉 ¡Migración completada exitosamente!');
        console.log('\n💡 Próximos pasos:');
        console.log('   1. Verifica que los precios se migraron correctamente');
        console.log('   2. Actualiza tu aplicación para usar el nuevo servicio de MongoDB');
        console.log('   3. Una vez verificado, puedes eliminar la tabla de precios de Prisma');
        console.log('   4. Actualiza las referencias en tu código para usar los nuevos tipos');

    } catch (error) {
        console.error('💥 Error durante la migración:', error);
        process.exit(1);
    }
}

/**
 * Script para verificar la integridad de los datos migrados
 */
async function verifyMigration() {
    try {
        console.log('🔍 Verificando integridad de la migración...\n');

        // Contar precios en Prisma
        const prismaCount = await database.price.count();
        console.log(`📊 Precios en Prisma: ${prismaCount}`);

        // Contar precios en MongoDB
        const collection = getCollection<Price>('prices');
        const mongoCount = await collection.countDocuments();
        console.log(`📊 Precios en MongoDB: ${mongoCount}`);

        // Verificar algunos precios específicos
        console.log('\n🔍 Verificando consistencia de datos...');

        const prismaSample = await database.price.findMany({ take: 5 });
        for (const prismaPrice of prismaSample) {
            const mongoPrice = await collection.findOne({
                section: prismaPrice.section as PriceSection,
                product: prismaPrice.product,
                weight: prismaPrice.weight || undefined,
                priceType: prismaPrice.priceType as PriceType,
                price: prismaPrice.price
            });

            if (mongoPrice) {
                console.log(`   ✅ ${prismaPrice.product} - Consistente`);
            } else {
                console.log(`   ❌ ${prismaPrice.product} - No encontrado en MongoDB`);
            }
        }

        // Estadísticas por sección
        console.log('\n📈 Estadísticas por sección en MongoDB:');
        const stats = await collection.aggregate([
            { $group: { _id: "$section", count: { $sum: 1 }, avgPrice: { $avg: "$price" } } },
            { $sort: { _id: 1 } }
        ]).toArray();

        stats.forEach(stat => {
            console.log(`   • ${stat._id}: ${stat.count} precios (promedio: $${Math.round(stat.avgPrice * 100) / 100})`);
        });

        console.log('\n✅ Verificación completada');

    } catch (error) {
        console.error('💥 Error durante la verificación:', error);
    }
}

// Ejecutar el script
if (require.main === module) {
    const command = process.argv[2];

    if (command === 'verify') {
        verifyMigration().then(() => process.exit(0));
    } else {
        migratePricesToMongo().then(() => process.exit(0));
    }
}

export { migratePricesToMongo, verifyMigration };
