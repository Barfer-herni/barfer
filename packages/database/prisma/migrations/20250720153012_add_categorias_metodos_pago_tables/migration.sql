/*
  Warnings:

  - You are about to drop the column `categoria` on the `salidas` table. All the data in the column will be lost.
  - You are about to drop the column `formaPago` on the `salidas` table. All the data in the column will be lost.
  - Added the required column `categoriaId` to the `salidas` table without a default value. This is not possible if the table is not empty.
  - Added the required column `metodoPagoId` to the `salidas` table without a default value. This is not possible if the table is not empty.

*/

-- Paso 1: Crear las nuevas tablas
CREATE TABLE "categorias" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "metodos_pago" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "metodos_pago_pkey" PRIMARY KEY ("id")
);

-- Paso 2: Crear índices únicos
CREATE UNIQUE INDEX "categorias_nombre_key" ON "categorias"("nombre");
CREATE UNIQUE INDEX "metodos_pago_nombre_key" ON "metodos_pago"("nombre");

-- Paso 3: Insertar categorías por defecto
INSERT INTO "categorias" ("id", "nombre", "createdAt", "updatedAt") VALUES
    (gen_random_uuid(), 'SUELDOS', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'IMPUESTOS', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'MANTENIMIENTO MAQUINARIA', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'INSUMOS', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'MATERIA PRIMA', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'SERVICIOS', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'FLETE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'LIMPIEZA', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'ALQUILERES', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'UTILES', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'PUBLICIDAD', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'MANTENIMIENTO EDILICIO', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'OTROS', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'CAJA CHICA', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'VIATICOS', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'VEHICULOS', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'COMBUSTIBLE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'OFICINA', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'FINANCIACION', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'INVERSION EDILICIA', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'INDUMENTARIA', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'INVERSION PRODUCTO', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'PRODUCTOS', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'INVERSION TECNOLOGICA', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'I&D', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Paso 4: Insertar métodos de pago por defecto
INSERT INTO "metodos_pago" ("id", "nombre", "createdAt", "updatedAt") VALUES
    (gen_random_uuid(), 'EFECTIVO', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'TRANSFERENCIA', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'MERCADO PAGO', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'TARJETA DEBITO', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'TARJETA CREDITO', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'CHEQUE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Paso 5: Agregar columnas temporales para migración de datos
ALTER TABLE "salidas" ADD COLUMN "categoriaId_temp" TEXT;
ALTER TABLE "salidas" ADD COLUMN "metodoPagoId_temp" TEXT;

-- Paso 6: Migrar datos existentes - asignar a categoría "OTROS" y método "EFECTIVO" por defecto
UPDATE "salidas" SET 
    "categoriaId_temp" = (SELECT "id" FROM "categorias" WHERE "nombre" = 'OTROS' LIMIT 1),
    "metodoPagoId_temp" = (SELECT "id" FROM "metodos_pago" WHERE "nombre" = 'EFECTIVO' LIMIT 1);

-- Paso 7: Hacer las columnas temporales NOT NULL y renombrarlas
ALTER TABLE "salidas" ALTER COLUMN "categoriaId_temp" SET NOT NULL;
ALTER TABLE "salidas" ALTER COLUMN "metodoPagoId_temp" SET NOT NULL;
ALTER TABLE "salidas" RENAME COLUMN "categoriaId_temp" TO "categoriaId";
ALTER TABLE "salidas" RENAME COLUMN "metodoPagoId_temp" TO "metodoPagoId";

-- Paso 8: Eliminar las columnas antiguas
ALTER TABLE "salidas" DROP COLUMN "categoria";
ALTER TABLE "salidas" DROP COLUMN "formaPago";

-- Paso 9: Eliminar el enum FormaPago
DROP TYPE "FormaPago";

-- Paso 10: Agregar las foreign keys
ALTER TABLE "salidas" ADD CONSTRAINT "salidas_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "categorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "salidas" ADD CONSTRAINT "salidas_metodoPagoId_fkey" FOREIGN KEY ("metodoPagoId") REFERENCES "metodos_pago"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
