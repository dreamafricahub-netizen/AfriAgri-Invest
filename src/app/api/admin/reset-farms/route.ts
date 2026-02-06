import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

// Reset all farms to be harvestable immediately (admin only)
export async function POST() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ message: 'Non autorise' }, { status: 401 });
        }

        const admin = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { role: true },
        });

        if (admin?.role !== 'ADMIN') {
            return NextResponse.json({ message: 'Acces refuse' }, { status: 403 });
        }

        // Set all active investments' lastGainDate to 25 hours ago
        const yesterday = new Date(Date.now() - 25 * 60 * 60 * 1000);

        const result = await prisma.investment.updateMany({
            where: { status: 'ACTIVE' },
            data: { lastGainDate: yesterday }
        });

        return NextResponse.json({
            success: true,
            message: `${result.count} ferme(s) reinitialise(s)`,
            count: result.count
        });

    } catch (error) {
        console.error('Reset farms error:', error);
        return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
    }
}
