"use client";

import { useRef } from "react";
import { gsap, useGSAP, ScrollTrigger } from "@/lib/gsap";
import { SERVICES } from "@/lib/content";
import { Index } from "../ui";
import { SERVICE_VISUALS } from "./ServiceVisuals";
import { scrollToTarget } from "../shell/SmoothScroll";

/**
 * 04 · Services — a pinned stage.
 *
 * Desktop: the section pins and one master timeline (scrubbed by scroll) walks
 * through nine segments. Each segment: the scene rises through a clip-path
 * window, assembles (its own build timeline, nested), holds, then sinks away
 * while the next one rises. Depth comes from three sources that never touch
 * the same element:
 *   1. scroll parallax — each scene's .lz layers drift at a speed set by depth
 *   2. pointer parallax — .pz layers + the whole stage tilt follow the cursor
 *   3. a ghost type band behind everything slides at its own, slower rate
 * While a scene is active its idle loop runs (radar sweep, floating hearts…).
 *
 * Mobile: plain stacked cards, each scene scrubbed by its own trigger.
 * Reduced motion: final frames, cross-fades only, no loops.
 */

const N = SERVICES.length;
const pad = (n: number) => String(n).padStart(2, "0");
const COND = { md: "(min-width: 768px)", reduce: "(prefers-reduced-motion: reduce)" };
/** Where in its segment a service sits fully assembled (used by the rail jump). */
const REST = 0.74;

export default function Services() {
  const root = useRef<HTMLElement>(null);
  const jumpTo = useRef<(i: number) => void>(() => {});

  useGSAP(
    () => {
      const sec = root.current!;
      const q = gsap.utils.selector(sec);
      const items = q<HTMLElement>(".svc");
      const mm = gsap.matchMedia();

      mm.add(COND, (ctx) => {
        const { md, reduce } = ctx.conditions as Record<string, boolean>;
        const visual = (i: number) => items[i].querySelector(".svc-visual")!;

        const builds = items.map((_, i) => {
          const tl = gsap.timeline({ defaults: { ease: "none" }, paused: true });
          SERVICE_VISUALS[i].build(visual(i), tl);
          return tl;
        });
        const idles = reduce ? [] : items.map((_, i) => SERVICE_VISUALS[i].idle?.(visual(i)) ?? null);

        /* ───────── Mobile: stacked cards ───────── */
        if (!md) {
          items.forEach((it, i) => {
            if (reduce) {
              builds[i].progress(1);
              return;
            }
            gsap.to(builds[i], {
              progress: 1,
              ease: "none",
              scrollTrigger: { trigger: it.querySelector(".svc-scene"), start: "top 88%", end: "bottom 55%", scrub: 0.6 },
            });
            gsap.from(it.querySelectorAll(".w"), {
              yPercent: 110,
              stagger: 0.05,
              duration: 0.9,
              ease: "expo.out",
              scrollTrigger: { trigger: it, start: "top 82%", toggleActions: "play none none reverse" },
            });
            gsap.from(it.querySelectorAll(".svc-f"), {
              autoAlpha: 0,
              y: 14,
              stagger: 0.05,
              duration: 0.6,
              ease: "power2.out",
              scrollTrigger: { trigger: it, start: "top 78%", toggleActions: "play none none reverse" },
            });
            // Scroll parallax on depth layers inside each card
            it.querySelectorAll<SVGGElement>(".lz").forEach((l) => {
              const z = Number(l.dataset.z);
              gsap.fromTo(l, { y: z * 14 }, { y: -z * 14, ease: "none", scrollTrigger: { trigger: it, start: "top bottom", end: "bottom top", scrub: true } });
            });
            ScrollTrigger.create({
              trigger: it,
              start: "top bottom",
              end: "bottom top",
              onToggle: (s) => (s.isActive ? idles[i]?.play() : idles[i]?.pause()),
            });
          });
          return;
        }

        /* ───────── Desktop: pinned stage ───────── */
        const scenes = items.map((it) => it.querySelector<HTMLElement>(".svc-scene")!);
        const words = items.map((it) => it.querySelectorAll(".w"));
        const fades = items.map((it) => it.querySelectorAll(".svc-f"));
        const layers = items.map((it) => Array.from(it.querySelectorAll<SVGGElement>(".lz")));
        const fills = q(".rail-fill");
        const railItems = q(".rail-item");
        const ghost = q<HTMLElement>(".svc-ghost")[0];
        const counter = q<HTMLElement>(".svc-counter")[0];

        /* Active service: rail state, idle loops, pointer target */
        let active = -1;
        function setActive(i: number) {
          if (i === active) return;
          if (active > -1) idles[active]?.pause();
          active = i;
          idles[i]?.play();
          railItems.forEach((r, k) => {
            r.classList.toggle("is-active", k === i);
            r.setAttribute("aria-current", k === i ? "true" : "false");
          });
        }
        setActive(0);

        const master = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: sec,
            start: "top top",
            end: () => `+=${Math.round(window.innerHeight * 0.95 * N)}`,
            pin: true,
            scrub: reduce ? true : 1,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: (s) => setActive(Math.min(N - 1, Math.floor(s.progress * N + 0.04))),
          },
        });

        // Everything but the first service starts off-stage.
        gsap.set(scenes.slice(1), { autoAlpha: 0 });
        gsap.set(fades.slice(1), { autoAlpha: 0 });
        words.slice(1).forEach((w) => gsap.set(w, { yPercent: 110 }));

        const leave = (i: number, at: number) => {
          master.to(words[i], { yPercent: -110, stagger: 0.012, duration: 0.16, ease: "power2.in" }, at);
          master.to(fades[i], { autoAlpha: 0, y: -14, stagger: 0.015, duration: 0.14, ease: "power2.in" }, at);
          master.to(
            scenes[i],
            reduce ? { autoAlpha: 0, duration: 0.1 } : { autoAlpha: 0, scale: 0.86, yPercent: -9, rotationX: 14, filter: "blur(6px)", duration: 0.26, ease: "power2.in" },
            at,
          );
        };
        const enter = (i: number, at: number) => {
          master.fromTo(words[i], { yPercent: 110 }, { yPercent: 0, stagger: 0.018, duration: 0.24, ease: "power3.out", immediateRender: false }, at + 0.14);
          master.fromTo(fades[i], { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, stagger: 0.025, duration: 0.2, ease: "power2.out", immediateRender: false }, at + 0.2);
          if (reduce) {
            master.fromTo(scenes[i], { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.1, immediateRender: false }, at + 0.12);
            return;
          }
          master.fromTo(
            scenes[i],
            { autoAlpha: 1, scale: 1.1, yPercent: 8, rotationX: -10, filter: "blur(0px)", clipPath: "inset(100% -25% -25% -25% round 28px)" },
            { autoAlpha: 1, scale: 1, yPercent: 0, rotationX: 0, clipPath: "inset(-25% -25% -25% -25% round 28px)", duration: 0.34, ease: "power3.out", immediateRender: false },
            at + 0.08,
          );
        };

        items.forEach((_, i) => {
          // Rail segment fills across its own slice of the scroll
          master.fromTo(fills[i], { scaleX: 0 }, { scaleX: 1, duration: 1 }, i);

          if (i > 0) {
            const at = i - 0.16;
            leave(i - 1, at);
            enter(i, at);
            master.to(counter, { yPercent: (-100 * i) / N, duration: 0.3, ease: "power3.inOut" }, at + 0.1);
          }

          if (reduce) {
            builds[i].progress(1);
            return;
          }

          // Scene assembly — scene 0 is assembled on the approach (below)
          if (i > 0) master.add(builds[i].paused(false).duration(0.55), i + 0.08);

          // Scroll parallax: deeper layers travel further while the scene is on stage
          layers[i].forEach((l) => {
            const z = Number(l.dataset.z);
            if (i === 0) master.fromTo(l, { y: 0 }, { y: -z * 12, duration: 1.1 }, 0);
            else master.fromTo(l, { y: z * 16 }, { y: -z * 12, duration: 1.35 }, i - 0.2);
          });
        });
        master.set({}, {}, N); // pad the final hold to a whole segment

        if (!reduce) {
          // Ghost type band: slowest layer, drifts left across the whole pin
          master.fromTo(ghost, { x: 0 }, { x: () => -(ghost.scrollWidth - window.innerWidth * 0.7), duration: N }, 0);

          // First service builds while the section scrolls into place
          gsap.to(builds[0], {
            progress: 1,
            ease: "none",
            scrollTrigger: { trigger: sec, start: "top 75%", end: "top top", scrub: 0.6 },
          });
          // Animates `y` (px), not `yPercent`: the master timeline owns yPercent for
          // the exit, and sharing it let a late-finishing intro re-show the words
          // over service 02 after a fast scroll, reload or rail jump.
          gsap.from([...words[0]], {
            y: (_: number, el: HTMLElement) => el.offsetHeight * 1.1,
            stagger: 0.05,
            duration: 1,
            ease: "expo.out",
            scrollTrigger: { trigger: sec, start: "top 55%", toggleActions: "play none none reverse" },
          });
        }


        jumpTo.current = (i: number) => {
          const st = master.scrollTrigger!;
          const p = i === 0 ? 0.02 : (i + REST) / N;
          scrollToTarget(st.start + p * (st.end - st.start));
        };

        if (reduce) return;

        /* Pointer: stage tilt + per-depth parallax + spotlight */
        const frame = q<HTMLElement>(".svc-frame")[0];
        const rigs = items.map((it) => ({
          rx: gsap.quickTo(it.querySelector(".svc-tilt"), "rotationX", { duration: 0.9, ease: "power3" }),
          ry: gsap.quickTo(it.querySelector(".svc-tilt"), "rotationY", { duration: 0.9, ease: "power3" }),
          pz: Array.from(it.querySelectorAll<SVGGElement>(".pz")).map((g) => ({
            z: Number(g.dataset.z),
            x: gsap.quickTo(g, "x", { duration: 0.8, ease: "power3" }),
            y: gsap.quickTo(g, "y", { duration: 0.8, ease: "power3" }),
          })),
        }));
        const frameRx = gsap.quickTo(frame, "rotationX", { duration: 1.1, ease: "power3" });
        const frameRy = gsap.quickTo(frame, "rotationY", { duration: 1.1, ease: "power3" });

        const aim = (nx: number, ny: number) => {
          const r = rigs[active];
          if (!r) return;
          r.ry(nx * 7);
          r.rx(-ny * 6);
          r.pz.forEach((p) => {
            p.x(nx * p.z * 7);
            p.y(ny * p.z * 5);
          });
          frameRy(nx * 4);
          frameRx(-ny * 3);
        };
        const onMove = (e: PointerEvent) => {
          const b = frame.getBoundingClientRect();
          const nx = gsap.utils.clamp(-1, 1, ((e.clientX - b.left) / b.width) * 2 - 1);
          const ny = gsap.utils.clamp(-1, 1, ((e.clientY - b.top) / b.height) * 2 - 1);
          frame.style.setProperty("--mx", `${((e.clientX - b.left) / b.width) * 100}%`);
          frame.style.setProperty("--my", `${((e.clientY - b.top) / b.height) * 100}%`);
          aim(nx, ny);
        };
        const onLeave = () => {
          rigs.forEach((r) => {
            r.rx(0);
            r.ry(0);
            r.pz.forEach((p) => (p.x(0), p.y(0)));
          });
          frameRx(0);
          frameRy(0);
        };
        sec.addEventListener("pointermove", onMove);
        sec.addEventListener("pointerleave", onLeave);
        return () => {
          sec.removeEventListener("pointermove", onMove);
          sec.removeEventListener("pointerleave", onLeave);
          idles.forEach((t) => t?.pause());
        };
      });
    },
    { scope: root },
  );

  return (
    <section id="services" ref={root} aria-labelledby="services-title" className="relative overflow-hidden md:h-svh md:min-h-[560px]">
      <div className="pointer-events-none absolute inset-0 dot-grid opacity-30" aria-hidden />
      <div aria-hidden className="pointer-events-none absolute -right-[10%] top-1/3 hidden h-[60vh] w-[50vw] rounded-full bg-red/10 blur-[140px] md:block" />

      {/* Ghost type band — the slowest parallax layer */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-1/2 hidden -translate-y-1/2 md:block">
        <div className="svc-ghost flex w-max gap-[6vw] whitespace-nowrap pl-[6vw] will-change-transform">
          {SERVICE_VISUALS.map((v) => (
            <span key={v.short} className="display text-[22vw] leading-none text-transparent [-webkit-text-stroke:1px_rgba(255,255,255,0.045)]">
              {v.short}
            </span>
          ))}
        </div>
      </div>

      {/* Header */}
      <div className="relative z-10 mx-auto max-w-[1400px] px-4 pt-24 sm:px-8 md:absolute md:inset-x-0 md:top-0 md:pt-24">
        <div className="flex items-end justify-between gap-6">
          <div>
            <Index n="04" label="Services" />
            <h2 id="services-title" className="display mt-4 text-[clamp(2rem,3.6vw,3.4rem)]">
              Nine ways we grow <span className="text-red">your brand.</span>
            </h2>
          </div>
          {/* Odometer: which service is on stage */}
          <div aria-hidden className="hidden items-end gap-2 md:flex">
            <div className="h-[clamp(2.4rem,4.4vw,4.2rem)] overflow-hidden">
              <div className="svc-counter display text-[clamp(2.4rem,4.4vw,4.2rem)] leading-none text-red">
                {SERVICES.map((s, i) => (
                  <div key={s.title} className="h-[clamp(2.4rem,4.4vw,4.2rem)]">
                    {pad(i + 1)}
                  </div>
                ))}
              </div>
            </div>
            <span className="hud mb-1.5 text-muted">/ {pad(N)}</span>
          </div>
        </div>
      </div>

      {/* Shared stage frame (desktop) — sits behind the scenes, same grid */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-[96px] top-[200px] hidden md:block">
        <div className="mx-auto grid h-full max-w-[1400px] grid-cols-[minmax(0,5fr)_minmax(0,7fr)] items-center gap-14 px-8">
          <div />
          <div className="[perspective:1400px]">
            <div className="relative mx-auto aspect-[4/3] w-full max-w-[calc((100svh-330px)*4/3)]">
              <div className="svc-frame brackets absolute -inset-5 overflow-hidden rounded-[28px] border border-white/[0.07] bg-bg-2/70 [--mx:50%] [--my:40%]">
                <div className="absolute inset-0 dot-grid opacity-60" />
                <div className="absolute inset-0 bg-[radial-gradient(420px_circle_at_var(--mx)_var(--my),rgba(255,45,45,0.14),transparent_70%)]" />
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-bg/80 to-transparent" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Services */}
      <div className="relative px-4 pb-24 pt-6 sm:px-8 md:absolute md:inset-x-0 md:bottom-[96px] md:top-[200px] md:p-0">
        {SERVICES.map((s, i) => (
          <article
            key={s.title}
            aria-labelledby={`svc-${i}`}
            className="svc relative mx-auto mt-20 grid max-w-[1400px] gap-8 first:mt-10 md:pointer-events-none md:absolute md:inset-0 md:mt-0 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:items-center md:gap-14 md:px-8 md:first:mt-0"
          >
            <div className="svc-copy">
              <p className="svc-f hud text-red md:hidden">
                {pad(i + 1)} <span className="text-muted">/ {pad(N)}</span>
              </p>
              <h3 id={`svc-${i}`} className="display mt-3 text-[clamp(2rem,4vw,4rem)] md:mt-0">
                {s.title.split(" ").map((w, k) => (
                  <span key={k} className="mr-[0.25em] inline-block overflow-hidden pb-[0.1em] align-top last:mr-0">
                    <span className="w inline-block will-change-transform">{w}</span>
                  </span>
                ))}
              </h3>
              <p className="svc-f mt-5 max-w-md text-lg leading-relaxed text-muted">{s.line}</p>
              <ul className="mt-7 flex max-w-md flex-wrap gap-2">
                {s.tags.map((t) => (
                  <li key={t} className="svc-f hud rounded-full border border-white/10 bg-white/[0.02] px-3 py-1.5 text-[10px] text-text/80">
                    {t}
                  </li>
                ))}
              </ul>
            </div>

            <div className="[perspective:1400px]">
              <div className="svc-scene relative mx-auto aspect-[4/3] w-full will-change-transform md:max-w-[calc((100svh-330px)*4/3)]">
                <div className="svc-tilt h-full w-full [transform-style:preserve-3d] max-md:rounded-3xl max-md:border max-md:border-white/[0.07] max-md:bg-bg-2/70 max-md:p-3">
                  <svg viewBox="0 0 480 360" className="svc-visual h-full w-full overflow-visible" aria-hidden>
                    {SERVICE_VISUALS[i].svg}
                  </svg>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Progress rail — one segment per service, click to jump */}
      <nav aria-label="Services" className="absolute inset-x-0 bottom-7 z-10 hidden md:block">
        <ol className="mx-auto flex max-w-[1400px] gap-2 px-8">
          {SERVICES.map((s, i) => (
            <li key={s.title} className="flex-1">
              <button
                type="button"
                onClick={() => jumpTo.current(i)}
                className="rail-item group block w-full text-left"
                aria-label={`Show ${s.title}`}
                data-hot
              >
                <span className="relative block h-[2px] overflow-hidden bg-white/10">
                  <span className="rail-fill absolute inset-0 origin-left scale-x-0 bg-red" />
                </span>
                <span className="hud mt-2.5 flex gap-2 text-[10px] text-muted transition-colors duration-300 group-hover:text-text group-[.is-active]:text-text">
                  <span className="text-red/60 transition-colors group-[.is-active]:text-red">{pad(i + 1)}</span>
                  <span className="truncate opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-[.is-active]:opacity-100 lg:opacity-60">
                    {SERVICE_VISUALS[i].short}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ol>
      </nav>
    </section>
  );
}
