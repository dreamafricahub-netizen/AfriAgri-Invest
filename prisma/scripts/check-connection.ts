/**
 * Verifie que l'application peut joindre la base.
 *
 *   npx tsx prisma/scripts/check-connection.ts
 *
 * Teste la chaine DATABASE_URL telle qu'elle sera utilisee par l'application,
 * et affiche un etat lisible. A lancer avant `npm run dev` quand on doute.
 */

import './_env';
import { Pool } from 'pg';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('\n  DATABASE_URL absent.\n');
  process.exit(1);
}

// N'affiche jamais le mot de passe.
const safe = url.replace(/:\/\/([^:]+):([^@]+)@/, '://$1:***@');

const pool = new Pool({
  connectionString: url,
  max: Number(process.env.PG_POOL_MAX) || 1,
  connectionTimeoutMillis: 15_000,
});

async function main() {
  console.log('\n  Cible :', safe);

  const c = await pool.connect();
  try {
    const { rows: [v] } = await c.query('SELECT version() AS v, current_database() AS db');
    console.log('  Base  :', v.db);
    console.log('  Moteur:', String(v.v).split(' ').slice(0, 2).join(' '));

    const { rows: [s] } = await c.query(`
      SELECT
        (SELECT count(*) FROM "User")                                                  AS utilisateurs,
        (SELECT count(*) FROM "Fixture" WHERE "status" = 'SCHEDULED')                  AS matchs_ouverts,
        (SELECT count(*) FROM "Bet")                                                   AS paris,
        (SELECT COALESCE(sum("balanceMinor"),0) FROM "AccountBalance"
          WHERE "kind" = 'USER_WALLET')                                                AS soldes_xof,
        (SELECT COALESCE(sum("amountMinor"),0) FROM "LedgerEntry")                     AS equilibre
    `);

    console.log('');
    console.log('  Utilisateurs   :', s.utilisateurs);
    console.log('  Matchs ouverts :', s.matchs_ouverts);
    console.log('  Paris places   :', s.paris);
    console.log('  Soldes joueurs :', s.soldes_xof, 'XOF');
    console.log('  Equilibre      :', s.equilibre, s.equilibre === '0' ? '(correct)' : '(ANOMALIE)');
    console.log('\n  Connexion operationnelle.\n');
  } finally {
    c.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error('\n  Echec :', e instanceof Error ? e.message : e);
  console.error('\n  Pistes : mot de passe mal encode dans l URL, ou hote/port incorrects.\n');
  process.exitCode = 1;
});
