import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Inter } from "next/font/google";
import "./globals.css";
import { CONTACT } from "@/lib/content";

// Public site URL, set NEXT_PUBLIC_SITE_URL at deploy time. Absolute URLs in the
// metadata and structured data are only emitted when it is known.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");

// Main typeface: IBM Plex Mono (headings, UI, labels). Paragraphs: Inter, normal weight.
const plex = IBM_Plex_Mono({
  variable: "--font-plex",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});
const inter = Inter({ variable: "--font-inter", subsets: ["latin"], weight: ["400", "500"], display: "swap" });

export const viewport: Viewport = { themeColor: "#FFFFFF" };

export const metadata: Metadata = {
  ...(SITE_URL && { metadataBase: new URL(SITE_URL), alternates: { canonical: SITE_URL } }),
  title: "Amoldo Technologies — Digital Marketing & Brand Growth Company | Chennai",
  description:
    "Building stronger brands. Creating digital demand. Driving measurable growth. Amoldo Technologies is a Chennai-based digital marketing and brand growth company operating since 2021.",
  keywords: [
    "Amoldo Technologies",
    "Digital Marketing Chennai",
    "Brand Growth Agency",
    "SEO Chennai",
    "SEM Paid Advertising",
    "Social Media Marketing Chennai",
    "Online Reputation Management",
    "Content Marketing India",
  ],
  openGraph: {
    title: "Amoldo Technologies — Building Stronger Brands & Digital Demand",
    description:
      "Chennai-based digital marketing and brand growth company since 2021. Strategy, SEO, SEM, social media, content, creative communication and ORM.",
    ...(SITE_URL && { url: SITE_URL }),
    siteName: "Amoldo Technologies",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "/brand/amoldo-icon-512.png",
        width: 512,
        height: 512,
        alt: "Amoldo Technologies logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Amoldo Technologies — Digital Marketing & Brand Growth",
    description:
      "Building stronger brands. Creating digital demand. Driving measurable growth. Operating from Chennai since 2021.",
    images: ["/brand/amoldo-icon-512.png"],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      ...(SITE_URL && {
        "@id": `${SITE_URL}/#organization`,
        url: SITE_URL,
        logo: `${SITE_URL}/brand/amoldo-logo-black.svg`,
      }),
      name: "Amoldo Technologies",
      foundingDate: "2021",
      description:
        "Chennai-based digital marketing and brand growth company helping businesses strengthen market positioning, reach the right audiences, build credibility and turn digital attention into business opportunities.",
      slogan:
        "Building stronger brands. Creating digital demand. Driving measurable growth.",
      email: CONTACT.email,
      address: {
        "@type": "PostalAddress",
        addressLocality: "Chennai",
        addressRegion: "Tamil Nadu",
        addressCountry: "IN",
      },
    },
    {
      "@type": "ProfessionalService",
      ...(SITE_URL && {
        "@id": `${SITE_URL}/#business`,
        url: SITE_URL,
        image: `${SITE_URL}/brand/amoldo-icon-512.png`,
      }),
      name: "Amoldo Technologies",
      email: CONTACT.email,
      foundingDate: "2021",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Chennai",
        addressRegion: "Tamil Nadu",
        addressCountry: "IN",
      },
      areaServed: "Worldwide",
      knowsAbout: [
        "Digital Marketing Strategy",
        "Search Engine Optimisation (SEO)",
        "Search Engine Marketing (SEM)",
        "Social Media Optimisation (SMO)",
        "Social Media Marketing (SMM)",
        "Content Marketing",
        "Email Marketing",
        "Online Reputation Management (ORM)",
        "Analytics and Continuous Optimisation",
        "Creative and Brand Communication",
      ],
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-intro=""
      className={`${plex.variable} ${inter.variable} antialiased`}
    >
      <head>
        <link rel="preload" href="/brand/amoldo-logo-black.svg" as="image" type="image/svg+xml" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
