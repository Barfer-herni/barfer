const { MongoClient } = require('mongodb');

// Configuración de MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/barfer';
const DB_NAME = 'barfer';

async function initializeCategoriasProveedores() {
    const client = new MongoClient(MONGODB_URI);
    
    try {
        await client.connect();
        console.log('✅ Conectado a MongoDB');
        
        const db = client.db(DB_NAME);
        const collection = db.collection('categorias_proveedores');
        
        // Verificar si ya existen categorías
        const existingCount = await collection.countDocuments();
        console.log(`📊 Categorías existentes: ${existingCount}`);
        
        if (existingCount > 0) {
            console.log('ℹ️  Las categorías de proveedores ya existen. Saltando inicialización.');
            return;
        }
        
        // Categorías por defecto
        const categoriasDefault = [
            { 
                nombre: 'Alimentos', 
                descripcion: 'Proveedores de alimentos y bebidas',
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            { 
                nombre: 'Limpieza', 
                descripcion: 'Productos de limpieza y aseo',
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            { 
                nombre: 'Equipos', 
                descripcion: 'Equipos y maquinaria',
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            { 
                nombre: 'Servicios', 
                descripcion: 'Servicios varios',
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            { 
                nombre: 'Otros', 
                descripcion: 'Otras categorías',
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ];
        
        // Insertar categorías
        const result = await collection.insertMany(categoriasDefault);
        console.log(`✅ ${result.insertedCount} categorías de proveedores creadas:`);
        
        categoriasDefault.forEach((categoria, index) => {
            console.log(`   ${index + 1}. ${categoria.nombre} - ${categoria.descripcion}`);
        });
        
    } catch (error) {
        console.error('❌ Error al inicializar categorías de proveedores:', error);
        process.exit(1);
    } finally {
        await client.close();
        console.log('🔌 Conexión cerrada');
    }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    initializeCategoriasProveedores()
        .then(() => {
            console.log('🎉 Inicialización completada');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Error en la inicialización:', error);
            process.exit(1);
        });
}

module.exports = { initializeCategoriasProveedores };
