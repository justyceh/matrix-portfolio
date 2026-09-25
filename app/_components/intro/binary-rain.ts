/**
 * Canvas 2D binary rain.
 *
 * Performance notes:
 * - Every glyph variant (incl. its glow) is rasterised once into a sprite atlas;
 *   the hot loop is only integer-aligned `drawImage` blits, never `fillText`/`shadowBlur`.
 * - Only cells a column head moves through are touched each frame. Trails decay via a
 *   single full-screen translucent fill, batched into discrete steps so 8-bit rounding
 *   doesn't leave faint ghost streaks behind.
 * - Trail decay is scaled by simulation speed, so when the rain decelerates the trails
 *   freeze with it instead of fading out — the "frozen code" frame at the end.
 * - Opaque context, DPR capped at 2, rAF paused by the browser in background tabs.
 */

type Paint = { fill: string; glow?: string; blur?: number };
type Tier = { share: number; speed: [number, number]; head: Paint; body: Paint };

// Depth tiers: near columns are fast, bright and glowing; far columns slow and dim.
const TIERS: Tier[] = [
  {
    share: 0.28,
    speed: [16, 26],
    head: { fill: "#e4ffea", glow: "#00ff41", blur: 14 },
    body: { fill: "#00ff41", glow: "rgba(0,255,65,0.55)", blur: 6 },
  },
  {
    share: 0.4,
    speed: [10, 16],
    head: { fill: "#8dffab", glow: "rgba(0,255,65,0.8)", blur: 8 },
    body: { fill: "#00b82f" },
  },
  {
    share: 0.32,
    speed: [5, 9],
    head: { fill: "#00cc36" },
    body: { fill: "#0a7a26" },
  },
];

const GLYPHS = ["0", "1"];
// Atlas rows: heads for each tier, then bodies for each tier.
const VARIANTS = [...TIERS.map((t) => t.head), ...TIERS.map((t) => t.body)];
const BODY = TIERS.length;

const TIME_SCALE = 1.7; // global playback speed of the rain (fall + trail decay together)
const FADE_RATE = 2.5; // trail decay per simulated second
const FADE_STEP = 0.12; // min accumulated decay before we pay for a full-screen fill
const MAX_DPR = 2;
const MAX_DT_MS = 50;
const GLOW_PAD = 14; // css px of room around each sprite for its glow

interface Column {
  y: number;
  row: number;
  speed: number;
  tier: number;
  glyph: number;
}

interface Task {
  elapsed: number;
  duration: number;
  halting: boolean;
  resolve: () => void;
}

const rand = (min: number, max: number) => min + Math.random() * (max - min);

function pickTier(): number {
  let r = Math.random();
  for (let i = 0; i < TIERS.length; i++) {
    r -= TIERS[i].share;
    if (r <= 0) return i;
  }
  return TIERS.length - 1;
}

export class BinaryRain {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly atlas = document.createElement("canvas");
  private readonly resizeObserver: ResizeObserver;

  private columns: Column[] = [];
  private rows = 0;
  private width = 0;
  private height = 0;
  private dpr = 1;
  private originX = 0;
  private cellW = 0;
  private cellH = 0;
  private pad = 0;
  private spriteW = 0;
  private spriteH = 0;

  private fadeDebt = 0;
  private raf = 0;
  private last = 0;
  private running = false;
  private destroyed = false;
  private task: Task | null = null;
  private resizeTimer = 0;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly fontFamily: string,
  ) {
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) throw new Error("Canvas 2D context unavailable");
    this.ctx = ctx;
    this.layout();

    this.resizeObserver = new ResizeObserver(() => {
      clearTimeout(this.resizeTimer);
      this.resizeTimer = window.setTimeout(() => this.layout(), 120);
    });
    this.resizeObserver.observe(canvas);
  }

  start(): void {
    if (this.running || this.destroyed) return;
    this.running = true;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.frame);
  }

  /** Resolves after `ms` of *rendered* time (pauses with the tab). */
  run(ms: number): Promise<void> {
    return this.schedule(ms, false);
  }

  /** Eases the rain to a standstill over `ms`, then stops the loop. */
  halt(ms: number): Promise<void> {
    return this.schedule(ms, true);
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.running = false;
    cancelAnimationFrame(this.raf);
    clearTimeout(this.resizeTimer);
    this.resizeObserver.disconnect();
    this.task?.resolve();
    this.task = null;
  }

  private schedule(duration: number, halting: boolean): Promise<void> {
    this.task?.resolve();
    return new Promise((resolve) => {
      if (this.destroyed) return resolve();
      this.task = { elapsed: 0, duration, halting, resolve };
    });
  }

  private frame = (now: number) => {
    const dtMs = Math.min(Math.max(now - this.last, 0), MAX_DT_MS);
    this.last = now;

    let speed = 1;
    let stop = false;
    const task = this.task;
    if (task) {
      task.elapsed += dtMs;
      const p = Math.min(task.elapsed / task.duration, 1);
      if (task.halting) speed = (1 - p) * (1 - p);
      if (p >= 1) {
        this.task = null;
        stop = task.halting;
        task.resolve();
      }
    }

    this.step((dtMs / 1000) * speed * TIME_SCALE);

    if (stop) {
      this.running = false;
      return;
    }
    this.raf = requestAnimationFrame(this.frame);
  };

  private step(t: number): void {
    if (t <= 0) return;
    const { ctx } = this;

    this.fadeDebt += FADE_RATE * t;
    if (this.fadeDebt >= FADE_STEP) {
      ctx.globalAlpha = 1 - Math.exp(-this.fadeDebt);
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.globalAlpha = 1;
      this.fadeDebt = 0;
    }

    for (let i = 0; i < this.columns.length; i++) {
      const c = this.columns[i];
      c.y += c.speed * t;
      const target = Math.floor(c.y);

      while (c.row < target) {
        // Demote the old head to a trail glyph, then light up the next cell.
        if (c.row >= 0) this.paint(i, c.row, c.glyph, BODY + c.tier);
        c.row++;
        if (c.row >= this.rows) {
          this.respawn(c, -rand(0, this.rows * 0.35));
          break;
        }
        c.glyph = Math.random() < 0.5 ? 0 : 1;
        if (c.row >= 0) this.paint(i, c.row, c.glyph, c.tier);
      }
    }
  }

  private paint(col: number, row: number, glyph: number, variant: number): void {
    const x = this.originX + col * this.cellW;
    const y = row * this.cellH;
    this.ctx.fillStyle = "#000";
    this.ctx.fillRect(x, y, this.cellW, this.cellH);
    this.ctx.drawImage(
      this.atlas,
      glyph * this.spriteW,
      variant * this.spriteH,
      this.spriteW,
      this.spriteH,
      x - this.pad,
      y - this.pad,
      this.spriteW,
      this.spriteH,
    );
  }

  private respawn(c: Column, y: number): void {
    c.tier = pickTier();
    const [min, max] = TIERS[c.tier].speed;
    c.speed = rand(min, max);
    c.y = y;
    c.row = Math.floor(y);
    c.glyph = 0;
  }

  private layout(): void {
    if (this.destroyed) return;
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    const cssW = this.canvas.clientWidth;
    const cssH = this.canvas.clientHeight;
    const width = Math.round(cssW * dpr);
    const height = Math.round(cssH * dpr);
    if (width === this.width && height === this.height && dpr === this.dpr) return;

    const isResize = this.width > 0;
    this.dpr = dpr;
    this.width = this.canvas.width = width;
    this.height = this.canvas.height = height;

    const fontPx = cssW < 640 ? 14 : cssW < 1280 ? 16 : 18;
    this.cellW = Math.round(fontPx * 0.95 * dpr);
    this.cellH = Math.round(fontPx * 1.2 * dpr);
    this.pad = Math.ceil(GLOW_PAD * dpr);
    this.buildAtlas(fontPx);

    const count = Math.ceil(width / this.cellW);
    this.rows = Math.ceil(height / this.cellH);
    this.originX = Math.floor((width - count * this.cellW) / 2);

    this.ctx.fillStyle = "#000";
    this.ctx.fillRect(0, 0, width, height);

    // First layout: streams enter from the top. On resize mid-rain: refill instantly.
    this.columns = Array.from({ length: count }, () => {
      const c: Column = { y: 0, row: 0, speed: 0, tier: 0, glyph: 0 };
      const y = isResize ? rand(-this.rows * 0.5, this.rows) : -rand(0, this.rows * 0.3);
      this.respawn(c, y);
      return c;
    });
  }

  private buildAtlas(fontPx: number): void {
    const sw = (this.spriteW = this.cellW + this.pad * 2);
    const sh = (this.spriteH = this.cellH + this.pad * 2);
    this.atlas.width = sw * GLYPHS.length;
    this.atlas.height = sh * VARIANTS.length;

    const g = this.atlas.getContext("2d");
    if (!g) return;
    g.font = `600 ${Math.round(fontPx * this.dpr)}px ${this.fontFamily}`;
    g.textAlign = "center";
    g.textBaseline = "middle";

    VARIANTS.forEach((paint, v) => {
      GLYPHS.forEach((glyph, i) => {
        const x = i * sw + sw / 2;
        const y = v * sh + sh / 2;
        g.fillStyle = paint.fill;
        if (paint.glow) {
          g.shadowColor = paint.glow;
          g.shadowBlur = (paint.blur ?? 0) * this.dpr;
          g.fillText(glyph, x, y);
          g.shadowBlur = 0;
        }
        g.fillText(glyph, x, y); // crisp core on top of the bloom
      });
    });
  }
}

/**
 * Waits for the canvas's (CSS-inherited) font so the atlas never rasterises a fallback,
 * then builds the engine. Returns null if aborted; destroys itself on abort.
 */
export async function createBinaryRain(
  canvas: HTMLCanvasElement,
  signal: AbortSignal,
): Promise<BinaryRain | null> {
  const family = getComputedStyle(canvas).fontFamily;
  try {
    await Promise.race([
      document.fonts.load(`600 18px ${family}`),
      new Promise((r) => setTimeout(r, 1500)),
    ]);
  } catch {
    // Fall through with whatever font is available.
  }
  if (signal.aborted) return null;

  const rain = new BinaryRain(canvas, family);
  signal.addEventListener("abort", () => rain.destroy(), { once: true });
  return rain;
}
