/**
 * Horizontally tileable strips of binary "rain" — one row each — rasterised once to
 * data URLs so they can be used as CSS background layers.
 */

export interface StripSet {
  urls: string[];
  tileW: number;
  rowH: number;
}

const rand = (min: number, max: number) => min + Math.random() * (max - min);

export function buildStrips({
  count,
  digitPx,
  rowH,
  tileW,
  family,
}: {
  count: number;
  digitPx: number;
  rowH: number;
  tileW: number;
  family: string;
}): StripSet {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const charW = Math.round(digitPx * 0.72);
  const cols = Math.floor(tileW / charW);
  const width = cols * charW; // exact multiple so the tile wraps seamlessly
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(rowH * dpr);
  const g = canvas.getContext("2d");
  if (!g) return { urls: [], tileW: width, rowH };

  g.scale(dpr, dpr);
  g.font = `700 ${digitPx}px ${family}`;
  g.textAlign = "center";
  g.textBaseline = "middle";

  const glyph = (col: number, fill: string, alpha: number, glow = 0) => {
    const ch = Math.random() < 0.5 ? "0" : "1";
    const x = (((col % cols) + cols) % cols) * charW + charW / 2; // wrap across the seam
    g.globalAlpha = alpha;
    g.fillStyle = fill;
    g.shadowBlur = glow;
    g.shadowColor = "#00ff41";
    g.fillText(ch, x, rowH / 2);
  };

  const urls: string[] = [];
  for (let s = 0; s < count; s++) {
    g.clearRect(0, 0, width, rowH);

    // Darken the letter so the code reads against it, then a faint static field of bits.
    g.globalAlpha = 1;
    g.shadowBlur = 0;
    g.fillStyle = "rgba(0, 14, 4, 0.82)";
    g.fillRect(0, 0, width, rowH);
    for (let c = 0; c < cols; c++) if (Math.random() < 0.55) glyph(c, "#00ff41", 0.16);

    // Streams: bright head on the right (they travel left → right), trail fading behind.
    let col = Math.floor(rand(0, 6));
    while (col < cols) {
      const len = Math.floor(rand(5, 18));
      for (let i = 0; i < len; i++) {
        const t = i / (len - 1); // 0 tail → 1 head
        glyph(col + i, "#00ff41", 0.12 + 0.88 * t * t);
      }
      glyph(col + len, "#e4ffea", 1, digitPx * 0.6); // head
      col += len + 1 + Math.floor(rand(3, 16));
    }
    urls.push(canvas.toDataURL("image/png"));
  }
  return { urls, tileW: width, rowH };
}
