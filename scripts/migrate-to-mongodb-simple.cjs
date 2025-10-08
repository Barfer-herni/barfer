#!/usr/bin/env node

/**
 * Script de migración de datos de Prisma (PostgreSQL) a MongoDB
 * 
 * Este script migra:
 * - Categorías
 * - Métodos de Pago
 * - Salidas
 * 
 * Uso: node scripts/migrate-to-mongodb-simple.js
 */

const { database } = require('../packages/database/index');
const { getCollection, ObjectId } = require('../packages/database/mongo-connection');

async function initializeCategoriasMongo() {
    try {
        const categoriasCollection = await getCollection('categorias');

        const categoriasPredefinidas = [
            'SUELDOS',
            'IMPUESTOS',
            'MANTENIMIENTO MAQUINARIA',
            'INSUMOS',
            'MATERIA PRIMA',
            'SERVICIOS',
            'FLETE',
            'LIMPIEZA',
            'ALQUILERES',
            'UTILES',
            'PUBLICIDAD',
            'MANTENIMIENTO EDILICIO',
            'OTROS',
            'CAJA CHICA',
            'VIATICOS',
            'VEHICULOS',
            'COMBUSTIBLE',
            'OFICINA',
            'FINANCIACION',
            'INVERSION EDILICIA',
            'INDUMENTARIA',
            'INVERSION PRODUCTO',
            'PRODUCTOS',
            'INVERSION TECNOLOGICA',
            'I&D'
        ];

        let created = 0;

        for (const nombre of categoriasPredefinidas) {
            const exists = await categoriasCollection.findOne({ nombre });

            if (!exists) {
                await categoriasCollection.insertOne({
                    nombre,
                    descripcion: null,
                    isActive: true,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
                created++;
            }
        }

        return {
            success: true,
            message: `Inicialización completada. ${created} categorías creadas.`,
            created
        };
    } catch (error) {
        console.error('Error in initializeCategoriasMongo:', error);
        return {
            success: false,
            message: 'Error al inicializar las categorías',
            error: 'INITIALIZE_CATEGORIAS_MONGO_ERROR'
        };
    }
}

async function initializeMetodosPagoMongo() {
    try {
        const metodosPagoCollection = await getCollection('metodos_pago');

        const metodosPagoPredefinidos = [
            'EFECTIVO',
            'TRANSFERENCIA',
            'TARJETA DEBITO',
            'TARJETA CREDITO',
            'MERCADO PAGO',
            'CHEQUE'
        ];

        let created = 0;

        for (const nombre of metodosPagoPredefinidos) {
            const exists = await metodosPagoCollection.findOne({ nombre });

            if (!exists) {
                await metodosPagoCollection.insertOne({
                    nombre,
                    descripcion: null,
                    isActive: true,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
                created++;
            }
        }

        return {
            success: true,
            message: `Inicialización completada. ${created} métodos de pago creados.`,
            created
        };
    } catch (error) {
        console.error('Error in initializeMetodosPagoMongo:', error);
        return {
            success: false,
            message: 'Error al inicializar los métodos de pago',
            error: 'INITIALIZE_METODOS_PAGO_MONGO_ERROR'
        };
    }
}

async function createCategoriaMongo(data) {
    try {
        const categoriasCollection = await getCollection('categorias');

        // Verificar si ya existe una categoría con ese nombre
        const existingCategoria = await categoriasCollection.findOne({
            nombre: data.nombre.toUpperCase()
        });

        if (existingCategoria) {
            return {
                success: false,
                message: 'Ya existe una categoría con ese nombre',
                error: 'CATEGORIA_ALREADY_EXISTS'
            };
        }

        const categoriaDoc = {
            nombre: data.nombre.toUpperCase(),
            descripcion: data.descripcion,
            isActive: data.isActive ?? true,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const result = await categoriasCollection.insertOne(categoriaDoc);

        const newCategoria = {
            _id: result.insertedId.toString(),
            nombre: categoriaDoc.nombre,
            descripcion: categoriaDoc.descripcion,
            isActive: categoriaDoc.isActive,
            createdAt: categoriaDoc.createdAt,
            updatedAt: categoriaDoc.updatedAt
        };

        return {
            success: true,
            categoria: newCategoria,
            message: 'Categoría creada exitosamente'
        };
    } catch (error) {
        console.error('Error in createCategoriaMongo:', error);
        return {
            success: false,
            message: 'Error al crear la categoría',
            error: 'CREATE_CATEGORIA_MONGO_ERROR'
        };
    }
}

async function createMetodoPagoMongo(data) {
    try {
        const metodosPagoCollection = await getCollection('metodos_pago');

        // Verificar si ya existe un método de pago con ese nombre
        const existingMetodoPago = await metodosPagoCollection.findOne({
            nombre: data.nombre.toUpperCase()
        });

        if (existingMetodoPago) {
            return {
                success: false,
                message: 'Ya existe un método de pago con ese nombre',
                error: 'METODO_PAGO_ALREADY_EXISTS'
            };
        }

        const metodoPagoDoc = {
            nombre: data.nombre.toUpperCase(),
            descripcion: data.descripcion,
            isActive: data.isActive ?? true,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const result = await metodosPagoCollection.insertOne(metodoPagoDoc);

        const newMetodoPago = {
            _id: result.insertedId.toString(),
            nombre: metodoPagoDoc.nombre,
            descripcion: metodoPagoDoc.descripcion,
            isActive: metodoPagoDoc.isActive,
            createdAt: metodoPagoDoc.createdAt,
            updatedAt: metodoPagoDoc.updatedAt
        };

        return {
            success: true,
            metodoPago: newMetodoPago,
            message: 'Método de pago creado exitosamente'
        };
    } catch (error) {
        console.error('Error in createMetodoPagoMongo:', error);
        return {
            success: false,
            message: 'Error al crear el método de pago',
            error: 'CREATE_METODO_PAGO_MONGO_ERROR'
        };
    }
}

async function createSalidaMongo(data) {
    try {
        const salidasCollection = await getCollection('salidas');

        // Construir documento para insertar
        const salidaDoc = {
            fecha: data.fecha,
            detalle: data.detalle,
            categoriaId: new ObjectId(data.categoriaId),
            tipo: data.tipo,
            monto: data.monto,
            metodoPagoId: new ObjectId(data.metodoPagoId),
            tipoRegistro: data.tipoRegistro,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        // Agregar campos opcionales
        if (data.marca !== undefined) salidaDoc.marca = data.marca;
        if (data.proveedorId !== undefined) salidaDoc.proveedorId = new ObjectId(data.proveedorId);
        if (data.fechaLlegaFactura !== undefined) salidaDoc.fechaLlegaFactura = data.fechaLlegaFactura;
        if (data.fechaPagoFactura !== undefined) salidaDoc.fechaPagoFactura = data.fechaPagoFactura;
        if (data.comprobanteNumber !== undefined) salidaDoc.comprobanteNumber = data.comprobanteNumber;

        const result = await salidasCollection.insertOne(salidaDoc);

        return {
            success: true,
            salida: { _id: result.insertedId.toString() },
            message: 'Salida creada exitosamente'
        };
    } catch (error) {
        console.error('Error in createSalidaMongo:', error);
        return {
            success: false,
            message: 'Error al crear la salida',
            error: 'CREATE_SALIDA_MONGO_ERROR'
        };
    }
}

async function migrateCategorias() {
    console.log('🔄 Migrando categorías...');
    
    try {
        // Obtener categorías de Prisma
        const prismaCategorias = await database.categoria.findMany();
        console.log(`📊 Encontradas ${prismaCategorias.length} categorías en Prisma`);

        // Inicializar categorías por defecto en MongoDB
        await initializeCategoriasMongo();

        // Migrar categorías existentes
        let migrated = 0;
        for (const categoria of prismaCategorias) {
            try {
                const result = await createCategoriaMongo({
                    nombre: categoria.nombre,
                    descripcion: categoria.descripcion,
                    isActive: categoria.isActive
                });

                if (result.success) {
                    migrated++;
                    console.log(`✅ Categoría migrada: ${categoria.nombre}`);
                } else {
                    console.log(`⚠️  Categoría ya existe: ${categoria.nombre}`);
                }
            } catch (error) {
                console.error(`❌ Error migrando categoría ${categoria.nombre}:`, error);
            }
        }

        console.log(`✅ Migración de categorías completada: ${migrated} migradas`);
        return { success: true, migrated };
    } catch (error) {
        console.error('❌ Error en migración de categorías:', error);
        return { success: false, error };
    }
}

async function migrateMetodosPago() {
    console.log('🔄 Migrando métodos de pago...');
    
    try {
        // Obtener métodos de pago de Prisma
        const prismaMetodosPago = await database.metodoPago.findMany();
        console.log(`📊 Encontrados ${prismaMetodosPago.length} métodos de pago en Prisma`);

        // Inicializar métodos de pago por defecto en MongoDB
        await initializeMetodosPagoMongo();

        // Migrar métodos de pago existentes
        let migrated = 0;
        for (const metodoPago of prismaMetodosPago) {
            try {
                const result = await createMetodoPagoMongo({
                    nombre: metodoPago.nombre,
                    descripcion: metodoPago.descripcion,
                    isActive: metodoPago.isActive
                });

                if (result.success) {
                    migrated++;
                    console.log(`✅ Método de pago migrado: ${metodoPago.nombre}`);
                } else {
                    console.log(`⚠️  Método de pago ya existe: ${metodoPago.nombre}`);
                }
            } catch (error) {
                console.error(`❌ Error migrando método de pago ${metodoPago.nombre}:`, error);
            }
        }

        console.log(`✅ Migración de métodos de pago completada: ${migrated} migrados`);
        return { success: true, migrated };
    } catch (error) {
        console.error('❌ Error en migración de métodos de pago:', error);
        return { success: false, error };
    }
}

async function migrateSalidas() {
    console.log('🔄 Migrando salidas...');
    
    try {
        // Obtener salidas de Prisma con relaciones
        const prismaSalidas = await database.salida.findMany({
            include: {
                categoria: true,
                metodoPago: true
            }
        });
        console.log(`📊 Encontradas ${prismaSalidas.length} salidas en Prisma`);

        // Obtener mapeo de IDs de Prisma a MongoDB
        const categoriasCollection = await getCollection('categorias');
        const metodosPagoCollection = await getCollection('metodos_pago');

        const categoriasMap = new Map();
        const metodosPagoMap = new Map();

        // Mapear categorías
        const mongoCategorias = await categoriasCollection.find({}).toArray();
        for (const mongoCat of mongoCategorias) {
            const prismaCat = await database.categoria.findFirst({
                where: { nombre: mongoCat.nombre }
            });
            if (prismaCat) {
                categoriasMap.set(prismaCat.id, mongoCat._id.toString());
            }
        }

        // Mapear métodos de pago
        const mongoMetodosPago = await metodosPagoCollection.find({}).toArray();
        for (const mongoMetodo of mongoMetodosPago) {
            const prismaMetodo = await database.metodoPago.findFirst({
                where: { nombre: mongoMetodo.nombre }
            });
            if (prismaMetodo) {
                metodosPagoMap.set(prismaMetodo.id, mongoMetodo._id.toString());
            }
        }

        // Migrar salidas
        let migrated = 0;
        for (const salida of prismaSalidas) {
            try {
                const mongoCategoriaId = categoriasMap.get(salida.categoriaId);
                const mongoMetodoPagoId = metodosPagoMap.get(salida.metodoPagoId);

                if (!mongoCategoriaId || !mongoMetodoPagoId) {
                    console.log(`⚠️  Saltando salida ${salida.id}: categoría o método de pago no encontrado`);
                    continue;
                }

                const result = await createSalidaMongo({
                    fecha: salida.fecha,
                    detalle: salida.detalle,
                    categoriaId: mongoCategoriaId,
                    tipo: salida.tipo,
                    marca: salida.marca,
                    monto: salida.monto,
                    metodoPagoId: mongoMetodoPagoId,
                    tipoRegistro: salida.tipoRegistro,
                    // Agregar campos nuevos si existen
                    fechaLlegaFactura: salida.fechaLlegaFactura,
                    fechaPagoFactura: salida.fechaPagoFactura,
                    comprobanteNumber: salida.comprobanteNumber
                });

                if (result.success) {
                    migrated++;
                    console.log(`✅ Salida migrada: ${salida.detalle.substring(0, 50)}...`);
                } else {
                    console.log(`❌ Error migrando salida: ${result.message}`);
                }
            } catch (error) {
                console.error(`❌ Error migrando salida ${salida.id}:`, error);
            }
        }

        console.log(`✅ Migración de salidas completada: ${migrated} migradas`);
        return { success: true, migrated };
    } catch (error) {
        console.error('❌ Error en migración de salidas:', error);
        return { success: false, error };
    }
}

async function main() {
    console.log('🚀 Iniciando migración de Prisma a MongoDB...\n');

    try {
        // Migrar categorías
        const categoriasResult = await migrateCategorias();
        if (!categoriasResult.success) {
            throw new Error('Falló migración de categorías');
        }

        console.log('');

        // Migrar métodos de pago
        const metodosPagoResult = await migrateMetodosPago();
        if (!metodosPagoResult.success) {
            throw new Error('Falló migración de métodos de pago');
        }

        console.log('');

        // Migrar salidas
        const salidasResult = await migrateSalidas();
        if (!salidasResult.success) {
            throw new Error('Falló migración de salidas');
        }

        console.log('\n🎉 Migración completada exitosamente!');
        console.log(`📊 Resumen:`);
        console.log(`   - Categorías: ${categoriasResult.migrated} migradas`);
        console.log(`   - Métodos de pago: ${metodosPagoResult.migrated} migrados`);
        console.log(`   - Salidas: ${salidasResult.migrated} migradas`);

    } catch (error) {
        console.error('❌ Error en la migración:', error);
        process.exit(1);
    } finally {
        // Cerrar conexiones
        await database.$disconnect();
        process.exit(0);
    }
}

// Ejecutar migración
if (require.main === module) {
    main().catch(console.error);
}
