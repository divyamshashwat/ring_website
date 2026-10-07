/**
 * Client diagnostics for 3D failures. Open any page with ?debug to see them
 * on screen — used to find out why WebGL fails on a specific device.
 *
 * Events are also kept in sessionStorage, so if a phone browser kills and
 * reloads the tab (out of memory), the next load still shows what happened.
 */
export interface DiagEvent {
  t: number;
  kind: string;
  detail: string;
}

export interface DiagState {
  webgl2: boolean | null;
  renderer: string;
  events: DiagEvent[];
  /** events of the previous load of this tab, when it did not end cleanly */
  previous: { path: string; events: DiagEvent[] } | null;
}

const KEY = 'vyoma-diag';
const state: DiagState = { webgl2: null, renderer: '', events: [], previous: null };
const listeners = new Set<() => void>();

function persist(clean: boolean) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ path: location.pathname, clean, events: state.events }));
  } catch {}
}

export function report(kind: string, detail: string) {
  state.events.push({ t: Math.round(performance.now()), kind, detail: detail.slice(0, 600) });
  if (state.events.length > 60) state.events.shift();
  if (typeof window !== 'undefined') persist(false);
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

/** ?debug turns the on-screen panel on for the rest of this tab's session (pages may rewrite their URL). */
export function debugEnabled() {
  try {
    return sessionStorage.getItem('vyoma-debug') === '1';
  } catch {
    return new URLSearchParams(location.search).has('debug');
  }
}

if (typeof window !== 'undefined') {
  try {
    if (new URLSearchParams(location.search).has('debug')) sessionStorage.setItem('vyoma-debug', '1');
  } catch {}
  try {
    const prev = JSON.parse(sessionStorage.getItem(KEY) ?? 'null') as { path: string; clean: boolean; events: DiagEvent[] } | null;
    if (prev && !prev.clean && prev.events.length) state.previous = { path: prev.path, events: prev.events };
  } catch {}
  persist(false);
  window.addEventListener('pagehide', () => persist(true));
  window.addEventListener('error', (e) => report('window-error', `${e.message} @ ${e.filename?.split('/').pop()}:${e.lineno}`));
  window.addEventListener('unhandledrejection', (e) => report('promise', String((e.reason as Error)?.message ?? e.reason)));
  // three.js reports GPU problems on the console; keep a copy of them
  for (const level of ['error', 'warn'] as const) {
    const original = console[level].bind(console);
    console[level] = (...args: unknown[]) => {
      const first = typeof args[0] === 'string' ? args[0] : '';
      if ((first.startsWith('THREE.') && !first.startsWith('THREE.Clock')) || first.includes('WebGL')) report(`console-${level}`, args.map(String).join(' '));
      original(...args);
    };
  }
}
