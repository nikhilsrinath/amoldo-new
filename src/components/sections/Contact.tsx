"use client";

import { useState } from "react";
import { CONTACT, NAV_LINKS } from "@/lib/content";
import { BookButton } from "../shell/Booking";
import { Index } from "../ui";

export default function Contact() {
  const [sent, setSent] = useState(false);

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const body = `Name: ${f.get("name")}\nEmail: ${f.get("email")}\nCompany: ${f.get("company")}\n\n${f.get("message")}`;
    window.location.href = `mailto:${CONTACT.email}?subject=${encodeURIComponent("Website enquiry")}&body=${encodeURIComponent(body)}`;
    setSent(true);
  }

  return (
    <section id="contact" data-theme="light" aria-labelledby="contact-title" className="relative">
      {/* Contact */}
      <div className="relative mx-auto max-w-[1300px] px-4 pb-16 pt-24 sm:px-8 md:pt-32">
        <div className="grid gap-14 md:grid-cols-2 md:gap-20">
          <div className="min-w-0">
            <Index n="10" label="Contact" />
            <h2 id="contact-title" className="display mt-5 text-[clamp(2.2rem,4.6vw,4.4rem)]">
              Let&apos;s build something <span className="text-accent">bigger, together.</span>
            </h2>
            <p className="mt-5 max-w-md text-muted">Sharper positioning. A stronger digital presence. The right audience.</p>
            <div className="mt-8">
              <BookButton className="btn btn-accent h-auto min-h-14 max-w-full whitespace-normal px-6 py-3 text-center text-[15px] sm:px-7 sm:text-base" />
              <p className="hud mt-3 text-muted">Full brand assessment in under 24 hours</p>
            </div>
            <dl className="mt-12 grid gap-5 text-sm">
              {[
                ["Email", <a key="e" href={`mailto:${CONTACT.email}`} className="hover:text-accent">{CONTACT.email}</a>],                ["Location", CONTACT.location],
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
                <a href={`mailto:${CONTACT.email}`} className="text-accent underline">
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
          <img src="/brand/amoldo-logo-black.svg" alt="Amoldo Technologies" width={3764} height={1076} className="h-11 w-auto" loading="lazy" />
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <a href={l.href} className="hud text-muted hover:text-text">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
          <p className="hud text-muted">© Amoldo Technologies. Since 2021.</p>
        </div>
      </footer>
    </section>
  );
}
