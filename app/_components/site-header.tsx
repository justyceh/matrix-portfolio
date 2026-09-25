"use client";

import { useEffect, useRef } from "react";
import { revealDelay } from "@/app/_lib/reveal";
import { site } from "@/app/_lib/site";
import { ScrambleText } from "./hero/scramble-text";

/**
 * Fixed top bar. Transparent over the top of the hero; once the page scrolls it gains a
 * dark, blurred backing so links stay legible over any section.
 *
 * Scroll state comes from an IntersectionObserver on a sentinel at the top of the
 * document — no scroll listeners, no per-frame work.
 */
export function SiteHeader() {
  const headerRef = useRef<HTMLElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const header = headerRef.current;
    const sentinel = sentinelRef.current;
    if (!header || !sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => (header.dataset.scrolled = String(!entry.isIntersecting)),
      { rootMargin: "24px 0px 0px 0px" }, // flips after ~24px of scroll
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div ref={sentinelRef} aria-hidden className="pointer-events-none absolute top-0 h-px w-px" />
      <header
        ref={headerRef}
        data-scrolled="false"
        className="site-header fixed inset-x-0 top-0 z-50 select-none"
      >
        <div className="mx-auto w-full max-w-[1440px] px-5 sm:px-8 lg:px-14">
          <div
            className="reveal flex h-20 items-center justify-between gap-6 text-[11px] uppercase tracking-[0.22em]"
            style={revealDelay(500)}
          >
            <a
              href="#top"
              data-scramble-trigger
              aria-label={`${site.name} — back to top`}
              className="logo flex items-baseline text-[15px] font-bold normal-case tracking-[-0.02em] text-matrix sm:text-base"
            >
              <ScrambleText text={site.name.toLowerCase()} />
              <span aria-hidden className="logo-caret">&gt;</span>
              <span aria-hidden className="logo-cursor" />
            </a>

            <nav aria-label="Primary">
              <ul className="flex gap-5 sm:gap-10">
                {site.nav.map((item, i) => (
                  <li key={item.href}>
                    <a
                      href={item.href}
                      data-scramble-trigger
                      className="text-matrix/60 transition-colors duration-200 hover:text-matrix"
                    >
                      <span aria-hidden className="mr-2 hidden text-matrix/35 sm:inline">
                        {(i + 1).toString(2).padStart(3, "0")}
                      </span>
                      <ScrambleText text={item.label} />
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
          <div aria-hidden className="reveal-line" style={revealDelay(300)} />
        </div>
      </header>
    </>
  );
}
