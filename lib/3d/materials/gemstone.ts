import { Color, MeshPhysicalMaterial, Vector3, type Mesh, type Camera } from 'three';
import { noiseGLSL } from './shaderChunks';

/**
 * Reusable gemstone material system.
 *
 * Every stone is a MeshPhysicalMaterial (real transmission, IOR, attenuation,
 * dispersion, iridescence, sheen) extended with small, physically motivated
 * shader effects: inclusions, organic colour variation, chatoyancy (cat's eye),
 * adularescence (moonstone), wrapped subsurface light (coral, pearl), and
 * pyrite flecks that are actually metallic (lapis).
 */
export interface GemSpec {
  color: string;
  roughness: number;
  transmission?: number;
  thickness?: number;
  ior?: number;
  attenuationColor?: string;
  attenuationDistance?: number;
  dispersion?: number;
  clearcoat?: number;
  clearcoatRoughness?: number;
  iridescence?: number;
  iridescenceIOR?: number;
  iridescenceThicknessRange?: [number, number];
  sheen?: number;
  sheenColor?: string;
  sheenRoughness?: number;
  envMapIntensity?: number;
  specularIntensity?: number;
  /**
   * Faceted stones are ray traced: refraction with total internal reflection
   * through the actual facet geometry (BVH), which gives brilliance and
   * windowing that rasterised transmission cannot.
   */
  refraction?: { color: string; ior: number; bounces: number; aberration: number; fresnel?: number; gain?: number };
  /** light with the bright gem tent instead of the metal studio (pearls, moonstone) */
  tentLit?: boolean;
  effects?: {
    inclusions?: { scale: number; strength: number; tint: string; roughness?: number };
    variation?: { scale: number; strength: number; growthLines?: boolean };
    chatoyancy?: { color: string; width: number; strength: number };
    adularescence?: { color: string; strength: number };
    sss?: { color: string; strength: number };
    lapis?: boolean;
  };
}

export const GEM_SPECS: Record<string, GemSpec> = {
  moonga: {
    color: '#c5452b',
    roughness: 0.16,
    transmission: 0.16,
    thickness: 0.6,
    ior: 1.55,
    attenuationColor: '#a3200f',
    attenuationDistance: 0.25,
    clearcoat: 0.7,
    clearcoatRoughness: 0.1,
    effects: { variation: { scale: 5, strength: 0.16, growthLines: true }, sss: { color: '#ff4f22', strength: 0.07 } },
  },
  manik: {
    refraction: { color: '#ff2a44', ior: 1.76, bounces: 3, aberration: 0.006, gain: 1.15 },
    color: '#ff7480',
    roughness: 0.02,
    transmission: 1,
    thickness: 0.5,
    ior: 1.76,
    attenuationColor: '#9c0d24',
    attenuationDistance: 0.17,
    dispersion: 0.6,
    envMapIntensity: 1.6,
    effects: { inclusions: { scale: 28, strength: 0.1, tint: '#ffd9de' } },
  },
  moti: {
    tentLit: true,
    color: '#f1ebe1',
    roughness: 0.2,
    clearcoat: 1,
    clearcoatRoughness: 0.08,
    iridescence: 0.55,
    iridescenceIOR: 1.45,
    iridescenceThicknessRange: [180, 520],
    sheen: 0.6,
    sheenColor: '#f3dcd9',
    sheenRoughness: 0.35,
    effects: { sss: { color: '#ffeedd', strength: 0.05 }, variation: { scale: 3, strength: 0.05 } },
  },
  panna: {
    refraction: { color: '#1fb072', ior: 1.58, bounces: 2, aberration: 0.003, gain: 1.3 },
    color: '#a6e3be',
    roughness: 0.04,
    transmission: 0.93,
    thickness: 0.5,
    ior: 1.58,
    attenuationColor: '#0b6c43',
    attenuationDistance: 0.2,
    envMapIntensity: 1.5,
    effects: { inclusions: { scale: 13, strength: 0.38, tint: '#d4ead9', roughness: 0.22 } },
  },
  pukhraj: {
    refraction: { color: '#ffe066', ior: 1.76, bounces: 3, aberration: 0.006, gain: 1.75 },
    color: '#ffe8ab',
    roughness: 0.02,
    transmission: 1,
    thickness: 0.5,
    ior: 1.76,
    attenuationColor: '#e1a419',
    attenuationDistance: 0.42,
    dispersion: 0.5,
    envMapIntensity: 1.6,
  },
  heera: {
    refraction: { color: '#ffffff', ior: 2.42, bounces: 4, aberration: 0.02, gain: 1.15 },
    color: '#ffffff',
    roughness: 0,
    transmission: 1,
    thickness: 0.35,
    ior: 2.42,
    dispersion: 4,
    envMapIntensity: 2.3,
    specularIntensity: 1,
  },
  neelam: {
    refraction: { color: '#4568ff', ior: 1.76, bounces: 3, aberration: 0.006, gain: 1.2 },
    color: '#a3b6ff',
    roughness: 0.02,
    transmission: 1,
    thickness: 0.5,
    ior: 1.76,
    attenuationColor: '#14309a',
    attenuationDistance: 0.15,
    dispersion: 0.4,
    envMapIntensity: 1.6,
    effects: { inclusions: { scale: 30, strength: 0.08, tint: '#c8d3ff' } },
  },
  gomed: {
    refraction: { color: '#ff8d40', ior: 1.74, bounces: 3, aberration: 0.006, gain: 1.35 },
    color: '#ffc292',
    roughness: 0.03,
    transmission: 0.95,
    thickness: 0.5,
    ior: 1.74,
    attenuationColor: '#b04a1a',
    attenuationDistance: 0.24,
    envMapIntensity: 1.5,
    effects: { inclusions: { scale: 7, strength: 0.2, tint: '#c86c2c' } },
  },
  lehsunia: {
    color: '#b6a264',
    roughness: 0.1,
    transmission: 0.32,
    thickness: 0.6,
    ior: 1.75,
    attenuationColor: '#7d6b28',
    attenuationDistance: 0.4,
    clearcoat: 0.8,
    clearcoatRoughness: 0.06,
    effects: { chatoyancy: { color: '#fff4d6', width: 0.07, strength: 1 }, variation: { scale: 4, strength: 0.06 } },
  },
  'lapis-lazuli': {
    color: '#22408f',
    roughness: 0.36,
    clearcoat: 0.45,
    clearcoatRoughness: 0.22,
    effects: { lapis: true },
  },
  amethyst: {
    refraction: { color: '#b878ff', ior: 1.55, bounces: 3, aberration: 0.004, gain: 1.2 },
    color: '#e6ccff',
    roughness: 0.02,
    transmission: 1,
    thickness: 0.5,
    ior: 1.55,
    attenuationColor: '#5d2c88',
    attenuationDistance: 0.3,
    envMapIntensity: 1.5,
    effects: { inclusions: { scale: 9, strength: 0.08, tint: '#f1e2ff' } },
  },
  citrine: {
    refraction: { color: '#ffc566', ior: 1.55, bounces: 3, aberration: 0.004, gain: 1.6 },
    color: '#ffe2ad',
    roughness: 0.02,
    transmission: 1,
    thickness: 0.5,
    ior: 1.55,
    attenuationColor: '#d8871e',
    attenuationDistance: 0.4,
    envMapIntensity: 1.5,
  },
  moonstone: {
    tentLit: true,
    color: '#eceff2',
    roughness: 0.16,
    transmission: 0.55,
    thickness: 0.6,
    ior: 1.52,
    attenuationColor: '#d6dbe6',
    attenuationDistance: 0.6,
    clearcoat: 0.8,
    clearcoatRoughness: 0.08,
    effects: { adularescence: { color: '#7ea0ff', strength: 0.45 }, sss: { color: '#e9eeff', strength: 0.05 } },
  },
};

/** Shared uniforms: the key light direction is the same for every stone in a scene. */
export const sharedGemUniforms = {
  uKeyDir: { value: new Vector3(0.25, 1, 0.55).normalize() },
};

export interface GemMaterial extends MeshPhysicalMaterial {
  userData: {
    slug: string;
    uniforms: Record<string, { value: unknown }>;
  };
}

const vec3 = (hex: string) => {
  const c = new Color(hex);
  return new Vector3(c.r, c.g, c.b);
};

export function createGemMaterial(slug: string): GemMaterial {
  const spec = GEM_SPECS[slug] ?? GEM_SPECS.moonga;
  const material = new MeshPhysicalMaterial({
    color: spec.color,
    roughness: spec.roughness,
    metalness: 0,
    transmission: spec.transmission ?? 0,
    thickness: spec.thickness ?? 0,
    ior: spec.ior ?? 1.5,
    attenuationColor: spec.attenuationColor ? new Color(spec.attenuationColor) : new Color('#ffffff'),
    attenuationDistance: spec.attenuationDistance ?? Infinity,
    dispersion: spec.dispersion ?? 0,
    clearcoat: spec.clearcoat ?? 0,
    clearcoatRoughness: spec.clearcoatRoughness ?? 0,
    iridescence: spec.iridescence ?? 0,
    iridescenceIOR: spec.iridescenceIOR ?? 1.3,
    iridescenceThicknessRange: spec.iridescenceThicknessRange ?? [100, 400],
    sheen: spec.sheen ?? 0,
    sheenColor: spec.sheenColor ? new Color(spec.sheenColor) : new Color('#000000'),
    sheenRoughness: spec.sheenRoughness ?? 1,
    envMapIntensity: spec.envMapIntensity ?? 1.3,
    specularIntensity: spec.specularIntensity ?? 1,
  }) as GemMaterial;
  material.name = `Stone:${slug}`;

  const fx = spec.effects ?? {};
  const uniforms: Record<string, { value: unknown }> = {
    uDim: { value: 1 },
    uKeyDir: sharedGemUniforms.uKeyDir,
    uFibre: { value: new Vector3(0, 0, 1) },
    uInclScale: { value: fx.inclusions?.scale ?? 1 },
    uInclStrength: { value: fx.inclusions?.strength ?? 0 },
    uInclTint: { value: vec3(fx.inclusions?.tint ?? '#ffffff') },
    uInclRough: { value: fx.inclusions?.roughness ?? 0 },
    uVarScale: { value: fx.variation?.scale ?? 1 },
    uVarStrength: { value: fx.variation?.strength ?? 0 },
    uBandColor: { value: vec3(fx.chatoyancy?.color ?? '#ffffff') },
    uBandWidth: { value: fx.chatoyancy?.width ?? 0.1 },
    uBandStrength: { value: fx.chatoyancy?.strength ?? 0 },
    uGlowColor: { value: vec3(fx.adularescence?.color ?? '#ffffff') },
    uGlowStrength: { value: fx.adularescence?.strength ?? 0 },
    uSssColor: { value: vec3(fx.sss?.color ?? '#ffffff') },
    uSss: { value: fx.sss?.strength ?? 0 },
  };
  const defines: string[] = [];
  if (fx.inclusions) defines.push('VY_INCLUSIONS');
  if (fx.variation) defines.push('VY_VARIATION');
  if (fx.variation?.growthLines) defines.push('VY_GROWTH');
  if (fx.chatoyancy) defines.push('VY_CHATOYANCY');
  if (fx.adularescence) defines.push('VY_ADULARESCENCE');
  if (fx.sss) defines.push('VY_SSS');
  if (fx.lapis) defines.push('VY_LAPIS');

  material.userData = { slug, uniforms };
  material.customProgramCacheKey = () => `vy-gem:${defines.join(',')}`;
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    const defineBlock = defines.map((d) => `#define ${d}`).join('\n');
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\nvarying vec3 vyObjPos;\nvarying vec3 vyWNormal;\nvarying vec3 vyWPos;`)
      .replace(
        '#include <project_vertex>',
        `#include <project_vertex>\nvyObjPos = position;\nvyWNormal = normalize(mat3(modelMatrix) * objectNormal);\nvyWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
${defineBlock}
varying vec3 vyObjPos;
varying vec3 vyWNormal;
varying vec3 vyWPos;
uniform float uDim;
uniform vec3 uKeyDir;
uniform vec3 uFibre;
uniform float uInclScale, uInclStrength, uInclRough, uVarScale, uVarStrength;
uniform vec3 uInclTint;
uniform vec3 uBandColor; uniform float uBandWidth; uniform float uBandStrength;
uniform vec3 uGlowColor; uniform float uGlowStrength;
uniform vec3 uSssColor; uniform float uSss;
float vyIncl = 0.0;
float vyFleck = 0.0;
${noiseGLSL}`,
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
#ifdef VY_INCLUSIONS
  float vyN = vy_fbm(vyObjPos * uInclScale);
  vyIncl = smoothstep(0.5, 0.8, vyN);
  diffuseColor.rgb = mix(diffuseColor.rgb, uInclTint, vyIncl * uInclStrength);
#endif
#ifdef VY_VARIATION
  float vyVar = vy_fbm(vyObjPos * uVarScale + 3.0);
  diffuseColor.rgb *= 1.0 + (vyVar - 0.5) * uVarStrength;
  #ifdef VY_GROWTH
    // fine longitudinal growth striations, broken up so they never read as brushing
    float vyLines = sin(vyObjPos.x * 46.0 + vyVar * 14.0 + vy_noise(vyObjPos * 9.0) * 4.0);
    diffuseColor.rgb *= 1.0 - smoothstep(0.94, 1.0, vyLines) * 0.035;
  #endif
#endif
#ifdef VY_LAPIS
  float vyL = vy_fbm(vyObjPos * 9.0);
  float vyCalcite = smoothstep(0.64, 0.78, vy_fbm(vyObjPos * 4.0 + 11.0));
  diffuseColor.rgb = mix(diffuseColor.rgb * (0.72 + 0.56 * vyL), vec3(0.6, 0.64, 0.7), vyCalcite * 0.5);
  vyFleck = step(0.83, vy_noise(vyObjPos * 150.0)) * smoothstep(0.38, 0.7, vy_fbm(vyObjPos * 6.0 + 5.0));
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.86, 0.68, 0.32), vyFleck);
#endif`,
      )
      .replace(
        '#include <roughnessmap_fragment>',
        `#include <roughnessmap_fragment>
  roughnessFactor = clamp(roughnessFactor + vyIncl * uInclRough, 0.0, 1.0);
  roughnessFactor = mix(roughnessFactor, 0.22, vyFleck);`,
      )
      .replace('#include <metalnessmap_fragment>', `#include <metalnessmap_fragment>\n  metalnessFactor = mix(metalnessFactor, 1.0, vyFleck);`)
      .replace(
        '#include <opaque_fragment>',
        `{
  vec3 vyNw = normalize(vyWNormal);
  vec3 vyV = normalize(cameraPosition - vyWPos);
#ifdef VY_CHATOYANCY
  // The silk fibres run along uFibre. Light scattered by parallel fibres gathers
  // where the surface normal's component along the fibres balances the half
  // vector's — so the line slides across the dome as the stone or light moves.
  vec3 vyH = normalize(uKeyDir + vyV);
  float vyD = dot(vyNw, uFibre) - dot(vyH, uFibre) * 0.9;
  float vyW2 = uBandWidth * uBandWidth;
  float vyCore = exp(-vyD * vyD / vyW2);
  float vyHalo = exp(-vyD * vyD / (vyW2 * 9.0));
  float vyFacing = smoothstep(0.05, 0.45, dot(vyNw, vyV));
  outgoingLight += uBandColor * (vyCore * 0.85 + vyHalo * 0.16) * uBandStrength * vyFacing;
  float vyMilk = smoothstep(0.1, 0.9, dot(vyNw, uKeyDir)) * 0.1 * uBandStrength;
  outgoingLight = mix(outgoingLight, uBandColor * 0.45, vyMilk);
#endif
#ifdef VY_ADULARESCENCE
  vec3 vyH2 = normalize(uKeyDir + vyV);
  float vyG = pow(max(dot(vyNw, vyH2), 0.0), 4.0);
  outgoingLight += uGlowColor * vyG * (0.4 + vy_fbm(vyObjPos * 5.0)) * uGlowStrength;
#endif
#ifdef VY_SSS
  float vyRim = pow(1.0 - max(dot(vyNw, vyV), 0.0), 2.0);
  float vyWrap = dot(vyNw, uKeyDir) * 0.5 + 0.5;
  outgoingLight += uSssColor * (0.35 * vyWrap + 0.65 * vyRim) * uSss;
#endif
  outgoingLight *= uDim;
}
#include <opaque_fragment>`,
      );
  };
  return material;
}

const fibreLocal = new Vector3(0, 0, 1);
/**
 * Attach to a gemstone mesh so view-dependent effects follow the actual
 * orientation of the stone (dragging the ring moves the cat's eye).
 */
export function bindGemMesh(mesh: Mesh) {
  mesh.onBeforeRender = (_renderer, _scene, _camera: Camera) => {
    const material = mesh.material as GemMaterial;
    const fibre = material.userData?.uniforms?.uFibre?.value as Vector3 | undefined;
    if (fibre) fibre.copy(fibreLocal).transformDirection(mesh.matrixWorld);
  };
}

export function setGemDim(material: MeshPhysicalMaterial, value: number) {
  const u = (material as GemMaterial).userData?.uniforms?.uDim;
  if (u) u.value = value;
}
