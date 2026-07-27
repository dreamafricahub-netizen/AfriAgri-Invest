/**
 * Generation des matchs du jour.
 *
 *   npx tsx prisma/scripts/seed-fixtures.ts            (simulation)
 *   npx tsx prisma/scripts/seed-fixtures.ts --commit
 *
 * Huit matchs virtuels par jour, espaces regulierement, chacun avec son tirage
 * scelle genere AVANT toute ouverture de pari. La graine reste en base, seule
 * son empreinte est publiee par l'API.
 *
 * Les matchs reels ne sont pas generes ici : ils seront importes d'un
 * fournisseur de donnees, avec leurs esperances de buts calculees a partir des
 * cotes du marche.
 */

import './_env';
import { PrismaClient } from '../../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { createCommitment } from '../../src/lib/virtual';

const args = process.argv.slice(2);
const commit = args.includes('--commit');

/**
 * Mode `--sql` : n'ouvre aucune connexion et se contente d'ecrire le SQL sur la
 * sortie standard. Utile quand la base n'est joignable que par une console
 * distante, sans chaine de connexion en local.
 */
const sqlOnly = args.includes('--sql');

if (!sqlOnly && !process.env.DATABASE_URL) {
  console.error('\n  DATABASE_URL absent. Renseignez-le dans .env.local.\n');
  process.exit(1);
}

const pool = sqlOnly ? null : new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = sqlOnly ? null : new PrismaClient({ adapter: new PrismaPg(pool!) });

/** Equipes de la ligue virtuelle. */
const TEAMS = [
  'Cotonou FC', 'Abidjan United', 'Dakar Étoile', 'Lomé Athletic',
  'Bamako SC', 'Niamey Olympique', 'Ouaga Réal', 'Douala City',
  'Brazza Sporting', 'Porto-Novo AC', 'Bouaké FC', 'Thiès Union',
];

const MATCHES_PER_DAY = 8;
/** Un match toutes les 90 minutes a partir de 08:00. */
const FIRST_KICKOFF_HOUR = 8;
const INTERVAL_MINUTES = 90;

/**
 * Esperances de buts. Elles varient legerement d'un match a l'autre pour que
 * la grille ne soit pas identique partout, tout en restant dans les valeurs
 * realistes du football de club.
 */
function lambdasFor(index: number): { home: number; away: number } {
  const home = 1.25 + ((index * 7) % 5) * 0.1; // 1,25 a 1,65
  const away = 1.00 + ((index * 3) % 5) * 0.1; // 1,00 a 1,40
  return { home, away };
}

function pickTeams(index: number): { home: string; away: string } {
  const home = TEAMS[(index * 2) % TEAMS.length];
  let away = TEAMS[(index * 2 + 1 + Math.floor(index / 6)) % TEAMS.length];
  if (away === home) away = TEAMS[(index * 2 + 3) % TEAMS.length];
  return { home, away };
}

/**
 * Premier coup d'envoi.
 *
 * Normalement 08:00. Mais si cette heure est deja passee, on demarre dans un
 * quart d'heure : un match dont le coup d'envoi est derriere nous serait
 * immediatement cloture par le balayage, et personne ne pourrait parier.
 */
function firstKickoff(): Date {
  const t = new Date();
  t.setHours(FIRST_KICKOFF_HOUR, 0, 0, 0);

  if (t.getTime() <= Date.now()) {
    const soon = new Date(Date.now() + 15 * 60_000);
    soon.setSeconds(0, 0);
    return soon;
  }
  return t;
}

/** Genere les matchs a venir, avec leur tirage scelle. Sans effet de bord. */
function buildFixtures() {
  const start = firstKickoff();
  const stamp = start.toISOString().slice(0, 16).replace(/[-:T]/g, '');

  return Array.from({ length: MATCHES_PER_DAY }, (_, i) => {
    const { home, away } = pickTeams(i);
    const { home: lh, away: la } = lambdasFor(i);
    // Le tirage est scelle ici, avant toute existence en base — donc avant que
    // la moindre mise puisse etre placee.
    const { seed, commitment } = createCommitment();

    return {
      id: `fx_${stamp}_${i}`,
      kickoff: new Date(start.getTime() + i * INTERVAL_MINUTES * 60_000),
      home, away, lh, la, seed, commitment,
    };
  });
}

function esc(s: string) {
  return s.replace(/'/g, "''");
}

/** Ecrit le SQL d'insertion sur la sortie standard, sans toucher a la base. */
function printSql() {
  const rows = buildFixtures().map(
    (f) =>
      `('${f.id}','VIRTUAL','Ligue ZooFoot','${esc(f.home)}','${esc(f.away)}',` +
      `'${f.kickoff.toISOString()}','SCHEDULED',${f.lh},${f.la},` +
      `'${f.seed}','${f.commitment}',now())`,
  );

  console.log(
    `INSERT INTO "Fixture" ("id","kind","competition","homeTeam","awayTeam",` +
      `"kickoffAt","status","lambdaHome","lambdaAway","resultSeed","resultCommitment","createdAt")\n` +
      `VALUES\n${rows.join(',\n')}\nON CONFLICT ("id") DO NOTHING;`,
  );
}

async function main() {
  if (sqlOnly) {
    printSql();
    return;
  }

  console.log('');
  console.log('  Generation des matchs virtuels du jour');
  console.log('  Mode :', commit ? 'ECRITURE' : 'SIMULATION (--commit pour ecrire)');
  console.log('  ' + '-'.repeat(64));

  const today = new Date();
  today.setHours(FIRST_KICKOFF_HOUR, 0, 0, 0);

  const existing = await prisma!.fixture.count({
    where: {
      kind: 'VIRTUAL',
      kickoffAt: {
        gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
        lt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1),
      },
    },
  });

  if (existing > 0) {
    console.log(`  ${existing} match(s) virtuel(s) deja programme(s) aujourd'hui.`);
    console.log('  Rien a faire — relancer apres minuit.\n');
    return;
  }

  console.log('');
  console.log('    Heure    Match                                 Lambda      Empreinte');
  console.log('    ' + '-'.repeat(76));

  for (let i = 0; i < MATCHES_PER_DAY; i++) {
    const kickoff = new Date(today.getTime() + i * INTERVAL_MINUTES * 60_000);
    const { home, away } = pickTeams(i);
    const { home: lh, away: la } = lambdasFor(i);

    // Le tirage est scelle ici, avant que le match n'existe en base — donc
    // avant que la moindre mise puisse etre placee.
    const { seed, commitment } = createCommitment();

    console.log(
      '    ' + kickoff.toTimeString().slice(0, 5).padEnd(9) +
        `${home} — ${away}`.padEnd(38) +
        `${lh.toFixed(2)}/${la.toFixed(2)}`.padEnd(12) +
        commitment.slice(0, 16) + '...',
    );

    if (commit) {
      await prisma!.fixture.create({
        data: {
          kind: 'VIRTUAL',
          competition: 'Ligue ZooFoot',
          homeTeam: home,
          awayTeam: away,
          kickoffAt: kickoff,
          lambdaHome: lh,
          lambdaAway: la,
          resultSeed: seed,
          resultCommitment: commitment,
        },
      });
    }
  }

  console.log('');
  if (commit) {
    console.log(`  ${MATCHES_PER_DAY} matchs crees, tirages scelles.`);
    console.log('  Les graines restent en base ; seules les empreintes sont publiees.');
  } else {
    console.log('  Simulation. Rien n a ete ecrit.');
    console.log('  Relancer avec --commit pour creer les matchs.');
  }
  console.log('');
}

main()
  .catch((e) => {
    console.error('\n  Echec :', e instanceof Error ? e.message : e, '\n');
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma?.$disconnect();
    await pool?.end();
  });
