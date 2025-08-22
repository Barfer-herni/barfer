import { mapSelectOptionToDBFormat, processOrderItems } from '../packages/data-services/src/services/barfer/productMapping';

function testProductMappingFix() {
    console.log('🧪 Testing Product Mapping Fix...\n');

    // Casos de prueba para verificar que el mapeo funciona correctamente
    const testCases = [
        {
            input: 'Barfer box Perro Cerdo 10kg',
            expected: { name: 'BOX PERRO CERDO', option: '10KG' }
        },
        {
            input: 'Barfer box Perro Pollo 5kg',
            expected: { name: 'BOX PERRO POLLO', option: '5KG' }
        },
        {
            input: 'Barfer box Gato Vaca 5kg',
            expected: { name: 'BOX GATO VACA', option: '5KG' }
        },
        {
            input: 'Big Dog Pollo',
            expected: { name: 'BIG DOG POLLO', option: '15KG' }
        },
        {
            input: 'Huesos',
            expected: { name: 'HUESOS CARNOSOS', option: '5KG' }
        }
    ];

    console.log('📋 Testing mapSelectOptionToDBFormat:');
    testCases.forEach((testCase, index) => {
        const result = mapSelectOptionToDBFormat(testCase.input);
        const passed = result.name === testCase.expected.name && result.option === testCase.expected.option;

        console.log(`  ${passed ? '✅' : '❌'} Test ${index + 1}: "${testCase.input}"`);
        console.log(`     Expected: ${testCase.expected.name} - ${testCase.expected.option}`);
        console.log(`     Got:      ${result.name} - ${result.option}`);
        console.log('');
    });

    // Probar processOrderItems
    console.log('📋 Testing processOrderItems:');

    const testOrderItems = [
        {
            id: 'temp-id',
            name: 'Barfer box Perro Cerdo 10kg',
            fullName: 'Barfer box Perro Cerdo 10kg',
            options: [{ name: 'Default', price: 0, quantity: 1 }],
            price: 0,
            salesCount: 0,
            discountApllied: 0
        },
        {
            id: 'temp-id-2',
            name: 'Big Dog Pollo',
            fullName: 'Big Dog Pollo',
            options: [{ name: 'Default', price: 0, quantity: 1 }],
            price: 0,
            salesCount: 0,
            discountApllied: 0
        }
    ];

    const processedItems = processOrderItems(testOrderItems);

    console.log('  Input items:');
    testOrderItems.forEach((item, index) => {
        console.log(`    ${index + 1}. ${item.fullName}`);
    });

    console.log('\n  Processed items:');
    processedItems.forEach((item, index) => {
        console.log(`    ${index + 1}. ID: ${item.id}, Name: ${item.name}, Option: ${item.options[0]?.name}`);
    });

    // Verificar que el mapeo se aplicó correctamente
    const firstItem = processedItems[0];
    const secondItem = processedItems[1];

    const firstPassed = firstItem.id === 'BOX PERRO CERDO' && firstItem.name === 'BOX PERRO CERDO' && firstItem.options[0]?.name === '10KG';
    const secondPassed = secondItem.id === 'BIG DOG POLLO' && secondItem.name === 'BIG DOG POLLO' && secondItem.options[0]?.name === '15KG';

    console.log(`\n  ✅ First item mapping: ${firstPassed ? 'PASSED' : 'FAILED'}`);
    console.log(`  ✅ Second item mapping: ${secondPassed ? 'PASSED' : 'FAILED'}`);

    if (firstPassed && secondPassed) {
        console.log('\n🎉 All tests passed! The product mapping fix is working correctly.');
    } else {
        console.log('\n❌ Some tests failed. Please check the implementation.');
    }
}

// Ejecutar las pruebas
testProductMappingFix();
