import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { creditFromExpense } from '@/lib/ledger';

// Get single user with full details
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
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

        const { id } = await params;

        const user = await prisma.user.findUnique({
            where: { id },
            include: {
                bets: {
                    orderBy: { placedAt: 'desc' },
                    take: 50,
                    include: {
                        selections: { select: { homeGoals: true, awayGoals: true } },
                        fixture: { select: { homeTeam: true, awayTeam: true, kickoffAt: true } },
                    },
                },
                transactions: {
                    orderBy: { createdAt: 'desc' },
                    take: 50,
                },
                referrals: {
                    include: {
                        referred: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                phone: true,
                                city: true,
                                balance: true,
                                status: true,
                                createdAt: true
                            }
                        }
                    }
                },
            },
        });

        if (!user) {
            return NextResponse.json({ message: 'Utilisateur non trouve' }, { status: 404 });
        }

        // Parrainage : filleuls directs uniquement.
        //
        // Le suivi sur deux niveaux et le cumul des montants investis par
        // l'equipe ont ete retires avec la commission indexee sur les depots.
        // La recompense est desormais forfaitaire et versee une seule fois :
        // il n'y a plus de « volume d'equipe » a mesurer.
        const directFilleuls = user.referrals.map(r => r.referred);

        const teamStats = {
            directFilleuls: directFilleuls.length,
            rewardedReferrals: user.referrals.filter(r => r.totalBonus > 0).length,
            totalReferralReward: user.referrals.reduce((sum, r) => sum + r.totalBonus, 0),
        };

        // Calculate user stats
        const totalGains = user.transactions
            .filter(t => t.type === 'GAIN' || t.type === 'REFERRAL_BONUS')
            .reduce((sum, t) => sum + t.amount, 0);

        const totalWithdrawn = user.transactions
            .filter(t => t.type === 'WITHDRAWAL' && t.status === 'COMPLETED')
            .reduce((sum, t) => sum + t.amount, 0);

        const totalDeposited = user.transactions
            .filter(t => t.type === 'DEPOSIT' && t.status === 'COMPLETED')
            .reduce((sum, t) => sum + t.amount, 0);

        const referralBonus = user.transactions
            .filter(t => t.type === 'REFERRAL_BONUS')
            .reduce((sum, t) => sum + t.amount, 0);

        const { password: _, ...userWithoutPassword } = user;

        return NextResponse.json({
            user: userWithoutPassword,
            teamStats,
            userStats: {
                totalGains,
                totalWithdrawn,
                totalDeposited,
                referralBonus,
            },
            filleuls: directFilleuls,
        });
    } catch (error) {
        console.error('Admin user detail error:', error);
        return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
    }
}

// Update user (ban, unban, modify balance, etc.)
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
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

        const { id } = await params;
        const body = await req.json();
        const { action, role, status, balance, addBalance } = body;

        const updateData: any = {};

        if (action === 'BAN') {
            updateData.status = 'BANNED';
        } else if (action === 'UNBAN') {
            updateData.status = 'ACTIVE';
        } else if (action === 'SUSPEND') {
            updateData.status = 'SUSPENDED';
        }

        if (role) updateData.role = role;
        if (status) updateData.status = status;

        // Le solde n'est plus une valeur que l'on pose. Un administrateur ne
        // peut pas ecraser un solde : il peut crediter, et ce credit s'inscrit
        // en charge sur un compte nomme, attribuable a son auteur.
        if (balance !== undefined) {
            return NextResponse.json({
                message:
                    "Le solde ne peut pas etre fixe directement. Utilisez un credit " +
                    "(addBalance), qui laisse une ecriture tracable au registre.",
            }, { status: 400 });
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data: updateData,
        });

        if (addBalance && addBalance > 0) {
            const adjustmentTx = await prisma.transaction.create({
                data: {
                    userId: id,
                    type: 'BONUS',
                    amount: addBalance,
                    status: 'COMPLETED',
                    description: `Ajustement administratif par ${session.user.email}`,
                }
            });

            await creditFromExpense({
                userId: id,
                amountMinor: BigInt(Math.round(addBalance)),
                expenseLabel: 'ajustement_admin',
                idempotencyKey: `admin_adjust:${adjustmentTx.id}`,
                metadata: { userId: id, adminEmail: session.user.email, transactionId: adjustmentTx.id },
            });
        }

        return NextResponse.json({ success: true, user: updatedUser });
    } catch (error) {
        console.error('Admin update user error:', error);
        return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
    }
}
