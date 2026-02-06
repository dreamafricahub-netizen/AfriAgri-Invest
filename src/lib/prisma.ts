import { PrismaClient } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const globalForPrisma = global as unknown as { prisma: PrismaClient | undefined };

function createPrismaClient() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
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
