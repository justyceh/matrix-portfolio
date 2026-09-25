/** Anything a click does something on. Add `data-cursor="pointer"` to opt in custom elements. */
export const INTERACTIVE =
  'a[href], button:not(:disabled), [role="button"], input:not(:disabled), select, textarea, label[for], summary, [data-cursor="pointer"]';

export function isInteractive(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest(INTERACTIVE) !== null;
}
