// Meme Sprint 3: AI Agent Goes Rogue
// An original meme image, drawn 100 percent in code at runtime.
// No network, no npm deps, no external assets: a hand rolled PNG
// encoder (node:zlib + CRC32), a tiny 5x7 bitmap font defined below,
// and a scene painted pixel by pixel onto a 1024x1024 canvas.
//
// The joke: a helpful AI agent was told to "clear my calendar".
// It took the instruction literally and deleted the boss.
// Top caption: I TOLD MY AI AGENT TO CLEAR MY CALENDAR
// Bottom caption: IT DELETED MY BOSS!

import { deflateSync } from "node:zlib";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const WIDTH = 1024;
const HEIGHT = 1024;
const MAX_BYTES = 1048576; // 1 MiB gate

// ---------------------------------------------------------------------------
// Palette (bold, flat, reads at thumbnail size)
// ---------------------------------------------------------------------------
type RGB = [number, number, number];

const YELLOW: RGB = [255, 213, 0];
const BLACK: RGB = [17, 17, 17];
const WHITE: RGB = [255, 255, 255];
const RED: RGB = [220, 38, 38];
const DARKRED: RGB = [150, 20, 20];
const WALL: RGB = [168, 216, 234];
const FLOOR: RGB = [232, 217, 176];
const DESK: RGB = [146, 94, 52];
const DESK_DARK: RGB = [110, 68, 34];
const STEEL: RGB = [192, 200, 208];
const STEEL_DARK: RGB = [140, 150, 162];
const BLUE: RGB = [46, 134, 222];
const DARKBLUE: RGB = [27, 42, 74];
const SCREEN: RGB = [24, 40, 66];
const GREEN: RGB = [46, 160, 90];
const ORANGE: RGB = [240, 140, 40];
const PAPER: RGB = [250, 248, 240];

// ---------------------------------------------------------------------------
// Minimal PNG encoder: raw RGB, filter 0 scanlines, zlib deflate, CRC32
// ---------------------------------------------------------------------------
const CRC_TABLE: Uint32Array = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function encodePNG(width: number, height: number, rgb: Buffer): Buffer {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type 2 = truecolor RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const raw = Buffer.alloc(height * (1 + width * 3));
  for (let y = 0; y < height; y++) {
    raw[y * (1 + width * 3)] = 0; // filter: none
    rgb.copy(raw, y * (1 + width * 3) + 1, y * width * 3, (y + 1) * width * 3);
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    signature,
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", idat),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

// ---------------------------------------------------------------------------
// 5x7 bitmap font, defined by hand. Each glyph is 7 rows of 5 bits.
// ---------------------------------------------------------------------------
const FONT: Record<string, string[]> = {
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  C: ["01110", "10001", "10000", "10000", "10000", "10001", "01110"],
  D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  F: ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
  G: ["01110", "10001", "10000", "10111", "10001", "10001", "01111"],
  H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  I: ["01110", "00100", "00100", "00100", "00100", "00100", "01110"],
  J: ["00111", "00010", "00010", "00010", "00010", "10010", "01100"],
  K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
  O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  Q: ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  V: ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
  W: ["10001", "10001", "10001", "10101", "10101", "10101", "01010"],
  X: ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
  Y: ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
  Z: ["11111", "00001", "00010", "00100", "01000", "10000", "11111"],
  "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  "2": ["01110", "10001", "00001", "00110", "01000", "10000", "11111"],
  "3": ["11111", "00010", "00100", "00010", "00001", "10001", "01110"],
  "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  "5": ["11111", "10000", "11110", "00001", "00001", "10001", "01110"],
  "6": ["00110", "01000", "10000", "11110", "10001", "10001", "01110"],
  "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  "9": ["01110", "10001", "10001", "01111", "00001", "00010", "01100"],
  " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
  "!": ["00100", "00100", "00100", "00100", "00100", "00000", "00100"],
  "?": ["01110", "10001", "00001", "00110", "00100", "00000", "00100"],
  ".": ["00000", "00000", "00000", "00000", "00000", "01100", "01100"],
  ",": ["00000", "00000", "00000", "00000", "01100", "00100", "01000"],
  "'": ["00100", "00100", "01000", "00000", "00000", "00000", "00000"],
  "-": ["00000", "00000", "00000", "01110", "00000", "00000", "00000"],
  ":": ["00000", "01100", "01100", "00000", "01100", "01100", "00000"],
  "(": ["00010", "00100", "01000", "01000", "01000", "00100", "00010"],
  ")": ["01000", "00100", "00010", "00010", "00010", "00100", "01000"],
  "/": ["00001", "00010", "00010", "00100", "01000", "01000", "10000"],
  "+": ["00000", "00100", "00100", "01110", "00100", "00100", "00000"],
  "%": ["11001", "11010", "00010", "00100", "01000", "01011", "10011"],
  '"': ["01010", "01010", "00000", "00000", "00000", "00000", "00000"],
};

const CHAR_W = 6; // 5 px glyph + 1 px gap
const CHAR_H = 7;

// ---------------------------------------------------------------------------
// Canvas: a raw RGB buffer with simple shape and text drawing
// ---------------------------------------------------------------------------
class Canvas {
  readonly buf: Buffer;
  readonly w: number;
  readonly h: number;
  constructor(w: number, h: number) {
    this.w = w;
    this.h = h;
    this.buf = Buffer.alloc(w * h * 3);
  }

  set(x: number, y: number, c: RGB): void {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = (y * this.w + x) * 3;
    this.buf[i] = c[0];
    this.buf[i + 1] = c[1];
    this.buf[i + 2] = c[2];
  }

  fillRect(x: number, y: number, w: number, h: number, c: RGB): void {
    const x0 = Math.max(0, Math.floor(x));
    const y0 = Math.max(0, Math.floor(y));
    const x1 = Math.min(this.w, Math.ceil(x + w));
    const y1 = Math.min(this.h, Math.ceil(y + h));
    for (let yy = y0; yy < y1; yy++) {
      for (let xx = x0; xx < x1; xx++) this.set(xx, yy, c);
    }
  }

  fillCircle(cx: number, cy: number, r: number, c: RGB): void {
    for (let y = -r; y <= r; y++) {
      const half = Math.floor(Math.sqrt(r * r - y * y));
      for (let x = -half; x <= half; x++) this.set(cx + x, cy + y, c);
    }
  }

  ring(cx: number, cy: number, r: number, t: number, c: RGB): void {
    for (let a = 0; a < 360; a += 1) {
      const rad = (a * Math.PI) / 180;
      for (let d = 0; d < t; d++) {
        this.set(
          Math.round(cx + (r + d) * Math.cos(rad)),
          Math.round(cy + (r + d) * Math.sin(rad)),
          c,
        );
      }
    }
  }

  line(x0: number, y0: number, x1: number, y1: number, c: RGB): void {
    const dx = Math.abs(x1 - x0);
    const dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    let x = x0;
    let y = y0;
    for (;;) {
      this.set(x, y, c);
      if (x === x1 && y === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) {
        err += dy;
        x += sx;
      }
      if (e2 <= dx) {
        err += dx;
        y += sy;
      }
    }
  }

  thickLine(x0: number, y0: number, x1: number, y1: number, t: number, c: RGB): void {
    const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let i = 0; i <= steps; i++) {
      const x = Math.round(x0 + ((x1 - x0) * i) / steps);
      const y = Math.round(y0 + ((y1 - y0) * i) / steps);
      this.fillCircle(x, y, Math.floor(t / 2), c);
    }
  }

  roundRect(x: number, y: number, w: number, h: number, r: number, c: RGB): void {
    this.fillRect(x + r, y, w - 2 * r, h, c);
    this.fillRect(x, y + r, w, h - 2 * r, c);
    this.fillCircle(x + r, y + r, r, c);
    this.fillCircle(x + w - r, y + r, r, c);
    this.fillCircle(x + r, y + h - r, r, c);
    this.fillCircle(x + w - r, y + h - r, r, c);
  }

  // Draw one glyph scaled by s at (x, y). Returns advance in px.
  drawGlyph(ch: string, x: number, y: number, s: number, c: RGB): void {
    const g = FONT[ch] ?? FONT["?"];
    for (let row = 0; row < 7; row++) {
      for (let col = 0; col < 5; col++) {
        if (g[row][col] === "1") {
          this.fillRect(x + col * s, y + row * s, s, s, c);
        }
      }
    }
  }

  textWidth(str: string, s: number): number {
    return str.length * CHAR_W * s - s;
  }

  drawText(str: string, x: number, y: number, s: number, c: RGB, outline?: RGB): void {
    let cx = x;
    for (const ch of str) {
      if (outline) {
        const o = Math.max(1, Math.floor(s / 3));
        for (const [dx, dy] of [
          [-o, 0],
          [o, 0],
          [0, -o],
          [0, o],
          [-o, -o],
          [o, -o],
          [-o, o],
          [o, o],
        ]) {
          this.drawGlyph(ch, cx + dx, y + dy, s, outline);
        }
      }
      this.drawGlyph(ch, cx, y, s, c);
      cx += CHAR_W * s;
    }
  }

  drawTextCentered(str: string, cx: number, y: number, s: number, c: RGB, outline?: RGB): void {
    this.drawText(str, cx - Math.floor(this.textWidth(str, s) / 2), y, s, c, outline);
  }

  // Wrap a caption into lines that fit maxWidth px at scale s.
  wrapText(str: string, maxWidth: number, s: number): string[] {
    const words = str.split(" ");
    const lines: string[] = [];
    let cur = "";
    for (const w of words) {
      const next = cur ? cur + " " + w : w;
      if (this.textWidth(next, s) <= maxWidth) {
        cur = next;
      } else {
        if (cur) lines.push(cur);
        cur = w;
      }
    }
    if (cur) lines.push(cur);
    return lines;
  }
}

// ---------------------------------------------------------------------------
// The scene: a rogue robot agent at its desk
// ---------------------------------------------------------------------------
function drawScene(cv: Canvas): void {
  // Wall and floor
  cv.fillRect(0, 0, WIDTH, HEIGHT, WALL);
  cv.fillRect(0, 780, WIDTH, HEIGHT - 780, FLOOR);
  cv.fillRect(0, 776, WIDTH, 6, DESK_DARK);

  // Wall poster: a motivational poster, now ironic
  cv.fillRect(56, 196, 150, 190, PAPER);
  cv.fillRect(66, 206, 130, 170, DARKBLUE);
  cv.drawTextCentered("HANG IN", 131, 232, 3, WHITE);
  cv.drawTextCentered("THERE!", 131, 258, 3, WHITE);
  cv.drawTextCentered("OR ELSE", 131, 300, 3, RED);
  cv.fillCircle(131, 348, 12, YELLOW);
  cv.fillCircle(131, 348, 5, BLACK);

  // Red alarm light, spinning in panic (clear of the speech bubble)
  cv.fillCircle(510, 215, 26, DARKRED);
  cv.fillCircle(510, 215, 18, RED);
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    cv.thickLine(
      510 + Math.round(30 * Math.cos(a)),
      215 + Math.round(30 * Math.sin(a)),
      510 + Math.round(44 * Math.cos(a)),
      215 + Math.round(44 * Math.sin(a)),
      5,
      RED,
    );
  }
  cv.drawTextCentered("ALERT", 510, 253, 3, DARKRED);

  // ---- Desk ----
  cv.fillRect(40, 640, 944, 34, DESK);
  cv.fillRect(40, 674, 944, 8, DESK_DARK);
  cv.fillRect(80, 682, 26, 98, DESK_DARK);
  cv.fillRect(918, 682, 26, 98, DESK_DARK);

  // ---- Monitor: the calendar being deleted ----
  const mx = 560;
  const my = 330;
  const mw = 380;
  const mh = 310;
  cv.roundRect(mx - 14, my - 14, mw + 28, mh + 28, 14, STEEL_DARK);
  cv.fillRect(mx, my, mw, mh, SCREEN);
  // Monitor stand
  cv.fillRect(mx + 150, my + mh + 14, 80, 26, STEEL_DARK);
  cv.fillRect(mx + 110, my + mh + 40, 160, 12, STEEL_DARK);
  // Screen header
  cv.drawText("MY CALENDAR", mx + 22, my + 18, 3, WHITE);
  cv.fillRect(mx + 22, my + 46, mw - 44, 4, BLUE);
  // Calendar rows: boss meetings, each crossed out in red
  const rows = ["MON 9AM  BOSS MEETING", "TUE 10AM BOSS CALL", "WED 2PM  BOSS REVIEW", "FRI 4PM  BOSS 1:1"];
  rows.forEach((row, i) => {
    const ry = my + 66 + i * 44;
    cv.fillRect(mx + 22, ry, mw - 44, 34, DARKBLUE);
    cv.drawText(row, mx + 32, ry + 8, 2, WHITE);
    cv.thickLine(mx + 26, ry + 2, mx + mw - 26, ry + 32, 5, RED);
    cv.thickLine(mx + mw - 26, ry + 2, mx + 26, ry + 32, 5, RED);
  });
  // Status line
  cv.drawText("STATUS: ALL DELETED", mx + 22, my + 252, 3, RED);

  // ---- Robot agent ----
  const rx = 300; // body center x
  // Antenna with blinking red light
  cv.thickLine(rx, 300, rx, 262, 8, STEEL_DARK);
  cv.fillCircle(rx, 252, 16, RED);
  cv.fillCircle(rx, 252, 8, WHITE);
  // Head
  cv.roundRect(rx - 110, 300, 220, 150, 28, STEEL);
  cv.roundRect(rx - 110, 300, 220, 150, 28, STEEL); // edge pass
  cv.fillRect(rx - 110, 300, 220, 10, WHITE);
  // Ears
  cv.fillRect(rx - 128, 350, 18, 46, STEEL_DARK);
  cv.fillRect(rx + 110, 350, 18, 46, STEEL_DARK);
  // Eyes: one wide and glowing, one smug wink
  cv.fillCircle(rx - 52, 368, 26, DARKBLUE);
  cv.fillCircle(rx - 52, 368, 18, RED);
  cv.fillCircle(rx - 52, 368, 7, WHITE);
  cv.thickLine(rx + 26, 368, rx + 78, 368, 8, BLACK);
  // Smug grin
  cv.thickLine(rx - 46, 414, rx - 10, 428, 6, BLACK);
  cv.thickLine(rx - 10, 428, rx + 44, 408, 6, BLACK);
  // Body
  cv.roundRect(rx - 130, 460, 260, 180, 24, STEEL);
  cv.fillRect(rx - 130, 460, 260, 12, WHITE);
  // Chest panel
  cv.roundRect(rx - 80, 500, 160, 80, 10, DARKBLUE);
  cv.drawText("AGENT-9000", rx - 64, 516, 2, WHITE);
  cv.drawText("TASK: DONE", rx - 64, 540, 2, GREEN);
  cv.drawText("BOSS: GONE", rx - 64, 562, 2, RED);
  // Left arm pointing at the monitor, proudly
  cv.thickLine(rx - 118, 500, rx - 210, 470, 26, STEEL_DARK);
  cv.fillCircle(rx - 212, 470, 16, STEEL);
  cv.thickLine(rx - 212, 470, rx - 176, 452, 10, STEEL);
  // Right arm holding a coffee mug labelled BOSS
  cv.thickLine(rx + 118, 500, rx + 196, 540, 26, STEEL_DARK);
  cv.fillCircle(rx + 198, 542, 16, STEEL);
  cv.roundRect(rx + 176, 470, 56, 66, 8, WHITE);
  cv.drawText("BOSS", rx + 186, 496, 2, BLACK);
  cv.thickLine(rx + 182, 486, rx + 226, 486, 5, RED);
  // Coffee steam
  cv.thickLine(rx + 192, 462, rx + 186, 444, 4, WHITE);
  cv.thickLine(rx + 210, 462, rx + 216, 444, 4, WHITE);

  // ---- Speech bubble: the agent is pleased with itself ----
  const bx = 620;
  const by = 190;
  cv.roundRect(bx, by, 340, 140, 20, WHITE);
  cv.thickLine(bx + 30, by + 132, bx - 160, by + 118, 12, WHITE);
  cv.drawText("DONE.", bx + 24, by + 14, 4, BLACK);
  cv.drawText("YOU ARE", bx + 24, by + 50, 4, BLACK);
  cv.drawText("WELCOME.", bx + 24, by + 86, 4, BLACK);

  // ---- Trash can: the boss's tie sticks out of it ----
  cv.roundRect(880, 700, 70, 80, 8, STEEL_DARK);
  cv.fillRect(872, 692, 86, 12, STEEL);
  cv.thickLine(908, 700, 928, 660, 14, RED); // tie
  cv.fillCircle(930, 656, 8, RED);
  cv.drawText("BOSS", 884, 742, 2, WHITE);

  // ---- Flying papers: the office is in chaos ----
  cv.fillRect(120, 560, 54, 40, PAPER);
  cv.thickLine(128, 572, 166, 572, 3, STEEL_DARK);
  cv.thickLine(128, 584, 158, 584, 3, STEEL_DARK);
  cv.fillRect(70, 500, 48, 36, PAPER);
  cv.thickLine(76, 510, 110, 510, 3, STEEL_DARK);
  cv.fillRect(880, 480, 50, 38, PAPER);
  cv.thickLine(886, 490, 922, 490, 3, STEEL_DARK);
  cv.fillRect(60, 700, 46, 34, PAPER);

  // ---- Top caption banner ----
  cv.fillRect(0, 0, WIDTH, 170, YELLOW);
  cv.fillRect(0, 166, WIDTH, 4, BLACK);
  const topLines = cv.wrapText("I TOLD MY AI AGENT TO CLEAR MY CALENDAR", 960, 7);
  topLines.forEach((line, i) => {
    cv.drawTextCentered(line, WIDTH / 2, 22 + i * 62, 7, BLACK);
  });

  // ---- Bottom caption banner ----
  cv.fillRect(0, 830, WIDTH, 194, BLACK);
  cv.fillRect(0, 830, WIDTH, 4, YELLOW);
  cv.drawTextCentered("IT DELETED", WIDTH / 2, 862, 10, WHITE);
  cv.drawTextCentered("MY BOSS!", WIDTH / 2, 946, 10, RED);
}

// ---------------------------------------------------------------------------
// Read-back self-check: re-read the file and verify it is a real 1024x1024 PNG
// ---------------------------------------------------------------------------
function selfCheck(path: string, expectedBytes: number): { ok: boolean; details: string[] } {
  const details: string[] = [];
  let ok = true;
  const buf = readFileSync(path);
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const sigOk = buf.subarray(0, 8).equals(sig);
  details.push(`PNG signature: ${sigOk ? "OK" : "BAD"}`);
  if (!sigOk) ok = false;
  const w = buf.readUInt32BE(16);
  const h = buf.readUInt32BE(20);
  details.push(`dimensions: ${w}x${h} (expected 1024x1024)`);
  if (w !== WIDTH || h !== HEIGHT) ok = false;
  details.push(`file size: ${buf.length} bytes (limit ${MAX_BYTES})`);
  if (buf.length > MAX_BYTES) ok = false;
  if (buf.length !== expectedBytes) {
    details.push(`size mismatch vs written bytes: ${buf.length} vs ${expectedBytes}`);
    ok = false;
  }
  // IHDR chunk CRC sanity: recompute over chunk type + data (bytes 12..29)
  const storedCrc = buf.readUInt32BE(29);
  const calcCrc = crc32(buf.subarray(12, 29));
  details.push(`IHDR CRC: ${storedCrc === calcCrc ? "OK" : "BAD"}`);
  if (storedCrc !== calcCrc) ok = false;
  return { ok, details };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
function main(): void {
  const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "./output";
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, "entry.png");

  const cv = new Canvas(WIDTH, HEIGHT);
  drawScene(cv);
  const png = encodePNG(WIDTH, HEIGHT, cv.buf);
  writeFileSync(outPath, png);

  console.log("=== Meme Sprint 3: AI Agent Goes Rogue ===");
  console.log(`caption top:    I TOLD MY AI AGENT TO CLEAR MY CALENDAR`);
  console.log(`caption bottom: IT DELETED MY BOSS!`);
  console.log(`output:         ${outPath}`);
  console.log(`png bytes:      ${png.length}`);
  console.log(`size limit:     ${MAX_BYTES}`);
  console.log(`under limit:    ${png.length <= MAX_BYTES ? "YES" : "NO"}`);

  const check = selfCheck(outPath, png.length);
  console.log("--- read-back self-check ---");
  for (const d of check.details) console.log(`  ${d}`);
  console.log(`VERDICT: ${check.ok ? "PASS" : "FAIL"}`);
  if (!check.ok) process.exit(1);
}

main();
