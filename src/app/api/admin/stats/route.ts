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
            totalInvestments,
            totalTransactions,
            pendingWithdrawals,
            users,
            investments,
            transactions
        ] = await Promise.all([
            prisma.user.count(),
            prisma.investment.count(),
            prisma.transaction.count(),
            prisma.transaction.count({ where: { type: 'WITHDRAWAL', status: 'PENDING' } }),
            prisma.user.findMany({
                select: { balance: true, investedCapital: true, createdAt: true }
            }),
            prisma.investment.findMany({
                select: { amount: true, createdAt: true }
            }),
            prisma.transaction.findMany({
                where: { type: { in: ['GAIN', 'REFERRAL_BONUS'] } },
                select: { amount: true }
            })
        ]);

        const totalBalance = users.reduce((sum, u) => sum + u.balance, 0);
        const totalInvestedCapital = users.reduce((sum, u) => sum + u.investedCapital, 0);
        const totalGainsPaid = transactions.reduce((sum, t) => sum + t.amount, 0);

        // Users registered today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const newUsersToday = users.filter(u => new Date(u.createdAt) >= today).length;

        // Investments today
        const investmentsToday = investments.filter(i => new Date(i.createdAt) >= today);
        const investmentsTodayAmount = investmentsToday.reduce((sum, i) => sum + i.amount, 0);

        return NextResponse.json({
            totalUsers,
            newUsersToday,
            totalInvestments,
            totalTransactions,
            pendingWithdrawals,
            totalBalance,
            totalInvestedCapital,
            totalGainsPaid,
            investmentsTodayCount: investmentsToday.length,
            investmentsTodayAmount,
        });
    } catch (error) {
        console.error('Admin stats error:', error);
        return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
    }
}
