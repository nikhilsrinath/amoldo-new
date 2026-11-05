"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { TextPlugin } from "gsap/TextPlugin";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin, MotionPathPlugin, TextPlugin, useGSAP);
}

export { gsap, ScrollTrigger, useGSAP };

/** Media-query conditions shared by every scene. */
export const MM = {
  desktop: "(min-width: 768px) and (prefers-reduced-motion: no-preference)",
  mobile: "(max-width: 767px) and (prefers-reduced-motion: no-preference)",
  reduce: "(prefers-reduced-motion: reduce)",
};

export type MMConditions = { desktop?: boolean; mobile?: boolean; reduce?: boolean };

/**
 * A pinned, scroll-scrubbed scene timeline. In reduced-motion mode the
 * caller's timeline is jumped to its final frame instead (see `settle`).
 */
export function sceneTimeline(
  trigger: Element,
  {
    end = "+=250%",
    pin = true,
    scrub = 0.8,
    reduce = false,
    start = "top top",
  }: { end?: string; pin?: boolean | Element; scrub?: number; reduce?: boolean; start?: string } = {},
) {
  return gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: reduce
      ? undefined
      : { trigger, start, end, pin, scrub, anticipatePin: 1, invalidateOnRefresh: true },
  });
}

/**
 * Parallax for every `[data-speed]` element inside `scope`.
 * speed 1 = normal scroll; < 1 lags behind (background), > 1 moves ahead (foreground).
 */
export function parallax(scope: Element, reduce?: boolean, mobile?: boolean) {
  if (reduce) return;
  scope.querySelectorAll<HTMLElement>("[data-speed]").forEach((el) => {
    // On phones the layout stacks; differing speeds would make the gaps uneven.
    if (mobile && el.hasAttribute("data-speed-desktop")) return;
    const speed = parseFloat(el.dataset.speed || "1");
    const dist = (1 - speed) * 240;
    gsap.fromTo(
      el,
      { y: -dist / 2 },
      {
        y: dist / 2,
        ease: "none",
        scrollTrigger: { trigger: el.parentElement ?? el, start: "top bottom", end: "bottom top", scrub: true },
      },
    );
  });
}

/** Show the final frame statically (reduced motion). */
export function settle(tl: gsap.core.Timeline, reduce?: boolean) {
  if (reduce) tl.progress(1).pause();
  return tl;
}
