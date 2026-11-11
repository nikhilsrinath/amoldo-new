"use client";

import { useEffect, useState } from "react";
import { ScrollTrigger } from "@/lib/gsap";
import { scrollToTarget } from "./SmoothScroll";

/** Floating "back to top" button, shown once the visitor is past the hero. */
export default function BackToTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const st = ScrollTrigger.create({
      trigger: "#about",
      start: "top 60%",
      end: "max",
      onToggle: (s) => setShow(s.isActive),
    });
    return () => st.kill();
  }, []);

  return (
    <button
      type="button"
      aria-label="Back to top"
      tabIndex={show ? 0 : -1}
      onClick={() => scrollToTarget(0, 2.2)}
      data-theme-follow
      className={`fixed bottom-24 right-4 z-50 grid h-12 w-12 place-items-center rounded-full border border-black/10 bg-accent text-on-accent shadow-[0_10px_30px_-10px_rgba(0,0,0,0.45)] transition-all duration-500 hover:-translate-y-0.5 md:bottom-8 md:right-8 ${
        show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0"
      }`}
    >
      <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 19V5M5 12l7-7 7 7" />
      </svg>
    </button>
  );
}
