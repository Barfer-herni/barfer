import { getCollection } from '@repo/database';

async function createMayoristasCollection() {
    try {
        console.log('Creating mayoristas collection...');

        const collection = await getCollection('mayoristas');

        // Crear índices para optimizar las consultas de datos personales
        await collection.createIndex({ 'user.name': 1 });
        await collection.createIndex({ 'user.lastName': 1 });
        await collection.createIndex({ 'user.email': 1 });
        await collection.createIndex({ 'address.phone': 1 });
        await collection.createIndex({ createdAt: 1 });
        await collection.createIndex({ updatedAt: 1 });

        // Índice compuesto para búsqueda por nombre completo
        await collection.createIndex({ 'user.name': 1, 'user.lastName': 1 });

        console.log('✅ Mayoristas collection created successfully with indexes for personal data');

        // Verificar que la colección existe
        const collections = await collection.db.listCollections().toArray();
        const mayoristasExists = collections.some(col => col.name === 'mayoristas');

        if (mayoristasExists) {
            console.log('✅ Collection verification successful');
        } else {
            console.log('❌ Collection verification failed');
        }

    } catch (error) {
        console.error('❌ Error creating mayoristas collection:', error);
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    createMayoristasCollection().then(() => {
        console.log('Script completed');
        process.exit(0);
    }).catch((error) => {
        console.error('Script failed:', error);
        process.exit(1);
    });
}

export { createMayoristasCollection };
