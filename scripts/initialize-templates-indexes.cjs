/**
 * Script para crear índices en las colecciones de templates y campañas
 * Ejecutar: node scripts/initialize-templates-indexes.cjs
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('❌ Error: MONGODB_URI no está definida en las variables de entorno');
    process.exit(1);
}

async function createIndexes() {
    const client = new MongoClient(MONGODB_URI);

    try {
        await client.connect();
        console.log('✅ Conectado a MongoDB');

        const db = client.db();

        // ==========================================
        // EMAIL TEMPLATES
        // ==========================================
        console.log('\n📧 Creando índices para email_templates...');
        const emailTemplatesCollection = db.collection('email_templates');
        
        await emailTemplatesCollection.createIndex({ createdBy: 1 });
        console.log('  ✓ Índice creado: createdBy');
        
        await emailTemplatesCollection.createIndex({ isDefault: 1 });
        console.log('  ✓ Índice creado: isDefault');
        
        await emailTemplatesCollection.createIndex({ createdAt: -1 });
        console.log('  ✓ Índice creado: createdAt (descendente)');

        // ==========================================
        // WHATSAPP TEMPLATES
        // ==========================================
        console.log('\n💬 Creando índices para whatsapp_templates...');
        const whatsappTemplatesCollection = db.collection('whatsapp_templates');
        
        await whatsappTemplatesCollection.createIndex({ createdBy: 1 });
        console.log('  ✓ Índice creado: createdBy');
        
        await whatsappTemplatesCollection.createIndex({ isDefault: 1 });
        console.log('  ✓ Índice creado: isDefault');
        
        await whatsappTemplatesCollection.createIndex({ createdAt: -1 });
        console.log('  ✓ Índice creado: createdAt (descendente)');

        // ==========================================
        // SCHEDULED EMAIL CAMPAIGNS
        // ==========================================
        console.log('\n📅 Creando índices para scheduled_email_campaigns...');
        const emailCampaignsCollection = db.collection('scheduled_email_campaigns');
        
        await emailCampaignsCollection.createIndex({ userId: 1 });
        console.log('  ✓ Índice creado: userId');
        
        await emailCampaignsCollection.createIndex({ status: 1 });
        console.log('  ✓ Índice creado: status');
        
        await emailCampaignsCollection.createIndex({ emailTemplateId: 1 });
        console.log('  ✓ Índice creado: emailTemplateId');
        
        await emailCampaignsCollection.createIndex({ nextRun: 1 });
        console.log('  ✓ Índice creado: nextRun');
        
        // Índice compuesto para queries comunes
        await emailCampaignsCollection.createIndex({ status: 1, nextRun: 1 });
        console.log('  ✓ Índice compuesto creado: status + nextRun');

        // ==========================================
        // SCHEDULED WHATSAPP CAMPAIGNS
        // ==========================================
        console.log('\n📅 Creando índices para scheduled_whatsapp_campaigns...');
        const whatsappCampaignsCollection = db.collection('scheduled_whatsapp_campaigns');
        
        await whatsappCampaignsCollection.createIndex({ userId: 1 });
        console.log('  ✓ Índice creado: userId');
        
        await whatsappCampaignsCollection.createIndex({ status: 1 });
        console.log('  ✓ Índice creado: status');
        
        await whatsappCampaignsCollection.createIndex({ whatsappTemplateId: 1 });
        console.log('  ✓ Índice creado: whatsappTemplateId');
        
        await whatsappCampaignsCollection.createIndex({ nextRun: 1 });
        console.log('  ✓ Índice creado: nextRun');
        
        // Índice compuesto para queries comunes
        await whatsappCampaignsCollection.createIndex({ status: 1, nextRun: 1 });
        console.log('  ✓ Índice compuesto creado: status + nextRun');

        console.log('\n✅ Todos los índices creados exitosamente');

        // Mostrar información de las colecciones
        console.log('\n📊 Información de colecciones:');
        const collections = [
            'email_templates',
            'whatsapp_templates',
            'scheduled_email_campaigns',
            'scheduled_whatsapp_campaigns'
        ];

        for (const collectionName of collections) {
            const collection = db.collection(collectionName);
            const count = await collection.countDocuments();
            const indexes = await collection.indexes();
            console.log(`\n${collectionName}:`);
            console.log(`  Documentos: ${count}`);
            console.log(`  Índices: ${indexes.length}`);
            indexes.forEach(index => {
                const keys = Object.keys(index.key).join(', ');
                console.log(`    - ${index.name}: ${keys}`);
            });
        }

    } catch (error) {
        console.error('❌ Error al crear índices:', error);
        process.exit(1);
    } finally {
        await client.close();
        console.log('\n👋 Conexión cerrada');
    }
}

// Ejecutar
createIndexes()
    .then(() => {
        console.log('\n🎉 Script completado exitosamente');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Error fatal:', error);
        process.exit(1);
    });

