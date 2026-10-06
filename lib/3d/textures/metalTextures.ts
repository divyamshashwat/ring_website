import { CanvasTexture, LinearSRGBColorSpace, NoColorSpace, RepeatWrapping, Texture } from 'three';
import { drawHallmark, drawScratches } from './draw';

/**
 * Procedural metal textures. The scratch map is generated off the main thread
 * in a Web Worker (OffscreenCanvas) when available, so it never competes with
 * first paint or scroll.
 */
let scratchPromise: Promise<ImageBitmap | HTMLCanvasElement> | null = null;

function generateScratchImage(size: number): Promise<ImageBitmap | HTMLCanvasElement> {
  if (scratchPromise) return scratchPromise;
  scratchPromise = new Promise((resolve) => {
    const fallback = () => {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = size;
      drawScratches(canvas.getContext('2d')!, size, 11);
      resolve(canvas);
    };
    if (typeof Worker === 'undefined' || typeof OffscreenCanvas === 'undefined') return fallback();
    try {
      const worker = new Worker(new URL('./texture.worker.ts', import.meta.url), { type: 'module' });
      const timer = setTimeout(() => {
        worker.terminate();
        fallback();
      }, 4000);
      worker.onmessage = (e: MessageEvent<{ bitmap?: ImageBitmap }>) => {
        clearTimeout(timer);
        worker.terminate();
        if (e.data.bitmap) resolve(e.data.bitmap);
        else fallback();
      };
      worker.onerror = () => {
        clearTimeout(timer);
        worker.terminate();
        fallback();
      };
      worker.postMessage({ kind: 'scratches', size, seed: 11 });
    } catch {
      fallback();
    }
  });
  return scratchPromise;
}

/** Returns a texture immediately; its image arrives from the worker shortly after. */
export function createScratchTexture(size = 1024): Texture {
  const texture = new Texture();
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.repeat.set(3, 1);
  texture.colorSpace = NoColorSpace;
  texture.anisotropy = 4;
  texture.flipY = false;
  generateScratchImage(size).then((image) => {
    texture.image = image;
    texture.needsUpdate = true;
  });
  return texture;
}

export function createHallmarkTexture(text: string): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 512;
  drawHallmark(canvas.getContext('2d')!, canvas.width, canvas.height, text);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = LinearSRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

export function updateHallmarkTexture(texture: CanvasTexture, text: string) {
  const canvas = texture.image as HTMLCanvasElement;
  drawHallmark(canvas.getContext('2d')!, canvas.width, canvas.height, text);
  texture.needsUpdate = true;
}
