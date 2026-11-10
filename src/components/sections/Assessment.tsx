"use client";

import { useEffect, useRef } from "react";
import { gsap, useGSAP, MM, ScrollTrigger, sceneTimeline, settle } from "@/lib/gsap";
import { BookButton } from "../shell/Booking";
import { Index } from "../ui";

/**
 * 10A · Free brand assessment.
 *
 * One pinned, scroll-scrubbed scene. One object: a 3D laptop (CSS 3D).
 * Layout is a strict column — label / stage / text slot — so nothing overlaps.
 *
 *   0.0 → 1.0  the closed laptop turns toward you and its lid opens
 *   1.0 → 2.4  the screen runs a brand scan: rows are checked, score climbs
 *   2.4 → 3.2  the weak rows are fixed, score rises, laptop squares up
 *   3.2 → 4.0  "report ready" lands; the text slot swaps to the offer + CTA
 *
 * 3D notes: the camera pitch (.lp-cam) wraps the yaw (.lp-rig) so the laptop
 * turns like it sits on a turntable. The lid hinges on its bottom edge
 * (closed = rotateX(-90deg)), the base hinges on its top edge (rotateX(90deg)).
 */

const LW = 600; // laptop width
const LH = 380; // lid height
const BD = 380; // base depth
const LT = 8; // lid thickness
const BT = 14; // base thickness
const FIT_W = 680;
const FIT_H = 580;

const ROWS = [
  { k: "Logo & identity", ok: true, a: "Distinct", b: "Distinct" },
  { k: "Website", ok: false, a: "4.8s load · no CTA", b: "0.9s load · clear CTA" },
  { k: "Social", ok: true, a: "Consistent", b: "Consistent" },
  { k: "Search", ok: false, a: "Page 3 on Google", b: "Page 1 · map pack" },
  { k: "Reviews", ok: false, a: "3.2★ · unanswered", b: "4.7★ · replied" },
];
const SCORE_A = 58;
const SCORE_B = 92;

export default function Assessment() {
  const root = useRef<HTMLElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const fit = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const b = box.current;
    const f = fit.current;
    if (!b || !f) return;
    const ro = new ResizeObserver(() => {
      const s = Math.min(b.clientWidth / FIT_W, b.clientHeight / FIT_H, 1.1);
      f.style.setProperty("--fit", String(Math.max(0.35, s)));
    });
    ro.observe(b);
    return () => ro.disconnect();
  }, []);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const scoreEl = q<HTMLElement>(".lp-score")[0];
      const mm = gsap.matchMedia();
      mm.add(MM, (ctx) => {
        const { reduce, mobile } = ctx.conditions as Record<string, boolean>;
        const tl = sceneTimeline(root.current!, { end: mobile ? "+=320%" : "+=420%", scrub: 1, reduce });

        // ── start pose
        gsap.set(q(".lp-cam"), { rotationX: -30 });
        gsap.set(q(".lp-rig"), { rotationY: -38, y: -70 });
        gsap.set(q(".lp-lid"), { rotationX: -90 });
        gsap.set(q(".lp-off"), { autoAlpha: 1 });
        gsap.set(q(".lp-row"), { autoAlpha: 0, x: -10 });
        gsap.set(q(".lp-mark-a, .lp-text-a"), { autoAlpha: 1 });
        gsap.set(q(".lp-mark-b, .lp-text-b"), { autoAlpha: 0 });
        gsap.set(q(".lp-scan"), { autoAlpha: 0, yPercent: 0 });
        gsap.set(q(".lp-ready"), { autoAlpha: 0, y: 16 });
        gsap.set(q(".slot-a"), { autoAlpha: 1, y: 0 });
        gsap.set(q(".slot-b"), { autoAlpha: 0, y: 24 });

        const score = { v: 0 };
        const paint = () => {
          if (scoreEl) scoreEl.textContent = String(Math.round(score.v));
        };

        // ── 1 · turn + open
        tl.to(q(".lp-rig"), { rotationY: -14, y: 0, duration: 1, ease: "power2.inOut" }, 0)
          .to(q(".lp-cam"), { rotationX: -16, duration: 1, ease: "power2.inOut" }, 0)
          .to(q(".lp-lid"), { rotationX: 6, duration: 0.85, ease: "power2.inOut" }, 0.1)
          .to(q(".lp-off"), { autoAlpha: 0, duration: 0.2 }, 0.8);

        // ── 2 · scan
        tl.to(q(".lp-scan"), { autoAlpha: 1, duration: 0.05 }, 1.05)
          .fromTo(q(".lp-scan"), { top: "0%" }, { top: "100%", duration: 1.2, ease: "none" }, 1.05)
          .to(q(".lp-scan"), { autoAlpha: 0, duration: 0.05 }, 2.25)
          .to(q(".lp-row"), { autoAlpha: 1, x: 0, stagger: 0.22, duration: 0.18, ease: "power2.out" }, 1.15)
          .fromTo(q(".lp-ring"), { drawSVG: "0%" }, { drawSVG: `${SCORE_A}%`, duration: 1.1, ease: "none" }, 1.15)
          .to(score, { v: SCORE_A, duration: 1.1, ease: "none", onUpdate: paint }, 1.15);

        // ── 3 · fix
        let k = 0;
        ROWS.forEach((r, i) => {
          if (r.ok) return;
          const at = 2.45 + k++ * 0.18;
          const row = q(".lp-row")[i];
          tl.to(row.querySelectorAll(".lp-mark-a, .lp-text-a"), { autoAlpha: 0, duration: 0.1 }, at).to(
            row.querySelectorAll(".lp-mark-b, .lp-text-b"),
            { autoAlpha: 1, duration: 0.12 },
            at + 0.06,
          );
        });
        tl.to(q(".lp-ring"), { drawSVG: `${SCORE_B}%`, stroke: "#ffffff", duration: 0.6, ease: "power1.inOut" }, 2.45)
          .to(score, { v: SCORE_B, duration: 0.6, ease: "power1.inOut", onUpdate: paint }, 2.45)
          .to(q(".lp-rig"), { rotationY: 0, duration: 0.7, ease: "power2.inOut" }, 2.4)
          .to(q(".lp-cam"), { rotationX: -8, duration: 0.7, ease: "power2.inOut" }, 2.4);

        // ── 4 · report ready + CTA
        tl.to(q(".lp-ready"), { autoAlpha: 1, y: 0, duration: 0.2, ease: "power2.out" }, 3.15)
          .to(q(".slot-a"), { autoAlpha: 0, y: -20, duration: 0.2, ease: "power1.in" }, 3.2)
          .to(q(".slot-b"), { autoAlpha: 1, y: 0, duration: 0.3, ease: "power2.out" }, 3.4)
          .to({}, { duration: 0.35 });

        settle(tl, reduce);
        if (reduce) {
          score.v = SCORE_B;
          paint();
        }

        // Pins must be measured top-to-bottom; re-sort in case this mounted late (e.g. HMR).
        const raf = requestAnimationFrame(() => {
          ScrollTrigger.sort();
          ScrollTrigger.refresh();
        });
        return () => cancelAnimationFrame(raf);
      });
    },
    { scope: root },
  );

  return (
    <section id="assessment" data-theme="light" ref={root} aria-labelledby="assess-title" className="relative h-[100svh] min-h-[620px] overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-[42%] h-[60vmin] w-[90vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/[0.05] blur-[140px]" />

      <div className="relative mx-auto flex h-full max-w-[1200px] flex-col px-4 pb-6 pt-20 sm:px-8 md:pb-8 md:pt-24">
        {/* label */}
        <Index n="09" label="Free brand assessment" className="justify-center" />

        {/* stage */}
        <div ref={box} className="relative min-h-0 flex-1" role="img" aria-label="A laptop opens and runs a scan of your brand: five areas are checked, three weak ones are fixed, and the brand score rises from 58 to 92 before the report is ready.">
          <div className="absolute inset-0 [perspective:1600px]">
            <div ref={fit} className="absolute left-1/2 top-1/2" style={{ width: FIT_W, height: FIT_H, marginLeft: -FIT_W / 2, marginTop: -FIT_H / 2, transform: "scale(var(--fit, 1))", transformStyle: "preserve-3d" }}>
              {/* floor shadow */}
              <div aria-hidden className="absolute left-1/2 top-[88%] h-20 w-[80%] -translate-x-1/2 rounded-[50%] bg-black/30 blur-2xl" />

              <div className="lp-cam absolute left-1/2 top-[67%]" style={{ transformStyle: "preserve-3d" }}>
                <div className="lp-rig absolute left-0 top-0" style={{ transformStyle: "preserve-3d" }}>
                  {/* hinge line sits at the origin; lid above, base toward the viewer */}
                  <div className="absolute" style={{ left: -LW / 2, top: 0, width: LW, height: 0, transformStyle: "preserve-3d" }}>
                    <Lid />
                    <Base />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* text slot: intro ↔ CTA, stacked in the same place */}
        <div className="relative h-[150px] shrink-0 md:h-[150px]">
          <div className="slot-a absolute inset-0 flex flex-col items-center justify-center text-center">
            <p className="display text-[clamp(1.5rem,3.4vw,2.8rem)] leading-tight">
              Your brand, <span className="text-muted">through your customers&apos; eyes.</span>
            </p>
            <p className="hud mt-4 text-[10px] text-muted">Keep scrolling to run the scan</p>
          </div>
          <div className="slot-b absolute inset-0 flex flex-col items-center justify-center text-center opacity-0">
            <h2 id="assess-title" className="display text-[clamp(1.4rem,3.2vw,2.6rem)] leading-tight">
              Book a free call. <span className="text-accent">Get your assessment in under 24&nbsp;hours.</span>
            </h2>
            <div className="mt-5 flex flex-col items-center gap-3 sm:flex-row sm:gap-5">
              <BookButton className="btn btn-accent h-12 px-7 text-[15px] md:h-14 md:text-base">Book my free call</BookButton>
              <span className="hud text-[10px] text-muted">Free · No obligation</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────── Laptop ───────── */

function Lid() {
  return (
    <div
      className="lp-lid absolute"
      style={{ left: 0, bottom: 0, width: LW, height: LH, transformOrigin: "50% 100%", transformStyle: "preserve-3d" }}
    >
      {/* edge thickness */}
      {[0.25, 0.5, 0.75].map((f) => (
        <div key={f} aria-hidden className="absolute inset-0 rounded-[18px] bg-[#2a2a2a]" style={{ transform: `translateZ(${-LT / 2 + LT * f}px)` }} />
      ))}

      {/* back of lid (visible while closed) */}
      <div
        aria-hidden
        className="absolute inset-0 grid place-items-center rounded-[18px] bg-[linear-gradient(160deg,#3a3a3a,#1d1d1d_55%,#2c2c2c)] [backface-visibility:hidden]"
        style={{ transform: `rotateY(180deg) translateZ(${LT / 2}px)` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/amoldo-icon-white.svg" alt="" className="w-16 opacity-80" />
      </div>

      {/* screen side */}
      <div
        data-theme="dark"
        className="absolute inset-0 rounded-[18px] bg-[#050505] p-[14px] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)] [backface-visibility:hidden]"
        style={{ transform: `translateZ(${LT / 2}px)` }}
      >
        <span aria-hidden className="absolute left-1/2 top-[5px] h-1 w-1 -translate-x-1/2 rounded-full bg-white/20" />
        <Screen />
      </div>
    </div>
  );
}

function Base() {
  return (
    <div
      className="absolute"
      style={{ left: 0, top: LT / 2 + 1, width: LW, height: BD, transformOrigin: "50% 0%", transform: "rotateX(90deg)", transformStyle: "preserve-3d" }}
    >
      {/* slab thickness (local -z points down once rotated) */}
      {[1, 0.66, 0.33].map((f) => (
        <div key={f} aria-hidden className="absolute inset-0 rounded-[20px] bg-[#232323]" style={{ transform: `translateZ(${-BT * f}px)` }} />
      ))}
      {/* top deck */}
      <div className="absolute inset-0 rounded-[20px] bg-[linear-gradient(180deg,#3b3b3b,#2b2b2b)] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
        {/* keyboard */}
        <div className="absolute left-[7%] right-[7%] top-[9%] grid grid-cols-14 gap-[5px] rounded-lg bg-black/40 p-[8px]">
          {Array.from({ length: 14 * 5 }, (_, i) => (
            <span key={i} className="h-[22px] rounded-[4px] bg-[#161616] shadow-[inset_0_-1px_0_rgba(255,255,255,0.06)]" />
          ))}
        </div>
        {/* trackpad */}
        <div className="absolute bottom-[8%] left-1/2 h-[30%] w-[38%] -translate-x-1/2 rounded-xl bg-black/25 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]" />
      </div>
    </div>
  );
}

function Screen() {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-[6px] bg-[#0b0b0b]">
      {/* app bar */}
      <div className="flex h-8 items-center gap-2 border-b border-white/[0.07] px-3">
        {[0, 1, 2].map((i) => (
          <span key={i} className="h-2 w-2 rounded-full bg-white/15" />
        ))}
        <span className="ml-3 flex h-5 flex-1 items-center rounded-md bg-white/[0.05] px-2 font-mono text-[10px] text-muted">
          <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-accent" />
          amoldo · brand scan — yourbrand.com
        </span>
      </div>

      <div className="grid h-[calc(100%-2rem)] grid-cols-[1fr_170px]">
        {/* rows */}
        <div className="relative border-r border-white/[0.06] px-4 pt-4">
          <p className="hud mb-2 text-[9px] text-muted">Audit</p>
          <ul className="space-y-[7px]">
            {ROWS.map((r) => (
              <li key={r.k} className="lp-row opacity-0 grid h-[40px] grid-cols-[18px_1fr_auto] items-center gap-3 rounded-lg border border-white/[0.07] bg-white/[0.025] px-3">
                <span className="relative h-[16px] w-[16px]">
                  <Mark ok={r.ok} cls="lp-mark-a" />
                  <Mark ok cls="lp-mark-b opacity-0" />
                </span>
                <span className="text-[12px] text-text">{r.k}</span>
                <span className="relative h-4 w-[150px] text-right font-mono text-[10px]">
                  <span className={`lp-text-a absolute inset-0 ${r.ok ? "text-text/80" : "text-white/45"}`}>{r.a}</span>
                  <span className="lp-text-b absolute inset-0 text-text/80 opacity-0">{r.b}</span>
                </span>
              </li>
            ))}
          </ul>
          {/* scan line */}
          <div aria-hidden className="lp-scan pointer-events-none absolute inset-x-0 top-0 h-px">
            <div className="absolute inset-x-0 -top-10 h-10 bg-gradient-to-b from-transparent to-accent/15" />
            <div className="absolute inset-x-0 top-0 h-[2px] bg-accent shadow-[0_0_14px_2px_rgba(255,255,255,0.5)]" />
          </div>
        </div>

        {/* score */}
        <div className="flex flex-col items-center px-3 pt-6">
          <p className="hud text-[9px] text-muted">Brand score</p>
          <div className="relative mt-3 h-[112px] w-[112px]">
            <svg viewBox="0 0 120 120" className="h-full w-full" aria-hidden>
              <circle cx="60" cy="60" r="50" fill="none" stroke="#ffffff" strokeOpacity="0.08" strokeWidth="8" />
              <circle className="lp-ring" cx="60" cy="60" r="50" fill="none" stroke="#8a8a8a" strokeWidth="8" strokeLinecap="round" transform="rotate(-90 60 60)" />
            </svg>
            <p className="absolute inset-0 grid place-items-center">
              <span className="lp-score font-mono text-[30px] font-semibold text-text">0</span>
            </p>
          </div>
          <div className="lp-ready mt-auto mb-4 w-full rounded-lg border border-text/40 bg-text/[0.08] px-2.5 py-2 text-center opacity-0">
            <p className="hud text-[8.5px] text-text">Report ready</p>
            <p className="mt-0.5 font-mono text-[10px] text-text">in 23h 41m</p>
          </div>
        </div>
      </div>

      {/* powered-off overlay */}
      <div aria-hidden className="lp-off absolute inset-0 bg-[#050505]" />
      {/* glass glare */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.06),transparent_35%)]" />
    </div>
  );
}

function Mark({ ok, cls }: { ok: boolean; cls: string }) {
  return ok ? (
    <svg viewBox="0 0 16 16" className={`${cls} absolute inset-0 text-text`} aria-hidden>
      <circle cx="8" cy="8" r="7" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1" />
      <path d="m4.8 8.2 2.2 2.2 4.2-4.6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ) : (
    <svg viewBox="0 0 16 16" className={`${cls} absolute inset-0 text-muted`} aria-hidden>
      <circle cx="8" cy="8" r="7" fill="currentColor" fillOpacity="0.18" stroke="currentColor" strokeWidth="1" />
      <path d="M8 4.5v4.2M8 11v.4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
