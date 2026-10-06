/**
 * Exports the house ring models as Draco-compressed GLB files.
 *
 *   npm run models
 *
 * Each GLB contains three meshes the site recognises by name:
 *   shank — the band (receives the engraved hallmark)
 *   metal — bezel, seat and decorative metal
 *   stone — the gemstone
 * An artist-authored model exported with the same mesh names can replace any
 * of these files without touching application code.
 */
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Document, NodeIO, type Material } from '@gltf-transform/core';
import { KHRDracoMeshCompression } from '@gltf-transform/extensions';
import draco3d from 'draco3dgltf';
import type { BufferGeometry } from 'three';
import { buildJewellery, type RingStyle } from '../lib/3d/geometry/jewellery';
import { buildStoneGeometry } from '../lib/3d/geometry/stones';
import { gemstones } from '../lib/data/gemstones';
import { stoneShapeFor } from '../lib/data/pricing';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function addMesh(doc: Document, name: string, geometry: BufferGeometry, material: Material, translation: [number, number, number] = [0, 0, 0]) {
  const g = geometry;
  const buffer = doc.getRoot().listBuffers()[0];
  const pos = doc.createAccessor().setType('VEC3').setArray(g.getAttribute('position').array as Float32Array).setBuffer(buffer);
  const nor = doc.createAccessor().setType('VEC3').setArray(g.getAttribute('normal').array as Float32Array).setBuffer(buffer);
  const index = g.index ? Uint32Array.from(g.index.array) : Uint32Array.from({ length: g.getAttribute('position').count }, (_, i) => i);
  const idx = doc.createAccessor().setType('SCALAR').setArray(index).setBuffer(buffer);
  const prim = doc.createPrimitive().setAttribute('POSITION', pos).setAttribute('NORMAL', nor).setIndices(idx).setMaterial(material);
  const uv = g.getAttribute('uv');
  if (uv) prim.setAttribute('TEXCOORD_0', doc.createAccessor().setType('VEC2').setArray(uv.array as Float32Array).setBuffer(buffer));
  const mesh = doc.createMesh(name).addPrimitive(prim);
  return doc.createNode(name).setMesh(mesh).setTranslation(translation);
}

async function writeGlb(doc: Document, file: string) {
  const io = new NodeIO().registerExtensions([KHRDracoMeshCompression]).registerDependencies({
    'draco3d.encoder': await draco3d.createEncoderModule(),
    'draco3d.decoder': await draco3d.createDecoderModule(),
  });
  doc
    .createExtension(KHRDracoMeshCompression)
    .setRequired(true)
    .setEncoderOptions({
      method: KHRDracoMeshCompression.EncoderMethod.EDGEBREAKER,
      encodeSpeed: 3,
      decodeSpeed: 5,
      // polished metal shows normal quantisation as banding — keep normals precise
      quantizationBits: { POSITION: 16, NORMAL: 14, TEX_COORD: 12 },
    });
  mkdirSync(dirname(file), { recursive: true });
  await io.write(file, doc);
  console.log('wrote', file.replace(root, ''));
}

function newDoc() {
  const doc = new Document();
  doc.createBuffer();
  const metal = doc.createMaterial('Metal').setBaseColorFactor([0.98, 0.72, 0.33, 1]).setMetallicFactor(1).setRoughnessFactor(0.16);
  const stone = doc.createMaterial('Stone').setBaseColorFactor([0.62, 0.14, 0.07, 1]).setMetallicFactor(0).setRoughnessFactor(0.15);
  return { doc, metal, stone };
}

async function main() {
  const styles: RingStyle[] = ['classic', 'minimal', 'heritage', 'contemporary'];
  const moonga = gemstones.find((g) => g.slug === 'moonga')!;
  for (const style of styles) {
    const { doc, metal, stone } = newDoc();
    const parts = buildJewellery({ type: 'ring', style, stone: stoneShapeFor(moonga, 'medium'), size: 7, quality: 'high' });
    const scene = doc.createScene('ring');
    scene.addChild(addMesh(doc, 'shank', parts.shank, metal));
    scene.addChild(addMesh(doc, 'metal', parts.metal, metal));
    const stoneGeometry = parts.stone.clone();
    stoneGeometry.rotateY(parts.stoneRotation[1]);
    scene.addChild(addMesh(doc, 'stone', stoneGeometry, stone, parts.stoneOffset.toArray() as [number, number, number]));
    await writeGlb(doc, join(root, `public/models/rings/vyoma-${style}-moonga.glb`));
  }
  for (const gem of gemstones) {
    const { doc, stone } = newDoc();
    const scene = doc.createScene(gem.slug);
    scene.addChild(addMesh(doc, 'stone', buildStoneGeometry(stoneShapeFor(gem, 'medium'), 'high'), stone));
    await writeGlb(doc, join(root, `public/models/gemstones/${gem.slug}.glb`));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
