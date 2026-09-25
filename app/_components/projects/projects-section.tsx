import Image from "next/image";
import { revealDelay as delay } from "@/app/_lib/reveal";
import { site, type Project } from "@/app/_lib/site";
import { ScrambleText } from "../hero/scramble-text";
import { InView } from "../in-view";

/**
 * Column spans for a 2 / 3 / 3 rhythm on large screens (8 cards); on tablets they pair up.
 * Cards past the list fall back to thirds.
 */
const SPANS = [
  "lg:col-span-6",
  "lg:col-span-6",
  "lg:col-span-4",
  "lg:col-span-4",
  "lg:col-span-4",
  "lg:col-span-4",
  "lg:col-span-4",
  "lg:col-span-4",
];

/** "https://github.com/a/b/" → "github.com/a/b" */
const displayUrl = (href: string) =>
  href.replace(/^https?:\/\/(www\.)?/, "").replace(/\/(index\.html)?$/, "");

function ProjectCard({ project, index }: { project: Project; index: number }) {
  const wide = SPANS[index]?.includes("col-span-6");
  return (
    <InView threshold={0.15} className="h-full">
      <a
        href={project.href}
        target="_blank"
        rel="noopener noreferrer"
        data-scramble-trigger
        className="reveal group relative flex h-full flex-col border border-matrix/20 bg-[#010602] transition-colors duration-300 hover:border-matrix/60"
        style={delay((index % 3) * 90)}
      >
        <div className="relative aspect-[16/10] overflow-hidden border-b border-matrix/15 bg-black">
          <Image
            src={project.image}
            alt=""
            fill
            sizes={
              wide
                ? "(min-width: 640px) 50vw, 100vw"
                : "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            }
            className={`${
              project.fit === "contain" ? "object-contain p-8" : "object-cover"
            } transition duration-500 ease-out group-hover:scale-[1.03]`}
          />
        </div>

        <div className="flex flex-1 flex-col p-5 sm:p-6">
          <h3 className="select-none text-xl font-bold tracking-[-0.02em] text-matrix-hot [text-shadow:0_0_0.5em_rgb(0_255_65/0.3)] sm:text-2xl">
            <ScrambleText text={project.title} />
          </h3>
          <p className="mt-2 text-sm leading-6 text-matrix/60">{project.subtitle}</p>
          <p className="mt-auto flex items-center gap-[1ch] pt-5 text-xs tracking-[0.04em] text-matrix/45 transition-colors duration-300 group-hover:text-matrix">
            <span className="truncate">{displayUrl(project.href)}</span>
            <span aria-hidden className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5">
              ↗
            </span>
            <span className="sr-only">(opens in a new tab)</span>
          </p>
        </div>
      </a>
    </InView>
  );
}

export function ProjectsSection() {
  return (
    <section
      id="projects"
      aria-labelledby="projects-title"
      className="relative mx-auto w-full max-w-[1440px] px-5 py-24 sm:px-8 sm:py-32 lg:px-14"
    >
      <InView className="mb-10 grid gap-6 sm:mb-14 md:grid-cols-12 md:items-end">
        <div className="md:col-span-7">
          <p
            data-scramble-trigger
            className="reveal mb-4 flex w-fit select-none gap-[1ch] text-[11px] uppercase tracking-[0.28em] text-matrix/60"
          >
            <span aria-hidden className="text-matrix/35">[010]</span>
            <ScrambleText text="Projects" />
          </p>
          <h2
            id="projects-title"
            data-scramble-trigger
            className="reveal w-fit select-none text-[clamp(2.5rem,7vw,5.5rem)] leading-[0.9] font-extrabold tracking-[-0.045em] text-matrix [text-shadow:0_0_0.4em_rgb(0_255_65/0.2)]"
            style={delay(120)}
          >
            <ScrambleText text="Things I've built" />
          </h2>
        </div>
        <p
          data-scramble-trigger
          className="reveal w-fit max-w-[38ch] select-none text-sm leading-6 text-matrix/60 md:col-span-5 md:justify-self-end md:text-right"
          style={delay(240)}
        >
          <ScrambleText text="Sites, apps, games and hardware." />
        </p>
      </InView>

      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-12 lg:gap-6">
        {site.projects.map((project, i) => (
          <li key={project.title} className={`min-w-0 ${SPANS[i] ?? "lg:col-span-4"}`}>
            <ProjectCard project={project} index={i} />
          </li>
        ))}
      </ul>
    </section>
  );
}
