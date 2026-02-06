import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { PACKS } from '@/utils/packs';

// This endpoint is now disabled for regular users
// Investments are created when admin approves a deposit
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json(
                { message: 'Non autorise' },
                { status: 401 }
            );
        }

        // Check if user is admin
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { role: true }
        });

        // Only admins can directly create investments (for manual operations)
        if (user?.role !== 'ADMIN') {
            return NextResponse.json(
                { message: 'Pour investir, veuillez effectuer un depot via la page Investir.' },
                { status: 403 }
            );
        }

        // Admin can still create investments directly if needed
        const { packId, userId } = await req.json();

        const pack = PACKS.find(p => p.id === packId);
        if (!pack) {
            return NextResponse.json(
                { message: 'Pack non trouve' },
                { status: 400 }
            );
        }

        const targetUser = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!targetUser) {
            return NextResponse.json(
                { message: 'Utilisateur non trouve' },
                { status: 404 }
            );
        }

        // Create investment
        const investment = await prisma.investment.create({
            data: {
                userId: targetUser.id,
                packId: pack.id,
                amount: pack.price,
                dailyRate: 0.035,
                status: 'ACTIVE',
            },
        });

        // Update user's invested capital
        await prisma.user.update({
            where: { id: targetUser.id },
            data: {
                investedCapital: {
                    increment: pack.price,
                },
            },
        });

        return NextResponse.json({
            message: 'Investissement cree',
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
