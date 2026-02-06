import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { PACKS } from '@/utils/packs';

// Harvest gains from a specific investment
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ message: 'Non autorise' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true },
        });

        if (!user) {
            return NextResponse.json({ message: 'Utilisateur non trouve' }, { status: 404 });
        }

        const { investmentId } = await req.json();

        if (!investmentId) {
            return NextResponse.json({ message: 'ID investissement requis' }, { status: 400 });
        }

        // Find the investment
        const investment = await prisma.investment.findUnique({
            where: { id: investmentId },
        });

        if (!investment) {
            return NextResponse.json({ message: 'Investissement non trouve' }, { status: 404 });
        }

        if (investment.userId !== user.id) {
            return NextResponse.json({ message: 'Non autorise' }, { status: 403 });
        }

        if (investment.status !== 'ACTIVE') {
            return NextResponse.json({ message: 'Investissement non actif' }, { status: 400 });
        }

        // Check if 24 hours have passed since last harvest
        const now = new Date();
        const lastHarvest = new Date(investment.lastGainDate);
        const hoursSinceLastHarvest = (now.getTime() - lastHarvest.getTime()) / (1000 * 60 * 60);

        if (hoursSinceLastHarvest < 24) {
            const hoursRemaining = Math.ceil(24 - hoursSinceLastHarvest);
            return NextResponse.json({
                message: `Recolte pas encore prete. Revenez dans ${hoursRemaining}h`,
                hoursRemaining,
                ready: false
            }, { status: 400 });
        }

        // Get pack info
        const pack = PACKS.find(p => p.id === investment.packId);
        if (!pack) {
            return NextResponse.json({ message: 'Pack non trouve' }, { status: 404 });
        }

        // Only give 1 day of gains (no accumulation if they miss days)
        const gainAmount = pack.dailyGain;

        // Credit the gain to user's balance
        await prisma.$transaction([
            prisma.user.update({
                where: { id: user.id },
                data: { balance: { increment: gainAmount } }
            }),
            prisma.transaction.create({
                data: {
                    userId: user.id,
                    type: 'GAIN',
                    amount: gainAmount,
                    status: 'COMPLETED',
                    description: `Recolte - ${pack.name}`
                }
            }),
            prisma.investment.update({
                where: { id: investment.id },
                data: { lastGainDate: now }
            })
        ]);

        return NextResponse.json({
            success: true,
            message: `Recolte reussie!`,
            amount: gainAmount,
            packName: pack.name
        });

    } catch (error) {
        console.error('Harvest error:', error);
        return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
    }
}

// Get harvest status for all investments
export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ message: 'Non autorise' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: {
                investments: {
                    where: { status: 'ACTIVE' },
                    orderBy: { packId: 'asc' }
                }
            }
        });

        if (!user) {
            return NextResponse.json({ message: 'Utilisateur non trouve' }, { status: 404 });
        }

        const now = new Date();

        const farms = user.investments.map(investment => {
            const pack = PACKS.find(p => p.id === investment.packId);
            const lastHarvest = new Date(investment.lastGainDate);
            const hoursSinceLastHarvest = (now.getTime() - lastHarvest.getTime()) / (1000 * 60 * 60);
            const isReady = hoursSinceLastHarvest >= 24;
            const hoursRemaining = isReady ? 0 : Math.ceil(24 - hoursSinceLastHarvest);
            const progress = Math.min(100, (hoursSinceLastHarvest / 24) * 100);

            return {
                id: investment.id,
                packId: investment.packId,
                packName: pack?.name || `Pack ${investment.packId}`,
                packIcon: pack?.icon || '🌱',
                dailyGain: pack?.dailyGain || 0,
                amount: investment.amount,
                isReady,
                hoursRemaining,
                progress: Math.round(progress),
                lastHarvest: investment.lastGainDate
            };
        });

        return NextResponse.json({ farms });

    } catch (error) {
        console.error('Get farms error:', error);
        return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
    }
}
