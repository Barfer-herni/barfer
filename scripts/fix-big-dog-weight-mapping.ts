#!/usr/bin/env tsx

import { getCollection } from '@repo/database';

/**
 * Script para corregir el mapeo de peso de productos BIG DOG
 * 
 * Problema identificado:
 * - Los productos BIG DOG tienen inconsistencias en el campo weight
 * - Algunos tienen weight: null, otros tienen weight: "15KG", otros "10KG"
 * - Esto causa problemas al actualizar precios porque no encuentra los registros correctos
 * 
 * Solución:
 * - Estandarizar todos los productos BIG DOG para usar weight: "15KG"
 */

async function fixBigDogWeightMapping() {
    try {
        console.log('🔧 Iniciando corrección del mapeo de peso para productos BIG DOG...');

        const collection = await getCollection('prices');

        // 1. Buscar todos los productos BIG DOG existentes
        const bigDogProducts = await collection.find({
            product: { $regex: /BIG DOG/ }
        }).toArray();

        console.log(`📊 Encontrados ${bigDogProducts.length} productos BIG DOG en la base de datos`);

        if (bigDogProducts.length === 0) {
            console.log('✅ No hay productos BIG DOG para corregir');
            return;
        }

        // 2. Mostrar el estado actual
        console.log('\n📋 Estado actual de productos BIG DOG:');
        const weightGroups = bigDogProducts.reduce((acc: Record<string, number>, product) => {
            const weight = product.weight || 'null';
            acc[weight] = (acc[weight] || 0) + 1;
            return acc;
        }, {});

        Object.entries(weightGroups).forEach(([weight, count]) => {
            console.log(`   - Peso "${weight}": ${count} productos`);
        });

        // 3. Actualizar todos los productos BIG DOG para usar weight: "15KG"
        console.log('\n🔄 Actualizando productos BIG DOG para usar weight: "15KG"...');

        const updateResult = await collection.updateMany(
            { product: { $regex: /BIG DOG/ } },
            {
                $set: {
                    weight: '15KG',
                    updatedAt: new Date().toISOString()
                }
            }
        );

        console.log(`✅ Actualizados ${updateResult.modifiedCount} productos BIG DOG`);

        // 4. Verificar el resultado
        const updatedProducts = await collection.find({
            product: { $regex: /BIG DOG/ }
        }).toArray();

        console.log('\n📊 Estado después de la corrección:');
        const newWeightGroups = updatedProducts.reduce((acc: Record<string, number>, product) => {
            const weight = product.weight || 'null';
            acc[weight] = (acc[weight] || 0) + 1;
            return acc;
        }, {});

        Object.entries(newWeightGroups).forEach(([weight, count]) => {
            console.log(`   - Peso "${weight}": ${count} productos`);
        });

        // 5. Mostrar algunos ejemplos de productos actualizados
        console.log('\n📝 Ejemplos de productos actualizados:');
        updatedProducts.slice(0, 5).forEach((product, index) => {
            console.log(`   ${index + 1}. ${product.product} - Peso: ${product.weight} - Tipo: ${product.priceType} - Precio: ${product.price}`);
        });

        console.log('\n🎉 Corrección completada exitosamente!');
        console.log('💡 Los productos BIG DOG ahora deberían poder actualizarse correctamente en la interfaz');

    } catch (error) {
        console.error('❌ Error durante la corrección:', error);
        throw error;
    }
}

// Ejecutar el script
if (require.main === module) {
    fixBigDogWeightMapping()
        .then(() => {
            console.log('✅ Script completado');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Script falló:', error);
            process.exit(1);
        });
}

export { fixBigDogWeightMapping };
