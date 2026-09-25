"use client";

import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/app/_lib/async";
import { scramble } from "@/app/_lib/scramble";
import { useIntro } from "../intro/intro-provider";

interface Props {
  text: string;
  /** Fires once the decode has fully resolved. Should be stable (useCallback). */
  onDone?: () => void;
}

/**
 * Decodes `text` out of random bits once, when the intro reveals.
 * One span per character so scrambling cells can be styled dimmer than locked ones.
 * Decorative: pair with an sr-only copy of the text.
 */
export function DecodeText({ text, onDone }: Props) {
  const { revealed } = useIntro();
  const ref = useRef<HTMLSpanElement>(null);
  const chars = Array.from(text);

  useEffect(() => {
    const el = ref.current;
    if (!revealed || !el) return;
    if (prefersReducedMotion()) {
      onDone?.();
      return;
    }

    return scramble(el, text, {
      delay: 150,
      stagger: 90,
      maxSpread: Infinity,
      jitter: 225,
      onDone,
    });
  }, [revealed, text, onDone]);

  return (
    <span ref={ref} aria-hidden className="decode">
      {chars.map((char, i) => (
        <span key={i}>{char}</span>
      ))}
    </span>
  );
}
