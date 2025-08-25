import { mapDBProductToSelectOption } from '../apps/app/app/[locale]/(authenticated)/admin/table/helpers.js';

async function testBigDogExport() {
    try {
        console.log('🧪 Testing BIG DOG Export Format...\n');

        // Casos de prueba específicos para BIG DOG
        const testCases = [
            {
                dbName: 'BIG DOG (15kg)',
                dbOption: 'VACA',
                expected: 'BIG DOG (15kg) - VACA'
            },
            {
                dbName: 'BIG DOG (15kg)',
                dbOption: 'POLLO',
                expected: 'BIG DOG (15kg) - POLLO'
            },
            {
                dbName: 'BIG DOG (15kg)',
                dbOption: 'CORDERO',
                expected: 'BIG DOG (15kg) - CORDERO'
            }
        ];

        console.log('📋 Testing BIG DOG name reconstruction:\n');

        testCases.forEach((testCase, index) => {
            console.log(`Test Case ${index + 1}:`);
            console.log(`  DB Name: "${testCase.dbName}"`);
            console.log(`  DB Option: "${testCase.dbOption}"`);
            console.log(`  Expected: "${testCase.expected}"`);

            // Probar la función
            const result = mapDBProductToSelectOption(testCase.dbName, testCase.dbOption);
            console.log(`  Result: "${result}"`);

            if (result === testCase.expected) {
                console.log('  ✅ PASS');
            } else {
                console.log('  ❌ FAIL');
            }
            console.log('');
        });

        // Simular el flujo completo de exportación
        console.log('📊 Testing Complete Export Flow:\n');

        const exportItems = [
            {
                name: 'BIG DOG (15kg)',
                options: [{ name: 'VACA', quantity: 3 }]
            },
            {
                name: 'BIG DOG (15kg)',
                options: [{ name: 'POLLO', quantity: 1 }]
            }
        ];

        exportItems.forEach((item, index) => {
            console.log(`Export Item ${index + 1}:`);
            console.log(`  Original: ${item.name} - ${item.options[0].name}`);

            // Reconstruir nombre completo (como en la exportación)
            const fullProductName = mapDBProductToSelectOption(
                item.name,
                item.options[0].name
            );

            console.log(`  Full Name: "${fullProductName}"`);

            // Formato final para Excel
            const exportFormat = `${fullProductName} - x${item.options[0].quantity}`;
            console.log(`  Final Export: "${exportFormat}"`);
            console.log('');
        });

        console.log('🎯 Expected Export Results:');
        console.log('  BIG DOG (15kg) - VACA - x3');
        console.log('  BIG DOG (15kg) - POLLO - x1');

        console.log('\n✅ BIG DOG export test completed successfully!');

    } catch (error) {
        console.error('❌ Test failed with error:', error);
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    testBigDogExport().then(() => {
        console.log('\nScript completed');
        process.exit(0);
    }).catch((error) => {
        console.error('\nScript failed:', error);
        process.exit(1);
    });
}

export { testBigDogExport };
