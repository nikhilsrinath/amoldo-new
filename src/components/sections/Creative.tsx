"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { gsap, useGSAP, MM } from "@/lib/gsap";
import { CREATIVES, CREATIVE_CAPABILITIES, type CreativeItem } from "@/lib/content";
import { packRows, BENTO_TARGETS } from "@/lib/bento";
import { Index } from "../ui";

const pad = (n: number) => String(n).padStart(2, "0");
const UNMUTE_EVENT = "creative:unmute";

/** Lazy, in-view-only video: loads near the viewport, plays while visible, pauses otherwise. */
function TileVideo({ item, id }: { item: CreativeItem; id: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const visible = useRef(false);
  const userPaused = useRef(false);
  const [near, setNear] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    userPaused.current = reduce.matches;

    const load = new IntersectionObserver(([e]) => e.isIntersecting && setNear(true), { rootMargin: "800px 0px" });
    const view = new IntersectionObserver(
      ([e]) => {
        visible.current = e.intersectionRatio >= 0.35;
        if (visible.current && !userPaused.current) v.play().catch(() => {});
        else if (!visible.current) v.pause();
      },
      { threshold: [0, 0.35, 0.7] },
    );
    load.observe(v);
    view.observe(v);

    // Only one tile speaks at a time.
    const onOther = (e: Event) => {
      if ((e as CustomEvent<string>).detail !== id) {
        v.muted = true;
        setMuted(true);
      }
    };
    window.addEventListener(UNMUTE_EVENT, onOther);
    return () => {
      load.disconnect();
      view.disconnect();
      window.removeEventListener(UNMUTE_EVENT, onOther);
    };
  }, [id]);

  const togglePlay = () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) {
      userPaused.current = false;
      setNear(true);
      v.play().catch(() => {});
    } else {
      userPaused.current = true;
      v.pause();
    }
  };

  const toggleMute = () => {
    const v = ref.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
    if (!v.muted) {
      window.dispatchEvent(new CustomEvent(UNMUTE_EVENT, { detail: id }));
      if (v.paused) togglePlay();
    }
  };

  return (
    <>
      <video
        ref={ref}
        // `#t` makes the browser paint the first frame once metadata arrives.
        src={near ? `${item.src}#t=0.1` : undefined}
        poster={item.poster}
        muted
        loop
        playsInline
        preload={near ? "metadata" : "none"}
        onCanPlay={() => visible.current && !userPaused.current && ref.current?.play().catch(() => {})}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        className="absolute inset-0 h-full w-full object-cover"
        aria-label={`${item.client} ${item.kind.toLowerCase()}`}
      />
      <div className="absolute right-3 top-3 z-20 flex gap-2 sm:right-4 sm:top-4">
        <button type="button" onClick={togglePlay} aria-label={playing ? "Pause video" : "Play video"} className="cr-btn">
          {playing ? (
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden><path d="M7 4.5v15l13-7.5z" /></svg>
          )}
        </button>
        <button type="button" onClick={toggleMute} aria-label={muted ? "Turn sound on" : "Turn sound off"} aria-pressed={!muted} className="cr-btn">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M11 5 6 9H3v6h3l5 4z" fill="currentColor" />
            {muted ? <path d="m22 9-6 6m0-6 6 6" /> : <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />}
          </svg>
        </button>
      </div>
    </>
  );
}

export default function Creative() {
  const root = useRef<HTMLElement>(null);

  // Row packing per breakpoint (pure data, so SSR and client agree).
  const ratios = CREATIVES.map((c) => c.width / c.height);
  const base = packRows(ratios, BENTO_TARGETS.base.target, BENTO_TARGETS.base.max);
  const sm = packRows(ratios, BENTO_TARGETS.sm.target, BENTO_TARGETS.sm.max);
  const lg = packRows(ratios, BENTO_TARGETS.lg.target, BENTO_TARGETS.lg.max);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const mm = gsap.matchMedia();
      mm.add(MM, (ctx) => {
        const { reduce } = ctx.conditions as Record<string, boolean>;
        if (reduce) return;
        const head = q(".cr-head")[0];
        const grid = q(".bento")[0] as HTMLElement | undefined;

        // Heading lines rise out of their masks, then copy and pills follow.
        gsap.fromTo(q(".cr-line"), { yPercent: 115 }, {
          yPercent: 0, stagger: 0.15, ease: "none",
          scrollTrigger: { trigger: head, start: "top 88%", end: "top 48%", scrub: 0.6 },
        });
        gsap.fromTo(q(".cr-fade"), { y: 28, opacity: 0 }, {
          y: 0, opacity: 1, stagger: 0.06, ease: "none",
          scrollTrigger: { trigger: head, start: "top 72%", end: "top 32%", scrub: 0.6 },
        });

        // Oversized outline band drifts sideways across the whole section.
        gsap.fromTo(q(".cr-marquee"), { xPercent: 4 }, {
          xPercent: -34, ease: "none",
          scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: 0.4 },
        });

        gsap.fromTo(q(".cr-rule"), { scaleX: 0 }, {
          scaleX: 1, ease: "none",
          scrollTrigger: { trigger: q(".cr-rule")[0], start: "top 92%", end: "top 62%", scrub: 0.6 },
        });

        // Tiles: clip-path wipe + media settle. Tiles further right finish a
        // little later, so each row reads as a left-to-right cascade at any width.
        q(".cr-tile").forEach((tile) => {
          const col = () =>
            grid ? (tile.getBoundingClientRect().left - grid.getBoundingClientRect().left) / Math.max(grid.clientWidth, 1) : 0;
          const tl = gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
              trigger: tile,
              start: "top 98%",
              end: () => `top ${62 - col() * 16}%`,
              scrub: 0.7,
              invalidateOnRefresh: true,
            },
          });
          tl.fromTo(tile, { clipPath: "inset(22% 6% 0% 6% round 22px)" }, { clipPath: "inset(0% 0% 0% 0% round 22px)" }, 0)
            .fromTo(tile.querySelector(".cr-media"), { scale: 1.22, yPercent: 5 }, { scale: 1, yPercent: 0 }, 0)
            .fromTo(tile.querySelectorAll(".cr-chip"), { opacity: 0, y: 14 }, { opacity: 1, y: 0, stagger: 0.1 }, 0.45);
        });
      });
    },
    { scope: root },
  );

  const total = CREATIVES.length;

  return (
    <section ref={root} id="creative" aria-labelledby="creative-title" className="relative overflow-hidden py-24 md:py-36">
      {/* Background band */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-10 select-none overflow-hidden md:top-16">
        <p
          className="cr-marquee display whitespace-nowrap text-[clamp(5rem,15vw,15rem)] leading-none text-transparent"
          style={{ WebkitTextStroke: "1px rgba(255,255,255,0.07)" }}
        >
          Brand · Campaign · Social · Film · Poster · Launch · Brand · Campaign ·
        </p>
      </div>

      <div className="relative mx-auto max-w-[1400px] px-4 sm:px-8">
        {/* Header */}
        <div className="cr-head pt-16 md:pt-28">
          <div>
            <Index n="05" label="Creative & brand communication" />
            <h2 id="creative-title" className="display mt-5 text-[clamp(2.3rem,5.4vw,5.4rem)]">
              <span className="block overflow-hidden pb-[0.06em]">
                <span className="cr-line block">Creative that carries</span>
              </span>
              <span className="block overflow-hidden pb-[0.06em]">
                <span className="cr-line block text-red">your strategy.</span>
              </span>
            </h2>
          </div>
          <div className="mt-10 grid gap-6 md:mt-12 md:grid-cols-[1fr_1.2fr] md:items-start md:gap-16">
            <p className="cr-fade max-w-md text-[1.05rem] leading-relaxed text-text/75">
              Creative never works in isolation. It carries your positioning, your message and how the market sees
              you, and it stays consistent on every channel.
            </p>
            <ul className="flex flex-wrap gap-2 md:justify-end" aria-label="Creative capabilities">
              {CREATIVE_CAPABILITIES.map((c) => (
                <li key={c} className="cr-fade hud rounded-full border border-white/10 bg-white/[0.02] px-3 py-2 text-text/80">
                  {c}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {total > 0 ? (
          <>
            {/* Meta row */}
            <div className="mt-16 flex items-center gap-4 md:mt-24">
              <p className="hud shrink-0 text-muted">
                <span className="text-red">●</span> Selected work
              </p>
              <span aria-hidden className="cr-rule h-px flex-1 origin-left bg-white/15" />
              <p className="hud shrink-0 text-muted">
                {pad(total)} {total === 1 ? "piece" : "pieces"}
              </p>
            </div>

            {/* Bento */}
            <ul className="bento mt-8">
              {CREATIVES.map((item, i) => {
                const ar = ratios[i];
                const style = {
                  "--ar": ar,
                  "--n-base": base[i].n,
                  "--sum-base": base[i].sum,
                  "--n-sm": sm[i].n,
                  "--sum-sm": sm[i].sum,
                  "--n-lg": lg[i].n,
                  "--sum-lg": lg[i].sum,
                } as CSSProperties;
                const vw = (s: { sum: number }) => Math.ceil((ar / s.sum) * 100);
                const sizes = `(min-width: 1024px) ${vw(lg[i])}vw, (min-width: 640px) ${vw(sm[i])}vw, 100vw`;

                return (
                  <li
                    key={item.src}
                    className="cr-tile bento-tile group relative overflow-hidden rounded-[22px] border border-white/[0.06] bg-bg-2 will-change-[clip-path]"
                    style={style}
                  >
                    <div className="cr-media absolute inset-0 will-change-transform">
                      <div className="absolute inset-0 transition-transform duration-[900ms] ease-[cubic-bezier(.2,.7,.2,1)] group-hover:scale-[1.035]">
                        {item.type === "video" ? (
                          <TileVideo item={item} id={item.src} />
                        ) : (
                          <Image
                            src={item.src}
                            alt={`${item.client} ${item.kind.toLowerCase()} by Red Ant Media`}
                            fill
                            sizes={sizes}
                            className="object-cover"
                          />
                        )}
                      </div>
                    </div>

                    {/* Caption: always on touch screens; on hover/focus where a pointer can hover,
                        so the client's artwork (logos, CTAs) stays unobstructed. */}
                    <div className="pointer-events-none absolute inset-0 z-10 transition-opacity duration-500 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-focus-within:opacity-100">
                      <div aria-hidden className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="cr-chip absolute bottom-3 left-3 flex items-center gap-2.5 rounded-full border border-white/10 bg-black/65 py-1.5 pl-1.5 pr-3.5 backdrop-blur-md sm:bottom-4 sm:left-4">
                        <span className="hud grid h-6 min-w-6 place-items-center rounded-full bg-red px-1.5 !tracking-normal text-white">
                          {pad(i + 1)}
                        </span>
                        <span className="text-sm font-medium text-white">{item.client}</span>
                        <span className="hud hidden text-white/60 sm:inline">{item.kind}</span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        ) : null}
      </div>
    </section>
  );
}
