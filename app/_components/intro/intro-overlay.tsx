"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { prefersReducedMotion, sleep, whenVisible } from "@/app/_lib/async";
import { createBinaryRain } from "./binary-rain";
import styles from "./intro.module.css";

type Stage = "boot" | "typing" | "rain" | "dissolve";

// Timeline (ms). Tuned as a whole — change one, re-watch the full sequence.
const BOOT_MS = 900; // lone blinking cursor
const HOLD_MS = 120; // the rain hits the instant the last "." lands
const RAIN_MS = 3000;
const HALT_MS = 1000; // deceleration to a standstill
const FREEZE_MS = 300; // beat on the frozen frame
const DISSOLVE_MS = 1100; // keep in sync with .root[data-stage="dissolve"]
const WATCHDOG_GRACE_MS = 3000;

function keystrokeDelay(char: string, next: string | undefined): number {
  if (char === ",") return 420;
  if (char === ".") return next === "." ? 300 : 0;
  if (char === " ") return 110;
  return 55 + Math.random() * 75;
}

interface Props {
  name: string;
  onReveal: () => void;
  onDone: () => void;
}

export function IntroOverlay({ name, onReveal, onDone }: Props) {
  const text = `Wake up, ${name}...`;
  const [stage, setStage] = useState<Stage>("boot");
  const [typed, setTyped] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timelineRef = useRef<AbortController | null>(null);
  const finishedRef = useRef(false);

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setStage("dissolve");
    onReveal();
    window.setTimeout(onDone, DISSOLVE_MS);
  }, [onReveal, onDone]);

  const skip = useCallback(() => {
    timelineRef.current?.abort();
    finish();
  }, [finish]);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    timelineRef.current = controller;
    const wait = (ms: number) => sleep(ms, signal);

    async function play() {
      await whenVisible(signal);
      const reduced = prefersReducedMotion();
      // Warm the font + atlas while the cursor blinks.
      const rainReady =
        !reduced && canvasRef.current ? createBinaryRain(canvasRef.current, signal) : null;

      await wait(BOOT_MS);
      setStage("typing");
      if (reduced) {
        setTyped(text.length);
      } else {
        for (let i = 0; i < text.length; i++) {
          setTyped(i + 1);
          await wait(keystrokeDelay(text[i], text[i + 1]));
        }
      }
      await wait(HOLD_MS);

      const rain = await rainReady;
      signal.throwIfAborted();
      if (rain) {
        setStage("rain");
        rain.start();
        // Rain runs on rendered time; if frames are starved (throttled iframe, power
        // saving), don't hold the visitor hostage — fall through to the reveal.
        const watchdog = sleep(RAIN_MS + HALT_MS + WATCHDOG_GRACE_MS, signal);
        await Promise.race([
          (async () => {
            await rain.run(RAIN_MS);
            await rain.halt(HALT_MS);
          })(),
          watchdog,
        ]);
        signal.throwIfAborted();
        await wait(FREEZE_MS);
      }
      finish();
    }

    play().catch((err) => {
      if (!signal.aborted) throw err;
    });
    return () => controller.abort();
  }, [text, finish]);

  // Any of these keys skips; the overlay also locks scroll while it's up.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        skip();
      }
    };
    const root = document.documentElement;
    const prevOverflow = root.style.overflow;
    root.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      root.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [skip]);

  return (
    <div className={styles.root} data-stage={stage}>
      <canvas ref={canvasRef} className={styles.canvas} aria-hidden />
      <div className={styles.terminal} aria-hidden>
        <p className={styles.line}>
          <span>{text.slice(0, typed)}</span>
          <span className={styles.cursor} />
        </p>
      </div>
      <div className={styles.crt} aria-hidden />
      {stage !== "dissolve" && (
        <button type="button" className={styles.skip} onClick={skip}>
          Skip intro <kbd className={styles.kbd}>esc</kbd>
        </button>
      )}
    </div>
  );
}
