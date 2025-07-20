-- CreateEnum
CREATE TYPE "TipoSalida" AS ENUM ('ORDINARIO', 'EXTRAORDINARIO');

-- CreateEnum
CREATE TYPE "FormaPago" AS ENUM ('EFECTIVO', 'TRANSFERENCIA', 'TARJETA_DEBITO', 'TARJETA_CREDITO', 'MERCADO_PAGO', 'OTRO');

-- CreateEnum
CREATE TYPE "TipoRegistro" AS ENUM ('BLANCO', 'NEGRO');

-- CreateTable
CREATE TABLE "salidas" (
    "id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "detalle" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "tipo" "TipoSalida" NOT NULL,
    "marca" TEXT,
    "monto" DOUBLE PRECISION NOT NULL,
    "formaPago" "FormaPago" NOT NULL,
    "tipoRegistro" "TipoRegistro" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "salidas_pkey" PRIMARY KEY ("id")
);
