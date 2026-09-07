import { MathUtils, Vector3 } from "three";

export const VIEW_DIRECTIONS = Object.freeze({
  isometric: Object.freeze([110, 69, 135]),
  front: Object.freeze([0, 0.04, 1]),
  back: Object.freeze([0, 0.04, -1]),
  left: Object.freeze([-1, 0.04, 0]),
  right: Object.freeze([1, 0.04, 0]),
  top: Object.freeze([0, 1, 0.0001]),
});

export function boxCorners(box) {
  const corners = [];
  for (const x of [box.min.x, box.max.x]) {
    for (const y of [box.min.y, box.max.y]) {
      for (const z of [box.min.z, box.max.z]) corners.push(new Vector3(x, y, z));
    }
  }
  return corners;
}

export function fitView(box, { direction, aspect, fov = 38, padding = 1.1, target } = {}) {
  const center = target?.clone() ?? box.getCenter(new Vector3());
  const backward = new Vector3().fromArray(direction ?? VIEW_DIRECTIONS.isometric).normalize();
  const right = new Vector3().crossVectors(new Vector3(0, 1, 0), backward);
  if (right.lengthSq() < 1e-12) right.set(1, 0, 0);
  right.normalize();
  const up = new Vector3().crossVectors(backward, right).normalize();
  const tanY = Math.tan(MathUtils.degToRad(fov / 2));
  const tanX = tanY * Math.max(aspect, 0.05);
  let distance = 1;

  // Fit every corner in camera space, including perspective depth and off-center targets.
  for (const corner of boxCorners(box)) {
    const relative = corner.sub(center);
    const depth = relative.dot(backward);
    distance = Math.max(distance,
      depth + Math.abs(relative.dot(right)) * padding / tanX,
      depth + Math.abs(relative.dot(up)) * padding / tanY);
  }

  return { target: center, position: center.clone().addScaledVector(backward, distance), distance };
}
