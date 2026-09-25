"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { prefersReducedMotion, sleep, whenVisible } from "@/app/_lib/async";
import { dissolve, scramble } from "@/app/_lib/scramble";
import type { Job } from "@/app/_lib/site";
import { formatRange } from "./format";
import s from "./terminal.module.css";

const USER = "justyce@portfolio";
const COMMAND = "cat ~/work/*/README.md";

function Prompt() {
  return (
    <span className={s.prompt}>
      <span className={s.user}>{USER}</span>
      <span className={s.dim}>:</span>
      <span className={s.path}>~</span>
      <span className={s.dim}>$</span>{" "}
    </span>
  );
}

/** One `README.md`, rendered as a key/value record. The role decodes out of bits when it appears. */
function JobRecord({ job, index, animate }: { job: Job; index: number; animate: boolean }) {
  const roleRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!animate || !roleRef.current) return;
    return scramble(roleRef.current, job.role, { delay: 80, stagger: 30, jitter: 140 });
  }, [animate, job.role]);

  const rows: [string, React.ReactNode][] = [
    ["role", <span key="r" ref={roleRef} className={s.role}>{job.role}</span>],
    ["company", <span key="c">{job.company} <span className={s.dim}>· {job.location}</span></span>],
    ["period", formatRange(job.start, job.end)],
    ["about", <span key="a" className={s.muted}>{job.summary}</span>],
    ["stack", job.stack.join("  ·  ")],
  ];

  return (
    <div className={s.record}>
      <div className={s.rule}>
        <span>── [{String(index + 1).padStart(2, "0")}] {job.slug}</span>
        <span className={s.ruleLine} />
      </div>
      <dl className={s.fields}>
        {rows.map(([key, value]) => (
          <div key={key} className={s.field}>
            <dt className={s.key}>{key}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/** Submitted input: flickers into bits, then erases itself. */
function Dissolving({ text, onDone }: { text: string; onDone: () => void }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    if (prefersReducedMotion()) return onDone();
    return dissolve(ref.current, text, { onDone });
  }, [text, onDone]);

  return <span ref={ref} className={s.dissolving}>{text}</span>;
}

/**
 * A live prompt: typing shows up; Enter turns it to bits and it vanishes. The visible line
 * is a mirror; the real input sits on top, transparent.
 */
function LivePrompt() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");
  const [caret, setCaret] = useState(0);
  const [focused, setFocused] = useState(false);
  const [sent, setSent] = useState<{ id: number; text: string } | null>(null);
  const nextId = useRef(0);
  const clearSent = useCallback(() => setSent(null), []);

  const submit = () => {
    if (!value.trim()) return;
    setSent({ id: nextId.current++, text: value });
    setValue("");
    setCaret(0);
  };

  // `selectionchange` catches every caret move (arrows, Home/End, clicks, IME).
  useEffect(() => {
    if (!focused) return;
    const sync = () => {
      const input = inputRef.current;
      if (input && document.activeElement === input) setCaret(input.selectionEnd ?? 0);
    };
    document.addEventListener("selectionchange", sync);
    return () => document.removeEventListener("selectionchange", sync);
  }, [focused]);

  return (
    <div className={s.inputLine}>
      <Prompt />
      <span className={s.inputWrap}>
        <span aria-hidden className={s.mirror}>
          {sent && <Dissolving key={sent.id} text={sent.text} onDone={clearSent} />}
          {value.slice(0, caret)}
          <span className={s.cursor} data-state={focused ? "live" : "idle"}>
            {value[caret] ?? " "}
          </span>
          {value.slice(caret + 1)}
        </span>
        <input
          ref={inputRef}
          className={s.input}
          value={value}
          maxLength={80}
          aria-label="Terminal input (decorative, does nothing)"
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          onChange={(e) => {
            setValue(e.target.value);
            setCaret(e.target.selectionEnd ?? e.target.value.length);
          }}
          onKeyDown={(e) => {
            if (e.key !== "Enter") return;
            e.preventDefault();
            submit();
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </span>
    </div>
  );
}

/**
 * Types one command, then prints each job. Everything is laid out from the start (unshown
 * parts are just invisible), so the window never changes height and simply scrolls with the page.
 */
export function WorkTerminal({ jobs }: { jobs: readonly Job[] }) {
  const [typed, setTyped] = useState(0); // chars of COMMAND typed
  const [shown, setShown] = useState(0); // job records printed
  const [done, setDone] = useState(false);
  const [animate, setAnimate] = useState(true);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const controller = new AbortController();
    const { signal } = controller;
    const wait = (ms: number) => sleep(ms, signal);

    async function play() {
      await whenVisible(signal);
      if (prefersReducedMotion()) {
        setAnimate(false);
        setTyped(COMMAND.length);
        setShown(jobs.length);
        setDone(true);
        return;
      }
      await wait(300);
      for (let c = 1; c <= COMMAND.length; c++) {
        setTyped(c);
        await wait(26 + Math.random() * 48);
      }
      await wait(300);
      for (let i = 1; i <= jobs.length; i++) {
        setShown(i);
        await wait(320);
      }
      setDone(true);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        play().catch((err) => {
          if (!signal.aborted) throw err;
        });
      },
      // Start once the top is comfortably on screen; a ratio threshold could never be
      // reached if the window is taller than the viewport.
      { rootMargin: "0px 0px -25% 0px" },
    );
    observer.observe(root);
    return () => {
      observer.disconnect();
      controller.abort();
    };
  }, [jobs]);

  const typing = typed < COMMAND.length || shown === 0;

  return (
    <div ref={rootRef} className={s.window}>
      <div className={s.titlebar} aria-hidden>
        <span className={s.tab}>
          <span className={s.tabIcon}>&gt;_</span> bash
        </span>
        <span className={s.title}>{USER}: ~/work</span>
        <span className={s.controls}>
          <span>─</span>
          <span>□</span>
          <span>✕</span>
        </span>
      </div>

      <div className={s.body}>
        <p aria-hidden>
          <Prompt />
          <span className={s.cmd}>{COMMAND.slice(0, typed)}</span>
          {typing && <span className={s.cursor} data-state="typing" />}
        </p>

        {jobs.map((job, i) => (
          <div key={job.slug} aria-hidden className={s.step} data-shown={i < shown}>
            <JobRecord job={job} index={i} animate={animate && i < shown} />
          </div>
        ))}

        <div className={s.step} data-shown={done}>
          {done ? (
            <LivePrompt />
          ) : (
            <p aria-hidden>
              <Prompt />
              <span className={s.cursor} />
            </p>
          )}
        </div>
      </div>
      <div className={s.crt} aria-hidden />
    </div>
  );
}
