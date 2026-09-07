import { describe, expect, it } from "vitest";
import { createInitialState, selectBuilding, selectFloor, goBackToMap } from "./state.js";

describe("app state transitions", () => {
  it("opens the library as an exterior, without fabricated floors", () => {
    const next = selectBuilding(createInitialState(), "library-jinming");
    expect(next.mode).toBe("buildingExterior");
    expect(next.selectedFloorId).toBeNull();
    expect(goBackToMap(next).selectedBuildingId).toBeNull();
  });
  it("selects a building and enters the floor selection mode", () => {
    const state = createInitialState();
    const next = selectBuilding(state, "teaching-1");

    expect(next.mode).toBe("buildingFloors");
    expect(next.selectedBuildingId).toBe("teaching-1");
    expect(next.selectedFloorId).toBeNull();
  });

  it("selects a floor then returns to map mode", () => {
    const state = selectFloor(selectBuilding(createInitialState(), "teaching-1"), "teaching-1-3f");
    const back = goBackToMap(state);

    expect(state.mode).toBe("floorRooms");
    expect(state.selectedFloorId).toBe("teaching-1-3f");
    expect(back.mode).toBe("map");
    expect(back.selectedBuildingId).toBeNull();
  });
});
