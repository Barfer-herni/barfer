import { getCategorySales, getProductsByTimePeriod } from '../packages/data-services/src/services/barfer/analytics';

async function debugBigDogAnalytics() {
    console.log('🔍 Debugging BIG DOG Analytics...\n');

    try {
        // Calcular fechas para los últimos 30 días
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);

        console.log('📅 Fechas de consulta:');
        console.log(`  Desde: ${startDate.toISOString()}`);
        console.log(`  Hasta: ${endDate.toISOString()}`);
        console.log('');

        // 1. Probar getCategorySales
        console.log('1️⃣ Probando getCategorySales...');
        const categorySales = await getCategorySales('all', 10, startDate, endDate);
        
        console.log('Resultado de getCategorySales:');
        categorySales.forEach(category => {
            console.log(`  ${category.categoryName}: ${category.quantity} unidades, $${category.revenue}`);
        });
        console.log('');

        // 2. Probar getProductsByTimePeriod
        console.log('2️⃣ Probando getProductsByTimePeriod...');
        const timePeriodData = await getProductsByTimePeriod(startDate, endDate);
        
        console.log(`Total de períodos encontrados: ${timePeriodData.length}`);
        if (timePeriodData.length > 0) {
            console.log('Primeros 3 períodos:');
            timePeriodData.slice(0, 3).forEach(period => {
                console.log(`  ${period.period}: bigDog=${period.bigDogQuantity}, perro=${period.perroQuantity}, gato=${period.gatoQuantity}`);
            });
        }
        console.log('');

        // 3. Calcular totales de BIG DOG
        console.log('3️⃣ Calculando totales de BIG DOG...');
        const bigDogTotals = timePeriodData.reduce((acc, period) => ({
            quantity: acc.quantity + (period.bigDogQuantity || 0),
            revenue: acc.revenue + (period.bigDogRevenue || 0)
        }), { quantity: 0, revenue: 0 });

        console.log(`Totales de BIG DOG en timePeriodData:`);
        console.log(`  Cantidad: ${bigDogTotals.quantity}`);
        console.log(`  Ingresos: $${bigDogTotals.revenue.toLocaleString()}`);
        console.log('');

        // 4. Verificar si hay datos en categorySales
        const bigDogCategory = categorySales.find(cat => cat.categoryName === 'BIG DOG');
        if (bigDogCategory) {
            console.log('✅ BIG DOG encontrado en categorySales:');
            console.log(`  Cantidad: ${bigDogCategory.quantity}`);
            console.log(`  Ingresos: $${bigDogCategory.revenue.toLocaleString()}`);
        } else {
            console.log('❌ BIG DOG NO encontrado en categorySales');
            console.log('Categorías disponibles:', categorySales.map(cat => cat.categoryName));
        }
        console.log('');

        // 5. Comparar con datos de MongoDB Compass
        console.log('5️⃣ Comparación con MongoDB Compass:');
        console.log('MongoDB Compass (últimos 30 días):');
        console.log('  Cantidad: 119');
        console.log('  Ingresos: $10,363,000');
        console.log('');
        console.log('Sistema de Analytics:');
        console.log(`  Cantidad: ${bigDogTotals.quantity}`);
        console.log(`  Ingresos: $${bigDogTotals.revenue.toLocaleString()}`);
        console.log('');

        if (bigDogTotals.quantity === 119 && bigDogTotals.revenue === 10363000) {
            console.log('✅ Los datos coinciden perfectamente!');
        } else {
            console.log('❌ Los datos NO coinciden. Hay un problema en el sistema.');
        }

    } catch (error) {
        console.error('💥 Error en el debug:', error);
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    debugBigDogAnalytics().then(() => {
        console.log('\n✅ Debug completado');
        process.exit(0);
    }).catch((error) => {
        console.error('\n❌ Debug falló:', error);
        process.exit(1);
    });
}

export { debugBigDogAnalytics };
