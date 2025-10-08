#!/usr/bin/env node

/**
 * Script para inicializar las colecciones de MongoDB con datos por defecto
 * 
 * Uso: node scripts/initialize-mongodb-collections.cjs
 */

const { getCollection } = require('../packages/database/mongo-connection');

async function initializeCategorias() {
    console.log('🔄 Inicializando categorías...');
    
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
                console.log(`✅ Categoría creada: ${nombre}`);
            } else {
                console.log(`⚠️  Categoría ya existe: ${nombre}`);
            }
        }

        console.log(`✅ Inicialización de categorías completada: ${created} creadas`);
        return { success: true, created };
    } catch (error) {
        console.error('❌ Error inicializando categorías:', error);
        return { success: false, error };
    }
}

async function initializeMetodosPago() {
    console.log('🔄 Inicializando métodos de pago...');
    
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
                console.log(`✅ Método de pago creado: ${nombre}`);
            } else {
                console.log(`⚠️  Método de pago ya existe: ${nombre}`);
            }
        }

        console.log(`✅ Inicialización de métodos de pago completada: ${created} creados`);
        return { success: true, created };
    } catch (error) {
        console.error('❌ Error inicializando métodos de pago:', error);
        return { success: false, error };
    }
}

async function initializeProveedores() {
    console.log('🔄 Inicializando proveedores...');
    
    try {
        const proveedoresCollection = await getCollection('proveedores');

        const proveedoresPredefinidos = [
            {
                nombre: 'Distribuidora ABC',
                marca: 'BARFER',
                tipoProveedor: 'Alimentos',
                telefono: '221 123-4567',
                personaContacto: 'Juan Pérez',
                pagoTipo: 'BLANCO',
                activo: true
            },
            {
                nombre: 'Insumos Veterinarios SA',
                marca: 'BARFER',
                tipoProveedor: 'Insumos',
                telefono: '221 987-6543',
                personaContacto: 'María García',
                pagoTipo: 'NEGRO',
                activo: true
            }
        ];

        let created = 0;

        for (const proveedor of proveedoresPredefinidos) {
            const exists = await proveedoresCollection.findOne({ nombre: proveedor.nombre });

            if (!exists) {
                await proveedoresCollection.insertOne({
                    ...proveedor,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
                created++;
                console.log(`✅ Proveedor creado: ${proveedor.nombre}`);
            } else {
                console.log(`⚠️  Proveedor ya existe: ${proveedor.nombre}`);
            }
        }

        console.log(`✅ Inicialización de proveedores completada: ${created} creados`);
        return { success: true, created };
    } catch (error) {
        console.error('❌ Error inicializando proveedores:', error);
        return { success: false, error };
    }
}

async function main() {
    console.log('🚀 Iniciando inicialización de colecciones MongoDB...\n');

    try {
        // Inicializar categorías
        const categoriasResult = await initializeCategorias();
        if (!categoriasResult.success) {
            throw new Error('Falló inicialización de categorías');
        }

        console.log('');

        // Inicializar métodos de pago
        const metodosPagoResult = await initializeMetodosPago();
        if (!metodosPagoResult.success) {
            throw new Error('Falló inicialización de métodos de pago');
        }

        console.log('');

        // Inicializar proveedores
        const proveedoresResult = await initializeProveedores();
        if (!proveedoresResult.success) {
            throw new Error('Falló inicialización de proveedores');
        }

        console.log('\n🎉 Inicialización completada exitosamente!');
        console.log(`📊 Resumen:`);
        console.log(`   - Categorías: ${categoriasResult.created} creadas`);
        console.log(`   - Métodos de pago: ${metodosPagoResult.created} creados`);
        console.log(`   - Proveedores: ${proveedoresResult.created} creados`);

    } catch (error) {
        console.error('❌ Error en la inicialización:', error);
        process.exit(1);
    } finally {
        process.exit(0);
    }
}

// Ejecutar inicialización
if (require.main === module) {
    main().catch(console.error);
}

