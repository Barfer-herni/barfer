/**
 * Script de prueba para verificar que los productos se guarden con nombres completos
 */

import { getProductsForSelect } from '@repo/data-services';

async function testFullProductNames() {
    console.log('📝 Probando que los productos se guarden con nombres completos...\n');

    try {
        // 1. Obtener productos desde la base de datos
        console.log('1️⃣ Obteniendo productos desde la base de datos...');
        const productsResult = await getProductsForSelect();

        if (!productsResult.success) {
            console.error('❌ Error obteniendo productos:', productsResult.error);
            return;
        }

        console.log(`📋 Productos obtenidos (${productsResult.products.length}):`);
        productsResult.products.slice(0, 10).forEach((product, index) => {
            console.log(`   ${index + 1}. "${product}"`);
        });

        // 2. Verificar que los productos tengan el formato correcto
        console.log('\n2️⃣ Verificando formato de productos...');

        const expectedFormat = /^[A-Z]+ - [A-Z\s]+( - [A-Z0-9]+)?$/;
        const correctlyFormatted = productsResult.products.filter(product => expectedFormat.test(product));
        const incorrectlyFormatted = productsResult.products.filter(product => !expectedFormat.test(product));

        console.log(`✅ Productos con formato correcto: ${correctlyFormatted.length}`);
        console.log(`❌ Productos con formato incorrecto: ${incorrectlyFormatted.length}`);

        if (incorrectlyFormatted.length > 0) {
            console.log('\n📋 Productos con formato incorrecto:');
            incorrectlyFormatted.slice(0, 5).forEach((product, index) => {
                console.log(`   ${index + 1}. "${product}"`);
            });
        }

        // 3. Mostrar ejemplos de productos bien formateados
        console.log('\n3️⃣ Ejemplos de productos bien formateados:');
        correctlyFormatted.slice(0, 10).forEach((product, index) => {
            console.log(`   ${index + 1}. "${product}"`);
        });

        // 4. Verificar productos específicos
        console.log('\n4️⃣ Verificando productos específicos...');

        const specificProducts = [
            'PERRO - VACA - 10KG',
            'GATO - POLLO - 5KG',
            'RAW - Cornalitos 30grs',
            'OTROS - BOX DE COMPLEMENTOS'
        ];

        specificProducts.forEach(productName => {
            const found = productsResult.products.includes(productName);
            console.log(`   ${found ? '✅' : '❌'} "${productName}": ${found ? 'Encontrado' : 'No encontrado'}`);
        });

        // 5. Mostrar productos con detalles
        console.log('\n5️⃣ Productos con detalles:');
        productsResult.productsWithDetails.slice(0, 5).forEach((detail, index) => {
            console.log(`   ${index + 1}. ${detail.formattedName}`);
            console.log(`       - Section: ${detail.section}`);
            console.log(`       - Product: ${detail.product}`);
            console.log(`       - Weight: ${detail.weight || 'null'}`);
        });

        console.log('\n🎉 Prueba de nombres completos completada!');

    } catch (error) {
        console.error('❌ Error en las pruebas:', error);
    }
}

// Ejecutar las pruebas si este archivo se ejecuta directamente
if (require.main === module) {
    testFullProductNames().then(() => {
        console.log('\n✨ Script de prueba de nombres completos finalizado');
        process.exit(0);
    }).catch((error) => {
        console.error('💥 Error fatal:', error);
        process.exit(1);
    });
}

export { testFullProductNames };
