export type QualityTier = 'high' | 'medium' | 'low';

/**
 * Coarse device tiering, decided once. PerformanceMonitor refines DPR at
 * runtime; this decides geometry density, shadows and transmission resolution.
 */
let cached: QualityTier | null = null;

export function detectQuality(): QualityTier {
  if (cached) return cached;
  if (typeof window === 'undefined') return 'medium';
  // QA override: ?tier=high|medium|low
  const forced = new URLSearchParams(window.location.search).get('tier');
  if (forced === 'high' || forced === 'medium' || forced === 'low') return (cached = forced);
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  const cores = nav.hardwareConcurrency ?? 4;
  const memory = nav.deviceMemory ?? 4;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const small = Math.min(window.innerWidth, window.innerHeight) < 600;
  const saveData = nav.connection?.saveData === true;
  // phones share a small GPU memory budget across every tab: always the light tier
  const phone = coarse && small;
  if (saveData || phone || cores <= 4 || memory <= 3) cached = 'low';
  else if (coarse || small || cores <= 6) cached = 'medium';
  else cached = 'high';
  return cached;
}

/**
 * Every tier renders sharp: up to 2× pixels with multisampling (cheap on the
 * tile-based GPUs in phones). PerformanceMonitor steps the pixel ratio down
 * only if a device actually struggles. The light tier saves its GPU time where
 * it does not show: no partial-transmission pass, fewer bounces in faceted stones.
 */
export const QUALITY = {
  high: { dpr: [1, 2] as [number, number], transmissionScale: 1 },
  medium: { dpr: [1, 2] as [number, number], transmissionScale: 0.75 },
  low: { dpr: [1, 2] as [number, number], transmissionScale: 0.5 },
};
