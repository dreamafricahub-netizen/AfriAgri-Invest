import { prisma } from '@/lib/prisma';
import { Prisma } from '@/generated/prisma/client';
import { AccountKind } from '@/generated/prisma/enums';

/** Cible TypeScript du projet : ES2017. Les litteraux BigInt y sont interdits. */
const ZERO = BigInt(0);

/**
 * Registre en partie double.
 *
 * C'est le SEUL point d'entree autorise pour ecrire un mouvement financier.
 * Aucun code applicatif ne doit ecrire dans LedgerEntry directement, ni mettre
 * a jour un solde : un solde se calcule, il ne se pose pas.
 *
 * Convention de signe : debit positif, credit negatif.
 *   - Actifs et charges augmentent en positif
 *   - Passifs, produits et capitaux augmentent en negatif
 *   - La somme des ecritures d'une transaction vaut zero, par devise
 *
 * Montants en entiers. Le XOF n'a pas de sous-unite : l'unite est le franc.
 */

export type Currency = 'XOF' | 'XAF';

export interface EntryInput {
  accountId: string;
  /** Debit > 0, credit < 0. Jamais zero. */
  amountMinor: bigint;
  currency?: Currency;
}

export interface PostTransactionInput {
  type: string;
  /**
   * Cle d'unicite du mouvement. Derivee de la reference externe quand elle
   * existe (`momo:{transactionId}`), sinon d'une reference metier stable.
   * L'unicite est garantie par la base, pas par un SELECT prealable.
   */
  idempotencyKey: string;
  entries: EntryInput[];
  metadata?: Prisma.InputJsonValue;
  reversesId?: string;
}

export class LedgerError extends Error {}

/**
 * Ecrit une transaction et ses ecritures dans une seule transaction SQL.
 *
 * L'equilibre est verifie par une contrainte differee cote base : si la somme
 * des ecritures n'est pas nulle, le COMMIT echoue et rien n'est ecrit. La
 * verification faite ici en amont ne sert qu'a produire une erreur lisible.
 *
 * Idempotent : rejouer la meme cle ne cree pas de doublon et ne leve pas
 * d'erreur — la transaction existante est renvoyee telle quelle.
 */
export async function postTransaction(input: PostTransactionInput) {
  const { type, idempotencyKey, entries, metadata, reversesId } = input;

  if (entries.length < 2) {
    throw new LedgerError('Une transaction exige au moins deux ecritures.');
  }

  const totals = new Map<string, bigint>();
  for (const e of entries) {
    if (e.amountMinor === ZERO) {
      throw new LedgerError('Une ecriture ne peut pas etre nulle.');
    }
    const cur = e.currency ?? 'XOF';
    totals.set(cur, (totals.get(cur) ?? ZERO) + e.amountMinor);
  }
  for (const [cur, sum] of totals) {
    if (sum !== ZERO) {
      throw new LedgerError(
        `Transaction desequilibree : ecart de ${sum} en ${cur}. ` +
          `Chaque mouvement doit avoir une contrepartie.`,
      );
    }
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const ledgerTx = await tx.ledgerTransaction.create({
        data: {
          type,
          idempotencyKey,
          reversesId,
          metadata: metadata ?? {},
        },
      });

      await tx.ledgerEntry.createMany({
        data: entries.map((e) => ({
          transactionId: ledgerTx.id,
          accountId: e.accountId,
          amountMinor: e.amountMinor,
          currency: e.currency ?? 'XOF',
        })),
      });

      return ledgerTx;
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2002'
    ) {
      // Deja traite. Cas normal : les callbacks de paiement arrivent en double.
      const existing = await prisma.ledgerTransaction.findUnique({
        where: { idempotencyKey },
      });
      if (existing) return existing;
    }
    throw err;
  }
}

/**
 * Contrepasse une transaction. Rien n'est supprime : on ecrit son miroir.
 */
export async function reverseTransaction(transactionId: string, reason: string) {
  const original = await prisma.ledgerTransaction.findUnique({
    where: { id: transactionId },
    include: { entries: true },
  });
  if (!original) throw new LedgerError(`Transaction ${transactionId} introuvable.`);

  return postTransaction({
    type: `reversal:${original.type}`,
    idempotencyKey: `reversal:${transactionId}`,
    reversesId: transactionId,
    metadata: { reason },
    entries: original.entries.map((e) => ({
      accountId: e.accountId,
      amountMinor: -e.amountMinor,
      currency: e.currency as Currency,
    })),
  });
}

/** Comptes a solde debiteur normal : actifs et charges. */
const DEBIT_NORMAL: ReadonlySet<string> = new Set([
  AccountKind.PSP_FLOAT,
  AccountKind.BANK,
  AccountKind.EXPENSE,
]);

/**
 * Solde d'un compte, calcule depuis les ecritures.
 *
 * Le signe depend de la nature du compte. Un portefeuille utilisateur est un
 * passif : il se garnit par des credits, donc des ecritures negatives, et son
 * solde est l'oppose de leur somme. Un encaisse PSP est un actif : c'est
 * l'inverse. Appliquer le meme signe aux deux donne un encaisse negatif.
 */
export async function getBalance(accountId: string): Promise<bigint> {
  const account = await prisma.account.findUnique({
    where: { id: accountId },
    select: { kind: true },
  });
  if (!account) throw new LedgerError(`Compte ${accountId} introuvable.`);

  const result = await prisma.ledgerEntry.aggregate({
    where: { accountId },
    _sum: { amountMinor: true },
  });
  const sum = result._sum.amountMinor ?? ZERO;

  return DEBIT_NORMAL.has(account.kind) ? sum : -sum;
}

/** Solde du portefeuille d'un utilisateur. */
export async function getUserBalance(
  userId: string,
  currency: Currency = 'XOF',
): Promise<bigint> {
  const account = await prisma.account.findFirst({
    where: { kind: AccountKind.USER_WALLET, userId, currency },
    select: { id: true },
  });
  return account ? getBalance(account.id) : ZERO;
}

/** Portefeuille d'un utilisateur, cree a la volee s'il n'existe pas. */
export async function getOrCreateUserWallet(
  userId: string,
  currency: Currency = 'XOF',
): Promise<string> {
  const existing = await prisma.account.findFirst({
    where: { kind: AccountKind.USER_WALLET, userId, currency },
    select: { id: true },
  });
  if (existing) return existing.id;

  const created = await prisma.account.create({
    data: { kind: AccountKind.USER_WALLET, userId, currency, label: null },
    select: { id: true },
  });
  return created.id;
}

/** Compte systeme (PSP, banque, produits, charges), cree a la volee. */
export async function getOrCreateSystemAccount(
  kind: Exclude<AccountKind, 'USER_WALLET'>,
  label: string,
  currency: Currency = 'XOF',
): Promise<string> {
  const existing = await prisma.account.findFirst({
    where: { kind, label, currency, userId: null },
    select: { id: true },
  });
  if (existing) return existing.id;

  const created = await prisma.account.create({
    data: { kind, label, currency, userId: null },
    select: { id: true },
  });
  return created.id;
}

// ---------------------------------------------------------------------------
// Mouvements courants
// ---------------------------------------------------------------------------

/**
 * Depot. L'utilisateur est credite du montant qu'il a envoye ; la commission
 * du prestataire est une charge de la plateforme, pas une retenue sur le joueur.
 */
export async function recordDeposit(params: {
  userId: string;
  amountMinor: bigint;
  feeMinor?: bigint;
  provider: string;
  providerRef: string;
  currency?: Currency;
}) {
  const currency = params.currency ?? 'XOF';
  const fee = params.feeMinor ?? ZERO;

  const wallet = await getOrCreateUserWallet(params.userId, currency);
  const float = await getOrCreateSystemAccount('PSP_FLOAT', params.provider, currency);
  const fees = await getOrCreateSystemAccount('EXPENSE', 'psp_fees', currency);

  const entries: EntryInput[] = [
    { accountId: float, amountMinor: params.amountMinor - fee, currency },
    { accountId: wallet, amountMinor: -params.amountMinor, currency },
  ];
  if (fee > ZERO) entries.push({ accountId: fees, amountMinor: fee, currency });

  return postTransaction({
    type: 'deposit',
    idempotencyKey: `${params.provider}:${params.providerRef}`,
    entries,
    metadata: { userId: params.userId, provider: params.provider },
  });
}

/**
 * Demande de retrait. Les fonds quittent le portefeuille et sont immobilises
 * sur un compte d'attente : ils ne sont plus depensables par l'utilisateur,
 * mais ils ne sont pas encore sortis de la plateforme.
 *
 * Le decouvert etant interdit sur USER_WALLET, une demande superieure au solde
 * est rejetee par la base. Le controle applicatif ne sert qu'au message.
 */
export async function requestWithdrawal(params: {
  userId: string;
  amountMinor: bigint;
  requestRef: string;
  currency?: Currency;
}) {
  const currency = params.currency ?? 'XOF';

  const available = await getUserBalance(params.userId, currency);
  if (available < params.amountMinor) {
    throw new LedgerError(
      `Solde insuffisant : ${available} disponible, ${params.amountMinor} demande.`,
    );
  }

  const wallet = await getOrCreateUserWallet(params.userId, currency);
  const pending = await getOrCreateSystemAccount('PENDING_PAYOUT', 'retraits_en_attente', currency);

  return postTransaction({
    type: 'withdrawal_requested',
    idempotencyKey: `withdrawal:request:${params.requestRef}`,
    entries: [
      { accountId: wallet, amountMinor: params.amountMinor, currency },
      { accountId: pending, amountMinor: -params.amountMinor, currency },
    ],
    metadata: { userId: params.userId, requestRef: params.requestRef },
  });
}

/** Retrait effectivement verse : les fonds quittent l'encaisse du prestataire. */
export async function settleWithdrawal(params: {
  amountMinor: bigint;
  feeMinor?: bigint;
  provider: string;
  requestRef: string;
  currency?: Currency;
}) {
  const currency = params.currency ?? 'XOF';
  const fee = params.feeMinor ?? ZERO;

  const pending = await getOrCreateSystemAccount('PENDING_PAYOUT', 'retraits_en_attente', currency);
  const float = await getOrCreateSystemAccount('PSP_FLOAT', params.provider, currency);
  const fees = await getOrCreateSystemAccount('EXPENSE', 'psp_fees', currency);

  const entries: EntryInput[] = [
    { accountId: pending, amountMinor: params.amountMinor, currency },
    { accountId: float, amountMinor: -(params.amountMinor + fee), currency },
  ];
  if (fee > ZERO) entries.push({ accountId: fees, amountMinor: fee, currency });

  return postTransaction({
    type: 'withdrawal_settled',
    idempotencyKey: `withdrawal:settle:${params.requestRef}`,
    entries,
    metadata: { provider: params.provider, requestRef: params.requestRef },
  });
}

/** Retrait refuse : les fonds immobilises retournent au portefeuille. */
export async function rejectWithdrawal(params: {
  userId: string;
  amountMinor: bigint;
  requestRef: string;
  reason?: string;
  currency?: Currency;
}) {
  const currency = params.currency ?? 'XOF';

  const wallet = await getOrCreateUserWallet(params.userId, currency);
  const pending = await getOrCreateSystemAccount('PENDING_PAYOUT', 'retraits_en_attente', currency);

  return postTransaction({
    type: 'withdrawal_rejected',
    idempotencyKey: `withdrawal:reject:${params.requestRef}`,
    entries: [
      { accountId: pending, amountMinor: params.amountMinor, currency },
      { accountId: wallet, amountMinor: -params.amountMinor, currency },
    ],
    metadata: { userId: params.userId, requestRef: params.requestRef, reason: params.reason },
  });
}

// ---------------------------------------------------------------------------
// Paris
//
// La mise quitte le portefeuille mais n'est pas encore un produit : elle reste
// au passif sur UNSETTLED_BETS tant que le match n'est pas joue. Le solde de ce
// compte est l'exposition ouverte de la plateforme a tout instant.
// ---------------------------------------------------------------------------

/** Engagement d'une mise. Refuse si le portefeuille ne la couvre pas. */
export async function placeBetStake(params: {
  userId: string;
  stakeMinor: bigint;
  betRef: string;
  currency?: Currency;
}) {
  const currency = params.currency ?? 'XOF';
  if (params.stakeMinor <= ZERO) {
    throw new LedgerError('La mise doit etre strictement positive.');
  }

  const available = await getUserBalance(params.userId, currency);
  if (available < params.stakeMinor) {
    throw new LedgerError(
      `Solde insuffisant : ${available} disponible, ${params.stakeMinor} mise.`,
    );
  }

  const wallet = await getOrCreateUserWallet(params.userId, currency);
  const open = await getOrCreateSystemAccount('UNSETTLED_BETS', 'paris_en_cours', currency);

  return postTransaction({
    type: 'bet_placed',
    idempotencyKey: `bet:place:${params.betRef}`,
    entries: [
      { accountId: wallet, amountMinor: params.stakeMinor, currency },
      { accountId: open, amountMinor: -params.stakeMinor, currency },
    ],
    metadata: { userId: params.userId, betRef: params.betRef },
  });
}

/**
 * Pari gagne : la mise est liberee et le benefice sort du produit brut des
 * jeux. Le compte GGR peut passer en negatif — un operateur perd de l'argent
 * certains jours, c'est normal et ce doit rester visible.
 */
export async function settleBetWon(params: {
  userId: string;
  stakeMinor: bigint;
  payoutMinor: bigint;
  betRef: string;
  currency?: Currency;
}) {
  const currency = params.currency ?? 'XOF';
  const profit = params.payoutMinor - params.stakeMinor;
  if (profit < ZERO) {
    throw new LedgerError('Le versement d un pari gagnant ne peut pas etre inferieur a la mise.');
  }

  const wallet = await getOrCreateUserWallet(params.userId, currency);
  const open = await getOrCreateSystemAccount('UNSETTLED_BETS', 'paris_en_cours', currency);
  const ggr = await getOrCreateSystemAccount('REVENUE', 'ggr', currency);

  const entries: EntryInput[] = [
    { accountId: open, amountMinor: params.stakeMinor, currency },
    { accountId: wallet, amountMinor: -params.payoutMinor, currency },
  ];
  if (profit > ZERO) entries.push({ accountId: ggr, amountMinor: profit, currency });

  return postTransaction({
    type: 'bet_won',
    idempotencyKey: `bet:won:${params.betRef}`,
    entries,
    metadata: { userId: params.userId, betRef: params.betRef },
  });
}

/**
 * Pari perdu : la mise devient un produit. Le remboursement eventuel est ecrit
 * separement, en charge — c'est la seule facon de mesurer ce que la promesse
 * de cashback coute reellement.
 */
export async function settleBetLost(params: {
  userId: string;
  stakeMinor: bigint;
  cashbackMinor: bigint;
  betRef: string;
  currency?: Currency;
}) {
  const currency = params.currency ?? 'XOF';

  const open = await getOrCreateSystemAccount('UNSETTLED_BETS', 'paris_en_cours', currency);
  const ggr = await getOrCreateSystemAccount('REVENUE', 'ggr', currency);

  const settle = await postTransaction({
    type: 'bet_lost',
    idempotencyKey: `bet:lost:${params.betRef}`,
    entries: [
      { accountId: open, amountMinor: params.stakeMinor, currency },
      { accountId: ggr, amountMinor: -params.stakeMinor, currency },
    ],
    metadata: { userId: params.userId, betRef: params.betRef },
  });

  if (params.cashbackMinor > ZERO) {
    await creditFromExpense({
      userId: params.userId,
      amountMinor: params.cashbackMinor,
      expenseLabel: 'cashback',
      idempotencyKey: `bet:cashback:${params.betRef}`,
      metadata: { userId: params.userId, betRef: params.betRef },
    });
  }

  return settle;
}

/** Match annule : la mise revient integralement au parieur. */
export async function voidBet(params: {
  userId: string;
  stakeMinor: bigint;
  betRef: string;
  currency?: Currency;
}) {
  const currency = params.currency ?? 'XOF';

  const wallet = await getOrCreateUserWallet(params.userId, currency);
  const open = await getOrCreateSystemAccount('UNSETTLED_BETS', 'paris_en_cours', currency);

  return postTransaction({
    type: 'bet_void',
    idempotencyKey: `bet:void:${params.betRef}`,
    entries: [
      { accountId: open, amountMinor: params.stakeMinor, currency },
      { accountId: wallet, amountMinor: -params.stakeMinor, currency },
    ],
    metadata: { userId: params.userId, betRef: params.betRef },
  });
}

/**
 * Credit a la charge de la plateforme : bonus de bienvenue, geste commercial,
 * ajustement administratif.
 *
 * Ces credits sont legitimes, mais ils ne sont pas gratuits : ils s'inscrivent
 * en charge sur un compte nomme. Le cout cumule de chaque dispositif devient
 * lisible, et un ajustement administratif laisse une trace attribuable.
 */
export async function creditFromExpense(params: {
  userId: string;
  amountMinor: bigint;
  expenseLabel: string;
  idempotencyKey: string;
  metadata?: Prisma.InputJsonValue;
  currency?: Currency;
}) {
  const currency = params.currency ?? 'XOF';
  if (params.amountMinor <= ZERO) {
    throw new LedgerError('Un credit doit etre strictement positif.');
  }

  const wallet = await getOrCreateUserWallet(params.userId, currency);
  const expense = await getOrCreateSystemAccount('EXPENSE', params.expenseLabel, currency);

  return postTransaction({
    type: `credit:${params.expenseLabel}`,
    idempotencyKey: params.idempotencyKey,
    entries: [
      { accountId: expense, amountMinor: params.amountMinor, currency },
      { accountId: wallet, amountMinor: -params.amountMinor, currency },
    ],
    metadata: params.metadata ?? { userId: params.userId },
  });
}

/**
 * Distribution d'un resultat constate.
 *
 * Remplace l'ancienne tache planifiee qui creditait une constante. Le montant
 * doit provenir d'un compte alimente au prealable — produit constate, tresorerie
 * versee. Si la contrepartie n'existe pas, la transaction est refusee par la
 * base : c'est exactement le comportement recherche.
 */
export async function distributeRealisedReturn(params: {
  userId: string;
  amountMinor: bigint;
  sourceAccountId: string;
  operationRef: string;
  currency?: Currency;
}) {
  const currency = params.currency ?? 'XOF';
  if (params.amountMinor <= ZERO) {
    throw new LedgerError('Un resultat distribue doit etre strictement positif.');
  }

  // Le compte source doit reellement porter les fonds. La base refusera de
  // toute facon le decouvert sur un compte de tresorerie ; ce controle sert a
  // produire une erreur exploitable avant d'atteindre le COMMIT.
  const available = await getBalance(params.sourceAccountId);
  if (available < params.amountMinor) {
    throw new LedgerError(
      `Fonds insuffisants sur le compte source : ${available} disponible, ` +
        `${params.amountMinor} demande. Un resultat se constate apres encaissement.`,
    );
  }

  const wallet = await getOrCreateUserWallet(params.userId, currency);

  return postTransaction({
    type: 'realised_return',
    idempotencyKey: `return:${params.operationRef}:${params.userId}`,
    entries: [
      { accountId: params.sourceAccountId, amountMinor: params.amountMinor, currency },
      { accountId: wallet, amountMinor: -params.amountMinor, currency },
    ],
    metadata: { userId: params.userId, operationRef: params.operationRef },
  });
}
