"use client";

import { useEffect } from "react";
import { ScrollTrigger } from "@/lib/gsap";

/**
 * Scroll-scrubbed dark ⇄ light page background.
 *
 * Every top-level section declares `data-theme="dark" | "light"`. Sections have
 * no opaque background of their own; the page behind them is painted with
 * `--page-bg`, a mix of ink and porcelain driven by `--m` (0 = dark, 1 = light).
 *
 * Where two neighbouring sections differ, `--m` eases across a zone that starts
 * as the boundary enters the bottom of the viewport and ends once it is in the
 * upper third, so the whole screen changes colour with the scroll instead of
 * showing a seam. One trigger computes `--m` from the scroll position, so fast
 * jumps (anchors, scrollbar drags) always land on the right colour.
 *
 * Fixed chrome (nav, mobile bar) flips its own `data-theme` at the midpoint and
 * cross-fades with CSS transitions.
 */

type Zone = { start: number; end: number; from: number; to: number };

const ZONE_START = 0.88; // boundary at 88% of the viewport height…
const ZONE_END = 0.32; // …to 32%
const ease = (t: number) => t * t * t * (t * (t * 6 - 15) + 10); // smootherstep

export default function ThemeFlow() {
  useEffect(() => {
    const html = document.documentElement;
    const chrome = () => document.querySelectorAll<HTMLElement>("[data-theme-follow]");
    let zones: Zone[] = [];
    let base = 0;
    let lastM = -1;
    let lastTheme = "";

    const docTop = (el: HTMLElement) => {
      // pinned sections are measured by their spacer, which stays in flow
      const box = el.parentElement?.classList.contains("pin-spacer") ? el.parentElement : el;
      return box.getBoundingClientRect().top + window.scrollY;
    };

    const measure = () => {
      const secs = Array.from(document.querySelectorAll<HTMLElement>("main section[data-theme]"));
      const vh = window.innerHeight;
      const val = (el: HTMLElement) => (el.dataset.theme === "light" ? 1 : 0);
      base = secs.length ? val(secs[0]) : 0;
      zones = [];
      for (let i = 1; i < secs.length; i++) {
        const from = val(secs[i - 1]);
        const to = val(secs[i]);
        if (from === to) continue;
        const b = docTop(secs[i]);
        zones.push({ start: b - vh * ZONE_START, end: b - vh * ZONE_END, from, to });
      }
      apply();
    };

    const apply = () => {
      const y = window.scrollY;
      let m = base;
      for (const z of zones) {
        if (y <= z.start) break;
        const t = Math.min(1, (y - z.start) / (z.end - z.start));
        m = z.from + (z.to - z.from) * ease(t);
        if (t < 1) break;
      }
      if (Math.abs(m - lastM) > 0.0005) {
        lastM = m;
        html.style.setProperty("--m", m.toFixed(4));
      }
      const theme = m > 0.5 ? "light" : "dark";
      if (theme !== lastTheme) {
        lastTheme = theme;
        html.dataset.page = theme;
        chrome().forEach((el) => (el.dataset.theme = theme));
      }
    };

    const st = ScrollTrigger.create({ start: 0, end: "max", onUpdate: apply });
    ScrollTrigger.addEventListener("refresh", measure);
    measure();

    return () => {
      st.kill();
      ScrollTrigger.removeEventListener("refresh", measure);
      html.style.removeProperty("--m");
    };
  }, []);

  return null;
}
