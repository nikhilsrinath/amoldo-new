"use client";

import { useRef } from "react";
import { gsap, useGSAP, ScrollTrigger, MM, sceneTimeline } from "@/lib/gsap";
import { HeroField } from "@/lib/heroField";
import { ANT, EYE, LETTERS, LOGO_VIEWBOX } from "@/lib/logoPaths";
import { HERO_LINE } from "@/lib/content";

/**
 * Hero — a single scroll-driven shot, no copy until the end.
 *
 *   idle      one red dot breathes in the dark (the ant's eye)
 *   gather    dust condenses into the logo; the ant traces itself, the wordmark settles
 *   dive      the camera dives into the eye — warp streaks — the screen goes red
 *   speak     the red contracts back into a dot that walks out the line,
 *             word by word, and comes to rest as its full stop
 */

const BRAND_RED = "#FF0000";
const EYE_X = (EYE.cx / LOGO_VIEWBOX.w) * 100;
const EYE_Y = (EYE.cy / LOGO_VIEWBOX.h) * 100;
const EYE_D = ((EYE.r * 2) / LOGO_VIEWBOX.w) * 100;
// Wordmark settles outward from the ant.
const LETTER_ORDER = ["d", "n", "e", "t", "r", "media"];

type Pt = { x: number; y: number };

export default function Hero() {
  const root = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const logo = useRef<HTMLDivElement>(null);
  const orb = useRef<HTMLDivElement>(null);
  const period = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const sec = root.current!;
      const q = gsap.utils.selector(sec);
      const field = new HeroField(canvas.current!);

      // Geometry shared by the canvas and the function-based tween values.
      const geo = {
        eye: { x: 0, y: 0 } as Pt,
        zoom: 1,
        d: 10,
        big: 1,
        stops: [] as Pt[], // [line start, after word 1, after word 2, …, full stop]
      };

      const measure = () => {
        const W = sec.clientWidth;
        const H = sec.clientHeight;
        const mobile = W < 768;
        const lw = mobile ? W * 0.84 : Math.min(W * 0.56, 860);
        const lh = (lw * LOGO_VIEWBOX.h) / LOGO_VIEWBOX.w;
        const lx = (W - lw) / 2;
        const ly = (H - lh) / 2;
        Object.assign(logo.current!.style, { left: `${lx}px`, top: `${ly}px`, width: `${lw}px` });

        const eye = { x: lx + (EYE_X / 100) * lw, y: ly + (EYE_Y / 100) * lh };
        const eyeD = (EYE_D / 100) * lw;
        const corner = Math.hypot(Math.max(eye.x, W - eye.x), Math.max(eye.y, H - eye.y));
        geo.eye = eye;
        geo.zoom = (corner * 2.2) / eyeD;
        gsap.set(q(".glow"), { left: eye.x, top: eye.y });
        field.setLayout(W, H, { x: lx, y: ly, w: lw, h: lh }, eye);

        // Tagline geometry (outer word spans carry no transforms).
        const s = sec.getBoundingClientRect();
        const pr = period.current!.getBoundingClientRect();
        const words = q(".w").map((el) => el.getBoundingClientRect());
        const last = words[words.length - 1];
        const d = pr.width;
        const gap = pr.left - last.right + d / 2;
        const dy = pr.top + d / 2 - last.top;
        geo.d = d;
        geo.big = (corner * 2.2) / d;
        geo.stops = [
          { x: words[0].left - s.left - gap, y: words[0].top - s.top + dy },
          ...words.map((r) => ({ x: r.right - s.left + gap, y: r.top - s.top + dy })),
        ];
        gsap.set(orb.current, { width: d, height: d });
      };
      measure();
      ScrollTrigger.addEventListener("refreshInit", measure);

      // Any change to the stage size (e.g. browser chrome resizing the viewport
      // height) re-runs measure via refresh, which also re-evaluates tween values.
      let size = `${sec.clientWidth}x${sec.clientHeight}`;
      let to = 0;
      const ro = new ResizeObserver(() => {
        const next = `${sec.clientWidth}x${sec.clientHeight}`;
        if (next === size) return;
        size = next;
        clearTimeout(to);
        to = window.setTimeout(() => ScrollTrigger.refresh(), 150);
      });
      ro.observe(sec);

      const at = (k: number) => ({
        x: () => geo.stops[k].x - geo.d / 2,
        y: () => geo.stops[k].y - geo.d / 2,
      });

      const mm = gsap.matchMedia();
      mm.add(MM, (ctx) => {
        const { mobile, reduce } = ctx.conditions as Record<string, boolean>;
        const html = document.documentElement;

        if (reduce) {
          field.progress = 1;
          html.removeAttribute("data-intro");
          sec.dataset.phase = "done";
          gsap.set(logo.current, { autoAlpha: 0 });
          gsap.set(q(".wi"), { opacity: 1 });
          gsap.set(orb.current, { autoAlpha: 1, ...at(geo.stops.length - 1) });
          return;
        }

        html.setAttribute("data-intro", "");
        const proxy = { p: 0 };
        const words = q(".wi");
        const letter = (id: string) => q(`.letter[data-id="${id}"]`);

        gsap.set(q(".ant"), { drawSVG: "0%" });

        const tl = sceneTimeline(sec, { end: mobile ? "+=380%" : "+=520%", scrub: 1 });
        tl.to(
          proxy,
          {
            p: 1,
            duration: 1,
            onUpdate: () => {
              const p = proxy.p;
              field.progress = p;
              sec.dataset.phase = p < 0.015 ? "idle" : p > 0.93 ? "done" : "move";
              if (p < 0.8) html.setAttribute("data-intro", "");
              else html.removeAttribute("data-intro");
            },
          },
          0,
        )
          .to(q(".cue"), { autoAlpha: 0, duration: 0.03 }, 0)

          // ── gather: the ant traces itself, then the wordmark settles ──
          .to(q(".ant"), { drawSVG: "100%", duration: 0.16, ease: "power1.inOut" }, 0.05)
          .to(q(".ant"), { fillOpacity: 1, duration: 0.06 }, 0.18)
          .to(q(".ant"), { strokeOpacity: 0, duration: 0.04 }, 0.22)
          .to(q(".glow"), { opacity: 1, scale: 1, duration: 0.14, ease: "power2.out" }, 0.16);
        LETTER_ORDER.forEach((id, k) => {
          tl.fromTo(
            letter(id),
            { opacity: 0, y: id === "media" ? 18 : 30, transformOrigin: "50% 100%" },
            { opacity: 1, y: 0, duration: 0.07, ease: "power3.out" },
            0.2 + k * 0.022,
          );
        });

        // ── dive: through the eye ──
        tl.to(logo.current, { scale: () => geo.zoom, duration: 0.18, ease: "power4.in" }, 0.4)
          .to(q(".glow"), { opacity: 0, duration: 0.06 }, 0.4)
          .set(logo.current, { autoAlpha: 0 }, 0.58)
          .set(orb.current, { autoAlpha: 1, x: () => geo.eye.x - geo.d / 2, y: () => geo.eye.y - geo.d / 2, scale: () => geo.big }, 0.58)

          // ── speak: the red closes into a dot, then walks the line ──
          .to(orb.current, { ...at(0), scale: 1, duration: 0.1, ease: "expo.out" }, 0.585);

        const step = 0.042;
        words.forEach((w, k) => {
          const t0 = 0.69 + k * step;
          tl.fromTo(
            w,
            { opacity: 0, yPercent: 35, filter: "blur(14px)" },
            { opacity: 1, yPercent: 0, filter: "blur(0px)", duration: step * 1.3, ease: "power3.out" },
            t0,
          ).to(orb.current, { ...at(k + 1), duration: step * 0.9, ease: "power2.inOut" }, t0);
        });
        // breathing room at the end so the line can be read before release
        tl.to({}, { duration: 0.04 }, 0.96);
      });

      return () => {
        ScrollTrigger.removeEventListener("refreshInit", measure);
        ro.disconnect();
        clearTimeout(to);
        document.documentElement.removeAttribute("data-intro");
        field.destroy();
        mm.revert();
      };
    },
    { scope: root },
  );

  return (
    <section
      id="top"
      ref={root}
      data-phase="idle"
      aria-labelledby="hero-title"
      className="hero relative h-svh min-h-[560px] overflow-hidden bg-bg"
    >
      {/* bloom behind the assembled logo */}
      <div
        aria-hidden
        className="glow pointer-events-none absolute h-[70vmax] w-[70vmax] -translate-x-1/2 -translate-y-1/2 scale-75 rounded-full opacity-0"
        style={{ background: "radial-gradient(closest-side, rgba(255,0,0,0.16), rgba(255,0,0,0.04) 55%, transparent)" }}
      />

      {/* the logo, built from its own vector paths */}
      <div
        ref={logo}
        aria-hidden
        className="absolute left-1/2 top-1/2 w-[56vw]"
        style={{ transformOrigin: `${EYE_X}% ${EYE_Y}%` }}
      >
        <svg viewBox={`0 0 ${LOGO_VIEWBOX.w} ${LOGO_VIEWBOX.h}`} className="block h-auto w-full overflow-visible">
          <path
            className="ant"
            d={ANT}
            fill={BRAND_RED}
            fillRule="evenodd"
            stroke={BRAND_RED}
            strokeWidth={1.5}
            vectorEffect="non-scaling-stroke"
            style={{ fillOpacity: 0, strokeDasharray: "0 100000" }}
          />
          {LETTERS.map((l) => (
            <path key={l.id} className="letter" data-id={l.id} d={l.d} fill="#fff" fillRule="evenodd" opacity={0} />
          ))}
        </svg>
        <span
          className="eye absolute rounded-full"
          style={{
            left: `${EYE_X}%`,
            top: `${EYE_Y}%`,
            width: `${EYE_D}%`,
            aspectRatio: "1",
            translate: "-50% -50%",
            background: BRAND_RED,
          }}
        >
          <span className="pulse-ring" />
        </span>
      </div>

      <canvas ref={canvas} aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" />

      {/* the line */}
      <h1
        id="hero-title"
        className="display pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-4 text-center text-[clamp(2.1rem,8.2vw,7.6rem)] font-semibold leading-[1.04]"
      >
        {HERO_LINE.map((line, li) => (
          <span key={li} className="block whitespace-nowrap">
            {line.map((word, wi) => (
              <span key={word}>
                <span className="w inline-block">
                  <span className="wi inline-block opacity-0">{word}</span>
                </span>
                {wi < line.length - 1 && " "}
              </span>
            ))}
            {li === HERO_LINE.length - 1 && (
              <>
                <span
                  ref={period}
                  aria-hidden
                  className="ml-[0.07em] inline-block h-[0.17em] w-[0.17em] rounded-full"
                />
                <span className="sr-only">.</span>
              </>
            )}
          </span>
        ))}
      </h1>

      {/* the eye, again: full-screen red that closes into the full stop */}
      <div
        ref={orb}
        aria-hidden
        className="orb invisible pointer-events-none absolute left-0 top-0 rounded-full will-change-transform"
        style={{ background: BRAND_RED }}
      >
        <span className="pulse-ring" />
      </div>

      {/* wordless scroll cue */}
      <div aria-hidden className="cue absolute bottom-8 left-1/2 -translate-x-1/2">
        <span className="relative block h-12 w-px overflow-hidden bg-white/15">
          <span className="absolute inset-x-0 top-0 h-1/2 animate-[scrollhint_1.8s_ease-in-out_infinite] bg-red" />
        </span>
      </div>
    </section>
  );
}
