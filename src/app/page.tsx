import SmoothScroll from "@/components/shell/SmoothScroll";
import Nav from "@/components/shell/Nav";
import MobileCTA from "@/components/shell/MobileCTA";
import ThemeFlow from "@/components/shell/ThemeFlow";
import { BookingProvider } from "@/components/shell/Booking";
import Hero from "@/components/sections/Hero";
import WhoWeAre from "@/components/sections/WhoWeAre";
import GrowthEngine from "@/components/sections/GrowthEngine";
import Services from "@/components/sections/Services";
import Creative from "@/components/sections/Creative";
import Technology from "@/components/sections/Technology";
import Process from "@/components/sections/Process";
import Cases from "@/components/sections/Cases";
import Assessment from "@/components/sections/Assessment";
import Contact from "@/components/sections/Contact";

export default function HomePage() {
  return (
    <BookingProvider>
      <SmoothScroll />
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[90] focus:rounded-full focus:bg-red focus:px-4 focus:py-2">
        Skip to content
      </a>
      <Nav />
      <main id="main">
        <Hero />
        <WhoWeAre />
        <GrowthEngine />
        <Services />
        <Creative />
        <Technology />
        <Process />
        <Cases />
        <Assessment />
        <Contact />
      </main>
      <ThemeFlow />
      <MobileCTA />
    </BookingProvider>
  );
}
