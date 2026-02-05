import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

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
            select: {
                id: true,
                referralCode: true,
                referrals: {
                    include: {
                        referred: {
                            select: {
                                id: true,
                                name: true,
                                city: true,
                                createdAt: true,
                                investedCapital: true,
                            },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                },
            },
        });

        if (!user) {
            return NextResponse.json(
                { message: 'Utilisateur non trouve' },
                { status: 404 }
            );
        }

        // Format referrals data
        const filleuls = user.referrals.map(r => ({
            id: r.referred.id,
            name: r.referred.name || 'Anonyme',
            initials: (r.referred.name || 'AN').substring(0, 2).toUpperCase(),
            city: r.referred.city || 'Non renseigne',
            joinedDate: r.referred.createdAt.toLocaleDateString('fr-FR'),
            totalInvested: r.totalInvested,
            myBonus: r.totalBonus,
            status: r.totalInvested > 0 ? 'active' : 'pending',
        }));

        const stats = {
            totalFilleuls: filleuls.length,
            activeFilleuls: filleuls.filter(f => f.status === 'active').length,
            totalBonus: filleuls.reduce((sum, f) => sum + f.myBonus, 0),
            totalInvestedByFilleuls: filleuls.reduce((sum, f) => sum + f.totalInvested, 0),
        };

        return NextResponse.json({
            referralCode: user.referralCode,
            filleuls,
            stats,
        });
    } catch (error) {
        console.error('Get referrals error:', error);
        return NextResponse.json(
            { message: 'Erreur serveur' },
            { status: 500 }
        );
    }
}
