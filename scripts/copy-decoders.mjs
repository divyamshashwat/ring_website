// Copies the Draco and Basis (KTX2) decoders from three into /public so the
// site never depends on a third-party CDN to decode its own jewellery assets.
import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const libs = join(root, 'node_modules/three/examples/jsm/libs');
const targets = [
  [join(libs, 'draco/gltf'), join(root, 'public/decoders/draco')],
  [join(libs, 'basis'), join(root, 'public/decoders/basis')],
];
for (const [from, to] of targets) {
  if (!existsSync(from)) continue;
  mkdirSync(to, { recursive: true });
  cpSync(from, to, { recursive: true });
}
