import puppeteer from "puppeteer";

const BASE = "http://127.0.0.1:5173";
const OUT = "docs/images";

async function snap(page, name) {
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: false });
  console.log(`  ${name}.png`);
}

async function main() {
  const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // 1. 地图全景
  console.log("1. 建筑群地图...");
  await page.goto(BASE, { waitUntil: "networkidle0" });
  await page.waitForSelector("#side-panel", { timeout: 30000 });
  await new Promise((r) => setTimeout(r, 2000));
  await snap(page, "campus-map");

  // 2. 点击1号教学楼 → 楼层选择
  console.log("2. 楼层选择...");
  await page.click('[data-building-id="teaching-1"]');
  await new Promise((r) => setTimeout(r, 3000));
  await snap(page, "campus-floors");

  // 3. 点击1F → 房间列表
  console.log("3. 房间列表...");
  await page.click('[data-floor-id="teaching-1-1f"]');
  await new Promise((r) => setTimeout(r, 1000));

  // 4. 点击房间 → 教室内部3D视图
  console.log("4. 教室内部3D...");
  await page.click('[data-room-id="teaching-1-1f-101"]');
  await new Promise((r) => setTimeout(r, 4000));
  await snap(page, "campus-classroom-3d");

  // 5. 教室聊天界面
  console.log("5. 自习室聊天...");
  await snap(page, "campus-classroom-chat");

  await browser.close();
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});