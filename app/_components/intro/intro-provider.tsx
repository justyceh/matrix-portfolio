"use client";

import { createContext, use, useCallback, useLayoutEffect, useRef, useState } from "react";
import { IntroOverlay } from "./intro-overlay";

const IntroContext = createContext({ revealed: false });

/** `revealed` flips true the moment the intro starts dissolving into the page. */
export function useIntro() {
  return use(IntroContext);
}

interface Props {
  name: string;
  children: React.ReactNode;
}

/**
 * The page is server-rendered underneath the intro (good for SEO / no-JS); the overlay
 * sits on top and hands off by flipping `data-revealed`, which drives CSS entrances.
 */
export function IntroProvider({ name, children }: Props) {
  const [revealed, setRevealed] = useState(false);
  const [done, setDone] = useState(false);
  const pageRef = useRef<HTMLDivElement>(null);

  const reveal = useCallback(() => setRevealed(true), []);
  const complete = useCallback(() => setDone(true), []);

  // Keep hidden page content out of the tab order. Set imperatively (not SSR'd) so the
  // page stays usable if JS never loads.
  useLayoutEffect(() => {
    if (pageRef.current) pageRef.current.inert = !revealed;
  }, [revealed]);

  return (
    <IntroContext value={{ revealed }}>
      <div ref={pageRef} data-revealed={revealed} className="contents">
        {children}
      </div>
      {!done && <IntroOverlay name={name} onReveal={reveal} onDone={complete} />}
      <noscript>
        <style>{`[data-stage]{display:none!important}.reveal,.reveal-line{opacity:1!important;transform:none!important}`}</style>
      </noscript>
    </IntroContext>
  );
}
