import { connectToMongoDB } from '@repo/database';

/**
 * Script para crear índices optimizados para consultas analíticas
 * Este script debe ejecutarse una vez para mejorar el rendimiento de las agregaciones
 */
export async function createAnalyticsIndexes() {
    try {
        console.log('🔧 Iniciando creación de índices para optimización analítica...');

        const db = await connectToMongoDB();
        const ordersCollection = db.collection('orders');

        // Índice compuesto para consultas analíticas mensuales
        // Optimiza filtros por fecha y agrupaciones por orderType
        console.log('📊 Creando índice compuesto para consultas mensuales...');
        await ordersCollection.createIndex(
            {
                createdAt: 1,     // Para filtros de rango de fechas
                orderType: 1,     // Para agrupaciones por tipo de orden
                status: 1         // Para filtros por estado
            },
            {
                name: 'analytics_monthly_compound',
                background: true  // Crear en background para no bloquear la DB
            }
        );

        // Índice para optimizar consultas de delivery type
        console.log('🚚 Creando índice para análisis de tipos de entrega...');
        await ordersCollection.createIndex(
            {
                'deliveryArea.sameDayDelivery': 1,
                orderType: 1,
                createdAt: 1
            },
            {
                name: 'analytics_delivery_type',
                background: true
            }
        );

        // Índice para consultas por items con same day delivery
        console.log('📦 Creando índice para análisis de items...');
        await ordersCollection.createIndex(
            {
                'items.sameDayDelivery': 1,
                createdAt: 1,
                orderType: 1
            },
            {
                name: 'analytics_items_delivery',
                background: true
            }
        );

        // Índice para optimizar sorting por fecha
        console.log('📅 Creando índice para ordenamiento por fecha...');
        await ordersCollection.createIndex(
            {
                createdAt: -1  // Descendente para obtener órdenes más recientes primero
            },
            {
                name: 'analytics_date_sort',
                background: true
            }
        );

        // Verificar índices creados
        console.log('✅ Verificando índices creados...');
        const indexes = await ordersCollection.indexes();
        console.log('📋 Índices actuales en la colección orders:');
        indexes.forEach((index, i) => {
            console.log(`  ${i + 1}. ${index.name}: ${JSON.stringify(index.key)}`);
        });

        console.log('🎉 ¡Índices analíticos creados exitosamente!');
        console.log('💡 Las consultas analíticas ahora deberían ser más rápidas y eficientes.');

        return {
            success: true,
            message: 'Índices analíticos creados correctamente',
            indexesCreated: [
                'analytics_monthly_compound',
                'analytics_delivery_type',
                'analytics_items_delivery',
                'analytics_date_sort'
            ]
        };

    } catch (error) {
        console.error('❌ Error creando índices analíticos:', error);
        throw error;
    }
}

/**
 * Script para eliminar índices analíticos si es necesario
 */
export async function dropAnalyticsIndexes() {
    try {
        console.log('🗑️ Eliminando índices analíticos...');

        const db = await connectToMongoDB();
        const ordersCollection = db.collection('orders');

        const indexesToDrop = [
            'analytics_monthly_compound',
            'analytics_delivery_type',
            'analytics_items_delivery',
            'analytics_date_sort'
        ];

        for (const indexName of indexesToDrop) {
            try {
                await ordersCollection.dropIndex(indexName);
                console.log(`✅ Índice eliminado: ${indexName}`);
            } catch (error: any) {
                if (error.code === 27) {
                    console.log(`⚠️ Índice no encontrado: ${indexName}`);
                } else {
                    console.error(`❌ Error eliminando índice ${indexName}:`, error);
                }
            }
        }

        console.log('🎉 Proceso de eliminación de índices completado.');

        return {
            success: true,
            message: 'Índices analíticos eliminados correctamente'
        };

    } catch (error) {
        console.error('❌ Error eliminando índices analíticos:', error);
        throw error;
    }
}

// Si se ejecuta directamente
if (require.main === module) {
    createAnalyticsIndexes()
        .then(() => {
            console.log('✨ Script completado exitosamente');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Error ejecutando script:', error);
            process.exit(1);
        });
}
