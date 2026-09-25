import { revealDelay as delay } from "@/app/_lib/reveal";
import { site } from "@/app/_lib/site";
import { ScrambleText } from "../hero/scramble-text";
import { InView } from "../in-view";
import { formatRange } from "./format";
import { WorkTerminal } from "./work-terminal";

export function WorkSection() {
  return (
    <InView
      as="section"
      id="work"
      aria-labelledby="work-title"
      className="relative mx-auto w-full max-w-[1440px] px-5 py-24 sm:px-8 sm:py-32 lg:px-14"
    >
      <div className="mb-10 grid gap-6 sm:mb-14 md:grid-cols-12 md:items-end">
        <div className="md:col-span-7">
          <p
            data-scramble-trigger
            className="reveal mb-4 flex w-fit select-none gap-[1ch] text-[11px] uppercase tracking-[0.28em] text-matrix/60"
          >
            <span aria-hidden className="text-matrix/35">[001]</span>
            <ScrambleText text="Work" />
          </p>
          <h2
            id="work-title"
            data-scramble-trigger
            className="reveal w-fit select-none text-[clamp(2.5rem,7vw,5.5rem)] leading-[0.9] font-extrabold tracking-[-0.045em] text-matrix [text-shadow:0_0_0.4em_rgb(0_255_65/0.2)]"
            style={delay(120)}
          >
            <ScrambleText text="Experience" />
          </h2>
        </div>
        <p
          data-scramble-trigger
          className="reveal w-fit max-w-[38ch] select-none text-sm leading-6 text-matrix/60 md:col-span-5 md:justify-self-end md:text-right"
          style={delay(240)}
        >
          <ScrambleText text="Where I've shipped code." />
        </p>
      </div>

      <div className="reveal" style={delay(360)}>
        <WorkTerminal jobs={site.work} />
      </div>

      {/* The terminal is decorative theatre; this is the real content for AT and crawlers. */}
      <ol className="sr-only">
        {site.work.map((job) => (
          <li key={job.slug}>
            {job.role} at {job.company}, {job.location}. {formatRange(job.start, job.end)}.{" "}
            {job.summary} Stack: {job.stack.join(", ")}.
          </li>
        ))}
      </ol>
    </InView>
  );
}
