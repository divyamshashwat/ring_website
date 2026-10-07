import { BufferGeometry, Vector3 } from 'three';
import { facetedGeometry, orientOutward, parametricSurface, seeded } from './parametric';

/**
 * Gemstone cuts. All dimensions are in centimetres (1 scene unit = 1 cm), so a
 * 12 × 9 mm cabochon is { a: 0.6, b: 0.45 }.
 */
export type CutType = 'cabochon' | 'high-cabochon' | 'oval-mixed' | 'round-brilliant' | 'emerald-step' | 'pearl';

export interface StoneShape {
  cut: CutType;
  /** girdle semi-axis along X (the long axis) */
  a: number;
  /** girdle semi-axis along Z */
  b: number;
}

export interface StoneMetrics {
  /** height of the stone above the girdle plane */
  crown: number;
  /** depth of the stone below the girdle plane (sits inside the bezel cup) */
  pavilion: number;
  /** vertical girdle band */
  girdle: number;
}

export function stoneMetrics({ cut, a, b }: StoneShape): StoneMetrics {
  const r = Math.min(a, b);
  switch (cut) {
    case 'cabochon':
      return { crown: r * 0.62, pavilion: r * 0.14, girdle: r * 0.08 };
    case 'high-cabochon':
      return { crown: r * 0.88, pavilion: r * 0.16, girdle: r * 0.08 };
    case 'pearl':
      // girdle plane is where the cap meets the pearl, 0.8 r below its centre
      return { crown: r * 1.8, pavilion: r * 0.12, girdle: 0 };
    case 'emerald-step':
      return { crown: r * 0.36, pavilion: r * 0.62, girdle: r * 0.04 };
    case 'round-brilliant':
      return { crown: r * 0.34, pavilion: r * 0.86, girdle: r * 0.03 };
    case 'oval-mixed':
    default:
      return { crown: r * 0.42, pavilion: r * 0.74, girdle: r * 0.035 };
  }
}

/** Approximate volume in cm³, used to give an indicative carat weight. */
export function stoneVolume(shape: StoneShape): number {
  const { a, b } = shape;
  const m = stoneMetrics(shape);
  if (shape.cut === 'pearl') return (4 / 3) * Math.PI * a * a * a;
  if (shape.cut.includes('cabochon')) return Math.PI * a * b * (m.girdle + m.pavilion * 0.9 + (2 / 3) * m.crown);
  if (shape.cut === 'emerald-step') return 4 * a * b * 0.88 * (m.girdle + m.crown * 0.62 + m.pavilion * 0.4);
  return Math.PI * a * b * (m.girdle + m.crown * 0.6 + m.pavilion * 0.36);
}

/** Smooth cabochon: elliptical dome, short girdle wall and a gently rounded base. */
function cabochon(shape: StoneShape, segments: number, seed = 7): BufferGeometry {
  const { a, b } = shape;
  const m = stoneMetrics(shape);
  const rand = seeded(seed);
  // a few low-frequency irregularities: natural cabochons are hand polished
  const wobble = Array.from({ length: 4 }, () => ({ k: 2 + Math.floor(rand() * 3), p: rand() * Math.PI * 2, amp: 0.004 + rand() * 0.006 }));
  const vDome = 0.62;
  const vGirdle = 0.72;
  return parametricSurface(
    segments,
    Math.round(segments * 0.6),
    (u, v, target) => {
      const angle = u * Math.PI * 2;
      let r: number;
      let y: number;
      if (v <= vDome) {
        const t = (v / vDome) * (Math.PI / 2);
        r = Math.sin(t);
        // slightly flattened ellipsoid – polished cabochons are not perfect domes
        y = m.girdle + m.crown * Math.pow(Math.cos(t), 0.92);
      } else if (v <= vGirdle) {
        const t = (v - vDome) / (vGirdle - vDome);
        r = 1 - 0.015 * Math.sin(t * Math.PI);
        y = m.girdle * (1 - t) - m.pavilion * 0.35 * t;
      } else {
        const t = (v - vGirdle) / (1 - vGirdle);
        r = Math.cos(t * Math.PI * 0.5) * (1 - 0.06 * t);
        y = -m.pavilion * 0.35 - m.pavilion * 0.65 * Math.sin(t * Math.PI * 0.5);
      }
      let w = 1;
      for (const o of wobble) w += o.amp * Math.sin(angle * o.k + o.p) * Math.min(r * 1.5, 1);
      target.set(a * r * w * Math.cos(angle), y, b * r * w * Math.sin(angle));
    },
    { wrapU: true },
  );
}

function pearl(shape: StoneShape, segments: number): BufferGeometry {
  const r = shape.a;
  const rand = seeded(31);
  const lobes = Array.from({ length: 3 }, () => ({ k: 2 + Math.floor(rand() * 2), p: rand() * 6.28, amp: 0.006 + rand() * 0.006 }));
  return parametricSurface(
    segments,
    Math.round(segments / 2),
    (u, v, target) => {
      const phi = u * Math.PI * 2;
      const theta = v * Math.PI;
      let w = 1;
      for (const l of lobes) w += l.amp * Math.sin(phi * l.k + l.p) * Math.sin(theta * l.k);
      target.set(r * w * Math.sin(theta) * Math.cos(phi), r * w * Math.cos(theta) + r * 0.8, r * w * Math.sin(theta) * Math.sin(phi));
    },
    { wrapU: true },
  );
}

type Ring = { r: number; y: number; offset: number };

/**
 * Faceted cut from stacked rings of vertices. Alternate rings are rotated by
 * half a step, which produces the kite and triangle facets of a brilliant.
 */
function ringFaceted(shape: StoneShape, rings: Ring[], sides: number, outline: (angle: number) => [number, number]): BufferGeometry {
  const { a, b } = shape;
  const tris: number[][] = [];
  const pt = (ring: Ring, i: number): [number, number, number] => {
    const angle = ((i + ring.offset) / sides) * Math.PI * 2;
    const [ox, oz] = outline(angle);
    return [a * ring.r * ox, ring.y, b * ring.r * oz];
  };
  const top = rings[0];
  const tableCentre: [number, number, number] = [0, top.y, 0];
  for (let i = 0; i < sides; i++) tris.push([...tableCentre, ...pt(top, i + 1), ...pt(top, i)]);
  for (let k = 0; k < rings.length - 1; k++) {
    const r0 = rings[k];
    const r1 = rings[k + 1];
    for (let i = 0; i < sides; i++) {
      const a0 = pt(r0, i);
      const a1 = pt(r0, i + 1);
      const b0 = pt(r1, i);
      const b1 = pt(r1, i + 1);
      if (r0.offset === r1.offset) {
        tris.push([...a0, ...a1, ...b1], [...a0, ...b1, ...b0]);
      } else if (r1.offset > r0.offset) {
        tris.push([...a0, ...a1, ...b0], [...a1, ...b1, ...b0]);
      } else {
        tris.push([...a0, ...b1, ...b0], [...a0, ...a1, ...b1]);
      }
    }
  }
  const last = rings[rings.length - 1];
  const culet: [number, number, number] = [0, last.y - Math.min(a, b) * 0.04, 0];
  for (let i = 0; i < sides; i++) tris.push([...culet, ...pt(last, i), ...pt(last, i + 1)]);
  return facetedGeometry(tris);
}

const ellipse = (angle: number): [number, number] => [Math.cos(angle), Math.sin(angle)];

function ovalMixed(shape: StoneShape, sides = 16): BufferGeometry {
  const m = stoneMetrics(shape);
  const h = m.girdle / 2;
  return ringFaceted(
    shape,
    [
      { r: 0.56, y: h + m.crown, offset: 0 }, // table
      { r: 0.8, y: h + m.crown * 0.62, offset: 0.5 }, // star facets
      { r: 1.0, y: h + m.crown * 0.12, offset: 0 }, // upper girdle
      { r: 1.0, y: h, offset: 0.5 },
      { r: 1.0, y: -h, offset: 0.5 }, // girdle
      { r: 0.92, y: -h - m.pavilion * 0.16, offset: 0 },
      { r: 0.5, y: -h - m.pavilion * 0.62, offset: 0.5 }, // lower girdle
    ],
    sides,
    ellipse,
  );
}

function roundBrilliant(shape: StoneShape): BufferGeometry {
  return ovalMixed({ ...shape, b: shape.a }, 16);
}

/** Emerald (step) cut: an octagonal outline with concentric parallel steps. */
function emeraldStep(shape: StoneShape): BufferGeometry {
  const m = stoneMetrics(shape);
  const h = m.girdle / 2;
  const corner = 0.24;
  // octagon outline sampled at 8 vertices (rectangle with cut corners)
  const oct: [number, number][] = [
    [1, -1 + corner],
    [1, 1 - corner],
    [1 - corner, 1],
    [-1 + corner, 1],
    [-1, 1 - corner],
    [-1, -1 + corner],
    [-1 + corner, -1],
    [1 - corner, -1],
  ];
  const sides = oct.length;
  const outline = (angle: number): [number, number] => {
    const i = Math.round((angle / (Math.PI * 2)) * sides) % sides;
    return oct[(i + sides) % sides];
  };
  const steps: Ring[] = [
    { r: 0.62, y: h + m.crown, offset: 0 },
    { r: 0.76, y: h + m.crown * 0.7, offset: 0 },
    { r: 0.89, y: h + m.crown * 0.36, offset: 0 },
    { r: 1.0, y: h, offset: 0 },
    { r: 1.0, y: -h, offset: 0 },
    { r: 0.82, y: -h - m.pavilion * 0.32, offset: 0 },
    { r: 0.6, y: -h - m.pavilion * 0.64, offset: 0 },
    { r: 0.34, y: -h - m.pavilion * 0.9, offset: 0 },
  ];
  return ringFaceted(shape, steps, sides, outline);
}

export function buildStoneGeometry(shape: StoneShape, quality: 'high' | 'medium' | 'low' = 'high'): BufferGeometry {
  const g = buildStone(shape, quality);
  g.computeBoundingBox();
  const c = g.boundingBox!.getCenter(new Vector3());
  orientOutward(g, (_p, k) => k.copy(c));
  return g;
}

function buildStone(shape: StoneShape, quality: 'high' | 'medium' | 'low'): BufferGeometry {
  const seg = quality === 'high' ? 144 : quality === 'medium' ? 72 : 48;
  switch (shape.cut) {
    case 'cabochon':
    case 'high-cabochon':
      return cabochon(shape, seg);
    case 'pearl':
      return pearl(shape, seg);
    case 'round-brilliant':
      return roundBrilliant(shape);
    case 'emerald-step':
      return emeraldStep(shape);
    case 'oval-mixed':
    default:
      return ovalMixed(shape);
  }
}

export const STONE_UP = new Vector3(0, 1, 0);
