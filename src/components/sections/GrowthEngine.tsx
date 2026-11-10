"use client";

import { useRef } from "react";
import { gsap, useGSAP, MM, ScrollTrigger } from "@/lib/gsap";
import { JOURNEY } from "@/lib/content";
import { Index } from "../ui";
import { scrollToTarget } from "../shell/SmoothScroll";

/**
 * 03 · From attention to growth — a journey along a ribbon.
 *
 * The section pins and its track scrolls sideways: one screen per chapter
 * (intro, seven chapters, finale). A black ribbon — thick where it turns,
 * thin where it flattens — waves through every screen and draws itself just
 * ahead of the view. Each chapter's copy sits in the open space above or
 * below the ribbon and rises into place as it arrives.
 *
 * Scrolling steps: whenever a scroll comes to rest inside the section, it
 * glides on to the next chapter in the direction of travel and settles there.
 *
 * The ribbon is generated for the measured track size (so its thickness never
 * stretches): a filled outline, revealed by a thick stroke along its centre
 * line used as a mask, which is what DrawSVG animates.
 */

const PANELS = JOURNEY.length + 2; // intro + chapters + finale
const LEAD = 0.85; // the ribbon's tip runs this far across the viewport
const STEP_DURATION = 0.15; // seconds to glide from one chapter to the next

type Pt = { x: number; y: number };

/**
 * Ribbon geometry for a track of `w` × `h` px, one wave crest/trough per panel.
 * On portrait screens (phones) a panel is too narrow for the full-height wave to
 * clear the copy, so the ribbon rides a calmer band along the bottom instead.
 */
function ribbon(w: number, h: number) {
  const panel = w / PANELS;
  const portrait = panel / h < 0.9;
  const mid = h * (portrait ? 0.85 : 0.52);
  const amp = h * (portrait ? 0.065 : 0.3);
  const tMin = portrait ? Math.max(6, h * 0.012) : Math.max(10, h * 0.022);
  const tMax = portrait ? Math.max(18, h * 0.04) : Math.max(34, h * 0.11);
  // Crest/trough at each panel centre, alternating; a slower harmonic keeps it organic.
  const theta = (x: number) => (Math.PI * (x - panel / 2)) / panel;
  const cy = (x: number) => mid - amp * Math.cos(theta(x)) * (1 - 0.1 * Math.sin(x / (panel * 2.7)));
  const steps = Math.ceil(w / 6);
  const centre: Pt[] = [];
  const top: Pt[] = [];
  const bot: Pt[] = [];
  for (let i = 0; i <= steps; i++) {
    const x = (i / steps) * w;
    const y = cy(x);
    const dy = (cy(x + 1) - cy(x - 1)) / 2;
    const len = Math.hypot(1, dy);
    const nx = -dy / len;
    const ny = 1 / len;
    // thick on the steep runs, thin across the flats (like a twisting ribbon)
    const t = tMin + (tMax - tMin) * Math.pow(Math.abs(Math.sin(theta(x))), 1.4);
    centre.push({ x, y });
    top.push({ x: x + (nx * t) / 2, y: y + (ny * t) / 2 });
    bot.push({ x: x - (nx * t) / 2, y: y - (ny * t) / 2 });
  }
  const f = (p: Pt) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
  return {
    shape: `M${top.map(f).join("L")}L${bot.reverse().map(f).join("L")}Z`,
    spine: `M${centre.map(f).join("L")}`,
    width: tMax * 1.6,
    portrait,
    /** Is the ribbon low (true) or high at the centre of panel i? */
    low: (i: number) => cy(panel * (i + 0.5)) > mid,
  };
}

/** A reveal mask with breathing room, so ascenders and descenders are never clipped. */
const Mask = ({ className = "", children }: { className?: string; children: React.ReactNode }) => (
  <span className={`-my-[0.2em] block overflow-hidden py-[0.2em] ${className}`}>{children}</span>
);

function Copy({ i, n, label, line, sub }: { i: number; n?: string; label: string; line: React.ReactNode; sub?: string }) {
  return (
    <div className="panel relative h-full shrink-0" style={{ width: `${100 / PANELS}%` }} data-i={i}>
      {/* centred in its screen, so each chapter comes to rest dead centre */}
      <div className="copy absolute inset-x-0 flex justify-center px-[8%]">
       <div className="flex flex-col gap-3 md:flex-row md:items-start md:gap-[3vw]">
        {/* the chapter number: large, faint, drifting slower than the copy */}
        <span
          aria-hidden
          className={`num shrink-0 font-[family-name:var(--font-plex)] text-[3.75rem] md:text-[clamp(4.5rem,11vw,11rem)] font-medium leading-[0.78] tracking-[-0.07em] text-text/[0.07] md:w-[1.35em] ${n ? "" : "hidden"}`}
        >
          {n ?? "00"}
        </span>
        <div className="min-w-0 md:pt-[0.4vw]">
          <Mask>
            <span className="ln hud block text-muted">{label}</span>
          </Mask>
          <Mask className="mt-5">
            <span className="ln display block max-w-[22ch] text-[clamp(1.55rem,2.9vw,2.9rem)] font-medium leading-[1.12] tracking-[-0.035em]">
              {line}
            </span>
          </Mask>
          {sub && (
            <Mask className="mt-4">
              <span className="ln block max-w-[42ch] text-[14.5px] leading-relaxed text-muted md:text-[15px]">{sub}</span>
            </Mask>
          )}
        </div>
       </div>
      </div>
    </div>
  );
}

export default function GrowthEngine() {
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const sec = root.current!;
      const tr = track.current!;
      const q = gsap.utils.selector(sec);
      const svg = q<SVGSVGElement>(".rb-svg")[0];
      const shape = q<SVGPathElement>(".rb-shape")[0];
      const spine = q<SVGPathElement>(".rb-spine")[0];
      const panels = q<HTMLElement>(".panel");

      // Build the ribbon for the current size and park each text block in the open space.
      const build = () => {
        const w = tr.scrollWidth;
        const h = tr.clientHeight;
        const r = ribbon(w, h);
        svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
        shape.setAttribute("d", r.shape);
        spine.setAttribute("d", r.spine);
        spine.setAttribute("stroke-width", String(r.width));
        panels.forEach((p, i) => {
          const c = p.querySelector<HTMLElement>(".copy")!;
          const low = r.portrait || r.low(i);
          c.style.top = low ? (r.portrait ? "21%" : "24%") : "";
          c.style.bottom = low ? "" : "12%";
        });
      };
      build();
      ScrollTrigger.addEventListener("refreshInit", build);

      let size = `${sec.clientWidth}x${sec.clientHeight}`;
      let to = 0;
      const ro = new ResizeObserver(() => {
        const next = `${sec.clientWidth}x${sec.clientHeight}`;
        if (next === size) return;
        size = next;
        clearTimeout(to);
        to = window.setTimeout(() => ScrollTrigger.refresh(), 150);
      });
      ro.observe(sec);

      const mm = gsap.matchMedia();
      mm.add(MM, (ctx) => {
        const { reduce } = ctx.conditions as Record<string, boolean>;
        const distance = () => tr.scrollWidth - window.innerWidth;
        const range = { trigger: sec, start: "top top", end: () => `+=${distance()}`, invalidateOnRefresh: true };

        // The journey: the track slides left as you scroll down.
        const ride = gsap.to(tr, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: { ...range, pin: true, scrub: reduce ? true : 0.8, anticipatePin: 1 },
        });

        if (reduce) {
          gsap.set(spine, { drawSVG: "100%" });
          return;
        }

        // One scroll, one chapter.
        const st = ride.scrollTrigger!;
        const chapterY = (idx: number) => st.start + (idx / (PANELS - 1)) * (st.end - st.start);
        const chapterAt = () => ((window.scrollY - st.start) / (st.end - st.start)) * (PANELS - 1);
        let gliding = false;
        const glideTo = (idx: number) => {
          gliding = true;
          scrollToTarget(chapterY(idx), STEP_DURATION, () => (gliding = false));
        };

        // Wheel: the first tick of a gesture starts the glide at once; the rest of
        // that gesture (including trackpad momentum) is swallowed, so one gesture
        // always moves exactly one chapter. Leaving the section scrolls normally.
        const GESTURE_GAP = 180; // ms of silence that separates two gestures
        let lastWheel = 0;
        const onWheel = (e: WheelEvent) => {
          const now = performance.now();
          const fresh = now - lastWheel > GESTURE_GAP;
          lastWheel = now;
          const y = window.scrollY;
          if (y < st.start - 2 || y > st.end + 2 || !e.deltaY) return;
          const dir = Math.sign(e.deltaY);
          const at = chapterAt();
          const next = dir > 0 ? Math.floor(at + 0.1) + 1 : Math.ceil(at - 0.1) - 1;
          if (!gliding && fresh && (next < 0 || next > PANELS - 1)) return; // exit the section
          e.preventDefault();
          e.stopImmediatePropagation(); // keep Lenis out of it
          if (gliding || !fresh) return;
          glideTo(gsap.utils.clamp(0, PANELS - 1, next));
        };
        window.addEventListener("wheel", onWheel, { capture: true, passive: false });

        // Touch, keys and the scrollbar: when the scroll comes to rest between
        // chapters, carry on to the next one in the direction of travel.
        const settleOnChapter = () => {
          if (gliding || !st.isActive) return;
          const at = chapterAt();
          const idx = gsap.utils.clamp(0, PANELS - 1, st.direction > 0 ? Math.ceil(at - 0.02) : Math.floor(at + 0.02));
          if (Math.abs(chapterY(idx) - window.scrollY) > 2) glideTo(idx);
        };
        ScrollTrigger.addEventListener("scrollEnd", settleOnChapter);

        // The ribbon draws just ahead of the view.
        gsap.fromTo(
          spine,
          { drawSVG: `0% ${((LEAD / PANELS) * 100).toFixed(2)}%` },
          { drawSVG: "0% 100%", ease: "none", scrollTrigger: { ...range, scrub: 0.8 } },
        );

        // Each panel's copy rises in as it slides into view (the intro is already there).
        panels.slice(1).forEach((p) => {
          gsap.fromTo(
            p.querySelectorAll(".ln"),
            { yPercent: 115 },
            {
              yPercent: 0,
              stagger: 0.12,
              ease: "power2.out",
              scrollTrigger: { trigger: p, containerAnimation: ride, start: "left 78%", end: "left 30%", scrub: 0.6 },
            },
          );
        });

        // The big numbers drift against the scroll for a touch of depth.
        panels.forEach((p) => {
          gsap.fromTo(
            p.querySelector(".num"),
            { xPercent: 35 },
            {
              xPercent: -35,
              ease: "none",
              scrollTrigger: { trigger: p, containerAnimation: ride, start: "left right", end: "right left", scrub: true },
            },
          );
        });

        return () => {
          window.removeEventListener("wheel", onWheel, { capture: true });
          ScrollTrigger.removeEventListener("scrollEnd", settleOnChapter);
        };
      });

      return () => {
        ScrollTrigger.removeEventListener("refreshInit", build);
        ro.disconnect();
        clearTimeout(to);
        mm.revert();
      };
    },
    { scope: root },
  );

  return (
    <section id="growth" ref={root} aria-labelledby="growth-title" data-theme="light" className="relative h-svh min-h-[520px] overflow-hidden">
      <h2 id="growth-title" className="sr-only">
        From attention to growth: your brand&rsquo;s journey
      </h2>
      <ol className="sr-only">
        {JOURNEY.map((j) => (
          <li key={j.area}>
            {j.area}: {j.line} {j.sub}
          </li>
        ))}
      </ol>

      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-10 mx-auto max-w-[1400px] px-4 pt-20 sm:px-8 md:pt-28">
        <Index n="03" label="From attention to growth" />
      </div>

      <div
        ref={track}
        aria-hidden
        className="relative flex h-full will-change-transform"
        style={{ width: `${PANELS * 100}vw` }}
      >
        <svg className="rb-svg pointer-events-none absolute inset-0 h-full w-full" preserveAspectRatio="none">
          <defs>
            <mask id="rb-mask" maskUnits="userSpaceOnUse">
              <path className="rb-spine" fill="none" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" />
            </mask>
          </defs>
          <path className="rb-shape" fill="var(--text)" mask="url(#rb-mask)" />
        </svg>

        <Copy i={0} label="Seven steps" line="From attention to growth." sub="Scroll to walk it with us." />
        {JOURNEY.map((j, k) => (
          <Copy key={j.area} i={k + 1} n={String(k + 1).padStart(2, "0")} label={j.area} line={j.line} sub={j.sub} />
        ))}
        <Copy i={PANELS - 1} label="Where it leads" line="Attention, turned into growth." sub="Seven steps, one direction, and it keeps going." />
      </div>
    </section>
  );
}
