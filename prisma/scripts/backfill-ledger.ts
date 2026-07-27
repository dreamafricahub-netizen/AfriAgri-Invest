/**
 * Reprise des soldes existants dans le registre.
 *
 *   npx tsx prisma/scripts/backfill-ledger.ts            (simulation)
 *   npx tsx prisma/scripts/backfill-ledger.ts --commit   (ecriture)
 *
 * Chaque solde User.balance est repris par une transaction d'ouverture dont la
 * contrepartie est le compte OPENING_BALANCE. Rien n'est invente : on constate
 * l'existant a un instant T, et a partir de la tout mouvement exige une
 * contrepartie.
 *
 * Idempotent — cle `opening:{userId}`. Le rejouer ne cree pas de doublon.
 *
 * Point d'attention : User.balance est un Float. Les montants sont arrondis au
 * franc (le XOF n'a pas de sous-unite). L'ecart d'arrondi cumule est affiche.
 *
 * Le script est volontairement autonome : il n'importe pas src/lib/* afin de
 * tourner sous tsx sans resolution des alias TypeScript.
 */

import './_env';
import { PrismaClient } from '../../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const ZERO = BigInt(0);
const CURRENCY = 'XOF';

if (!process.env.DATABASE_URL) {
  console.error('\n  DATABASE_URL absent. Renseignez-le dans .env.local.\n');
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const commit = process.argv.slice(2).includes('--commit');

async function getOrCreateAccount(
  kind: 'USER_WALLET' | 'OPENING_BALANCE',
  userId: string | null,
  label: string | null,
): Promise<string> {
  const existing = await prisma.account.findFirst({
    where: { kind, userId, label, currency: CURRENCY },
    select: { id: true },
  });
  if (existing) return existing.id;

  const created = await prisma.account.create({
    data: { kind, userId, label, currency: CURRENCY },
    select: { id: true },
  });
  return created.id;
}

async function main() {
  console.log('');
  console.log('  Reprise des soldes dans le registre');
  console.log('  Mode :', commit ? 'ECRITURE' : 'SIMULATION (--commit pour ecrire)');
  console.log('  ' + '-'.repeat(58));

  const users = await prisma.user.findMany({
    select: { id: true, email: true, balance: true },
    orderBy: { createdAt: 'asc' },
  });

  if (users.length === 0) {
    console.log('  Aucun utilisateur. Rien a reprendre.');
    console.log('');
    return;
  }

  let totalMinor = ZERO;
  let driftCentimes = 0;
  let written = 0;
  let skipped = 0;
  let alreadyDone = 0;
  const negatives: string[] = [];

  const openingId = commit
    ? await getOrCreateAccount('OPENING_BALANCE', null, 'reprise_initiale')
    : '(simulation)';

  for (const user of users) {
    const raw = user.balance ?? 0;
    const rounded = Math.round(raw);
    driftCentimes += Math.round((raw - rounded) * 100);

    if (rounded < 0) negatives.push(`${user.email} : ${rounded}`);

    if (rounded === 0) {
      skipped++;
      continue;
    }

    const amount = BigInt(rounded);
    totalMinor += amount;

    if (!commit) {
      written++;
      continue;
    }

    const key = `opening:${user.id}`;
    const seen = await prisma.ledgerTransaction.findUnique({
      where: { idempotencyKey: key },
      select: { id: true },
    });
    if (seen) {
      alreadyDone++;
      continue;
    }

    const wallet = await getOrCreateAccount('USER_WALLET', user.id, null);

    await prisma.$transaction(async (tx) => {
      const ledgerTx = await tx.ledgerTransaction.create({
        data: {
          type: 'opening_balance',
          idempotencyKey: key,
          metadata: {
            source: 'User.balance',
            rawValue: raw,
            takenAt: new Date().toISOString(),
          },
        },
      });

      await tx.ledgerEntry.createMany({
        data: [
          { transactionId: ledgerTx.id, accountId: openingId, amountMinor: amount, currency: CURRENCY },
          { transactionId: ledgerTx.id, accountId: wallet, amountMinor: -amount, currency: CURRENCY },
        ],
      });
    });

    written++;
  }

  console.log('');
  console.log('  Utilisateurs lus        :', users.length);
  console.log('  Soldes repris           :', written);
  console.log('  Deja repris, ignores    :', alreadyDone);
  console.log('  Soldes nuls, ignores    :', skipped);
  console.log('  Total repris            :', totalMinor.toString(), CURRENCY);

  if (driftCentimes !== 0) {
    console.log(
      '  Ecart d arrondi cumule  :',
      (driftCentimes / 100).toFixed(2),
      CURRENCY + '  (conversion Float -> entier)',
    );
  }

  if (negatives.length > 0) {
    console.log('');
    console.log('  ATTENTION — soldes negatifs detectes :');
    negatives.forEach((n) => console.log('     ', n));
    console.log('  Un portefeuille utilisateur ne devrait pas etre debiteur.');
    console.log('  A examiner avant toute mise en service.');
  }

  console.log('');
  if (!commit) {
    console.log('  Simulation. Rien n a ete ecrit.');
    console.log('  Relancer avec --commit pour appliquer.');
  } else {
    console.log('  Termine. Les soldes sont dans le registre.');
    console.log('  Etape suivante : basculer les lectures vers getUserBalance(),');
    console.log('  puis retirer la colonne User.balance.');
  }
  console.log('');
}

main()
  .catch((e) => {
    console.error('\n  Echec :', e instanceof Error ? e.message : e, '\n');
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
