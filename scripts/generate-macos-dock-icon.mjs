#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = process.cwd();
const ICONS_DIR = path.join(ROOT, 'src-tauri', 'icons');
const WORK_DIR = '/tmp/desensitization-icon-build';
const ICONSET_DIR = path.join(ICONS_DIR, 'macos.iconset');
const PAM_PATH = path.join(WORK_DIR, 'macos-dock-source.pam');
const PNG_PATH = path.join(ICONS_DIR, 'macos-dock-source.png');

const W = 1024;
const H = 1024;
const data = new Uint8Array(W * H * 4);
const mask = new Float32Array(W * H);

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function mix(a, b, t) {
  return a + (b - a) * t;
}

function pointInRoundedRect(px, py, x, y, w, h, r) {
  const x0 = x + r;
  const y0 = y + r;
  const x1 = x + w - r;
  const y1 = y + h - r;

  if (px >= x0 && px <= x1 && py >= y && py <= y + h) return true;
  if (px >= x && px <= x + w && py >= y0 && py <= y1) return true;

  const cx = px < x0 ? x0 : x1;
  const cy = py < y0 ? y0 : y1;
  const dx = px - cx;
  const dy = py - cy;
  return dx * dx + dy * dy <= r * r;
}

function roundedRectCoverage(x, y, rect) {
  const samples = [0.25, 0.75];
  let inside = 0;
  for (const sy of samples) {
    for (const sx of samples) {
      if (pointInRoundedRect(x + sx, y + sy, rect.x, rect.y, rect.w, rect.h, rect.r)) {
        inside += 1;
      }
    }
  }
  return inside / 4;
}

function blendPixel(x, y, r, g, b, alpha) {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = y * W + x;
  const clip = mask[i];
  if (clip <= 0) return;

  const srcA = clamp(alpha, 0, 1) * clip;
  if (srcA <= 0) return;

  const di = i * 4;
  const dstA = data[di + 3] / 255;
  const outA = srcA + dstA * (1 - srcA);
  if (outA <= 0) return;

  const dstR = data[di];
  const dstG = data[di + 1];
  const dstB = data[di + 2];

  const outR = (r * srcA + dstR * dstA * (1 - srcA)) / outA;
  const outG = (g * srcA + dstG * dstA * (1 - srcA)) / outA;
  const outB = (b * srcA + dstB * dstA * (1 - srcA)) / outA;

  data[di] = clamp(Math.round(outR), 0, 255);
  data[di + 1] = clamp(Math.round(outG), 0, 255);
  data[di + 2] = clamp(Math.round(outB), 0, 255);
  data[di + 3] = clamp(Math.round(outA * 255), 0, 255);
}

function fillRoundedRect(x, y, w, h, r, color, alpha = 1) {
  const xMin = Math.max(0, Math.floor(x));
  const xMax = Math.min(W - 1, Math.ceil(x + w));
  const yMin = Math.max(0, Math.floor(y));
  const yMax = Math.min(H - 1, Math.ceil(y + h));
  for (let py = yMin; py <= yMax; py += 1) {
    for (let px = xMin; px <= xMax; px += 1) {
      if (pointInRoundedRect(px + 0.5, py + 0.5, x, y, w, h, r)) {
        blendPixel(px, py, color[0], color[1], color[2], alpha);
      }
    }
  }
}

function fillEllipse(cx, cy, rx, ry, color, alpha = 1) {
  const xMin = Math.max(0, Math.floor(cx - rx));
  const xMax = Math.min(W - 1, Math.ceil(cx + rx));
  const yMin = Math.max(0, Math.floor(cy - ry));
  const yMax = Math.min(H - 1, Math.ceil(cy + ry));
  const rx2 = rx * rx;
  const ry2 = ry * ry;
  for (let py = yMin; py <= yMax; py += 1) {
    for (let px = xMin; px <= xMax; px += 1) {
      const dx = px + 0.5 - cx;
      const dy = py + 0.5 - cy;
      const v = (dx * dx) / rx2 + (dy * dy) / ry2;
      if (v <= 1) {
        blendPixel(px, py, color[0], color[1], color[2], alpha);
      }
    }
  }
}

function distanceToSegment(px, py, x1, y1, x2, y2) {
  const vx = x2 - x1;
  const vy = y2 - y1;
  const wx = px - x1;
  const wy = py - y1;
  const c1 = vx * wx + vy * wy;
  if (c1 <= 0) return Math.hypot(px - x1, py - y1);
  const c2 = vx * vx + vy * vy;
  if (c2 <= c1) return Math.hypot(px - x2, py - y2);
  const t = c1 / c2;
  const qx = x1 + t * vx;
  const qy = y1 + t * vy;
  return Math.hypot(px - qx, py - qy);
}

function drawThickLine(x1, y1, x2, y2, thickness, color, alpha = 1) {
  const pad = thickness / 2 + 2;
  const xMin = Math.max(0, Math.floor(Math.min(x1, x2) - pad));
  const xMax = Math.min(W - 1, Math.ceil(Math.max(x1, x2) + pad));
  const yMin = Math.max(0, Math.floor(Math.min(y1, y2) - pad));
  const yMax = Math.min(H - 1, Math.ceil(Math.max(y1, y2) + pad));
  const r = thickness / 2;
  for (let py = yMin; py <= yMax; py += 1) {
    for (let px = xMin; px <= xMax; px += 1) {
      const d = distanceToSegment(px + 0.5, py + 0.5, x1, y1, x2, y2);
      if (d <= r) {
        blendPixel(px, py, color[0], color[1], color[2], alpha);
      }
    }
  }
}

function pointInPolygon(x, y, points) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i, i += 1) {
    const xi = points[i][0];
    const yi = points[i][1];
    const xj = points[j][0];
    const yj = points[j][1];
    const intersect = ((yi > y) !== (yj > y)) && (x < ((xj - xi) * (y - yi)) / (yj - yi + 1e-7) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function fillPolygon(points, color, alpha = 1) {
  let xMin = W;
  let yMin = H;
  let xMax = 0;
  let yMax = 0;
  for (const [x, y] of points) {
    xMin = Math.min(xMin, x);
    xMax = Math.max(xMax, x);
    yMin = Math.min(yMin, y);
    yMax = Math.max(yMax, y);
  }
  xMin = Math.max(0, Math.floor(xMin));
  xMax = Math.min(W - 1, Math.ceil(xMax));
  yMin = Math.max(0, Math.floor(yMin));
  yMax = Math.min(H - 1, Math.ceil(yMax));

  for (let py = yMin; py <= yMax; py += 1) {
    for (let px = xMin; px <= xMax; px += 1) {
      if (pointInPolygon(px + 0.5, py + 0.5, points)) {
        blendPixel(px, py, color[0], color[1], color[2], alpha);
      }
    }
  }
}

function ensureDirs() {
  fs.mkdirSync(WORK_DIR, { recursive: true });
  fs.mkdirSync(ICONSET_DIR, { recursive: true });
}

function render() {
  const iconShape = { x: 64, y: 64, w: 896, h: 896, r: 205 };

  for (let y = 0; y < H; y += 1) {
    for (let x = 0; x < W; x += 1) {
      const i = y * W + x;
      const c = roundedRectCoverage(x, y, iconShape);
      mask[i] = c;
      if (c <= 0) continue;
      const t = clamp((x * 0.52 + y * 0.48) / (W - 1), 0, 1);
      const r = Math.round(mix(83, 10, t));
      const g = Math.round(mix(213, 95, t));
      const b = Math.round(mix(245, 168, t));
      const di = i * 4;
      data[di] = r;
      data[di + 1] = g;
      data[di + 2] = b;
      data[di + 3] = Math.round(c * 255);
    }
  }

  fillEllipse(430, -40, 860, 560, [255, 255, 255], 0.11);
  fillEllipse(555, 970, 650, 420, [64, 182, 232], 0.24);
  fillEllipse(560, 1110, 760, 500, [10, 74, 136], 0.58);

  fillRoundedRect(235, 210, 350, 510, 36, [226, 234, 245], 0.96);
  fillRoundedRect(280, 286, 235, 24, 12, [149, 166, 188], 0.98);
  fillRoundedRect(280, 348, 235, 24, 12, [149, 166, 188], 0.98);
  fillRoundedRect(280, 410, 235, 24, 12, [149, 166, 188], 0.98);
  fillRoundedRect(280, 472, 192, 24, 12, [149, 166, 188], 0.98);
  fillRoundedRect(280, 534, 214, 92, 22, [246, 74, 90], 0.98);

  fillPolygon(
    [
      [560, 392],
      [662, 404],
      [748, 390],
      [885, 318],
      [840, 468],
      [788, 560],
      [688, 640],
      [592, 666],
      [608, 560],
      [596, 472],
    ],
    [234, 244, 254],
    0.9
  );

  drawThickLine(252, 638, 548, 466, 22, [223, 18, 37], 0.98);

  fillEllipse(656, 552, 18, 18, [246, 248, 251], 0.95);
  fillEllipse(714, 552, 18, 18, [246, 248, 251], 0.95);
  fillEllipse(772, 552, 18, 18, [246, 248, 251], 0.95);
  fillEllipse(830, 552, 18, 18, [246, 248, 251], 0.95);
}

function writePam(outputPath) {
  const header = Buffer.from(
    `P7\nWIDTH ${W}\nHEIGHT ${H}\nDEPTH 4\nMAXVAL 255\nTUPLTYPE RGB_ALPHA\nENDHDR\n`,
    'ascii'
  );
  fs.writeFileSync(outputPath, Buffer.concat([header, Buffer.from(data)]));
}

function runSips() {
  execFileSync('sips', ['-s', 'format', 'png', PAM_PATH, '--out', PNG_PATH], { stdio: 'inherit' });

  const sizes = [
    ['icon_16x16.png', 16],
    ['icon_16x16@2x.png', 32],
    ['icon_32x32.png', 32],
    ['icon_32x32@2x.png', 64],
    ['icon_128x128.png', 128],
    ['icon_128x128@2x.png', 256],
    ['icon_256x256.png', 256],
    ['icon_256x256@2x.png', 512],
    ['icon_512x512.png', 512],
    ['icon_512x512@2x.png', 1024],
  ];

  for (const [name, size] of sizes) {
    const out = path.join(ICONSET_DIR, name);
    execFileSync('sips', ['-z', String(size), String(size), PNG_PATH, '--out', out], { stdio: 'inherit' });
  }

  execFileSync('iconutil', ['-c', 'icns', ICONSET_DIR, '-o', path.join(ICONS_DIR, 'icon.icns')], {
    stdio: 'inherit',
  });

  fs.copyFileSync(path.join(ICONSET_DIR, 'icon_32x32.png'), path.join(ICONS_DIR, '32x32.png'));
  fs.copyFileSync(path.join(ICONSET_DIR, 'icon_32x32@2x.png'), path.join(ICONS_DIR, '64x64.png'));
  fs.copyFileSync(path.join(ICONSET_DIR, 'icon_128x128.png'), path.join(ICONS_DIR, '128x128.png'));
  fs.copyFileSync(path.join(ICONSET_DIR, 'icon_128x128@2x.png'), path.join(ICONS_DIR, '128x128@2x.png'));
  fs.copyFileSync(path.join(ICONSET_DIR, 'icon_512x512.png'), path.join(ICONS_DIR, 'icon.png'));
}

ensureDirs();
render();
writePam(PAM_PATH);
runSips();

console.log('Generated macOS Dock icon assets at src-tauri/icons');
