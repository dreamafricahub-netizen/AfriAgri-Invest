import { NextResponse } from 'next/server';
import { settleDueFixtures } from '@/lib/settlement';

/**
 * Cloture et reglement des matchs echus.
 *
 * Remplace l'ancien cron de gains journaliers. La difference de fond : ce
 * traitement ne distribue rien de lui-meme. Il constate des resultats, puis
 * solde les paris ouverts en consequence. Si aucun match n'est termine, il ne
 * se passe rien.
 *
 * Ce cron n'est qu'un filet de securite : le plan gratuit de Vercel ne permet
 * qu'une execution par jour, alors que les matchs virtuels s'enchainent toutes
 * les 90 minutes. Le vrai declencheur est le balayage opportuniste, execute a
 * chaque lecture de l'API (voir sweepInBackground).
 */
export async function GET(req: Request) {
    try {
        const expected = process.env.CRON_SECRET;
        if (expected) {
            const provided =
                new URL(req.url).searchParams.get('secret') ??
                req.headers.get('authorization')?.replace('Bearer ', '');
            if (provided !== expected) {
                return NextResponse.json({ message: 'Non autorise' }, { status: 401 });
            }
        }

        return NextResponse.json({ success: true, ...(await settleDueFixtures()) });
    } catch (error) {
        console.error('Settlement cron error:', error);
        return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
    }
}
