"use client";

import { useRef } from "react";
import { gsap, useGSAP, MM, sceneTimeline } from "@/lib/gsap";
import { JOURNEY } from "@/lib/content";
import { JourneyScene, CHAPTER_STARTS as S, FINALE_AT } from "@/lib/journeyScene";
import { Index } from "../ui";

/**
 * 03 · From attention to growth — told to the brand owner, in the second person.
 * The canvas is the world (see journeyScene.ts); this layer is the owner's
 * narration, a live "your brand" readout and the journey rail.
 */

const METERS = [
  { label: "Clarity", from: S[0], to: S[0] + 0.08 },
  { label: "Reach", from: S[1], to: S[3] + 0.08 },
  { label: "Action", from: S[4], to: S[4] + 0.09 },
  { label: "Trust", from: S[5], to: S[5] + 0.09 },
];

export default function GrowthEngine() {
  const root = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  useGSAP(
    () => {
      const sec = root.current!;
      const q = gsap.utils.selector(sec);
      const scene = new JourneyScene(canvas.current!);
      const hud = sec.querySelector(".hud");
      if (hud) scene.font = getComputedStyle(hud).fontFamily;
      scene.resize();
      const ro = new ResizeObserver(() => scene.resize());
      ro.observe(canvas.current!);
      document.fonts?.ready.then(() => {
        if (hud) scene.font = getComputedStyle(hud).fontFamily;
      });

      const mm = gsap.matchMedia();
      mm.add(MM, (ctx) => {
        const { mobile, reduce } = ctx.conditions as Record<string, boolean>;
        const blocks = q(".jb");
        const intro = blocks[0];
        const chapters = blocks.slice(1, 1 + JOURNEY.length);
        const finale = blocks[blocks.length - 1];
        const stops = q(".stop");

        if (reduce) {
          scene.progress = 1;
          scene.stop();
          scene.still();
          gsap.set(intro, { autoAlpha: 0 });
          gsap.set(finale, { autoAlpha: 1 });
          gsap.set(q(".meter-fill"), { scaleX: 1 });
          gsap.set(q(".rail-fill"), { scaleX: 1 });
          gsap.set(stops, { backgroundColor: "#ff2d2d" });
          gsap.set(q(".status-stack"), { yPercent: (-JOURNEY.length * 100) / (JOURNEY.length + 1) });
          return;
        }

        const proxy = { p: 0 };
        const tl = sceneTimeline(sec, { end: mobile ? "+=720%" : "+=920%", scrub: 1 });
        tl.to(proxy, { p: 1, duration: 1, onUpdate: () => (scene.progress = proxy.p) }, 0);

        const show = (el: Element, at: number) =>
          tl.fromTo(
            el.children,
            { autoAlpha: 0, y: 34, filter: "blur(10px)" },
            { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.022, stagger: 0.006, ease: "power3.out" },
            at,
          );
        const hide = (el: Element, at: number) =>
          tl.to(el.children, { autoAlpha: 0, y: -28, filter: "blur(8px)", duration: 0.016, stagger: 0.003, ease: "power2.in" }, at);

        // narration
        gsap.set(chapters.concat(finale), { autoAlpha: 1 });
        chapters.concat(finale).forEach((el) => gsap.set(el.children, { autoAlpha: 0 }));
        hide(intro, S[0] - 0.02);
        chapters.forEach((el, k) => {
          show(el, S[k] + 0.004);
          hide(el, (k < S.length - 1 ? S[k + 1] : FINALE_AT) - 0.018);
        });
        show(finale, FINALE_AT + 0.025);

        // odometer 01 → 07
        const n = JOURNEY.length;
        tl.fromTo(q(".odo"), { autoAlpha: 0, x: -16 }, { autoAlpha: 1, x: 0, duration: 0.02 }, S[0])
          .to(q(".odo"), { autoAlpha: 0, x: -16, duration: 0.015 }, FINALE_AT - 0.012);
        S.forEach((s, k) => {
          if (k) tl.to(q(".odo-stack"), { yPercent: (-k * 100) / n, duration: 0.02, ease: "power3.inOut" }, s);
          tl.to(q(".status-stack"), { yPercent: (-(k + 1) * 100) / (n + 1), duration: 0.02, ease: "power3.inOut" }, s);
        });

        // your brand, measured
        METERS.forEach((m, k) => {
          tl.fromTo(q(".meter-fill")[k], { scaleX: 0 }, { scaleX: 1, duration: m.to - m.from, ease: "power1.inOut" }, m.from);
        });
        tl.to(q(".meter-fill"), { backgroundColor: "#ff4d4d", boxShadow: "0 0 12px rgba(255,45,45,0.9)", duration: 0.03 }, S[6]);

        // the rail: an ant walks from stop to stop
        tl.fromTo(q(".rail-ant"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.01 }, S[0] - 0.01);
        S.forEach((s, k) => {
          tl.to(q(".rail-ant"), { left: `${(k / (n - 1)) * 100}%`, duration: 0.03, ease: "power2.inOut" }, s)
            .to(q(".rail-fill"), { scaleX: k / (n - 1), duration: 0.03, ease: "power2.inOut" }, s)
            .to(stops[k], { backgroundColor: "#ff2d2d", scale: 1.35, duration: 0.012 }, s + 0.02)
            .to(q(".stop-n")[k], { color: "#f2f2f5", duration: 0.012 }, s + 0.02);
        });
        tl.to(q(".rail-ant"), { scale: 1.6, duration: 0.03 }, FINALE_AT);
      });

      return () => {
        ro.disconnect();
        scene.destroy();
        mm.revert();
      };
    },
    { scope: root },
  );

  return (
    <section
      id="growth"
      ref={root}
      aria-labelledby="growth-title"
      data-theme="dark"
      className="relative h-svh min-h-[520px] overflow-hidden"
    >
      <canvas ref={canvas} aria-hidden className="absolute inset-0 h-full w-full" />
      {/* legibility veil: left on desktop, bottom on mobile */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(0deg,var(--page-bg)_30%,color-mix(in_oklab,var(--page-bg)_85%,transparent)_45%,transparent_62%)] md:bg-[linear-gradient(90deg,var(--page-bg)_0%,color-mix(in_oklab,var(--page-bg)_88%,transparent)_26%,transparent_50%)]"
      />

      <h2 id="growth-title" className="sr-only">
        From attention to growth: your brand&rsquo;s journey
      </h2>
      <ol className="sr-only">
        {JOURNEY.map((j) => (
          <li key={j.area}>
            {j.area}: {j.line} {j.sub}
          </li>
        ))}
      </ol>

      <div aria-hidden className="relative mx-auto h-full max-w-[1400px] px-4 sm:px-8">
        <div className="flex h-full w-full flex-col pb-5 pt-[4.5rem] md:w-[min(38vw,32rem)] md:pb-8 md:pt-28">
          <Index n="03" label="From attention to growth" />

          <div className="flex-1 md:hidden" />

          {/* narration */}
          <div className="relative md:my-auto">
            <div className="odo invisible mb-2 flex items-end gap-2 md:mb-5">
              <span className="relative block h-[1em] overflow-hidden font-[family-name:var(--font-plex)] text-[clamp(1.9rem,5vw,4.8rem)] font-semibold leading-none tracking-[-0.04em] text-transparent [-webkit-text-stroke:1px_rgba(255,45,45,0.9)]">
                <span className="odo-stack block">
                  {JOURNEY.map((_, k) => (
                    <span key={k} className="block h-[1em]">
                      {String(k + 1).padStart(2, "0")}
                    </span>
                  ))}
                </span>
              </span>
              <span className="hud pb-1 text-muted">/ {String(JOURNEY.length).padStart(2, "0")}</span>
            </div>

            <div className="relative h-[9.75rem] md:h-[17rem]">
              <div className="jb absolute inset-x-0 top-0">
                <p className="hud text-red">Imagine, for a moment</p>
                <p className="display mt-3 text-[clamp(1.5rem,3.6vw,3.6rem)]">This is your market.</p>
                <p className="mt-3 max-w-sm text-[13.5px] md:mt-4 text-muted md:text-[15px]">
                  Thousands of brands, all talking at once. Somewhere in the noise is yours.
                </p>
              </div>
              {JOURNEY.map((j) => (
                <div key={j.area} className="jb invisible absolute inset-x-0 top-0">
                  <p className="hud text-red">{j.area}</p>
                  <p className="display mt-3 text-[clamp(1.5rem,3.6vw,3.6rem)]">{j.line}</p>
                  <p className="mt-3 max-w-sm text-[13.5px] md:mt-4 text-muted md:text-[15px]">{j.sub}</p>
                </div>
              ))}
              <div className="jb invisible absolute inset-x-0 top-0">
                <p className="hud text-red">Where the journey leads</p>
                <p className="display mt-3 text-[clamp(1.9rem,4.2vw,4.2rem)]">
                  Attention, turned into <span className="text-red">growth.</span>
                </p>
                <p className="mt-3 max-w-sm text-[13.5px] md:mt-4 text-muted md:text-[15px]">
                  Seven steps, one direction. This is the journey we take with every brand we work with.
                </p>
              </div>
            </div>
          </div>

          {/* your brand: live readout */}
          <div className="mt-4 hidden items-center gap-5 md:flex">
            <div className="shrink-0">
              <p className="hud text-muted">Your brand</p>
              <div className="relative mt-1 h-5 overflow-hidden">
                <div className="status-stack">
                  {["Unseen", ...JOURNEY.map((j) => j.status)].map((s) => (
                    <p key={s} className="hud flex h-5 items-center gap-2 text-text">
                      <span className="h-1.5 w-1.5 animate-[pulse-red_1.6s_ease-in-out_infinite] rounded-full bg-red" />
                      {s}
                    </p>
                  ))}
                </div>
              </div>
            </div>
            <div className="grid flex-1 grid-cols-4 gap-3">
              {METERS.map((m) => (
                <div key={m.label}>
                  <p className="hud text-[10px] text-muted">{m.label}</p>
                  <div className="mt-1.5 h-[3px] overflow-hidden rounded-full bg-white/10">
                    <div className="meter-fill h-full origin-left scale-x-0 rounded-full bg-red/80" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* the rail */}
          <div className="relative mt-3 md:mt-6">
            <div className="relative mx-1.5 h-px bg-white/12">
              <div className="rail-fill absolute inset-0 origin-left scale-x-0 bg-red shadow-[0_0_8px_rgba(255,45,45,0.8)]" />
              {JOURNEY.map((j, k) => (
                <span
                  key={j.area}
                  className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${(k / (JOURNEY.length - 1)) * 100}%` }}
                >
                  <span className="stop block h-1.5 w-1.5 rounded-full bg-white/25" />
                </span>
              ))}
              <span className="rail-ant invisible absolute left-0 top-1/2 block h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red shadow-[0_0_14px_3px_rgba(255,45,45,0.7)]" />
            </div>
            <div className="relative mx-1.5 mt-3 h-4">
              {JOURNEY.map((j, k) => (
                <span
                  key={j.area}
                  className="stop-n hud absolute -translate-x-1/2 text-[10px] text-white/30"
                  style={{ left: `${(k / (JOURNEY.length - 1)) * 100}%` }}
                >
                  {String(k + 1).padStart(2, "0")}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
