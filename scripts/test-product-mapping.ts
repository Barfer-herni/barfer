import { mapDBProductToSelectOption, mapSelectOptionToDBFormat } from '../apps/app/app/[locale]/(authenticated)/admin/table/helpers';

function testProductMapping() {
    console.log('🧪 Testing Product Mapping Functionality...\n');

    // Casos de prueba para productos de la DB
    const testCases = [
        // Casos de Barfer Box
        {
            dbProduct: 'BOX PERRO POLLO',
            dbOption: '5KG',
            expected: 'Barfer box Perro Pollo 5kg'
        },
        {
            dbProduct: 'BOX PERRO POLLO',
            dbOption: '10KG',
            expected: 'Barfer box Perro Pollo 10kg'
        },
        {
            dbProduct: 'BOX PERRO CERDO',
            dbOption: '5KG',
            expected: 'Barfer box Perro Cerdo 5kg'
        },
        {
            dbProduct: 'BOX GATO POLLO',
            dbOption: '5KG',
            expected: 'Barfer box Gato Pollo 5kg'
        },
        {
            dbProduct: 'BOX PERRO VACA',
            dbOption: '5KG',
            expected: 'Barfer box Perro Vaca 5kg'
        },
        {
            dbProduct: 'BOX PERRO CORDERO',
            dbOption: '10KG',
            expected: 'Barfer box Perro Cordero 10kg'
        },

        // Casos especiales
        {
            dbProduct: 'BIG DOG POLLO',
            dbOption: '15KG',
            expected: 'BIG DOG (15kg) - POLLO'
        },
        {
            dbProduct: 'BIG DOG VACA',
            dbOption: '15KG',
            expected: 'BIG DOG (15kg) - VACA'
        },
        {
            dbProduct: 'HUESOS CARNOSOS',
            dbOption: '5KG',
            expected: 'HUESOS CARNOSOS - 5KG'
        },

        // Casos de productos raw
        {
            dbProduct: 'TRAQUEA',
            dbOption: 'X1',
            expected: 'Traquea X1'
        },
        {
            dbProduct: 'TRAQUEA',
            dbOption: 'X2',
            expected: 'Traquea X2'
        },
        {
            dbProduct: 'OREJAS',
            dbOption: '',
            expected: 'Orejas'
        },
        {
            dbProduct: 'POLLO',
            dbOption: '40GRS',
            expected: 'Pollo 40grs'
        },
        {
            dbProduct: 'POLLO',
            dbOption: '100GRS',
            expected: 'Pollo 100grs'
        },
        {
            dbProduct: 'HIGADO',
            dbOption: '40GRS',
            expected: 'Higado 40grs'
        },
        {
            dbProduct: 'CORNALITOS',
            dbOption: '30GRS',
            expected: 'Cornalitos 30grs'
        },

        // Casos de complementos
        {
            dbProduct: 'CORNALITOS',
            dbOption: '200GRS',
            expected: 'Cornalitos 200grs'
        },
        {
            dbProduct: 'CALDO DE HUESOS',
            dbOption: '',
            expected: 'Caldo de huesos'
        },
        {
            dbProduct: 'HUESO RECREATIVO',
            dbOption: '',
            expected: 'Hueso recreativo'
        },
        {
            dbProduct: 'GARRAS',
            dbOption: '300GRS',
            expected: 'Garras 300grs'
        }
    ];

    console.log('📋 Testing DB to Select mapping:\n');

    let passedTests = 0;
    let totalTests = testCases.length;

    testCases.forEach((testCase, index) => {
        const result = mapDBProductToSelectOption(testCase.dbProduct, testCase.dbOption);
        const passed = result === testCase.expected;

        if (passed) {
            passedTests++;
            console.log(`✅ Test ${index + 1}: PASSED`);
        } else {
            console.log(`❌ Test ${index + 1}: FAILED`);
        }

        console.log(`   DB Product: "${testCase.dbProduct}"`);
        console.log(`   DB Option: "${testCase.dbOption}"`);
        console.log(`   Expected: "${testCase.expected}"`);
        console.log(`   Got: "${result}"`);
        console.log('');
    });

    console.log(`🎯 DB to Select Results: ${passedTests}/${totalTests} tests passed\n`);

    // Ahora probar el mapeo inverso (Select a DB)
    console.log('🔄 Testing Select to DB mapping:\n');

    const reverseTestCases = [
        {
            selectOption: 'Barfer box Perro Pollo 5kg',
            expectedName: 'BOX PERRO POLLO',
            expectedOption: '5KG'
        },
        {
            selectOption: 'Barfer box Perro Cerdo 10kg',
            expectedName: 'BOX PERRO CERDO',
            expectedOption: '10KG'
        },
        {
            selectOption: 'BIG DOG (15kg) - POLLO',
            expectedName: 'BIG DOG POLLO',
            expectedOption: '15KG'
        },
        {
            selectOption: 'Traquea X1',
            expectedName: 'TRAQUEA',
            expectedOption: 'X1'
        },
        {
            selectOption: 'Pollo 40grs',
            expectedName: 'POLLO',
            expectedOption: '40GRS'
        }
    ];

    let passedReverseTests = 0;
    let totalReverseTests = reverseTestCases.length;

    reverseTestCases.forEach((testCase, index) => {
        const result = mapSelectOptionToDBFormat(testCase.selectOption);
        const passed = result.name === testCase.expectedName && result.option === testCase.expectedOption;

        if (passed) {
            passedReverseTests++;
            console.log(`✅ Reverse Test ${index + 1}: PASSED`);
        } else {
            console.log(`❌ Reverse Test ${index + 1}: FAILED`);
        }

        console.log(`   Select Option: "${testCase.selectOption}"`);
        console.log(`   Expected Name: "${testCase.expectedName}"`);
        console.log(`   Expected Option: "${testCase.expectedOption}"`);
        console.log(`   Got Name: "${result.name}"`);
        console.log(`   Got Option: "${result.option}"`);
        console.log('');
    });

    console.log(`🎯 Select to DB Results: ${passedReverseTests}/${totalReverseTests} tests passed\n`);

    const totalPassed = passedTests + passedReverseTests;
    const totalTestsCount = totalTests + totalReverseTests;

    console.log(`🎯 Overall Results: ${totalPassed}/${totalTestsCount} tests passed`);

    if (totalPassed === totalTestsCount) {
        console.log('🎉 All tests passed! Product mapping is working correctly in both directions.');
    } else {
        console.log('⚠️  Some tests failed. Check the mapping logic.');
    }

    console.log('\n💡 This mapping is used to:');
    console.log('   1. Convert DB product names to select options (for autocomplete)');
    console.log('   2. Convert select options back to DB format (when saving)');
}

// Ejecutar si se llama directamente
if (require.main === module) {
    testProductMapping();
}

export { testProductMapping };
