import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

// Create withdrawal request
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ message: 'Non autorise' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: {
                investments: {
                    where: { status: 'ACTIVE' },
                },
            },
        });

        if (!user) {
            return NextResponse.json({ message: 'Utilisateur non trouve' }, { status: 404 });
        }

        const body = await req.json();
        const { amount, method, address } = body;

        // Validate amount
        if (!amount || amount <= 0) {
            return NextResponse.json({ message: 'Montant invalide' }, { status: 400 });
        }

        if (amount < 3000) {
            return NextResponse.json({ message: 'Montant minimum de retrait: 3 000 F' }, { status: 400 });
        }

        // Validate method
        if (!method || !['USDT', 'MOMO'].includes(method)) {
            return NextResponse.json({ message: 'Methode de retrait invalide' }, { status: 400 });
        }

        // Validate address
        if (!address || address.trim() === '') {
            return NextResponse.json({
                message: method === 'USDT' ? 'Adresse USDT TRC20 requise' : 'Numero Mobile Money requis'
            }, { status: 400 });
        }

        // Check if user has invested (required before withdrawal)
        if (user.investments.length === 0) {
            return NextResponse.json({
                message: 'Vous devez investir dans un pack avant de pouvoir retirer'
            }, { status: 400 });
        }

        // Check if user has sufficient balance
        if (user.balance < amount) {
            return NextResponse.json({
                message: `Solde insuffisant. Votre solde disponible est de ${user.balance.toLocaleString()} F`
            }, { status: 400 });
        }

        // Deduct balance immediately and create pending withdrawal
        await prisma.$transaction([
            // Deduct from user balance
            prisma.user.update({
                where: { id: user.id },
                data: { balance: { decrement: amount } },
            }),
            // Create withdrawal transaction
            prisma.transaction.create({
                data: {
                    userId: user.id,
                    type: 'WITHDRAW',
                    amount: amount,
                    method: method,
                    status: 'PENDING',
                    withdrawAddress: address,
                    description: `Retrait vers ${method === 'USDT' ? 'USDT TRC20' : 'Mobile Money'}: ${address}`,
                },
            }),
        ]);

        return NextResponse.json({
            success: true,
            message: 'Demande de retrait envoyee. En attente de validation.'
        });
    } catch (error) {
        console.error('Withdraw error:', error);
        return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
    }
}

// Get user's withdrawal history
export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ message: 'Non autorise' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true },
        });

        if (!user) {
            return NextResponse.json({ message: 'Utilisateur non trouve' }, { status: 404 });
        }

        const withdrawals = await prisma.transaction.findMany({
            where: {
                userId: user.id,
                type: 'WITHDRAW',
            },
            orderBy: { createdAt: 'desc' },
            take: 20,
        });

        return NextResponse.json(withdrawals);
    } catch (error) {
        console.error('Get withdrawals error:', error);
        return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
    }
}
