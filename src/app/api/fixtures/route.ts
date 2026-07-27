import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { scoreGrid, GRID_MAX } from '@/lib/odds';
import { getBettingConfig } from '@/lib/config';
import { sweepInBackground } from '@/lib/settlement';

/**
 * Matchs ouverts aux paris, avec leur grille de probabilites.
 *
 * La grille est envoyee au client pour qu'il puisse afficher une cote
 * indicative en temps reel pendant que le joueur coche des cases. Cette cote
 * est purement indicative : celle qui compte est recalculee au placement.
 *
 * La marge est publiee. C'est un choix : le joueur doit pouvoir savoir ce qu'on
 * lui prend, et le verifier contre n'importe quel autre operateur.
 */
export async function GET(req: Request) {
    try {
        // Rattrape les matchs echus. Ne bloque pas la reponse.
        sweepInBackground();

        const { searchParams } = new URL(req.url);
        const kind = searchParams.get('kind'); // REAL | VIRTUAL | null

        const config = await getBettingConfig();

        const fixtures = await prisma.fixture.findMany({
            where: {
                status: 'SCHEDULED',
                kickoffAt: { gt: new Date() },
                ...(kind === 'REAL' || kind === 'VIRTUAL' ? { kind } : {}),
            },
            orderBy: { kickoffAt: 'asc' },
            take: 40,
        });

        return NextResponse.json({
            marginPercent: config.marginBp / 100,
            cashbackPercent: config.cashbackBp / 100,
            cashbackMinSelections: config.cashbackMinSelections,
            stakeMin: Number(config.stakeMin),
            stakeMax: Number(config.stakeMax),
            gridMax: GRID_MAX,
            fixtures: fixtures.map((f) => ({
                id: f.id,
                kind: f.kind,
                competition: f.competition,
                homeTeam: f.homeTeam,
                awayTeam: f.awayTeam,
                kickoffAt: f.kickoffAt,
                // Probabilites en points de base, pour eviter tout flottant en transit.
                grid: scoreGrid(f.lambdaHome, f.lambdaAway).map((row) =>
                    row.map((p) => Math.round(p * 10_000)),
                ),
                // Publie des l'ouverture : le joueur peut le noter avant de miser.
                resultCommitment: f.resultCommitment,
            })),
        });
    } catch (error) {
        console.error('List fixtures error:', error);
        return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
    }
}
