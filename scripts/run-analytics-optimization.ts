#!/usr/bin/env tsx
/**
 * Script para ejecutar la optimización de índices analíticos
 * 
 * Uso:
 *   pnpm run analytics:optimize        # Crear índices
 *   pnpm run analytics:optimize drop   # Eliminar índices
 */

import { createAnalyticsIndexes, dropAnalyticsIndexes } from './optimize-analytics-indexes';

async function main() {
    const action = process.argv[2];

    console.log('🚀 Iniciando optimización de índices analíticos...');
    console.log('='.repeat(50));

    try {
        if (action === 'drop') {
            await dropAnalyticsIndexes();
        } else {
            await createAnalyticsIndexes();
        }

        console.log('='.repeat(50));
        console.log('✨ Optimización completada exitosamente!');

    } catch (error) {
        console.log('='.repeat(50));
        console.error('💥 Error durante la optimización:', error);
        process.exit(1);
    }
}

main();
