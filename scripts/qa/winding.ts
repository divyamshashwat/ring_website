/** Geometry QA: every generated surface must face outward (before/after orientation). */
import { buildJewellery } from '../../lib/3d/geometry/jewellery';
import { recordOrientation } from '../../lib/3d/geometry/parametric';
import { buildStoneGeometry } from '../../lib/3d/geometry/stones';

for (const type of ['ring', 'pendant', 'bracelet'] as const)
  for (const style of ['classic', 'heritage', 'minimal', 'contemporary'] as const)
    for (const cut of ['cabochon', 'oval-mixed', 'emerald-step', 'pearl'] as const) {
      const log: number[] = [];
      recordOrientation(log);
      buildJewellery({ type, style, stone: { cut, a: 0.5, b: 0.4 }, size: 7, quality: 'low' });
      recordOrientation(null);
      console.log(type.padEnd(9), style.padEnd(13), cut.padEnd(13), log.map((f) => (f < 0.5 ? `flipped(${f.toFixed(2)})` : f.toFixed(2))).join(' '));
    }
const log: number[] = [];
recordOrientation(log);
buildStoneGeometry({ cut: 'cabochon', a: 0.5, b: 0.4 });
console.log('stone', log);
