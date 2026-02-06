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

        const { amount, method, packId, proofImage, reference } = await req.json();

        if (!amount || amount < 1000) {
            return NextResponse.json(
                { message: 'Montant minimum de depot : 1 000 F' },
                { status: 400 }
            );
        }

        if (!method || !['USDT', 'MOMO'].includes(method)) {
            return NextResponse.json(
                { message: 'Methode de paiement invalide' },
                { status: 400 }
            );
        }

        if (!proofImage) {
            return NextResponse.json(
                { message: 'Capture d\'ecran de la transaction requise' },
                { status: 400 }
            );
        }

        if (!packId) {
            return NextResponse.json(
                { message: 'Veuillez selectionner un pack' },
                { status: 400 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return NextResponse.json(
                { message: 'Utilisateur non trouve' },
                { status: 404 }
            );
        }

        // Get USDT bonus percentage from settings
        let bonusPercent = 10;
        try {
            const bonusSetting = await prisma.settings.findUnique({
                where: { key: 'USDT_BONUS_PERCENT' }
            });
            if (bonusSetting) {
                bonusPercent = parseFloat(bonusSetting.value) || 10;
            }
        } catch (e) {
            // Use default
        }

        // Calculate bonus for USDT deposits
        const bonus = method === 'USDT' ? Math.floor(amount * bonusPercent / 100) : 0;
        const totalAmount = amount + bonus;

        // Create deposit transaction (pending approval by admin)
        const transaction = await prisma.transaction.create({
            data: {
                userId: user.id,
                type: 'DEPOSIT',
                amount: totalAmount,
                status: 'PENDING',
                method: method,
                reference: reference || null,
                proofImage: proofImage,
                packId: packId,
                description: method === 'USDT'
                    ? `Depot USDT (${amount.toLocaleString()} F + ${bonus.toLocaleString()} F bonus)`
                    : `Depot Mobile Money`,
            },
        });

        return NextResponse.json({
            message: 'Demande de depot enregistree. En attente de validation par l\'administrateur.',
            transaction,
            bonus: bonus,
        });
    } catch (error) {
        console.error('Deposit error:', error);
        return NextResponse.json(
            { message: 'Erreur lors du depot' },
            { status: 500 }
        );
    }
}

// Get user's deposit history
export async function GET(req: Request) {
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
        });

        if (!user) {
            return NextResponse.json(
                { message: 'Utilisateur non trouve' },
                { status: 404 }
            );
        }

        const deposits = await prisma.transaction.findMany({
            where: {
                userId: user.id,
                type: 'DEPOSIT',
            },
            orderBy: { createdAt: 'desc' },
            take: 20,
        });

        return NextResponse.json({ deposits });
    } catch (error) {
        console.error('Get deposits error:', error);
        return NextResponse.json(
            { message: 'Erreur' },
            { status: 500 }
        );
    }
}
