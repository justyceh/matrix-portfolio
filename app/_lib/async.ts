/** Resolves after `ms`, or rejects with the signal's reason if aborted first. */
export function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) return reject(signal.reason);
    const onAbort = () => {
      clearTimeout(id);
      reject(signal.reason);
    };
    const id = setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    signal.addEventListener("abort", onAbort, { once: true });
  });
}

/** Resolves once the tab is visible, so nobody misses the show in a background tab. */
export function whenVisible(signal: AbortSignal): Promise<void> {
  if (document.visibilityState === "visible") return Promise.resolve();
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      document.removeEventListener("visibilitychange", onChange);
      signal.removeEventListener("abort", onAbort);
    };
    const onChange = () => {
      if (document.visibilityState !== "visible") return;
      cleanup();
      resolve();
    };
    const onAbort = () => {
      cleanup();
      reject(signal.reason);
    };
    document.addEventListener("visibilitychange", onChange);
    signal.addEventListener("abort", onAbort, { once: true });
  });
}

export function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
