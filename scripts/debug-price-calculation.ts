#!/usr/bin/env node

import { getCollection } from '@repo/database';

export async function debugPriceCalculation() {
    console.log('🔍 DEBUG: Investigando cálculo de precios...\n');

    try {
        // 1. Verificar estructura de la colección prices
        const pricesCollection = await getCollection('prices');

        console.log('📊 ESTRUCTURA DE LA COLECCIÓN PRICES:');
        const samplePrices = await pricesCollection.find({}).limit(5).toArray();
        console.log('Muestra de precios:', JSON.stringify(samplePrices, null, 2));

        // 2. Contar productos por sección
        const sectionsCount = await pricesCollection.aggregate([
            { $group: { _id: '$section', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]).toArray();
        console.log('\n📈 PRODUCTOS POR SECCIÓN:', sectionsCount);

        // 3. Contar productos por tipo de precio
        const priceTypesCount = await pricesCollection.aggregate([
            { $group: { _id: '$priceType', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]).toArray();
        console.log('\n💰 TIPOS DE PRECIO:', priceTypesCount);

        // 4. Verificar productos únicos
        const uniqueProducts = await pricesCollection.aggregate([
            { $group: { _id: { product: '$product', weight: '$weight' }, count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 20 }
        ]).toArray();
        console.log('\n🏷️ PRODUCTOS ÚNICOS (top 20):', uniqueProducts);

        // 5. Verificar precios del mes actual
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1;
        const currentYear = currentDate.getFullYear();

        console.log(`\n📅 PRECIOS DEL MES ACTUAL (${currentMonth}/${currentYear}):`);
        const currentMonthPrices = await pricesCollection.find({
            month: currentMonth,
            year: currentYear
        }).toArray();
        console.log(`Total de precios en ${currentMonth}/${currentYear}: ${currentMonthPrices.length}`);

        if (currentMonthPrices.length > 0) {
            console.log('Primeros 5 precios del mes actual:');
            currentMonthPrices.slice(0, 5).forEach(price => {
                console.log(`- ${price.section} | ${price.product} | ${price.weight || 'sin peso'} | ${price.priceType} | $${price.price}`);
            });
        }

        // 6. Verificar productos sin precios en el mes actual
        console.log(`\n❌ PRODUCTOS SIN PRECIOS EN ${currentMonth}/${currentYear}:`);
        const allProducts = await pricesCollection.aggregate([
            { $group: { _id: { product: '$product', weight: '$weight', section: '$section' } } }
        ]).toArray();

        const productsWithoutCurrentPrice = [];
        for (const product of allProducts) {
            const hasCurrentPrice = await pricesCollection.findOne({
                product: product._id.product,
                weight: product._id.weight,
                section: product._id.section,
                month: currentMonth,
                year: currentYear
            });

            if (!hasCurrentPrice) {
                productsWithoutCurrentPrice.push(product._id);
            }
        }

        console.log(`Productos sin precios en ${currentMonth}/${currentYear}: ${productsWithoutCurrentPrice.length}`);
        if (productsWithoutCurrentPrice.length > 0) {
            productsWithoutCurrentPrice.slice(0, 10).forEach(product => {
                console.log(`- ${product.section} | ${product.product} | ${product.weight || 'sin peso'}`);
            });
        }

        // 7. Verificar precios más recientes disponibles
        console.log(`\n📅 PRECIOS MÁS RECIENTES DISPONIBLES:`);
        const latestPrices = await pricesCollection.aggregate([
            { $group: { _id: { product: '$product', weight: '$weight', section: '$section' }, latestMonth: { $max: '$month' }, latestYear: { $max: '$year' } } },
            { $sort: { latestYear: -1, latestMonth: -1 } },
            { $limit: 10 }
        ]).toArray();

        latestPrices.forEach(item => {
            console.log(`- ${item._id.section} | ${item._id.product} | ${item._id.weight || 'sin peso'} | Último precio: ${item.latestMonth}/${item.latestYear}`);
        });

    } catch (error) {
        console.error('❌ Error en debug:', error);
    }
}