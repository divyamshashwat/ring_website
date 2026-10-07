import { BufferAttribute, BufferGeometry, Vector3 } from 'three';

/**
 * Builds a smooth parametric surface on a (u, v) grid.
 *
 * Seams are duplicated (so UVs stay continuous for brushed-metal and engraving
 * maps) and the seam normals are then averaged, so polished surfaces never show
 * a shading crease where the grid wraps.
 */
export function parametricSurface(
  uSegments: number,
  vSegments: number,
  fn: (u: number, v: number, target: Vector3) => void,
  options: { wrapU?: boolean; wrapV?: boolean; uvScale?: [number, number] } = {},
): BufferGeometry {
  const { wrapU = false, wrapV = false, uvScale = [1, 1] } = options;
  const cols = uSegments + 1;
  const rows = vSegments + 1;
  const positions = new Float32Array(cols * rows * 3);
  const uvs = new Float32Array(cols * rows * 2);
  const p = new Vector3();

  for (let j = 0; j < rows; j++) {
    const v = j / vSegments;
    for (let i = 0; i < cols; i++) {
      const u = i / uSegments;
      fn(u, v, p);
      const k = j * cols + i;
      positions[k * 3] = p.x;
      positions[k * 3 + 1] = p.y;
      positions[k * 3 + 2] = p.z;
      uvs[k * 2] = u * uvScale[0];
      uvs[k * 2 + 1] = v * uvScale[1];
    }
  }

  const indices: number[] = [];
  for (let j = 0; j < vSegments; j++) {
    for (let i = 0; i < uSegments; i++) {
      const a = j * cols + i;
      const b = j * cols + i + 1;
      const c = (j + 1) * cols + i + 1;
      const d = (j + 1) * cols + i;
      indices.push(a, b, d, b, c, d);
    }
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  const normals = geometry.getAttribute('normal') as BufferAttribute;
  const n = new Vector3();
  const m = new Vector3();
  const average = (k1: number, k2: number) => {
    n.fromBufferAttribute(normals, k1);
    m.fromBufferAttribute(normals, k2);
    n.add(m).normalize();
    normals.setXYZ(k1, n.x, n.y, n.z);
    normals.setXYZ(k2, n.x, n.y, n.z);
  };
  if (wrapU) for (let j = 0; j < rows; j++) average(j * cols, j * cols + uSegments);
  if (wrapV) for (let i = 0; i < cols; i++) average(i, vSegments * cols + i);
  normals.needsUpdate = true;
  return geometry;
}

/** Set to an array to record outward fractions (geometry QA only). */
export let orientationLog: number[] | null = null;
export const recordOrientation = (log: number[] | null) => {
  orientationLog = log;
};

/**
 * Makes a surface face outward: if most triangles point toward `centre(p)`,
 * the winding is reversed and the normals negated. Returns the outward fraction
 * measured before any flip (used by the geometry QA script).
 */
export function orientOutward(geometry: BufferGeometry, centre: (p: Vector3, target: Vector3) => Vector3): number {
  const pos = geometry.getAttribute('position') as BufferAttribute;
  const index = geometry.index!;
  const a = new Vector3();
  const b = new Vector3();
  const c = new Vector3();
  const m = new Vector3();
  const k = new Vector3();
  const e1 = new Vector3();
  const e2 = new Vector3();
  let out = 0;
  let total = 0;
  for (let i = 0; i < index.count; i += 3) {
    a.fromBufferAttribute(pos, index.getX(i));
    b.fromBufferAttribute(pos, index.getX(i + 1));
    c.fromBufferAttribute(pos, index.getX(i + 2));
    e1.subVectors(b, a);
    e2.subVectors(c, a);
    e1.cross(e2);
    if (e1.lengthSq() < 1e-16) continue;
    m.copy(a).add(b).add(c).divideScalar(3);
    centre(m, k);
    if (e1.dot(m.sub(k)) > 0) out++;
    total++;
  }
  const fraction = total ? out / total : 1;
  orientationLog?.push(fraction);
  if (fraction < 0.5) {
    const arr = index.array as Uint16Array | Uint32Array;
    for (let i = 0; i < arr.length; i += 3) {
      const t = arr[i + 1];
      arr[i + 1] = arr[i + 2];
      arr[i + 2] = t;
    }
    index.needsUpdate = true;
    const normals = geometry.getAttribute('normal') as BufferAttribute;
    for (let i = 0; i < normals.array.length; i++) (normals.array as Float32Array)[i] *= -1;
    normals.needsUpdate = true;
  }
  return fraction;
}

/** Flat-shaded faceted geometry from triangles (used for cut gemstones). */
export function facetedGeometry(triangles: number[][]): BufferGeometry {
  const positions = new Float32Array(triangles.length * 9);
  triangles.forEach((t, i) => positions.set(t, i * 9));
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  // planar UVs (x/z) so procedural shaders and maps have coordinates to work with
  const uvs = new Float32Array((positions.length / 3) * 2);
  for (let i = 0; i < positions.length / 3; i++) {
    uvs[i * 2] = positions[i * 3] * 0.5 + 0.5;
    uvs[i * 2 + 1] = positions[i * 3 + 2] * 0.5 + 0.5;
  }
  geometry.setAttribute('uv', new BufferAttribute(uvs, 2));
  // sequential index: keeps facets flat-shaded while allowing Draco compression and merging
  geometry.setIndex([...Array(positions.length / 3).keys()]);
  return geometry;
}

export const smoothstep = (e0: number, e1: number, x: number) => {
  const t = Math.min(Math.max((x - e0) / (e1 - e0), 0), 1);
  return t * t * (3 - 2 * t);
};
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Signed power keeps superellipse profiles symmetrical. */
export const spow = (x: number, e: number) => Math.sign(x) * Math.pow(Math.abs(x), e);

/** Deterministic pseudo-random — geometry must be identical between runs and the GLB export. */
export function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
