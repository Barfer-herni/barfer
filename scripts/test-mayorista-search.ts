import { createMayoristaPerson, searchMayoristas, findMayoristaByName } from '@repo/data-services';

async function testMayoristaSearch() {
    try {
        console.log('🧪 Testing Mayorista Person System...\n');

        // 1. Probar búsqueda inicial (debe estar vacía)
        console.log('1. Testing initial search...');
        const initialSearch = await searchMayoristas('test');

        if (initialSearch.success) {
            console.log(`✅ Initial search successful. Found ${initialSearch.mayoristas?.length || 0} mayoristas`);
        } else {
            console.log('❌ Initial search failed:', initialSearch.error);
        }

        // 2. Probar creación de mayorista de prueba
        console.log('\n2. Testing mayorista creation...');
        const testMayoristaData = {
            user: {
                name: 'Juan',
                lastName: 'Test',
                email: 'juan.test@example.com',
            },
            address: {
                address: 'Calle Test 123',
                city: 'Ciudad Test',
                phone: '123456789',
                betweenStreets: 'Entre A y B',
                floorNumber: '1',
                departmentNumber: 'A',
            },
        };

        const createResult = await createMayoristaPerson(testMayoristaData);

        if (createResult.success) {
            console.log('✅ Mayorista person created successfully');
            console.log(`   - ID: ${createResult.mayorista?._id}`);
            console.log(`   - Is New: ${createResult.isNew}`);
        } else {
            console.log('❌ Failed to create mayorista person:', createResult.error);
            return;
        }

        // 3. Probar búsqueda del mayorista creado
        console.log('\n3. Testing search for created mayorista...');
        const searchResult = await searchMayoristas('Juan');

        if (searchResult.success && searchResult.mayoristas && searchResult.mayoristas.length > 0) {
            console.log('✅ Search successful');
            console.log(`   - Found ${searchResult.mayoristas.length} mayorista(s)`);
            searchResult.mayoristas.forEach((mayorista, index) => {
                console.log(`   - ${index + 1}. ${mayorista.user.name} ${mayorista.user.lastName} (${mayorista.user.email})`);
            });
        } else {
            console.log('❌ Search failed or no results:', searchResult.error);
        }

        // 4. Probar búsqueda por nombre completo
        console.log('\n4. Testing search by full name...');
        const fullNameSearch = await findMayoristaByName('Juan', 'Test');

        if (fullNameSearch.success) {
            console.log('✅ Full name search successful');
            console.log(`   - Found: ${fullNameSearch.mayorista?.user.name} ${fullNameSearch.mayorista?.user.lastName}`);
        } else {
            console.log('❌ Full name search failed:', fullNameSearch.error);
        }

        // 5. Probar creación duplicada (debe retornar el existente)
        console.log('\n5. Testing duplicate creation...');
        const duplicateResult = await createMayoristaPerson(testMayoristaData);

        if (duplicateResult.success) {
            if (duplicateResult.isNew) {
                console.log('❌ Duplicate creation should not create new mayorista');
            } else {
                console.log('✅ Duplicate creation correctly returned existing mayorista');
                console.log(`   - ID: ${duplicateResult.mayorista?._id}`);
            }
        } else {
            console.log('❌ Duplicate creation failed:', duplicateResult.error);
        }

        // 6. Probar búsqueda por email
        console.log('\n6. Testing search by email...');
        const emailSearch = await searchMayoristas('juan.test@example.com');

        if (emailSearch.success && emailSearch.mayoristas && emailSearch.mayoristas.length > 0) {
            console.log('✅ Email search successful');
            console.log(`   - Found: ${emailSearch.mayoristas[0].user.name} ${emailSearch.mayoristas[0].user.lastName}`);
        } else {
            console.log('❌ Email search failed or no results');
        }

        // 7. Probar búsqueda por teléfono
        console.log('\n7. Testing search by phone...');
        const phoneSearch = await searchMayoristas('123456789');

        if (phoneSearch.success && phoneSearch.mayoristas && phoneSearch.mayoristas.length > 0) {
            console.log('✅ Phone search successful');
            console.log(`   - Found: ${phoneSearch.mayoristas[0].user.name} ${phoneSearch.mayoristas[0].user.lastName}`);
        } else {
            console.log('❌ Phone search failed or no results');
        }

        console.log('\n🎉 All tests completed successfully!');

    } catch (error) {
        console.error('❌ Test failed with error:', error);
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    testMayoristaSearch().then(() => {
        console.log('\nScript completed');
        process.exit(0);
    }).catch((error) => {
        console.error('\nScript failed:', error);
        process.exit(1);
    });
}

export { testMayoristaSearch };
