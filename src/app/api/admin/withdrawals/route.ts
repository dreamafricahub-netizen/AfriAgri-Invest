import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { settleWithdrawal, rejectWithdrawal } from '@/lib/ledger';

export async function GET(req: Request) {
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

        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status') || 'PENDING';

        const withdrawals = await prisma.transaction.findMany({
            where: {
                type: { in: ['WITHDRAW', 'WITHDRAWAL'] },
                status: status === 'ALL' ? undefined : status,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({ withdrawals });
    } catch (error) {
        console.error('Admin withdrawals error:', error);
        return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
    }
}

// Approve or reject withdrawal
export async function PUT(req: Request) {
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

        const { transactionId, action } = await req.json();

        if (!['APPROVE', 'REJECT'].includes(action)) {
            return NextResponse.json({ message: 'Action invalide' }, { status: 400 });
        }

        const transaction = await prisma.transaction.findUnique({
            where: { id: transactionId },
            include: { user: true }
        });

        if (!transaction) {
            return NextResponse.json({ message: 'Transaction non trouvee' }, { status: 404 });
        }

        if (transaction.status !== 'PENDING') {
            return NextResponse.json({ message: 'Transaction deja traitee' }, { status: 400 });
        }

        if (action === 'APPROVE') {
            // Le versement sort les fonds de l'encaisse : le decouvert y est
            // interdit, donc approuver un retrait non couvert echoue ici.
            await settleWithdrawal({
                amountMinor: BigInt(Math.round(transaction.amount)),
                provider: transaction.method === 'USDT' ? 'usdt' : 'momo',
                requestRef: transaction.id,
            });

            await prisma.transaction.update({
                where: { id: transactionId },
                data: { status: 'COMPLETED' }
            });
        } else {
            // Refus : les fonds immobilises retournent au portefeuille.
            await rejectWithdrawal({
                userId: transaction.userId,
                amountMinor: BigInt(Math.round(transaction.amount)),
                requestRef: transaction.id,
                reason: 'Refuse par un administrateur',
            });

            await prisma.transaction.update({
                where: { id: transactionId },
                data: { status: 'FAILED' }
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Admin withdrawal action error:', error);
        return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
    }
}
