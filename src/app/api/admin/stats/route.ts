import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ message: 'Non autorise' }, { status: 401 });
        }

        // Check if admin
        const admin = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { role: true },
        });

        if (admin?.role !== 'ADMIN') {
            return NextResponse.json({ message: 'Acces refuse' }, { status: 403 });
        }

        // Get stats
        const [
            totalUsers,
            totalBets,
            totalTransactions,
            pendingWithdrawals,
            users,
            bets,
            walletSum,
            openBetsSum,
            ggrSum
        ] = await Promise.all([
            prisma.user.count(),
            prisma.bet.count(),
            prisma.transaction.count(),
            prisma.transaction.count({ where: { type: 'WITHDRAW', status: 'PENDING' } }),
            prisma.user.findMany({ select: { createdAt: true } }),
            prisma.bet.findMany({
                select: { stakeMinor: true, status: true, placedAt: true }
            }),
            // Les soldes viennent du registre, pas de la colonne User.balance.
            prisma.ledgerEntry.aggregate({
                where: { account: { kind: 'USER_WALLET' } },
                _sum: { amountMinor: true },
            }),
            prisma.ledgerEntry.aggregate({
                where: { account: { kind: 'UNSETTLED_BETS' } },
                _sum: { amountMinor: true },
            }),
            prisma.ledgerEntry.aggregate({
                where: { account: { kind: 'REVENUE' } },
                _sum: { amountMinor: true },
            }),
        ]);

        // Comptes de passif et de produit : solde = oppose de la somme.
        const totalBalance = Number(-(walletSum._sum.amountMinor ?? BigInt(0)));
        const openExposure = Number(-(openBetsSum._sum.amountMinor ?? BigInt(0)));
        const grossGamingRevenue = Number(-(ggrSum._sum.amountMinor ?? BigInt(0)));

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const newUsersToday = users.filter(u => new Date(u.createdAt) >= today).length;

        const betsToday = bets.filter(b => new Date(b.placedAt) >= today);
        const stakedToday = betsToday.reduce((sum, b) => sum + Number(b.stakeMinor), 0);
        const openBets = bets.filter(b => b.status === 'OPEN').length;

        return NextResponse.json({
            totalUsers,
            newUsersToday,
            totalBets,
            openBets,
            totalTransactions,
            pendingWithdrawals,
            totalBalance,
            /** Mises engagees dont le resultat est inconnu — l'exposition du livre. */
            openExposure,
            /** Produit brut des jeux. Peut etre negatif : un livre perd certains jours. */
            grossGamingRevenue,
            betsTodayCount: betsToday.length,
            stakedToday,
        });
    } catch (error) {
        console.error('Admin stats error:', error);
        return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
    }
}
