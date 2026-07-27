/**
 * Verification du moteur de cotes.
 *
 *   npx tsx prisma/scripts/check-odds.ts
 *
 * Ne touche pas la base. Sert a controler qu'un changement de marge ou de taux
 * de remboursement produit des cotes commercialisables avant de le mettre en
 * production.
 */

import {
  scoreGrid,
  quoteInverseBet,
  potentialWin,
  cashbackAmount,
  OddsError,
  GRID_MAX,
  type Scoreline,
} from '../../src/lib/odds';

const LH = 1.4;
const LA = 1.2;
const STAKE = BigInt(5000);

function pct(x: number) {
  return (x * 100).toFixed(2).padStart(6) + ' %';
}

console.log('\n  Grille — esperances', LH, '/', LA, '\n');
const grid = scoreGrid(LH, LA);
let head = '      ';
for (let a = 0; a <= GRID_MAX; a++) head += String(a).padStart(8);
console.log(head);
for (let h = 0; h <= GRID_MAX; h++) {
  let row = '  ' + h + '   ';
  for (let a = 0; a <= GRID_MAX; a++) row += pct(grid[h][a]).padStart(8);
  console.log(row);
}
const total = grid.flat().reduce((s, x) => s + x, 0);
console.log('\n  Couverture de la grille :', pct(total), '(le reste = scores au-dela de 5)');

const scenarios: { label: string; sel: Scoreline[] }[] = [
  { label: '1 score  (1-1)', sel: [{ homeGoals: 1, awayGoals: 1 }] },
  {
    label: '2 scores (1-1, 1-0)',
    sel: [{ homeGoals: 1, awayGoals: 1 }, { homeGoals: 1, awayGoals: 0 }],
  },
  {
    label: '4 scores (0-0,1-0,1-1,2-1)',
    sel: [
      { homeGoals: 0, awayGoals: 0 },
      { homeGoals: 1, awayGoals: 0 },
      { homeGoals: 1, awayGoals: 1 },
      { homeGoals: 2, awayGoals: 1 },
    ],
  },
  {
    label: '6 scores (+2-0, 0-1)',
    sel: [
      { homeGoals: 0, awayGoals: 0 },
      { homeGoals: 1, awayGoals: 0 },
      { homeGoals: 1, awayGoals: 1 },
      { homeGoals: 2, awayGoals: 1 },
      { homeGoals: 2, awayGoals: 0 },
      { homeGoals: 0, awayGoals: 1 },
    ],
  },
];

for (const cashbackBp of [0, 1500, 6000]) {
  console.log(
    `\n  Marge 6 %, remboursement ${(cashbackBp / 100).toFixed(0)} %  —  mise ${STAKE} XOF\n`,
  );
  console.log('    Scores ecartes                Risque     Cote      Gain    Rembourse');
  console.log('    ' + '-'.repeat(70));

  for (const s of scenarios) {
    try {
      const q = quoteInverseBet(s.sel, LH, LA, 600, cashbackBp);
      const win = potentialWin(STAKE, q.oddsMilli);
      const cb = cashbackAmount(STAKE, cashbackBp);
      console.log(
        '    ' + s.label.padEnd(28) +
          (q.riskBp / 100).toFixed(1).padStart(6) + ' %' +
          (q.oddsMilli / 1000).toFixed(3).padStart(9) +
          String(win).padStart(10) +
          String(cb).padStart(11),
      );
    } catch (e) {
      const msg = e instanceof OddsError ? 'REFUSE — ' + e.message.split('.')[0] : String(e);
      console.log('    ' + s.label.padEnd(28) + msg);
    }
  }
}

console.log('');
