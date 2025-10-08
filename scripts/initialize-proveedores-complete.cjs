const { MongoClient } = require('mongodb');

// Configuración de MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/barfer';
const DB_NAME = 'barfer';

async function initializeProveedoresComplete() {
    const client = new MongoClient(MONGODB_URI);
    
    try {
        await client.connect();
        console.log('✅ Conectado a MongoDB');
        
        const db = client.db(DB_NAME);
        
        // 1. Inicializar categorías de proveedores
        console.log('\n📂 Inicializando categorías de proveedores...');
        const categoriasCollection = db.collection('categorias_proveedores');
        
        const existingCategorias = await categoriasCollection.countDocuments();
        if (existingCategorias === 0) {
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
            
            await categoriasCollection.insertMany(categoriasDefault);
            console.log(`✅ ${categoriasDefault.length} categorías de proveedores creadas`);
        } else {
            console.log(`ℹ️  ${existingCategorias} categorías de proveedores ya existen`);
        }
        
        // 2. Verificar métodos de pago
        console.log('\n💳 Verificando métodos de pago...');
        const metodosPagoCollection = db.collection('metodos_pago');
        const existingMetodosPago = await metodosPagoCollection.countDocuments();
        
        if (existingMetodosPago === 0) {
            console.log('⚠️  No hay métodos de pago. Ejecuta primero initialize-metodos-pago.cjs');
            return;
        } else {
            console.log(`ℹ️  ${existingMetodosPago} métodos de pago encontrados`);
        }
        
        // 3. Inicializar proveedores
        console.log('\n🏢 Inicializando proveedores...');
        const proveedoresCollection = db.collection('proveedores');
        
        const existingProveedores = await proveedoresCollection.countDocuments();
        if (existingProveedores === 0) {
            // Obtener categorías y métodos de pago
            const categorias = await categoriasCollection.find({ isActive: true }).toArray();
            const metodosPago = await metodosPagoCollection.find({ isActive: true }).toArray();
            
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
            
            const result = await proveedoresCollection.insertMany(proveedoresDefault);
            console.log(`✅ ${result.insertedCount} proveedores creados:`);
            
            proveedoresDefault.forEach((proveedor, index) => {
                const categoria = categorias.find(c => c._id.equals(proveedor.categoriaId));
                const metodoPago = metodosPago.find(m => m._id.equals(proveedor.metodoPagoId));
                console.log(`   ${index + 1}. ${proveedor.nombre} - ${categoria?.nombre || 'Sin categoría'} - ${metodoPago?.nombre || 'Sin método'}`);
            });
        } else {
            console.log(`ℹ️  ${existingProveedores} proveedores ya existen`);
        }
        
    } catch (error) {
        console.error('❌ Error al inicializar proveedores:', error);
        process.exit(1);
    } finally {
        await client.close();
        console.log('\n🔌 Conexión cerrada');
    }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    initializeProveedoresComplete()
        .then(() => {
            console.log('\n🎉 Inicialización completa de proveedores finalizada');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Error en la inicialización:', error);
            process.exit(1);
        });
}

module.exports = { initializeProveedoresComplete };
