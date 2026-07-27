import { prisma } from '@/lib/prisma';

/**
 * Parametres d'exploitation, stockes en base.
 *
 * Ces valeurs pilotent directement l'argent : la marge determine chaque cote,
 * le remboursement determine chaque perte. Elles ne doivent pas etre figees
 * dans le code — un ajustement commercial ne doit pas exiger un deploiement.
 *
 * Les valeurs par defaut ci-dessous s'appliquent tant que rien n'est ecrit en
 * base. Elles sont volontairement prudentes.
 */

export const CONFIG_KEYS = {
  /** Marge de l'operateur, en points de base. 600 = 6 %. */
  MARGIN_BP: 'betting.margin_bp',
  /** Remboursement sur perte, en points de base. 0 = desactive. */
  CASHBACK_BP: 'betting.cashback_bp',
  /** Nombre minimal de scores ecartes pour ouvrir droit au remboursement. */
  CASHBACK_MIN_SELECTIONS: 'betting.cashback_min_selections',
  /** Mise minimale, en francs. */
  STAKE_MIN: 'betting.stake_min',
  /** Mise maximale, en francs. */
  STAKE_MAX: 'betting.stake_max',
  /** Nombre maximal de scores ecartes sur un meme pari. */
  MAX_SELECTIONS: 'betting.max_selections',
} as const;

const DEFAULTS: Record<string, number> = {
  [CONFIG_KEYS.MARGIN_BP]: 600,
  [CONFIG_KEYS.CASHBACK_BP]: 0,
  [CONFIG_KEYS.CASHBACK_MIN_SELECTIONS]: 3,
  [CONFIG_KEYS.STAKE_MIN]: 500,
  [CONFIG_KEYS.STAKE_MAX]: 500_000,
  [CONFIG_KEYS.MAX_SELECTIONS]: 12,
};

export interface BettingConfig {
  marginBp: number;
  cashbackBp: number;
  cashbackMinSelections: number;
  stakeMin: bigint;
  stakeMax: bigint;
  maxSelections: number;
}

/** Lit tous les parametres de pari en une requete. */
export async function getBettingConfig(): Promise<BettingConfig> {
  const keys = Object.values(CONFIG_KEYS);
  const rows = await prisma.settings.findMany({ where: { key: { in: [...keys] } } });

  const read = (key: string): number => {
    const row = rows.find((r) => r.key === key);
    if (!row) return DEFAULTS[key];
    const parsed = Number(row.value);
    return Number.isFinite(parsed) ? parsed : DEFAULTS[key];
  };

  return {
    marginBp: read(CONFIG_KEYS.MARGIN_BP),
    cashbackBp: read(CONFIG_KEYS.CASHBACK_BP),
    cashbackMinSelections: read(CONFIG_KEYS.CASHBACK_MIN_SELECTIONS),
    stakeMin: BigInt(Math.round(read(CONFIG_KEYS.STAKE_MIN))),
    stakeMax: BigInt(Math.round(read(CONFIG_KEYS.STAKE_MAX))),
    maxSelections: read(CONFIG_KEYS.MAX_SELECTIONS),
  };
}

/**
 * Taux de remboursement applicable a un pari donne.
 *
 * En dessous du seuil de scores ecartes, la marge ne finance pas le
 * remboursement : le moteur de cotes refuserait la cote. On renvoie donc zero
 * plutot que de laisser le calcul echouer.
 */
export function cashbackRateFor(config: BettingConfig, selectionCount: number): number {
  if (config.cashbackBp <= 0) return 0;
  return selectionCount >= config.cashbackMinSelections ? config.cashbackBp : 0;
}
