const { MongoClient } = require('mongodb');

// Configuración de MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/barfer';
const DB_NAME = 'barfer';

async function initializeProveedores() {
    const client = new MongoClient(MONGODB_URI);
    
    try {
        await client.connect();
        console.log('✅ Conectado a MongoDB');
        
        const db = client.db(DB_NAME);
        const proveedoresCollection = db.collection('proveedores');
        const categoriasCollection = db.collection('categorias_proveedores');
        const metodosPagoCollection = db.collection('metodos_pago');
        
        // Verificar si ya existen proveedores
        const existingCount = await proveedoresCollection.countDocuments();
        console.log(`📊 Proveedores existentes: ${existingCount}`);
        
        if (existingCount > 0) {
            console.log('ℹ️  Los proveedores ya existen. Saltando inicialización.');
            return;
        }
        
        // Obtener categorías y métodos de pago existentes
        const categorias = await categoriasCollection.find({ isActive: true }).toArray();
        const metodosPago = await metodosPagoCollection.find({ isActive: true }).toArray();
        
        if (categorias.length === 0) {
            console.log('⚠️  No hay categorías de proveedores. Ejecuta primero initialize-categorias-proveedores.cjs');
            return;
        }
        
        if (metodosPago.length === 0) {
            console.log('⚠️  No hay métodos de pago. Ejecuta primero initialize-metodos-pago.cjs');
            return;
        }
        
        // Proveedores por defecto
        const proveedoresDefault = [
            { 
                nombre: 'Distribuidora ABC',
                marca: 'BARFER',
                tipoProveedor: 'Alimentos',
                telefono: '221 123-4567',
                personaContacto: 'Juan Pérez',
                pagoTipo: 'BLANCO',
                categoriaId: categorias.find(c => c.nombre === 'Alimentos')?._id,
                metodoPagoId: metodosPago.find(m => m.nombre === 'EFECTIVO')?._id,
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            { 
                nombre: 'Insumos Veterinarios SA',
                marca: 'BARFER',
                tipoProveedor: 'Insumos',
                telefono: '221 987-6543',
                personaContacto: 'María García',
                pagoTipo: 'NEGRO',
                categoriaId: categorias.find(c => c.nombre === 'Equipos')?._id,
                metodoPagoId: metodosPago.find(m => m.nombre === 'TRANSFERENCIA')?._id,
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            { 
                nombre: 'Servicios de Limpieza Pro',
                marca: 'BARFER',
                tipoProveedor: 'Servicios',
                telefono: '221 555-0123',
                personaContacto: 'Carlos López',
                pagoTipo: 'BLANCO',
                categoriaId: categorias.find(c => c.nombre === 'Servicios')?._id,
                metodoPagoId: metodosPago.find(m => m.nombre === 'EFECTIVO')?._id,
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            { 
                nombre: 'Productos de Limpieza Clean',
                marca: 'BARFER',
                tipoProveedor: 'Limpieza',
                telefono: '221 444-7890',
                personaContacto: 'Ana Martínez',
                pagoTipo: 'BLANCO',
                categoriaId: categorias.find(c => c.nombre === 'Limpieza')?._id,
                metodoPagoId: metodosPago.find(m => m.nombre === 'EFECTIVO')?._id,
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ];
        
        // Insertar proveedores
        const result = await proveedoresCollection.insertMany(proveedoresDefault);
        console.log(`✅ ${result.insertedCount} proveedores creados:`);
        
        proveedoresDefault.forEach((proveedor, index) => {
            const categoria = categorias.find(c => c._id.equals(proveedor.categoriaId));
            const metodoPago = metodosPago.find(m => m._id.equals(proveedor.metodoPagoId));
            console.log(`   ${index + 1}. ${proveedor.nombre} - ${categoria?.nombre || 'Sin categoría'} - ${metodoPago?.nombre || 'Sin método'}`);
        });
        
    } catch (error) {
        console.error('❌ Error al inicializar proveedores:', error);
        process.exit(1);
    } finally {
        await client.close();
        console.log('🔌 Conexión cerrada');
    }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    initializeProveedores()
        .then(() => {
            console.log('🎉 Inicialización completada');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Error en la inicialización:', error);
            process.exit(1);
        });
}

module.exports = { initializeProveedores };
