export function resetNodeTransform(node) {
  if (!node) return;
  node.position.set(0, 0, 0);
  node.rotation.set(0, 0, 0);
  node.scale.set(1, 1, 1);
}
