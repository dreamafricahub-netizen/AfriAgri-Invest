import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PACKS } from '@/utils/packs';

// This API can be called by a cron job service (e.g., Vercel Cron, cron-job.org)
// or manually by admin to process daily gains for all active investments

export async function GET(req: Request) {
    try {
        // Optional: Add a secret key for security
        const { searchParams } = new URL(req.url);
        const secret = searchParams.get('secret');

        // You can set CRON_SECRET in your environment variables for security
        const expectedSecret = process.env.CRON_SECRET;
        if (expectedSecret && secret !== expectedSecret) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        // Find all active investments where lastGainDate is more than 24 hours ago
        const investments = await prisma.investment.findMany({
            where: {
                status: 'ACTIVE',
                lastGainDate: {
                    lt: oneDayAgo
                }
            },
            include: {
                user: {
                    select: { id: true, name: true, email: true }
                }
            }
        });

        let processedCount = 0;
        let totalGainsDistributed = 0;

        for (const investment of investments) {
            const pack = PACKS.find(p => p.id === investment.packId);
            if (!pack) continue;

            const dailyGain = pack.dailyGain;

            // Calculate how many days of gains are due (in case cron missed some days)
            const timeDiff = now.getTime() - new Date(investment.lastGainDate).getTime();
            const daysDue = Math.floor(timeDiff / (24 * 60 * 60 * 1000));

            if (daysDue < 1) continue;

            // Cap at 7 days to prevent abuse if cron was down for too long
            const daysToProcess = Math.min(daysDue, 7);
            const totalGain = dailyGain * daysToProcess;

            // Credit the gain to user's balance and update lastGainDate
            await prisma.$transaction([
                // Add gain to user balance
                prisma.user.update({
                    where: { id: investment.userId },
                    data: { balance: { increment: totalGain } }
                }),
                // Create gain transaction(s)
                prisma.transaction.create({
                    data: {
                        userId: investment.userId,
                        type: 'GAIN',
                        amount: totalGain,
                        status: 'COMPLETED',
                        description: daysToProcess > 1
                            ? `Gains de ${daysToProcess} jours - ${pack.name}`
                            : `Gain journalier - ${pack.name}`
                    }
                }),
                // Update lastGainDate
                prisma.investment.update({
                    where: { id: investment.id },
                    data: { lastGainDate: now }
                })
            ]);

            processedCount++;
            totalGainsDistributed += totalGain;
        }

        return NextResponse.json({
            success: true,
            message: `Traitement termine`,
            processedInvestments: processedCount,
            totalGainsDistributed,
            timestamp: now.toISOString()
        });

    } catch (error) {
        console.error('Daily gains processing error:', error);
        return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
    }
}

// POST method for admin manual trigger
export async function POST(req: Request) {
    // Redirect to GET handler
    return GET(req);
}
