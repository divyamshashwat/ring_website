import { create } from 'zustand';

export type CursorMode = 'default' | 'link' | 'view' | 'rotate' | 'explore' | 'drag' | 'hidden';

interface UIState {
  menuOpen: boolean;
  searchOpen: boolean;
  cursor: CursorMode;
  /** set once the first 3D scene has rendered (or fallen back to its still): ends the loading screen */
  sceneReady: boolean;
  /** the 3D code for the first scene has arrived and its canvas exists */
  sceneMounted: boolean;
  setSceneMounted: () => void;
  /** 0–1 asset loading progress of the first scene */
  progress: number;
  setProgress: (p: number) => void;
  setMenu: (open: boolean) => void;
  setSearch: (open: boolean) => void;
  setCursor: (mode: CursorMode) => void;
  setSceneReady: () => void;
}

export const useUI = create<UIState>((set) => ({
  menuOpen: false,
  searchOpen: false,
  cursor: 'default',
  sceneReady: false,
  sceneMounted: false,
  setSceneMounted: () => set({ sceneMounted: true }),
  progress: 0,
  setProgress: (progress) => set({ progress }),
  setMenu: (menuOpen) => set({ menuOpen }),
  setSearch: (searchOpen) => set({ searchOpen }),
  setCursor: (cursor) => set({ cursor }),
  setSceneReady: () => set({ sceneReady: true }),
}));
