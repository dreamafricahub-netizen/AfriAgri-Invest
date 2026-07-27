/**
 * Verification du tirage virtuel.
 *
 *   npx tsx prisma/scripts/check-virtual.ts
 *
 * Deux controles, tous deux critiques :
 *
 *   1. Le protocole scelle fonctionne, et une graine falsifiee est rejetee.
 *   2. Le tirage suit bien la loi qui sert a calculer les cotes. Si les deux
 *      divergent, la marge reelle n'est pas la marge affichee — et personne ne
 *      s'en apercevrait avant plusieurs mois d'exploitation.
 */

import { createCommitment, deriveScore, verifyDraw, sha256 } from '../../src/lib/virtual';
import { scoreGrid, GRID_MAX } from '../../src/lib/odds';

const LH = 1.4;
const LA = 1.2;
const N = 200_000;

console.log('\n  1. Protocole scelle\n');

const { seed, commitment } = createCommitment();
const score = deriveScore(seed, LH, LA);

console.log('     Empreinte publiee   :', commitment.slice(0, 32) + '...');
console.log('     Graine revelee      :', seed.slice(0, 32) + '...');
console.log('     Score derive        :', `${score.homeGoals}-${score.awayGoals}`);

const ok = verifyDraw({ seed, commitment, lambdaHome: LH, lambdaAway: LA, ...score });
console.log('     Verification        :', ok.valid ? 'VALIDE' : 'REJETEE — ' + ok.reason);

const tampered = verifyDraw({
  seed: sha256('graine-falsifiee'),
  commitment,
  lambdaHome: LH,
  lambdaAway: LA,
  ...score,
});
console.log('     Graine falsifiee    :', tampered.valid ? 'ACCEPTEE (PROBLEME)' : 'REJETEE');

const lied = verifyDraw({
  seed,
  commitment,
  lambdaHome: LH,
  lambdaAway: LA,
  homeGoals: (score.homeGoals + 1) % 5,
  awayGoals: score.awayGoals,
});
console.log('     Score annonce faux  :', lied.valid ? 'ACCEPTE (PROBLEME)' : 'REJETE');

console.log(`\n  2. Distribution sur ${N.toLocaleString('fr-FR')} tirages\n`);

const counts: number[][] = Array.from({ length: GRID_MAX + 1 }, () =>
  new Array(GRID_MAX + 1).fill(0),
);
let outside = 0;

for (let i = 0; i < N; i++) {
  const s = deriveScore(sha256(`tirage-${i}`), LH, LA);
  if (s.homeGoals <= GRID_MAX && s.awayGoals <= GRID_MAX) {
    counts[s.homeGoals][s.awayGoals] += 1;
  } else {
    outside += 1;
  }
}

const theory = scoreGrid(LH, LA);
let worstGap = 0;
let worstCell = '';

console.log('     Score    Theorique    Observe      Ecart');
console.log('     ' + '-'.repeat(45));

const notable = [
  [1, 1], [1, 0], [0, 0], [2, 1], [0, 1], [2, 0], [3, 1], [4, 2],
];
for (const [h, a] of notable) {
  const t = theory[h][a] * 100;
  const o = (counts[h][a] / N) * 100;
  const gap = Math.abs(o - t);
  console.log(
    `     ${h}-${a}    ` +
      t.toFixed(3).padStart(8) + ' %' +
      o.toFixed(3).padStart(9) + ' %' +
      (gap).toFixed(3).padStart(9) + ' pt',
  );
}

for (let h = 0; h <= GRID_MAX; h++) {
  for (let a = 0; a <= GRID_MAX; a++) {
    const gap = Math.abs((counts[h][a] / N) * 100 - theory[h][a] * 100);
    if (gap > worstGap) {
      worstGap = gap;
      worstCell = `${h}-${a}`;
    }
  }
}

console.log('\n     Ecart maximal sur toute la grille :', worstGap.toFixed(3), 'pt  (case', worstCell + ')');
console.log('     Scores hors grille                :', ((outside / N) * 100).toFixed(3), '%');
console.log(
  '     Verdict                           :',
  worstGap < 0.3 ? 'le tirage suit le modele des cotes' : 'DIVERGENCE — cotes fausses',
);
console.log('');
