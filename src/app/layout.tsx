import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Inter } from "next/font/google";
import "./globals.css";

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
  metadataBase: new URL("https://www.redantmedia.co.in"),
  title: "Amoldo Technologies — Digital Marketing & Brand Growth Company | Chennai",
  description:
    "Building stronger brands. Creating digital demand. Driving measurable growth. Amoldo Technologies is a Chennai-based digital marketing and brand growth company operating since 2016.",
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
  alternates: {
    canonical: "https://www.redantmedia.co.in",
  },
  openGraph: {
    title: "Amoldo Technologies — Building Stronger Brands & Digital Demand",
    description:
      "Chennai-based digital marketing and brand growth company since 2016. Strategy, SEO, SEM, social media, content, creative communication and ORM.",
    url: "https://www.redantmedia.co.in",
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
      "Building stronger brands. Creating digital demand. Driving measurable growth. Operating from Chennai since 2016.",
    images: ["/brand/amoldo-icon-512.png"],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://www.redantmedia.co.in/#organization",
      name: "Amoldo Technologies",
      url: "https://www.redantmedia.co.in",
      logo: "https://www.redantmedia.co.in/brand/amoldo-logo-black.svg",
      foundingDate: "2016",
      description:
        "Chennai-based digital marketing and brand growth company helping businesses strengthen market positioning, reach the right audiences, build credibility and turn digital attention into business opportunities.",
      slogan:
        "Building stronger brands. Creating digital demand. Driving measurable growth.",
      email: "info@redantmedia.co.in",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Chennai",
        addressRegion: "Tamil Nadu",
        addressCountry: "IN",
      },
      sameAs: ["https://www.linkedin.com/company/14556495"],
    },
    {
      "@type": "ProfessionalService",
      "@id": "https://www.redantmedia.co.in/#business",
      name: "Amoldo Technologies",
      url: "https://www.redantmedia.co.in",
      image: "https://www.redantmedia.co.in/brand/amoldo-icon-512.png",
      email: "info@redantmedia.co.in",
      foundingDate: "2016",
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
