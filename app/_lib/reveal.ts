import type { CSSProperties } from "react";

/** Stagger helper for `.reveal` / `.reveal-line` entrances. */
export const revealDelay = (ms: number) => ({ "--delay": `${ms}ms` }) as CSSProperties;
