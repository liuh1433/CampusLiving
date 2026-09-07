import { Box3, Group, Mesh, MeshBasicMaterial, PlaneGeometry, SRGBColorSpace, TextureLoader, Vector3 } from "three";
import { CAMPUS_PLACEMENTS, MAP_REFERENCE, MAP_SCALE, MAP_TEXTURE_URL, mapPoint } from "../data/campusLayout.js";
import { hasPart } from "../library/model.js";

function extract(source, predicate) {
  source.updateMatrixWorld(true);
  const group = new Group();
  source.traverse((object) => {
    if (!object.isMesh || !predicate(object)) return;
    const mesh = object.clone(false);
    // Bake the source's world transform before registering the independent clone.
    mesh.matrixAutoUpdate = true;
    object.matrixWorld.decompose(mesh.position, mesh.quaternion, mesh.scale);
    group.add(mesh);
  });
  return group;
}

export function assembleCampus(teaching, library) {
  const root = new Group();
  root.name = "jinming_campus_models";
  const models = new Map();
  const meshes = new Map();
  for (const placement of CAMPUS_PLACEMENTS) {
    const isLibrary = placement.id === "library-jinming";
    const prefix = placement.id.replace("-", "_");
    const content = extract(isLibrary ? library : teaching, (object) => isLibrary
      ? !hasPart(object, "site")
      : object.name.startsWith(prefix + "_") && !object.name.endsWith("_label"));
    if (!content.children.length) throw new Error(`Missing model: ${placement.id}`);
    content.rotation.y = placement.rotation;
    const bounds = new Box3().setFromObject(content);
    const size = bounds.getSize(new Vector3());
    const center = bounds.getCenter(new Vector3());
    content.position.set(-center.x, -bounds.min.y, -center.z);
    const model = new Group();
    model.name = placement.id;
    model.userData.buildingId = placement.id;
    model.add(content);
    const sx = placement.size[0] * MAP_SCALE / size.x;
    const sz = placement.size[1] * MAP_SCALE / size.z;
    model.scale.set(sx, Math.sqrt(sx * sz), sz);
    model.position.copy(mapPoint(...placement.center, 0.08));
    const targets = [];
    model.traverse((object) => {
      if (!object.isMesh) return;
      object.userData.buildingId = placement.id;
      targets.push(object);
    });
    root.add(model);
    models.set(placement.id, model);
    meshes.set(placement.id, targets);
  }
  root.updateMatrixWorld(true);
  return { root, models, meshes, bounds: new Box3().setFromObject(root) };
}

export async function createCampusGround(renderer) {
  const texture = await new TextureLoader().loadAsync(MAP_TEXTURE_URL);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
  const [left, top, width, height] = MAP_REFERENCE.crop;
  const ground = new Mesh(
    new PlaneGeometry(width * MAP_SCALE, height * MAP_SCALE),
    new MeshBasicMaterial({ map: texture, toneMapped: false }),
  );
  ground.name = "campus_reference_map";
  ground.rotation.x = -Math.PI / 2;
  ground.position.copy(mapPoint(left + width / 2, top + height / 2));
  ground.userData.part = "reference-map";
  return ground;
}
