"use client";

import { useRef } from "react";
import { gsap, useGSAP, MM, sceneTimeline, settle } from "@/lib/gsap";
import { PRINCIPLES, PROCESS } from "@/lib/content";
import { Index, LineIcon } from "../ui";

type Layout = {
  vb: [number, number];
  nodes: [number, number][];
  path: string;
  loop: string;
  loopHead: string;
};

const DESKTOP: Layout = {
  vb: [1200, 460],
  nodes: [
    [100, 330],
    [300, 130],
    [500, 330],
    [700, 130],
    [900, 330],
    [1100, 130],
  ],
  path: "M100 330 C 180 330, 220 130, 300 130 S 420 330, 500 330 S 620 130, 700 130 S 820 330, 900 330 S 1020 130, 1100 130",
  loop: "M1100 130 C 1190 180, 1180 420, 1000 420 S 900 380, 900 330",
  loopHead: "M890 346 900 330 912 344",
};

const MOBILE: Layout = {
  vb: [400, 1000],
  nodes: [
    [90, 80],
    [310, 250],
    [90, 420],
    [310, 590],
    [90, 760],
    [310, 930],
  ],
  path: "M90 80 C 90 170, 310 160, 310 250 S 90 330, 90 420 S 310 500, 310 590 S 90 670, 90 760 S 310 840, 310 930",
  loop: "M310 930 C 400 930, 400 760, 300 740 S 110 760, 90 760",
  loopHead: "M106 748 90 760 106 772",
};

function ProcessMap({ L, variant }: { L: Layout; variant: "d" | "m" }) {
  const [W, H] = L.vb;
  return (
    <div className={`pmap pmap-${variant} relative mx-auto w-full`} style={{ aspectRatio: `${W} / ${H}` }}>
      <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
        <defs>
          <filter id={`glow-${variant}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" />
          </filter>
        </defs>
        <path d={L.path} fill="none" style={{ stroke: "var(--text)" }} strokeOpacity="0.1" strokeWidth="2" />
        <path d={L.path} fill="none" stroke="#000000" strokeOpacity="0.25" strokeWidth="1" strokeDasharray="2 8" />
        <path className="p-lit" d={L.path} fill="none" stroke="#000000" strokeWidth="2" />
        <path className="p-lit" d={L.path} fill="none" stroke="#000000" strokeWidth="6" opacity="0.12" filter={`url(#glow-${variant})`} />
        <path className="p-loop" d={L.loop} fill="none" style={{ stroke: "var(--text)" }} strokeWidth="1.5" strokeDasharray="5 6" opacity="0" />
        <path className="p-loop-head" d={L.loopHead} fill="none" style={{ stroke: "var(--text)" }} strokeWidth="1.5" opacity="0" />

        {L.nodes.map(([x, y], i) => (
          <g key={i} transform={`translate(${x} ${y})`}>
            <g className="p-node">
              <circle r="34" style={{ fill: "var(--bg-2)", stroke: "var(--text)" }} strokeOpacity="0.14" />
              <circle className="p-ring" r="34" fill="none" stroke="#000000" strokeWidth="2" opacity="0" />
              <g transform="translate(-14 -14)" className="p-icon" style={{ color: "var(--muted)" }}>
                <LineIcon name={PROCESS[i].icon} size={28} />
              </g>
            </g>
          </g>
        ))}

        {/* trail particles + lead ant */}
        {[0, 1, 2, 3, 4].map((k) => (
          <circle key={k} className="p-trail" r={3.4 - k * 0.5} fill="#000000" opacity={0.8 - k * 0.14} />
        ))}
        <g className="p-ant">
          <g transform="rotate(90)">
            <ellipse cx="0" cy="-9" rx="4.5" ry="4" fill="#000000" />
            <ellipse cx="0" cy="0" rx="3.5" ry="4.5" fill="#000000" />
            <ellipse cx="0" cy="11" rx="5.5" ry="7" fill="#000000" />
            <path d="M-3 -1-10-6M3-1 10-6M-3 1-11 2M3 1 11 2M-3 3-9 10M3 3 9 10M-2-12-6-19M2-12 6-19" stroke="#000000" strokeWidth="1.2" strokeLinecap="round" fill="none" />
          </g>
          <circle r="16" fill="#000000" opacity="0.2" />
        </g>
      </svg>

      {/* DOM labels (selectable text) */}
      {L.nodes.map(([x, y], i) => {
        const below = variant === "d" ? y < H / 2 : false;
        const pos =
          variant === "d"
            ? { left: `${(x / W) * 100}%`, top: `${(y / H) * 100}%`, transform: `translate(-50%, ${below ? "-150%" : "60%"})` }
            : // phones: label sits on the outer side of its node, so labels on the
              // same side are two stops apart and never collide
              {
                right: x < W / 2 ? `${((W - x + 50) / W) * 100}%` : undefined,
                left: x >= W / 2 ? `${((x + 50) / W) * 100}%` : undefined,
                top: `${(y / H) * 100}%`,
                transform: "translateY(-50%)",
              };
        return (
          <div
            key={i}
            className={`p-label absolute opacity-30 ${
              variant === "d" ? "w-max text-center" : `w-[calc(50vw-5rem)] max-w-[11rem] ${x < W / 2 ? "text-right" : "text-left"}`
            }`}
            style={pos}
          >
            <p className="hud text-accent">{PROCESS[i].n}</p>
            <h3 className="display mt-1 text-[15px] leading-tight md:text-xl">{PROCESS[i].title}</h3>
            <p className="mt-1 text-[11px] leading-snug text-muted md:text-sm">{PROCESS[i].focus}</p>
          </div>
        );
      })}
      <p className="p-cont hud absolute text-text opacity-0" style={variant === "d" ? { left: "84%", top: "96%" } : { right: "36%", top: "93%", transform: "translateY(-50%)", whiteSpace: "nowrap" }}>
        ↻ Continuous
      </p>
    </div>
  );
}

export default function Process() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MM, (ctx) => {
        const { mobile, reduce } = ctx.conditions as Record<string, boolean>;
        const map = root.current!.querySelector<HTMLElement>(mobile ? ".pmap-m" : ".pmap-d")!;
        const q = gsap.utils.selector(map);
        const L = mobile ? MOBILE : DESKTOP;
        const path = map.querySelector<SVGPathElement>("path.p-lit")!;
        const loop = map.querySelector<SVGPathElement>(".p-loop")!;

        const tl = sceneTimeline(root.current!, { end: mobile ? "+=300%" : "+=320%", reduce });
        const SEG = 1; // one unit per hop
        const hops = L.nodes.length - 1;
        const mp = (end: number) => ({ path, align: path, alignOrigin: [0.5, 0.5] as [number, number], autoRotate: true, start: 0, end });

        tl.fromTo(q(".p-lit"), { drawSVG: "0%" }, { drawSVG: "100%", duration: hops * SEG }, 0);
        tl.fromTo(q(".p-ant"), { motionPath: mp(0) }, { motionPath: mp(1), duration: hops * SEG }, 0);
        q(".p-trail").forEach((t, k) => {
          tl.fromTo(t, { motionPath: { path, align: path, alignOrigin: [0.5, 0.5], start: 0, end: 0 } }, { motionPath: { path, align: path, alignOrigin: [0.5, 0.5], start: 0, end: 1 }, duration: hops * SEG }, 0.06 * (k + 1));
        });

        // light each stage when the ant arrives
        const labels = q(".p-label");
        L.nodes.forEach((_, i) => {
          const at = Math.max(0, i * SEG - 0.1);
          tl.to(q(".p-ring")[i], { opacity: 1, duration: 0.15 }, at)
            .to(q(".p-icon")[i], { color: "#000000", duration: 0.15 }, at)
            .fromTo(q(".p-icon")[i].querySelectorAll("path, circle"), { drawSVG: "0%" }, { drawSVG: "100%", duration: 0.3 }, at)
            .to(labels[i], { opacity: 1, duration: 0.15 }, at)
            .fromTo(q(".p-node")[i], { scale: 1 }, { scale: 1.12, duration: 0.1, yoyo: true, repeat: 1, transformOrigin: "50% 50%" }, at);
        });

        // the work loops back: Optimisation → Measurement
        const end = hops * SEG;
        tl.to(loop, { opacity: 1, duration: 0.05 }, end)
          .fromTo(loop, { drawSVG: "0%" }, { drawSVG: "100%", duration: 0.7 }, end)
          .to(q(".p-loop-head"), { opacity: 1, duration: 0.1 }, end + 0.65)
          .to(q(".p-ant"), { motionPath: { path: loop, align: loop, alignOrigin: [0.5, 0.5], autoRotate: true }, duration: 0.8 }, end + 0.05)
          .to(q(".p-cont"), { opacity: 1, duration: 0.2 }, end + 0.6)
          .to({}, { duration: 0.4 });

        settle(tl, reduce);
      });
    },
    { scope: root },
  );

  return (
    <section id="process" data-theme="light" ref={root} aria-labelledby="process-title" className="relative flex h-svh min-h-[600px] flex-col overflow-hidden">
      <div className="relative mx-auto w-full max-w-[1400px] px-4 pt-20 sm:px-8 md:pt-28">
        <Index n="08" label="How we work" />
        <h2 id="process-title" className="display mt-3 text-[clamp(1.8rem,4vw,3.6rem)] md:mt-4">
          One path. <span className="text-accent">Always improving.</span>
        </h2>
      </div>

      <div className="relative mx-auto flex min-h-0 w-full max-w-[1300px] flex-1 items-center px-6 pb-20 pt-4 md:px-16 md:py-6">
        <div className="mx-auto hidden w-full max-w-[min(100%,calc((100svh-330px)*2.6))] md:block">
          <ProcessMap L={DESKTOP} variant="d" />
        </div>
        {/* phones: fill the remaining height so the six stops have room to breathe */}
        <div className="mx-auto h-full max-h-[620px] max-w-full md:hidden" style={{ aspectRatio: "400 / 1000" }}>
          <ProcessMap L={MOBILE} variant="m" />
        </div>
      </div>

      <ul className="relative mx-auto hidden w-full max-w-[1400px] flex-wrap gap-x-8 gap-y-2 px-8 pb-10 md:flex">
        {PRINCIPLES.map((p) => (
          <li key={p} className="hud flex items-center gap-2 text-muted">
            <span className="h-1 w-1 rounded-full bg-accent" />
            {p}
          </li>
        ))}
      </ul>
    </section>
  );
}
