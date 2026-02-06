import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { PACKS } from '@/utils/packs';

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
            // Get pack info if packId exists
            const pack = transaction.packId ? PACKS.find(p => p.id === transaction.packId) : null;

            // Mark deposit as completed
            await prisma.transaction.update({
                where: { id: transactionId },
                data: { status: 'COMPLETED' }
            });

            if (pack) {
                // Create investment for the user
                // Set lastGainDate to 25 hours ago so harvest is available immediately
                const yesterday = new Date(Date.now() - 25 * 60 * 60 * 1000);
                await prisma.investment.create({
                    data: {
                        userId: transaction.userId,
                        packId: pack.id,
                        amount: pack.price,
                        dailyRate: 0.035, // 3.5%
                        status: 'ACTIVE',
                        lastGainDate: yesterday,
                    },
                });

                // Update user's invested capital (not balance - the deposit amount goes to investment)
                await prisma.user.update({
                    where: { id: transaction.userId },
                    data: {
                        investedCapital: {
                            increment: pack.price,
                        },
                        // Add any bonus to balance (for USDT deposits, transaction.amount includes the bonus)
                        balance: {
                            increment: transaction.amount - pack.price, // The bonus part goes to balance
                        },
                    },
                });

                // Create investment transaction record
                await prisma.transaction.create({
                    data: {
                        userId: transaction.userId,
                        type: 'INVESTMENT',
                        amount: pack.price,
                        status: 'COMPLETED',
                        description: `Investissement - ${pack.name}`,
                    },
                });

                // Handle referral bonus (10% to sponsor)
                if (transaction.user.referredBy) {
                    const sponsor = await prisma.user.findUnique({
                        where: { referralCode: transaction.user.referredBy },
                    });

                    if (sponsor) {
                        const bonus = Math.floor(pack.price * 0.10); // 10% bonus

                        // Update sponsor balance
                        await prisma.user.update({
                            where: { id: sponsor.id },
                            data: {
                                balance: {
                                    increment: bonus,
                                },
                            },
                        });

                        // Update referral stats
                        await prisma.referral.updateMany({
                            where: {
                                sponsorId: sponsor.id,
                                referredId: transaction.userId,
                            },
                            data: {
                                totalInvested: {
                                    increment: pack.price,
                                },
                                totalBonus: {
                                    increment: bonus,
                                },
                            },
                        });

                        // Create bonus transaction for sponsor
                        await prisma.transaction.create({
                            data: {
                                userId: sponsor.id,
                                type: 'REFERRAL_BONUS',
                                amount: bonus,
                                status: 'COMPLETED',
                                description: `Bonus parrainage de ${transaction.user.name || 'un filleul'}`,
                            },
                        });
                    }
                }
            } else {
                // No pack - just credit the balance (for regular deposits)
                await prisma.user.update({
                    where: { id: transaction.userId },
                    data: { balance: { increment: transaction.amount } }
                });
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
