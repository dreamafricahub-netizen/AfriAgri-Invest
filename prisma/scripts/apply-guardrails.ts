/**
 * Applique prisma/sql/guardrails.sql a la base pointee par DATABASE_URL.
 *
 *   npx tsx prisma/scripts/apply-guardrails.ts
 *
 * A executer apres chaque `prisma db push`. Prisma ne sait pas declarer de
 * CHECK, de trigger ni de vue : sans ce script, le schema existe mais les
 * garanties qui le rendent fiable, non.
 *
 * Le fichier est reentrant, on peut le rejouer sans risque.
 */

import './_env';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Pool } from 'pg';

if (!process.env.DATABASE_URL) {
  console.error('\n  DATABASE_URL absent.\n');
  process.exit(1);
}

const sql = readFileSync(join(process.cwd(), 'prisma', 'sql', 'guardrails.sql'), 'utf8');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  const client = await pool.connect();
  try {
    console.log('\n  Application des garde-fous…');
    await client.query(sql);
    console.log('  OK — contraintes, triggers et vue en place.\n');

    const { rows } = await client.query(`
      SELECT tgname FROM pg_trigger
       WHERE NOT tgisinternal
         AND tgname LIKE 'Ledger%'
       ORDER BY tgname
    `);
    console.log('  Triggers actifs :');
    rows.forEach((r) => console.log('    -', r.tgname));
    console.log('');
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error('\n  Echec :', e instanceof Error ? e.message : e, '\n');
  process.exitCode = 1;
});
