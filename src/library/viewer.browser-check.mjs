import assert from "node:assert/strict";
import { readFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve, join, extname, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

// Run against dist through request interception, without starting a server.
const { chromium } = await import(process.env.LIBRARY_PLAYWRIGHT_MODULE || "playwright");
const root = fileURLToPath(new URL("../../", import.meta.url));
const dist = resolve(root, "dist");
const output = process.env.LIBRARY_CHECK_OUTPUT || join(tmpdir(), "campus-library-viewer-checks");
const modelBytes = await readFile(join(dist, "assets/glb/library_jinming.glb"));
console.log(JSON.stringify({ modelBytes: modelBytes.length, modelSha256: createHash("sha256").update(modelBytes).digest("hex") }));
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.LIBRARY_CHROMIUM_PATH || undefined,
  args: ["--enable-unsafe-swiftshader"],
});
const context = await browser.newContext({ acceptDownloads: true });
let failModel = false;
const errors = [];
const mime = { ".html": "text/html", ".js": "application/javascript", ".css": "text/css", ".glb": "model/gltf-binary" };
await context.route("**/*", async (route) => {
  const url = new URL(route.request().url());
  assert.equal(url.hostname, "library.test", `Unexpected external dependency: ${url}`);
  if (failModel && url.pathname.endsWith("library_jinming.glb")) {
    await route.fulfill({ status: 404, body: "Not found" });
    return;
  }
  const path = resolve(dist, decodeURIComponent(url.pathname).replace(/^\/+/, "") || "index.html");
  assert.ok(path.startsWith(dist + sep));
  try {
    const body = url.pathname.endsWith("library_jinming.glb") ? modelBytes : await readFile(path);
    await route.fulfill({ status: 200, contentType: mime[extname(path)] || "application/octet-stream", body });
  } catch {
    await route.fulfill({ status: 404, body: "Not found" });
  }
});

try {
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    // Campus navigation is covered by scripts/check-campus.mjs.
    await page.goto("http://library.test/library.html");
    await page.waitForFunction(() => window.__libraryViewer?.loaded, null, { timeout: 30000 });
    await page.waitForFunction(() => !window.__libraryViewer.transitioning);
    const check = await page.evaluate(() => {
      const stats = { ...window.__libraryViewer };
      const canvas = document.getElementById("library-canvas");
      const sample = document.createElement("canvas");
      sample.width = 120;
      sample.height = 100;
      sample.getContext("2d").drawImage(canvas, 0, 0, 120, 100);
      const pixels = sample.getContext("2d").getImageData(0, 0, 120, 100).data;
      let dark = 0;
      for (let i = 0; i < pixels.length; i += 4) {
        if (pixels[i] < 200 || pixels[i + 1] < 200 || pixels[i + 2] < 200) dark++;
      }
      const controls = [...document.querySelectorAll(".viewer-toolbar button, .viewer-toolbar select, .viewer-toolbar a")];
      const rects = controls.map((element) => ({ id: element.id, rect: element.getBoundingClientRect().toJSON() }));
      return { stats, dark, overflow: document.documentElement.scrollWidth > innerWidth, rects };
    });
    assert.ok(Number.isInteger(check.stats.meshes) && check.stats.meshes > 0 && check.stats.meshes <= 5000,
      `Expected 1-5000 meshes, received ${check.stats.meshes}`);
    assert.ok(check.dark > 200, `Blank or tiny scene at ${viewport.width}: ${check.dark} pixels`);
    assert.equal(check.overflow, false);
    for (let i = 0; i < check.rects.length; i++) {
      const a = check.rects[i];
      assert.ok(a.rect.left >= 0 && a.rect.right <= viewport.width, `${a.id} outside viewport`);
      for (const b of check.rects.slice(i + 1)) {
        const overlaps = Math.min(a.rect.right, b.rect.right) > Math.max(a.rect.left, b.rect.left)
          && Math.min(a.rect.bottom, b.rect.bottom) > Math.max(a.rect.top, b.rect.top);
        assert.equal(overlaps, false, `${a.id} overlaps ${b.id}`);
      }
    }
    await page.screenshot({ path: join(output, `library-${viewport.width}.png`) });
    for (const view of ["front", "back", "left", "right", "top", "isometric"]) {
      await page.selectOption("#view-select", view);
      await page.waitForFunction((value) => window.__libraryViewer.view === value && !window.__libraryViewer.transitioning, view);
      if (["front", "top"].includes(view)) {
        await page.screenshot({ path: join(output, `library-${viewport.width}-${view}.png`) });
      }
    }
    await page.click("#roof-toggle");
    assert.equal(await page.evaluate(() => window.__libraryViewer.visibleRoofs), 0);
    assert.ok(await page.evaluate(() => window.__libraryViewer.visibleSite) > 0);
    await page.click("#site-toggle");
    assert.equal(await page.evaluate(() => window.__libraryViewer.visibleSite), 0);
    await page.click("#roof-toggle");
    await page.click("#site-toggle");
    await page.waitForFunction(() => !window.__libraryViewer.transitioning);
    const before = await page.evaluate(() => window.__libraryViewer.camera);
    await page.click("#auto-rotate");
    await page.waitForFunction((position) => Math.abs(window.__libraryViewer.camera[0] - position[0]) > 1, before);
    await page.click("#auto-rotate");
    await page.click("#zoom-in");
    await page.waitForFunction(() => !window.__libraryViewer.transitioning);
    await page.click("#reset-view");
    await page.waitForFunction(() => window.__libraryViewer.view === "isometric" && !window.__libraryViewer.transitioning);
    const capturePromise = page.waitForEvent("download");
    await page.click("#capture-view");
    const capture = await capturePromise;
    assert.match(capture.suggestedFilename(), /^henan-library-.+\.png$/);
    assert.equal(await capture.failure(), null);
    const downloadPromise = page.waitForEvent("download");
    await page.click("#download-model");
    const modelDownload = await downloadPromise;
    assert.equal(modelDownload.suggestedFilename(), "library_jinming.glb");
    // The virtual routed origin validates the link and asset bytes above. Chromium
    // cancels navigational downloads from that synthetic origin, so actual transfer
    // is covered by the optional Vite-origin download check below.
    assert.ok([null, "canceled"].includes(await modelDownload.failure()));
    console.log(JSON.stringify({ viewport, ...check.stats, darkPixels: check.dark }));
  }
  failModel = true;
  await page.reload();
  await page.waitForSelector('#library-app[data-state="error"]');
  assert.equal(await page.locator("#retry-button").isVisible(), true);
  failModel = false;
  await page.click("#retry-button");
  await page.waitForFunction(() => window.__libraryViewer.loaded);
  assert.deepEqual(errors, []);
  console.log(`Browser checks passed. Screenshots: ${output}`);
} finally {
  await browser.close();
}
