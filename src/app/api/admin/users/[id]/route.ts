import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

// Get single user with full details
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
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

        const { id } = await params;

        const user = await prisma.user.findUnique({
            where: { id },
            include: {
                investments: {
                    orderBy: { createdAt: 'desc' },
                },
                transactions: {
                    orderBy: { createdAt: 'desc' },
                    take: 50,
                },
                referrals: {
                    include: {
                        referred: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                phone: true,
                                city: true,
                                balance: true,
                                investedCapital: true,
                                status: true,
                                createdAt: true,
                                referrals: {
                                    include: {
                                        referred: {
                                            select: {
                                                id: true,
                                                name: true,
                                                email: true,
                                                investedCapital: true,
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
            },
        });

        if (!user) {
            return NextResponse.json({ message: 'Utilisateur non trouve' }, { status: 404 });
        }

        // Calculate team stats
        const directFilleuls = user.referrals.map(r => r.referred);
        const directInvested = directFilleuls.reduce((sum, f) => sum + f.investedCapital, 0);

        // Level 2 filleuls (filleuls of filleuls)
        const level2Filleuls: any[] = [];
        directFilleuls.forEach(f => {
            f.referrals.forEach(r2 => {
                level2Filleuls.push(r2.referred);
            });
        });
        const level2Invested = level2Filleuls.reduce((sum, f) => sum + f.investedCapital, 0);

        const teamStats = {
            directFilleuls: directFilleuls.length,
            directInvested,
            level2Filleuls: level2Filleuls.length,
            level2Invested,
            totalTeamInvested: directInvested + level2Invested,
            totalTeamMembers: directFilleuls.length + level2Filleuls.length,
        };

        // Calculate user stats
        const totalGains = user.transactions
            .filter(t => t.type === 'GAIN' || t.type === 'REFERRAL_BONUS')
            .reduce((sum, t) => sum + t.amount, 0);

        const totalWithdrawn = user.transactions
            .filter(t => t.type === 'WITHDRAWAL' && t.status === 'COMPLETED')
            .reduce((sum, t) => sum + t.amount, 0);

        const totalDeposited = user.transactions
            .filter(t => t.type === 'DEPOSIT' && t.status === 'COMPLETED')
            .reduce((sum, t) => sum + t.amount, 0);

        const referralBonus = user.transactions
            .filter(t => t.type === 'REFERRAL_BONUS')
            .reduce((sum, t) => sum + t.amount, 0);

        const { password: _, ...userWithoutPassword } = user;

        return NextResponse.json({
            user: userWithoutPassword,
            teamStats,
            userStats: {
                totalGains,
                totalWithdrawn,
                totalDeposited,
                referralBonus,
            },
            filleuls: directFilleuls,
            level2Filleuls,
        });
    } catch (error) {
        console.error('Admin user detail error:', error);
        return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
    }
}

// Update user (ban, unban, modify balance, etc.)
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
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

        const { id } = await params;
        const body = await req.json();
        const { action, role, status, balance, addBalance } = body;

        const updateData: any = {};

        if (action === 'BAN') {
            updateData.status = 'BANNED';
        } else if (action === 'UNBAN') {
            updateData.status = 'ACTIVE';
        } else if (action === 'SUSPEND') {
            updateData.status = 'SUSPENDED';
        }

        if (role) updateData.role = role;
        if (status) updateData.status = status;
        if (balance !== undefined) updateData.balance = balance;

        const updatedUser = await prisma.user.update({
            where: { id },
            data: updateData,
        });

        // If adding balance, create a transaction
        if (addBalance && addBalance > 0) {
            await prisma.$transaction([
                prisma.user.update({
                    where: { id },
                    data: { balance: { increment: addBalance } }
                }),
                prisma.transaction.create({
                    data: {
                        userId: id,
                        type: 'BONUS',
                        amount: addBalance,
                        status: 'COMPLETED',
                        description: 'Bonus admin',
                    }
                })
            ]);
        }

        return NextResponse.json({ success: true, user: updatedUser });
    } catch (error) {
        console.error('Admin update user error:', error);
        return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
    }
}
