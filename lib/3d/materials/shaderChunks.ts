/** GLSL helpers injected into MeshPhysicalMaterial via onBeforeCompile. */
export const noiseGLSL = /* glsl */ `
float vy_hash(vec3 p) {
  p = fract(p * 0.3183099 + 0.1);
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}
float vy_noise(vec3 x) {
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(vy_hash(i + vec3(0,0,0)), vy_hash(i + vec3(1,0,0)), f.x),
                 mix(vy_hash(i + vec3(0,1,0)), vy_hash(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(vy_hash(i + vec3(0,0,1)), vy_hash(i + vec3(1,0,1)), f.x),
                 mix(vy_hash(i + vec3(0,1,1)), vy_hash(i + vec3(1,1,1)), f.x), f.y), f.z);
}
float vy_fbm(vec3 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * vy_noise(p);
    p = p * 2.03 + vec3(1.7, 9.2, 3.1);
    a *= 0.5;
  }
  return v;
}
`;
