import { ContactSection } from "./_components/contact/contact-section";
import { Hero } from "./_components/hero/hero";
import { ProjectsSection } from "./_components/projects/projects-section";
import { SiteHeader } from "./_components/site-header";
import { WorkSection } from "./_components/work/work-section";
import { IntroProvider } from "./_components/intro/intro-provider";
import { site } from "./_lib/site";

export default function Home() {
  return (
    <IntroProvider name={site.name}>
      <SiteHeader />
      <Hero />
      <WorkSection />
      <ProjectsSection />
      <ContactSection />
    </IntroProvider>
  );
}
