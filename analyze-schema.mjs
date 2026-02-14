import { getCollection } from '@repo/database';

async function analyzeSchema() {
    try {
        console.log('🔍 Analizando esquema de la colección prices...\n');
        
        const pricesCollection = await getCollection('prices');
        
        // Contar documentos con month/year vs sin month/year
        const totalDocs = await pricesCollection.countDocuments({});
        const docsWithMonth = await pricesCollection.countDocuments({ month: { $exists: true } });
        const docsWithYear = await pricesCollection.countDocuments({ year: { $exists: true } });
        const docsWithValidFrom = await pricesCollection.countDocuments({ validFrom: { $exists: true } });
        
        console.log('📊 Estadísticas de campos:');
        console.log(`   Total de documentos: ${totalDocs}`);
        console.log(`   Con campo 'month': ${docsWithMonth}`);
        console.log(`   Con campo 'year': ${docsWithYear}`);
        console.log(`   Con campo 'validFrom': ${docsWithValidFrom}`);
        console.log('');
        
        // Obtener un documento con month/year
        console.log('📝 Ejemplo de documento CON month/year:');
        const docWithMonth = await pricesCollection.findOne({ month: { $exists: true } });
        if (docWithMonth) {
            console.log(JSON.stringify({
                _id: docWithMonth._id,
                section: docWithMonth.section,
                product: docWithMonth.product,
                month: docWithMonth.month,
                year: docWithMonth.year,
                validFrom: docWithMonth.validFrom,
                effectiveDate: docWithMonth.effectiveDate,
                createdAt: docWithMonth.createdAt
            }, null, 2));
        } else {
            console.log('   No se encontraron documentos con month/year');
        }
        console.log('');
        
        // Obtener un documento sin month/year
        console.log('📝 Ejemplo de documento SIN month/year:');
        const docWithoutMonth = await pricesCollection.findOne({ month: { $exists: false } });
        if (docWithoutMonth) {
            console.log(JSON.stringify({
                _id: docWithoutMonth._id,
                section: docWithoutMonth.section,
                product: docWithoutMonth.product,
                month: docWithoutMonth.month,
                year: docWithoutMonth.year,
                validFrom: docWithoutMonth.validFrom,
                effectiveDate: docWithoutMonth.effectiveDate,
                createdAt: docWithoutMonth.createdAt
            }, null, 2));
        } else {
            console.log('   Todos los documentos tienen month/year');
        }
        console.log('');
        
        // Ver distribución por año si existe
        if (docsWithYear > 0) {
            console.log('📅 Distribución por año:');
            const yearDistribution = await pricesCollection.aggregate([
                { $match: { year: { $exists: true } } },
                { $group: { _id: '$year', count: { $sum: 1 } } },
                { $sort: { _id: -1 } }
            ]).toArray();
            
            yearDistribution.forEach(item => {
                console.log(`   ${item._id}: ${item.count} documentos`);
            });
        }
        
        console.log('\n✅ Análisis completado');
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

analyzeSchema();
