"use client";

import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/app/_lib/async";
import { scramble } from "@/app/_lib/scramble";

interface Props {
  text: string;
  className?: string;
}

/**
 * Text that scrambles into bits on hover. Hovering the nearest `[data-scramble-trigger]`
 * ancestor (or the text itself) plays it, so several segments can react as one line.
 * The visual copy is aria-hidden; screen readers get a stable sr-only copy.
 */
export function ScrambleText({ text, className }: Props) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const trigger = el.closest<HTMLElement>("[data-scramble-trigger]") ?? el;
    let cancel: (() => void) | null = null;

    const onEnter = () => {
      if (cancel || prefersReducedMotion()) return; // let a running pass finish
      cancel = scramble(el, text, { onDone: () => (cancel = null) });
    };

    trigger.addEventListener("pointerenter", onEnter);
    return () => {
      trigger.removeEventListener("pointerenter", onEnter);
      cancel?.();
    };
  }, [text]);

  return (
    <>
      <span ref={ref} aria-hidden className={className}>
        {text}
      </span>
      <span className="sr-only">{text}</span>
    </>
  );
}
