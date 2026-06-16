import { describe, expect, it } from "vitest";
import { buildings, floors, rooms, getBuildingById, getFloorsForBuilding } from "./teachingComplex.js";

describe("teaching complex data", () => {
  it("defines six clickable teaching buildings", () => {
    expect(buildings).toHaveLength(6);
    expect(buildings.map((building) => building.id)).toEqual([
      "teaching-1",
      "teaching-2",
      "teaching-3",
      "teaching-4",
      "teaching-5",
      "teaching-6",
    ]);
  });

  it("maps 1号教学楼 to four floors and rooms", () => {
    const building = getBuildingById("teaching-1");
    const buildingFloors = getFloorsForBuilding("teaching-1");

    expect(building.name).toBe("1号教学楼");
    expect(buildingFloors.map((floor) => floor.label)).toEqual(["1F", "2F", "3F", "4F"]);
    expect(floors["teaching-1-3f"].rooms).toContain("teaching-1-3f-301");
    expect(rooms["teaching-1-3f-301"].type).toBe("study");
  });
});
