import { MongoClient } from 'mongodb';

const MONGO_URI = process.env.MONGODB_URI;

if (!MONGO_URI) {
    console.error('❌ MONGODB_URI no está definido en las variables de entorno');
    process.exit(1);
}

// Template hardcodeado actual (el mismo que estaba en initializePricesForPeriod)
const hardcodedTemplate = [
    // PERRO
    { section: 'PERRO', product: 'BIG DOG POLLO', weight: '15KG', priceTypes: ['EFECTIVO', 'TRANSFERENCIA', 'MAYORISTA'] },
    { section: 'PERRO', product: 'BIG DOG VACA', weight: '15KG', priceTypes: ['EFECTIVO', 'TRANSFERENCIA', 'MAYORISTA'] },
    { section: 'PERRO', product: 'VACA', weight: '10KG', priceTypes: ['EFECTIVO', 'TRANSFERENCIA', 'MAYORISTA'] },
    { section: 'PERRO', product: 'VACA', weight: '5KG', priceTypes: ['EFECTIVO', 'TRANSFERENCIA', 'MAYORISTA'] },
    { section: 'PERRO', product: 'CERDO', weight: '10KG', priceTypes: ['EFECTIVO', 'TRANSFERENCIA', 'MAYORISTA'] },
    { section: 'PERRO', product: 'CERDO', weight: '5KG', priceTypes: ['EFECTIVO', 'TRANSFERENCIA', 'MAYORISTA'] },
    { section: 'PERRO', product: 'CORDERO', weight: '10KG', priceTypes: ['EFECTIVO', 'TRANSFERENCIA', 'MAYORISTA'] },
    { section: 'PERRO', product: 'CORDERO', weight: '5KG', priceTypes: ['EFECTIVO', 'TRANSFERENCIA', 'MAYORISTA'] },
    { section: 'PERRO', product: 'POLLO', weight: '10KG', priceTypes: ['EFECTIVO', 'TRANSFERENCIA', 'MAYORISTA'] },
    { section: 'PERRO', product: 'POLLO', weight: '5KG', priceTypes: ['EFECTIVO', 'TRANSFERENCIA', 'MAYORISTA'] },

    // GATO
    { section: 'GATO', product: 'VACA', weight: '5KG', priceTypes: ['EFECTIVO', 'TRANSFERENCIA', 'MAYORISTA'] },
    { section: 'GATO', product: 'CORDERO', weight: '5KG', priceTypes: ['EFECTIVO', 'TRANSFERENCIA', 'MAYORISTA'] },
    { section: 'GATO', product: 'POLLO', weight: '5KG', priceTypes: ['EFECTIVO', 'TRANSFERENCIA', 'MAYORISTA'] },

    // OTROS
    { section: 'OTROS', product: 'HUESOS CARNOSOS 5KG', weight: null, priceTypes: ['EFECTIVO', 'TRANSFERENCIA', 'MAYORISTA'] },
    { section: 'OTROS', product: 'BOX DE COMPLEMENTOS', weight: null, priceTypes: ['EFECTIVO', 'TRANSFERENCIA', 'MAYORISTA'] },
    { section: 'OTROS', product: 'GARRAS', weight: null, priceTypes: ['MAYORISTA'] },
    { section: 'OTROS', product: 'CORNALITOS', weight: '200GRS', priceTypes: ['MAYORISTA'] },
    { section: 'OTROS', product: 'HUESOS RECREATIVOS', weight: null, priceTypes: ['MAYORISTA'] },
    { section: 'OTROS', product: 'CALDO DE HUESOS', weight: null, priceTypes: ['MAYORISTA'] },

    // RAW
    { section: 'RAW', product: 'HIGADO 100GRS', weight: null, priceTypes: ['MAYORISTA'] },
    { section: 'RAW', product: 'HIGADO 40GRS', weight: null, priceTypes: ['MAYORISTA'] },
    { section: 'RAW', product: 'POLLO 100GRS', weight: null, priceTypes: ['MAYORISTA'] },
    { section: 'RAW', product: 'POLLO 40GRS', weight: null, priceTypes: ['MAYORISTA'] },
    { section: 'RAW', product: 'CORNALITOS 30GRS', weight: null, priceTypes: ['MAYORISTA'] },
    { section: 'RAW', product: 'TRAQUEA X1', weight: null, priceTypes: ['MAYORISTA'] },
    { section: 'RAW', product: 'TRAQUEA X2', weight: null, priceTypes: ['MAYORISTA'] },
    { section: 'RAW', product: 'OREJA X1', weight: null, priceTypes: ['MAYORISTA'] },
    { section: 'RAW', product: 'OREJA X50', weight: null, priceTypes: ['MAYORISTA'] },
    { section: 'RAW', product: 'OREJAS X100', weight: null, priceTypes: ['MAYORISTA'] },
];

async function migrateTemplateToDb() {
    const client = new MongoClient(MONGO_URI);

    try {
        console.log('🔌 Conectando a MongoDB...');
        await client.connect();
        console.log('✅ Conectado a MongoDB');

        const db = client.db('barfer');
        const collection = db.collection('template_prices_products');

        // Verificar si ya existen documentos
        const existingCount = await collection.countDocuments();
        
        if (existingCount > 0) {
            console.log(`⚠️  Ya existen ${existingCount} documentos en template_prices_products`);
            console.log('¿Deseas eliminarlos y recrear el template? (Ctrl+C para cancelar)');
            
            // Esperar 3 segundos antes de continuar
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            console.log('🗑️  Eliminando documentos existentes...');
            await collection.deleteMany({});
            console.log('✅ Documentos eliminados');
        }

        // Preparar documentos para insertar
        const now = new Date().toISOString();
        const documentsToInsert = hardcodedTemplate.map(item => ({
            section: item.section,
            product: item.product,
            weight: item.weight,
            priceTypes: item.priceTypes,
            createdAt: now,
            updatedAt: now
        }));

        console.log(`📝 Insertando ${documentsToInsert.length} productos en el template...`);
        const result = await collection.insertMany(documentsToInsert);
        
        console.log(`✅ Migración completada: ${result.insertedCount} productos insertados`);
        
        // Mostrar resumen por sección
        const sections = ['PERRO', 'GATO', 'OTROS', 'RAW'];
        console.log('\n📊 Resumen por sección:');
        for (const section of sections) {
            const count = await collection.countDocuments({ section });
            console.log(`   ${section}: ${count} productos`);
        }

    } catch (error) {
        console.error('❌ Error durante la migración:', error);
        process.exit(1);
    } finally {
        await client.close();
        console.log('\n🔌 Conexión cerrada');
    }
}

// Ejecutar migración
migrateTemplateToDb();
