"use client";

import { useRef, useState } from "react";
import { gsap, useGSAP, MM, sceneTimeline } from "@/lib/gsap";
import { Colony } from "@/lib/colony";
import { CONTACT, NAV_LINKS, TAGLINE } from "@/lib/content";
import { BookButton } from "../shell/Booking";
import { Index } from "../ui";

export default function Contact() {
  const scene = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const logo = useRef<HTMLImageElement>(null);
  const [sent, setSent] = useState(false);

  useGSAP(() => {
    const colony = new Colony(canvas.current!, "finale");
    colony.onLayout = (r) => {
      if (!logo.current) return;
      Object.assign(logo.current.style, { left: `${r.x}px`, top: `${r.y}px`, width: `${r.w}px` });
      const tag = scene.current?.querySelector<HTMLElement>(".fin-tag");
      if (tag) tag.style.top = `${r.y + r.h + 36}px`;
    };
    colony.resize();
    const q = gsap.utils.selector(scene);
    const mm = gsap.matchMedia();
    mm.add(MM, (ctx) => {
      const { mobile, reduce } = ctx.conditions as Record<string, boolean>;
      if (reduce) {
        colony.progress = 1;
        gsap.set([logo.current, q(".fin-line")], { opacity: 1 });
        return;
      }
      const proxy = { p: 0 };
      const tl = sceneTimeline(scene.current!, { end: mobile ? "+=160%" : "+=220%" });
      tl.to(proxy, { p: 1, duration: 1, onUpdate: () => (colony.progress = proxy.p) }, 0)
        .to(logo.current, { opacity: 1, duration: 0.1 }, 0.74)
        .to(q(".fin-line"), { opacity: 1, y: 0, stagger: 0.04, duration: 0.08 }, 0.82)
        .to(q(".fin-grid"), { opacity: 0.6, duration: 0.3 }, 0.6)
        .to({}, { duration: 0.06 });
    });
    return () => colony.destroy();
  });

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const body = `Name: ${f.get("name")}\nEmail: ${f.get("email")}\nCompany: ${f.get("company")}\n\n${f.get("message")}`;
    window.location.href = `mailto:${CONTACT.email}?subject=${encodeURIComponent("Website enquiry")}&body=${encodeURIComponent(body)}`;
    setSent(true);
  }

  return (
    <section id="contact" aria-labelledby="contact-title" className="relative">
      {/* Finale: the colony returns */}
      <div ref={scene} className="relative h-svh min-h-[560px] overflow-hidden">
        <div aria-hidden className="fin-grid grid-floor opacity-20" />
        <canvas ref={canvas} aria-hidden className="absolute inset-0 h-full w-full" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img ref={logo} src="/brand/redant-logo-light.svg" alt="Red Ant Media" width={909} height={333} className="absolute h-auto opacity-0" />
        <div className="fin-tag absolute inset-x-0 px-4 text-center" style={{ top: "62%" }}>
          {TAGLINE.map((l) => (
            <p key={l} className="fin-line display translate-y-3 text-[clamp(1rem,2vw,1.6rem)] text-text/90 opacity-0 [text-shadow:0_0_24px_rgba(255,45,45,0.55)]">
              {l}
            </p>
          ))}
        </div>
      </div>

      {/* Contact */}
      <div className="relative mx-auto max-w-[1300px] px-4 pb-16 pt-10 sm:px-8 md:pt-16">
        <div className="grid gap-14 md:grid-cols-2 md:gap-20">
          <div className="min-w-0">
            <Index n="10" label="Contact" />
            <h2 id="contact-title" className="display mt-5 text-[clamp(2.2rem,4.6vw,4.4rem)]">
              Let&apos;s build something <span className="text-red">bigger, together.</span>
            </h2>
            <p className="mt-5 max-w-md text-muted">Sharper positioning. A stronger digital presence. The right audience.</p>
            <div className="mt-8">
              <BookButton className="btn btn-red h-auto min-h-14 max-w-full whitespace-normal px-6 py-3 text-center text-[15px] sm:px-7 sm:text-base" />
              <p className="hud mt-3 text-muted">Full brand assessment in under 24 hours</p>
            </div>
            <dl className="mt-12 grid gap-5 text-sm">
              {[
                ["Email", <a key="e" href={`mailto:${CONTACT.email}`} className="hover:text-red">{CONTACT.email}</a>],
                ["LinkedIn", <a key="l" href={CONTACT.linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-red">linkedin.com/company/14556495</a>],
                ["Web", <a key="w" href={CONTACT.websiteUrl} className="hover:text-red">{CONTACT.website}</a>],
                ["Location", CONTACT.location],
              ].map(([k, v]) => (
                <div key={k as string} className="grid grid-cols-[84px_minmax(0,1fr)] items-baseline border-b border-white/5 pb-4 sm:grid-cols-[96px_minmax(0,1fr)]">
                  <dt className="hud text-muted">{k}</dt>
                  <dd className="break-words">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="glass self-start rounded-3xl p-6 md:p-9">
            <h3 className="display text-xl">General enquiries</h3>
            {sent ? (
              <p className="mt-6 text-sm text-muted">
                Your email app should open with your message — just hit send. Or write to{" "}
                <a href={`mailto:${CONTACT.email}`} className="text-red underline">
                  {CONTACT.email}
                </a>
                .
              </p>
            ) : (
              <form onSubmit={submit} className="mt-6 grid gap-3">
                <label className="sr-only" htmlFor="c-name">Name</label>
                <input id="c-name" className="field" name="name" placeholder="Name" required autoComplete="name" />
                <label className="sr-only" htmlFor="c-email">Email</label>
                <input id="c-email" className="field" name="email" type="email" placeholder="Email" required autoComplete="email" />
                <label className="sr-only" htmlFor="c-company">Company</label>
                <input id="c-company" className="field" name="company" placeholder="Company" autoComplete="organization" />
                <label className="sr-only" htmlFor="c-msg">Message</label>
                <textarea id="c-msg" className="field min-h-32 resize-y" name="message" placeholder="How can we help?" required />
                <button type="submit" className="btn btn-ghost mt-2">
                  Send message
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/5">
        <div className="mx-auto flex max-w-[1300px] flex-col gap-6 px-4 py-10 sm:px-8 md:flex-row md:items-center md:justify-between">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/redant-logo-light.svg" alt="Red Ant Media" width={909} height={333} className="h-9 w-auto" loading="lazy" />
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <a href={l.href} className="hud text-muted hover:text-text">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
          <p className="hud text-muted">© Red Ant Media. Since 2016.</p>
        </div>
      </footer>
    </section>
  );
}
