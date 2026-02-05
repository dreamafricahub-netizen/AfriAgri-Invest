import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { PACKS } from '@/utils/packs';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json(
                { message: 'Non autorise' },
                { status: 401 }
            );
        }

        const { packId } = await req.json();

        // Find pack
        const pack = PACKS.find(p => p.id === packId);
        if (!pack) {
            return NextResponse.json(
                { message: 'Pack non trouve' },
                { status: 400 }
            );
        }

        // Get user
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return NextResponse.json(
                { message: 'Utilisateur non trouve' },
                { status: 404 }
            );
        }

        // Create investment
        const investment = await prisma.investment.create({
            data: {
                userId: user.id,
                packId: pack.id,
                amount: pack.price,
                dailyRate: 0.035, // 3.5%
                status: 'ACTIVE',
            },
        });

        // Update user's invested capital
        await prisma.user.update({
            where: { id: user.id },
            data: {
                investedCapital: {
                    increment: pack.price,
                },
            },
        });

        // Create transaction
        await prisma.transaction.create({
            data: {
                userId: user.id,
                type: 'INVESTMENT',
                amount: pack.price,
                status: 'COMPLETED',
                description: `Investissement - ${pack.name}`,
            },
        });

        // Handle referral bonus (10% to sponsor)
        if (user.referredBy) {
            const sponsor = await prisma.user.findUnique({
                where: { referralCode: user.referredBy },
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
                        referredId: user.id,
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
                        description: `Bonus parrainage de ${user.name || 'un filleul'}`,
                    },
                });
            }
        }

        return NextResponse.json({
            message: 'Investissement reussi',
            investment,
        });
    } catch (error) {
        console.error('Investment error:', error);
        return NextResponse.json(
            { message: 'Erreur lors de l\'investissement' },
            { status: 500 }
        );
    }
}
