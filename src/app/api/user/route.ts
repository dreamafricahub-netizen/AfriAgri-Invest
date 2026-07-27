import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { getUserBalance } from '@/lib/ledger';

// GET user data
export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json(
                { message: 'Non autorise' },
                { status: 401 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: {
                bets: {
                    where: { status: 'OPEN' },
                    orderBy: { placedAt: 'desc' },
                    include: {
                        selections: { select: { homeGoals: true, awayGoals: true } },
                        fixture: {
                            select: { homeTeam: true, awayTeam: true, kickoffAt: true },
                        },
                    },
                },
                transactions: {
                    orderBy: { createdAt: 'desc' },
                    take: 20,
                },
                referrals: {
                    include: {
                        referred: {
                            select: {
                                id: true,
                                name: true,
                                city: true,
                                createdAt: true,
                            },
                        },
                    },
                },
            },
        });

        if (!user) {
            return NextResponse.json(
                { message: 'Utilisateur non trouve' },
                { status: 404 }
            );
        }

        // Calculate total gains from referrals
        const totalReferralBonus = user.referrals.reduce((sum, r) => sum + r.totalBonus, 0);

        // Le solde vient du registre, pas de la colonne User.balance.
        // C'est desormais la seule source de verite : il est calcule depuis les
        // ecritures, chacune ayant une contrepartie identifiee.
        const ledgerBalance = await getUserBalance(user.id);

        // Remove password
        const { password: _, ...userWithoutPassword } = user;

        return NextResponse.json({
            ...userWithoutPassword,
            balance: Number(ledgerBalance),
            totalReferralBonus,
            referralCount: user.referrals.length,
            activeReferrals: user.referrals.filter(r => r.totalInvested > 0).length,
        });
    } catch (error) {
        console.error('Get user error:', error);
        return NextResponse.json(
            { message: 'Erreur serveur' },
            { status: 500 }
        );
    }
}

// UPDATE user profile
export async function PUT(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json(
                { message: 'Non autorise' },
                { status: 401 }
            );
        }

        const { name, phone, city } = await req.json();

        const user = await prisma.user.update({
            where: { email: session.user.email },
            data: {
                name: name || undefined,
                phone: phone || undefined,
                city: city || undefined,
            },
        });

        const { password: _, ...userWithoutPassword } = user;

        return NextResponse.json(userWithoutPassword);
    } catch (error) {
        console.error('Update user error:', error);
        return NextResponse.json(
            { message: 'Erreur serveur' },
            { status: 500 }
        );
    }
}
