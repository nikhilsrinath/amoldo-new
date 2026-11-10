"use client";

import { useRef } from "react";
import { gsap, useGSAP, ScrollTrigger } from "@/lib/gsap";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import { SERVICES } from "@/lib/content";
import { Index } from "../ui";
import { SERVICE_DEMOS } from "./ServiceDemos";
import { scrollToTarget } from "../shell/SmoothScroll";

if (typeof window !== "undefined") gsap.registerPlugin(ScrambleTextPlugin);

/**
 * 04 · Services — the colony's trail.
 *
 * No pinning: the page scrolls normally. On the left, the nine services sit on
 * a trail; a black ant walks it to whichever service crosses the middle of the
 * screen, and that title fills with ink. On the right, a sticky panel plays a
 * live demo of the active service — the work itself, not an icon of it — and
 * swaps with a clip reveal led by a black edge.
 *
 * Mobile: same trail and ant; each service carries its own demo, which only
 * plays while it is on screen. Reduced motion: still frames, no walking.
 */

// `sm` is never read; it just guarantees one condition always matches, or matchMedia skips the callback.
const COND = { md: "(min-width: 768px)", sm: "(max-width: 767px)", reduce: "(prefers-reduced-motion: reduce)" };

function Ant() {
  // Drawn facing up; rotated to face the direction of travel.
  const legs = [-1, 1].flatMap((s) =>
    [
      { y: 15, a: -40 },
      { y: 19, a: 0 },
      { y: 23, a: 40 },
    ].map((l, k) => ({ ...l, s, k })),
  );
  return (
    <svg viewBox="0 0 24 36" className="h-9 w-6 overflow-visible drop-shadow-[0_2px_6px_rgba(0,0,0,0.25)]" aria-hidden>
      <g stroke="var(--accent)" strokeWidth="1.3" strokeLinecap="round" fill="none">
        <path className="antenna" d="M10.5 6.5 7 1.5M13.5 6.5 17 1.5" />
        {legs.map(({ y, a, s, k }) => (
          <g key={`${s}${k}`} className={`leg leg-${(k + (s > 0 ? 1 : 0)) % 2 ? "a" : "b"}`} style={{ transformOrigin: `12px ${y}px` }}>
            <path d={`M12 ${y} l${s * 7} ${a / 8 - 2} l${s * 3} ${a / 6 + 3}`} transform={`rotate(${s * a * 0.25} 12 ${y})`} />
          </g>
        ))}
      </g>
      <g fill="var(--accent)">
        <ellipse cx="12" cy="8.5" rx="3.2" ry="3" />
        <ellipse cx="12" cy="17" rx="2.4" ry="4.2" />
        <ellipse cx="12" cy="28" rx="4.6" ry="6.4" />
      </g>
    </svg>
  );
}

export default function Services() {
  const root = useRef<HTMLElement>(null);
  const jumpTo = useRef<(i: number) => void>(() => {});

  useGSAP(
    () => {
      const sec = root.current!;
      const q = gsap.utils.selector(sec);
      const mm = gsap.matchMedia();

      mm.add(COND, (ctx) => {
        const { md, reduce } = ctx.conditions as Record<string, boolean>;
        const list = q<HTMLElement>(".svc-list")[0];
        const rows = q<HTMLElement>(".svc-row");
        const ant = q<HTMLElement>(".svc-ant")[0];
        const fill = q<HTMLElement>(".svc-trail-fill")[0];
        const holders = q<HTMLElement>(md ? ".stage-demo .demo" : ".row-demo .demo");
        const builds = holders.map((h, i) => SERVICE_DEMOS[i].build(h));
        if (reduce) builds.forEach((b) => b.seek("rest").pause());

        /* ── the ant ── */
        const legsA = ant.querySelectorAll(".leg-a");
        const legsB = ant.querySelectorAll(".leg-b");
        const gait = reduce
          ? null
          : gsap
              .timeline({ paused: true, repeat: -1, defaults: { duration: 0.09, ease: "sine.inOut" } })
              .to(legsA, { rotation: 18 })
              .to(legsB, { rotation: -18 }, 0)
              .to(legsA, { rotation: -18 })
              .to(legsB, { rotation: 18 }, "<")
              .to(ant.querySelectorAll(".antenna"), { rotation: 6, transformOrigin: "12px 7px", yoyo: true, repeat: 1, duration: 0.09 }, 0);

        const antY = (i: number) => {
          const t = rows[i].querySelector<HTMLElement>(".svc-title")!;
          return rows[i].offsetTop + t.offsetTop + Math.min(t.offsetHeight, 64) / 2;
        };
        let walk: gsap.core.Timeline | null = null;
        const walkTo = (i: number, instant = false) => {
          const y = antY(i);
          const from = gsap.getProperty(ant, "y") as number;
          const dist = Math.abs(y - from);
          const fillTo = y / list.offsetHeight;
          walk?.kill();
          if (instant || reduce) {
            gsap.set(ant, { y, rotation: 180 });
            gsap.set(fill, { scaleY: fillTo });
            return;
          }
          const dur = gsap.utils.clamp(0.55, 1.5, dist / 650);
          walk = gsap
            .timeline({ onStart: () => void gait?.play(), onComplete: () => void gait?.pause() })
            .to(ant, { rotation: y >= from ? 180 : 0, duration: 0.25, ease: "power2.out" }, 0)
            .to(ant, { y, duration: dur, ease: "power2.inOut" }, 0.08)
            .to(fill, { scaleY: fillTo, duration: dur, ease: "power2.inOut" }, 0.08)
            .to(ant, { rotation: 180, duration: 0.3, ease: "power2.out" }, ">-0.05");
        };

        /* ── desktop stage ── */
        const demos = q<HTMLElement>(".stage-demo");
        const edge = q<HTMLElement>(".stage-edge")[0];
        const label = q<HTMLElement>(".stage-label")[0];
        const ticks = q<HTMLElement>(".stage-tick");
        if (md) gsap.set(demos, { autoAlpha: 0 });

        let active = -1;
        let swap: gsap.core.Timeline | null = null;
        const setActive = (i: number, instant = false) => {
          if (i === active) return;
          const prev = active;
          active = i;
          rows.forEach((r, k) => r.classList.toggle("is-active", k === i));
          walkTo(i, instant);

          // tags settle in on the active row
          if (!reduce && !instant) {
            gsap.fromTo(rows[i].querySelectorAll(".svc-tag"), { y: 8, autoAlpha: 0.2 }, { y: 0, autoAlpha: 1, stagger: 0.05, duration: 0.5, ease: "power3.out", overwrite: true });
          }
          if (!md) return;

          ticks.forEach((t, k) => t.classList.toggle("is-active", k === i));
          if (prev > -1 && !reduce) builds[prev].pause();
          swap?.progress(1).kill();
          if (reduce || instant) {
            if (prev > -1) gsap.set(demos[prev], { autoAlpha: 0 });
            gsap.set(demos[i], { autoAlpha: 1, clipPath: "none" });
            label.textContent = SERVICES[i].title;
            if (!reduce) builds[i].restart();
            return;
          }
          swap = gsap.timeline();
          if (prev > -1) swap.to(demos[prev], { autoAlpha: 0, y: -28, scale: 0.97, filter: "blur(4px)", duration: 0.4, ease: "power2.in" }, 0);
          swap
            .fromTo(demos[i], { autoAlpha: 1, y: 0, scale: 1, filter: "blur(0px)", clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.8, ease: "expo.inOut" }, 0.12)
            .fromTo(edge, { top: "100%", autoAlpha: 1 }, { top: "0%", duration: 0.8, ease: "expo.inOut" }, 0.12)
            .to(edge, { autoAlpha: 0, duration: 0.25 }, ">-0.1")
            .to(label, { duration: 0.7, scrambleText: { text: SERVICES[i].title, chars: "01<>/#*+", speed: 0.6 } }, 0.1)
            .add(() => builds[i].restart(), 0.35);
        };

        /* ── which service is on stage ── */
        rows.forEach((r, i) => {
          ScrollTrigger.create({
            trigger: r,
            start: "top 55%",
            end: "bottom 55%",
            onToggle: (s) => s.isActive && setActive(i),
          });
        });
        setActive(0, true);
        if (md && !reduce) builds[0].pause(0);

        // Desktop demos only run while the section is on screen; mobile demos while their card is.
        if (!reduce) {
          if (md) {
            ScrollTrigger.create({
              trigger: sec,
              start: "top 70%",
              end: "bottom top",
              onToggle: (s) => (s.isActive ? builds[active]?.play() : builds[active]?.pause()),
            });
          } else {
            holders.forEach((h, i) =>
              ScrollTrigger.create({
                trigger: h,
                start: "top 90%",
                end: "bottom 10%",
                onToggle: (s) => (s.isActive ? builds[i].restart() : builds[i].pause()),
              }),
            );
          }
        }

        // Short screens: shrink a demo to fit its stage rather than clip it.
        const fit = () => {
          if (!md) return;
          demos.forEach((d) => {
            const h = d.querySelector<HTMLElement>(".demo")!;
            const cs = getComputedStyle(d);
            const avail = d.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
            gsap.set(h, { scale: Math.min(1, avail / h.offsetHeight), transformOrigin: "50% 50%" });
          });
        };
        fit();

        // Keep the ant on its row (and demos fitted) when layout shifts (fonts, resize)
        const onRefresh = () => {
          fit();
          if (active > -1) walkTo(active, true);
        };
        ScrollTrigger.addEventListener("refresh", onRefresh);

        jumpTo.current = (i: number) => {
          const r = rows[i].getBoundingClientRect();
          scrollToTarget(window.scrollY + r.top - window.innerHeight * 0.32);
        };

        /* ── pointer tilt on the stage ── */
        const panel = q<HTMLElement>(".stage-panel")[0];
        let off = () => {};
        if (md && !reduce && panel) {
          const rx = gsap.quickTo(panel, "rotationX", { duration: 0.9, ease: "power3" });
          const ry = gsap.quickTo(panel, "rotationY", { duration: 0.9, ease: "power3" });
          const move = (e: PointerEvent) => {
            const b = panel.getBoundingClientRect();
            const nx = gsap.utils.clamp(-1, 1, ((e.clientX - b.left) / b.width) * 2 - 1);
            const ny = gsap.utils.clamp(-1, 1, ((e.clientY - b.top) / b.height) * 2 - 1);
            panel.style.setProperty("--mx", `${((e.clientX - b.left) / b.width) * 100}%`);
            panel.style.setProperty("--my", `${((e.clientY - b.top) / b.height) * 100}%`);
            ry(nx * 4);
            rx(-ny * 3);
          };
          const leave = () => (rx(0), ry(0));
          panel.addEventListener("pointermove", move);
          panel.addEventListener("pointerleave", leave);
          off = () => {
            panel.removeEventListener("pointermove", move);
            panel.removeEventListener("pointerleave", leave);
          };
        }

        return () => {
          off();
          ScrollTrigger.removeEventListener("refresh", onRefresh);
          builds.forEach((b) => b.kill());
          gait?.kill();
          walk?.kill();
          swap?.kill();
          rows.forEach((r) => r.classList.remove("is-active"));
        };
      });
    },
    { scope: root },
  );

  return (
    <section id="services" data-theme="light" ref={root} aria-labelledby="services-title" className="relative overflow-x-clip pb-24 pt-24 md:pb-[18vh] md:pt-32">
      <div className="pointer-events-none absolute inset-0 dot-grid opacity-25 [mask-image:linear-gradient(to_bottom,transparent,#000_15%,#000_85%,transparent)]" aria-hidden />

      <div className="relative mx-auto max-w-[1400px] px-4 sm:px-8">
        <Index n="04" label="Services" />
        <div className="mt-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <h2 id="services-title" className="display max-w-[14ch] text-[clamp(2.2rem,5vw,4.6rem)]">
            Nine ways we grow your brand.
          </h2>
          <p className="max-w-sm text-[15px] leading-relaxed text-muted md:pb-2">
            Follow the ant. Each service plays out live, so you can see the work, not just the name of it.
          </p>
        </div>

        <div className="mt-14 grid gap-16 md:mt-20 md:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-24">
          {/* The trail */}
          <div className="svc-list relative pl-10 sm:pl-14">
            <div aria-hidden className="absolute bottom-0 left-[11px] top-0 w-px bg-[repeating-linear-gradient(to_bottom,rgba(0,0,0,0.16)_0_4px,transparent_4px_10px)] sm:left-[19px]">
              <div className="svc-trail-fill absolute inset-0 origin-top scale-y-0 bg-[repeating-linear-gradient(to_bottom,var(--accent)_0_4px,transparent_4px_10px)]" />
            </div>
            <div aria-hidden className="svc-ant pointer-events-none absolute left-[12px] top-0 z-10 -ml-3 -mt-[18px] sm:left-[20px]">
              <Ant />
            </div>

            {SERVICES.map((s, i) => (
              <article key={s.title} aria-labelledby={`svc-${i}`} className="svc-row group relative py-10 md:min-h-[44vh] md:py-[7vh]">
                <h3 id={`svc-${i}`} className="svc-title display text-[clamp(1.75rem,3.3vw,3.1rem)]">
                  <button type="button" onClick={() => jumpTo.current(i)} className="text-left outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-4 focus-visible:ring-offset-bg" data-hot>
                    <span className="ink">{s.title}</span>
                  </button>
                </h3>
                <p className="mt-4 max-w-md text-[16px] leading-relaxed text-muted transition-opacity duration-500 md:text-[17px] md:opacity-50 md:group-[.is-active]:opacity-100">
                  {s.line}
                </p>
                <ul className="mt-5 flex max-w-md flex-wrap gap-2" aria-label={`${s.title} covers`}>
                  {s.tags.map((t) => (
                    <li
                      key={t}
                      className="svc-tag rounded-full border border-white/10 px-3 py-1.5 font-mono text-[11.5px] text-text/70 transition-colors duration-500 group-[.is-active]:border-accent/40 group-[.is-active]:text-text"
                    >
                      {t}
                    </li>
                  ))}
                </ul>

                {/* Mobile: the demo travels with its service */}
                <div aria-hidden className="row-demo mt-7 overflow-hidden rounded-3xl border border-white/[0.08] bg-bg-2/80 p-5 md:hidden">
                  <div className="demo mx-auto w-full max-w-[440px]">{SERVICE_DEMOS[i].node}</div>
                </div>
              </article>
            ))}
          </div>

          {/* The stage (desktop) */}
          <div className="hidden md:block">
            <div className="sticky top-[13vh] h-[74vh] min-h-[480px] [perspective:1600px]">
              <div className="stage-panel relative flex h-full flex-col overflow-hidden rounded-[28px] border border-white/[0.08] bg-bg-2/80 [--mx:50%] [--my:30%] [transform-style:preserve-3d]">
                <div aria-hidden className="pointer-events-none absolute inset-0 dot-grid opacity-50" />
                <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(480px_circle_at_var(--mx)_var(--my),rgba(0,0,0,0.05),transparent_70%)]" />

                <div className="relative flex items-center gap-3 border-b border-white/[0.06] px-6 py-4">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inset-0 animate-ping rounded-full bg-accent opacity-60 motion-reduce:hidden" />
                    <span className="relative h-2 w-2 rounded-full bg-accent" />
                  </span>
                  <span className="stage-label font-mono text-[13px] text-text" aria-live="polite">
                    {SERVICES[0].title}
                  </span>
                </div>

                <div aria-hidden className="relative flex-1">
                  {SERVICE_DEMOS.map((d, i) => (
                    <div key={i} className="stage-demo absolute inset-0 flex items-center justify-center p-8 lg:p-10">
                      <div className="demo w-full max-w-[440px]">{d.node}</div>
                    </div>
                  ))}
                  <div className="stage-edge pointer-events-none absolute inset-x-0 z-20 h-[2px] bg-accent opacity-0 shadow-[0_0_18px_2px_rgba(0,0,0,0.2)]" />
                </div>

                <nav aria-label="Jump to a service" className="relative flex gap-1.5 border-t border-white/[0.06] px-6 py-4">
                  {SERVICES.map((s, i) => (
                    <button
                      key={s.title}
                      type="button"
                      aria-label={`Show ${s.title}`}
                      onClick={() => jumpTo.current(i)}
                      className="stage-tick group/t flex-1 py-2 outline-none focus-visible:ring-2 focus-visible:ring-accent"
                      data-hot
                    >
                      <span className="block h-[3px] rounded-full bg-white/10 transition-colors duration-500 group-hover/t:bg-white/30 group-[.is-active]/t:bg-accent" />
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
