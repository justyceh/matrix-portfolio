"use client";

import { useEffect, useRef } from "react";
import { isInteractive } from "@/app/_lib/interactive";

/**
 * A "0" that becomes a "1" over anything clickable.
 *
 * - Only for mouse-like pointers; touch and pen keep native behaviour, and the native
 *   cursor is hidden only while this is active (class on <html>), so no-JS is unaffected.
 * - Position is written straight to `transform` from pointer events: no React renders,
 *   no layout, compositor-only.
 * - `mix-blend-mode: difference` keeps it visible on the green buttons.
 */
export function BinaryCursor() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const root = document.documentElement;
    const media = window.matchMedia("(hover: hover) and (pointer: fine)");

    const setState = (key: string, value: string) => {
      if (el.dataset[key] !== value) el.dataset[key] = value;
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      el.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      setState("visible", "true");
    };
    const onOver = (e: PointerEvent) => {
      setState("state", isInteractive(e.target) ? "link" : "idle");
    };
    const onDown = () => setState("pressed", "true");
    const onUp = () => setState("pressed", "false");
    const onLeave = () => setState("visible", "false");

    const enable = () => {
      root.classList.add("binary-cursor-on");
      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("pointerover", onOver, { passive: true });
      window.addEventListener("pointerdown", onDown, { passive: true });
      window.addEventListener("pointerup", onUp, { passive: true });
      root.addEventListener("mouseleave", onLeave);
      window.addEventListener("blur", onLeave);
    };
    const disable = () => {
      root.classList.remove("binary-cursor-on");
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerover", onOver);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      root.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("blur", onLeave);
      onLeave();
    };
    // Re-evaluate if a mouse is attached/detached (e.g. tablet + trackpad).
    const onMediaChange = () => (media.matches ? enable() : disable());

    if (media.matches) enable();
    media.addEventListener("change", onMediaChange);
    return () => {
      media.removeEventListener("change", onMediaChange);
      disable();
    };
  }, []);

  return (
    <div ref={ref} aria-hidden className="binary-cursor" data-visible="false" data-state="idle">
      <span className="binary-cursor__glyph" data-glyph="0">
        0
      </span>
      <span className="binary-cursor__glyph" data-glyph="1">
        1
      </span>
    </div>
  );
}
