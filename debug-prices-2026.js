// Script de diagnóstico para verificar precios de 2026
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

async function debugPrices() {
    const client = new MongoClient(process.env.MONGODB_URI);
    
    try {
        await client.connect();
        console.log('✅ Conectado a MongoDB');
        
        const db = client.db();
        const pricesCollection = db.collection('prices');
        
        // Verificar precios de enero y febrero 2026
        console.log('\n📊 Verificando precios de Enero 2026:');
        const enero2026 = await pricesCollection.find({ month: 1, year: 2026 }).toArray();
        console.log(`Total de precios encontrados: ${enero2026.length}`);
        
        if (enero2026.length > 0) {
            console.log('\nPrimeros 3 documentos:');
            enero2026.slice(0, 3).forEach((doc, i) => {
                console.log(`\n${i + 1}. ${doc.section} - ${doc.product} - ${doc.weight || 'sin peso'} - ${doc.priceType}`);
                console.log(`   Precio: $${doc.price}`);
                console.log(`   Fecha efectiva: ${doc.effectiveDate}`);
                console.log(`   Activo: ${doc.isActive}`);
                console.log(`   Creado: ${doc.createdAt}`);
            });
        }
        
        console.log('\n📊 Verificando precios de Febrero 2026:');
        const febrero2026 = await pricesCollection.find({ month: 2, year: 2026 }).toArray();
        console.log(`Total de precios encontrados: ${febrero2026.length}`);
        
        if (febrero2026.length > 0) {
            console.log('\nPrimeros 3 documentos:');
            febrero2026.slice(0, 3).forEach((doc, i) => {
                console.log(`\n${i + 1}. ${doc.section} - ${doc.product} - ${doc.weight || 'sin peso'} - ${doc.priceType}`);
                console.log(`   Precio: $${doc.price}`);
                console.log(`   Fecha efectiva: ${doc.effectiveDate}`);
                console.log(`   Activo: ${doc.isActive}`);
                console.log(`   Creado: ${doc.createdAt}`);
            });
        }
        
        // Verificar todos los años y meses disponibles
        console.log('\n📅 Todos los períodos con precios:');
        const periods = await pricesCollection.aggregate([
            {
                $group: {
                    _id: { year: '$year', month: '$month' },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { '_id.year': -1, '_id.month': -1 }
            }
        ]).toArray();
        
        periods.forEach(period => {
            console.log(`${period._id.year}-${String(period._id.month).padStart(2, '0')}: ${period.count} precios`);
        });
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await client.close();
        console.log('\n✅ Conexión cerrada');
    }
}

debugPrices();

