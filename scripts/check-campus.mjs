import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const { chromium } = await import(process.env.LIBRARY_PLAYWRIGHT_MODULE || "playwright");
const base = process.env.CAMPUS_BASE_URL || "http://127.0.0.1:5174";
const output = resolve("assets/previews/campus-checks");
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: process.env.LIBRARY_CHROMIUM_PATH || undefined, args: ["--enable-unsafe-swiftshader"] });
const errors = [];
try {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    const page = await browser.newPage({ viewport, acceptDownloads: true });
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(base);
    await page.waitForFunction(() => window.__campusViewer?.loaded, null, { timeout: 30000 });
    const settled = () => page.waitForFunction(() => !window.__campusViewer.transitioning);
    await settled();
    assert.equal(await page.evaluate(() => window.__campusViewer.visibleModels.length), 7);
    const layout = await page.evaluate(() => {
      const ids = ["scene-stage", "side-panel", "status-text", "campus-view", "campus-capture"];
      return { overflow: document.documentElement.scrollWidth > innerWidth, rects: ids.map((id) => ({ id, ...document.getElementById(id).getBoundingClientRect().toJSON() })) };
    });
    assert.equal(layout.overflow, false);
    for (const rect of layout.rects) {
      assert.ok(rect.left >= 0 && rect.right <= viewport.width && rect.top >= 0 && rect.bottom <= viewport.height, JSON.stringify(rect));
    }
    for (const view of ["core", "top", "campus"]) {
      await page.selectOption("#campus-view", view);
      await settled();
      await page.screenshot({ path: resolve(output, `campus-${viewport.width}-${view}.png`) });
    }
    await page.click("#campus-reset");
    await settled();
    await page.uncheck("#map-layer");
    assert.equal(await page.evaluate(() => window.__campusViewer.mapVisible), false);
    const pixels = await page.evaluate(() => {
      const sample = document.createElement("canvas");
      sample.width = 200; sample.height = 150;
      const context = sample.getContext("2d");
      context.drawImage(document.getElementById("scene-canvas"), 0, 0, 200, 150);
      const bytes = context.getImageData(0, 0, 200, 150).data;
      let colored = 0;
      for (let i = 0; i < bytes.length; i += 4) if (bytes[i] < 180 || bytes[i + 1] < 180 || bytes[i + 2] < 180) colored++;
      return colored;
    });
    assert.ok(pixels > 180, `Blank models: ${pixels}`);
    await page.screenshot({ path: resolve(output, `campus-${viewport.width}-models.png`) });
    await page.check("#map-layer");
    const before = await page.evaluate(() => window.__campusViewer.camera);
    await page.click("#campus-zoom-in");
    assert.notDeepEqual(await page.evaluate(() => window.__campusViewer.camera), before);
    const canvas = await page.locator("#scene-canvas").boundingBox();
    const beforeOrbit = await page.evaluate(() => window.__campusViewer.camera);
    await page.mouse.move(canvas.x + 40, canvas.y + 70);
    await page.mouse.down();
    await page.mouse.move(canvas.x + 90, canvas.y + 110, { steps: 8 });
    await page.mouse.up();
    assert.notDeepEqual(await page.evaluate(() => window.__campusViewer.camera), beforeOrbit);
    assert.equal(await page.evaluate(() => window.__campusViewer.mode), "map");
    await page.click("#campus-reset");
    await settled();
    await page.selectOption("#campus-view", "top");
    await settled();
    await page.locator('[data-building-id="library-jinming"]').click();
    await settled();
    assert.equal(await page.evaluate(() => window.__campusViewer.mode), "exterior");
    assert.equal(await page.inputValue("#campus-view"), await page.evaluate(() => window.__campusViewer.view));
    assert.equal(await page.locator('[data-floor-id]').count(), 0);
    const libraryLink = page.locator(".building-detail-link");
    assert.equal(await libraryLink.isVisible(), true, "Library detail link must remain available on mobile");
    await libraryLink.click();
    await page.waitForFunction(() => window.__libraryViewer?.loaded);
    await page.getByRole("link", { name: "返回校园", exact: true }).click();
    await page.waitForFunction(() => window.__campusViewer?.loaded);
    await settled();
    await page.selectOption("#campus-view", "top");
    await settled();
    const roofLabel = await page.locator('[data-building-label="teaching-1"]').boundingBox();
    assert.ok(roofLabel, "Teaching building 1 label must be visible in top view");
    await page.locator("#scene-canvas").click({ position: {
      x: roofLabel.x + roofLabel.width / 2 - canvas.x,
      y: roofLabel.y + roofLabel.height + 3 - canvas.y,
    }, delay: 100 });
    await settled();
    assert.equal(await page.evaluate(() => window.__campusViewer.selected), "teaching-1", "Canvas roof picking");
    await page.click("#back-map-button");
    await settled();
    await page.locator('[data-building-id="teaching-1"]').click();
    await settled();
    await page.locator('[data-floor-id="teaching-1-1f"]').click();
    await page.locator('[data-room-id="teaching-1-1f-101"]').click();
    await settled();
    assert.equal(await page.evaluate(() => window.__campusViewer.mode), "classroom");
    await page.screenshot({ path: resolve(output, `campus-${viewport.width}-room.png`) });
    await page.click("#back-map-button");
    await settled();
    await page.click("#back-map-button");
    await settled();
    assert.equal(await page.evaluate(() => window.__campusViewer.visibleModels.length), 7);
    const downloadPromise = page.waitForEvent("download");
    await page.click("#campus-capture");
    const download = await downloadPromise;
    assert.equal(download.suggestedFilename(), "campus-jinming.png");
    assert.equal(await download.failure(), null);
    console.log(JSON.stringify({ viewport, models: 7, modelPixels: pixels, interactions: "passed" }));
    await page.close();
  }
  assert.deepEqual(errors, []);
  console.log(`Campus browser checks passed: ${output}`);
} finally {
  await browser.close();
}
