import { NodeIO, getBounds } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder } from 'meshoptimizer';
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
const doc = await io.read(process.argv[2]);
const scene = doc.getRoot().listScenes()[0];
const sb = getBounds(scene);
console.log('SCENE', sb.min.map(v=>v.toFixed(2)), sb.max.map(v=>v.toFixed(2)));
for (const node of doc.getRoot().listNodes()) {
  const mesh = node.getMesh(); if (!mesh) continue;
  const b = getBounds(node);
  const mat = mesh.listPrimitives()[0]?.getMaterial()?.getName();
  const tris = mesh.listPrimitives().reduce((n,p)=>n+(p.getIndices()?.getCount()??0)/3,0);
  console.log(node.getName().padEnd(10), (mat??'').padEnd(16), 'tris', String(Math.round(tris)).padStart(6), 'min', b.min.map(v=>v.toFixed(1).padStart(6)).join(','), 'max', b.max.map(v=>v.toFixed(1).padStart(6)).join(','));
}
