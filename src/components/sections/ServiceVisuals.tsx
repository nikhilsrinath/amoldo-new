"use client";

/**
 * Nine stage scenes, one per service (viewBox 480 × 360).
 *
 * Every scene is built from three depth layers (<L z={1|2|3}>). Services.tsx
 * drives two kinds of parallax through them:
 *   .lz  → scroll parallax (y drift per depth while the scene is on stage)
 *   .pz  → pointer parallax (x/y follow the cursor per depth)
 * Scene code never animates .lz/.pz directly, so nothing fights.
 *
 * build(el, tl) writes ~1 unit of scrubbed timeline (the scene assembling).
 * idle(el)      returns a paused, looping timeline played only while the
 *               scene is the active one (ambient life, not scroll-bound).
 *
 * Markup is authored in its FINAL state so no-JS / reduced-motion renders
 * the finished picture; build() sets the start states.
 */
import type { ReactNode } from "react";
import { gsap } from "@/lib/gsap";

type Build = (el: Element, tl: gsap.core.Timeline) => void;
type Idle = (el: Element) => gsap.core.Timeline;
export type ServiceVisual = { short: string; svg: ReactNode; build: Build; idle?: Idle };

const R = "#ff2d2d";
const RD = "#7a1b24";
const C = "#4de1ff";
const T = "#f2f2f5";
const M = "#8a8a99";
const D = "#2a2a36";
const PANEL = "#0e0e14";
const mono = { fontFamily: "var(--font-plex)", letterSpacing: "0.12em" } as const;

const sel = (el: Element) => gsap.utils.selector(el);
const one = (el: Element, s: string) => el.querySelector(s);

/** Depth layer. */
function L({ z, children }: { z: 1 | 2 | 3; children: ReactNode }) {
  return (
    <g className="lz" data-z={z}>
      <g className="pz" data-z={z}>
        {children}
      </g>
    </g>
  );
}

/** Rounded label chip, positioned by an outer group so the inner one can be animated freely. */
function Chip({
  x,
  y,
  w,
  label,
  cls = "",
  color = C,
  solid = false,
  h = 24,
}: {
  x: number;
  y: number;
  w: number;
  label: string;
  cls?: string;
  color?: string;
  solid?: boolean;
  h?: number;
}) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <g className={cls}>
        <rect width={w} height={h} rx={h / 2} fill={solid ? color : PANEL} fillOpacity={solid ? 1 : 0.9} stroke={color} strokeOpacity={solid ? 1 : 0.7} />
        <text x={w / 2} y={h / 2 + 3.5} fill={solid ? "#fff" : color} fontSize="9.5" textAnchor="middle" style={mono}>
          {label}
        </text>
      </g>
    </g>
  );
}

/** Scrub-safe counter: writes formatted text on every update, reversible. */
function count(tl: gsap.core.Timeline, target: Element | null, from: number, to: number, at: number, duration: number, fmt: (v: number) => string = (v) => String(Math.round(v))) {
  if (!target) return;
  const o = { v: from };
  target.textContent = fmt(from);
  tl.to(o, { v: to, duration, ease: "power1.out", onUpdate: () => void (target.textContent = fmt(o.v)) }, at);
}

/** Move `target` along `path` between `at` and `at + duration`, scrub-safe in both directions. */
function along(tl: gsap.core.Timeline, target: Element, path: SVGPathElement, at: number, duration: number, ease = "power1.inOut") {
  const ride = gsap.to(target, { motionPath: { path, align: path, alignOrigin: [0.5, 0.5] }, ease: "none", paused: true });
  tl.fromTo(ride, { progress: 0 }, { progress: 1, duration, ease }, at);
}

/** Gentle looping float, each target on its own phase. */
const bob = (targets: gsap.TweenTarget, vars: gsap.TweenVars, each: number, dur: number) =>
  gsap.to(targets, { ...vars, duration: dur, ease: "sine.inOut", stagger: { each, repeat: -1, yoyo: true } });

const kfmt = (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(Math.round(v)));

const HEART = "M0 7 -8 -1a4.6 4.6 0 0 1 8-5.6A4.6 4.6 0 0 1 8 -1Z";
const STAR = "M0 -9 2.6 -3 9 -2.8 4 1.6 5.6 8 0 4.4 -5.6 8 -4 1.6 -9 -2.8 -2.6 -3Z";
const CHECK = "M-4 0 -1 3 4 -3";

/* ───────────────────────── 1 · Strategy — the plan locks on ───────────────────────── */
const SX = 240;
const SY = 180;
const ST_NODES = [
  { x: 96, y: 74, t: "AUDIENCE", from: [-70, -40] },
  { x: 384, y: 74, t: "CHANNELS", from: [70, -40] },
  { x: 96, y: 290, t: "KPIs", from: [-70, 40] },
  { x: 384, y: 290, t: "DIRECTION", from: [70, 40] },
];
const ST_ROUTES = ST_NODES.map((n) => `M${n.x} ${n.y + (n.y < SY ? 17 : -17)} C ${n.x} ${SY}, ${(n.x + SX) / 2} ${SY}, ${SX + (n.x < SX ? -24 : 24)} ${SY}`);

const strategy: ServiceVisual = {
  short: "Strategy",
  svg: (
    <>
      <L z={1}>
        {[40, 80, 120, 160].map((r) => (
          <circle key={r} className="st-ring" cx={SX} cy={SY} r={r} fill="none" stroke={C} strokeOpacity={0.12 + (160 - r) / 900} />
        ))}
        <line className="st-cross" x1={SX - 170} y1={SY} x2={SX + 170} y2={SY} stroke={C} strokeOpacity="0.18" />
        <line className="st-cross" x1={SX} y1={SY - 170} x2={SX} y2={SY + 170} stroke={C} strokeOpacity="0.18" />
        {Array.from({ length: 48 }, (_, i) => {
          const a = (i / 48) * Math.PI * 2;
          const r2 = i % 4 === 0 ? 172 : 167;
          return (
            <line
              key={i}
              className="st-tick"
              x1={+(SX + Math.cos(a) * 162).toFixed(2)}
              y1={+(SY + Math.sin(a) * 162).toFixed(2)}
              x2={+(SX + Math.cos(a) * r2).toFixed(2)}
              y2={+(SY + Math.sin(a) * r2).toFixed(2)}
              stroke={i % 4 === 0 ? R : C}
              strokeOpacity={i % 4 === 0 ? 0.8 : 0.3}
            />
          );
        })}
        <g className="st-sweep">
          <path d={`M${SX} ${SY} L${SX + 160} ${SY} A160 160 0 0 0 ${SX + 122.6} ${SY - 102.8} Z`} fill={R} fillOpacity="0.08" />
          <line x1={SX} y1={SY} x2={SX + 160} y2={SY} stroke={R} strokeOpacity="0.7" />
        </g>
      </L>
      <L z={2}>
        {ST_ROUTES.map((d, i) => (
          <path key={i} className="st-route" d={d} fill="none" stroke={R} strokeOpacity="0.6" strokeWidth="1.25" />
        ))}
        {ST_ROUTES.map((_, i) => (
          <circle key={i} className="st-dot" r="3" fill={T} opacity="0" />
        ))}
      </L>
      <L z={3}>
        {ST_NODES.map((n) => (
          <g key={n.t} transform={`translate(${n.x - 56} ${n.y - 17})`}>
            <g className="st-node">
              <rect width="112" height="34" rx="8" fill={PANEL} stroke={R} strokeOpacity="0.9" />
              <circle cx="16" cy="17" r="3.5" fill={R} />
              <text x="28" y="21" fill={T} fontSize="10.5" style={mono}>
                {n.t}
              </text>
            </g>
          </g>
        ))}
        <g className="st-goal">
          <circle cx={SX} cy={SY} r="24" fill={R} fillOpacity="0.14" stroke={R} />
          <circle cx={SX} cy={SY} r="13" fill={R} />
          <circle cx={SX} cy={SY} r="4" fill={T} />
        </g>
        <text className="st-goal-lbl" x={SX} y={SY + 44} fill={T} fontSize="10" textAnchor="middle" style={mono}>
          BUSINESS GOAL
        </text>
      </L>
    </>
  ),
  build: (el, tl) => {
    const q = sel(el);
    tl.from(q(".st-ring"), { scale: 0, opacity: 0, svgOrigin: `${SX} ${SY}`, stagger: 0.06, duration: 0.35, ease: "expo.out" }, 0)
      .fromTo(q(".st-cross"), { drawSVG: "50% 50%" }, { drawSVG: "0% 100%", duration: 0.3, ease: "power2.out" }, 0.08)
      .from(q(".st-tick"), { opacity: 0, stagger: 0.004, duration: 0.08 }, 0.12)
      .from(q(".st-sweep"), { opacity: 0, duration: 0.2 }, 0.2)
      .from(q(".st-node"), { x: (i: number) => ST_NODES[i].from[0], y: (i: number) => ST_NODES[i].from[1], opacity: 0, stagger: 0.07, duration: 0.3, ease: "back.out(1.6)" }, 0.28)
      .fromTo(q(".st-route"), { drawSVG: "0%" }, { drawSVG: "100%", stagger: 0.05, duration: 0.3, ease: "power2.inOut" }, 0.5)
      .from(q(".st-goal"), { scale: 0, transformOrigin: "50% 50%", duration: 0.25, ease: "back.out(3)" }, 0.76)
      .from(q(".st-goal-lbl"), { opacity: 0, y: 8, duration: 0.15 }, 0.86);
  },
  idle: (el) => {
    const q = sel(el);
    const tl = gsap.timeline({ paused: true });
    tl.to(q(".st-sweep"), { rotation: -360, svgOrigin: `${SX} ${SY}`, duration: 5, repeat: -1, ease: "none" }, 0);
    const routes = q(".st-route");
    q(".st-dot").forEach((dot, i) => {
      const p = routes[i] as unknown as SVGPathElement;
      tl.to(dot, { motionPath: { path: p, align: p, alignOrigin: [0.5, 0.5] }, duration: 1.8, repeat: -1, repeatDelay: 0.6, ease: "power1.inOut" }, i * 0.45);
      tl.to(dot, { keyframes: { opacity: [0, 1, 1, 0] }, duration: 1.8, repeat: -1, repeatDelay: 0.6, ease: "none" }, i * 0.45);
    });
    return tl;
  },
};

/* ───────────────────────── 2 · SEO — climbing to the top result ───────────────────────── */
const SEO_SLOTS = [118, 170, 222, 274, 330];
const seo: ServiceVisual = {
  short: "SEO",
  svg: (
    <>
      <defs>
        <clipPath id="seo-clip">
          <rect x="60" y="108" width="360" height="226" />
        </clipPath>
      </defs>
      <L z={1}>
        {[
          [4, 70, "KEYWORDS"],
          [400, 132, "ON-PAGE"],
          [8, 246, "TECHNICAL"],
          [396, 296, "CONTENT"],
        ].map(([x, y, t]) => (
          <Chip key={t as string} x={x as number} y={y as number} w={78} label={t as string} cls="seo-tag" color={C} />
        ))}
      </L>
      <L z={2}>
        <g className="seo-win">
          <rect x="60" y="20" width="360" height="318" rx="14" fill={PANEL} stroke="#fff" strokeOpacity="0.1" />
          {[0, 1, 2].map((i) => (
            <circle key={i} cx={78 + i * 12} cy="36" r="3.5" fill={i === 0 ? R : D} />
          ))}
          <rect x="80" y="54" width="320" height="40" rx="20" fill="#14141c" stroke="#fff" strokeOpacity="0.14" />
          <circle cx="102" cy="73" r="7" fill="none" stroke={M} strokeWidth="1.5" />
          <line x1="107" y1="78" x2="112" y2="83" stroke={M} strokeWidth="1.5" />
          <text x="124" y="78" fill={T} fontSize="13" style={{ ...mono, letterSpacing: "0.04em" }}>
            <tspan className="seo-q">digital marketing chennai</tspan>
            <tspan className="seo-caret" fill={R}>
              |
            </tspan>
          </text>
        </g>
        <g clipPath="url(#seo-clip)">
          {[0, 1, 2, 3].map((i) => (
            <g key={i} className="seo-r" transform={`translate(0 ${SEO_SLOTS[i + 1]})`}>
              <rect x="80" y="0" width="320" height="44" rx="8" fill="#fff" fillOpacity="0.025" />
              <circle cx="98" cy="15" r="6" fill={D} />
              <rect x="112" y="12" width={150 - i * 18} height="6" rx="3" fill={M} />
              <rect x="112" y="24" width="70" height="3.5" rx="1.75" fill={C} fillOpacity="0.35" />
              <rect x="92" y="33" width="250" height="3.5" rx="1.75" fill="#3a3a44" />
            </g>
          ))}
          <g className="seo-you" transform={`translate(0 ${SEO_SLOTS[0]})`}>
            <rect className="seo-glow" x="80" y="0" width="320" height="44" rx="8" fill={R} fillOpacity="0.16" stroke={R} />
            <image href="/brand/redant-icon.svg" x="91" y="8" width="14" height="14" />
            <rect x="112" y="12" width="160" height="6" rx="3" fill={R} />
            <rect x="112" y="24" width="80" height="3.5" rx="1.75" fill={T} fillOpacity="0.5" />
            <rect x="92" y="33" width="262" height="3.5" rx="1.75" fill={T} fillOpacity="0.3" />
            <text x="388" y="27" fill={R} fontSize="13" textAnchor="end" fontWeight="600" style={mono}>
              #<tspan className="seo-rank">1</tspan>
            </text>
          </g>
        </g>
      </L>
      <L z={3}>
        <g className="seo-lens" transform="translate(372 150)">
          <g className="seo-lens-in">
            <circle r="30" fill="#fff" fillOpacity="0.04" stroke={T} strokeWidth="3" />
            <circle r="30" fill="none" stroke={R} strokeOpacity="0.5" strokeWidth="1" strokeDasharray="2 5" />
            <line x1="21" y1="21" x2="40" y2="40" stroke={T} strokeWidth="6" strokeLinecap="round" />
          </g>
        </g>
        <Chip x={164} y={300} w={110} h={26} label="PAGE ONE" cls="seo-chip" color={R} solid />
      </L>
    </>
  ),
  build: (el, tl) => {
    const q = sel(el);
    tl.from(q(".seo-win"), { opacity: 0, y: 24, duration: 0.2, ease: "power2.out" }, 0)
      .from(q(".seo-tag"), { opacity: 0, x: (i: number) => (i % 2 ? -40 : 40), stagger: 0.05, duration: 0.3, ease: "power3.out" }, 0.05)
      .fromTo(q(".seo-q"), { text: "" }, { text: "digital marketing chennai", duration: 0.3 }, 0.12)
      .fromTo(q(".seo-r"), { opacity: 0, y: (i: number) => SEO_SLOTS[i] + 20 }, { opacity: 1, y: (i: number) => SEO_SLOTS[i], stagger: 0.04, duration: 0.15, ease: "power2.out" }, 0.36)
      .fromTo(q(".seo-you"), { y: SEO_SLOTS[4] }, { y: SEO_SLOTS[0], duration: 0.4, ease: "power3.inOut" }, 0.52)
      .to(q(".seo-r"), { y: (i: number) => SEO_SLOTS[i + 1], duration: 0.4, ease: "power3.inOut", stagger: 0.015 }, 0.52)
      .fromTo(q(".seo-lens"), { x: 440, y: 360, opacity: 0 }, { x: 372, y: 150, opacity: 1, duration: 0.5, ease: "power2.out" }, 0.45)
      .fromTo(q(".seo-glow"), { fillOpacity: 0.04 }, { fillOpacity: 0.16, duration: 0.1 }, 0.88)
      .from(q(".seo-chip"), { scale: 0, opacity: 0, transformOrigin: "50% 50%", duration: 0.15, ease: "back.out(3)" }, 0.88);
    count(tl, one(el, ".seo-rank"), 9, 1, 0.52, 0.4);
  },
  idle: (el) => {
    const q = sel(el);
    const tl = gsap.timeline({ paused: true });
    tl.to(q(".seo-caret"), { opacity: 0, duration: 0.5, repeat: -1, yoyo: true, ease: "steps(1)" }, 0)
      .to(q(".seo-lens-in"), { y: -6, x: 3, duration: 1.6, repeat: -1, yoyo: true, ease: "sine.inOut" }, 0)
      .add(bob(q(".seo-tag"), { y: -5 }, 0.4, 2), 0);
    return tl;
  },
};

/* ───────────────────────── 3 · SEM — intent in, clicks out ───────────────────────── */
const SEM_KX = [26, 102, 178];
const SEM_PERF = "M270 312 L296 300 L322 305 L348 282 L374 276 L400 250 L426 238 L456 204";
const sem: ServiceVisual = {
  short: "SEM",
  svg: (
    <>
      <L z={1}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <line key={i} x1="270" y1={210 + i * 22} x2="456" y2={210 + i * 22} stroke="#fff" strokeOpacity="0.05" />
        ))}
        {[0, 1, 2, 3, 4].map((i) => (
          <rect key={i} className="sem-bg" x={276 + i * 38} y={320 - (30 + i * 14)} width="22" height={30 + i * 14} rx="3" fill="#fff" fillOpacity="0.035" />
        ))}
      </L>
      <L z={2}>
        <path className="sem-funnel" d="M40 66 H220 L150 136 V164 H110 V136 Z" fill="#fff" fillOpacity="0.03" stroke={C} strokeOpacity="0.55" strokeLinejoin="round" />
        <g className="sem-ad">
          <rect x="20" y="186" width="220" height="62" rx="9" fill={R} fillOpacity="0.13" stroke={R} />
          <rect x="32" y="199" width="26" height="14" rx="3" fill={R} />
          <text x="45" y="209.5" fill="#fff" fontSize="8.5" textAnchor="middle" style={mono}>
            AD
          </text>
          <rect x="66" y="202" width="128" height="6" rx="3" fill={T} />
          <rect x="32" y="222" width="180" height="4" rx="2" fill={M} />
          <rect x="32" y="232" width="130" height="4" rx="2" fill={M} fillOpacity="0.6" />
        </g>
        {[0, 1].map((i) => (
          <rect key={i} className="sem-row" x="20" y={260 + i * 26} width="220" height="18" rx="5" fill="#fff" fillOpacity="0.035" />
        ))}
        <path d="M296 118 A64 64 0 0 1 424 118" fill="none" stroke="#fff" strokeOpacity="0.1" strokeWidth="10" strokeLinecap="round" />
        <path className="sem-arc" d="M296 118 A64 64 0 0 1 424 118" fill="none" stroke={R} strokeWidth="10" strokeLinecap="round" />
        <line className="sem-needle" x1="360" y1="118" x2="360" y2="68" stroke={T} strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="360" cy="118" r="5" fill={T} />
        <text x="360" y="146" fill={M} fontSize="9.5" textAnchor="middle" style={mono}>
          BUDGET PACING
        </text>
        <path className="sem-area" d={`${SEM_PERF} L456 320 L270 320 Z`} fill={R} fillOpacity="0.12" />
        <path className="sem-perf" d={SEM_PERF} fill="none" stroke={R} strokeWidth="2" strokeLinejoin="round" />
        <circle className="sem-pt" r="3.5" fill={T} opacity="0" />
        <text x="270" y="178" fill={M} fontSize="9.5" style={mono}>
          CLICKS
        </text>
        <text className="sem-clicks" x="270" y="200" fill={T} fontSize="20" fontWeight="600" style={{ ...mono, letterSpacing: "0" }}>
          1,284
        </text>
      </L>
      <L z={3}>
        {["INTENT", "NEAR ME", "BUY NOW"].map((k, i) => (
          <Chip key={k} x={SEM_KX[i]} y={20} w={70} label={k} cls="sem-kw" />
        ))}
        <circle className="sem-ping" cx="200" cy="222" r="10" fill="none" stroke={R} strokeWidth="2" opacity="0" />
        <circle className="sem-ping2" cx="200" cy="222" r="10" fill="none" stroke={R} strokeWidth="1.5" opacity="0" />
        <g className="sem-cursor" transform="translate(200 222)">
          <g className="sem-cursor-in">
            <path d="M0 0 L0 18 L5 13 L9 22 L12 20.5 L8 12 L15 12 Z" fill={T} stroke={PANEL} strokeWidth="1.2" strokeLinejoin="round" />
          </g>
        </g>
      </L>
    </>
  ),
  build: (el, tl) => {
    const q = sel(el);
    tl.from(q(".sem-kw"), { opacity: 0, y: -24, stagger: 0.05, duration: 0.15, ease: "power2.out" }, 0)
      .fromTo(q(".sem-funnel"), { drawSVG: "0%", fillOpacity: 0 }, { drawSVG: "100%", fillOpacity: 0.03, duration: 0.25 }, 0.04)
      .to(q(".sem-kw"), { x: (i: number) => 130 - (SEM_KX[i] + 35), y: 92, scale: 0.25, opacity: 0, transformOrigin: "50% 50%", stagger: 0.06, duration: 0.24, ease: "power2.in" }, 0.24)
      .from(q(".sem-ad"), { y: -50, scale: 0.3, opacity: 0, transformOrigin: "50% 0%", duration: 0.25, ease: "back.out(1.5)" }, 0.44)
      .from(q(".sem-row"), { opacity: 0, x: -20, stagger: 0.04, duration: 0.15 }, 0.56)
      .from(q(".sem-bg"), { scaleY: 0, transformOrigin: "50% 100%", stagger: 0.03, duration: 0.2 }, 0.4)
      .fromTo(q(".sem-arc"), { drawSVG: "0%" }, { drawSVG: "72%", duration: 0.36, ease: "power2.out" }, 0.44)
      .fromTo(q(".sem-needle"), { rotation: -90, svgOrigin: "360 118" }, { rotation: 40, svgOrigin: "360 118", duration: 0.36, ease: "back.out(1.4)" }, 0.44)
      .fromTo(q(".sem-perf"), { drawSVG: "0%" }, { drawSVG: "100%", duration: 0.36 }, 0.54)
      .from(q(".sem-area"), { opacity: 0, duration: 0.3 }, 0.6)
      .fromTo(q(".sem-cursor"), { x: 470, y: 350, opacity: 0 }, { x: 200, y: 222, opacity: 1, duration: 0.26, ease: "power3.out" }, 0.6)
      .to(q(".sem-cursor-in"), { scale: 0.78, transformOrigin: "0% 0%", duration: 0.03, yoyo: true, repeat: 1 }, 0.87)
      .fromTo(q(".sem-ping"), { scale: 0.4, opacity: 1, transformOrigin: "50% 50%" }, { scale: 2.6, opacity: 0, duration: 0.12, ease: "power2.out" }, 0.88);
    count(tl, one(el, ".sem-clicks"), 0, 1284, 0.54, 0.4, (v) => Math.round(v).toLocaleString("en-IN"));
  },
  idle: (el) => {
    const q = sel(el);
    const tl = gsap.timeline({ paused: true });
    const perf = one(el, ".sem-perf") as SVGPathElement;
    tl.fromTo(q(".sem-ping2"), { scale: 0.6, opacity: 0.9, transformOrigin: "50% 50%" }, { scale: 3, opacity: 0, duration: 1.4, repeat: -1, ease: "power2.out" }, 0)
      .fromTo(q(".sem-pt"), { opacity: 1 }, { motionPath: { path: perf, align: perf, alignOrigin: [0.5, 0.5] }, duration: 2.6, repeat: -1, ease: "power1.inOut" }, 0);
    return tl;
  },
};

/* ───────────────────────── 4 · SMO — three profiles, one brand ───────────────────────── */
const SMO_CARDS = [
  { x: 30, y: 86, w: 120, h: 196, tag: "FB", z: 2 as const, messy: [-50, 40, -14], from: "#3a3a44" },
  { x: 170, y: 46, w: 140, h: 240, tag: "IG", z: 3 as const, messy: [10, -40, 9], from: C },
  { x: 330, y: 86, w: 120, h: 196, tag: "IN", z: 2 as const, messy: [60, 30, 16], from: RD },
];
function Profile({ w, h, tag }: { w: number; h: number; tag: string }) {
  const bh = h * 0.27;
  const r = w * 0.17;
  return (
    <>
      <rect width={w} height={h} rx="12" fill={PANEL} stroke="#fff" strokeOpacity="0.14" />
      <path className="smo-banner" d={`M12 0 H${w - 12} A12 12 0 0 1 ${w} 12 V${bh} H0 V12 A12 12 0 0 1 12 0Z`} fill={R} fillOpacity="0.85" />
      <text x="10" y="16" fill="#fff" fillOpacity="0.85" fontSize="8" style={mono}>
        {tag}
      </text>
      <circle cx={w / 2} cy={bh} r={r} fill={PANEL} stroke={R} strokeWidth="2" className="smo-ring" />
      <image href="/brand/redant-icon.svg" x={w / 2 - r * 0.62} y={bh - r * 0.62} width={r * 1.24} height={r * 1.24} className="smo-av" />
      <g className="smo-badge" transform={`translate(${w / 2 + r * 0.78} ${bh - r * 0.72})`}>
        <circle r="7" fill={C} />
        <path d={CHECK} fill="none" stroke={PANEL} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <rect className="smo-bar" x={w / 2 - w * 0.3} y={bh + r + 12} width={w * 0.6} height="7" rx="3.5" fill={T} />
      <rect className="smo-bar" x={w / 2 - w * 0.2} y={bh + r + 25} width={w * 0.4} height="4" rx="2" fill={C} fillOpacity="0.6" />
      <rect className="smo-bar" x="14" y={bh + r + 40} width={w - 28} height="4" rx="2" fill={M} />
      <rect className="smo-bar" x="14" y={bh + r + 50} width={w - 44} height="4" rx="2" fill={M} fillOpacity="0.6" />
      {[0, 1, 2].map((k) => (
        <rect key={k} className="smo-bar" x={14 + k * ((w - 28) / 3)} y={h - 44} width={(w - 28) / 3 - 4} height={30} rx="4" fill={k === 1 ? R : D} fillOpacity={k === 1 ? 0.5 : 1} />
      ))}
    </>
  );
}
const smo: ServiceVisual = {
  short: "SMO",
  svg: (
    <>
      <L z={1}>
        {[
          [30, 50, "#brand"],
          [400, 40, "#local"],
          [70, 330, "#growth"],
          [380, 326, "#chennai"],
          [240, 24, "#trust"],
        ].map(([x, y, t]) => (
          <text key={t as string} className="smo-tag" x={x as number} y={y as number} fill={M} fillOpacity="0.55" fontSize="11" textAnchor="middle" style={mono}>
            {t}
          </text>
        ))}
        <path className="smo-link" d="M90 130 C 150 100, 180 100, 240 108 S 330 100, 390 130" fill="none" stroke={C} strokeOpacity="0.5" strokeDasharray="3 4" />
      </L>
      {SMO_CARDS.map((c) => (
        <L key={c.tag} z={c.z}>
          <g transform={`translate(${c.x} ${c.y})`}>
            <g className="smo-card">
              <Profile w={c.w} h={c.h} tag={c.tag} />
            </g>
          </g>
        </L>
      ))}
      <L z={3}>
        <Chip x={182} y={312} w={116} label="CONSISTENT" cls="smo-chip" color={C} />
      </L>
    </>
  ),
  build: (el, tl) => {
    const q = sel(el);
    const cards = q(".smo-card");
    tl.from(cards, {
      x: (i: number) => SMO_CARDS[i].messy[0],
      y: (i: number) => SMO_CARDS[i].messy[1],
      rotation: (i: number) => SMO_CARDS[i].messy[2],
      opacity: 0.25,
      transformOrigin: "50% 50%",
      stagger: 0.06,
      duration: 0.5,
      ease: "power3.inOut",
    }, 0);
    cards.forEach((card, i) => {
      const c = sel(card);
      tl.fromTo(c(".smo-banner"), { fill: SMO_CARDS[i].from }, { fill: R, duration: 0.25 }, 0.35 + i * 0.05)
        .fromTo(c(".smo-ring"), { stroke: M }, { stroke: R, duration: 0.2 }, 0.4 + i * 0.05)
        .from(c(".smo-av"), { opacity: 0, scale: 0.4, transformOrigin: "50% 50%", duration: 0.2, ease: "back.out(2)" }, 0.45 + i * 0.05)
        .from(c(".smo-bar"), { scaleX: 0, transformOrigin: "0% 50%", stagger: 0.02, duration: 0.15 }, 0.2 + i * 0.05);
    });
    tl.from(q(".smo-badge"), { scale: 0, transformOrigin: "50% 50%", stagger: 0.06, duration: 0.15, ease: "back.out(4)" }, 0.72)
      .fromTo(q(".smo-link"), { drawSVG: "0%" }, { drawSVG: "100%", duration: 0.25 }, 0.66)
      .from(q(".smo-tag"), { opacity: 0, scale: 0.5, transformOrigin: "50% 50%", stagger: 0.04, duration: 0.2 }, 0.1)
      .from(q(".smo-chip"), { y: 20, opacity: 0, duration: 0.15, ease: "power2.out" }, 0.85);
  },
  idle: (el) => {
    const q = sel(el);
    const tl = gsap.timeline({ paused: true });
    tl.add(bob(q(".smo-badge"), { scale: 1.25, transformOrigin: "50% 50%" }, 0.3, 0.6), 0)
      .add(bob(q(".smo-tag"), { y: -8 }, 0.5, 2.4), 0)
      .to(q(".smo-link"), { strokeDashoffset: -28, duration: 1.2, repeat: -1, ease: "none" }, 0);
    return tl;
  },
};

/* ───────────────────────── 5 · SMM — the feed people stop on ───────────────────────── */
const SMM_BURSTS = [
  { x: 120, y: 70, k: "h", c: R },
  { x: 92, y: 150, k: "c", c: C },
  { x: 132, y: 226, k: "h", c: R },
  { x: 360, y: 96, k: "s", c: C },
  { x: 384, y: 176, k: "h", c: R },
  { x: 350, y: 300, k: "c", c: T },
];
function Reaction({ k, c }: { k: string; c: string }) {
  if (k === "h") return <path d={HEART} fill={c} transform="scale(1.4)" />;
  if (k === "c") return <path d="M-12 -9h24v14h-14l-7 6v-6h-3z" fill={c} />;
  return <path d="M-9 4 L9 -7 L3 9 L0 2 Z" fill={c} />;
}
const smm: ServiceVisual = {
  short: "SMM",
  svg: (
    <>
      <defs>
        <clipPath id="smm-clip">
          <rect x="188" y="34" width="104" height="292" rx="14" />
        </clipPath>
      </defs>
      <L z={1}>
        {[80, 125, 170].map((r) => (
          <circle key={r} className="smm-wave" cx="240" cy="180" r={r} fill="none" stroke={R} strokeOpacity="0.22" />
        ))}
      </L>
      <L z={2}>
        <g className="smm-phone">
          <rect x="178" y="20" width="124" height="320" rx="22" fill="#050507" stroke="#fff" strokeOpacity="0.22" />
          <rect x="222" y="27" width="36" height="4" rx="2" fill="#fff" fillOpacity="0.2" />
          <g clipPath="url(#smm-clip)">
            <g className="smm-feed">
              {Array.from({ length: 6 }, (_, i) => (
                <g key={i} transform={`translate(194 ${40 + i * 104})`}>
                  <circle cx="7" cy="7" r="6" fill={i % 2 ? C : R} fillOpacity="0.8" />
                  <rect x="18" y="4" width="40" height="5" rx="2.5" fill={T} fillOpacity="0.6" />
                  <rect y="18" width="92" height="62" rx="6" fill={i % 2 ? "#16161f" : R} fillOpacity={i % 2 ? 1 : 0.4} />
                  {i % 2 === 0 && <image href="/brand/redant-icon.svg" x="34" y="37" width="24" height="24" />}
                  <path d={HEART} transform="translate(8 90) scale(0.8)" fill={R} />
                  <rect x="20" y="86" width="30" height="4" rx="2" fill={M} />
                </g>
              ))}
            </g>
          </g>
        </g>
        {[0, 1, 2, 3, 4].map((i) => (
          <path key={i} className="smm-float" d={HEART} transform={`translate(${290 + (i % 2) * 12} 270)`} fill={R} opacity="0" />
        ))}
      </L>
      <L z={3}>
        {SMM_BURSTS.map((b, i) => (
          <g key={i} transform={`translate(${b.x} ${b.y})`}>
            <g className="smm-burst">
              <Reaction k={b.k} c={b.c} />
            </g>
          </g>
        ))}
        <g transform="translate(16 92)">
          <g className="smm-chip">
            <rect width="124" height="48" rx="10" fill={PANEL} stroke={R} strokeOpacity="0.6" />
            <path d={HEART} transform="translate(20 25)" fill={R} />
            <text x="36" y="20" fill={M} fontSize="8.5" style={mono}>
              LIKES
            </text>
            <text className="smm-likes" x="36" y="38" fill={T} fontSize="15" fontWeight="600" style={{ ...mono, letterSpacing: 0 }}>
              2.4k
            </text>
          </g>
        </g>
        <g transform="translate(336 222)">
          <g className="smm-chip">
            <rect width="128" height="48" rx="10" fill={PANEL} stroke={C} strokeOpacity="0.6" />
            <path d="M-9 4 L9 -7 L3 9 L0 2 Z" transform="translate(20 25)" fill={C} />
            <text x="36" y="20" fill={M} fontSize="8.5" style={mono}>
              SHARES
            </text>
            <text className="smm-shares" x="36" y="38" fill={T} fontSize="15" fontWeight="600" style={{ ...mono, letterSpacing: 0 }}>
              318
            </text>
          </g>
        </g>
        <g transform="translate(26 268)">
          {[0, 1, 2, 3].map((i) => (
            <circle key={i} className="smm-av" cx={14 + i * 18} cy="14" r="13" fill={[R, C, T, D][i]} fillOpacity={i === 2 ? 0.7 : 0.85} stroke={PANEL} strokeWidth="2.5" />
          ))}
          <text className="smm-av" x="0" y="46" fill={M} fontSize="8.5" style={mono}>
            COMMUNITY
          </text>
        </g>
      </L>
    </>
  ),
  build: (el, tl) => {
    const q = sel(el);
    tl.from(q(".smm-phone"), { y: 40, opacity: 0, duration: 0.22, ease: "power3.out" }, 0)
      .fromTo(q(".smm-feed"), { y: 0 }, { y: -312, duration: 0.85, ease: "power1.inOut" }, 0.1)
      .from(q(".smm-burst"), {
        x: (i: number) => 240 - SMM_BURSTS[i].x,
        y: (i: number) => 180 - SMM_BURSTS[i].y,
        scale: 0,
        opacity: 0,
        rotation: (i: number) => (i % 2 ? 40 : -40),
        transformOrigin: "50% 50%",
        stagger: 0.07,
        duration: 0.28,
        ease: "back.out(2.2)",
      }, 0.3)
      .from(q(".smm-chip"), { opacity: 0, x: (i: number) => (i ? 30 : -30), stagger: 0.1, duration: 0.2, ease: "power3.out" }, 0.36)
      .from(q(".smm-av"), { scale: 0, opacity: 0, transformOrigin: "50% 50%", stagger: 0.04, duration: 0.14, ease: "back.out(3)" }, 0.7);
    count(tl, one(el, ".smm-likes"), 0, 2400, 0.42, 0.5, kfmt);
    count(tl, one(el, ".smm-shares"), 0, 318, 0.5, 0.45);
  },
  idle: (el) => {
    const q = sel(el);
    const tl = gsap.timeline({ paused: true });
    q(".smm-float").forEach((h, i) => {
      tl.to(h, { keyframes: { y: [270, 230, 190, 150], opacity: [0, 1, 0.8, 0], scale: [0.6, 1, 1, 0.8] }, transformOrigin: "50% 50%", duration: 2.2, repeat: -1, ease: "none" }, i * 0.44);
      tl.to(h, { x: `+=${i % 2 ? 16 : -12}`, duration: 1.1, repeat: -1, yoyo: true, ease: "sine.inOut" }, i * 0.44);
    });
    tl.fromTo(q(".smm-wave"), { scale: 0.9, opacity: 1, svgOrigin: "240 180" }, { scale: 1.14, opacity: 0, svgOrigin: "240 180", duration: 2.4, ease: "sine.out", stagger: { each: 0.8, repeat: -1 } }, 0);
    tl.add(bob(q(".smm-burst"), { y: -6 }, 0.3, 1.8), 0);
    return tl;
  },
};

/* ───────────────────────── 6 · Content — the reader's journey ───────────────────────── */
const CT_PATH = "M28 300 C 110 300, 120 210, 190 198 S 290 108, 352 92 S 430 64, 452 44";
const CT_BLOCKS = [
  { t: "ARTICLE", x: 84, y: 230 },
  { t: "VIDEO", x: 190, y: 150 },
  { t: "POST", x: 286, y: 76 },
  { t: "GUIDE", x: 392, y: 132 },
];
const content: ServiceVisual = {
  short: "Content",
  svg: (
    <>
      <L z={1}>
        {[0, 1, 2].map((i) => (
          <rect key={i} className="ct-band" x={20 + i * 147} y="16" width="146" height="328" rx="10" fill="#fff" fillOpacity={i === 1 ? 0.03 : 0.015} />
        ))}
        {["AWARENESS", "CONSIDERATION", "DECISION"].map((t, i) => (
          <text key={t} className="ct-stage" x={93 + i * 147} y="334" fill={T} fontSize="9.5" textAnchor="middle" style={mono}>
            {t}
          </text>
        ))}
      </L>
      <L z={2}>
        <path className="ct-path" d={CT_PATH} fill="none" stroke="#fff" strokeOpacity="0.2" strokeWidth="1.5" strokeDasharray="2 5" />
        <path className="ct-lit" d={CT_PATH} fill="none" stroke={R} strokeWidth="2" strokeLinecap="round" />
        <g className="ct-trav" opacity="0">
          <circle className="ct-pulse" r="8" fill="none" stroke={R} opacity="0" />
          <circle r="14" fill={R} fillOpacity="0.2" />
          <circle r="6" fill={R} />
          <circle r="2" fill="#fff" />
        </g>
      </L>
      <L z={3}>
        {CT_BLOCKS.map((b) => (
          <g key={b.t} transform={`translate(${b.x - 34} ${b.y - 50})`}>
            <g className="ct-block">
              <rect className="ct-block-bg" width="68" height="46" rx="7" fill={PANEL} stroke={R} strokeOpacity="0.9" />
              {b.t === "VIDEO" ? (
                <path d="M29 11v15l12-7.5z" fill={R} />
              ) : (
                <>
                  <rect x="10" y="10" width="48" height="4" rx="2" fill={R} />
                  <rect x="10" y="18" width="34" height="3" rx="1.5" fill={M} />
                </>
              )}
              <text x="34" y="38" fill={T} fontSize="8" textAnchor="middle" style={mono}>
                {b.t}
              </text>
            </g>
          </g>
        ))}
        <Chip x={336} y={30} w={96} label="ENQUIRY" cls="ct-cta" color={R} solid />
      </L>
    </>
  ),
  build: (el, tl) => {
    const q = sel(el);
    const path = one(el, ".ct-path") as SVGPathElement;
    tl.from(q(".ct-band"), { opacity: 0, scaleY: 0.6, transformOrigin: "50% 100%", stagger: 0.06, duration: 0.25, ease: "power2.out" }, 0)
      .fromTo(q(".ct-stage"), { fill: M, opacity: 0 }, { opacity: 1, duration: 0.15, stagger: 0.05 }, 0.05)
      .fromTo(q(".ct-path"), { drawSVG: "0%" }, { drawSVG: "100%", duration: 0.3 }, 0.08)
      .from(q(".ct-block"), { y: -30, opacity: 0, scale: 0.8, transformOrigin: "50% 100%", stagger: 0.08, duration: 0.22, ease: "back.out(2)" }, 0.18)
      .fromTo(q(".ct-trav"), { opacity: 0 }, { opacity: 1, duration: 0.05 }, 0.34)
      .fromTo(q(".ct-lit"), { drawSVG: "0%" }, { drawSVG: "100%", duration: 0.56, ease: "power1.inOut" }, 0.34);
    along(tl, one(el, ".ct-trav")!, path, 0.34, 0.56);
    q(".ct-block-bg").forEach((b, i) => tl.fromTo(b, { stroke: "#3a3a44" }, { stroke: R, duration: 0.05 }, 0.42 + i * 0.12));
    q(".ct-stage").forEach((s, i) => tl.to(s, { fill: T, duration: 0.08 }, 0.36 + i * 0.2));
    tl.from(q(".ct-cta"), { scale: 0, opacity: 0, transformOrigin: "50% 50%", duration: 0.12, ease: "back.out(3)" }, 0.9);
  },
  idle: (el) => {
    const tl = gsap.timeline({ paused: true });
    tl.fromTo(one(el, ".ct-pulse"), { scale: 1, opacity: 0.9, transformOrigin: "50% 50%" }, { scale: 3.2, opacity: 0, duration: 1.4, repeat: -1, ease: "power2.out" }, 0)
      .add(bob(sel(el)(".ct-block"), { y: -4 }, 0.35, 1.8), 0);
    return tl;
  },
};

/* ───────────────────────── 7 · Email — right message, right segment ───────────────────────── */
const EM_STREAMS = ["M138 178 C 230 178, 240 76, 326 76", "M138 178 L326 178", "M138 178 C 230 178, 240 280, 326 280"];
const EM_SEGS = [
  { y: 76, t: "NEW LEADS", s: "OPENED", c: R },
  { y: 178, t: "CUSTOMERS", s: "CLICKED", c: C },
  { y: 280, t: "RE-ENGAGE", s: "REPLIED", c: R },
];
const email: ServiceVisual = {
  short: "Email",
  svg: (
    <>
      <L z={1}>
        {["09:00", "13:00", "18:00"].map((t, i) => (
          <g key={t} className="em-time">
            <line x1={180 + i * 80} y1="34" x2={180 + i * 80} y2="330" stroke="#fff" strokeOpacity="0.05" />
            <text x={180 + i * 80} y="26" fill={M} fontSize="8.5" textAnchor="middle" style={mono}>
              {t}
            </text>
          </g>
        ))}
      </L>
      <L z={2}>
        {EM_STREAMS.map((d, i) => (
          <g key={i}>
            <path className="em-stream" d={d} fill="none" stroke="#fff" strokeOpacity="0.16" strokeWidth="1.5" />
            <path className="em-flow" d={d} fill="none" stroke={R} strokeWidth="1.5" strokeDasharray="3 9" strokeLinecap="round" />
          </g>
        ))}
        {EM_STREAMS.map((_, i) => (
          <g key={i} className="em-pk" opacity="0">
            <rect x="-8" y="-5.5" width="16" height="11" rx="2" fill={T} />
            <path d="M-8 -4.5 0 1 8 -4.5" fill="none" stroke={PANEL} strokeWidth="1.2" />
          </g>
        ))}
        {EM_SEGS.map((s, i) => (
          <g key={s.t} transform={`translate(334 ${s.y - 14})`}>
            <g className="em-seg">
              {[0, 1, 2].map((k) => (
                <circle key={k} cx={14 + k * 18} cy="14" r="12" fill={s.c} fillOpacity={0.85 - k * 0.22} stroke={PANEL} strokeWidth="2.5" />
              ))}
              <text x="0" y="44" fill={T} fontSize="9" style={mono}>
                {s.t}
              </text>
              <text x="0" y="-8" fill={M} fontSize="7.5" style={mono}>
                SEGMENT {i + 1}
              </text>
            </g>
          </g>
        ))}
      </L>
      <L z={3}>
        <g transform="translate(40 146)">
          <g className="em-env">
            <rect width="98" height="66" rx="7" fill={PANEL} stroke={R} strokeWidth="1.5" />
            <g className="em-letter">
              <rect x="12" y="6" width="74" height="54" rx="4" fill={T} />
              <rect x="22" y="16" width="40" height="5" rx="2.5" fill={R} />
              <rect x="22" y="27" width="54" height="3" rx="1.5" fill={M} />
              <rect x="22" y="35" width="46" height="3" rx="1.5" fill={M} />
            </g>
            <path d="M0 66 L49 30 L98 66" fill={PANEL} stroke={R} strokeWidth="1.5" strokeLinejoin="round" />
            <rect x="0.75" y="36" width="96.5" height="29.25" rx="6" fill={PANEL} />
            <path d="M0 66 L49 34 L98 66" fill="none" stroke={R} strokeWidth="1.5" strokeLinejoin="round" />
            <path className="em-flap" d="M1 1 L49 36 L97 1 Z" fill={PANEL} stroke={R} strokeWidth="1.5" strokeLinejoin="round" />
          </g>
        </g>
        {EM_SEGS.map((s) => (
          <Chip key={s.s} x={392} y={s.y - 32} w={70} h={20} label={s.s} cls="em-st" color={s.c === C ? C : R} />
        ))}
      </L>
    </>
  ),
  build: (el, tl) => {
    const q = sel(el);
    const streams = q(".em-stream");
    tl.from(q(".em-env"), { scale: 0.5, opacity: 0, transformOrigin: "50% 50%", duration: 0.2, ease: "back.out(2)" }, 0)
      .from(q(".em-time"), { opacity: 0, y: -10, stagger: 0.05, duration: 0.2 }, 0.05)
      .fromTo(q(".em-flap"), { scaleY: 1 }, { scaleY: -1, transformOrigin: "50% 0%", duration: 0.14, ease: "power2.inOut" }, 0.16)
      .fromTo(q(".em-letter"), { y: 0 }, { y: -46, duration: 0.16, ease: "power2.out" }, 0.26)
      .to(q(".em-letter"), { opacity: 0, scale: 0.4, transformOrigin: "50% 50%", duration: 0.1 }, 0.42)
      .fromTo(streams, { drawSVG: "0%" }, { drawSVG: "100%", stagger: 0.05, duration: 0.3, ease: "power2.inOut" }, 0.36)
      .from(q(".em-flow"), { opacity: 0, duration: 0.1 }, 0.6)
      .from(q(".em-seg"), { opacity: 0, x: 24, stagger: 0.06, duration: 0.2, ease: "power3.out" }, 0.5);
    q(".em-pk").forEach((pk, i) => {
      const p = streams[i] as unknown as SVGPathElement;
      tl.fromTo(pk, { opacity: 0 }, { opacity: 1, duration: 0.03 }, 0.44 + i * 0.04).to(pk, { opacity: 0, duration: 0.05 }, 0.76 + i * 0.04);
      along(tl, pk, p, 0.44 + i * 0.04, 0.32, "power2.inOut");
    });
    tl.from(q(".em-st"), { scale: 0, opacity: 0, transformOrigin: "50% 50%", stagger: 0.05, duration: 0.14, ease: "back.out(3)" }, 0.8);
  },
  idle: (el) => {
    const tl = gsap.timeline({ paused: true });
    tl.to(sel(el)(".em-flow"), { strokeDashoffset: -48, duration: 1.2, repeat: -1, ease: "none" }, 0).add(bob(sel(el)(".em-st"), { y: -3 }, 0.3, 1.4), 0);
    return tl;
  },
};

/* ───────────────────────── 8 · ORM — sentiment turns ───────────────────────── */
const ORM_M = [
  [318, 28],
  [420, 60],
  [344, 98],
  [434, 140],
  [18, 300],
  [100, 322],
  [168, 300],
];
const orm: ServiceVisual = {
  short: "Reputation",
  svg: (
    <>
      <L z={1}>
        {ORM_M.map(([x, y], i) => (
          <g key={i} transform={`translate(${x} ${y})`}>
            <path className="orm-m" d="M0 0h40a6 6 0 0 1 6 6v12a6 6 0 0 1-6 6H14l-7 6v-6H6a6 6 0 0 1-6-6V6a6 6 0 0 1 6-6z" fill="none" stroke={C} strokeOpacity="0.7" />
            <rect className="orm-mb" x="8" y="10" width={20 + (i % 3) * 5} height="3.5" rx="1.75" fill={C} fillOpacity="0.6" />
          </g>
        ))}
      </L>
      <L z={2}>
        <g className="orm-card">
          <rect x="30" y="36" width="270" height="124" rx="12" fill={PANEL} stroke="#fff" strokeOpacity="0.12" />
          <circle cx="58" cy="66" r="12" fill="#3a3a44" />
          <rect x="78" y="58" width="80" height="5" rx="2.5" fill={T} fillOpacity="0.7" />
          {[0, 1, 2, 3, 4].map((i) => (
            <path key={i} className={`orm-star ${i < 2 ? "on" : "off"}`} d={STAR} transform={`translate(${84 + i * 21} 80)`} fill={R} />
          ))}
          <rect x="46" y="104" width="200" height="5" rx="2.5" fill={M} />
          <rect x="46" y="116" width="150" height="5" rx="2.5" fill="#3a3a44" />
          <rect x="46" y="128" width="170" height="5" rx="2.5" fill="#3a3a44" />
          <text className="orm-rate" x="284" y="82" fill={T} fontSize="28" fontWeight="600" textAnchor="end" style={{ ...mono, letterSpacing: "-0.02em" }}>
            4.8
          </text>
          <text x="284" y="98" fill={M} fontSize="8" textAnchor="end" style={mono}>
            AVG RATING
          </text>
        </g>
        <path d="M322 274 A58 58 0 0 1 438 274" fill="none" stroke="#3a3a44" strokeWidth="10" />
        <path d="M322 274 A58 58 0 0 1 351 224" fill="none" stroke={RD} strokeWidth="10" />
        <path d="M409 224 A58 58 0 0 1 438 274" fill="none" stroke={C} strokeWidth="10" />
        <line className="orm-needle" x1="380" y1="274" x2="380" y2="230" stroke={T} strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="380" cy="274" r="5" fill={T} />
        <text x="380" y="302" fill={M} fontSize="9" textAnchor="middle" style={mono}>
          SENTIMENT
        </text>
      </L>
      <L z={3}>
        <g className="orm-reply">
          <path d="M70 178 h214 a9 9 0 0 1 9 9 v44 a9 9 0 0 1 -9 9 h-182 l-15 13 v-13 h-17 a9 9 0 0 1 -9 -9 v-44 a9 9 0 0 1 9 -9z" fill={R} fillOpacity="0.14" stroke={R} />
          <circle cx="88" cy="198" r="10" fill={PANEL} stroke={R} />
          <image href="/brand/redant-icon.svg" x="81" y="191" width="14" height="14" />
          {[0, 1, 2].map((i) => (
            <circle key={i} className="orm-dot" cx={112 + i * 10} cy="198" r="3" fill={T} opacity="0" />
          ))}
          <rect className="orm-txt" x="106" y="194" width="130" height="5" rx="2.5" fill={T} />
          <rect className="orm-txt" x="80" y="214" width="190" height="4" rx="2" fill={T} fillOpacity="0.55" />
          <rect className="orm-txt" x="80" y="224" width="150" height="4" rx="2" fill={T} fillOpacity="0.55" />
        </g>
        <g transform="translate(48 286)">
          <circle className="orm-ping" r="6" fill="none" stroke={C} opacity="0" />
          <circle r="4" fill={C} />
          <text x="14" y="3.5" fill={C} fontSize="9" style={mono}>
            MONITORING
          </text>
        </g>
      </L>
    </>
  ),
  build: (el, tl) => {
    const q = sel(el);
    tl.from(q(".orm-card"), { y: 30, opacity: 0, duration: 0.2, ease: "power3.out" }, 0)
      .fromTo(q(".orm-m"), { stroke: RD }, { stroke: C, stagger: 0.06, duration: 0.15 }, 0.3)
      .fromTo(q(".orm-mb"), { fill: RD }, { fill: C, stagger: 0.06, duration: 0.15 }, 0.3)
      .from(q(".orm-m, .orm-mb"), { opacity: 0, duration: 0.15 }, 0.02)
      .from(q(".orm-star.on"), { scale: 0, transformOrigin: "50% 50%", stagger: 0.05, duration: 0.12, ease: "back.out(3)" }, 0.1)
      .fromTo(q(".orm-needle"), { rotation: -70, svgOrigin: "380 274" }, { rotation: 62, svgOrigin: "380 274", duration: 0.55, ease: "power2.inOut" }, 0.2);
    q(".orm-star.off").forEach((s, i) => {
      const at = 0.24 + i * 0.12;
      tl.fromTo(s, { fill: "#3a3a44", scaleX: 1, transformOrigin: "50% 50%" }, { scaleX: 0, duration: 0.05, ease: "power1.in", immediateRender: true }, at)
        .set(s, { fill: R }, at + 0.05)
        .to(s, { scaleX: 1, duration: 0.05, ease: "power1.out" }, at + 0.05);
    });
    count(tl, one(el, ".orm-rate"), 2.1, 4.8, 0.2, 0.5, (v) => v.toFixed(1));
    tl.from(q(".orm-reply"), { y: 24, opacity: 0, duration: 0.18, ease: "power3.out" }, 0.55)
      .fromTo(q(".orm-dot"), { opacity: 0 }, { opacity: 1, stagger: 0.03, duration: 0.03 }, 0.62)
      .to(q(".orm-dot"), { opacity: 0, duration: 0.03 }, 0.76)
      .from(q(".orm-txt"), { scaleX: 0, transformOrigin: "0% 50%", stagger: 0.04, duration: 0.12 }, 0.77);
  },
  idle: (el) => {
    const tl = gsap.timeline({ paused: true });
    tl.fromTo(one(el, ".orm-ping"), { scale: 1, opacity: 0.9, transformOrigin: "50% 50%" }, { scale: 3.4, opacity: 0, duration: 1.5, repeat: -1, ease: "power2.out" }, 0);
    // A shimmer that runs across the five stars every few seconds.
    const shimmer = gsap.timeline({ repeat: -1, repeatDelay: 2.2 });
    shimmer.to(sel(el)(".orm-star"), { scale: 1.2, transformOrigin: "50% 50%", duration: 0.18, ease: "sine.out", yoyo: true, repeat: 1, stagger: 0.07 });
    tl.add(shimmer, 0.4);
    return tl;
  },
};

/* ───────────────────────── 9 · Analytics — measure, learn, improve ───────────────────────── */
const AN_BARS = [64, 92, 78, 120, 108, 146, 170];
const AN_LINE = "M44 238 L82 226 L120 232 L158 198 L196 206 L234 166 L272 140 L300 116";
const AN_KPI = [
  { t: "SESSIONS", v: 12400, f: kfmt },
  { t: "LEADS", v: 386, f: (v: number) => String(Math.round(v)) },
  { t: "CONV.", v: 3.1, f: (v: number) => `${v.toFixed(1)}%` },
];
const LX = 404;
const LY = 186;
const analytics: ServiceVisual = {
  short: "Analytics",
  svg: (
    <>
      <L z={1}>
        {Array.from({ length: 7 }, (_, i) => (
          <line key={i} x1="34" y1={140 + i * 30} x2="306" y2={140 + i * 30} stroke="#fff" strokeOpacity="0.045" />
        ))}
      </L>
      <L z={2}>
        <rect className="an-panel" x="20" y="18" width="300" height="324" rx="14" fill={PANEL} stroke="#fff" strokeOpacity="0.1" />
        {AN_KPI.map((k, i) => (
          <g key={k.t} transform={`translate(${34 + i * 94} 32)`}>
            <g className="an-tile">
              <rect width="84" height="58" rx="8" fill="#fff" fillOpacity="0.035" stroke={i === 1 ? R : "#fff"} strokeOpacity={i === 1 ? 0.7 : 0.08} />
              <text x="10" y="20" fill={M} fontSize="7.5" style={mono}>
                {k.t}
              </text>
              <text className="an-k" x="10" y="44" fill={i === 1 ? R : T} fontSize="17" fontWeight="600" style={{ ...mono, letterSpacing: 0 }}>
                {k.f(k.v)}
              </text>
            </g>
          </g>
        ))}
        {AN_BARS.map((h, i) => (
          <rect key={i} className="an-bar" x={34 + i * 39} y={326 - h} width="22" height={h} rx="3" fill={i === AN_BARS.length - 1 ? R : D} />
        ))}
        <path className="an-line" d={AN_LINE} fill="none" stroke={C} strokeWidth="2" strokeLinejoin="round" />
        <g className="an-pt" opacity="0">
          <circle r="9" fill={C} fillOpacity="0.2" />
          <circle r="4" fill={C} />
        </g>
        <line className="an-scan" x1="40" y1="110" x2="40" y2="330" stroke={C} strokeOpacity="0.5" opacity="0" />
        <g className="an-loop">
          <circle cx={LX} cy={LY} r="54" fill="none" stroke={R} strokeOpacity="0.25" strokeDasharray="3 6" />
          <g className="an-spin">
            {[0, 120, 240].map((a) => (
              <g key={a} transform={`rotate(${a} ${LX} ${LY})`}>
                <path d={`M${LX} ${LY - 54} A54 54 0 0 1 ${LX + 46.8} ${LY - 27}`} fill="none" stroke={R} strokeWidth="2.5" strokeLinecap="round" />
                <path d={`M${LX + 41} ${LY - 34} l6 7.5 -9.5 1.5`} fill="none" stroke={R} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </g>
            ))}
          </g>
        </g>
        {[
          ["MEASURE", LX, LY - 66],
          ["LEARN", LX + 50, LY + 70],
          ["IMPROVE", LX - 50, LY + 70],
        ].map(([t, x, y]) => (
          <text key={t as string} className="an-lbl" x={x as number} y={y as number} fill={T} fontSize="9" textAnchor="middle" style={mono}>
            {t}
          </text>
        ))}
      </L>
      <L z={3}>
        <Chip x={196} y={98} w={92} label="OPTIMISE" cls="an-tip" color={R} solid />
      </L>
    </>
  ),
  build: (el, tl) => {
    const q = sel(el);
    const line = one(el, ".an-line") as SVGPathElement;
    tl.from(q(".an-panel"), { opacity: 0, scale: 0.94, transformOrigin: "50% 50%", duration: 0.2, ease: "power2.out" }, 0)
      .from(q(".an-tile"), { opacity: 0, y: 16, stagger: 0.06, duration: 0.18, ease: "power3.out" }, 0.08)
      .from(q(".an-bar"), { scaleY: 0, transformOrigin: "50% 100%", stagger: 0.04, duration: 0.3, ease: "power3.out" }, 0.22)
      .fromTo(q(".an-line"), { drawSVG: "0%" }, { drawSVG: "100%", duration: 0.36, ease: "power1.inOut" }, 0.44)
      .fromTo(q(".an-pt"), { opacity: 0 }, { opacity: 1, duration: 0.05 }, 0.44)
      .fromTo(q(".an-loop"), { rotation: -180, opacity: 0, svgOrigin: `${LX} ${LY}` }, { rotation: 0, opacity: 1, svgOrigin: `${LX} ${LY}`, duration: 0.7, ease: "power2.out" }, 0.15)
      .from(q(".an-lbl"), { opacity: 0, y: 6, stagger: 0.1, duration: 0.12 }, 0.4)
      .from(q(".an-tip"), { scale: 0, opacity: 0, transformOrigin: "50% 100%", duration: 0.14, ease: "back.out(3)" }, 0.84);
    along(tl, one(el, ".an-pt")!, line, 0.44, 0.36);
    q(".an-k").forEach((k, i) => count(tl, k, 0, AN_KPI[i].v, 0.14 + i * 0.05, 0.5, AN_KPI[i].f));
  },
  idle: (el) => {
    const q = sel(el);
    const tl = gsap.timeline({ paused: true });
    tl.to(q(".an-spin"), { rotation: 360, svgOrigin: `${LX} ${LY}`, duration: 9, repeat: -1, ease: "none" }, 0)
      .fromTo(q(".an-scan"), { attr: { x1: 40, x2: 40 } }, { attr: { x1: 300, x2: 300 }, duration: 2.6, repeat: -1, repeatDelay: 0.8, ease: "power1.inOut" }, 0)
      .to(q(".an-scan"), { keyframes: { opacity: [0, 1, 1, 0] }, duration: 2.6, repeat: -1, repeatDelay: 0.8, ease: "none" }, 0)
      .to(q(".an-tip"), { y: -5, duration: 1.3, repeat: -1, yoyo: true, ease: "sine.inOut" }, 0);
    return tl;
  },
};

export const SERVICE_VISUALS: ServiceVisual[] = [strategy, seo, sem, smo, smm, content, email, orm, analytics];
