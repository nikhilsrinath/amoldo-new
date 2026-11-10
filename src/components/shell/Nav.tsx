"use client";

import { useEffect, useState } from "react";
import { NAV_LINKS } from "@/lib/content";
import { AssessLink } from "./Booking";

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 40);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  return (
    <header
      data-theme-follow
      className={`site-header fixed inset-x-0 top-0 z-50 transition-[background,backdrop-filter,border-color,opacity,transform] duration-500 ${
        scrolled ? "border-b border-white/5 bg-bg/70 backdrop-blur-xl" : "border-b border-transparent"
      }`}
    >
      <nav aria-label="Main" className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-4 sm:h-20 sm:px-8 lg:grid lg:grid-cols-[1fr_auto_1fr]">
        <a href="#top" aria-label="Amoldo Technologies — home" className="shrink-0 justify-self-start">
          <span className="logo-swap">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/amoldo-logo-white.svg" alt="Amoldo Technologies" width={3764} height={1076} className="logo-on-dark h-10 w-auto sm:h-11" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/amoldo-logo-black.svg" alt="" aria-hidden width={3764} height={1076} className="logo-on-light h-10 w-auto sm:h-11" />
          </span>
        </a>

        <ul className="hidden items-center gap-8 lg:flex">
          {NAV_LINKS.map((l) => (
            <li key={l.href}>
              <a href={l.href} className="hud text-muted transition-colors hover:text-text">
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2 justify-self-end">
          <AssessLink className="btn btn-accent hidden h-10 px-4 text-sm sm:inline-flex" />
          <button
            type="button"
            aria-label="Menu"
            aria-expanded={menu}
            onClick={() => setMenu((m) => !m)}
            className="grid h-10 w-10 place-items-center rounded-full border border-white/15 lg:hidden"
          >
            <span className="relative block h-3 w-4">
              <span className={`absolute left-0 top-0 h-px w-4 bg-text transition ${menu ? "translate-y-1.5 rotate-45" : ""}`} />
              <span className={`absolute bottom-0 left-0 h-px w-4 bg-text transition ${menu ? "-translate-y-1.5 -rotate-45" : ""}`} />
            </span>
          </button>
        </div>
      </nav>

      {menu && (
        <div data-lenis-prevent className="max-h-[calc(100svh-4rem)] overflow-y-auto overscroll-contain border-t border-white/5 bg-bg/95 px-4 pb-6 backdrop-blur-xl sm:max-h-[calc(100svh-5rem)] sm:px-8 lg:hidden">
          <ul className="flex flex-col">
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <a href={l.href} onClick={() => setMenu(false)} className="display block border-b border-white/5 py-4 text-xl">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-5">
            <AssessLink className="btn btn-accent w-full" onClick={() => setMenu(false)} />
          </div>
        </div>
      )}
    </header>
  );
}
