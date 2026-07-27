import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { quoteInverseBet, potentialWin, OddsError, type Scoreline } from '@/lib/odds';
import { getBettingConfig, cashbackRateFor } from '@/lib/config';
import { placeBetStake, LedgerError } from '@/lib/ledger';
import { sweepInBackground } from '@/lib/settlement';

/**
 * Placement d'un pari.
 *
 * Regle absolue : la cote et le gain sont recalcules ici, a partir des
 * parametres du match stockes en base. Rien de ce que le client envoie sur ces
 * deux valeurs n'est lu. Un client modifie ne peut donc pas s'attribuer une
 * cote favorable — il ne peut que choisir sa mise et ses scores.
 */
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ message: 'Non autorise' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true, status: true },
        });
        if (!user) {
            return NextResponse.json({ message: 'Utilisateur non trouve' }, { status: 404 });
        }
        if (user.status !== 'ACTIVE') {
            return NextResponse.json({ message: 'Compte suspendu' }, { status: 403 });
        }

        const body = await req.json();
        const { fixtureId, stake, selections } = body as {
            fixtureId?: string;
            stake?: number;
            selections?: Scoreline[];
        };

        if (!fixtureId || typeof fixtureId !== 'string') {
            return NextResponse.json({ message: 'Match requis' }, { status: 400 });
        }
        if (!Array.isArray(selections) || selections.length === 0) {
            return NextResponse.json({ message: 'Ecartez au moins un score' }, { status: 400 });
        }
        if (typeof stake !== 'number' || !Number.isFinite(stake) || stake <= 0) {
            return NextResponse.json({ message: 'Mise invalide' }, { status: 400 });
        }

        const config = await getBettingConfig();
        const stakeMinor = BigInt(Math.round(stake));

        if (stakeMinor < config.stakeMin || stakeMinor > config.stakeMax) {
            return NextResponse.json({
                message: `Mise hors limites : entre ${config.stakeMin} et ${config.stakeMax} F`,
            }, { status: 400 });
        }
        if (selections.length > config.maxSelections) {
            return NextResponse.json({
                message: `Pas plus de ${config.maxSelections} scores ecartes par pari`,
            }, { status: 400 });
        }

        const fixture = await prisma.fixture.findUnique({ where: { id: fixtureId } });
        if (!fixture) {
            return NextResponse.json({ message: 'Match non trouve' }, { status: 404 });
        }
        if (fixture.status !== 'SCHEDULED') {
            return NextResponse.json({ message: 'Les paris sont fermes sur ce match' }, { status: 409 });
        }
        if (fixture.kickoffAt.getTime() <= Date.now()) {
            return NextResponse.json({ message: 'Le coup d envoi est passe' }, { status: 409 });
        }
        // Un match virtuel sans engagement scelle ne doit jamais accepter de mise.
        if (fixture.kind === 'VIRTUAL' && !fixture.resultCommitment) {
            return NextResponse.json({ message: 'Match indisponible' }, { status: 409 });
        }

        // --- Cote recalculee cote serveur ---------------------------------
        const cashbackBp = cashbackRateFor(config, selections.length);
        let quote;
        try {
            quote = quoteInverseBet(
                selections,
                fixture.lambdaHome,
                fixture.lambdaAway,
                config.marginBp,
                cashbackBp,
            );
        } catch (err) {
            if (err instanceof OddsError) {
                return NextResponse.json({ message: err.message }, { status: 400 });
            }
            throw err;
        }

        const payout = potentialWin(stakeMinor, quote.oddsMilli);

        // Le pari est cree d'abord pour disposer de son identifiant, qui sert
        // de cle d'idempotence a l'ecriture au registre.
        const bet = await prisma.bet.create({
            data: {
                userId: user.id,
                fixtureId: fixture.id,
                stakeMinor,
                oddsMilli: quote.oddsMilli,
                potentialWinMinor: payout,
                cashbackRateBp: cashbackBp,
                selections: {
                    create: selections.map((s) => ({
                        homeGoals: s.homeGoals,
                        awayGoals: s.awayGoals,
                    })),
                },
            },
        });

        try {
            await placeBetStake({
                userId: user.id,
                stakeMinor,
                betRef: bet.id,
            });
        } catch (err) {
            // La mise n'a pas pu etre engagee : le pari ne doit pas subsister.
            await prisma.bet.delete({ where: { id: bet.id } });
            if (err instanceof LedgerError) {
                return NextResponse.json({ message: err.message }, { status: 400 });
            }
            throw err;
        }

        return NextResponse.json({
            success: true,
            bet: {
                id: bet.id,
                stake: Number(stakeMinor),
                odds: quote.oddsMilli / 1000,
                potentialWin: Number(payout),
                riskPercent: quote.riskBp / 100,
                cashbackRate: cashbackBp / 100,
                selections,
            },
        });
    } catch (error) {
        console.error('Place bet error:', error);
        return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
    }
}

/** Paris de l'utilisateur connecte. */
export async function GET() {
    try {
        // Solde les matchs echus avant d'afficher la liste : le joueur qui
        // ouvre ses paris doit y voir le resultat, pas un pari encore ouvert
        // sur un match termine il y a une heure.
        sweepInBackground();

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

        const bets = await prisma.bet.findMany({
            where: { userId: user.id },
            orderBy: { placedAt: 'desc' },
            take: 50,
            include: {
                selections: { select: { homeGoals: true, awayGoals: true } },
                fixture: {
                    select: {
                        competition: true, homeTeam: true, awayTeam: true,
                        kickoffAt: true, status: true, homeGoals: true, awayGoals: true,
                    },
                },
            },
        });

        return NextResponse.json({
            bets: bets.map((b) => ({
                id: b.id,
                stake: Number(b.stakeMinor),
                odds: b.oddsMilli / 1000,
                potentialWin: Number(b.potentialWinMinor),
                cashbackRate: b.cashbackRateBp / 100,
                status: b.status,
                placedAt: b.placedAt,
                settledAt: b.settledAt,
                excluded: b.selections.map((s) => `${s.homeGoals}-${s.awayGoals}`),
                fixture: b.fixture,
            })),
        });
    } catch (error) {
        console.error('List bets error:', error);
        return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
    }
}
