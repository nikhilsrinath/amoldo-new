"use client";

import { useRef } from "react";
import { gsap, useGSAP, MM, parallax } from "@/lib/gsap";
import { STATS, VALUES } from "@/lib/content";
import { Index } from "../ui";

const TRAIL = "M0 50 C 120 10, 200 90, 250 50 S 380 10, 500 50 S 640 90, 750 50 S 880 10, 1000 50";

export default function WhoWeAre() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const mm = gsap.matchMedia();
      mm.add(MM, (ctx) => {
        const { reduce, mobile } = ctx.conditions as Record<string, boolean>;
        parallax(root.current!, reduce, mobile);
        const nums = q<HTMLElement>(".stat-num");
        if (reduce) {
          nums.forEach((el, i) => (el.textContent = String(STATS[i].value)));
          return;
        }

        // Headline words light up as you scroll through them
        gsap.fromTo(
          q(".stmt-word"),
          { opacity: 0.15 },
          {
            opacity: 1,
            stagger: 0.1,
            ease: "none",
            scrollTrigger: { trigger: q(".stmt")[0], start: "top 80%", end: "bottom 45%", scrub: true },
          },
        );

        // Stats count in sync with scroll, linked by a colony trail
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: { trigger: q(".stats")[0], start: "top 85%", end: "top 30%", scrub: 0.8 },
        });
        tl.fromTo(q(".trail"), { drawSVG: "0%" }, { drawSVG: "100%", duration: 1 }, 0);
        tl.fromTo(q(".trail-head"), { drawSVG: "0% 3%" }, { drawSVG: "97% 100%", duration: 1 }, 0);
        nums.forEach((el, i) => {
          const s = STATS[i];
          const from = s.value > 1000 ? 1990 : 0;
          const o = { v: from };
          tl.to(o, { v: s.value, duration: 0.35, onUpdate: () => (el.textContent = String(Math.round(o.v))) }, i * 0.2);
          tl.from(q(".stat")[i], { opacity: 0.2, y: 20, duration: 0.25 }, i * 0.2);
        });
      });
    },
    { scope: root },
  );

  return (
    <section id="about" ref={root} aria-labelledby="about-title" className="relative overflow-hidden pb-16 pt-28 md:pb-20 md:pt-44">
      <div aria-hidden data-speed="0.6" className="dot-grid absolute inset-0 opacity-60" />
      <div className="relative mx-auto max-w-[1400px] px-4 sm:px-8">
        <Index n="02" label="Who we are" />
        <h2 id="about-title" className="stmt display mt-8 max-w-5xl text-[clamp(2.4rem,7vw,7rem)]">
          {"Digital marketing comes first.".split(" ").map((w, i) => (
            <span key={i} className="stmt-word inline-block pr-[0.25em]">
              {w}
            </span>
          ))}
        </h2>
        <p className="mt-8 max-w-xl text-lg text-muted" data-speed="1.08">
          We help brands communicate clearly, reach the right audiences and turn attention into growth.
        </p>

        {/* Stats */}
        <div className="stats relative mt-20 md:mt-28">
          <svg
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-1/2 hidden h-24 w-full -translate-y-1/2 md:block"
            viewBox="0 0 1000 100"
            preserveAspectRatio="none"
          >
            <path className="trail" d={TRAIL} fill="none" stroke="#ff2d2d" strokeOpacity="0.45" strokeWidth="1" vectorEffect="non-scaling-stroke" />
            <path className="trail-head" d={TRAIL} fill="none" stroke="#ff4d4d" strokeWidth="3" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          </svg>
          <ul className="relative grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-8">
            {STATS.map((s) => (
              <li key={s.label} className="stat brackets glass min-w-0 rounded-xl px-4 py-6 sm:px-5 sm:py-7 md:px-7 md:py-9">
                {/* every card reserves the prefix row so the numbers line up */}
                <span className={`hud mb-1 block text-muted ${s.prefix ? "" : "invisible"}`} aria-hidden={!s.prefix || undefined}>
                  {s.prefix.trim() || " "}
                </span>
                <p className="display text-[clamp(2.2rem,4.6vw,4.2rem)] tabular-nums">
                  <span className="stat-num">{s.value}</span>
                  <span className="text-red">{s.suffix}</span>
                </p>
                <p className="hud mt-3 text-muted">{s.label}</p>
              </li>
            ))}
          </ul>
        </div>

        {/* Values */}
        <ul className="mt-16 grid gap-4 md:mt-24 md:grid-cols-3 md:gap-8">
          {VALUES.map((v, i) => (
            <li
              key={v.title}
              data-speed={[0.92, 1.04, 1.16][i]}
              data-speed-desktop
              className="glass group relative overflow-hidden rounded-2xl p-7 md:p-9"
            >
              <span aria-hidden className="display absolute -right-4 -top-6 text-[8rem] text-white/[0.03]">
                {i + 1}
              </span>
              <span aria-hidden className="block h-1 w-10 rounded bg-red transition-all duration-500 group-hover:w-20" />
              <h3 className="display mt-6 text-2xl">{v.title}</h3>
              <p className="mt-2 text-sm text-muted">{v.line}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
