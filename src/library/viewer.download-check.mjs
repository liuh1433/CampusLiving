import assert from "node:assert/strict";

const { chromium } = await import(process.env.LIBRARY_PLAYWRIGHT_MODULE || "playwright");
const baseUrl = process.env.LIBRARY_BASE_URL || "http://127.0.0.1:5174";
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.LIBRARY_CHROMIUM_PATH || undefined,
  args: ["--enable-unsafe-swiftshader"],
});

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${baseUrl}/library.html`, { waitUntil: "networkidle" });
  await page.waitForFunction(() => window.__libraryViewer?.loaded, null, { timeout: 30000 });
  const response = await page.request.get(`${baseUrl}/assets/glb/library_jinming.glb`);
  assert.equal(response.ok(), true);
  assert.ok((await response.body()).byteLength > 0);
  const downloadPromise = page.waitForEvent("download");
  await page.click("#download-model");
  const download = await downloadPromise;
  assert.equal(download.suggestedFilename(), "library_jinming.glb");
  assert.equal(await download.failure(), null);
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ url: `${baseUrl}/library.html`, bytes: Number(response.headers()["content-length"]) || (await response.body()).byteLength }));
} finally {
  await browser.close();
}
