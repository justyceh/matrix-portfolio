"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/app/_lib/async";
import { DecodeText } from "./decode-text";
import { buildStrips, type StripSet } from "./matrix-strips";

const UNIQUE_STRIPS = 6;
const MIN_PLAY_MS = 900; // a quick brush still gets a full pass
const FADE_OUT_MS = 320; // keep in sync with .name-matrix transition

/**
 * The hero name. After its intro decode, hovering sends horizontal binary streams through
 * the letters. The streams live on a transparent, pixel-identical copy of the text with
 * `background-clip: text`, so they can only ever appear inside the glyphs.
 *
 * Only `background-position` changes per frame, and the loop runs only while visible.
 */
export function HeroName({ text }: { text: string }) {
  const [decoded, setDecoded] = useState(false);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const overlayRef = useRef<HTMLSpanElement>(null);
  const onDecoded = useCallback(() => setDecoded(true), []);

  useEffect(() => {
    const trigger = triggerRef.current;
    const overlay = overlayRef.current;
    if (!decoded || !trigger || !overlay || prefersReducedMotion()) return;

    let strips: StripSet | null = null;
    let rows: { x: number; y: number; speed: number }[] = [];
    let raf = 0;
    let last = 0;
    let startedAt = 0;
    let stopTimer = 0;

    const build = () => {
      const style = getComputedStyle(overlay);
      const fontPx = parseFloat(style.fontSize);
      const height = overlay.offsetHeight;
      const digitPx = Math.max(7, Math.round(fontPx * 0.072));
      const rowH = Math.round(digitPx * 1.2);
      strips = buildStrips({
        count: UNIQUE_STRIPS,
        digitPx,
        rowH,
        tileW: 1100,
        family: style.fontFamily,
      });
      const n = Math.ceil(height / rowH);
      rows = Array.from({ length: n }, (_, i) => ({
        x: Math.random() * strips!.tileW,
        y: i * rowH,
        speed: 380 + Math.random() * 820, // px/s
      }));
      overlay.style.backgroundImage = rows
        .map((_, i) => `url(${strips!.urls[i % strips!.urls.length]})`)
        .join(",");
      overlay.style.backgroundSize = rows.map(() => `${strips!.tileW}px ${rowH}px`).join(",");
      overlay.style.backgroundRepeat = "repeat-x";
    };

    const paint = () => {
      overlay.style.backgroundPosition = rows.map((r) => `${r.x}px ${r.y}px`).join(",");
    };

    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;
      const tile = strips!.tileW;
      for (const r of rows) r.x = (r.x + r.speed * dt) % tile;
      paint();
      raf = requestAnimationFrame(frame);
    };

    const stopLoop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    const onEnter = () => {
      clearTimeout(stopTimer);
      if (!strips) build();
      if (!raf) {
        startedAt = last = performance.now();
        paint();
        raf = requestAnimationFrame(frame);
      }
      overlay.dataset.active = "true";
    };

    const onLeave = () => {
      const remaining = Math.max(0, MIN_PLAY_MS - (performance.now() - startedAt));
      clearTimeout(stopTimer);
      stopTimer = window.setTimeout(() => {
        overlay.dataset.active = "false";
        stopTimer = window.setTimeout(stopLoop, FADE_OUT_MS);
      }, remaining);
    };

    // Letter size is fluid; regenerate strips at the next hover after a resize.
    const onResize = () => {
      strips = null;
    };

    trigger.addEventListener("pointerenter", onEnter);
    trigger.addEventListener("pointerleave", onLeave);
    window.addEventListener("resize", onResize);
    return () => {
      trigger.removeEventListener("pointerenter", onEnter);
      trigger.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("resize", onResize);
      clearTimeout(stopTimer);
      stopLoop();
      overlay.dataset.active = "false";
    };
  }, [decoded]);

  return (
    <>
      <span ref={triggerRef}>
        <DecodeText text={text} onDone={onDecoded} />
      </span>
      <span ref={overlayRef} aria-hidden className="name-matrix" data-active="false">
        {text}
      </span>
    </>
  );
}
