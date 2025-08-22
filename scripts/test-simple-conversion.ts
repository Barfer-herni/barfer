import { mapSelectOptionToDBFormat } from '../apps/app/app/[locale]/(authenticated)/admin/table/helpers';

async function testSimpleConversion() {
    try {
        console.log('🧪 Testing Simple Item Conversion...\n');

        // Test case específico del problema
        const testFullName = "Barfer box Perro Cerdo 10kg";
        console.log(`Testing conversion of: "${testFullName}"`);

        const result = mapSelectOptionToDBFormat(testFullName);
        console.log('Result:', result);

        if (result.name === 'BOX PERRO CERDO' && result.option === '10KG') {
            console.log('✅ Conversion successful!');
        } else {
            console.log('❌ Conversion failed!');
            console.log(`Expected: name="BOX PERRO CERDO", option="10KG"`);
            console.log(`Got: name="${result.name}", option="${result.option}"`);
        }

        // Test más casos
        const testCases = [
            "Barfer box Perro Pollo 5kg",
            "Barfer box Perro Vaca 10kg",
            "Big Dog (15kg) - Pollo",
            "Traquea X1"
        ];

        console.log('\n📋 Testing more cases...\n');

        for (const testCase of testCases) {
            console.log(`Testing: "${testCase}"`);
            const testResult = mapSelectOptionToDBFormat(testCase);
            console.log(`Result: name="${testResult.name}", option="${testResult.option}"`);
            console.log('');
        }

    } catch (error) {
        console.error('❌ Test failed with error:', error);
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    testSimpleConversion().then(() => {
        console.log('\nScript completed');
        process.exit(0);
    }).catch((error) => {
        console.error('\nScript failed:', error);
        process.exit(1);
    });
}

export { testSimpleConversion };
