#!/usr/bin/env node

/**
 * Script simple para inicializar colecciones de MongoDB
 * 
 * Uso: node scripts/init-mongodb.cjs
 */

const { getCollection } = require('../packages/database/mongo-connection');

async function initCategorias() {
    console.log('🔄 Inicializando categorías...');
    
    const categoriasCollection = await getCollection('categorias');
    
    const categorias = [
        'SUELDOS', 'IMPUESTOS', 'MANTENIMIENTO MAQUINARIA', 'INSUMOS',
        'MATERIA PRIMA', 'SERVICIOS', 'FLETE', 'LIMPIEZA', 'ALQUILERES',
        'UTILES', 'PUBLICIDAD', 'MANTENIMIENTO EDILICIO', 'OTROS',
        'CAJA CHICA', 'VIATICOS', 'VEHICULOS', 'COMBUSTIBLE', 'OFICINA',
        'FINANCIACION', 'INVERSION EDILICIA', 'INDUMENTARIA', 'INVERSION PRODUCTO',
        'PRODUCTOS', 'INVERSION TECNOLOGICA', 'I&D'
    ];

    let created = 0;
    for (const nombre of categorias) {
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
            console.log(`✅ ${nombre}`);
        }
    }
    
    console.log(`📊 ${created} categorías creadas\n`);
}

async function initMetodosPago() {
    console.log('🔄 Inicializando métodos de pago...');
    
    const metodosCollection = await getCollection('metodos_pago');
    
    const metodos = [
        'EFECTIVO', 'TRANSFERENCIA', 'TARJETA DEBITO', 
        'TARJETA CREDITO', 'MERCADO PAGO', 'CHEQUE'
    ];

    let created = 0;
    for (const nombre of metodos) {
        const exists = await metodosCollection.findOne({ nombre });
        if (!exists) {
            await metodosCollection.insertOne({
                nombre,
                descripcion: null,
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            created++;
            console.log(`✅ ${nombre}`);
        }
    }
    
    console.log(`📊 ${created} métodos de pago creados\n`);
}

async function initProveedores() {
    console.log('🔄 Inicializando proveedores...');
    
    const proveedoresCollection = await getCollection('proveedores');
    
    const proveedores = [
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
    for (const proveedor of proveedores) {
        const exists = await proveedoresCollection.findOne({ nombre: proveedor.nombre });
        if (!exists) {
            await proveedoresCollection.insertOne({
                ...proveedor,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            created++;
            console.log(`✅ ${proveedor.nombre}`);
        }
    }
    
    console.log(`📊 ${created} proveedores creados\n`);
}

async function main() {
    console.log('🚀 Inicializando colecciones MongoDB...\n');
    
    try {
        await initCategorias();
        await initMetodosPago();
        await initProveedores();
        
        console.log('🎉 ¡Inicialización completada!');
        console.log('💡 Ahora puedes usar el frontend con MongoDB');
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
    
    process.exit(0);
}

main();

