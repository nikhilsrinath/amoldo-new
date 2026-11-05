"use client";

import { useEffect, useRef } from "react";
import { gsap, useGSAP, MM, sceneTimeline, settle } from "@/lib/gsap";
import { TECH_STAGES } from "@/lib/content";
import { Index } from "../ui";

/**
 * 06 · Technology, when needed.
 *
 * A pinned, scroll-scrubbed scene around one 3D phone (pure CSS 3D: the body
 * is a stack of rounded slices, so the edge has real thickness when it turns).
 * The phone walks through the four beats of how tech enters the plan:
 *
 *   0.00  Scope    wireframe on screen, phone tilted in
 *   1.00  Build    the wireframe becomes a designed landing page
 *   1.75  Connect  the phone flips a full turn; checkout + integrations
 *   3.10  Support  phone settles face-on; live uptime + resolved tickets
 *
 * Timeline time == stage index, so the left-hand stage list reads it directly.
 */

const W = 260; // phone design size (scaled to fit the stage)
const H = 540;
const DEPTH = 24;
const SLICES = 12;
const STAGE_AT = [0, 1, 1.75, 3.1];
const TOTAL = 4;

const CHIPS: { s: number; side: "l" | "r"; top: string; t: string; k: string }[] = [
  { s: 0, side: "l", top: "22%", k: "Scope", t: "3 pages · 1 checkout" },
  { s: 0, side: "r", top: "58%", k: "Need", t: "Campaign landing page" },
  { s: 1, side: "r", top: "20%", k: "Lighthouse", t: "98 performance" },
  { s: 1, side: "l", top: "60%", k: "Build", t: "Mobile-first, editable" },
  { s: 2, side: "l", top: "18%", k: "Payments", t: "Gateway connected" },
  { s: 2, side: "r", top: "44%", k: "CRM", t: "Lead synced" },
  { s: 2, side: "l", top: "70%", k: "Pixel + GA4", t: "Purchase event fired" },
  { s: 3, side: "r", top: "22%", k: "Uptime", t: "99.98% this month" },
  { s: 3, side: "l", top: "62%", k: "Support", t: "Bug fixed in 14 min" },
];

export default function Technology() {
  const root = useRef<HTMLElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const fit = useRef<HTMLDivElement>(null);

  // Scale the fixed-size phone to whatever room the stage has.
  useEffect(() => {
    const b = box.current;
    const f = fit.current;
    if (!b || !f) return;
    const ro = new ResizeObserver(() => {
      // Mobile has no side chips, so the phone can take nearly the full stage.
      const mobile = window.matchMedia("(max-width: 767px)").matches;
      const s = mobile
        ? Math.min(1.25, b.clientHeight / H, b.clientWidth / (W + 16))
        : Math.min(1.05, b.clientHeight / (H + 60), b.clientWidth / (W + 140));
      f.style.setProperty("--fit", String(Math.max(0.45, s)));
    });
    ro.observe(b);
    return () => ro.disconnect();
  }, []);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const mm = gsap.matchMedia();
      mm.add(MM, (ctx) => {
        const { reduce, mobile } = ctx.conditions as Record<string, boolean>;
        const tl = sceneTimeline(root.current!, { end: mobile ? "+=260%" : "+=340%", scrub: 1, reduce });

        const items = q(".tstage");
        const setActive = () => {
          const t = tl.time();
          let idx = 0;
          STAGE_AT.forEach((at, i) => {
            if (t >= at - 0.15) idx = i;
          });
          items.forEach((el, i) => el.toggleAttribute("data-active", i === idx));
        };
        tl.eventCallback("onUpdate", setActive);

        const phone = q(".tphone")[0];
        const screens = q(".tscreen");

        // Base pose
        gsap.set(phone, { rotationY: -30, rotationX: 14, rotationZ: -4, y: 30 });
        gsap.set(screens.slice(1), { autoAlpha: 0 });
        gsap.set(q(".tchip"), { autoAlpha: 0, y: 14 });

        const chipsIn = (s: number, at: number) =>
          tl.to(q(`.tchip-${s}`), { autoAlpha: 1, y: 0, stagger: 0.06, duration: 0.18, ease: "power2.out" }, at);
        const chipsOut = (s: number, at: number) =>
          tl.to(q(`.tchip-${s}`), { autoAlpha: 0, y: -14, duration: 0.12, ease: "power1.in" }, at);

        // 0 → Scope
        tl.to(phone, { rotationY: -16, rotationX: 10, rotationZ: -2, y: 0, duration: 0.8, ease: "power1.inOut" }, 0)
          .from(q(".wf-line"), { scaleX: 0, transformOrigin: "left", stagger: 0.04, duration: 0.3 }, 0.05);
        chipsIn(0, 0.15);

        // 1 → Build: wireframe becomes a designed page
        chipsOut(0, 0.85);
        tl.to(phone, { rotationY: 20, rotationX: 6, rotationZ: 2, duration: 0.6, ease: "power2.inOut" }, 0.8)
          .to(screens[0], { autoAlpha: 0, duration: 0.15 }, 0.95)
          .to(screens[1], { autoAlpha: 1, duration: 0.15 }, 0.95)
          .from(q(".bd-in"), { y: 26, autoAlpha: 0, stagger: 0.05, duration: 0.25, ease: "power2.out" }, 1.0);
        chipsIn(1, 1.15);

        // 2 → Connect: full flip, screen swaps while the back faces us
        chipsOut(1, 1.55);
        tl.to(phone, { rotationY: 20 + 340, rotationX: 4, rotationZ: 0, duration: 0.85, ease: "power2.inOut" }, 1.55)
          .to(screens[1], { autoAlpha: 0, duration: 0.01 }, 1.9)
          .to(screens[2], { autoAlpha: 1, duration: 0.01 }, 1.9)
          .to(q(".pay-btn"), { autoAlpha: 0, duration: 0.1 }, 2.45)
          .fromTo(q(".pay-ok"), { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 0.15, ease: "back.out(2)" }, 2.45)
          .from(q(".int-row"), { x: -20, autoAlpha: 0, stagger: 0.08, duration: 0.18 }, 2.55);
        chipsIn(2, 2.3);

        // 3 → Support: settle face-on, live dashboard
        chipsOut(2, 2.95);
        tl.to(phone, { rotationY: 360, rotationX: 0, rotationZ: 0, duration: 0.6, ease: "power2.out" }, 2.95)
          .to(screens[2], { autoAlpha: 0, duration: 0.15 }, 3.0)
          .to(screens[3], { autoAlpha: 1, duration: 0.15 }, 3.0)
          .fromTo(q(".up-line"), { drawSVG: "0%" }, { drawSVG: "100%", duration: 0.4 }, 3.1)
          .from(q(".tk-row"), { y: 16, autoAlpha: 0, stagger: 0.07, duration: 0.18 }, 3.2);
        chipsIn(3, 3.2);

        // Progress rail follows the whole scene; short hold at the end
        tl.fromTo(q(".trail-fill"), { scaleY: 0 }, { scaleY: 1, duration: TOTAL - 0.4, ease: "none" }, 0).to({}, { duration: 0.4 }, TOTAL - 0.4);

        settle(tl, reduce);
        setActive();
      });
    },
    { scope: root },
  );

  return (
    <section
      id="technology"
      ref={root}
      aria-labelledby="tech-title"
      className="relative flex h-[100svh] min-h-[560px] items-center overflow-hidden"
    >
      <div aria-hidden className="pointer-events-none absolute right-[8%] top-1/2 h-[520px] w-[520px] -translate-y-1/2 rounded-full bg-red/[0.09] blur-[140px]" />
      <div aria-hidden className="dot-grid pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_50%_60%_at_70%_50%,#000,transparent)]" />

      <div className="relative mx-auto grid h-full w-full max-w-[1200px] grid-rows-[auto_1fr] gap-2 px-4 pb-10 pt-[72px] sm:px-8 md:grid-cols-[1fr_1.05fr] md:grid-rows-1 md:items-center md:gap-12 md:py-0">
        {/* Copy + stage list */}
        <div>
          <Index n="06" label="Technology, when needed" />
          <h2 id="tech-title" className="display mt-4 text-[clamp(1.4rem,2.8vw,2.6rem)] leading-tight">
            We don&apos;t lead with technology. <span className="text-muted">We lead with your objective.</span>
          </h2>
          <p className="mt-4 hidden max-w-[44ch] text-[15px] leading-relaxed text-text/75 md:block">
            When the plan needs tech, our in-house team builds it, connects it to your marketing and{" "}
            <span className="text-text">keeps supporting it after launch.</span>
          </p>

          <div className="relative mt-5 md:mt-8">
            <div aria-hidden className="absolute bottom-2 left-[5px] top-2 w-px bg-white/10">
              <div className="trail-fill h-full w-full origin-top bg-gradient-to-b from-red to-cyan" />
            </div>
            <ol className="space-y-1 md:space-y-2">
              {TECH_STAGES.map((s, i) => (
                <li key={s.t} className="tstage group relative pl-7" data-active={i === 0 ? "" : undefined}>
                  <span
                    aria-hidden
                    className="absolute left-0 top-[3px] h-[11px] w-[11px] rounded-full border border-white/25 bg-bg transition-all duration-300 group-data-[active]:border-red group-data-[active]:bg-red group-data-[active]:shadow-[0_0_12px_rgba(255,45,45,0.8)]"
                  />
                  <p className="hud text-muted transition-colors duration-300 group-data-[active]:text-text">
                    <span className="text-red/70">0{i + 1}</span> {s.t}
                  </p>
                  <div className="grid grid-rows-[0fr] opacity-0 transition-all duration-500 group-data-[active]:grid-rows-[1fr] group-data-[active]:opacity-100">
                    <p className="overflow-hidden text-[13px] leading-snug text-muted md:text-[14px]">
                      <span className="block py-1">{s.d}</span>
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* 3D phone stage */}
        <div
          ref={box}
          className="relative h-full min-h-0 md:h-[min(640px,86svh)]"
          role="img"
          aria-label="A phone turning in 3D as it shows a wireframe, then a finished landing page, then a checkout connected to payments, CRM and analytics, and finally a support dashboard with uptime and resolved tickets."
        >
          {/* Floating status chips */}
          {CHIPS.map((c, i) => (
            <div
              key={i}
              className={`tchip tchip-${c.s} glass absolute z-10 hidden rounded-lg px-3 py-2 md:block ${c.side === "l" ? "left-0 md:left-[2%]" : "right-0 md:right-[2%]"}`}
              style={{ top: c.top }}
            >
              <p className={`hud text-[9px] ${c.s === 3 ? "text-cyan" : "text-red"}`}>{c.k}</p>
              <p className="mt-0.5 flex items-center gap-1.5 whitespace-nowrap text-[12px] text-text md:text-[13px]">
                <Check className="text-[#3ddc84]" />
                {c.t}
              </p>
            </div>
          ))}

          {/* flex (not grid): an implicit grid row would grow to the phone's unscaled
              height and push it below centre whenever the stage is shorter than H */}
          <div className="absolute inset-0 flex items-center justify-center [perspective:1400px]">
            <div ref={fit} className="relative shrink-0" style={{ width: W, height: H, transform: "scale(var(--fit, 1))", transformStyle: "preserve-3d" }}>
              {/* Ground shadow */}
              <div aria-hidden className="absolute -bottom-10 left-1/2 h-10 w-[80%] -translate-x-1/2 rounded-[50%] bg-black/70 blur-xl" />

              <div className="tphone absolute inset-0" style={{ transformStyle: "preserve-3d" }}>
                {/* Body: rounded slices give the frame real thickness */}
                {Array.from({ length: SLICES }, (_, i) => {
                  const z = -DEPTH / 2 + (i * DEPTH) / (SLICES - 1);
                  const mid = 1 - Math.abs(i / (SLICES - 1) - 0.5) * 2;
                  return (
                    <div
                      key={i}
                      aria-hidden
                      className="absolute inset-0 rounded-[44px]"
                      style={{
                        transform: `translateZ(${z}px)`,
                        background: `linear-gradient(110deg, hsl(240 6% ${14 + mid * 10}%), hsl(240 6% ${8 + mid * 6}%) 45%, hsl(240 6% ${18 + mid * 12}%) 60%, hsl(240 6% ${9 + mid * 5}%))`,
                      }}
                    />
                  );
                })}

                {/* Back */}
                <div
                  aria-hidden
                  className="absolute inset-0 overflow-hidden rounded-[44px] border border-white/10 bg-[radial-gradient(120%_80%_at_30%_10%,#3a0d12,#120709_60%,#0a0a0e)] [backface-visibility:hidden]"
                  style={{ transform: `rotateY(180deg) translateZ(${DEPTH / 2 + 0.5}px)` }}
                >
                  <div className="absolute left-5 top-5 grid h-[92px] w-[92px] grid-cols-2 gap-2 rounded-[26px] border border-white/10 bg-black/50 p-3">
                    {[0, 1, 2].map((k) => (
                      <span key={k} className="rounded-full border-[3px] border-[#222] bg-[radial-gradient(circle_at_35%_35%,#30303c,#050508)]" />
                    ))}
                  </div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/brand/redant-icon.svg" alt="" className="absolute left-1/2 top-1/2 w-16 -translate-x-1/2 -translate-y-1/2 opacity-90" />
                  <p className="hud absolute bottom-10 w-full text-center text-[9px] text-white/40">Built by Red Ant</p>
                </div>

                {/* Front: bezel + screen */}
                <div
                  className="absolute inset-0 rounded-[44px] bg-black p-[9px] shadow-[inset_0_0_0_1.5px_rgba(255,255,255,0.12)] [backface-visibility:hidden]"
                  style={{ transform: `translateZ(${DEPTH / 2 + 0.5}px)` }}
                >
                  <div className="relative h-full w-full overflow-hidden rounded-[36px] bg-[#0a0a0f]">
                    <StatusBar />
                    <ScreenScope />
                    <ScreenBuild />
                    <ScreenConnect />
                    <ScreenSupport />
                    {/* Glass glare */}
                    <div aria-hidden className="pointer-events-none absolute inset-0 z-30 bg-[linear-gradient(115deg,rgba(255,255,255,0.10)_0%,transparent_32%,transparent_70%,rgba(255,255,255,0.04)_100%)]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────── Phone screens ───────── */

function StatusBar() {
  return (
    <div className="absolute inset-x-0 top-0 z-20 flex h-9 items-center justify-between px-6 font-mono text-[10px] text-white/80">
      <span>9:41</span>
      <span className="absolute left-1/2 top-2 h-[22px] w-[78px] -translate-x-1/2 rounded-full bg-black" />
      <span className="h-2 w-3.5 rounded-[2px] border border-white/70" />
    </div>
  );
}

function ScreenScope() {
  return (
    <div className="tscreen absolute inset-0 px-4 pb-5 pt-12">
      <p className="hud text-[9px] text-muted">Wireframe · v1</p>
      <div className="mt-3 rounded-lg border border-dashed border-white/25 p-3">
        <span className="wf-line block h-2.5 w-3/4 rounded bg-white/15" />
        <span className="wf-line mt-2 block h-1.5 w-full rounded bg-white/10" />
        <span className="wf-line mt-1.5 block h-1.5 w-2/3 rounded bg-white/10" />
        <span className="wf-line mt-3 block h-6 w-20 rounded border border-dashed border-white/30" />
      </div>
      <div className="mt-3 grid h-[120px] place-items-center rounded-lg border border-dashed border-white/20">
        <svg viewBox="0 0 40 40" className="h-8 w-8 text-white/25" aria-hidden>
          <path d="M2 2 38 38M38 2 2 38" stroke="currentColor" strokeWidth="1" />
        </svg>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {[0, 1].map((i) => (
          <div key={i} className="h-[70px] rounded-lg border border-dashed border-white/20 p-2">
            <span className="wf-line block h-1.5 w-2/3 rounded bg-white/10" />
          </div>
        ))}
      </div>
      <div className="mt-3 space-y-1.5 rounded-lg border border-dashed border-white/20 p-3">
        <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-white/35">Lead form</p>
        <span className="wf-line block h-5 rounded border border-white/15" />
        <span className="wf-line block h-5 rounded border border-white/15" />
      </div>
    </div>
  );
}

function ScreenBuild() {
  return (
    <div className="tscreen absolute inset-0 bg-[#0d0d12]">
      <div className="bd-in flex items-center justify-between px-4 pt-11">
        <span className="font-mono text-[11px] font-semibold tracking-tight text-text">aurum.</span>
        <span className="flex flex-col gap-[3px]">
          <span className="h-px w-4 bg-white/70" />
          <span className="h-px w-4 bg-white/70" />
        </span>
      </div>
      <div className="bd-in relative mx-3 mt-3 h-[170px] overflow-hidden rounded-2xl bg-[radial-gradient(120%_90%_at_80%_0%,#ff4d4d,#b3001b_45%,#2a0508)] p-4">
        <span className="absolute -bottom-6 -right-4 h-28 w-28 rounded-full bg-[radial-gradient(circle_at_35%_30%,#ffd2c2,#ff6b4d_40%,#7a0612)] shadow-[0_10px_30px_rgba(0,0,0,0.5)]" />
        <p className="hud text-[8px] text-white/80">New season</p>
        <p className="mt-1 max-w-[60%] font-mono text-[18px] font-semibold leading-[1.05] tracking-tight text-white">Glow that lasts all day</p>
        <span className="mt-3 inline-block rounded-full bg-white px-3 py-1.5 text-[10px] font-semibold text-black">Shop now</span>
      </div>
      <p className="bd-in hud mt-4 px-4 text-[8px] text-muted">Bestsellers</p>
      <div className="bd-in mt-2 grid grid-cols-2 gap-2 px-3">
        {[
          ["Day serum", "₹1,299", "#ffb59e"],
          ["Night balm", "₹999", "#c9b6ff"],
        ].map(([n, p, c]) => (
          <div key={n} className="rounded-xl border border-white/10 bg-white/[0.03] p-2">
            <div className="grid h-[70px] place-items-center rounded-lg bg-white/[0.04]">
              <span className="h-12 w-6 rounded-md" style={{ background: `linear-gradient(${c}, #333)` }} />
            </div>
            <p className="mt-1.5 text-[10px] text-text">{n}</p>
            <p className="font-mono text-[9px] text-muted">{p}</p>
          </div>
        ))}
      </div>
      <div className="bd-in mx-3 mt-3 flex items-center justify-between rounded-xl border border-red/40 bg-red/10 px-3 py-2.5">
        <span className="text-[10px] text-text">Get 10% off your first order</span>
        <span className="text-[10px] text-red">→</span>
      </div>
    </div>
  );
}

function ScreenConnect() {
  return (
    <div className="tscreen absolute inset-0 bg-[#0d0d12] px-4 pt-12">
      <p className="hud text-[9px] text-muted">Checkout</p>
      <div className="mt-3 flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
        <span className="grid h-12 w-10 place-items-center rounded-md bg-white/[0.05]">
          <span className="h-8 w-4 rounded-sm bg-[linear-gradient(#ffb59e,#333)]" />
        </span>
        <div className="flex-1">
          <p className="text-[11px] text-text">Day serum × 2</p>
          <p className="font-mono text-[10px] text-muted">₹2,598</p>
        </div>
      </div>
      <div className="mt-2 space-y-1 font-mono text-[10px] text-muted">
        <p className="flex justify-between">
          <span>Shipping</span>
          <span>Free</span>
        </p>
        <p className="flex justify-between text-text">
          <span>Total</span>
          <span>₹2,598</span>
        </p>
      </div>

      <div className="relative mt-4 h-11">
        <span className="pay-btn absolute inset-0 grid place-items-center rounded-xl bg-red text-[12px] font-semibold text-white shadow-[0_8px_24px_rgba(255,45,45,0.4)]">
          Pay ₹2,598
        </span>
        <span className="pay-ok absolute inset-0 flex items-center justify-center gap-2 rounded-xl border border-[#3ddc84]/50 bg-[#0f2a1c] text-[12px] font-semibold text-[#3ddc84] opacity-0">
          <Check /> Payment successful
        </span>
      </div>

      <p className="hud mt-5 text-[8px] text-muted">Connected to your marketing</p>
      <ul className="mt-2 space-y-1.5">
        {[
          ["Payment gateway", "captured"],
          ["CRM", "contact created"],
          ["Meta pixel", "Purchase"],
          ["GA4", "purchase event"],
          ["WhatsApp", "order update sent"],
        ].map(([a, b]) => (
          <li key={a} className="int-row flex items-center justify-between rounded-lg border border-cyan/20 bg-cyan/[0.05] px-2.5 py-1.5">
            <span className="flex items-center gap-1.5 text-[10px] text-text">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan shadow-[0_0_6px_#4de1ff]" />
              {a}
            </span>
            <span className="font-mono text-[8.5px] text-cyan/80">{b}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ScreenSupport() {
  return (
    <div className="tscreen absolute inset-0 bg-[#0b0d11] px-4 pt-12">
      <div className="flex items-center justify-between">
        <p className="hud text-[9px] text-cyan">Support desk</p>
        <span className="flex items-center gap-1.5 font-mono text-[9px] text-[#3ddc84]">
          <span className="tech-live h-1.5 w-1.5 rounded-full bg-[#3ddc84]" /> All normal
        </span>
      </div>
      <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
        <div className="flex items-end justify-between">
          <div>
            <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-muted">Uptime · 30d</p>
            <p className="font-mono text-[22px] leading-none text-text">99.98%</p>
          </div>
          <p className="font-mono text-[9px] text-muted">avg 0.8s load</p>
        </div>
        <svg viewBox="0 0 200 50" className="mt-2 w-full" aria-hidden>
          <path d="M0 50 V30 L20 26 L40 28 L60 20 L80 24 L100 14 L120 18 L140 10 L160 14 L180 6 L200 8 V50Z" fill="rgba(77,225,255,0.08)" />
          <path className="up-line" d="M0 30 L20 26 L40 28 L60 20 L80 24 L100 14 L120 18 L140 10 L160 14 L180 6 L200 8" fill="none" stroke="#4de1ff" strokeWidth="1.6" />
        </svg>
      </div>
      <p className="hud mt-4 text-[8px] text-muted">Resolved this week</p>
      <ul className="mt-2 space-y-1.5">
        {[
          ["Checkout bug fixed", "14m"],
          ["Security patches applied", "auto"],
          ["New offer page live", "2h"],
          ["Tracking re-verified", "1h"],
        ].map(([a, b]) => (
          <li key={a} className="tk-row flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-2">
            <span className="flex items-center gap-1.5 text-[10px] text-text">
              <Check className="text-[#3ddc84]" /> {a}
            </span>
            <span className="font-mono text-[9px] text-muted">{b}</span>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex items-center gap-2 rounded-xl border border-red/30 bg-red/10 px-3 py-2.5">
        <span className="grid h-6 w-6 place-items-center rounded-full bg-red text-[10px] font-bold text-white">R</span>
        <p className="text-[10px] leading-tight text-text">
          Red Ant tech team
          <span className="block text-muted">Replies in under 2 hrs</span>
        </p>
      </div>
    </div>
  );
}

function Check({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden className={`shrink-0 ${className}`}>
      <path d="m3 8.5 3 3 7-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
