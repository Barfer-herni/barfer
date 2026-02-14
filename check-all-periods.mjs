import { getCollection } from '@repo/database';

async function checkAllPeriods() {
    try {
        console.log('🔍 Verificando todos los períodos con precios...\n');
        
        const pricesCollection = await getCollection('prices');
        
        // Obtener todos los períodos únicos
        const periods = await pricesCollection.aggregate([
            {
                $group: {
                    _id: { year: '$year', month: '$month' },
                    count: { $sum: 1 },
                    minCreatedAt: { $min: '$createdAt' },
                    maxCreatedAt: { $max: '$createdAt' }
                }
            },
            {
                $sort: { '_id.year': -1, '_id.month': -1 }
            }
        ]).toArray();
        
        console.log(`📅 Total de períodos encontrados: ${periods.length}\n`);
        
        const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        
        periods.forEach(period => {
            const monthName = monthNames[period._id.month - 1];
            console.log(`${period._id.year}-${String(period._id.month).padStart(2, '0')} (${monthName}): ${period.count} precios`);
            console.log(`   Creado entre: ${period.minCreatedAt} y ${period.maxCreatedAt}\n`);
        });
        
        // Verificar específicamente enero y febrero 2026
        console.log('\n🔎 Detalle de Enero y Febrero 2026:\n');
        
        for (const month of [1, 2]) {
            const monthName = monthNames[month - 1];
            const prices = await pricesCollection.find({ month, year: 2026 }).limit(5).toArray();
            
            console.log(`${monthName} 2026: ${prices.length > 0 ? prices.length + ' precios encontrados' : 'Sin datos'}`);
            if (prices.length > 0) {
                console.log(`   Primer precio creado: ${prices[0].createdAt}`);
                console.log(`   Productos: ${prices.map(p => `${p.section}-${p.product}`).join(', ').substring(0, 100)}...`);
            }
            console.log('');
        }
        
        console.log('✅ Verificación completada');
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

checkAllPeriods();
