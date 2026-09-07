import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { MAP_REFERENCE } from "../src/data/campusLayout.js";

const { default: sharp } = await import(process.env.CAMPUS_SHARP_MODULE || "sharp");
const source = process.argv[2];
if (!source) throw new Error("Provide the original jmxq.jpg path.");
const root = fileURLToPath(new URL("../", import.meta.url));
const output = resolve(root, "public/assets/maps");
await mkdir(output, { recursive: true });
const metadata = await sharp(source).metadata();
const [x, y, width, height] = MAP_REFERENCE.crop;
const crop = {
  left: Math.round(x / MAP_REFERENCE.width * metadata.width),
  top: Math.round(y / MAP_REFERENCE.height * metadata.height),
  width: Math.round(width / MAP_REFERENCE.width * metadata.width),
  height: Math.round(height / MAP_REFERENCE.height * metadata.height),
};
await sharp(source).extract(crop).resize({ width: 3072 }).webp({ quality: 90 }).toFile(resolve(output, "jinming-campus.webp"));
await writeFile(resolve(output, "jinming-campus.source.json"), JSON.stringify({
  source: "User-supplied jmxq.jpg, Henan University Jinming campus schematic",
  sourceSize: [metadata.width, metadata.height], reference: MAP_REFERENCE, crop,
  accuracy: "Schematic registration only; no measured geographic coordinates",
}, null, 2));
console.log(`Prepared campus map: ${output}`);
