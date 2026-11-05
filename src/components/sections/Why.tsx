"use client";

import { useRef } from "react";
import { gsap, useGSAP, MM, sceneTimeline, settle } from "@/lib/gsap";
import { WHY } from "@/lib/content";
import { Index } from "../ui";

// Scattered 3D start positions for the six cards
const SCATTER = [
  { x: -420, y: -160, z: -300, rx: 30, ry: -40, rz: -12 },
  { x: 60, y: -260, z: -500, rx: -25, ry: 20, rz: 8 },
  { x: 460, y: -120, z: -200, rx: 20, ry: 45, rz: 14 },
  { x: -480, y: 180, z: -400, rx: -30, ry: -30, rz: 10 },
  { x: -40, y: 260, z: -600, rx: 35, ry: 10, rz: -16 },
  { x: 440, y: 200, z: -250, rx: -20, ry: 40, rz: -8 },
];

export default function Why() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const mm = gsap.matchMedia();
      mm.add(MM, (ctx) => {
        const { desktop, reduce } = ctx.conditions as Record<string, boolean>;
        if (desktop || reduce) {
          const tl = sceneTimeline(root.current!, { end: "+=200%", reduce });
          tl.fromTo(
            q(".why-card"),
            {
              x: (i: number) => SCATTER[i].x,
              y: (i: number) => SCATTER[i].y,
              z: (i: number) => SCATTER[i].z,
              rotationX: (i: number) => SCATTER[i].rx,
              rotationY: (i: number) => SCATTER[i].ry,
              rotationZ: (i: number) => SCATTER[i].rz,
              opacity: 0.25,
            },
            { x: 0, y: 0, z: 0, rotationX: 0, rotationY: 0, rotationZ: 0, opacity: 1, duration: 1, stagger: 0.08, ease: "power2.out" },
            0,
          )
            .fromTo(q(".why-line"), { drawSVG: "0%" }, { drawSVG: "100%", duration: 0.6 }, 1.1)
            .fromTo(q(".why-num"), { color: "#8a8a99" }, { color: "#ff2d2d", stagger: 0.1, duration: 0.1 }, 1.1)
            .from(q(".why-close"), { opacity: 0, y: 30, duration: 0.4 }, 1.5)
            .to({}, { duration: 0.3 });
          settle(tl, reduce);
        } else {
          gsap.from(q(".why-card"), {
            opacity: 0,
            y: 40,
            rotationX: 20,
            stagger: 0.1,
            ease: "none",
            scrollTrigger: { trigger: q(".why-grid")[0], start: "top 85%", end: "bottom 70%", scrub: true },
          });
        }
      });
    },
    { scope: root },
  );

  return (
    <section id="why" ref={root} aria-labelledby="why-title" className="relative flex flex-col justify-center overflow-hidden py-24 md:h-svh md:min-h-[680px] md:py-0">
      <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-8">
        <Index n="10" label="Why Red Ant Media" />
        <h2 id="why-title" className="display mt-4 text-[clamp(2rem,4vw,3.6rem)]">
          Small ants. <span className="text-red">Big colony.</span>
        </h2>

        <div className="why-grid relative mt-10 [perspective:1200px] md:mt-14">
          <svg aria-hidden viewBox="0 0 300 200" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 hidden h-full w-full md:block">
            <path className="why-line" d="M50 50 H250 L50 150 H250" fill="none" stroke="#ff2d2d" strokeOpacity="0.6" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          </svg>
          <ul className="relative grid gap-4 sm:grid-cols-2 md:grid-cols-3 md:gap-6 [transform-style:preserve-3d]">
            {WHY.map((w, i) => (
              <li key={w.title} className="why-card glass rounded-2xl p-6 md:p-8">
                <p className="why-num hud text-muted">{String(i + 1).padStart(2, "0")}</p>
                <h3 className="display mt-5 text-xl md:text-2xl">{w.title}</h3>
                <p className="mt-2 text-sm text-muted">{w.line}</p>
              </li>
            ))}
          </ul>
        </div>

        <p className="why-close display mt-10 max-w-3xl text-[clamp(1.2rem,2vw,1.8rem)] leading-snug text-text/90 md:mt-14">
          Not just keeping your brand active online. <span className="text-red">Building a presence that drives your business forward.</span>
        </p>
      </div>
    </section>
  );
}
