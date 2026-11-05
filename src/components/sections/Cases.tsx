"use client";

import Image from "next/image";
import { useRef } from "react";
import { gsap, useGSAP, MM } from "@/lib/gsap";
import { CASES, type CaseVisual } from "@/lib/content";
import { Index } from "../ui";

const S = { fill: "none", stroke: "#ff2d2d", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
const mono = { fontFamily: "var(--font-plex)", letterSpacing: "0.14em" } as const;

/** Futuristic line-art layer for each case (viewBox 300×375). */
function LineArt({ v, words }: { v: CaseVisual; words?: string[] }) {
  switch (v) {
    case "car":
      return (
        <>
          <path className="la" {...S} d="M40 220 L60 190 Q80 160 120 155 L190 152 Q220 152 245 180 L262 198 Q275 202 275 218 L275 228 L40 228 Z" />
          <path className="la" {...S} d="M95 160 L120 132 Q130 124 150 124 L190 124 Q205 124 218 140 L236 168" />
          <circle className="la" {...S} cx="92" cy="230" r="20" />
          <circle className="la" {...S} cx="225" cy="230" r="20" />
          <ellipse className="la" {...S} strokeOpacity="0.4" strokeDasharray="3 6" cx="155" cy="190" rx="140" ry="120" />
          {(words ?? []).map((w, i) => {
            // top · right · bottom · left — side words anchor inward so long
            // ones ("SUSTAINABILITY") stay inside the 300-wide frame
            const spot = ([
              { x: 155, y: 74, a: "middle" },
              { x: 288, y: 104, a: "end" },
              { x: 155, y: 314, a: "middle" },
              { x: 12, y: 104, a: "start" },
            ] as const)[i % 4];
            return (
              <text key={w} className="la-word" x={spot.x} y={spot.y} textAnchor={spot.a} fill="#f2f2f5" fontSize="10" style={mono}>
                {w.toUpperCase()}
              </text>
            );
          })}
        </>
      );
    case "globe":
      return (
        <>
          <circle className="la" {...S} cx="150" cy="190" r="110" />
          <ellipse className="la" {...S} strokeOpacity="0.6" cx="150" cy="190" rx="50" ry="110" />
          <ellipse className="la" {...S} strokeOpacity="0.6" cx="150" cy="190" rx="90" ry="110" />
          <line className="la" {...S} strokeOpacity="0.6" x1="40" y1="190" x2="260" y2="190" />
          <path className="la" {...S} strokeOpacity="0.6" d="M55 135 Q150 155 245 135 M55 245 Q150 225 245 245" />
          <path className="la" stroke="#f2f2f5" strokeWidth="2" fill="none" d="M20 360 L285 20" />
          <ellipse className="la" stroke="#f2f2f5" strokeWidth="1.5" fill="none" cx="268" cy="42" rx="4" ry="9" transform="rotate(38 268 42)" />
          {[[100, 140], [190, 120], [210, 210], [120, 250], [160, 180], [80, 200]].map(([x, y], i) => (
            <circle key={i} className="la-pt" cx={x} cy={y} r="5" fill="#4de1ff" />
          ))}
        </>
      );
    case "leaf":
      return (
        <>
          <path className="la" {...S} d="M80 200 C 80 120, 150 70, 230 70 C 230 150, 170 200, 80 200 Z" />
          <path className="la" {...S} d="M80 200 L 190 105 M120 165 L 150 168 M150 138 L 175 140" />
          {[0, 1, 2].map((c) =>
            [0, 1].map((r) => <rect key={`${c}${r}`} className="la-pt" x={40 + c * 80} y={235 + r * 62} width="66" height="52" rx="6" fill="none" stroke="#4de1ff" strokeOpacity="0.8" />),
          )}
        </>
      );
    case "tooth":
      return (
        <>
          <path className="la" {...S} d="M110 120 C 80 120, 75 160, 85 190 C 95 220, 100 270, 115 280 C 128 288, 135 240, 150 240 C 165 240, 172 288, 185 280 C 200 270, 205 220, 215 190 C 225 160, 220 120, 190 120 C 170 120, 165 130, 150 130 C 135 130, 130 120, 110 120 Z" />
          {[[40, 70], [260, 70], [40, 320], [260, 320]].map(([x, y], i) => (
            <g key={i}>
              <line className="la" stroke="#4de1ff" strokeOpacity="0.6" strokeWidth="1.2" x1={x} y1={y} x2="150" y2="200" strokeDasharray="3 5" />
              <circle className="la-pt" cx={x} cy={y} r="12" fill="#0e0e14" stroke="#4de1ff" />
            </g>
          ))}
        </>
      );
    case "cycle":
      return (
        <>
          <circle cx="150" cy="190" r="100" fill="none" stroke="#ffffff" strokeOpacity="0.1" strokeWidth="14" />
          <circle className="la" cx="150" cy="190" r="100" fill="none" stroke="#ff2d2d" strokeWidth="14" strokeLinecap="round" transform="rotate(-90 150 190)" />
          {["CYCLE", "MOOD", "SLEEP", "NUTRITION"].map((t, i) => {
            const a = -Math.PI / 2 + (i / 4) * Math.PI * 2 + 0.6;
            return (
              <text key={t} className="la-word" x={150 + Math.cos(a) * 140} y={190 + Math.sin(a) * 140 + 4} textAnchor="middle" fill="#f2f2f5" fontSize="10" style={mono}>
                {t}
              </text>
            );
          })}
        </>
      );
    case "pulse":
      return (
        <>
          <path className="la-jag" d="M10 190 L50 190 L65 120 L80 260 L95 150 L110 230 L125 170 L140 210 L160 110 L175 270 L190 190 L290 190" fill="none" stroke="#8a8a99" strokeWidth="1.6" />
          <path className="la" {...S} d="M10 190 C 60 190, 70 160, 100 160 S 140 220, 170 220 S 220 175, 250 185 S 280 190, 290 190" />
        </>
      );
  }
}

export default function Cases() {
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const cards = q<HTMLElement>(".case");
      const mm = gsap.matchMedia();

      const build = (card: HTMLElement) => {
        const c = gsap.utils.selector(card);
        const tl = gsap.timeline({ paused: true, defaults: { ease: "none" } });
        tl.fromTo(c(".la"), { drawSVG: "0%" }, { drawSVG: "100%", duration: 0.45, stagger: 0.04 }, 0)
          .from(c(".la-pt"), { scale: 0, opacity: 0, transformOrigin: "50% 50%", stagger: 0.05, duration: 0.12 }, 0.3)
          .from(c(".la-word"), { opacity: 0, stagger: 0.06, duration: 0.1 }, 0.35);
        if (c(".la-jag").length) tl.to(c(".la-jag"), { opacity: 0, duration: 0.3 }, 0.25);
        if (c(".case-img").length) {
          // clip-path wipe reveals the real project image, line art recedes to an overlay
          tl.fromTo(c(".case-img"), { clipPath: "inset(0% 100% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.4 }, 0.55)
            .fromTo(c(".case-img img"), { scale: 1.2 }, { scale: 1.02, duration: 0.45 }, 0.55)
            .to(c(".la-layer"), { opacity: 0.22, duration: 0.3 }, 0.6);
        }
        tl.from(c(".case-copy > *"), { opacity: 0, y: 16, stagger: 0.05, duration: 0.15 }, 0.1);
        return tl;
      };

      mm.add(MM, (ctx) => {
        const { desktop, reduce } = ctx.conditions as Record<string, boolean>;
        if (reduce) {
          cards.forEach((c) => build(c).progress(1));
          return;
        }
        if (desktop) {
          const distance = () => track.current!.scrollWidth - window.innerWidth;
          const h = gsap.to(track.current, {
            x: () => -distance(),
            ease: "none",
            scrollTrigger: {
              trigger: root.current,
              start: "top top",
              end: () => `+=${distance()}`,
              pin: true,
              scrub: 1,
              anticipatePin: 1,
              invalidateOnRefresh: true,
              onUpdate: (s) => gsap.set(q(".case-progress"), { scaleX: s.progress }),
            },
          });
          cards.forEach((card, i) => {
            const tl = build(card);
            gsap.to(tl, {
              progress: 1,
              ease: "none",
              scrollTrigger:
                i === 0
                  ? { trigger: root.current, start: "top 75%", end: "top top", scrub: 0.6 }
                  : { trigger: card, containerAnimation: h, start: "left 90%", end: "left 25%", scrub: 0.6 },
            });
            // parallax inside the frame
            const img = card.querySelector(".case-visual");
            if (img)
              gsap.fromTo(img, { x: 40 }, { x: -40, ease: "none", scrollTrigger: { trigger: card, containerAnimation: h, start: "left right", end: "right left", scrub: true } });
          });
        } else {
          cards.forEach((card) => {
            const tl = build(card);
            gsap.to(tl, { progress: 1, ease: "none", scrollTrigger: { trigger: card, start: "top 80%", end: "center 50%", scrub: 0.6 } });
          });
        }
      });
    },
    { scope: root },
  );

  return (
    <section id="work" ref={root} aria-labelledby="work-title" className="relative overflow-hidden md:h-svh">
      <div className="relative px-4 pt-24 sm:px-8 md:absolute md:inset-x-0 md:top-0 md:z-10 md:mx-auto md:max-w-[1400px] md:pt-28">
        <Index n="09" label="Selected experience" />
        <h2 id="work-title" className="display mt-4 text-[clamp(2rem,4vw,3.6rem)]">
          Work that <span className="text-red">speaks for itself.</span>
        </h2>
      </div>

      <div ref={track} className="flex flex-col gap-16 px-4 pb-24 pt-12 sm:px-8 md:h-full md:w-max md:flex-row md:items-center md:gap-[6vw] md:p-0 md:pb-16 md:pl-[max(2rem,calc((100vw-1400px)/2+2rem))] md:pr-[14vw] md:pt-[190px]">
        {CASES.map((c) => (
          <article key={c.client} className="case grid gap-6 md:h-[min(600px,calc(100svh-270px))] md:w-[min(80vw,1040px)] md:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] md:items-center md:gap-12">
            <div className="case-visual brackets glass relative mx-auto aspect-[4/5] w-full max-w-[420px] overflow-hidden rounded-2xl md:h-full md:w-auto md:max-w-full md:justify-self-center">
              <div aria-hidden className="dot-grid absolute inset-0 opacity-50" />
              {c.image && (
                <div className="case-img absolute inset-0">
                  <Image src={c.image} alt={`${c.client} — work by Red Ant Media`} fill sizes="(min-width: 768px) 40vw, 100vw" className="object-cover" />
                </div>
              )}
              <svg viewBox="0 0 300 375" className="la-layer absolute inset-0 h-full w-full" aria-hidden>
                <LineArt v={c.visual} words={c.facts && c.visual === "car" ? c.facts : undefined} />
              </svg>
            </div>
            <div className="case-copy">
              <p className="hud text-muted">
                {c.sector} <span className="text-red">·</span> {c.focus}
              </p>
              <h3 className="display mt-4 text-[clamp(1.8rem,3.2vw,3.2rem)]">{c.client}</h3>
              <p className="mt-4 max-w-md text-muted">{c.line}</p>
              {c.facts && (
                <ul className="mt-6 flex flex-wrap gap-2">
                  {c.facts.map((f) => (
                    <li key={f} className="hud rounded-full border border-white/10 px-3 py-1.5 text-text/80">
                      {f}
                    </li>
                  ))}
                </ul>
              )}
              {c.implementation && (
                <p className="hud mt-6 inline-flex items-center gap-2 rounded-full border border-cyan/30 bg-cyan/5 px-3 py-1.5 text-cyan">
                  Implementation experience
                </p>
              )}
            </div>
          </article>
        ))}
      </div>

      <div aria-hidden className="absolute inset-x-0 bottom-8 hidden md:block">
        <div className="mx-auto h-px max-w-[1400px] bg-white/10 px-8">
          <div className="case-progress h-px origin-left scale-x-0 bg-red" />
        </div>
      </div>
    </section>
  );
}
