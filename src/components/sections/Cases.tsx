"use client";

import Image from "next/image";
import { useRef } from "react";
import { gsap, useGSAP, ScrollTrigger, MM } from "@/lib/gsap";
import { CASES } from "@/lib/content";
import { Index } from "../ui";

type Case = (typeof CASES)[number];

function CaseCard({ c, n, wide }: { c: Case; n: number; wide?: boolean }) {
  return (
    <article
      className={`case group glass relative flex flex-col overflow-hidden rounded-2xl transition-[border-color] duration-500 hover:border-white/20 ${
        wide ? "sm:col-span-2 sm:grid sm:grid-cols-2 lg:col-span-1 lg:flex" : ""
      }`}
    >
      {/* Visual */}
      <div className={`relative aspect-[5/4] overflow-hidden border-b border-white/[0.06] ${wide ? "sm:aspect-auto sm:min-h-[300px] sm:border-b-0 sm:border-r lg:aspect-[5/4] lg:min-h-0 lg:border-b lg:border-r-0" : ""}`}>
        <Image
          src={c.image}
          alt={`${c.client} — work by Amoldo Technologies`}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.05]"
        />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/0 to-black/10" />
        <span className="hud absolute left-4 top-4 rounded-full border border-white/10 bg-bg/60 px-2.5 py-1 text-text/80 backdrop-blur-md">
          {String(n).padStart(2, "0")}
        </span>
      </div>

      {/* Copy */}
      <div className="flex flex-1 flex-col p-6 md:p-7">
        <p className="hud text-muted">
          {c.sector} <span className="text-accent">·</span> {c.focus}
        </p>
        <h3 className="display mt-3 text-[clamp(1.5rem,2.2vw,1.9rem)]">{c.client}</h3>
        <p className="mt-3 text-[15px] leading-relaxed text-muted">{c.line}</p>
        {(c.facts || c.implementation) && (
          <ul className="mt-auto flex flex-wrap gap-2 pt-6">
            {c.facts?.map((f) => (
              <li key={f} className="hud rounded-full border border-white/10 px-3 py-1.5 text-[10px] text-text/75">
                {f}
              </li>
            ))}
            {c.implementation && (
              <li className="hud rounded-full border border-text/30 bg-text/5 px-3 py-1.5 text-[10px] text-text">Implementation experience</li>
            )}
          </ul>
        )}
      </div>
    </article>
  );
}

const GROUPS = [
  { label: "Marketing & brand", items: CASES.filter((c) => !c.implementation) },
  { label: "Platforms we helped build", items: CASES.filter((c) => c.implementation) },
];

export default function Cases() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MM, (ctx) => {
        if ((ctx.conditions as Record<string, boolean>).reduce) return;
        const q = gsap.utils.selector(root);

        gsap.from(q(".work-head > *"), {
          opacity: 0,
          y: 24,
          duration: 0.8,
          stagger: 0.08,
          ease: "power3.out",
          scrollTrigger: { trigger: root.current, start: "top 80%", once: true },
        });

        ScrollTrigger.batch(q<HTMLElement>(".case"), {
          start: "top 88%",
          once: true,
          onEnter: (batch) => gsap.from(batch, { opacity: 0, y: 48, duration: 0.9, stagger: 0.12, ease: "power3.out" }),
        });
      });
    },
    { scope: root },
  );

  return (
    <section id="work" data-theme="light" ref={root} aria-labelledby="work-title" className="relative py-24 md:py-32">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-8">
        <div className="work-head flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <Index n="06" label="Selected experience" />
            <h2 id="work-title" className="display mt-4 text-[clamp(2rem,4vw,3.6rem)]">
              Work that <span className="text-accent">speaks for itself.</span>
            </h2>
          </div>
          <p className="max-w-sm text-muted md:text-right">
            From campaign strategy for global brands to the platforms we helped bring to life.
          </p>
        </div>

        {GROUPS.map((g) => (
          <div key={g.label} className="mt-14 md:mt-20">
            <div className="mb-6 flex items-center gap-4">
              <p className="hud text-text/80">{g.label}</p>
              <span aria-hidden className="h-px flex-1 bg-white/10" />
              <p className="hud text-muted">{String(g.items.length).padStart(2, "0")}</p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
              {g.items.map((c, i) => (
                <CaseCard key={c.client} c={c} n={CASES.indexOf(c) + 1} wide={g.items.length % 2 === 1 && i === g.items.length - 1} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
