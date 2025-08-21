import { getMayoristaOrdersForTable, createMayoristaOrder } from '@repo/data-services/src/services/barfer';

async function testMayoristaSearch() {
    try {
        console.log('🧪 Testing Mayorista Search Functionality...\n');

        // 1. Probar búsqueda de mayoristas
        console.log('1. Testing mayorista search...');
        const searchResult = await getMayoristaOrdersForTable({
            page: 1,
            pageSize: 5,
            search: 'test',
        });

        if (searchResult.success) {
            console.log(`✅ Search successful. Found ${searchResult.total} mayoristas`);
            if (searchResult.orders.length > 0) {
                console.log('📋 Sample mayorista data:');
                const sample = searchResult.orders[0];
                console.log(`   - Name: ${sample.user.name} ${sample.user.lastName}`);
                console.log(`   - Email: ${sample.user.email}`);
                console.log(`   - Phone: ${sample.address.phone}`);
                console.log(`   - City: ${sample.address.city}`);
            }
        } else {
            console.log('❌ Search failed:', searchResult.error);
        }

        // 2. Probar creación de mayorista de prueba
        console.log('\n2. Testing mayorista creation...');
        const testMayoristaData = {
            status: 'pending' as const,
            total: 1000,
            subTotal: 900,
            shippingPrice: 100,
            notes: 'Test mayorista',
            notesOwn: 'Test interno',
            paymentMethod: 'transfer',
            orderType: 'mayorista' as const,
            address: {
                address: 'Calle Test 123',
                city: 'Ciudad Test',
                phone: '123456789',
                betweenStreets: 'Entre A y B',
                floorNumber: '1',
                departmentNumber: 'A',
            },
            user: {
                name: 'Juan',
                lastName: 'Test',
                email: 'juan.test@example.com',
            },
            items: [{
                id: 'TEST-PRODUCT',
                name: 'Producto Test',
                description: 'Descripción de prueba',
                images: [],
                options: [{
                    name: '5KG',
                    price: 100,
                    quantity: 1,
                }],
                price: 100,
                salesCount: 0,
                discountApllied: 0,
            }],
            deliveryArea: {
                _id: 'test-area',
                description: 'Área de prueba',
                coordinates: [[-34.6037, -58.3816]],
                schedule: 'Lunes a Viernes 9-18',
                orderCutOffHour: 18,
                enabled: true,
                sameDayDelivery: false,
                sameDayDeliveryDays: ['monday', 'tuesday'],
                whatsappNumber: '123456789',
                sheetName: 'test-sheet',
            },
            deliveryDay: new Date().toISOString(),
        };

        const createResult = await createMayoristaOrder(testMayoristaData);

        if (createResult.success) {
            console.log('✅ Test mayorista created successfully');
            console.log(`   - ID: ${createResult.order?._id}`);
        } else {
            console.log('❌ Failed to create test mayorista:', createResult.error);
        }

        // 3. Probar búsqueda del mayorista creado
        console.log('\n3. Testing search for created mayorista...');
        const searchCreatedResult = await getMayoristaOrdersForTable({
            page: 1,
            pageSize: 10,
            search: 'Juan Test',
        });

        if (searchCreatedResult.success) {
            const found = searchCreatedResult.orders.find(
                m => m.user.name === 'Juan' && m.user.lastName === 'Test'
            );

            if (found) {
                console.log('✅ Created mayorista found in search');
                console.log(`   - Email: ${found.user.email}`);
                console.log(`   - Phone: ${found.address.phone}`);
            } else {
                console.log('❌ Created mayorista not found in search');
            }
        }

        console.log('\n🎉 Test completed successfully!');

    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    testMayoristaSearch()
        .then(() => {
            console.log('Script completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Script failed:', error);
            process.exit(1);
        });
}

export { testMayoristaSearch };
