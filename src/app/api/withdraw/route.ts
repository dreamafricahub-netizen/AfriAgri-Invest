import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json(
                { message: 'Non autorise' },
                { status: 401 }
            );
        }

        const { amount, method } = await req.json();

        if (!amount || amount < 1000) {
            return NextResponse.json(
                { message: 'Montant minimum de retrait : 1 000 F' },
                { status: 400 }
            );
        }

        // Get user with investments
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: {
                investments: {
                    where: { status: 'ACTIVE' },
                },
            },
        });

        if (!user) {
            return NextResponse.json(
                { message: 'Utilisateur non trouve' },
                { status: 404 }
            );
        }

        // Check if user has invested (required before withdrawal)
        if (user.investments.length === 0) {
            return NextResponse.json(
                { message: 'Vous devez investir dans un pack avant de pouvoir retirer' },
                { status: 400 }
            );
        }

        // Check balance
        if (user.balance < amount) {
            return NextResponse.json(
                { message: 'Solde insuffisant' },
                { status: 400 }
            );
        }

        // Update user balance
        await prisma.user.update({
            where: { id: user.id },
            data: {
                balance: {
                    decrement: amount,
                },
            },
        });

        // Create withdrawal transaction
        const transaction = await prisma.transaction.create({
            data: {
                userId: user.id,
                type: 'WITHDRAWAL',
                amount: amount,
                status: 'PENDING', // Will be processed
                method: method || 'MOMO',
                description: `Retrait vers ${method || 'Mobile Money'}`,
            },
        });

        return NextResponse.json({
            message: 'Demande de retrait enregistree. Traitement sous 24h.',
            transaction,
        });
    } catch (error) {
        console.error('Withdrawal error:', error);
        return NextResponse.json(
            { message: 'Erreur lors du retrait' },
            { status: 500 }
        );
    }
}
