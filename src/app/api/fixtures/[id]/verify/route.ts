import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyDraw } from '@/lib/virtual';

/**
 * Verification publique d'un tirage virtuel.
 *
 * Route volontairement ouverte, sans authentification : n'importe qui doit
 * pouvoir controler qu'un resultat annonce decoulait bien d'une graine scellee
 * avant l'ouverture des paris. Une preuve que seul l'operateur peut consulter
 * n'est pas une preuve.
 *
 * La graine n'est revelee qu'apres la fin du match. Avant, elle reste secrete —
 * sinon le score serait connu de tous pendant la prise de paris.
 */
export async function GET(
    _req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params;

        const fixture = await prisma.fixture.findUnique({
            where: { id },
            select: {
                id: true, kind: true, status: true,
                competition: true, homeTeam: true, awayTeam: true,
                kickoffAt: true, lambdaHome: true, lambdaAway: true,
                homeGoals: true, awayGoals: true,
                resultSeed: true, resultCommitment: true,
            },
        });

        if (!fixture) {
            return NextResponse.json({ message: 'Match non trouve' }, { status: 404 });
        }

        if (fixture.kind !== 'VIRTUAL') {
            return NextResponse.json({
                message: 'Ce match est reel : son resultat provient du terrain, pas d un tirage.',
            }, { status: 400 });
        }

        const base = {
            fixtureId: fixture.id,
            match: `${fixture.homeTeam} — ${fixture.awayTeam}`,
            competition: fixture.competition,
            kickoffAt: fixture.kickoffAt,
            commitment: fixture.resultCommitment,
            model: { lambdaHome: fixture.lambdaHome, lambdaAway: fixture.lambdaAway },
        };

        if (fixture.status !== 'FINISHED' || !fixture.resultSeed) {
            return NextResponse.json({
                ...base,
                revealed: false,
                message:
                    "La graine sera revelee au coup de sifflet final. L'empreinte ci-dessus " +
                    'est publiee depuis l ouverture des paris : notez-la pour pouvoir verifier.',
            });
        }

        const check = verifyDraw({
            seed: fixture.resultSeed,
            commitment: fixture.resultCommitment!,
            lambdaHome: fixture.lambdaHome,
            lambdaAway: fixture.lambdaAway,
            homeGoals: fixture.homeGoals!,
            awayGoals: fixture.awayGoals!,
        });

        return NextResponse.json({
            ...base,
            revealed: true,
            seed: fixture.resultSeed,
            score: `${fixture.homeGoals}-${fixture.awayGoals}`,
            valid: check.valid,
            reason: check.reason,
            howToVerify: {
                step1: 'sha256(seed) doit egaler commitment',
                step2:
                    'HMAC-SHA256(seed, "home") et (seed, "away"), 6 premiers octets / 2^48, ' +
                    'puis inversion de la loi de Poisson avec lambdaHome et lambdaAway',
            },
        });
    } catch (error) {
        console.error('Verify draw error:', error);
        return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
    }
}
