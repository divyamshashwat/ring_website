/**
 * Client diagnostics for 3D failures. Open any page with ?debug to see them
 * on screen — used to find out why WebGL fails on a specific device.
 */
export interface DiagState {
  webgl2: boolean | null;
  renderer: string;
  events: { t: number; kind: string; detail: string }[];
}

const state: DiagState = { webgl2: null, renderer: '', events: [] };
const listeners = new Set<() => void>();

export function report(kind: string, detail: string) {
  state.events.push({ t: Math.round(performance.now()), kind, detail: detail.slice(0, 400) });
  if (state.events.length > 40) state.events.shift();
  listeners.forEach((l) => l());
}

export function setGpu(webgl2: boolean, renderer: string) {
  state.webgl2 = webgl2;
  state.renderer = renderer;
  listeners.forEach((l) => l());
}

export const getDiag = () => state;
export function subscribeDiag(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

if (typeof window !== 'undefined') {
  window.addEventListener('error', (e) => report('window-error', `${e.message} @ ${e.filename?.split('/').pop()}:${e.lineno}`));
  window.addEventListener('unhandledrejection', (e) => report('promise', String((e.reason as Error)?.message ?? e.reason)));
}
