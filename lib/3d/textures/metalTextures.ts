import { CanvasTexture, LinearSRGBColorSpace, NoColorSpace, RepeatWrapping, Texture } from 'three';
import { drawHallmark, drawScratches } from './draw';

/**
 * Procedural metal textures. The scratch map is drawn once per page, just after
 * the first frame, so it never delays the first paint of a scene.
 */
let scratchPromise: Promise<HTMLCanvasElement> | null = null;

function generateScratchImage(size: number): Promise<HTMLCanvasElement> {
  scratchPromise ??= new Promise((resolve) => {
    setTimeout(() => {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (ctx) drawScratches(ctx, size, 11);
      resolve(canvas);
    }, 60);
  });
  return scratchPromise;
}

/** Returns a texture immediately; its image is drawn shortly after. */
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

export function createHallmarkTexture(text: string, width = 2048): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = width / 4;
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
