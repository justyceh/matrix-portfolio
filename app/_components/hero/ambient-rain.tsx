"use client";

import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/app/_lib/async";
import { useIntro } from "../intro/intro-provider";

const FONT_PX = 14;
const ROW_PX = 17;
const COL_PX = 22;
const DENSITY = 1 / 110; // max simultaneous streams per css px of width — keep it sparse
const SPEED: [number, number] = [38, 95]; // px/s — a slow drift, not a storm
const TRAIL: [number, number] = [3, 8];
const FLIP_PER_SEC = 1.5; // chance/sec that a trail digit toggles
const MAX_DPR = 2;

interface Stream {
  col: number;
  y: number;
  speed: number;
  bits: number[];
  alpha: number;
}

const rand = (min: number, max: number) => min + Math.random() * (max - min);

/**
 * Sparse ambient binary rain behind the hero. Redraws ~100 sprite blits per frame at most,
 * and only runs while the hero is on screen, the tab is visible and the intro is done.
 */
export function AmbientRain() {
  const { revealed } = useIntro();
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!revealed || !canvas || !ctx || prefersReducedMotion()) return;

    const family = getComputedStyle(canvas).fontFamily;
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    const pad = 6;
    const spriteSize = Math.ceil((FONT_PX + pad * 2) * dpr);

    // Two glyphs × (trail, head) rasterised once.
    const sprites = ["0", "1"].flatMap((glyph) =>
      [false, true].map((head) => {
        const c = document.createElement("canvas");
        c.width = c.height = spriteSize;
        const g = c.getContext("2d")!;
        g.font = `600 ${FONT_PX * dpr}px ${family}`;
        g.textAlign = "center";
        g.textBaseline = "middle";
        g.fillStyle = head ? "#c9ffd6" : "#00ff41";
        if (head) {
          g.shadowColor = "#00ff41";
          g.shadowBlur = 8 * dpr;
        }
        g.fillText(glyph, spriteSize / 2, spriteSize / 2);
        return c;
      }),
    );
    const sprite = (bit: number, head: boolean) => sprites[bit * 2 + (head ? 1 : 0)];

    let width = 0;
    let height = 0;
    let cols = 0;
    let streams: Stream[] = [];
    let raf = 0;
    let last = 0;
    let spawnDebt = 0;
    let onScreen = true;

    const resize = () => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      cols = Math.max(1, Math.floor(width / COL_PX));
      streams = streams.filter((s) => s.col < cols);
    };

    const spawn = (y: number) => {
      const used = new Set(streams.map((s) => s.col));
      let col = Math.floor(Math.random() * cols);
      for (let i = 0; i < 4 && used.has(col); i++) col = Math.floor(Math.random() * cols);
      const len = Math.round(rand(TRAIL[0], TRAIL[1]));
      streams.push({
        col,
        y,
        speed: rand(SPEED[0], SPEED[1]),
        bits: Array.from({ length: len }, () => (Math.random() < 0.5 ? 0 : 1)),
        alpha: rand(0.18, 0.42),
      });
    };

    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 1 / 20);
      last = now;
      const max = Math.max(4, Math.round(width * DENSITY));

      // Trickle in new streams rather than all at once.
      spawnDebt += dt * max * 0.18;
      while (spawnDebt >= 1 && streams.length < max) {
        spawnDebt -= 1;
        spawn(-ROW_PX);
      }
      if (streams.length >= max) spawnDebt = 0;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const half = spriteSize / dpr / 2;

      for (let i = streams.length - 1; i >= 0; i--) {
        const s = streams[i];
        s.y += s.speed * dt;
        const tailY = s.y - (s.bits.length - 1) * ROW_PX;
        if (tailY > height + ROW_PX) {
          streams[i] = streams[streams.length - 1];
          streams.pop();
          continue;
        }

        const x = s.col * COL_PX + COL_PX / 2;
        for (let k = 0; k < s.bits.length; k++) {
          if (Math.random() < FLIP_PER_SEC * dt) s.bits[k] ^= 1;
          const y = s.y - k * ROW_PX;
          if (y < -ROW_PX || y > height + ROW_PX) continue;
          // Trail fades behind the head; everything fades out toward the bottom edge.
          const trail = 1 - k / s.bits.length;
          const edge = Math.min(1, Math.max(0, (height - y) / (height * 0.3)));
          ctx.globalAlpha = s.alpha * trail * edge * (k === 0 ? 1.6 : 1);
          ctx.drawImage(sprite(s.bits[k], k === 0), x - half, y - half, half * 2, half * 2);
        }
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (raf || !onScreen) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    resize();
    // Seed a few mid-screen so it doesn't start empty.
    for (let i = 0; i < Math.round(width * DENSITY * 0.5); i++) spawn(rand(0, height * 0.8));

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    const intersection = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      if (onScreen) start();
      else stop();
    });
    intersection.observe(canvas);
    canvas.dataset.active = "true";
    start();

    return () => {
      stop();
      resizeObserver.disconnect();
      intersection.disconnect();
      canvas.dataset.active = "false";
    };
  }, [revealed]);

  return <canvas ref={ref} aria-hidden className="ambient-rain" data-active="false" />;
}
