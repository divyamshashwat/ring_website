/// <reference lib="webworker" />
import { drawScratches } from './draw';

self.onmessage = (event: MessageEvent<{ kind: 'scratches'; size: number; seed: number }>) => {
  const { size, seed } = event.data;
  const canvas = new OffscreenCanvas(size, size);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    self.postMessage({ error: 'no-context' });
    return;
  }
  drawScratches(ctx, size, seed);
  const bitmap = canvas.transferToImageBitmap();
  (self as unknown as Worker).postMessage({ bitmap }, [bitmap]);
};
