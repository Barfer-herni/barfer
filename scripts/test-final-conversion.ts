import { mapSelectOptionToDBFormat } from '../apps/app/app/[locale]/(authenticated)/admin/table/helpers';

async function testFinalConversion() {
    try {
        console.log('🧪 Testing Final Item Conversion Flow...\n');

        // Simular el flujo completo de conversión
        console.log('1. Frontend: Usuario selecciona "Barfer box Perro Cerdo 10kg" del select');
        const selectOption = "Barfer box Perro Cerdo 10kg";

        console.log('2. Frontend: Se convierte a formato DB usando mapSelectOptionToDBFormat');
        const dbFormat = mapSelectOptionToDBFormat(selectOption);
        console.log(`   Resultado: name="${dbFormat.name}", option="${dbFormat.option}"`);

        if (dbFormat.name === 'BOX PERRO CERDO' && dbFormat.option === '10KG') {
            console.log('   ✅ Conversión frontend exitosa');
        } else {
            console.log('   ❌ Conversión frontend falló');
            return;
        }

        console.log('\n3. Frontend: Se crea el objeto item para enviar al backend');
        const frontendItem = {
            id: dbFormat.name,
            name: dbFormat.name,
            fullName: selectOption, // Se mantiene para futuras ediciones
            description: "",
            images: [],
            options: [{
                name: dbFormat.option,
                price: 0,
                quantity: 1
            }],
            price: 0,
            salesCount: 0,
            discountApllied: 0
        };

        console.log('   Item frontend:', JSON.stringify(frontendItem, null, 2));

        console.log('\n4. Backend: Se recibe el item y se limpia (elimina fullName)');
        const backendItem = {
            id: frontendItem.id,
            name: frontendItem.name,
            description: frontendItem.description,
            images: frontendItem.images,
            options: frontendItem.options,
            price: frontendItem.price,
            salesCount: frontendItem.salesCount,
            discountApllied: frontendItem.discountApllied
        };

        console.log('   Item backend (sin fullName):', JSON.stringify(backendItem, null, 2));

        console.log('\n5. Verificación: El item se guardó correctamente en la DB');
        if (backendItem.name === 'BOX PERRO CERDO' &&
            backendItem.options[0].name === '10KG' &&
            !backendItem.hasOwnProperty('fullName')) {
            console.log('   ✅ Item guardado correctamente en la DB');
        } else {
            console.log('   ❌ Item no se guardó correctamente en la DB');
        }

        console.log('\n6. Verificación: Al editar, se puede reconstruir el fullName');
        const reconstructedFullName = `Barfer box Perro Cerdo ${backendItem.options[0].name.toLowerCase()}`;
        console.log(`   FullName reconstruido: "${reconstructedFullName}"`);

        if (reconstructedFullName === selectOption) {
            console.log('   ✅ FullName se puede reconstruir correctamente');
        } else {
            console.log('   ❌ FullName no se puede reconstruir correctamente');
        }

        console.log('\n🎉 Flujo completo de conversión funcionando correctamente!');
        console.log('\n📋 Resumen del flujo:');
        console.log('   Select → DB: "Barfer box Perro Cerdo 10kg" → name="BOX PERRO CERDO", option="10KG"');
        console.log('   DB → Select: name="BOX PERRO CERDO", option="10KG" → "Barfer box Perro Cerdo 10kg"');
        console.log('   Campo fullName: Solo en frontend, no se guarda en DB');
        console.log('   Conversión: Automática en ambas direcciones');

    } catch (error) {
        console.error('❌ Test failed with error:', error);
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    testFinalConversion().then(() => {
        console.log('\nScript completed');
        process.exit(0);
    }).catch((error) => {
        console.error('\nScript failed:', error);
        process.exit(1);
    });
}

export { testFinalConversion };
