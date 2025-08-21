import { getMayoristaOrdersForTable } from '@repo/data-services/src/services/barfer';

async function testMayoristaAutocomplete() {
    try {
        console.log('🧪 Testing Mayorista Autocomplete Functionality...\n');

        // 1. Buscar mayoristas existentes
        console.log('1. Searching for existing mayoristas...');
        const searchResult = await getMayoristaOrdersForTable({
            page: 1,
            pageSize: 5,
            search: '',
        });

        if (searchResult.orders && searchResult.orders.length > 0) {
            console.log(`✅ Found ${searchResult.orders.length} mayoristas`);

            // Mostrar el primer mayorista como ejemplo
            const sampleMayorista = searchResult.orders[0];
            console.log('\n📋 Sample mayorista data:');
            console.log(`   - Name: ${sampleMayorista.user.name} ${sampleMayorista.user.lastName}`);
            console.log(`   - Email: ${sampleMayorista.user.email}`);
            console.log(`   - Phone: ${sampleMayorista.address.phone}`);
            console.log(`   - City: ${sampleMayorista.address.city}`);
            console.log(`   - Total: ${sampleMayorista.total}`);
            console.log(`   - Payment Method: ${sampleMayorista.paymentMethod}`);
            console.log(`   - Schedule: ${sampleMayorista.deliveryArea?.schedule}`);
            console.log(`   - Items: ${sampleMayorista.items?.length || 0} items`);

            if (sampleMayorista.items && sampleMayorista.items.length > 0) {
                console.log('\n   📦 First item:');
                const firstItem = sampleMayorista.items[0];
                console.log(`      - Name: ${firstItem.name}`);
                console.log(`      - Options: ${firstItem.options?.length || 0} options`);
                if (firstItem.options && firstItem.options.length > 0) {
                    const firstOption = firstItem.options[0];
                    console.log(`      - First option: ${firstOption.name} - Quantity: ${(firstOption as any).quantity || 'N/A'}`);
                }
            }
        } else {
            console.log('❌ No mayoristas found');
        }

        console.log('\n🎉 Test completed successfully!');
        console.log('\n💡 To test the autocomplete functionality:');
        console.log('   1. Go to the admin table page');
        console.log('   2. Click "Crear Orden"');
        console.log('   3. Select "Mayorista" as order type');
        console.log('   4. Use the search field to find mayoristas');
        console.log('   5. Select one to autocomplete all fields');

    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    testMayoristaAutocomplete()
        .then(() => {
            console.log('Script completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Script failed:', error);
            process.exit(1);
        });
}

export { testMayoristaAutocomplete };
