import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { getUserBalance, requestWithdrawal, LedgerError } from '@/lib/ledger';

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
                _count: { select: { bets: true } },
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

        // Au moins un pari place avant tout retrait.
        //
        // Ce n'est pas une contrainte commerciale mais une mesure LBC/FT :
        // sans elle, un compte peut servir a faire entrer puis ressortir des
        // fonds sans qu'aucun jeu n'ait lieu.
        if (user._count.bets === 0) {
            return NextResponse.json({
                message: 'Vous devez avoir place au moins un pari avant de pouvoir retirer'
            }, { status: 400 });
        }

        // Le solde vient du registre. Le controle ci-dessous ne sert qu'au
        // message : le decouvert est de toute facon interdit en base.
        const available = await getUserBalance(user.id);
        if (available < BigInt(Math.round(amount))) {
            return NextResponse.json({
                message: `Solde insuffisant. Votre solde disponible est de ${Number(available).toLocaleString()} F`
            }, { status: 400 });
        }

        // La demande cree d'abord la trace metier, puis immobilise les fonds :
        // ils quittent le portefeuille sans quitter la plateforme.
        const pendingTx = await prisma.transaction.create({
            data: {
                userId: user.id,
                type: 'WITHDRAW',
                amount: amount,
                method: method,
                status: 'PENDING',
                withdrawAddress: address,
                description: `Retrait vers ${method === 'USDT' ? 'USDT TRC20' : 'Mobile Money'}: ${address}`,
            },
        });

        try {
            await requestWithdrawal({
                userId: user.id,
                amountMinor: BigInt(Math.round(amount)),
                requestRef: pendingTx.id,
            });
        } catch (err) {
            // L'immobilisation a echoue : la demande ne doit pas subsister.
            await prisma.transaction.update({
                where: { id: pendingTx.id },
                data: { status: 'FAILED' },
            });
            if (err instanceof LedgerError) {
                return NextResponse.json({ message: err.message }, { status: 400 });
            }
            throw err;
        }

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
