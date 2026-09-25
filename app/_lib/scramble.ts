const SWAP_MS = 55; // refresh slower than 60fps so the flicker reads as data, not noise

export interface ScrambleOptions {
  /** ms before the first character can lock. */
  delay?: number;
  /** ms between successive characters locking, left to right. */
  stagger?: number;
  /** Caps total sweep time so long strings don't drag. */
  maxSpread?: number;
  /** Random extra ms per character, so the lock-in front looks organic. */
  jitter?: number;
  onDone?: () => void;
}

/**
 * Scrambles `el`'s text into random bits, then resolves it back to `text` left to right.
 * Writes straight to the DOM (no React renders). Monospace keeps the width fixed, so
 * nothing reflows. If `el` has one child per character, each child is updated and gets
 * `data-state="scramble" | "locked"` for styling; otherwise `el.textContent` is replaced.
 *
 * Returns a cancel function that restores the original text immediately.
 */
export function scramble(
  el: HTMLElement,
  text: string,
  { delay = 0, stagger = 28, maxSpread = 650, jitter = 120, onDone }: ScrambleOptions = {},
): () => void {
  const chars = Array.from(text);
  const cells =
    el.children.length === chars.length ? (Array.from(el.children) as HTMLElement[]) : null;
  const step = Math.min(stagger, maxSpread / Math.max(chars.length, 1));
  const lockAt = chars.map((_, i) => delay + i * step + Math.random() * jitter);
  const start = performance.now();
  let lastSwap = -Infinity;
  let raf = 0;

  const restore = () => {
    if (!cells) {
      el.textContent = text;
      return;
    }
    cells.forEach((cell, i) => {
      cell.textContent = chars[i];
      cell.dataset.state = "locked";
    });
  };

  const tick = (now: number) => {
    if (now - lastSwap >= SWAP_MS) {
      lastSwap = now;
      const t = now - start;
      let pending = false;
      let out = "";

      chars.forEach((ch, i) => {
        const locked = t >= lockAt[i] || !ch.trim();
        const glyph = locked ? ch : Math.random() < 0.5 ? "0" : "1";
        if (!locked) pending = true;
        if (cells) {
          const state = locked ? "locked" : "scramble";
          if (cells[i].dataset.state === "locked" && locked) return;
          cells[i].textContent = glyph;
          cells[i].dataset.state = state;
        } else {
          out += glyph;
        }
      });
      if (!cells) el.textContent = out;

      if (!pending) {
        onDone?.();
        return;
      }
    }
    raf = requestAnimationFrame(tick);
  };

  // Mark every cell "scrambling" so a replay re-renders already-locked characters.
  cells?.forEach((cell) => (cell.dataset.state = "scramble"));
  raf = requestAnimationFrame(tick);

  return () => {
    cancelAnimationFrame(raf);
    restore();
  };
}

export interface DissolveOptions {
  /** ms the whole string flickers as bits before it starts erasing. */
  hold?: number;
  /** ms between characters vanishing, right to left. */
  stagger?: number;
  /** Caps total erase time so long strings don't drag. */
  maxSpread?: number;
  onDone?: () => void;
}

/**
 * The reverse of `scramble`: turns `el`'s text into flickering bits, then erases it right
 * to left until nothing is left. Writes straight to the DOM. Returns a cancel function.
 */
export function dissolve(
  el: HTMLElement,
  text: string,
  { hold = 380, stagger = 35, maxSpread = 500, onDone }: DissolveOptions = {},
): () => void {
  const chars = Array.from(text);
  const step = Math.min(stagger, maxSpread / Math.max(chars.length, 1));
  const start = performance.now();
  let lastSwap = -Infinity;
  let raf = 0;

  const tick = (now: number) => {
    if (now - lastSwap >= SWAP_MS) {
      lastSwap = now;
      const erased = Math.max(0, Math.floor((now - start - hold) / step));
      const alive = chars.slice(0, Math.max(chars.length - erased, 0));
      el.textContent = alive
        .map((ch) => (ch.trim() ? (Math.random() < 0.5 ? "0" : "1") : ch))
        .join("");
      if (!alive.length) {
        onDone?.();
        return;
      }
    }
    raf = requestAnimationFrame(tick);
  };

  raf = requestAnimationFrame(tick);
  return () => {
    cancelAnimationFrame(raf);
    el.textContent = "";
  };
}
