/**
 * Etat de la plateforme, d'un coup d'oeil.
 *
 *   npx tsx prisma/scripts/status.ts
 *
 * Affiche les matchs, leur statut, et les indicateurs financiers du registre.
 * C'est le premier reflexe quand quelque chose semble anormal.
 */

import './_env';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });

async function main() {
  const now = new Date();
  console.log('\n  Heure UTC :', now.toISOString().slice(11, 16));
  console.log('  ' + '-'.repeat(74));

  const { rows: fixtures } = await pool.query(`
    SELECT to_char("kickoffAt", 'HH24:MI')            AS heure,
           "homeTeam" || ' - ' || "awayTeam"          AS match,
           "status"::text                             AS statut,
           COALESCE("homeGoals"::text, '·') || '-' ||
           COALESCE("awayGoals"::text, '·')           AS score,
           ("resultSeed" IS NOT NULL)                 AS graine,
           (SELECT count(*) FROM "Bet" b WHERE b."fixtureId" = f."id") AS paris
      FROM "Fixture" f
     ORDER BY "kickoffAt"
  `);

  console.log('  MATCHS');
  console.log('    Heure  Rencontre                          Statut      Score  Paris');
  for (const f of fixtures) {
    console.log(
      '    ' + String(f.heure).padEnd(7) +
        String(f.match).padEnd(35) +
        String(f.statut).padEnd(12) +
        String(f.score).padEnd(7) +
        String(f.paris),
    );
  }

  const { rows: [k] } = await pool.query(`
    SELECT
      (SELECT COALESCE(sum("balanceMinor"),0) FROM "AccountBalance" WHERE "kind"='USER_WALLET')    AS soldes,
      (SELECT COALESCE(sum("balanceMinor"),0) FROM "AccountBalance" WHERE "kind"='UNSETTLED_BETS') AS exposition,
      (SELECT COALESCE(sum("balanceMinor"),0) FROM "AccountBalance" WHERE "kind"='REVENUE')        AS ggr,
      (SELECT COALESCE(sum("balanceMinor"),0) FROM "AccountBalance" WHERE "kind"='EXPENSE')        AS charges,
      (SELECT COALESCE(sum("amountMinor"),0)  FROM "LedgerEntry")                                  AS equilibre,
      (SELECT count(*) FROM "Bet" WHERE "status"='OPEN')                                           AS paris_ouverts
  `);

  console.log('\n  REGISTRE');
  console.log('    Soldes joueurs        :', k.soldes, 'XOF');
  console.log('    Exposition ouverte    :', k.exposition, 'XOF   (mises dont le resultat est inconnu)');
  console.log('    Produit brut des jeux :', k.ggr, 'XOF');
  console.log('    Charges               :', k.charges, 'XOF   (bonus, cashback, frais)');
  console.log('    Paris ouverts         :', k.paris_ouverts);
  console.log(
    '    Equilibre             :', k.equilibre,
    String(k.equilibre) === '0' ? '  (correct)' : '  ANOMALIE — le registre ne somme plus a zero',
  );
  console.log('');
}

main()
  .catch((e) => {
    console.error('\n  Echec :', e instanceof Error ? e.message : e, '\n');
    process.exitCode = 1;
  })
  .finally(() => pool.end());
