"use client";

import type { ReactNode } from "react";
import { gsap } from "@/lib/gsap";

/**
 * Nine small, looping "proof" demos for the Services section — each one shows
 * the service doing its job rather than an abstract illustration.
 *
 * Every demo is plain HTML/SVG (crisp at any size) plus a builder that returns
 * a paused, infinitely repeating GSAP timeline. Each timeline carries a
 * `rest` label: the fully assembled frame, used as the still for reduced motion.
 *
 * All selectors are scoped to the demo's own root (`q`), so a demo can be
 * rendered more than once on the page (desktop stage + mobile card).
 */

export type Demo = { node: ReactNode; build: (el: HTMLElement) => gsap.core.Timeline };

const loop = () => gsap.timeline({ paused: true, repeat: -1, defaults: { ease: "power3.out" } });
const sel = (el: HTMLElement) => gsap.utils.selector(el);

/* ── shared bits ─────────────────────────────────────────────────────────── */

const Bar = ({ w, className = "" }: { w: string; className?: string }) => (
  <span className={`block h-[6px] rounded-full bg-white/[0.12] ${className}`} style={{ width: w }} />
);

function Cursor({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`cur pointer-events-none absolute z-20 h-6 w-6 drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)] ${className}`}>
      <path d="M5 3l14 8-6.2 1.6L10 19z" fill="var(--text)" stroke="var(--bg)" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

function Star({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden>
      <path d="M10 1.6l2.6 5.3 5.8.8-4.2 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.6 7.7l5.8-.8z" fill="currentColor" />
    </svg>
  );
}

function Heart({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.3 3 4.5 6.7 4.5c2.2 0 3.6 1.2 5.3 3.2 1.7-2 3.1-3.2 5.3-3.2 3.7 0 5.8 3.8 4.3 7.3C19.5 16.4 12 21 12 21z" fill="currentColor" />
    </svg>
  );
}

/** Tween a number inside an element's text. */
function count(tl: gsap.core.Timeline, el: Element, from: number, to: number, at: number | string, opts: { dur?: number; dp?: number; prefix?: string; suffix?: string } = {}) {
  const { dur = 1.2, dp = 0, prefix = "", suffix = "" } = opts;
  const o = { v: from };
  const fmt = (v: number) => prefix + v.toLocaleString("en-IN", { minimumFractionDigits: dp, maximumFractionDigits: dp }) + suffix;
  tl.fromTo(
    o,
    { v: from },
    { v: to, duration: dur, ease: "power2.out", onUpdate: () => void (el.textContent = fmt(o.v)), onStart: () => void (el.textContent = fmt(from)) },
    at,
  );
}

/* ── 1 · Strategy: one goal, every channel pulling the same way ──────────── */

const CH = [
  { label: "Search", x: 16, y: 18 },
  { label: "Social", x: 84, y: 18 },
  { label: "Content", x: 16, y: 72 },
  { label: "Email", x: 84, y: 72 },
];
const strategy: Demo = {
  node: (
    <div className="relative aspect-[4/3] w-full">
      <svg viewBox="0 0 400 300" className="absolute inset-0 h-full w-full overflow-visible">
        {CH.map((c) => (
          <g key={c.label}>
            <path className="ln" d={`M200 135 L${c.x * 4} ${c.y * 3}`} stroke="var(--text)" strokeOpacity="0.2" strokeWidth="1.5" strokeDasharray="3 5" fill="none" />
            <circle className="pulse" r="3.5" fill="var(--accent)" cx={c.x * 4} cy={c.y * 3} />
          </g>
        ))}
      </svg>
      {CH.map((c) => (
        <span
          key={c.label}
          className="chan absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/12 bg-bg px-3.5 py-1.5 font-mono text-[12px] text-text/85"
          style={{ left: `${c.x}%`, top: `${c.y}%` }}
        >
          {c.label}
        </span>
      ))}
      <div className="goal absolute left-1/2 top-[45%] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-accent px-5 py-3 text-center text-on-accent shadow-[0_18px_40px_-16px_rgba(0,0,0,0.5)]">
        <span className="block font-mono text-[10px] uppercase tracking-[0.18em] opacity-80">Business goal</span>
        <span className="mt-0.5 block font-mono text-[15px] font-semibold">More qualified leads</span>
      </div>
      <div className="absolute inset-x-[8%] bottom-0 grid grid-cols-3 gap-3">
        {["Reach", "Leads", "Revenue"].map((k, i) => (
          <div key={k} className="kpi">
            <div className="flex justify-between font-mono text-[11px] text-muted">
              <span>{k}</span>
              <span className="kv text-text">0%</span>
            </div>
            <div className="mt-1.5 h-[5px] overflow-hidden rounded-full bg-white/10">
              <div className="kf h-full origin-left rounded-full bg-accent" style={{ width: `${[78, 64, 52][i]}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  ),
  build(el) {
    const q = sel(el);
    const tl = loop();
    tl.fromTo(q(".goal"), { scale: 0.6, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.7, ease: "back.out(1.8)" }, 0)
      .fromTo(q(".ln"), { drawSVG: "0%" }, { drawSVG: "100%", duration: 0.7, stagger: 0.12, ease: "power2.inOut" }, 0.35)
      .fromTo(q(".chan"), { scale: 0.5, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.5, stagger: 0.12, ease: "back.out(2)" }, 0.75)
      .fromTo(q(".kpi"), { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.1 }, 1.2)
      .fromTo(q(".kf"), { scaleX: 0 }, { scaleX: 1, duration: 1.4, stagger: 0.15, ease: "power2.out" }, 1.4);
    q(".kv").forEach((v, i) => count(tl, v, 0, [78, 64, 52][i], 1.4 + i * 0.15, { dur: 1.4, suffix: "%" }));
    // signal travelling inward from each channel to the goal
    q(".pulse").forEach((p, i) => {
      const c = CH[i];
      tl.fromTo(p, { attr: { cx: c.x * 4, cy: c.y * 3 }, autoAlpha: 0 }, { attr: { cx: 200, cy: 135 }, autoAlpha: 1, duration: 0.9, ease: "power1.in", repeat: 2, repeatDelay: 0.25 }, 1.3 + i * 0.2);
    });
    tl.addLabel("rest", 3.2)
      .to(q(".pulse"), { autoAlpha: 0, duration: 0.2 }, "rest")
      .to(el.children, { autoAlpha: 0, duration: 0.5, ease: "power2.in" }, "+=1.6")
      .set(el.children, { autoAlpha: 1 });
    return tl;
  },
};

/* ── 2 · SEO: your result climbs to the top of the page ──────────────────── */

const SEO_ROWS = 5;
const seo: Demo = {
  node: (
    <div className="w-full">
      <div className="flex items-center gap-3 rounded-full border border-white/12 bg-bg px-4 py-3">
        <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-muted" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="10.5" cy="10.5" r="6.5" />
          <path d="M15.5 15.5 21 21" />
        </svg>
        <span className="font-mono text-[13px] text-text">
          <span className="qry" />
          <span className="caret ml-px inline-block h-[1.05em] w-px translate-y-[2px] bg-accent" />
        </span>
      </div>
      <div className="relative mt-4" style={{ height: SEO_ROWS * 58 }}>
        {Array.from({ length: SEO_ROWS }, (_, i) => {
          const you = i === SEO_ROWS - 1;
          return (
            <div
              key={i}
              data-start={i}
              className={`row absolute inset-x-0 top-0 flex h-[50px] items-center gap-3 rounded-xl px-4 ${
                you ? "you z-10 border border-accent/70 bg-accent/[0.07]" : "border border-white/[0.06] bg-white/[0.02]"
              }`}
            >
              <span className={`rk w-7 font-mono text-[12px] ${you ? "text-accent" : "text-muted"}`}>#{i + 1}</span>
              <span className="flex-1">
                {you ? (
                  <>
                    <span className="block font-mono text-[12.5px] text-text">yourbrand.in</span>
                    <Bar w="62%" className="mt-1.5 !bg-accent/40" />
                  </>
                ) : (
                  <>
                    <Bar w={`${[48, 40, 54, 44][i]}%`} />
                    <Bar w={`${[70, 62, 66, 58][i]}%`} className="mt-1.5 opacity-60" />
                  </>
                )}
              </span>
              {you && (
                <span className="arrow font-mono text-[11px] text-accent">
                  ▲ <span className="up">0</span>
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  ),
  build(el) {
    const q = sel(el);
    const rows = q<HTMLElement>(".row");
    const you = rows[SEO_ROWS - 1];
    const rk = you.querySelector(".rk")!;
    const up = you.querySelector(".up")!;
    const order = rows.map((_, i) => i); // order[pos] = row index
    const tl = loop();
    const Y = 58;

    tl.set(rows, { y: (i) => i * Y })
      .set(rk, { textContent: `#${SEO_ROWS}` })
      .set(up, { textContent: "0" })
      .fromTo(q(".qry"), { text: "" }, { text: "interior designers chennai", duration: 1.3, ease: "none" }, 0)
      .fromTo(q(".caret"), { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.4, repeat: 3, yoyo: true, ease: "steps(1)" }, 0)
      .fromTo(rows, { autoAlpha: 0, x: -14 }, { autoAlpha: 1, x: 0, duration: 0.45, stagger: 0.07 }, 1.2);

    // climb one place at a time, swapping with the row above
    let t = 2.2;
    for (let pos = SEO_ROWS - 1; pos > 0; pos--) {
      const above = order[pos - 1];
      tl.to(you, { y: (pos - 1) * Y, duration: 0.55, ease: "power3.inOut" }, t)
        .to(rows[above], { y: pos * Y, duration: 0.55, ease: "power3.inOut" }, t)
        .set(rows[above].querySelector(".rk"), { textContent: `#${pos + 1}` }, t + 0.3)
        .set(rk, { textContent: `#${pos}` }, t + 0.3)
        .set(up, { textContent: String(SEO_ROWS - pos) }, t + 0.3)
        .fromTo(you, { scale: 1 }, { scale: 1.03, duration: 0.18, yoyo: true, repeat: 1, ease: "power1.inOut" }, t + 0.3);
      [order[pos - 1], order[pos]] = [order[pos], order[pos - 1]];
      t += 0.75;
    }
    tl.fromTo(you, { boxShadow: "0 0 0 0 rgba(0,0,0,0)" }, { boxShadow: "0 0 0 6px rgba(0,0,0,0.08)", duration: 0.5 }, t);
    tl.addLabel("rest", t + 0.2)
      .to(el.children, { autoAlpha: 0, duration: 0.5, ease: "power2.in" }, "+=1.8")
      .set(el.children, { autoAlpha: 1 })
      // reset the other rows' labels for the next lap
      .add(() => rows.forEach((r, i) => r !== you && (r.querySelector(".rk")!.textContent = `#${i + 1}`)));
    return tl;
  },
};

/* ── 3 · SEM: your ad takes the sponsored slot and gets the click ────────── */

const sem: Demo = {
  node: (
    <div className="relative w-full">
      <div className="flex items-center gap-3 rounded-full border border-white/12 bg-bg px-4 py-3 font-mono text-[13px] text-text">
        <span className="h-2 w-2 rounded-full bg-accent" />
        <span className="qry2" />
      </div>
      <div className="relative mt-4 space-y-3">
        <div className="ad relative z-10 rounded-xl border border-accent/60 bg-bg-2 p-4 shadow-[0_20px_40px_-20px_rgba(0,0,0,0.35)]">
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span className="rounded bg-accent px-1.5 py-0.5 font-semibold text-on-accent">Sponsored</span>
            <span className="text-muted">yourbrand.in/visit</span>
          </div>
          <p className="mt-2 font-mono text-[14px] font-semibold text-text">Book a free design consultation</p>
          <Bar w="88%" className="mt-2.5" />
          <Bar w="64%" className="mt-1.5 opacity-60" />
        </div>
        {[0, 1].map((i) => (
          <div key={i} className="org rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <Bar w="45%" />
            <Bar w="80%" className="mt-2.5 opacity-60" />
            <Bar w="58%" className="mt-1.5 opacity-60" />
          </div>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3 font-mono">
        {[
          ["Clicks", "clk"],
          ["Avg. CPC", "cpc"],
          ["Enquiries", "enq"],
        ].map(([l, c]) => (
          <div key={c} className="stat rounded-xl border border-white/[0.08] px-3 py-2.5">
            <span className="block text-[10.5px] text-muted">{l}</span>
            <span className={`${c} mt-0.5 block text-[18px] font-semibold text-text`}>0</span>
          </div>
        ))}
      </div>
      <div className="toast absolute right-2 top-14 z-30 flex items-center gap-2 rounded-full bg-text px-3.5 py-2 font-mono text-[12px] font-semibold text-bg shadow-xl">
        <span className="h-1.5 w-1.5 rounded-full bg-accent" /> New enquiry
      </div>
      <Cursor className="left-0 top-0" />
    </div>
  ),
  build(el) {
    const q = sel(el);
    const tl = loop();
    const ad = q<HTMLElement>(".ad")[0];
    tl.fromTo(q(".qry2"), { text: "" }, { text: "best interior designers near me", duration: 1.1, ease: "none" }, 0)
      .fromTo(q(".org"), { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.4, stagger: 0.08 }, 0.9)
      .fromTo(q(".stat"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4, stagger: 0.06 }, 0.9)
      .fromTo(ad, { autoAlpha: 0, y: -26, scale: 0.94 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.7, ease: "back.out(1.6)" }, 1.25)
      .fromTo(q(".cur"), { x: 330, y: 330, autoAlpha: 0 }, { x: 190, y: 105, autoAlpha: 1, duration: 0.9, ease: "power2.inOut" }, 1.9)
      .to(q(".cur"), { scale: 0.8, duration: 0.1, yoyo: true, repeat: 1 }, 2.85)
      .to(ad, { scale: 0.98, duration: 0.1, yoyo: true, repeat: 1 }, 2.85)
      .fromTo(q(".toast"), { autoAlpha: 0, y: 10, scale: 0.9 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.45, ease: "back.out(2)" }, 3.05);
    count(tl, q(".clk")[0], 0, 1842, 2.9, { dur: 1.6 });
    count(tl, q(".cpc")[0], 0, 18.4, 2.9, { dur: 1.6, dp: 1, prefix: "₹" });
    count(tl, q(".enq")[0], 0, 64, 3.0, { dur: 1.6 });
    tl.addLabel("rest", 4.6)
      .to(q(".cur"), { autoAlpha: 0, duration: 0.3 }, "rest")
      .to(el.children, { autoAlpha: 0, duration: 0.5, ease: "power2.in" }, "+=1.4")
      .set(el.children, { autoAlpha: 1 });
    return tl;
  },
};

/* ── 4 · SMO: one profile, consistent everywhere ─────────────────────────── */

const smo: Demo = {
  node: (
    <div className="w-full">
      <div className="card rounded-2xl border border-white/10 bg-bg-2 p-5">
        <div className="flex items-center gap-4">
          <div className="relative h-16 w-16 shrink-0">
            <svg viewBox="0 0 64 64" className="absolute inset-0 -rotate-90">
              <circle className="ring" cx="32" cy="32" r="30" fill="none" stroke="var(--accent)" strokeWidth="2.5" />
            </svg>
            <div className="ava absolute inset-[6px] grid place-items-center rounded-full bg-accent/90 font-mono text-[18px] font-bold text-on-accent">YB</div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-1.5">
              <span className="nm font-mono text-[15px] font-semibold text-text">Your Brand</span>
              <svg viewBox="0 0 20 20" className="vf h-4 w-4 text-accent">
                <path d="M10 1l2.4 1.8 3-.1.9 2.8 2.4 1.8-.9 2.8.9 2.8-2.4 1.8-.9 2.8-3-.1L10 19l-2.4-1.8-3 .1-.9-2.8L1.3 12.7l.9-2.8-.9-2.8 2.4-1.8.9-2.8 3 .1z" fill="currentColor" />
                <path d="m6.5 10 2.4 2.4 4.6-4.8" stroke="var(--on-accent)" strokeWidth="1.8" fill="none" strokeLinecap="round" />
              </svg>
            </div>
            <span className="bio mt-2 block space-y-1.5">
              <Bar w="92%" />
              <Bar w="70%" className="opacity-60" />
            </span>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-6 gap-1.5">
          {Array.from({ length: 6 }, (_, i) => (
            <div
              key={i}
              className="tile aspect-square rounded-md"
              style={{ background: i % 3 === 1 ? "var(--accent)" : `color-mix(in oklab, var(--text) ${5 + (i % 2) * 4}%, transparent)` }}
            />
          ))}
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {["Instagram", "LinkedIn", "Facebook"].map((p) => (
          <div key={p} className="plat flex items-center justify-between rounded-xl border border-white/[0.08] px-3 py-2.5 font-mono text-[11.5px] text-text/85">
            {p}
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5">
              <path className="ck" d="m3 8.5 3 3 7-7" stroke="var(--accent)" strokeWidth="2" fill="none" strokeLinecap="round" />
            </svg>
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {["#yourbrand", "#interiordesign", "#chennai"].map((h) => (
          <span key={h} className="tag rounded-full bg-white/[0.05] px-3 py-1 font-mono text-[11.5px] text-muted">
            {h}
          </span>
        ))}
      </div>
    </div>
  ),
  build(el) {
    const q = sel(el);
    const tl = loop();
    tl.fromTo(q(".card"), { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.5 }, 0)
      .fromTo(q(".ring"), { drawSVG: "0%" }, { drawSVG: "100%", duration: 0.9, ease: "power2.inOut" }, 0.2)
      .fromTo(q(".ava"), { scale: 0 }, { scale: 1, duration: 0.6, ease: "back.out(2)" }, 0.35)
      .fromTo(q(".nm"), { text: "" }, { text: "Your Brand", duration: 0.5, ease: "none" }, 0.6)
      .fromTo(q(".vf"), { scale: 0, rotation: -90 }, { scale: 1, rotation: 0, duration: 0.5, ease: "back.out(2.5)" }, 1.1)
      .fromTo(q(".bio > *"), { scaleX: 0, transformOrigin: "left" }, { scaleX: 1, duration: 0.5, stagger: 0.1 }, 0.9)
      .fromTo(q(".tile"), { scale: 0.4, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.4, stagger: 0.06, ease: "back.out(1.6)" }, 1.2)
      .fromTo(q(".plat"), { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.4, stagger: 0.1 }, 1.7)
      .fromTo(q(".ck"), { drawSVG: "0%" }, { drawSVG: "100%", duration: 0.35, stagger: 0.25, ease: "power2.out" }, 2.1)
      .fromTo(q(".tag"), { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.4, stagger: 0.1, ease: "back.out(2)" }, 2.6)
      .addLabel("rest", 3.2)
      .to(el.children, { autoAlpha: 0, duration: 0.5, ease: "power2.in" }, "+=1.8")
      .set(el.children, { autoAlpha: 1 });
    return tl;
  },
};

/* ── 5 · SMM: the feed scrolls, your post stops the thumb ────────────────── */

const FEED = 5;
const smm: Demo = {
  node: (
    <div className="flex w-full items-center justify-center gap-6">
      <div className="relative h-[330px] w-[190px] shrink-0 overflow-hidden rounded-[28px] border border-white/15 bg-bg p-2.5">
        <div className="feed space-y-2.5">
          {Array.from({ length: FEED }, (_, i) => {
            const you = i === 3;
            return (
              <div key={i} className={`post rounded-2xl p-2 ${you ? "you bg-white/[0.04]" : "bg-white/[0.025]"}`}>
                <div className="flex items-center gap-1.5">
                  <span className={`h-4 w-4 rounded-full ${you ? "bg-accent" : "bg-white/15"}`} />
                  <Bar w={you ? "50%" : "40%"} className={you ? "!bg-text/50" : ""} />
                </div>
                <div className={`relative mt-2 h-[120px] overflow-hidden rounded-xl ${you ? "bg-accent" : "bg-white/[0.06]"}`}>
                  {you && <span className="absolute inset-x-3 bottom-3 font-mono text-[15px] font-bold leading-tight text-on-accent">Your new collection is live</span>}
                </div>
                {you && (
                  <div className="mt-2 flex items-center gap-1.5 font-mono text-[11px] text-text">
                    <Heart className="hrt h-3.5 w-3.5 text-accent" />
                    <span className="likes">0</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="floaters pointer-events-none absolute inset-0">
          {Array.from({ length: 7 }, (_, i) => (
            <Heart key={i} className="fh absolute bottom-16 left-12 h-4 w-4 text-accent" />
          ))}
        </div>
      </div>
      <div className="hidden w-[150px] space-y-3 font-mono sm:block">
        {[
          ["Reach", "r1"],
          ["Saves", "r2"],
          ["Shares", "r3"],
        ].map(([l, c]) => (
          <div key={c} className="side border-l border-white/10 pl-3">
            <span className="block text-[10.5px] text-muted">{l}</span>
            <span className={`${c} block text-[20px] font-semibold text-text`}>0</span>
          </div>
        ))}
      </div>
    </div>
  ),
  build(el) {
    const q = sel(el);
    const tl = loop();
    const feed = q<HTMLElement>(".feed")[0];
    const posts = q<HTMLElement>(".post");
    const stopY = () => -(posts[3].offsetTop - 34);
    tl.fromTo(feed, { y: 0 }, { y: stopY, duration: 2.2, ease: "power4.inOut" }, 0)
      .fromTo(q(".side"), { autoAlpha: 0, x: 12 }, { autoAlpha: 1, x: 0, duration: 0.4, stagger: 0.1 }, 0.2)
      .fromTo(posts[3], { scale: 1 }, { scale: 1.04, duration: 0.25, yoyo: true, repeat: 1, ease: "power1.inOut" }, 2.25)
      .fromTo(q(".hrt"), { scale: 1 }, { scale: 1.6, duration: 0.15, yoyo: true, repeat: 1 }, 2.4);
    q(".fh").forEach((h, i) => {
      tl.fromTo(
        h,
        { y: 0, x: 0, autoAlpha: 0, scale: 0.5, rotation: 0 },
        {
          keyframes: [
            { autoAlpha: 1, scale: 1, duration: 0.15 },
            { y: -150 - i * 12, x: gsap.utils.wrap([-20, 26, -8, 34, -30, 12, 4])(i), rotation: gsap.utils.wrap([-20, 15, -5, 25, -15, 10, 0])(i), autoAlpha: 0, duration: 1.3, ease: "power1.out" },
          ],
        },
        2.45 + i * 0.12,
      );
    });
    count(tl, q(".likes")[0], 0, 1284, 2.4, { dur: 2 });
    count(tl, q(".r1")[0], 0, 24600, 2.3, { dur: 2.2 });
    count(tl, q(".r2")[0], 0, 312, 2.5, { dur: 2.2 });
    count(tl, q(".r3")[0], 0, 96, 2.6, { dur: 2.2 });
    tl.addLabel("rest", 4.9)
      .to(el.children, { autoAlpha: 0, duration: 0.5, ease: "power2.in" }, "+=1.2")
      .set(el.children, { autoAlpha: 1 });
    return tl;
  },
};

/* ── 6 · Content: useful pieces move people down to a decision ───────────── */

const STAGES = [
  { label: "Aware", w: 100, pieces: ["Reel", "Blog"] },
  { label: "Consider", w: 76, pieces: ["Guide", "Webinar"] },
  { label: "Decide", w: 52, pieces: ["Case study"] },
];
const content: Demo = {
  node: (
    <div className="relative w-full">
      <div className="space-y-2.5">
        {STAGES.map((s) => (
          <div key={s.label} className="stage relative mx-auto flex h-[74px] items-center justify-between rounded-2xl border border-white/[0.08] bg-white/[0.025] px-4" style={{ width: `${s.w}%` }}>
            <span className="font-mono text-[11.5px] text-muted">{s.label}</span>
            <span className="flex gap-1.5">
              {s.pieces.map((p) => (
                <span key={p} className="piece rounded-md border border-accent/50 bg-accent/10 px-2 py-1 font-mono text-[10.5px] text-text">
                  {p}
                </span>
              ))}
            </span>
          </div>
        ))}
      </div>
      <div className="dots pointer-events-none absolute inset-0">
        {Array.from({ length: 14 }, (_, i) => (
          <span key={i} className="dot absolute top-0 h-2 w-2 rounded-full bg-text" style={{ left: `${10 + ((i * 37) % 80)}%` }} />
        ))}
      </div>
      <div className="won mt-4 flex items-center justify-center gap-3 font-mono">
        <span className="h-2 w-2 rounded-full bg-accent" />
        <span className="text-[12px] text-muted">Ready to buy</span>
        <span className="wv text-[20px] font-semibold text-text">0</span>
      </div>
    </div>
  ),
  build(el) {
    const q = sel(el);
    const tl = loop();
    const dots = q<HTMLElement>(".dot");
    tl.fromTo(q(".stage"), { autoAlpha: 0, scaleX: 0.8 }, { autoAlpha: 1, scaleX: 1, duration: 0.55, stagger: 0.12 }, 0)
      .fromTo(q(".piece"), { autoAlpha: 0, y: -14 }, { autoAlpha: 1, y: 0, duration: 0.4, stagger: 0.12, ease: "back.out(2)" }, 0.5)
      .fromTo(q(".won"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 }, 1);
    // people drift down; fewer make it to each stage, the ones who do grow
    dots.forEach((d, i) => {
      const depth = i < 5 ? 3 : i < 9 ? 2 : 1; // how far each one gets
      const ys = [37, 121, 226];
      const xEnd = 50 + ((i % 5) - 2) * 4;
      tl.fromTo(
        d,
        { y: -10, autoAlpha: 0, backgroundColor: "var(--text)" },
        {
          keyframes: [
            { autoAlpha: 0.9, duration: 0.2 },
            ...ys.slice(0, depth).map((y, k) => ({
              y,
              left: `${gsap.utils.interpolate(parseFloat(d.style.left), xEnd, (k + 1) / 3)}%`,
              duration: 0.55,
              ease: "power2.inOut",
            })),
            depth === 3 ? { backgroundColor: "var(--accent)", scale: 1.4, duration: 0.2 } : { autoAlpha: 0, duration: 0.3 },
          ],
        },
        1 + (i % 7) * 0.14 + Math.floor(i / 7) * 0.45,
      );
    });
    count(tl, q(".wv")[0], 0, 5, 2.4, { dur: 1.4 });
    tl.addLabel("rest", 3.9)
      .to(el.children, { autoAlpha: 0, duration: 0.5, ease: "power2.in" }, "+=1.6")
      .set(el.children, { autoAlpha: 1 })
      .set(dots, { left: (i) => `${10 + ((i * 37) % 80)}%`, scale: 1 });
    return tl;
  },
};

/* ── 7 · Email: one send, sorted into the right inbox ────────────────────── */

const SEGS = ["New customers", "Loyal regulars", "Gone quiet"];
function Envelope({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 20" className={className} aria-hidden>
      <rect x="1" y="1" width="26" height="18" rx="3" fill="var(--bg-2)" stroke="var(--accent)" strokeWidth="1.6" />
      <path d="m2 3 12 8 12-8" fill="none" stroke="var(--accent)" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}
const email: Demo = {
  node: (
    <div className="relative aspect-[1/1] sm:aspect-[4/3] w-full">
      <div className="src absolute left-1/2 top-0 w-[58%] -translate-x-1/2 rounded-2xl border border-white/10 bg-bg-2 p-3.5">
        <div className="flex items-center justify-between font-mono text-[11px]">
          <span className="text-muted">Campaign</span>
          <span className="sent rounded-full bg-accent px-2 py-0.5 font-semibold text-on-accent">Sending</span>
        </div>
        <p className="mt-1.5 font-mono text-[13px] font-semibold text-text">Your weekend offer</p>
      </div>
      {Array.from({ length: 9 }, (_, i) => (
        <Envelope key={i} className="env absolute left-1/2 top-[18%] h-5 w-7 -translate-x-1/2" />
      ))}
      <div className="absolute inset-x-0 bottom-0 grid grid-cols-3 gap-3">
        {SEGS.map((s, i) => (
          <div key={s} className="bin rounded-2xl border border-white/[0.08] bg-white/[0.025] p-3 pt-10">
            <span className="block font-mono text-[11px] text-muted">{s}</span>
            <div className="mt-2 flex items-end justify-between">
              <span className="hidden font-mono text-[10.5px] text-muted sm:inline">Opened</span>
              <span className={`op${i} font-mono text-[17px] font-semibold text-text`}>0%</span>
            </div>
            <div className="mt-1.5 h-[5px] overflow-hidden rounded-full bg-white/10">
              <div className="of h-full origin-left rounded-full bg-accent" style={{ width: `${[48, 71, 34][i]}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  ),
  build(el) {
    const q = sel(el);
    const tl = loop();
    const envs = q<HTMLElement>(".env");
    tl.fromTo(q(".src"), { autoAlpha: 0, y: -12 }, { autoAlpha: 1, y: 0, duration: 0.5 }, 0)
      .fromTo(q(".bin"), { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.1 }, 0.2);
    envs.forEach((e, i) => {
      const seg = i % 3;
      const W = el.clientWidth || 420;
      const dx = (seg - 1) * (W / 3);
      tl.fromTo(
        e,
        { x: 0, y: 0, autoAlpha: 0, rotation: 0, scale: 0.6 },
        {
          keyframes: [
            { autoAlpha: 1, scale: 1, duration: 0.15 },
            { x: dx * 0.55, y: 40, rotation: (seg - 1) * 18, duration: 0.35, ease: "power1.out" },
            { x: dx, y: () => (el.clientHeight || 315) * 0.62, rotation: (seg - 1) * 6, duration: 0.4, ease: "power2.in" },
            { autoAlpha: 0, scale: 0.4, duration: 0.15 },
          ],
        },
        0.8 + i * 0.16,
      );
    });
    tl.fromTo(q(".bin"), { borderColor: "rgba(0,0,0,0.08)" }, { borderColor: "rgba(0,0,0,0.6)", duration: 0.2, yoyo: true, repeat: 5, stagger: 0.16 }, 1.6)
      .set(q(".sent"), { textContent: "Delivered" }, 2.6)
      .fromTo(q(".of"), { scaleX: 0 }, { scaleX: 1, duration: 1.3, stagger: 0.12, ease: "power2.out" }, 2.6);
    [48, 71, 34].forEach((v, i) => count(tl, q(`.op${i}`)[0], 0, v, 2.6 + i * 0.12, { dur: 1.3, suffix: "%" }));
    tl.addLabel("rest", 4.1)
      .to(el.children, { autoAlpha: 0, duration: 0.5, ease: "power2.in" }, "+=1.6")
      .set(el.children, { autoAlpha: 1 })
      .set(q(".sent"), { textContent: "Sending" });
    return tl;
  },
};

/* ── 8 · ORM: reviews get answered, the rating climbs ────────────────────── */

const REVIEWS = [
  { who: "Priya R.", stars: 5, text: "Quick, friendly and on time.", reply: "Thank you, Priya. See you soon!" },
  { who: "Arun K.", stars: 3, text: "Delivery took longer than promised.", reply: "Sorry, Arun. We've called you to make it right." },
];
const orm: Demo = {
  node: (
    <div className="w-full">
      <div className="flex items-center gap-5">
        <span className="rate font-mono text-[52px] font-semibold leading-none tracking-[-0.04em] text-text">3.6</span>
        <div>
          <div className="relative flex gap-1">
            {Array.from({ length: 5 }, (_, i) => (
              <Star key={i} className="h-5 w-5 text-white/15" />
            ))}
            <div className="sf absolute inset-y-0 left-0 flex gap-1 overflow-hidden" style={{ width: "72%" }}>
              {Array.from({ length: 5 }, (_, i) => (
                <Star key={i} className="h-5 w-5 shrink-0 text-accent" />
              ))}
            </div>
          </div>
          <span className="mt-1.5 block font-mono text-[11px] text-muted">
            <span className="rc">212</span> reviews
          </span>
        </div>
      </div>
      <div className="mt-5 space-y-3">
        {REVIEWS.map((r) => (
          <div key={r.who} className="rev rounded-2xl border border-white/[0.08] bg-white/[0.025] p-3.5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[12px] font-semibold text-text">{r.who}</span>
              <span className="flex gap-0.5">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star key={i} className={`h-3 w-3 ${i < r.stars ? "text-accent" : "text-white/15"}`} />
                ))}
              </span>
            </div>
            <p className="mt-1 text-[13px] text-muted">{r.text}</p>
            <div className="rep mt-2.5 border-l-2 border-accent pl-3">
              <span className="block font-mono text-[10.5px] text-accent">Reply from Your Brand</span>
              <span className="rt mt-0.5 block min-h-[1.25em] text-[12.5px] text-text" data-text={r.reply} />
            </div>
          </div>
        ))}
      </div>
    </div>
  ),
  build(el) {
    const q = sel(el);
    const tl = loop();
    const reps = q<HTMLElement>(".rep");
    const rts = q<HTMLElement>(".rt");
    tl.fromTo(q(".rev"), { autoAlpha: 0, x: 24 }, { autoAlpha: 1, x: 0, duration: 0.5, stagger: 0.18 }, 0.1).set(reps, { autoAlpha: 0, height: 0 }, 0);
    rts.forEach((t, i) => {
      const at = 0.9 + i * 1.3;
      tl.to(reps[i], { autoAlpha: 1, height: "auto", duration: 0.35, ease: "power2.out" }, at).fromTo(t, { text: "" }, { text: t.dataset.text!, duration: 0.8, ease: "none" }, at + 0.25);
    });
    tl.fromTo(q(".sf"), { width: "72%" }, { width: "94%", duration: 2.4, ease: "power2.inOut" }, 1);
    count(tl, q(".rate")[0], 3.6, 4.7, 1, { dur: 2.4, dp: 1 });
    count(tl, q(".rc")[0], 212, 386, 1, { dur: 2.4 });
    tl.addLabel("rest", 3.6)
      .to(el.children, { autoAlpha: 0, duration: 0.5, ease: "power2.in" }, "+=1.8")
      .set(el.children, { autoAlpha: 1 });
    return tl;
  },
};

/* ── 9 · Analytics: find what works, change it, watch the line turn ──────── */

const analytics: Demo = {
  node: (
    <div className="w-full">
      <div className="flex items-end justify-between font-mono">
        <div>
          <span className="block text-[11px] text-muted">Conversions / week</span>
          <span className="cv block text-[30px] font-semibold leading-tight tracking-[-0.03em] text-text">42</span>
        </div>
        <span className="delta rounded-full bg-accent/15 px-2.5 py-1 text-[12px] font-semibold text-accent">
          +<span className="dv">0</span>%
        </span>
      </div>
      <div className="relative mt-4 aspect-[16/9] w-full">
        <svg viewBox="0 0 400 225" className="absolute inset-0 h-full w-full overflow-visible" preserveAspectRatio="none">
          {[45, 100, 155, 210].map((y) => (
            <line key={y} x1="0" x2="400" y1={y} y2={y} stroke="var(--text)" strokeOpacity="0.08" />
          ))}
          <path className="area" d="M0 175 L50 168 L100 178 L150 160 L200 166 L240 150 L290 112 L340 78 L400 34 L400 225 L0 225Z" fill="var(--text)" fillOpacity="0.05" />
          <path className="line" d="M0 175 L50 168 L100 178 L150 160 L200 166 L240 150 L290 112 L340 78 L400 34" stroke="var(--accent)" strokeWidth="2.5" fill="none" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          <line className="mark" x1="220" x2="220" y1="10" y2="225" stroke="var(--text)" strokeDasharray="3 4" strokeOpacity="0.5" vectorEffect="non-scaling-stroke" />
        </svg>
        <span className="flag absolute left-[55%] top-0 ml-2 rounded-md bg-text px-2 py-1 font-mono text-[10.5px] font-semibold text-bg">New landing page</span>
        <span className="tip absolute right-0 top-[15%] h-3 w-3 -translate-y-1/2 translate-x-1/2 rounded-full border-2 border-bg bg-accent shadow-[0_0_0_6px_rgba(0,0,0,0.12)]" />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 font-mono">
        {[
          ["Version A", 2.1, "va", false],
          ["Version B", 3.8, "vb", true],
        ].map(([l, v, c, win]) => (
          <div key={c as string} className={`ab rounded-xl border px-3 py-2.5 ${win ? "border-accent/60" : "border-white/[0.08]"}`}>
            <span className="flex justify-between text-[10.5px] text-muted">
              {l as string}
              {win && <span className="text-accent">Winner</span>}
            </span>
            <span className={`${c} block text-[17px] font-semibold text-text`}>{String(v)}%</span>
          </div>
        ))}
      </div>
    </div>
  ),
  build(el) {
    const q = sel(el);
    const tl = loop();
    tl.fromTo(q(".line"), { drawSVG: "0%" }, { drawSVG: "52%", duration: 1.1, ease: "power1.inOut" }, 0.1)
      .fromTo(q(".area"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6 }, 0.3)
      .fromTo(q(".mark"), { drawSVG: "0%" }, { drawSVG: "100%", duration: 0.4 }, 1.2)
      .fromTo(q(".flag"), { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: "back.out(2)" }, 1.4)
      .fromTo(q(".ab"), { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.4, stagger: 0.1 }, 1.5)
      .to(q(".line"), { drawSVG: "100%", duration: 1.4, ease: "power2.in" }, 1.9)
      .fromTo(q(".tip"), { scale: 0, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.4, ease: "back.out(3)" }, 3.25)
      .fromTo(q(".delta"), { scale: 0.7, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.4, ease: "back.out(2.4)" }, 1.9);
    count(tl, q(".cv")[0], 42, 97, 1.9, { dur: 1.5 });
    count(tl, q(".dv")[0], 0, 131, 1.9, { dur: 1.5 });
    count(tl, q(".va")[0], 0, 2.1, 1.6, { dur: 0.8, dp: 1, suffix: "%" });
    count(tl, q(".vb")[0], 0, 3.8, 1.7, { dur: 1, dp: 1, suffix: "%" });
    tl.addLabel("rest", 3.7)
      .to(el.children, { autoAlpha: 0, duration: 0.5, ease: "power2.in" }, "+=1.8")
      .set(el.children, { autoAlpha: 1 });
    return tl;
  },
};

/** Same order as SERVICES in lib/content. */
export const SERVICE_DEMOS: Demo[] = [strategy, seo, sem, smo, smm, content, email, orm, analytics];
