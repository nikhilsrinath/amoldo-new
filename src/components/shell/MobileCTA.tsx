"use client";

import { useEffect, useState } from "react";
import { ScrollTrigger } from "@/lib/gsap";

/** Slim sticky offer bar on mobile: after Services, until the assessment section. */
export default function MobileCTA() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let past = false;
    let atOffer = false;
    const sync = () => setShow(past && !atOffer);
    const a = ScrollTrigger.create({
      trigger: "#services",
      start: "bottom bottom",
      onToggle: (s) => {
        past = s.isActive;
        sync();
      },
      end: "max",
    });
    const b = ScrollTrigger.create({
      trigger: "#assessment",
      start: "top bottom",
      end: "max",
      onToggle: (s) => {
        atOffer = s.isActive;
        sync();
      },
    });
    return () => {
      a.kill();
      b.kill();
    };
  }, []);

  return (
    <div
      data-theme-follow
      className={`fixed inset-x-3 bottom-3 z-50 transition-all duration-500 md:hidden ${
        show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-24 opacity-0"
      }`}
    >
      <a
        href="#assessment"
        className="mx-auto flex max-w-md items-center justify-between gap-3 rounded-full border border-accent/40 bg-bg/90 py-1.5 pl-5 pr-1.5 shadow-[0_10px_40px_-14px_rgba(0,0,0,0.35)] backdrop-blur-xl"
      >
        <span className="min-w-0 text-[13px] leading-tight">
          <span className="block truncate">Free brand assessment</span>
          <span className="block truncate text-[11px] text-muted">Delivered in under 24 hours</span>
        </span>
        <span className="shrink-0 whitespace-nowrap rounded-full bg-accent px-4 py-2.5 text-[13px] font-semibold text-on-accent">Book now</span>
      </a>
    </div>
  );
}
