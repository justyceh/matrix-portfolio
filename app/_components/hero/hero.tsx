import { revealDelay as delay } from "@/app/_lib/reveal";
import { site } from "@/app/_lib/site";
import { AmbientRain } from "./ambient-rain";
import { HeroName } from "./hero-name";
import { ScrambleText } from "./scramble-text";

const toBinary = (s: string) =>
  Array.from(s.toUpperCase(), (c) => c.charCodeAt(0).toString(2).padStart(8, "0")).join(" ");

export function Hero() {
  return (
    <main id="top" className="relative isolate flex min-h-svh select-none flex-col overflow-hidden">
      <AmbientRain />
      <div aria-hidden className="hero-backdrop" />

      <div className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col px-5 sm:px-8 lg:px-14">
        {/* Room for the fixed site header (and its rule) */}
        <div aria-hidden className="h-[81px] shrink-0" />

        {/* ---------- Title block ---------- */}
        <section
          aria-labelledby="hero-title"
          className="flex flex-1 flex-col justify-center py-16 sm:py-24"
        >
          <p
            data-scramble-trigger
            className="reveal relative z-10 mb-5 w-fit text-sm text-matrix/60 sm:mb-7 sm:text-base"
            style={delay(700)}
          >
            <ScrambleText text="~/portfolio" className="text-matrix/35" />{" "}
            <span className="text-matrix">$</span> <ScrambleText text="whoami" />
            <span aria-hidden className="prompt-cursor" />
          </p>

          <h1
            id="hero-title"
            className="reveal hero-name relative -ml-[0.05em] text-[clamp(3.75rem,21vw,14rem)] leading-[0.82] font-extrabold tracking-[-0.05em]"
          >
            <span className="sr-only">{site.name}</span>
            <HeroName text={site.name.toUpperCase()} />
          </h1>

          <div className="mt-12 grid gap-10 sm:mt-16 md:grid-cols-12 md:items-end">
            <div className="md:col-span-7 lg:col-span-6">
              <p
                data-scramble-trigger
                className="reveal mb-4 flex gap-[1ch] text-[11px] leading-5 uppercase tracking-[0.28em] text-matrix-hot"
                style={delay(1100)}
              >
                <span aria-hidden className="shrink-0 text-matrix/40">{"//"}</span>
                <span>
                  <ScrambleText text={site.role} />
                </span>
              </p>
              <p
                data-scramble-trigger
                className="reveal max-w-[44ch] text-base leading-7 text-matrix/70 sm:text-lg sm:leading-8"
                style={delay(1250)}
              >
                <ScrambleText text={site.tagline} />
              </p>
            </div>

            <div
              className="reveal flex flex-wrap gap-3 md:col-span-5 md:justify-end lg:col-span-6"
              style={delay(1400)}
            >
              <a href="#projects" className="btn btn-primary group">
                Projects
                <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-1">
                  →
                </span>
              </a>
              <a href={site.resume} download className="btn btn-ghost group">
                Resume
                <span aria-hidden className="transition-transform duration-300 group-hover:translate-y-0.5">
                  ↓
                </span>
              </a>
            </div>
          </div>
        </section>

        <div aria-hidden className="reveal-line" style={delay(500)} />

        {/* ---------- Status bar ---------- */}
        <footer
          className="reveal flex h-16 items-center justify-between gap-6 text-[11px] uppercase tracking-[0.22em] text-matrix/45"
          style={delay(1600)}
        >
          <p
            aria-hidden
            data-scramble-trigger
            className="hidden truncate normal-case tracking-[0.16em] lg:block"
          >
            <ScrambleText text={toBinary(site.name)} />
          </p>
          <a
            href="#work"
            data-scramble-trigger
            className="ml-auto shrink-0 transition-colors duration-200 hover:text-matrix"
          >
            <ScrambleText text="Scroll" /> <span aria-hidden>↓</span>
          </a>
        </footer>
      </div>
    </main>
  );
}
