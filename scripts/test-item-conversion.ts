import { mapDBProductToSelectOption, mapSelectOptionToDBFormat } from '../apps/app/app/[locale]/(authenticated)/admin/table/helpers';

async function testItemConversion() {
    try {
        console.log('🧪 Testing Item Conversion (DB ↔ Select)...\n');

        // Casos de prueba para verificar la conversión bidireccional
        const testCases = [
            // Barfer Box - Perro
            {
                dbProduct: 'BOX PERRO POLLO',
                dbOption: '5KG',
                expectedSelect: 'Barfer box Perro Pollo 5kg',
                description: 'Barfer Box Perro Pollo 5kg'
            },
            {
                dbProduct: 'BOX PERRO POLLO',
                dbOption: '10KG',
                expectedSelect: 'Barfer box Perro Pollo 10kg',
                description: 'Barfer Box Perro Pollo 10kg'
            },
            {
                dbProduct: 'BOX PERRO CERDO',
                dbOption: '5KG',
                expectedSelect: 'Barfer box Perro Cerdo 5kg',
                description: 'Barfer Box Perro Cerdo 5kg'
            },
            {
                dbProduct: 'BOX PERRO VACA',
                dbOption: '10KG',
                expectedSelect: 'Barfer box Perro Vaca 10kg',
                description: 'Barfer Box Perro Vaca 10kg'
            },
            {
                dbProduct: 'BOX PERRO CORDERO',
                dbOption: '5KG',
                expectedSelect: 'Barfer box Perro Cordero 5kg',
                description: 'Barfer Box Perro Cordero 5kg'
            },

            // Barfer Box - Gato
            {
                dbProduct: 'BOX GATO POLLO',
                dbOption: '5KG',
                expectedSelect: 'Barfer box Gato Pollo 5kg',
                description: 'Barfer Box Gato Pollo 5kg'
            },
            {
                dbProduct: 'BOX GATO VACA',
                dbOption: '5KG',
                expectedSelect: 'Barfer box Gato Vaca 5kg',
                description: 'Barfer Box Gato Vaca 5kg'
            },

            // Big Dog
            {
                dbProduct: 'BIG DOG POLLO',
                dbOption: '15KG',
                expectedSelect: 'BIG DOG (15kg) - POLLO',
                description: 'Big Dog Pollo 15kg'
            },
            {
                dbProduct: 'BIG DOG VACA',
                dbOption: '15KG',
                expectedSelect: 'BIG DOG (15kg) - VACA',
                description: 'Big Dog Vaca 15kg'
            },

            // Productos Raw
            {
                dbProduct: 'TRAQUEA',
                dbOption: 'X1',
                expectedSelect: 'Traquea X1',
                description: 'Traquea X1'
            },
            {
                dbProduct: 'TRAQUEA',
                dbOption: 'X2',
                expectedSelect: 'Traquea X2',
                description: 'Traquea X2'
            },
            {
                dbProduct: 'OREJAS',
                dbOption: '',
                expectedSelect: 'Orejas',
                description: 'Orejas'
            },
            {
                dbProduct: 'POLLO',
                dbOption: '40GRS',
                expectedSelect: 'Pollo 40grs',
                description: 'Pollo 40grs'
            },
            {
                dbProduct: 'POLLO',
                dbOption: '100GRS',
                expectedSelect: 'Pollo 100grs',
                description: 'Pollo 100grs'
            },
            {
                dbProduct: 'HIGADO',
                dbOption: '40GRS',
                expectedSelect: 'Higado 40grs',
                description: 'Hígado 40grs'
            },
            {
                dbProduct: 'CORNALITOS',
                dbOption: '30GRS',
                expectedSelect: 'Cornalitos 30grs',
                description: 'Cornalitos 30grs'
            },

            // Complementos
            {
                dbProduct: 'HUESOS CARNOSOS',
                dbOption: '5KG',
                expectedSelect: 'Huesos - 5KG',
                description: 'Huesos Carnosos 5kg'
            },
            {
                dbProduct: 'COMPLEMENTOS',
                dbOption: '1 U',
                expectedSelect: 'Complementos',
                description: 'Complementos 1 U'
            },
            {
                dbProduct: 'CALDO DE HUESOS',
                dbOption: '',
                expectedSelect: 'Caldo de huesos',
                description: 'Caldo de Huesos'
            },
            {
                dbProduct: 'HUESO RECREATIVO',
                dbOption: '',
                expectedSelect: 'Hueso recreativo',
                description: 'Hueso Recreativo'
            },
            {
                dbProduct: 'GARRAS',
                dbOption: '300GRS',
                expectedSelect: 'Garras 300grs',
                description: 'Garras 300grs'
            }
        ];

        let passedTests = 0;
        let totalTests = 0;

        console.log('📋 Testing DB → Select conversion...\n');

        for (const testCase of testCases) {
            totalTests++;
            console.log(`Test ${totalTests}: ${testCase.description}`);

            try {
                // Probar conversión DB → Select
                const selectResult = mapDBProductToSelectOption(testCase.dbProduct, testCase.dbOption);

                if (selectResult === testCase.expectedSelect) {
                    console.log(`   ✅ DB → Select: "${testCase.dbProduct} + ${testCase.dbOption}" → "${selectResult}"`);
                    passedTests++;
                } else {
                    console.log(`   ❌ DB → Select: "${testCase.dbProduct} + ${testCase.dbOption}" → "${selectResult}" (expected: "${testCase.expectedSelect}")`);
                }

                // Probar conversión inversa Select → DB
                const dbResult = mapSelectOptionToDBFormat(selectResult);

                if (dbResult.name === testCase.dbProduct && dbResult.option === testCase.dbOption) {
                    console.log(`   ✅ Select → DB: "${selectResult}" → "${dbResult.name} + ${dbResult.option}"`);
                    passedTests++;
                } else {
                    console.log(`   ❌ Select → DB: "${selectResult}" → "${dbResult.name} + ${dbResult.option}" (expected: "${testCase.dbProduct} + ${testCase.dbOption}")`);
                }

            } catch (error) {
                console.log(`   ❌ Error en test: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }

            console.log(''); // Línea en blanco para separar tests
        }

        // Resumen de resultados
        console.log('📊 Test Results Summary:');
        console.log(`   ✅ Passed: ${passedTests}/${totalTests * 2} (${Math.round((passedTests / (totalTests * 2)) * 100)}%)`);
        console.log(`   ❌ Failed: ${(totalTests * 2) - passedTests}/${totalTests * 2}`);

        if (passedTests === totalTests * 2) {
            console.log('\n🎉 All tests passed! Bidirectional conversion is working correctly.');
        } else {
            console.log('\n⚠️  Some tests failed. Check the output above for details.');
        }

        // Probar casos especiales
        console.log('\n🔍 Testing Special Cases...\n');

        // Caso: Item sin fullName (debe mantener el name original)
        console.log('Special Case 1: Item without fullName');
        const itemWithoutFullName = {
            id: 'BOX PERRO POLLO',
            name: 'BOX PERRO POLLO',
            fullName: undefined,
            options: [{ name: '5KG', price: 100, quantity: 1 }]
        };

        if (itemWithoutFullName.fullName && itemWithoutFullName.fullName !== itemWithoutFullName.name) {
            console.log('   ❌ Should not convert item without fullName');
        } else {
            console.log('   ✅ Correctly handled item without fullName');
        }

        // Caso: Item con fullName igual al name (no debe convertir)
        console.log('Special Case 2: Item with fullName same as name');
        const itemWithSameName = {
            id: 'BOX PERRO POLLO',
            name: 'BOX PERRO POLLO',
            fullName: 'BOX PERRO POLLO',
            options: [{ name: '5KG', price: 100, quantity: 1 }]
        };

        if (itemWithSameName.fullName && itemWithSameName.fullName !== itemWithSameName.name) {
            console.log('   ❌ Should not convert item with same name and fullName');
        } else {
            console.log('   ✅ Correctly handled item with same name and fullName');
        }

        // Caso: Item con fullName diferente (debe convertir)
        console.log('Special Case 3: Item with different fullName');
        const itemWithDifferentName = {
            id: 'BOX PERRO POLLO',
            name: 'BOX PERRO POLLO',
            fullName: 'Barfer box Perro Pollo 5kg',
            options: [{ name: '5KG', price: 100, quantity: 1 }]
        };

        if (itemWithDifferentName.fullName && itemWithDifferentName.fullName !== itemWithDifferentName.name) {
            const dbFormat = mapSelectOptionToDBFormat(itemWithDifferentName.fullName);
            console.log(`   ✅ Correctly converted: "${itemWithDifferentName.fullName}" → "${dbFormat.name} + ${dbFormat.option}"`);
        } else {
            console.log('   ❌ Should convert item with different fullName');
        }

    } catch (error) {
        console.error('❌ Test failed with error:', error);
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    testItemConversion().then(() => {
        console.log('\nScript completed');
        process.exit(0);
    }).catch((error) => {
        console.error('\nScript failed:', error);
        process.exit(1);
    });
}

export { testItemConversion };
