"use client";

import { useEffect, useRef } from "react";

interface Props extends React.HTMLAttributes<HTMLElement> {
  as?: "div" | "section" | "header";
  /** Fraction of the element that must be visible before it reveals. */
  threshold?: number;
}

/**
 * Sets `data-inview="true"` once the element scrolls into view (one-shot), which re-arms the
 * same `.reveal` / `.reveal-line` entrances the hero uses. See globals.css.
 */
export function InView({ as: Tag = "div", threshold = 0.2, ...props }: Props) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        el.dataset.inview = "true";
        observer.disconnect();
      },
      { threshold },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return <Tag ref={ref as React.Ref<HTMLDivElement>} data-inview="false" {...props} />;
}
