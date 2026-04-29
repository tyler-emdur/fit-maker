/**
 * Minimal 4×6 bitmap font for the Tidbyt 64×32 display.
 * Each character is represented as 6 rows; each row is a 4-bit mask
 * where bit 3 = leftmost pixel, bit 0 = rightmost pixel.
 * Characters are 4px wide and 6px tall (includes 1px descender row).
 */
export const GLYPH_W = 4;
export const GLYPH_H = 6;

// prettier-ignore
const GLYPHS: Record<string, number[]> = {
  " ": [0b0000, 0b0000, 0b0000, 0b0000, 0b0000, 0b0000],
  "A": [0b0110, 0b1001, 0b1111, 0b1001, 0b1001, 0b0000],
  "B": [0b1110, 0b1001, 0b1110, 0b1001, 0b1110, 0b0000],
  "C": [0b0111, 0b1000, 0b1000, 0b1000, 0b0111, 0b0000],
  "D": [0b1110, 0b1001, 0b1001, 0b1001, 0b1110, 0b0000],
  "E": [0b1111, 0b1000, 0b1110, 0b1000, 0b1111, 0b0000],
  "F": [0b1111, 0b1000, 0b1110, 0b1000, 0b1000, 0b0000],
  "G": [0b0111, 0b1000, 0b1011, 0b1001, 0b0111, 0b0000],
  "H": [0b1001, 0b1001, 0b1111, 0b1001, 0b1001, 0b0000],
  "I": [0b1110, 0b0100, 0b0100, 0b0100, 0b1110, 0b0000],
  "J": [0b0001, 0b0001, 0b0001, 0b1001, 0b0110, 0b0000],
  "K": [0b1001, 0b1010, 0b1100, 0b1010, 0b1001, 0b0000],
  "L": [0b1000, 0b1000, 0b1000, 0b1000, 0b1111, 0b0000],
  "M": [0b1001, 0b1111, 0b1111, 0b1001, 0b1001, 0b0000],
  "N": [0b1001, 0b1101, 0b1011, 0b1001, 0b1001, 0b0000],
  "O": [0b0110, 0b1001, 0b1001, 0b1001, 0b0110, 0b0000],
  "P": [0b1110, 0b1001, 0b1110, 0b1000, 0b1000, 0b0000],
  "Q": [0b0110, 0b1001, 0b1001, 0b0110, 0b0001, 0b0000],
  "R": [0b1110, 0b1001, 0b1110, 0b1010, 0b1001, 0b0000],
  "S": [0b0111, 0b1000, 0b0110, 0b0001, 0b1110, 0b0000],
  "T": [0b1110, 0b0100, 0b0100, 0b0100, 0b0100, 0b0000],
  "U": [0b1001, 0b1001, 0b1001, 0b1001, 0b0110, 0b0000],
  "V": [0b1001, 0b1001, 0b1001, 0b0110, 0b0110, 0b0000],
  "W": [0b1001, 0b1001, 0b1111, 0b1111, 0b1001, 0b0000],
  "X": [0b1001, 0b0110, 0b0110, 0b1001, 0b1001, 0b0000],
  "Y": [0b1001, 0b1001, 0b0110, 0b0100, 0b0100, 0b0000],
  "Z": [0b1111, 0b0001, 0b0110, 0b1000, 0b1111, 0b0000],
  "0": [0b0110, 0b1011, 0b1101, 0b1001, 0b0110, 0b0000],
  "1": [0b0110, 0b0100, 0b0100, 0b0100, 0b1110, 0b0000],
  "2": [0b0110, 0b1001, 0b0010, 0b0100, 0b1111, 0b0000],
  "3": [0b1110, 0b0001, 0b0110, 0b0001, 0b1110, 0b0000],
  "4": [0b1001, 0b1001, 0b1111, 0b0001, 0b0001, 0b0000],
  "5": [0b1111, 0b1000, 0b1110, 0b0001, 0b1110, 0b0000],
  "6": [0b0110, 0b1000, 0b1110, 0b1001, 0b0110, 0b0000],
  "7": [0b1111, 0b0001, 0b0010, 0b0100, 0b0100, 0b0000],
  "8": [0b0110, 0b1001, 0b0110, 0b1001, 0b0110, 0b0000],
  "9": [0b0110, 0b1001, 0b0111, 0b0001, 0b0110, 0b0000],
  ".": [0b0000, 0b0000, 0b0000, 0b0110, 0b0110, 0b0000],
  "-": [0b0000, 0b0000, 0b1110, 0b0000, 0b0000, 0b0000],
  "/": [0b0001, 0b0010, 0b0100, 0b1000, 0b0000, 0b0000],
  "'": [0b0110, 0b0100, 0b0000, 0b0000, 0b0000, 0b0000],
};

/** Draw a single glyph into an RGB pixel buffer at (x, y). */
export function drawChar(
  buf: Uint8Array,
  width: number,
  ch: string,
  x: number,
  y: number,
  r: number,
  g: number,
  b: number,
) {
  const rows = GLYPHS[ch.toUpperCase()] ?? GLYPHS[" "];
  for (let row = 0; row < GLYPH_H; row++) {
    const mask = rows[row];
    for (let col = 0; col < GLYPH_W; col++) {
      if (mask & (1 << (GLYPH_W - 1 - col))) {
        const px = (y + row) * width + (x + col);
        buf[px * 3] = r;
        buf[px * 3 + 1] = g;
        buf[px * 3 + 2] = b;
      }
    }
  }
}

/** Draw a string into an RGB pixel buffer starting at (x, y). Returns ending x. */
export function drawText(
  buf: Uint8Array,
  width: number,
  text: string,
  x: number,
  y: number,
  r: number,
  g: number,
  b: number,
) {
  let cx = x;
  for (const ch of text) {
    drawChar(buf, width, ch, cx, y, r, g, b);
    cx += GLYPH_W + 1; // 1px letter-spacing
  }
  return cx;
}
