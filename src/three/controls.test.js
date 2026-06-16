import { describe, expect, it } from "vitest";
import { configureFixedSceneControls, setFixedSceneTarget } from "./controls.js";

describe("fixed scene controls", () => {
  it("locks user-driven camera interaction", () => {
    const controls = {};

    configureFixedSceneControls(controls);

    expect(controls.enabled).toBe(false);
    expect(controls.enableRotate).toBe(false);
    expect(controls.enableZoom).toBe(false);
    expect(controls.enablePan).toBe(false);
    expect(controls.enableDamping).toBe(false);
    expect(controls.autoRotate).toBe(false);
  });

  it("can still update the fixed camera target programmatically", () => {
    const calls = [];
    const controls = {
      target: {
        set: (...args) => calls.push(args),
      },
    };

    setFixedSceneTarget(controls, 4, 0, 6);

    expect(calls).toEqual([[4, 0, 6]]);
  });
});
