/**
 * Verification des garde-fous du registre.
 *
 *   npx tsx prisma/scripts/check-guardrails.ts
 *
 * Chaque test tente une operation qui DOIT etre refusee par la base. Un test
 * qui passe est un echec : cela signifie qu'un solde peut etre credite sans
 * contrepartie, ou qu'une ecriture passee peut etre reecrite.
 *
 * A rejouer apres toute migration.
 */

import './_env';
import { Pool } from 'pg';

if (!process.env.DATABASE_URL) {
  console.error('\n  DATABASE_URL absent.\n');
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

let passed = 0;
let failed = 0;

/** Le test reussit si la base REFUSE l'operation. */
async function mustReject(label: string, fn: (c: any) => Promise<void>) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await fn(client);
    await client.query('COMMIT');
    console.log(`    ECHEC   ${label}`);
    console.log(`            L'operation a ete ACCEPTEE alors qu'elle devait etre refusee.`);
    failed++;
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    const msg = (e instanceof Error ? e.message : String(e)).split('\n')[0];
    console.log(`    OK      ${label}`);
    console.log(`            refuse : ${msg.slice(0, 92)}`);
    passed++;
  } finally {
    client.release();
  }
}

async function setup(client: any) {
  await client.query(`
    INSERT INTO "Account" ("id","kind","currency","label","createdAt")
    VALUES ('acc_wallet_test','USER_WALLET','XOF',NULL,now()),
           ('acc_expense_test','EXPENSE','XOF','test',now())
    ON CONFLICT DO NOTHING
  `);
}

async function main() {
  console.log('\n  Garde-fous du registre');
  console.log('  ' + '-'.repeat(70));

  const c = await pool.connect();
  await setup(c);
  c.release();

  await mustReject('Crediter un solde sans contrepartie', async (client) => {
    await client.query(`
      INSERT INTO "LedgerTransaction" ("id","type","idempotencyKey","metadata","createdAt")
      VALUES ('tx_fraud_1','fraude','fraude-1','{}',now())
    `);
    await client.query(`
      INSERT INTO "LedgerEntry" ("id","transactionId","accountId","amountMinor","currency")
      VALUES ('e_fraud_1','tx_fraud_1','acc_wallet_test',-1000000,'XOF')
    `);
  });

  await mustReject('Ecriture de montant nul', async (client) => {
    await client.query(`
      INSERT INTO "LedgerTransaction" ("id","type","idempotencyKey","metadata","createdAt")
      VALUES ('tx_zero','zero','zero-1','{}',now())
    `);
    await client.query(`
      INSERT INTO "LedgerEntry" ("id","transactionId","accountId","amountMinor","currency")
      VALUES ('e_zero','tx_zero','acc_wallet_test',0,'XOF')
    `);
  });

  await mustReject('Portefeuille utilisateur en decouvert', async (client) => {
    await client.query(`
      INSERT INTO "LedgerTransaction" ("id","type","idempotencyKey","metadata","createdAt")
      VALUES ('tx_over','decouvert','over-1','{}',now())
    `);
    await client.query(`
      INSERT INTO "LedgerEntry" ("id","transactionId","accountId","amountMinor","currency")
      VALUES ('e_over_1','tx_over','acc_wallet_test',5000,'XOF'),
             ('e_over_2','tx_over','acc_expense_test',-5000,'XOF')
    `);
  });

  await mustReject('Devise incoherente avec le compte', async (client) => {
    await client.query(`
      INSERT INTO "LedgerTransaction" ("id","type","idempotencyKey","metadata","createdAt")
      VALUES ('tx_cur','devise','cur-1','{}',now())
    `);
    await client.query(`
      INSERT INTO "LedgerEntry" ("id","transactionId","accountId","amountMinor","currency")
      VALUES ('e_cur_1','tx_cur','acc_wallet_test',-1000,'XAF'),
             ('e_cur_2','tx_cur','acc_expense_test',1000,'XAF')
    `);
  });

  // Ecriture valide, pour pouvoir tenter de la modifier ensuite.
  const c2 = await pool.connect();
  await c2.query(`
    INSERT INTO "LedgerTransaction" ("id","type","idempotencyKey","metadata","createdAt")
    VALUES ('tx_valid','valide','valide-1','{}',now())
    ON CONFLICT DO NOTHING
  `);
  await c2.query(`
    INSERT INTO "LedgerEntry" ("id","transactionId","accountId","amountMinor","currency")
    VALUES ('e_valid_1','tx_valid','acc_expense_test',7000,'XOF'),
           ('e_valid_2','tx_valid','acc_wallet_test',-7000,'XOF')
    ON CONFLICT DO NOTHING
  `);
  c2.release();

  await mustReject('Modifier une ecriture passee', async (client) => {
    await client.query(`UPDATE "LedgerEntry" SET "amountMinor" = 999999 WHERE "id" = 'e_valid_2'`);
  });

  await mustReject('Supprimer une ecriture passee', async (client) => {
    await client.query(`DELETE FROM "LedgerEntry" WHERE "id" = 'e_valid_2'`);
  });

  await mustReject('Rejouer la meme cle d idempotence', async (client) => {
    await client.query(`
      INSERT INTO "LedgerTransaction" ("id","type","idempotencyKey","metadata","createdAt")
      VALUES ('tx_dup','doublon','valide-1','{}',now())
    `);
  });

  // Un utilisateur et un match reels sont necessaires : un INSERT ... SELECT sur
  // une table vide n'insere rien et ne declenche donc aucune contrainte.
  const c4 = await pool.connect();
  await c4.query(`
    INSERT INTO "User" ("id","email","password","balance","referralCode","createdAt","updatedAt")
    VALUES ('user_test','test@zoofoot.local','x',0,'TESTCODE',now(),now())
    ON CONFLICT DO NOTHING
  `);
  const fx = await c4.query(`SELECT "id" FROM "Fixture" LIMIT 1`);
  const fixtureId: string | undefined = fx.rows[0]?.id;
  c4.release();

  if (!fixtureId) {
    console.log('    IGNORE  Contraintes sur les paris (aucun match en base)');
  } else {
    await mustReject('Cote inferieure ou egale a 1', async (client) => {
      await client.query(
        `INSERT INTO "Bet" ("id","userId","fixtureId","stakeMinor","oddsMilli","potentialWinMinor","cashbackRateBp","status","placedAt")
         VALUES ('bet_bad_odds','user_test',$1,1000,950,950,0,'OPEN',now())`,
        [fixtureId],
      );
    });

    await mustReject('Versement inferieur a la mise', async (client) => {
      await client.query(
        `INSERT INTO "Bet" ("id","userId","fixtureId","stakeMinor","oddsMilli","potentialWinMinor","cashbackRateBp","status","placedAt")
         VALUES ('bet_bad_payout','user_test',$1,5000,1500,4000,0,'OPEN',now())`,
        [fixtureId],
      );
    });

    await mustReject('Score ecarte hors grille', async (client) => {
      await client.query(
        `INSERT INTO "Bet" ("id","userId","fixtureId","stakeMinor","oddsMilli","potentialWinMinor","cashbackRateBp","status","placedAt")
         VALUES ('bet_grid','user_test',$1,1000,1500,1500,0,'OPEN',now())`,
        [fixtureId],
      );
      await client.query(
        `INSERT INTO "BetSelection" ("id","betId","homeGoals","awayGoals")
         VALUES ('sel_bad','bet_grid',9,3)`,
      );
    });

    await mustReject('Match termine sans score', async (client) => {
      await client.query(`UPDATE "Fixture" SET "status" = 'FINISHED' WHERE "id" = $1`, [fixtureId]);
    });
  }

  const c3 = await pool.connect();
  const { rows } = await c3.query(
    `SELECT "balanceMinor" FROM "AccountBalance" WHERE "accountId" = 'acc_wallet_test'`,
  );
  c3.release();

  console.log('  ' + '-'.repeat(70));
  console.log(`  Solde du portefeuille de test : ${rows[0]?.balanceMinor ?? 0} XOF`);
  console.log('  (les 7 000 de l ecriture valide, aucune des tentatives refusees)');
  console.log('');
  console.log(`  ${passed} garde-fou(s) actif(s), ${failed} defaillant(s).`);
  console.log('');

  if (failed > 0) process.exitCode = 1;
}

main()
  .catch((e) => {
    console.error('\n  Echec :', e instanceof Error ? e.message : e, '\n');
    process.exitCode = 1;
  })
  .finally(() => pool.end());
