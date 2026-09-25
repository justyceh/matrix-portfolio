"use client";

import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/app/_lib/async";
import { isInteractive } from "@/app/_lib/interactive";

const PER_BURST = 16;
const MAX_PARTICLES = 320;
const GRAVITY = 1500; // px/s²
const GLYPH_PX = 20;
const GLOW_PX = 10;
const MAX_DPR = 2;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  age: number;
  ttl: number;
  scale: number;
  sprite: HTMLCanvasElement;
}

const rand = (min: number, max: number) => min + Math.random() * (max - min);

/** Glyph + glow rasterised once; the loop only blits these. */
function makeSprite(glyph: string, fill: string, dpr: number, family: string): HTMLCanvasElement {
  const size = Math.ceil((GLYPH_PX + GLOW_PX * 2) * dpr);
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d");
  if (!g) return c;
  g.font = `700 ${GLYPH_PX * dpr}px ${family}`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillStyle = fill;
  g.shadowColor = "rgba(0,255,65,0.8)";
  g.shadowBlur = GLOW_PX * dpr;
  g.fillText(glyph, size / 2, size / 2);
  g.shadowBlur = 0;
  g.fillText(glyph, size / 2, size / 2);
  return c;
}

/**
 * Clicking empty (non-interactive) space bursts 0s and 1s outward; they arc, fall and fade.
 * One shared canvas; the rAF loop only runs while particles are alive, so idle cost is zero.
 */
export function ClickBurst() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const family = getComputedStyle(canvas).fontFamily;
    const particles: Particle[] = [];
    let sprites: HTMLCanvasElement[] = [];
    let dpr = 0;
    let width = 0;
    let height = 0;
    let raf = 0;
    let last = 0;

    // Sized lazily on first burst / after a resize, so an unused canvas costs nothing.
    const fit = () => {
      const nextDpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      const w = window.innerWidth;
      const h = window.innerHeight;
      if (w === width && h === height && nextDpr === dpr) return;
      if (nextDpr !== dpr) {
        sprites = [
          makeSprite("0", "#00ff41", nextDpr, family),
          makeSprite("1", "#00ff41", nextDpr, family),
          makeSprite("0", "#c9ffd6", nextDpr, family),
          makeSprite("1", "#c9ffd6", nextDpr, family),
        ];
      }
      dpr = nextDpr;
      width = w;
      height = h;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    };

    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.age += dt;
        p.vy += GRAVITY * dt;
        p.vx *= 1 - 0.6 * dt; // a little air drag
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rot += p.vr * dt;

        const t = p.age / p.ttl;
        if (t >= 1 || p.y > height + 40) {
          particles[i] = particles[particles.length - 1];
          particles.pop();
          continue;
        }

        // Full strength for the pop, then fade and shrink as it falls away.
        const fade = t < 0.45 ? 1 : 1 - (t - 0.45) / 0.55;
        const s = p.scale * (0.6 + 0.4 * fade) * dpr;
        const cos = Math.cos(p.rot) * s;
        const sin = Math.sin(p.rot) * s;
        const half = p.sprite.width / dpr / 2;
        ctx.globalAlpha = fade;
        ctx.setTransform(cos, sin, -sin, cos, p.x * dpr, p.y * dpr);
        ctx.drawImage(p.sprite, -half, -half, half * 2, half * 2);
      }
      ctx.globalAlpha = 1;

      raf = particles.length ? requestAnimationFrame(frame) : 0;
    };

    const burst = (x: number, y: number) => {
      fit();
      for (let i = 0; i < PER_BURST && particles.length < MAX_PARTICLES; i++) {
        const angle = rand(0, Math.PI * 2);
        const speed = rand(160, 520);
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - rand(220, 420), // bias upward so they "jump"
          rot: rand(-0.4, 0.4),
          vr: rand(-6, 6),
          age: 0,
          ttl: rand(0.9, 1.5),
          scale: rand(0.6, 1.25),
          sprite: sprites[(Math.random() < 0.5 ? 0 : 1) + (Math.random() < 0.25 ? 2 : 0)],
        });
      }
      if (!raf) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };

    // `[data-no-burst]` opts a region out.
    const shouldBurst = (e: PointerEvent) =>
      e.button === 0 &&
      !isInteractive(e.target) &&
      !(e.target instanceof Element && e.target.closest("[data-no-burst]")) &&
      !prefersReducedMotion();

    // Mouse: fire on press for instant feedback. Touch/pen: wait for a real tap (click),
    // so starting a scroll doesn't set it off.
    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && shouldBurst(e)) burst(e.clientX, e.clientY);
    };
    const onClick = (e: MouseEvent) => {
      if (!(e instanceof PointerEvent) || e.pointerType === "mouse") return;
      if (shouldBurst(e)) burst(e.clientX, e.clientY);
    };

    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("click", onClick, { passive: true });
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("click", onClick);
      cancelAnimationFrame(raf);
    };
  }, []);

  return <canvas ref={ref} aria-hidden className="click-burst" />;
}
