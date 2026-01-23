/**
 * Script para crear los índices necesarios para la colección order_priority
 * 
 * Ejecutar con: node scripts/create-order-priority-indexes.js
 */

import { getCollection } from '@repo/database';

async function createOrderPriorityIndexes() {
    try {
        console.log('🔧 Creando índices para la colección order_priority...');

        const collection = await getCollection('order_priority');

        // Índice único compuesto para búsquedas rápidas y prevenir duplicados
        console.log('📌 Creando índice único en (fecha, puntoEnvio)...');
        await collection.createIndex(
            { fecha: 1, puntoEnvio: 1 },
            { unique: true, name: 'fecha_puntoEnvio_unique' }
        );
        console.log('✅ Índice único creado');

        // Índice para limpiar datos antiguos (opcional - 90 días)
        console.log('📌 Creando índice TTL para limpiar datos antiguos...');
        await collection.createIndex(
            { createdAt: 1 },
            {
                expireAfterSeconds: 7776000, // 90 días
                name: 'createdAt_ttl'
            }
        );
        console.log('✅ Índice TTL creado (expira después de 90 días)');

        // Listar todos los índices
        console.log('\n📋 Índices creados:');
        const indexes = await collection.indexes();
        indexes.forEach(index => {
            console.log(`  - ${index.name}:`, JSON.stringify(index.key));
        });

        console.log('\n✨ ¡Índices creados exitosamente!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error creando índices:', error);
        process.exit(1);
    }
}

createOrderPriorityIndexes();
