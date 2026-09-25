import { revealDelay as delay } from "@/app/_lib/reveal";
import { site } from "@/app/_lib/site";
import { ScrambleText } from "../hero/scramble-text";
import { InView } from "../in-view";

const CHOICES = [
  {
    label: "GitHub Repository",
    href: site.contact.github,
    tone: "choice-red",
    external: true,
  },
  {
    label: "LinkedIn Profile",
    href: site.contact.linkedin,
    tone: "choice-blue",
    external: true,
  },
  {
    label: "Email Me",
    href: `mailto:${site.contact.email}`,
    tone: "",
    external: false,
  },
] as const;

export function ContactSection() {
  return (
    <InView
      as="section"
      id="contact"
      aria-labelledby="contact-title"
      className="relative mx-auto w-full max-w-[1440px] px-5 py-24 sm:px-8 sm:py-32 lg:px-14"
    >
      <div aria-hidden className="reveal-line mb-16 sm:mb-24" />

      <div className="grid gap-12 md:grid-cols-12 md:items-center md:gap-8">
        <div className="md:col-span-7">
          <p
            data-scramble-trigger
            className="reveal mb-4 flex w-fit select-none gap-[1ch] text-[11px] uppercase tracking-[0.28em] text-matrix/60"
          >
            <span aria-hidden className="text-matrix/35">
              [011]
            </span>
            <ScrambleText text="Contact" />
          </p>
          <h2
            id="contact-title"
            data-scramble-trigger
            className="reveal w-fit select-none text-[clamp(2.5rem,7vw,5.5rem)] leading-[0.9] font-extrabold tracking-[-0.045em] text-matrix [text-shadow:0_0_0.4em_rgb(0_255_65/0.2)]"
            style={delay(120)}
          >
            <ScrambleText text="Let's connect" />
          </h2>
          <p
            data-scramble-trigger
            className="reveal mt-6 w-fit max-w-[44ch] select-none text-sm leading-6 text-matrix/60"
            style={delay(240)}
          >
            <ScrambleText text="I am currently looking for a Summer 2027 Software Engineering Internship. I would love to apply my problem solving skills here in Reno. I absolutely love programming, technology, and computers, and I would be grateful to apply my skills to build projects with a team!" />
          </p>
        </div>

        <ul className="flex flex-col gap-4 md:col-span-5 lg:col-span-4 lg:col-start-9">
          {CHOICES.map((choice, i) => (
            <li
              key={choice.label}
              className="reveal"
              style={delay(360 + i * 110)}
            >
              <a
                href={choice.href}
                {...(choice.external && {
                  target: "_blank",
                  rel: "noopener noreferrer",
                })}
                className={`btn btn-choice group w-full justify-between ${choice.tone}`}
              >
                {choice.label}
                <span
                  aria-hidden
                  className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                >
                  {choice.external ? "↗" : "→"}
                </span>
                {choice.external && (
                  <span className="sr-only">(opens in a new tab)</span>
                )}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </InView>
  );
}
