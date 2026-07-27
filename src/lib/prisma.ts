import { PrismaClient } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const globalForPrisma = global as unknown as { prisma: PrismaClient | undefined };

function createPrismaClient() {
    // Taille du pool configurable. Utile en production pour tenir la limite de
    // connexions du fournisseur (PgBouncer, Supabase), et en local pour les
    // bases qui n'acceptent qu'une connexion a la fois.
    const max = process.env.PG_POOL_MAX ? Number(process.env.PG_POOL_MAX) : undefined;

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ...(Number.isFinite(max) && max! > 0 ? { max } : {}),
    });
    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter });
}

// Lazy initialization - only create client when actually used
export const prisma = new Proxy({} as PrismaClient, {
    get(_target, prop) {
        if (!globalForPrisma.prisma) {
            globalForPrisma.prisma = createPrismaClient();
        }
        return (globalForPrisma.prisma as any)[prop];
    }
});
