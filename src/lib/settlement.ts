import { prisma } from '@/lib/prisma';
import { isBetLost, cashbackAmount, type Scoreline } from '@/lib/odds';
import { deriveScore, verifyDraw } from '@/lib/virtual';
import { settleBetWon, settleBetLost, voidBet, LedgerError } from '@/lib/ledger';

/**
 * Reglement des paris.
 *
 * Le reglement est declenche par le resultat d'un match, jamais par le temps
 * qui passe. C'est la difference de fond avec l'ancien moteur : rien n'est
 * distribue si aucun match n'est termine.
 *
 * La fonction est idempotente a deux niveaux : les paris deja regles sont
 * ignores, et chaque ecriture au registre porte une cle derivee de l'identifiant
 * du pari. Relancer le reglement d'un match ne double aucun versement.
 */

export interface SettlementReport {
  fixtureId: string;
  homeGoals: number;
  awayGoals: number;
  won: number;
  lost: number;
  voided: number;
  failed: { betId: string; reason: string }[];
  paidOutMinor: bigint;
  cashbackMinor: bigint;
}

export class SettlementError extends Error {}

/**
 * Cloture un match virtuel : revele la graine, en derive le score, l'inscrit.
 * A appeler au coup de sifflet final.
 */
export async function closeVirtualFixture(fixtureId: string) {
  const fixture = await prisma.fixture.findUnique({ where: { id: fixtureId } });
  if (!fixture) throw new SettlementError(`Match ${fixtureId} introuvable.`);
  if (fixture.kind !== 'VIRTUAL') {
    throw new SettlementError('Seul un match virtuel se cloture par revelation.');
  }
  if (fixture.status === 'FINISHED') return fixture;
  if (!fixture.resultSeed || !fixture.resultCommitment) {
    throw new SettlementError(
      `Match ${fixtureId} sans tirage scelle. Il n'aurait pas du accepter de mises.`,
    );
  }

  const score = deriveScore(fixture.resultSeed, fixture.lambdaHome, fixture.lambdaAway);

  // Controle de coherence : on verifie notre propre publication avant de
  // l'opposer aux joueurs.
  const check = verifyDraw({
    seed: fixture.resultSeed,
    commitment: fixture.resultCommitment,
    lambdaHome: fixture.lambdaHome,
    lambdaAway: fixture.lambdaAway,
    ...score,
  });
  if (!check.valid) {
    throw new SettlementError(`Tirage incoherent sur ${fixtureId} : ${check.reason}`);
  }

  return prisma.fixture.update({
    where: { id: fixtureId },
    data: {
      status: 'FINISHED',
      homeGoals: score.homeGoals,
      awayGoals: score.awayGoals,
    },
  });
}

/** Inscrit le resultat d'un match reel, importe d'un fournisseur. */
export async function closeRealFixture(
  fixtureId: string,
  homeGoals: number,
  awayGoals: number,
) {
  if (!Number.isInteger(homeGoals) || !Number.isInteger(awayGoals) ||
      homeGoals < 0 || awayGoals < 0) {
    throw new SettlementError('Score invalide.');
  }

  const fixture = await prisma.fixture.findUnique({ where: { id: fixtureId } });
  if (!fixture) throw new SettlementError(`Match ${fixtureId} introuvable.`);
  if (fixture.kind !== 'REAL') {
    throw new SettlementError('Un match virtuel ne recoit pas de score importe.');
  }
  if (fixture.status === 'FINISHED') {
    if (fixture.homeGoals !== homeGoals || fixture.awayGoals !== awayGoals) {
      throw new SettlementError(
        `Le match ${fixtureId} est deja clos sur ${fixture.homeGoals}-${fixture.awayGoals}. ` +
          `Une correction passe par une contrepassation, pas par une reecriture.`,
      );
    }
    return fixture;
  }

  return prisma.fixture.update({
    where: { id: fixtureId },
    data: { status: 'FINISHED', homeGoals, awayGoals },
  });
}

/**
 * Solde tous les paris ouverts d'un match termine.
 *
 * Chaque pari est traite isolement : l'echec de l'un n'empeche pas les autres
 * d'etre regles, et il est remonte dans le rapport plutot que d'interrompre le
 * traitement. Un match annule rend les mises integralement.
 */
export async function settleFixture(fixtureId: string): Promise<SettlementReport> {
  const fixture = await prisma.fixture.findUnique({
    where: { id: fixtureId },
    include: { bets: { where: { status: 'OPEN' }, include: { selections: true } } },
  });

  if (!fixture) throw new SettlementError(`Match ${fixtureId} introuvable.`);

  const cancelled = fixture.status === 'CANCELLED';
  if (!cancelled && fixture.status !== 'FINISHED') {
    throw new SettlementError(
      `Match ${fixtureId} non termine (${fixture.status}). Rien a regler.`,
    );
  }
  if (!cancelled && (fixture.homeGoals === null || fixture.awayGoals === null)) {
    throw new SettlementError(`Match ${fixtureId} termine sans score.`);
  }

  const report: SettlementReport = {
    fixtureId,
    homeGoals: fixture.homeGoals ?? -1,
    awayGoals: fixture.awayGoals ?? -1,
    won: 0,
    lost: 0,
    voided: 0,
    failed: [],
    paidOutMinor: BigInt(0),
    cashbackMinor: BigInt(0),
  };

  for (const bet of fixture.bets) {
    try {
      if (cancelled) {
        await voidBet({
          userId: bet.userId,
          stakeMinor: bet.stakeMinor,
          betRef: bet.id,
        });
        await markSettled(bet.id, 'VOID');
        report.voided += 1;
        continue;
      }

      const selections: Scoreline[] = bet.selections.map((s) => ({
        homeGoals: s.homeGoals,
        awayGoals: s.awayGoals,
      }));

      const lost = isBetLost(selections, fixture.homeGoals!, fixture.awayGoals!);

      if (lost) {
        const cashback = cashbackAmount(bet.stakeMinor, bet.cashbackRateBp);
        await settleBetLost({
          userId: bet.userId,
          stakeMinor: bet.stakeMinor,
          cashbackMinor: cashback,
          betRef: bet.id,
        });
        await markSettled(bet.id, 'LOST');
        report.lost += 1;
        report.cashbackMinor += cashback;
      } else {
        await settleBetWon({
          userId: bet.userId,
          stakeMinor: bet.stakeMinor,
          payoutMinor: bet.potentialWinMinor,
          betRef: bet.id,
        });
        await markSettled(bet.id, 'WON');
        report.won += 1;
        report.paidOutMinor += bet.potentialWinMinor;
      }
    } catch (err) {
      report.failed.push({
        betId: bet.id,
        reason: err instanceof LedgerError || err instanceof Error
          ? err.message
          : String(err),
      });
    }
  }

  if (!cancelled && report.failed.length === 0) {
    await prisma.fixture.update({
      where: { id: fixtureId },
      data: { settledAt: new Date() },
    });
  }

  return report;
}

async function markSettled(betId: string, status: 'WON' | 'LOST' | 'VOID') {
  await prisma.bet.update({
    where: { id: betId },
    data: { status, settledAt: new Date() },
  });
}

// ---------------------------------------------------------------------------
// Balayage : clotures et reglements en attente
// ---------------------------------------------------------------------------

/**
 * Cloture les matchs echus et solde les paris qui restent ouverts.
 *
 * Appele par le cron, et aussi de facon opportuniste a chaque lecture de l'API.
 * Ce second declencheur est ce qui permet de fonctionner sans plan payant : les
 * matchs virtuels s'enchainent toutes les 90 minutes, alors qu'un cron gratuit
 * ne tourne qu'une fois par jour. Des qu'un utilisateur ouvre l'application, le
 * retard est rattrape.
 *
 * Toutes les operations sont idempotentes : un match deja clos est ignore, un
 * pari deja regle aussi.
 */
export async function settleDueFixtures() {
  const now = new Date();
  const closed: string[] = [];
  const failed: { fixtureId: string; reason: string }[] = [];

  const dueVirtual = await prisma.fixture.findMany({
    where: { kind: 'VIRTUAL', status: 'SCHEDULED', kickoffAt: { lte: now } },
    select: { id: true },
  });

  for (const f of dueVirtual) {
    try {
      await closeVirtualFixture(f.id);
      closed.push(f.id);
    } catch (err) {
      failed.push({ fixtureId: f.id, reason: err instanceof Error ? err.message : String(err) });
    }
  }

  const toSettle = await prisma.fixture.findMany({
    where: {
      status: { in: ['FINISHED', 'CANCELLED'] },
      bets: { some: { status: 'OPEN' } },
    },
    select: { id: true },
  });

  const reports: SettlementReport[] = [];
  for (const f of toSettle) {
    try {
      reports.push(await settleFixture(f.id));
    } catch (err) {
      failed.push({ fixtureId: f.id, reason: err instanceof Error ? err.message : String(err) });
    }
  }

  return {
    closedFixtures: closed.length,
    settledFixtures: reports.length,
    betsWon: reports.reduce((s, r) => s + r.won, 0),
    betsLost: reports.reduce((s, r) => s + r.lost, 0),
    betsVoided: reports.reduce((s, r) => s + r.voided, 0),
    paidOut: reports.reduce((s, r) => s + Number(r.paidOutMinor), 0),
    failed,
    timestamp: now.toISOString(),
  };
}

/**
 * Etranglement du balayage opportuniste.
 *
 * L'etat est propre a chaque instance serverless, donc le balayage peut tourner
 * plusieurs fois en parallele. Ce n'est pas un probleme : les ecritures portent
 * une cle d'idempotence, un double reglement est refuse par la base.
 */
let lastSweepAt = 0;
const SWEEP_INTERVAL_MS = 60_000;

/**
 * A appeler depuis les routes de lecture. Ne bloque jamais la reponse et
 * n'echoue jamais la requete : un balayage rate sera retente au prochain appel.
 */
export function sweepInBackground(): void {
  const now = Date.now();
  if (now - lastSweepAt < SWEEP_INTERVAL_MS) return;
  lastSweepAt = now;

  void settleDueFixtures().catch((err) => {
    console.error('Balayage de reglement echoue :', err);
  });
}
