import { getCollection } from '@repo/database';

async function migrateMayoristaData() {
    try {
        console.log('🔄 Starting mayorista data migration...\n');

        const collection = await getCollection('mayoristas');

        // Obtener todos los registros existentes
        console.log('📊 Getting existing mayorista records...');
        const existingData = await collection.find({}).toArray();

        if (existingData.length === 0) {
            console.log('✅ No existing data to migrate. Collection is empty or new.');
            return;
        }

        console.log(`📋 Found ${existingData.length} existing records to migrate\n`);

        let migratedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;

        for (const record of existingData) {
            try {
                // Verificar si el registro ya tiene la nueva estructura
                if (record.user && record.address && !record.orderType) {
                    console.log(`⏭️  Skipping record ${record._id} - already in new format`);
                    skippedCount++;
                    continue;
                }

                // Extraer solo datos personales
                const personalData = {
                    user: record.user || {},
                    address: record.address || {},
                    createdAt: record.createdAt || new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };

                // Validar que tengamos los datos mínimos necesarios
                if (!personalData.user.name || !personalData.user.lastName) {
                    console.log(`⚠️  Skipping record ${record._id} - missing required name data`);
                    skippedCount++;
                    continue;
                }

                // Actualizar el registro
                const result = await collection.updateOne(
                    { _id: record._id },
                    { $set: personalData }
                );

                if (result.modifiedCount > 0) {
                    console.log(`✅ Migrated record ${record._id} - ${personalData.user.name} ${personalData.user.lastName}`);
                    migratedCount++;
                } else {
                    console.log(`⚠️  No changes made to record ${record._id}`);
                    skippedCount++;
                }

            } catch (error) {
                console.error(`❌ Error migrating record ${record._id}:`, error);
                errorCount++;
            }
        }

        console.log('\n📊 Migration Summary:');
        console.log(`   ✅ Successfully migrated: ${migratedCount}`);
        console.log(`   ⏭️  Skipped (already migrated): ${skippedCount}`);
        console.log(`   ❌ Errors: ${errorCount}`);
        console.log(`   📋 Total processed: ${existingData.length}`);

        if (errorCount > 0) {
            console.log('\n⚠️  Some records had errors during migration. Check the logs above.');
        } else {
            console.log('\n🎉 Migration completed successfully!');
        }

        // Verificar la nueva estructura
        console.log('\n🔍 Verifying new structure...');
        const sampleRecord = await collection.findOne({});

        if (sampleRecord) {
            const hasNewStructure = sampleRecord.user && sampleRecord.address && !sampleRecord.orderType;
            if (hasNewStructure) {
                console.log('✅ New structure verified successfully');
                console.log(`   Sample record: ${sampleRecord.user.name} ${sampleRecord.user.lastName}`);
            } else {
                console.log('❌ New structure verification failed');
            }
        }

    } catch (error) {
        console.error('❌ Migration failed with error:', error);
        throw error;
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    migrateMayoristaData().then(() => {
        console.log('\nScript completed');
        process.exit(0);
    }).catch((error) => {
        console.error('\nScript failed:', error);
        process.exit(1);
    });
}

export { migrateMayoristaData };
