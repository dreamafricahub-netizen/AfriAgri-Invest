import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ message: 'Non autorise' }, { status: 401 });
        }

        const admin = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { role: true },
        });

        if (admin?.role !== 'ADMIN') {
            return NextResponse.json({ message: 'Acces refuse' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status') || 'PENDING';

        const deposits = await prisma.transaction.findMany({
            where: {
                type: 'DEPOSIT',
                status: status === 'ALL' ? undefined : status,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({ deposits });
    } catch (error) {
        console.error('Admin deposits error:', error);
        return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
    }
}

// Approve or reject deposit
export async function PUT(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ message: 'Non autorise' }, { status: 401 });
        }

        const admin = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { role: true },
        });

        if (admin?.role !== 'ADMIN') {
            return NextResponse.json({ message: 'Acces refuse' }, { status: 403 });
        }

        const { transactionId, action } = await req.json();

        if (!['APPROVE', 'REJECT'].includes(action)) {
            return NextResponse.json({ message: 'Action invalide' }, { status: 400 });
        }

        const transaction = await prisma.transaction.findUnique({
            where: { id: transactionId },
            include: { user: true }
        });

        if (!transaction) {
            return NextResponse.json({ message: 'Transaction non trouvee' }, { status: 404 });
        }

        if (transaction.status !== 'PENDING') {
            return NextResponse.json({ message: 'Transaction deja traitee' }, { status: 400 });
        }

        if (action === 'APPROVE') {
            // Credit the user and mark as completed
            await prisma.$transaction([
                prisma.transaction.update({
                    where: { id: transactionId },
                    data: { status: 'COMPLETED' }
                }),
                prisma.user.update({
                    where: { id: transaction.userId },
                    data: { balance: { increment: transaction.amount } }
                })
            ]);
        } else {
            // Mark as failed
            await prisma.transaction.update({
                where: { id: transactionId },
                data: { status: 'FAILED' }
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Admin deposit action error:', error);
        return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
    }
}

// Create manual deposit for a user
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ message: 'Non autorise' }, { status: 401 });
        }

        const admin = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { role: true },
        });

        if (admin?.role !== 'ADMIN') {
            return NextResponse.json({ message: 'Acces refuse' }, { status: 403 });
        }

        const { userId, amount, method, reference } = await req.json();

        if (!userId || !amount || amount <= 0) {
            return NextResponse.json({ message: 'Donnees invalides' }, { status: 400 });
        }

        // Create deposit and credit user immediately
        await prisma.$transaction([
            prisma.transaction.create({
                data: {
                    userId,
                    type: 'DEPOSIT',
                    amount,
                    status: 'COMPLETED',
                    method: method || 'ADMIN',
                    reference,
                    description: 'Depot manuel par admin',
                }
            }),
            prisma.user.update({
                where: { id: userId },
                data: { balance: { increment: amount } }
            })
        ]);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Admin create deposit error:', error);
        return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
    }
}
