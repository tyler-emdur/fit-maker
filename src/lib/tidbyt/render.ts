import { deflateRawSync } from "zlib";
import sharp from "sharp";
import { drawText } from "./font";

const WIDTH = 64;
const HEIGHT = 32;

// ── CRC-32 table (used for PNG chunk integrity) ─────────────────────────────
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[i] = c;
  }
  return t;
})();

function crc32(data: Uint8Array): number {
  let c = 0xffffffff;
  for (const byte of data) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Uint8Array): Buffer {
  const typeBytes = Buffer.from(type, "ascii");
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crcInput = Buffer.concat([typeBytes, data]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(new Uint8Array(crcInput)), 0);
  return Buffer.concat([len, typeBytes, data, crcBuf]);
}

function encodePng(pixels: Uint8Array): Buffer {
  // IHDR: width, height, bit depth=8, color type=2 (RGB)
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(WIDTH, 0);
  ihdrData.writeUInt32BE(HEIGHT, 4);
  ihdrData[8] = 8;  // bit depth
  ihdrData[9] = 2;  // color type: RGB
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace

  // Raw image data: prepend filter byte 0x00 (None) to each scanline
  const scanlineWidth = WIDTH * 3;
  const raw = new Uint8Array(HEIGHT * (1 + scanlineWidth));
  for (let y = 0; y < HEIGHT; y++) {
    raw[y * (1 + scanlineWidth)] = 0;
    raw.set(
      pixels.subarray(y * scanlineWidth, (y + 1) * scanlineWidth),
      y * (1 + scanlineWidth) + 1,
    );
  }

  const idatData = deflateRawSync(Buffer.from(raw), { level: 6 });

  const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  return Buffer.concat([
    PNG_SIG,
    chunk("IHDR", new Uint8Array(ihdrData)),
    chunk("IDAT", new Uint8Array(idatData)),
    chunk("IEND", new Uint8Array(0)),
  ]);
}

function fit(text: string, maxChars: number): string {
  return text.length <= maxChars ? text : text.slice(0, maxChars - 1) + ".";
}

// ── Public types and helpers ─────────────────────────────────────────────────

export type TidbytRenderInput = {
  tempF: number;
  condition: string;
  location: string;
  itemNames: string[];
};

export function itemsToNames(items: { name: string; category: string }[]): string[] {
  const order = ["outerwear", "long_sleeve", "short_sleeve", "pants", "shorts", "shoes"];
  return [...items]
    .sort((a, b) => order.indexOf(a.category) - order.indexOf(b.category))
    .map((i) => i.name);
}

/**
 * Renders a 64×32 RGB PNG for the Tidbyt display.
 *
 * Layout:
 *   y=2  — temp + condition in yellow,  e.g. "72F CLEAR"
 *   y=10 — item 1 in white,             e.g. the outerwear or tee
 *   y=18 — item 2 in white,             e.g. the bottom
 *   y=26 — item 3+ in dim white,        e.g. shoes (and extras)
 */
/**
 * Renders a 64×32 WebP for the Tidbyt Push API.
 * Sharp converts the internal PNG pixels → lossless WebP.
 */
export async function renderTidbytOutfit(input: TidbytRenderInput): Promise<Buffer> {
  const pixels = new Uint8Array(WIDTH * HEIGHT * 3); // black background

  const { tempF, condition, itemNames } = input;

  // Row 0 — weather in yellow
  const weatherLine = fit(`${Math.round(tempF)}F ${condition.toUpperCase()}`, 12);
  drawText(pixels, WIDTH, weatherLine, 1, 2, 255, 210, 0);

  // Rows 1–3 — garment names
  const nameRows: { y: number; text: string; r: number; g: number; b: number }[] = [
    { y: 10, text: itemNames[0] ?? "", r: 255, g: 255, b: 255 },
    { y: 18, text: itemNames[1] ?? "", r: 255, g: 255, b: 255 },
    { y: 26, text: [itemNames[2], itemNames[3]].filter(Boolean).join("/"), r: 160, g: 160, b: 160 },
  ];

  for (const row of nameRows) {
    if (!row.text) continue;
    drawText(pixels, WIDTH, fit(row.text, 12), 1, row.y, row.r, row.g, row.b);
  }

  const png = encodePng(pixels);
  // Tidbyt Push API requires WebP — convert losslessly via sharp
  return sharp(png).webp({ lossless: true, effort: 6 }).toBuffer();
}
