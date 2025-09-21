/**
 * Script de prueba para verificar que los nombres de productos se generen limpios sin guiones
 */

// Simular la función de mapeo para probar
function mapSelectOptionToDBFormat(selectOption: string): { name: string, option: string } {
    if (selectOption.includes(' - ')) {
        const parts = selectOption.split(' - ');
        if (parts.length >= 2) {
            const section = parts[0]; // PERRO, GATO, OTROS, RAW
            const product = parts[1]; // VACA, POLLO, etc.
            const weight = parts[2] || null; // 10KG, 5KG, etc.

            // Generar nombre limpio sin guiones
            let cleanName = '';

            // Construir nombre basado en la sección
            if (section === 'PERRO' && product.includes('BOX')) {
                // Para productos BOX de perro: "BOX PERRO VACA"
                cleanName = `BOX PERRO ${product.replace('BOX ', '')}`;
            } else if (section === 'GATO' && product.includes('BOX')) {
                // Para productos BOX de gato: "BOX GATO VACA"
                cleanName = `BOX GATO ${product.replace('BOX ', '')}`;
            } else if (section === 'RAW') {
                // Para productos RAW: mantener el nombre del producto tal como está
                cleanName = product;
            } else if (section === 'OTROS') {
                // Para productos de OTROS: usar el nombre del producto
                cleanName = product;
            } else {
                // Fallback: combinar sección y producto
                cleanName = `${section} ${product}`;
            }

            return {
                name: cleanName,
                option: weight || ''
            };
        }
    }

    return { name: selectOption.toUpperCase(), option: '' };
}

async function testCleanProductNames() {
    console.log('🧹 Probando generación de nombres limpios de productos...\n');

    try {
        // Casos de prueba
        const testCases = [
            {
                input: 'PERRO - VACA - 10KG',
                expected: 'BOX PERRO VACA',
                expectedOption: '10KG'
            },
            {
                input: 'PERRO - POLLO - 5KG',
                expected: 'BOX PERRO POLLO',
                expectedOption: '5KG'
            },
            {
                input: 'PERRO - CERDO - 10KG',
                expected: 'BOX PERRO CERDO',
                expectedOption: '10KG'
            },
            {
                input: 'GATO - VACA - 5KG',
                expected: 'BOX GATO VACA',
                expectedOption: '5KG'
            },
            {
                input: 'GATO - POLLO - 5KG',
                expected: 'BOX GATO POLLO',
                expectedOption: '5KG'
            },
            {
                input: 'RAW - Cornalitos 30grs',
                expected: 'Cornalitos 30grs',
                expectedOption: ''
            },
            {
                input: 'RAW - Higado 40grs',
                expected: 'Higado 40grs',
                expectedOption: ''
            },
            {
                input: 'OTROS - BOX DE COMPLEMENTOS',
                expected: 'BOX DE COMPLEMENTOS',
                expectedOption: ''
            },
            {
                input: 'OTROS - HUESOS CARNOSOS 5KG',
                expected: 'HUESOS CARNOSOS 5KG',
                expectedOption: ''
            }
        ];

        console.log('🧪 Ejecutando casos de prueba...\n');

        let passed = 0;
        let failed = 0;

        for (const testCase of testCases) {
            console.log(`📋 Probando: "${testCase.input}"`);

            const result = mapSelectOptionToDBFormat(testCase.input);

            const nameMatch = result.name === testCase.expected;
            const optionMatch = result.option === testCase.expectedOption;

            if (nameMatch && optionMatch) {
                console.log(`   ✅ ÉXITO:`);
                console.log(`       Name: "${result.name}" ✓`);
                console.log(`       Option: "${result.option}" ✓`);
                passed++;
            } else {
                console.log(`   ❌ ERROR:`);
                console.log(`       Expected Name: "${testCase.expected}"`);
                console.log(`       Actual Name: "${result.name}" ${nameMatch ? '✓' : '✗'}`);
                console.log(`       Expected Option: "${testCase.expectedOption}"`);
                console.log(`       Actual Option: "${result.option}" ${optionMatch ? '✓' : '✗'}`);
                failed++;
            }
            console.log('');
        }

        console.log(`📊 Resumen de pruebas:`);
        console.log(`   ✅ Pasaron: ${passed}`);
        console.log(`   ❌ Fallaron: ${failed}`);
        console.log(`   📈 Total: ${passed + failed}`);

        // Mostrar ejemplos de cómo se verían en la base de datos
        console.log('\n📝 Ejemplos de cómo se guardarían en la base de datos:');

        const examples = [
            'PERRO - VACA - 10KG',
            'GATO - POLLO - 5KG',
            'RAW - Cornalitos 30grs',
            'OTROS - BOX DE COMPLEMENTOS'
        ];

        examples.forEach(input => {
            const result = mapSelectOptionToDBFormat(input);
            console.log(`   Input: "${input}"`);
            console.log(`   → DB: { "name": "${result.name}", "option": "${result.option}" }`);
            console.log('');
        });

        console.log('🎉 Pruebas de nombres limpios completadas!');

    } catch (error) {
        console.error('❌ Error en las pruebas:', error);
    }
}

// Ejecutar las pruebas si este archivo se ejecuta directamente
if (require.main === module) {
    testCleanProductNames().then(() => {
        console.log('\n✨ Script de prueba de nombres limpios finalizado');
        process.exit(0);
    }).catch((error) => {
        console.error('💥 Error fatal:', error);
        process.exit(1);
    });
}

export { testCleanProductNames };
