import { createHash, createHmac, randomBytes } from 'crypto';

/**
 * Matchs virtuels — tirage scelle et verifiable.
 *
 * Le probleme a resoudre : si le score est tire au coup de sifflet final, le
 * systeme connait a cet instant l'exposition du livre. Meme sans intention de
 * tricher, rien ne permet de le prouver a un joueur ni a un certificateur.
 *
 * Le protocole :
 *   1. A l'ouverture du marche, on tire une graine aleatoire et on publie
 *      seulement son empreinte SHA-256. Aucune mise n'a encore ete placee.
 *   2. Les joueurs misent. La graine reste secrete, le score est deja fixe.
 *   3. Au coup de sifflet, on revele la graine. Le score en decoule de facon
 *      deterministe.
 *   4. N'importe qui peut verifier : l'empreinte de la graine revelee doit
 *      correspondre a celle publiee, et rejouer le tirage doit redonner le
 *      meme score.
 *
 * Le resultat ne peut donc pas dependre de ce qui a ete mise.
 */

/** Plafond de buts par equipe. Au-dela, la loi de Poisson est negligeable. */
const MAX_GOALS = 12;

export interface Commitment {
  /** A garder secret jusqu'au reglement. */
  seed: string;
  /** A publier des l'ouverture du marche. */
  commitment: string;
}

export interface DrawnScore {
  homeGoals: number;
  awayGoals: number;
}

/** Tire une graine et calcule son empreinte. Appele a l'ouverture du marche. */
export function createCommitment(): Commitment {
  const seed = randomBytes(32).toString('hex');
  return { seed, commitment: sha256(seed) };
}

export function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

/**
 * Uniforme dans [0, 1) derive de la graine et d'une etiquette.
 * Deux etiquettes distinctes donnent deux tirages independants.
 */
function uniform(seed: string, tag: string): number {
  const digest = createHmac('sha256', seed).update(tag).digest();
  // 48 bits : largement dans la plage exacte d'un double.
  return digest.readUIntBE(0, 6) / 2 ** 48;
}

/** Inverse de la fonction de repartition d'une loi de Poisson. */
function inversePoisson(u: number, lambda: number): number {
  let p = Math.exp(-lambda);
  let cumulative = p;
  let k = 0;

  while (u > cumulative && k < MAX_GOALS) {
    k += 1;
    p = (p * lambda) / k;
    cumulative += p;
  }
  return k;
}

/**
 * Rejoue le tirage. Deterministe : memes entrees, meme score, toujours.
 *
 * Les deux equipes sont tirees independamment, exactement selon le modele qui
 * a servi a calculer les cotes. Un score cote a 12,5 % tombe donc dans 12,5 %
 * des cas — la grille affichee au joueur n'est pas decorative.
 */
export function deriveScore(
  seed: string,
  lambdaHome: number,
  lambdaAway: number,
): DrawnScore {
  return {
    homeGoals: inversePoisson(uniform(seed, 'home'), lambdaHome),
    awayGoals: inversePoisson(uniform(seed, 'away'), lambdaAway),
  };
}

/**
 * Verification publique. C'est cette fonction qui doit etre exposee par une
 * route publique : donnez-lui ce que la plateforme a annonce, elle repond.
 */
export function verifyDraw(params: {
  seed: string;
  commitment: string;
  lambdaHome: number;
  lambdaAway: number;
  homeGoals: number;
  awayGoals: number;
}): { valid: boolean; reason?: string } {
  if (sha256(params.seed) !== params.commitment) {
    return { valid: false, reason: "L'empreinte ne correspond pas a la graine revelee." };
  }

  const drawn = deriveScore(params.seed, params.lambdaHome, params.lambdaAway);
  if (drawn.homeGoals !== params.homeGoals || drawn.awayGoals !== params.awayGoals) {
    return {
      valid: false,
      reason:
        `Le score annonce (${params.homeGoals}-${params.awayGoals}) ne decoule pas ` +
        `de la graine, qui donne ${drawn.homeGoals}-${drawn.awayGoals}.`,
    };
  }

  return { valid: true };
}
