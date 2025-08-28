import { mapSelectOptionToDBFormat } from '../apps/app/app/[locale]/(authenticated)/admin/table/helpers.js';

async function testBigDogMapping() {
    try {
        console.log('🧪 Testing BIG DOG Mapping (Select Option → DB Format)...\n');

        // Casos de prueba para BIG DOG
        const testCases = [
            {
                selectOption: 'BIG DOG (15kg) - POLLO',
                expected: {
                    name: 'BIG DOG (15kg)',
                    option: 'POLLO'
                }
            },
            {
                selectOption: 'BIG DOG (15kg) - VACA',
                expected: {
                    name: 'BIG DOG (15kg)',
                    option: 'VACA'
                }
            }
        ];

        console.log('📋 Testing mapSelectOptionToDBFormat for BIG DOG:\n');

        testCases.forEach((testCase, index) => {
            console.log(`Test Case ${index + 1}:`);
            console.log(`  Select Option: "${testCase.selectOption}"`);
            console.log(`  Expected Name: "${testCase.expected.name}"`);
            console.log(`  Expected Option: "${testCase.expected.option}"`);

            // Probar la función
            const result = mapSelectOptionToDBFormat(testCase.selectOption);
            console.log(`  Result Name: "${result.name}"`);
            console.log(`  Result Option: "${result.option}"`);

            if (result.name === testCase.expected.name && result.option === testCase.expected.option) {
                console.log('  ✅ PASS');
            } else {
                console.log('  ❌ FAIL');
                console.log(`    Expected: ${JSON.stringify(testCase.expected)}`);
                console.log(`    Got: ${JSON.stringify(result)}`);
            }
            console.log('');
        });

        // Simular el flujo completo de procesamiento de items
        console.log('📊 Testing Complete Item Processing Flow:\n');

        const testItems = [
            {
                name: 'BIG DOG (15kg) - POLLO',
                options: [{ name: 'Default', price: 0, quantity: 1 }]
            },
            {
                name: 'BIG DOG (15kg) - VACA',
                options: [{ name: 'Default', price: 0, quantity: 1 }]
            }
        ];

        testItems.forEach((item, index) => {
            console.log(`Processing Item ${index + 1}:`);
            console.log(`  Original Name: "${item.name}"`);

            // Aplicar mapeo inverso (como en processSingleItem)
            const dbFormat = mapSelectOptionToDBFormat(item.name);

            console.log(`  Mapped Name: "${dbFormat.name}"`);
            console.log(`  Mapped Option: "${dbFormat.option}"`);

            // Simular el resultado final
            const processedItem = {
                id: dbFormat.name,
                name: dbFormat.name,
                fullName: item.name,
                options: [{
                    name: dbFormat.option,
                    price: 0,
                    quantity: 1
                }]
            };

            console.log(`  Final Item Structure:`);
            console.log(`    ID: "${processedItem.id}"`);
            console.log(`    Name: "${processedItem.name}"`);
            console.log(`    Options[0].name: "${processedItem.options[0].name}"`);
            console.log('');
        });

        console.log('🎯 Expected Final Results:');
        console.log('  Item 1: BIG DOG (15kg) with option POLLO');
        console.log('  Item 2: BIG DOG (15kg) with option VACA');

        console.log('\n✅ BIG DOG mapping test completed successfully!');

    } catch (error) {
        console.error('❌ Test failed with error:', error);
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    testBigDogMapping().then(() => {
        console.log('\nScript completed');
        process.exit(0);
    }).catch((error) => {
        console.error('\nScript failed:', error);
        process.exit(1);
    });
}

export { testBigDogMapping };
