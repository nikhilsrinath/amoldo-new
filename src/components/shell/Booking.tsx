"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { CONTACT } from "@/lib/content";

const Ctx = createContext<{ open: () => void }>({ open: () => {} });
export const useBooking = () => useContext(Ctx);

/**
 * Calendar embed placeholder: paste your Calendly (or similar) URL here
 * and it will render inside the booking dialog.
 */
const CALENDAR_EMBED_URL = "";

export function BookingProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setOpen] = useState(false);
  const open = useCallback(() => setOpen(true), []);
  return (
    <Ctx.Provider value={{ open }}>
      {children}
      <BookingDialog open={isOpen} onClose={() => setOpen(false)} />
    </Ctx.Provider>
  );
}

export function BookButton({
  children = "Book a free brand assessment",
  className = "btn btn-accent",
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  const { open } = useBooking();
  return (
    <button type="button" onClick={open} className={className}>
      {children}
      <Arrow />
    </button>
  );
}

/** Scrolls to the Free Brand Assessment section (10A). */
export function AssessLink({
  children = "Book a free brand assessment",
  className = "btn btn-accent",
  onClick,
}: {
  children?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <a href="#assessment" className={className} onClick={onClick}>
      {children}
      <Arrow />
    </a>
  );
}

export function Arrow() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BookingDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const body = [
      `Name: ${f.get("name")}`,
      `Email: ${f.get("email")}`,
      `Phone: ${f.get("phone") || "-"}`,
      `Company: ${f.get("company")}`,
      `Website / social: ${f.get("link")}`,
      `Goal: ${f.get("goal")}`,
    ].join("\n");
    // No backend yet: hand the request to the visitor's email client.
    window.location.href = `mailto:${CONTACT.email}?subject=${encodeURIComponent(
      "Free brand assessment request",
    )}&body=${encodeURIComponent(body)}`;
    setSent(true);
  }

  return (
    <dialog
      ref={ref}
      onClose={() => {
        onClose();
        setSent(false);
      }}
      onClick={(e) => e.target === ref.current && ref.current?.close()}
      aria-labelledby="booking-title"
      className="m-auto w-[min(640px,calc(100vw-32px))] rounded-3xl border border-white/10 bg-bg-2 p-0 text-text backdrop:bg-black/70 backdrop:backdrop-blur-sm"
    >
      <div className="relative p-6 sm:p-9">
        <button
          type="button"
          onClick={() => ref.current?.close()}
          aria-label="Close"
          className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full border border-white/10 text-muted hover:text-text"
        >
          ✕
        </button>
        <p className="hud text-accent">Free · No obligation</p>
        <h2 id="booking-title" className="display mt-3 text-2xl sm:text-3xl">
          Book your free call
        </h2>
        <p className="mt-2 text-sm text-muted">Full brand assessment delivered in under 24 hours.</p>

        {sent ? (
          <p className="mt-8 rounded-2xl border border-text/30 bg-text/5 p-5 text-sm">
            Your email app should open with your details filled in — just hit send. If it didn&apos;t,
            write to{" "}
            <a className="text-accent underline" href={`mailto:${CONTACT.email}`}>
              {CONTACT.email}
            </a>
            .
          </p>
        ) : (
          <form onSubmit={submit} className="mt-7 grid gap-3 sm:grid-cols-2">
            <input className="field" name="name" placeholder="Name" required autoComplete="name" />
            <input className="field" name="email" type="email" placeholder="Email" required autoComplete="email" />
            <input className="field" name="phone" type="tel" placeholder="Phone (optional)" autoComplete="tel" />
            <input className="field" name="company" placeholder="Company" required autoComplete="organization" />
            <input className="field sm:col-span-2" name="link" placeholder="Website or social link" required />
            <input className="field sm:col-span-2" name="goal" placeholder="Your goal, in one line" required />
            {CALENDAR_EMBED_URL ? (
              <iframe
                src={CALENDAR_EMBED_URL}
                title="Pick a time"
                className="h-[420px] w-full rounded-2xl border border-white/10 sm:col-span-2"
              />
            ) : null}
            <button type="submit" className="btn btn-accent mt-2 sm:col-span-2">
              Book my free call <Arrow />
            </button>
            <p className="hud text-center text-muted sm:col-span-2">Free call · Assessment within 24 hours</p>
          </form>
        )}
      </div>
    </dialog>
  );
}
