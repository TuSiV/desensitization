import { mkdir, rm, stat, copyFile } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const distDir = join(root, "dist");
const assets = [
  "index.html",
  "jszip.min.js",
  "mammoth.browser.min.js"
];

async function copyAssets() {
  await rm(distDir, { recursive: true, force: true });
  await mkdir(distDir, { recursive: true });

  let totalBytes = 0;
  for (const file of assets) {
    const src = join(root, file);
    const dest = join(distDir, file);
    await copyFile(src, dest);
    const info = await stat(dest);
    totalBytes += info.size;
  }

  const totalMb = (totalBytes / (1024 * 1024)).toFixed(2);
  console.log(`dist ready: ${assets.length} files, ${totalMb} MB`);
}

copyAssets().catch((error) => {
  console.error("build:web failed:", error);
  process.exit(1);
});
