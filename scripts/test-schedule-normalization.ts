import { normalizeScheduleTime } from '../apps/app/app/[locale]/(authenticated)/admin/table/helpers.js';

async function testScheduleNormalization() {
    try {
        console.log('🧪 Testing Schedule Normalization...\n');

        // Casos de prueba para la normalización del schedule
        const testCases = [
            {
                input: 'De 18hs a 19hs',
                expected: 'De 18:00hs a 19:00hs aprox',
                description: 'Agregar automáticamente aprox y convertir hs a formato con minutos'
            },
            {
                input: 'De 18.30 a 19.45hs',
                expected: 'De 18:30 a 19:45hs aprox',
                description: 'Convertir puntos a dos puntos y agregar aprox'
            },
            {
                input: 'De 18:30 a 19:45hs aprox',
                expected: 'De 18:30 a 19:45hs aprox',
                description: 'Ya tiene formato correcto, no cambiar'
            },
            {
                input: 'De 1830 a 2000hs APROXIMADAMENTE',
                expected: 'De 18:30 a 20:00hs aprox',
                description: 'Convertir formato 4 dígitos y APROXIMADAMENTE a aprox'
            },
            {
                input: '18hs a 19hs',
                expected: '18:00hs a 19:00hs aprox',
                description: 'Sin "De", pero agregar aprox automáticamente'
            },
            {
                input: 'De 18 a 19hs',
                expected: 'De 18:00 a 19:00hs aprox',
                description: 'Agregar minutos y aprox automáticamente'
            }
        ];

        console.log('📋 Testing normalizeScheduleTime:\n');

        let allPassed = true;

        testCases.forEach((testCase, index) => {
            console.log(`Test ${index + 1}:`);
            console.log(`  Input: "${testCase.input}"`);
            console.log(`  Expected: "${testCase.expected}"`);
            console.log(`  Description: ${testCase.description}`);

            // Probar la función
            const result = normalizeScheduleTime(testCase.input);
            console.log(`  Result: "${result}"`);

            if (result === testCase.expected) {
                console.log('  ✅ PASS');
            } else {
                console.log('  ❌ FAIL');
                console.log(`    Expected: "${testCase.expected}"`);
                console.log(`    Got: "${result}"`);
                allPassed = false;
            }
            console.log('');
        });

        // Test especial para verificar que no se duplique "aprox"
        console.log('🔍 Testing edge cases:');

        const edgeCases = [
            'De 18hs a 19hs aprox',
            'De 18hs a 19hs APROXIMADAMENTE',
            'De 18hs a 19hs APROX'
        ];

        edgeCases.forEach((edgeCase, index) => {
            const result = normalizeScheduleTime(edgeCase);
            const hasMultipleAprox = (result.match(/aprox/gi) || []).length > 1;

            if (hasMultipleAprox) {
                console.log(`  ❌ Edge case ${index + 1}: "${edgeCase}" -> "${result}" (duplicado aprox)`);
                allPassed = false;
            } else {
                console.log(`  ✅ Edge case ${index + 1}: "${edgeCase}" -> "${result}"`);
            }
        });

        console.log('');
        if (allPassed) {
            console.log('🎯 Todos los tests pasaron! La normalización del schedule funciona correctamente');
        } else {
            console.log('❌ Algunos tests fallaron. Revisar la función normalizeScheduleTime');
        }

        console.log('\n✅ Schedule normalization test completed!');

    } catch (error) {
        console.error('❌ Test failed with error:', error);
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    testScheduleNormalization().then(() => {
        console.log('\nScript completed');
        process.exit(0);
    }).catch((error) => {
        console.error('\nScript failed:', error);
        process.exit(1);
    });
}

export { testScheduleNormalization };
