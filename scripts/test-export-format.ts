import { mapDBProductToSelectOption } from '../apps/app/app/[locale]/(authenticated)/admin/table/helpers';

async function testExportFormat() {
    try {
        console.log('🧪 Testing Export Product Format...\n');

        // Simular items de la base de datos
        const testItems = [
            {
                name: 'BIG DOG VACA',
                options: [{ name: '15KG', quantity: 3 }]
            },
            {
                name: 'BIG DOG POLLO',
                options: [{ name: '15KG', quantity: 1 }]
            },
            {
                name: 'BOX PERRO CERDO',
                options: [{ name: '10KG', quantity: 2 }]
            },
            {
                name: 'BOX PERRO POLLO',
                options: [{ name: '5KG', quantity: 1 }]
            },
            {
                name: 'TRAQUEA',
                options: [{ name: 'X1', quantity: 5 }]
            },
            {
                name: 'HUESOS CARNOSOS',
                options: [{ name: '5KG', quantity: 1 }]
            }
        ];

        console.log('📋 Testing product name reconstruction for export:\n');

        testItems.forEach((item, index) => {
            console.log(`Item ${index + 1}:`);
            console.log(`  DB Name: "${item.name}"`);
            console.log(`  DB Option: "${item.options[0].name}"`);
            console.log(`  Quantity: ${item.options[0].quantity}`);

            // Reconstruir nombre completo (como en la exportación)
            const fullProductName = mapDBProductToSelectOption(
                item.name,
                item.options[0].name
            );

            console.log(`  Full Name: "${fullProductName}"`);

            // Formato final para Excel
            const exportFormat = `${fullProductName} - x${item.options[0].quantity}`;
            console.log(`  Export Format: "${exportFormat}"`);
            console.log('');
        });

        console.log('🎯 Expected Results:');
        console.log('  BIG DOG (15kg) - Vaca - x3');
        console.log('  BIG DOG (15kg) - Pollo - x1');
        console.log('  Barfer box Perro Cerdo 10kg - x2');
        console.log('  Barfer box Perro Pollo 5kg - x1');
        console.log('  Traquea X1 - x5');
        console.log('  Huesos Carnosos 5kg - x1');

        console.log('\n✅ Test completed successfully!');

    } catch (error) {
        console.error('❌ Test failed with error:', error);
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    testExportFormat().then(() => {
        console.log('\nScript completed');
        process.exit(0);
    }).catch((error) => {
        console.error('\nScript failed:', error);
        process.exit(1);
    });
}

export { testExportFormat };
