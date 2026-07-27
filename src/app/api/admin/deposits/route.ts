import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { recordDeposit, creditFromExpense } from '@/lib/ledger';

/**
 * Recompense de parrainage, en francs. Montant fixe, verse une seule fois.
 * Volontairement decorrele du montant depose par le filleul.
 */
const REFERRAL_REWARD = 1000;

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

        const deposits = await prisma.transaction.findMany({
            where: {
                type: 'DEPOSIT',
                status: status === 'ALL' ? undefined : status,
            },
            select: {
                id: true,
                amount: true,
                status: true,
                method: true,
                reference: true,
                proofImage: true,
                packId: true,
                createdAt: true,
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

        return NextResponse.json({ deposits });
    } catch (error) {
        console.error('Admin deposits error:', error);
        return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
    }
}

// Approve or reject deposit
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
            // Le depot credite le portefeuille, point. Il n'achete plus rien et
            // ne declenche aucun rendement : le joueur decide ensuite de ce
            // qu'il mise.
            await recordDeposit({
                userId: transaction.userId,
                amountMinor: BigInt(Math.round(transaction.amount)),
                provider: transaction.method === 'USDT' ? 'usdt' : 'momo',
                providerRef: transaction.id,
            });

            await prisma.transaction.update({
                where: { id: transactionId },
                data: { status: 'COMPLETED' }
            });

            // Parrainage : recompense forfaitaire, versee une seule fois, au
            // premier depot du filleul.
            //
            // Elle ne depend PAS du montant depose. Une commission indexee sur
            // les depots recompense le recrutement plutot que l'usage, et
            // pousse a faire deposer toujours plus : c'est le mecanisme qu'on
            // retire.
            if (transaction.user.referredBy) {
                const sponsor = await prisma.user.findUnique({
                    where: { referralCode: transaction.user.referredBy },
                    select: { id: true },
                });

                const link = sponsor
                    ? await prisma.referral.findFirst({
                        where: { sponsorId: sponsor.id, referredId: transaction.userId },
                        select: { id: true, totalBonus: true },
                    })
                    : null;

                if (sponsor && link && link.totalBonus === 0) {
                    const reward = REFERRAL_REWARD;

                    await creditFromExpense({
                        userId: sponsor.id,
                        amountMinor: BigInt(reward),
                        expenseLabel: 'parrainage',
                        idempotencyKey: `referral:${link.id}`,
                        metadata: { sponsorId: sponsor.id, referredId: transaction.userId },
                    });

                    await prisma.referral.update({
                        where: { id: link.id },
                        data: { totalBonus: reward },
                    });

                    await prisma.transaction.create({
                        data: {
                            userId: sponsor.id,
                            type: 'REFERRAL_BONUS',
                            amount: reward,
                            status: 'COMPLETED',
                            description: `Parrainage de ${transaction.user.name || 'un filleul'}`,
                        },
                    });
                }
            }

        } else {
            // Mark as failed
            await prisma.transaction.update({
                where: { id: transactionId },
                data: { status: 'FAILED' }
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Admin deposit action error:', error);
        return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
    }
}

// Create manual deposit for a user
export async function POST(req: Request) {
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

        const { userId, amount, method, reference } = await req.json();

        if (!userId || !amount || amount <= 0) {
            return NextResponse.json({ message: 'Donnees invalides' }, { status: 400 });
        }

        // Create deposit and credit user immediately
        await prisma.$transaction([
            prisma.transaction.create({
                data: {
                    userId,
                    type: 'DEPOSIT',
                    amount,
                    status: 'COMPLETED',
                    method: method || 'ADMIN',
                    reference,
                    description: 'Depot manuel par admin',
                }
            }),
            prisma.user.update({
                where: { id: userId },
                data: { balance: { increment: amount } }
            })
        ]);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Admin create deposit error:', error);
        return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
    }
}
