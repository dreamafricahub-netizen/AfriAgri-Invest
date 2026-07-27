/**
 * Moteur de cotes — pari inverse sur grille de score exact.
 *
 * L'utilisateur ecarte un ou plusieurs scores. Il gagne si aucun d'eux ne
 * tombe. La cote monte avec le risque cumule des scores ecartes.
 *
 * Le modele est un Poisson bivarie independant : chaque equipe marque selon
 * une loi de Poisson d'esperance lambda. C'est le modele standard du football,
 * suffisant pour un marche de score exact, et surtout deterministe — deux
 * appels avec les memes parametres donnent exactement la meme cote.
 *
 * Aucun flottant ne sort d'ici vers la base : les cotes sortent en milliemes.
 */

/** Taille de la grille affichee. Au-dela, les scores tombent dans la queue. */
export const GRID_MAX = 5;

export interface Scoreline {
  homeGoals: number;
  awayGoals: number;
}

export interface OddsQuote {
  /** Cote en milliemes : 1,55 => 1550. */
  oddsMilli: number;
  /** Probabilite cumulee de perdre, en points de base : 39,1 % => 3910. */
  riskBp: number;
  /** Nombre de scores ecartes. */
  selectionCount: number;
}

export class OddsError extends Error {}

function factorial(n: number): number {
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

/** P(X = k) pour X ~ Poisson(lambda). */
function poisson(k: number, lambda: number): number {
  return (Math.exp(-lambda) * Math.pow(lambda, k)) / factorial(k);
}

/**
 * Grille des probabilites de chaque score exact, indexee [buts domicile][buts exterieur].
 * La somme est inferieure a 1 : le reste est la queue (scores au-dela de GRID_MAX).
 */
export function scoreGrid(lambdaHome: number, lambdaAway: number): number[][] {
  if (lambdaHome <= 0 || lambdaAway <= 0) {
    throw new OddsError('Les esperances de buts doivent etre strictement positives.');
  }

  const grid: number[][] = [];
  for (let h = 0; h <= GRID_MAX; h++) {
    const row: number[] = [];
    const pHome = poisson(h, lambdaHome);
    for (let a = 0; a <= GRID_MAX; a++) {
      row.push(pHome * poisson(a, lambdaAway));
    }
    grid.push(row);
  }
  return grid;
}

/**
 * Cote d'un pari inverse.
 *
 * @param selections   scores ecartes par le parieur
 * @param lambdaHome   esperance de buts a domicile
 * @param lambdaAway   esperance de buts a l'exterieur
 * @param marginBp     marge de l'operateur en points de base (600 = 6 %)
 * @param cashbackBp   taux de remboursement sur perte, en points de base
 *
 * Le remboursement n'est pas un cadeau : il se paie sur la cote. Son cout est
 * `cashbackBp x P(perte)`, et il est deduit de la marge disponible. Un taux
 * eleve sur un pari souvent perdant rend la cote invendable — c'est mecanique,
 * et la fonction le signale au lieu de produire une cote absurde.
 */
export function quoteInverseBet(
  selections: Scoreline[],
  lambdaHome: number,
  lambdaAway: number,
  marginBp: number,
  cashbackBp: number,
): OddsQuote {
  if (selections.length === 0) {
    throw new OddsError('Il faut ecarter au moins un score.');
  }

  const seen = new Set<string>();
  for (const s of selections) {
    if (
      !Number.isInteger(s.homeGoals) || !Number.isInteger(s.awayGoals) ||
      s.homeGoals < 0 || s.awayGoals < 0 ||
      s.homeGoals > GRID_MAX || s.awayGoals > GRID_MAX
    ) {
      throw new OddsError(`Score hors grille : ${s.homeGoals}-${s.awayGoals}`);
    }
    const key = `${s.homeGoals}-${s.awayGoals}`;
    if (seen.has(key)) throw new OddsError(`Score ecarte deux fois : ${key}`);
    seen.add(key);
  }

  const grid = scoreGrid(lambdaHome, lambdaAway);
  let pLose = 0;
  for (const s of selections) pLose += grid[s.homeGoals][s.awayGoals];

  const pWin = 1 - pLose;
  if (pWin <= 0.01) {
    throw new OddsError(
      'Trop de scores ecartes : la probabilite de gain est quasi nulle.',
    );
  }

  // Cote juste, puis retrait de la marge, puis du cout du remboursement.
  // Cout du cashback rapporte a une unite misee : cashback x P(perte).
  const fair = 1 / pWin;
  const cashbackCost = (cashbackBp / 10_000) * pLose;
  const netMargin = marginBp / 10_000 + cashbackCost;

  const offered = fair * (1 - netMargin);

  if (offered <= 1.01) {
    throw new OddsError(
      `Cote non commercialisable (${offered.toFixed(3)}). ` +
        `Le remboursement de ${(cashbackBp / 100).toFixed(0)} % consomme toute la marge ` +
        `sur ce pari. Reduire le taux, ou ecarter davantage de scores.`,
    );
  }

  return {
    oddsMilli: Math.floor(offered * 1000),
    riskBp: Math.round(pLose * 10_000),
    selectionCount: selections.length,
  };
}

/** Gain potentiel, arrondi au franc inferieur — l'ecart part au compte d'arrondi. */
export function potentialWin(stakeMinor: bigint, oddsMilli: number): bigint {
  return (stakeMinor * BigInt(oddsMilli)) / BigInt(1000);
}

/** Montant rembourse en cas de perte. */
export function cashbackAmount(stakeMinor: bigint, cashbackRateBp: number): bigint {
  return (stakeMinor * BigInt(cashbackRateBp)) / BigInt(10_000);
}

/** Le pari est perdu si l'un des scores ecartes est tombe. */
export function isBetLost(
  selections: Scoreline[],
  homeGoals: number,
  awayGoals: number,
): boolean {
  return selections.some(
    (s) => s.homeGoals === homeGoals && s.awayGoals === awayGoals,
  );
}
