import { Vector3 } from "three";

// Registration to a schematic, not a surveyed/geographic coordinate system.
export const MAP_REFERENCE = Object.freeze({ width: 1376, height: 1777, crop: [46, 203, 1278, 1523] });
export const MAP_SCALE = 0.7;
export const MAP_ORIGIN = [675, 830];
export const MAP_TEXTURE_URL = "/assets/maps/jinming-campus.webp";
export const LANDMARKS = { plaza: [682, 835], westGate: [245, 832], confucius: [680, 770] };

export function mapPoint(x, y, elevation = 0) {
  return new Vector3((x - MAP_ORIGIN[0]) * MAP_SCALE, elevation, (y - MAP_ORIGIN[1]) * MAP_SCALE);
}

export const CAMPUS_PLACEMENTS = [
  { id: "library-jinming", name: "图书馆", center: [549, 830], size: [106, 155], rotation: -Math.PI / 2 },
  { id: "teaching-1", name: "1号教学楼", center: [715, 904], size: [75, 22], rotation: 0 },
  { id: "teaching-2", name: "2号教学楼", center: [805, 903], size: [96, 25], rotation: 0 },
  { id: "teaching-3", name: "3号教学楼", center: [800, 860], size: [86, 25], rotation: 0 },
  { id: "teaching-4", name: "4号教学楼", center: [840, 834], size: [28, 160], rotation: 0 },
  { id: "teaching-5", name: "5号教学楼", center: [800, 815], size: [86, 25], rotation: 0 },
  { id: "teaching-6", name: "6号教学楼", center: [802, 765], size: [90, 25], rotation: 0 },
];
