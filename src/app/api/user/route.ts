import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

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
                investments: {
                    where: { status: 'ACTIVE' },
                    orderBy: { createdAt: 'desc' },
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

        // Remove password
        const { password: _, ...userWithoutPassword } = user;

        return NextResponse.json({
            ...userWithoutPassword,
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
