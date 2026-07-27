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

        // La recompense est forfaitaire et versee une seule fois, au premier
        // depot du filleul. On n'expose plus ce qu'il a depose : ce montant ne
        // determine plus rien, et le publier reinstallerait la logique de
        // volume qu'on vient de retirer.
        const filleuls = user.referrals.map(r => ({
            id: r.referred.id,
            name: r.referred.name || 'Anonyme',
            initials: (r.referred.name || 'AN').substring(0, 2).toUpperCase(),
            city: r.referred.city || 'Non renseigne',
            joinedDate: r.referred.createdAt.toLocaleDateString('fr-FR'),
            myBonus: r.totalBonus,
            status: r.totalBonus > 0 ? 'rewarded' : 'pending',
        }));

        const stats = {
            totalFilleuls: filleuls.length,
            rewardedFilleuls: filleuls.filter(f => f.status === 'rewarded').length,
            totalBonus: filleuls.reduce((sum, f) => sum + f.myBonus, 0),
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
