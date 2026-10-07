import { BufferGeometry, CatmullRomCurve3, Curve, Matrix4, SphereGeometry, TorusGeometry, TubeGeometry, Vector2, Vector3 } from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { lerp, orientOutward, parametricSurface, smoothstep, spow } from './parametric';
import { buildStoneGeometry, stoneMetrics, type StoneShape } from './stones';

export type RingStyle = 'classic' | 'minimal' | 'heritage' | 'contemporary';
export type JewelleryType = 'ring' | 'pendant' | 'bracelet';
export type Quality = 'high' | 'medium' | 'low';

/** Named parts. A GLB that uses the same mesh names can replace any procedural part. */
export interface JewelleryParts {
  /** band / shank – carries the hallmark engraving */
  shank: BufferGeometry;
  /** bezel cup, seat and decorative metal */
  metal: BufferGeometry;
  stone: BufferGeometry;
  /** where the stone sits: girdle centre */
  stoneOffset: Vector3;
  /** rotation of the stone group: rings set the oval north–south, pendants face forward */
  stoneRotation: [number, number, number, 'XYZ' | 'ZYX'];
  /** bounding radius used by camera framing */
  radius: number;
}

interface StyleSpec {
  bandBottom: [number, number]; // [thickness, width] at the base of the shank
  bandTop: [number, number]; // at the shoulders
  exponent: number; // superellipse exponent: 1 = ellipse, ~0.3 = squared edges
  taper: number; // how quickly the shoulders swell
  bezelWall: number;
  bezelLip: number;
  bezelProfile: 'rounded' | 'stepped' | 'knife' | 'flat';
  milgrain: boolean;
  rope: boolean;
  granules: boolean;
}

export const RING_STYLES: Record<RingStyle, StyleSpec> = {
  classic: {
    bandBottom: [0.17, 0.24],
    bandTop: [0.24, 0.5],
    exponent: 0.62,
    taper: 2.4,
    bezelWall: 0.055,
    bezelLip: 0.05,
    bezelProfile: 'rounded',
    milgrain: false,
    rope: false,
    granules: false,
  },
  minimal: {
    bandBottom: [0.14, 0.17],
    bandTop: [0.15, 0.21],
    exponent: 0.75,
    taper: 3,
    bezelWall: 0.035,
    bezelLip: 0.035,
    bezelProfile: 'knife',
    milgrain: false,
    rope: false,
    granules: false,
  },
  heritage: {
    bandBottom: [0.18, 0.28],
    bandTop: [0.27, 0.58],
    exponent: 0.55,
    taper: 2,
    bezelWall: 0.07,
    bezelLip: 0.055,
    bezelProfile: 'stepped',
    milgrain: true,
    rope: true,
    granules: true,
  },
  contemporary: {
    bandBottom: [0.2, 0.3],
    bandTop: [0.2, 0.3],
    exponent: 0.22,
    taper: 1,
    bezelWall: 0.05,
    bezelLip: 0.06,
    bezelProfile: 'flat',
    milgrain: false,
    rope: false,
    granules: false,
  },
};

/** US ring size → inner radius (cm). US 7 ≈ 17.3 mm inner diameter. */
export const innerRadiusForSize = (usSize: number) => (11.63 + 0.8128 * usSize) / 20;

const segmentsFor = (q: Quality) => (q === 'high' ? 1 : q === 'medium' ? 0.75 : 0.5);

/** The band, swept around the finger axis (Z). The stone sits at +Y. */
function shankGeometry(spec: StyleSpec, innerR: number, q: Quality, openGap = 0): BufferGeometry {
  const s = segmentsFor(q);
  const [t0, w0] = spec.bandBottom;
  const [t1, w1] = spec.bandTop;
  const start = openGap;
  const span = 1 - openGap * 2;
  const geometry = parametricSurface(
    Math.round(220 * s),
    Math.round(56 * s),
    (u, v, target) => {
      // closed rings start at the top (+Y); open cuffs start beside the gap at the bottom
      const phi = (start + u * span) * Math.PI * 2 + (openGap > 0 ? Math.PI : 0);
      const top = Math.pow((1 + Math.cos(phi)) / 2, spec.taper);
      const t = lerp(t0, t1, top);
      const w = lerp(w0, w1, top);
      const a = v * Math.PI * 2;
      // superellipse cross-section with a softened inner (comfort-fit) face
      const cu = Math.cos(a);
      const pu = spow(cu, cu < 0 ? Math.min(spec.exponent + 0.3, 1) : spec.exponent) * (t / 2);
      const pv = spow(Math.sin(a), spec.exponent) * (w / 2);
      const r = innerR + t / 2 + pu;
      target.set(r * Math.sin(phi), r * Math.cos(phi), pv);
    },
    { wrapU: openGap === 0, wrapV: true, uvScale: [1, 1] },
  );
  // outward from the band's centre-line circle
  const midR = innerR + (t0 + t1) / 4;
  orientOutward(geometry, (p, k) => {
    const r = Math.hypot(p.x, p.y) || 1;
    return k.set((p.x / r) * midR, (p.y / r) * midR, 0);
  });
  return geometry;
}

/** Closed profile for the bezel cup in (outward offset d, height y) space. */
function bezelProfile(spec: StyleSpec, depth: number, lipH: number): CatmullRomCurve3 {
  const w = spec.bezelWall;
  const pts: [number, number][] = (() => {
    switch (spec.bezelProfile) {
      case 'knife':
        return [
          [-0.004, -depth],
          [-0.004, lipH * 0.5],
          [-0.01, lipH],
          [w * 0.35, lipH + 0.01],
          [w, lipH * 0.4],
          [w * 0.8, -depth * 0.6],
          [w * 0.25, -depth - 0.012],
        ];
      case 'stepped':
        return [
          [-0.004, -depth],
          [-0.004, lipH * 0.4],
          [-0.014, lipH],
          [w * 0.25, lipH + 0.016],
          [w * 0.62, lipH * 0.7],
          [w * 0.7, lipH * 0.1],
          [w * 1.1, -depth * 0.12],
          [w * 1.08, -depth * 0.5],
          [w * 0.7, -depth - 0.012],
          [w * 0.2, -depth - 0.02],
        ];
      case 'flat':
        return [
          [-0.004, -depth],
          [-0.004, lipH * 0.6],
          [-0.006, lipH],
          [w * 0.15, lipH + 0.004],
          [w * 0.9, lipH + 0.004],
          [w, lipH * 0.6],
          [w, -depth * 0.8],
          [w * 0.9, -depth - 0.006],
          [w * 0.15, -depth - 0.006],
        ];
      case 'rounded':
      default:
        return [
          [-0.004, -depth],
          [-0.004, lipH * 0.45],
          [-0.013, lipH],
          [w * 0.3, lipH + 0.016],
          [w * 0.95, lipH * 0.35],
          [w * 0.95, -depth * 0.35],
          [w * 0.6, -depth - 0.014],
          [w * 0.12, -depth - 0.02],
        ];
    }
  })();
  return new CatmullRomCurve3(
    pts.map(([d, y]) => new Vector3(d, y, 0)),
    true,
    'centripetal',
  );
}

/** The girdle outline a bezel follows: an ellipse, or a rounded octagon for step cuts. */
interface Outline {
  point(angle: number, target?: Vector2): Vector2;
  normal(angle: number, target?: Vector2): Vector2;
  perimeter: number;
}

function outlineFor(shape: StoneShape): Outline {
  const { a, b } = shape;
  const squared = shape.cut === 'emerald-step';
  // a superellipse (n = 6) circumscribes the octagonal step cut within ~3%
  const n = 6;
  const R = Math.pow(1 + Math.pow(0.76, n), 1 / n);
  const point = (angle: number, target = new Vector2()) => {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    if (!squared) return target.set(a * c, b * s);
    return target.set(R * a * spow(c, 2 / n), R * b * spow(s, 2 / n));
  };
  const p0 = new Vector2();
  const p1 = new Vector2();
  const normal = (angle: number, target = new Vector2()) => {
    if (!squared) return target.set(Math.cos(angle) / a, Math.sin(angle) / b).normalize();
    point(angle - 1e-3, p0);
    point(angle + 1e-3, p1);
    return target.set(p1.y - p0.y, -(p1.x - p0.x)).normalize();
  };
  let perimeter = 0;
  const steps = 256;
  const prev = point(0);
  const cur = new Vector2();
  for (let i = 1; i <= steps; i++) {
    point((i / steps) * Math.PI * 2, cur);
    perimeter += cur.distanceTo(prev);
    prev.copy(cur);
  }
  return { point, normal, perimeter };
}

/** How far the bezel cup narrows toward its base, following the pavilion. */
const isOpaqueCut = (shape: StoneShape) => shape.cut.includes('cabochon') || shape.cut === 'pearl';
const taperFor = (shape: StoneShape) => Math.min(shape.a, shape.b) * (isOpaqueCut(shape) ? 0.12 : 0.26);

/** Bezel cup swept around the stone girdle. Origin = girdle centre. */
function bezelGeometry(spec: StyleSpec, shape: StoneShape, q: Quality): { geometry: BufferGeometry; depth: number; lipH: number } {
  const m = stoneMetrics(shape);
  const isFaceted = !shape.cut.includes('cabochon') && shape.cut !== 'pearl';
  // faceted stones are open-backed: the pavilion continues down into the gallery
  const depth = shape.cut === 'pearl' ? 0.07 : isFaceted ? Math.max(m.pavilion * 0.5, 0.06) : Math.max(m.pavilion + 0.03, 0.08);
  const lipH = shape.cut === 'pearl' ? 0.03 : isFaceted ? m.girdle / 2 + 0.012 : Math.max(m.girdle + m.crown * 0.08, 0.035);
  const profile = bezelProfile(spec, depth, lipH);
  const outline = outlineFor(shape);
  const taper = taperFor(shape);
  const s = segmentsFor(q);
  const tmp = new Vector3();
  const p = new Vector2();
  const n = new Vector2();
  const geometry = parametricSurface(
    Math.round(160 * s),
    Math.round(48 * s),
    (u, v, target) => {
      const angle = u * Math.PI * 2;
      profile.getPointAt(v, tmp);
      outline.point(angle, p);
      outline.normal(angle, n);
      const d = tmp.x - taper * Math.min(Math.max(-tmp.y / depth, 0), 1);
      target.set(p.x + n.x * d, tmp.y, p.y + n.y * d);
    },
    { wrapU: true, wrapV: true },
  );
  // outward from the profile's centre, carried around the girdle outline
  const dMid = spec.bezelWall * 0.45;
  const yMid = (lipH - depth) / 2;
  orientOutward(geometry, (q, k) => {
    const angle = Math.atan2(q.z / shape.b, q.x / shape.a);
    outline.point(angle, p);
    outline.normal(angle, n);
    const d = dMid - taper * Math.min(Math.max(-q.y / depth, 0), 1);
    return k.set(p.x + n.x * d, yMid, p.y + n.y * d);
  });
  return { geometry, depth, lipH };
}

/** The closed seat behind the stone. */
function seatGeometry(shape: StoneShape, depth: number, q: Quality): BufferGeometry {
  const s = segmentsFor(q);
  const outline = outlineFor(shape);
  const taper = taperFor(shape);
  const p = new Vector2();
  const n = new Vector2();
  const geometry = parametricSurface(
    Math.round(96 * s),
    16,
    (u, v, target) => {
      const angle = u * Math.PI * 2;
      // v: 0 = top centre → 0.5 edge → 1 bottom centre
      const r = Math.sin(v * Math.PI);
      const y = v < 0.5 ? -depth + 0.004 : -depth - 0.02 - 0.03 * (1 - r);
      outline.point(angle, p);
      outline.normal(angle, n);
      const d = 0.008 - taper;
      target.set((p.x + n.x * d) * r, y, (p.y + n.y * d) * r);
    },
    { wrapU: true },
  );
  orientOutward(geometry, (_q, k) => k.set(0, -depth - 0.012, 0));
  return geometry;
}

/** Cast gallery: a tapering collar that carries the bezel down into the shoulders. */
function galleryGeometry(spec: StyleSpec, shape: StoneShape, depth: number, height: number, q: Quality): BufferGeometry {
  const s = segmentsFor(q);
  const wall = spec.bezelWall;
  const outline = outlineFor(shape);
  const taper = taperFor(shape);
  const p = new Vector2();
  const n = new Vector2();
  const geometry = parametricSurface(
    Math.round(128 * s),
    Math.round(24 * s),
    (u, v, target) => {
      const angle = u * Math.PI * 2;
      const e = 1 - Math.pow(1 - v, 2.2); // concave waist
      const scale = lerp(1, 0.6, e);
      outline.point(angle, p);
      outline.normal(angle, n);
      const d = lerp(wall * 0.55 - taper, -taper * 0.4, v);
      target.set((p.x + n.x * d) * scale, -depth - 0.004 - height * v, (p.y + n.y * d) * scale);
    },
    { wrapU: true },
  );
  orientOutward(geometry, (q, k) => k.set(0, q.y, 0));
  return geometry;
}

function milgrain(shape: StoneShape, spec: StyleSpec, y: number, offset: number, radius: number): BufferGeometry {
  const outline = outlineFor(shape);
  const count = Math.floor(outline.perimeter / (radius * 2.25));
  const bead = new SphereGeometry(radius, 10, 8);
  const parts: BufferGeometry[] = [];
  const mtx = new Matrix4();
  const p = new Vector2();
  const n = new Vector2();
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    outline.point(angle, p);
    outline.normal(angle, n);
    const g = bead.clone();
    g.applyMatrix4(mtx.makeTranslation(p.x + n.x * (spec.bezelWall * offset), y, p.y + n.y * (spec.bezelWall * offset)));
    parts.push(g);
  }
  bead.dispose();
  const merged = mergeGeometries(parts);
  parts.forEach((g) => g.dispose());
  return merged;
}

/** Twisted two-strand wire around the base of the bezel – a classic Indian goldsmith detail. */
class RopeStrand extends Curve<Vector3> {
  private p = new Vector2();
  private n = new Vector2();
  constructor(
    private outline: Outline,
    private offset: number,
    private y: number,
    private wire: number,
    private twists: number,
    private phase: number,
  ) {
    super();
  }
  getPoint(t: number, target = new Vector3()) {
    const angle = t * Math.PI * 2;
    this.outline.point(angle, this.p);
    this.outline.normal(angle, this.n);
    const twist = angle * this.twists + this.phase;
    const d = this.offset + Math.cos(twist) * this.wire;
    return target.set(this.p.x + this.n.x * d, this.y + Math.sin(twist) * this.wire, this.p.y + this.n.y * d);
  }
}

function rope(shape: StoneShape, spec: StyleSpec, y: number, depth: number, q: Quality): BufferGeometry {
  const wire = 0.016;
  const outline = outlineFor(shape);
  const taper = taperFor(shape) * Math.min(Math.max(-y / depth, 0), 1);
  const offset = spec.bezelWall * 1.15 + wire - taper;
  const tubular = q === 'high' ? 900 : 500;
  const strands = [0, Math.PI].map((phase) => new TubeGeometry(new RopeStrand(outline, offset, y, wire * 0.9, 60, phase), tubular, wire, 8, true));
  const merged = mergeGeometries(strands);
  strands.forEach((g) => g.dispose());
  return merged;
}

/** Three granules on each shoulder (granulation / "rava" work). */
function granules(innerR: number, spec: StyleSpec, y: number): BufferGeometry {
  const parts: BufferGeometry[] = [];
  const t1 = spec.bandTop[0];
  const r = 0.03;
  for (const side of [-1, 1]) {
    for (const [dx, dz] of [
      [0, 0],
      [0.045, 0.05],
      [0.045, -0.05],
    ]) {
      const g = new SphereGeometry(r, 14, 10);
      const phi = side * (0.36 + dx);
      const rr = innerR + t1 + r * 0.25;
      g.translate(rr * Math.sin(phi), Math.min(rr * Math.cos(phi), y), dz);
      parts.push(g);
    }
  }
  const merged = mergeGeometries(parts);
  parts.forEach((g) => g.dispose());
  return merged;
}

export interface BuildOptions {
  type: JewelleryType;
  style: RingStyle;
  stone: StoneShape;
  /** US size for rings */
  size?: number;
  quality?: Quality;
}

export function buildJewellery({ type, style, stone: stoneShape, size = 7, quality = 'high' }: BuildOptions): JewelleryParts {
  const spec = RING_STYLES[style];
  const m = stoneMetrics(stoneShape);
  const stoneGeometry = buildStoneGeometry(stoneShape, quality);
  // pearls sit in a small cap where the sphere narrows, not in a full bezel
  const stone: StoneShape = stoneShape.cut === 'pearl' ? { ...stoneShape, a: stoneShape.a * 0.6, b: stoneShape.b * 0.6 } : stoneShape;
  const { geometry: bezel, depth, lipH } = bezelGeometry(spec, stone, quality);
  const metalParts: BufferGeometry[] = [bezel];
  if (isOpaqueCut(stone) && stone.cut !== 'pearl') metalParts.push(seatGeometry(stone, depth, quality));
  if (spec.milgrain) metalParts.push(milgrain(stone, spec, lipH + 0.004, 0.55, 0.011));
  if (spec.rope) metalParts.push(rope(stone, spec, -depth * 0.25, depth, quality));

  if (type === 'ring') {
    const innerR = innerRadiusForSize(size);
    const shank = shankGeometry(spec, innerR, quality);
    // girdle height: bezel base rests into the top of the shank
    const girdleY = innerR + spec.bandTop[0] + depth - 0.01;
    metalParts.push(galleryGeometry(spec, stone, depth, 0.13, quality));
    const metal = mergeGeometries(metalParts);
    metalParts.forEach((g) => g.dispose());
    // traditional north–south setting: the oval's long axis runs along the finger
    metal.rotateY(Math.PI / 2);
    metal.translate(0, girdleY, 0);
    let metalWithDetails = metal;
    if (spec.granules) {
      const g = granules(innerR, spec, girdleY - depth);
      metalWithDetails = mergeGeometries([metal, g]);
      metal.dispose();
      g.dispose();
    }
    return {
      shank,
      metal: metalWithDetails,
      stone: stoneGeometry,
      stoneOffset: new Vector3(0, girdleY, 0),
      stoneRotation: [0, Math.PI / 2, 0, 'XYZ'],
      radius: girdleY + m.crown + 0.1,
    };
  }

  if (type === 'pendant') {
    // bail: an elongated loop above the setting, rendered as the "shank" part
    const bailR = 0.12;
    const bail = new TorusGeometry(bailR, 0.032, 24, 96);
    bail.scale(0.9, 1.25, 1);
    bail.rotateY(Math.PI / 2);
    const jump = new TorusGeometry(0.05, 0.016, 16, 48);
    const metal = mergeGeometries(metalParts);
    metalParts.forEach((g) => g.dispose());
    let stoneRotation: JewelleryParts['stoneRotation'];
    let top: number;
    if (stone.cut === 'pearl') {
      // a pearl hangs beneath its cup, like a bell cap
      metal.rotateX(Math.PI);
      stoneRotation = [Math.PI, 0, 0, 'XYZ'];
      top = depth + 0.02;
      bail.translate(0, top + bailR * 1.15 + 0.03, 0);
      jump.translate(0, top + 0.02, 0);
    } else {
      // face the viewer with the oval's long axis vertical
      metal.rotateX(Math.PI / 2);
      metal.rotateZ(Math.PI / 2);
      stoneRotation = [Math.PI / 2, 0, Math.PI / 2, 'ZYX'];
      top = stone.a + spec.bezelWall;
      bail.translate(0, top + bailR * 1.1, -depth * 0.4);
      jump.translate(0, top + 0.02, -depth * 0.4);
    }
    const shank = mergeGeometries([bail, jump]);
    bail.dispose();
    jump.dispose();
    return {
      shank,
      metal,
      stone: stoneGeometry,
      stoneOffset: new Vector3(0, 0, 0),
      stoneRotation,
      radius: stone.a + 0.5,
    };
  }

  // bracelet: an open kada cuff with the stone set at the crown
  const cuffSpec: StyleSpec = { ...spec, bandBottom: [0.22, 0.34], bandTop: [0.3, Math.max(spec.bandTop[1], stone.b * 2 + 0.1)], taper: 3 };
  const innerR = 2.9;
  const gap = 0.07;
  const shankBody = shankGeometry(cuffSpec, innerR, quality, gap);
  // finials closing the open ends
  const finials: BufferGeometry[] = [];
  for (const side of [-1, 1]) {
    const phi = Math.PI + Math.PI * 2 * gap * side;
    const r = innerR + cuffSpec.bandBottom[0] / 2;
    const f = new SphereGeometry(0.19, 32, 24);
    f.translate(r * Math.sin(phi), r * Math.cos(phi), 0);
    finials.push(f);
  }
  const shank = mergeGeometries([shankBody, ...finials]);
  shankBody.dispose();
  finials.forEach((f) => f.dispose());
  const girdleY = innerR + cuffSpec.bandTop[0] + depth - 0.01;
  metalParts.push(galleryGeometry(spec, stone, depth, 0.12, quality));
  const metal = mergeGeometries(metalParts);
  metalParts.forEach((g) => g.dispose());
  metal.translate(0, girdleY, 0);
  return {
    shank,
    metal,
    stone: stoneGeometry,
    stoneOffset: new Vector3(0, girdleY, 0),
    stoneRotation: [0, 0, 0, 'XYZ'],
    radius: girdleY + 0.5,
  };
}
