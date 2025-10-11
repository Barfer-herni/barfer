import 'server-only';
import { PrismaClient } from './generated/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Verificar si tenemos una URL de base de datos configurada
const isDatabaseConfigured = !!process.env.DATABASE_URL;

// Si no tenemos DATABASE_URL, utilizamos un proxy que intercepta las llamadas
// y devuelve resultados vacíos en lugar de errores
export const database = isDatabaseConfigured
  ? (globalForPrisma.prisma || new PrismaClient())
  : new Proxy({} as PrismaClient, {
    get: () => {
      return new Proxy({}, {
        get: () => {
          return async () => {
            console.warn('Operación de base de datos intentada sin DATABASE_URL configurado');
            return null;
          };
        }
      });
    }
  });

// Solo guardamos la instancia en desarrollo y si tenemos DATABASE_URL configurado
if (process.env.NODE_ENV !== 'production' && isDatabaseConfigured) {
  globalForPrisma.prisma = database;
}

export * from './generated/client';
export * from './mongo-connection';
export { ObjectId } from './mongo-connection';
