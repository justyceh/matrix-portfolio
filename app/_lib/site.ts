/**
 * Single source of truth for personal copy. Edit here, not in components.
 */

export interface Job {
  /** Directory name shown in the terminal's `ls` (lowercase, no spaces). */
  slug: string;
  company: string;
  role: string;
  location: string;
  /** "YYYY-MM" */
  start: string;
  /** "YYYY-MM", or "present" */
  end: string;
  summary: string;
  stack: readonly string[];
}

export interface Project {
  title: string;
  subtitle: string;
  /** Served from /public. */
  image: string;
  /** Live site or source repo; the whole card links here. */
  href: string;
  /** "contain" for logos that shouldn't be cropped; screenshots and photos fill the frame. */
  fit?: "cover" | "contain";
}

export const site = {
  name: "Justyce",
  role: "Computer Science & Engineering Student",
  tagline: "Software Engineer Intern specialized in Web Development, C++ and Embedded Systems",
  /** Served from /public. Drop the PDF at public/resume.pdf. */
  resume: "/resume.pdf",
  nav: [
    { label: "Work", href: "#work" },
    { label: "Projects", href: "#projects" },
    { label: "Contact", href: "#contact" },
  ],
  contact: {
    github: "https://github.com/justyceh",
    linkedin: "https://www.linkedin.com/in/justycehickman",
    email: "justycebusinessh@gmail.com",
  },
  // Newest first.
  work: [
    {
      slug: "creamai",
      company: "CreamAI",
      role: "Software Engineer Intern",
      location: "Remote",
      start: "2026-09",
      end: "present",
      summary:
        "Maintain and improve a large production codebase through bug fixes, feature repairs, code cleanup, and collaborative pull requests.",
      stack: ["TypeScript", "React", "Firebase"],
    },
    {
      slug: "checklocalfirst",
      company: "CheckLocalFirst",
      role: "Software Engineer Intern",
      location: "Reno, NV",
      start: "2026-05",
      end: "2026-08",
      summary:
        "Designed relational database schemas and SQL migrations supporting real users, businesses, services, and searching.",
      stack: ["TypeScript", "React", "Supabase"],
    },
  ] satisfies Job[],
  projects: [
    {
      title: "Computer Science Club Website",
      subtitle:
        "Developed a new website for my club utilizing HTML, CSS, and JavaScript to add interactivity to the page with elements like image sliders, hover effects, and a responsive design.",
      image: "/acmlogo.png",
      href: "https://awesome.cse.unr.edu/index.html",
      fit: "contain",
    },
    {
      title: "CheckLocalFirst Reno Directory",
      subtitle:
        "Designed the frontend and backend for a local business directory site in Reno, using PostgreSQL, Supabase, and React.",
      image: "/checklocalfirst.png",
      href: "https://www.checklocalfirst.com/",
    },
    {
      title: "Hibachi Food Truck",
      subtitle:
        "Built a mobile-first website to pitch to a local hibachi food truck utilizing a video as the hero section, and an LA theme to match the food truck.",
      image: "/sonshibachilogo.png",
      href: "https://sonshibachi.vercel.app/",
    },
    {
      title: "Acai Bowl Website",
      subtitle:
        "Designed a mobile-first website for a local juice business, utilized React and Tailwind CSS, and implemented the full frontend and backend flow of a catering request form, dealing with CORS errors along the way.",
      image: "/morning-glorylogo.png",
      href: "https://morning-glory-xxxx.vercel.app/",
    },
    {
      title: "Embedded Water Cooler System",
      subtitle:
        "Analyzed the Arduino Mega 2560 ATmega datasheet to understand its architecture and pin layout, and built a fully functioning water cooling system using various components and direct register manipulation using bits and C++.",
      image: "/watercooler.jpg",
      href: "https://github.com/1103-islam-md/CPE301_Final_Project",
    },
    {
      title: "LockIn",
      subtitle:
        "Pomodoro focus timer with custom tasks and breaks. Designed a simple, easy-to-use interface with React and Tailwind CSS, utilizing JavaScript for the timer functions and local web storage to save settings.",
      image: "/pomodoro.png",
      href: "https://pomodoro-zeta-livid.vercel.app/",
    },
    {
      title: "Phaser.js Web Game",
      subtitle:
        "Learned the Phaser.js library to build a 2D pixel-art browser game for my 4-year anniversary with my girlfriend, featuring top-down movement and object interaction.",
      image: "/4years.png",
      href: "https://github.com/justyceh/4yearanniversary",
    },
    {
      title: "C++ Password Manager",
      subtitle:
        "Utilized OOP principles to build a database class that uses OpenSSL for hashing and decryption, and handles all CRUD operations for managing your passwords.",
      image: "/passwordm.png",
      href: "https://github.com/justyceh/Password-Manager",
    },
  ] satisfies Project[],
} as const;
