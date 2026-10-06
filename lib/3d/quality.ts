export type QualityTier = 'high' | 'medium' | 'low';

/**
 * Coarse device tiering, decided once. PerformanceMonitor refines DPR at
 * runtime; this decides geometry density, shadows and transmission resolution.
 */
let cached: QualityTier | null = null;

export function detectQuality(): QualityTier {
  if (cached) return cached;
  if (typeof window === 'undefined') return 'medium';
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  const cores = nav.hardwareConcurrency ?? 4;
  const memory = nav.deviceMemory ?? 4;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const small = Math.min(window.innerWidth, window.innerHeight) < 600;
  const saveData = nav.connection?.saveData === true;
  if (saveData || cores <= 4 || memory <= 3) cached = 'low';
  else if (coarse || small || cores <= 6) cached = 'medium';
  else cached = 'high';
  return cached;
}

export const QUALITY = {
  high: { dpr: [1, 2] as [number, number], shadows: true, transmissionScale: 1, segments: 'high' as const },
  medium: { dpr: [1, 1.5] as [number, number], shadows: true, transmissionScale: 0.75, segments: 'medium' as const },
  low: { dpr: [0.8, 1.25] as [number, number], shadows: false, transmissionScale: 0.5, segments: 'low' as const },
};
