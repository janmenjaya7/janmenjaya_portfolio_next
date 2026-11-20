import type { Metadata } from "next";
import { DATA } from "./data";
import "./globals.css";

const title = `${DATA.name} — ${DATA.role} | React.js & Next.js Developer`;
const description =
  "Janmenjaya Biswal is a Frontend Developer in Pune with 3+ years of experience building fast, scalable React.js, Next.js, TypeScript & React Native applications for EdTech products serving 50,000+ learners.";

const googleVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;
const bingVerification = process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION;

export const metadata: Metadata = {
  metadataBase: new URL(DATA.siteUrl),
  title: {
    default: title,
    template: `%s | ${DATA.name}`,
  },
  description,
  applicationName: `${DATA.name} Portfolio`,
  keywords: [
    "Janmenjaya Biswal",
    "Janmenjaya",
    "Janmenjaya Biswal portfolio",
    "Frontend Developer",
    "Frontend Developer Pune",
    "React.js Developer",
    "React Developer India",
    "Next.js Developer",
    "TypeScript Developer",
    "React Native Developer",
    "Web Developer Pune",
    "UI Developer",
    "IFAS Educate",
    "EdTech Developer",
  ],
  authors: [{ name: DATA.name, url: DATA.siteUrl }],
  creator: DATA.name,
  publisher: DATA.name,
  category: "technology",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: DATA.name,
    title,
    description,
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  verification: {
    ...(googleVerification ? { google: googleVerification } : {}),
    ...(bingVerification ? { other: { "msvalidate.01": bingVerification } } : {}),
  },
};

/* Structured data so search engines understand who the site is about */
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": `${DATA.siteUrl}/#person`,
      name: DATA.name,
      url: DATA.siteUrl,
      jobTitle: DATA.role,
      email: `mailto:${DATA.email}`,
      address: {
        "@type": "PostalAddress",
        addressLocality: "Pune",
        addressRegion: "Maharashtra",
        addressCountry: "IN",
      },
      worksFor: { "@type": "Organization", name: "IFAS Educate Pvt. Ltd." },
      alumniOf: {
        "@type": "CollegeOrUniversity",
        name: "Trident Academy of Creative Technology",
      },
      knowsAbout: DATA.techPills,
      sameAs: [DATA.linkedin, DATA.github].filter(Boolean),
    },
    {
      "@type": "WebSite",
      "@id": `${DATA.siteUrl}/#website`,
      url: DATA.siteUrl,
      name: DATA.name,
      inLanguage: "en-IN",
      publisher: { "@id": `${DATA.siteUrl}/#person` },
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-[#050d1c] text-slate-300 antialiased overflow-x-hidden">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
        />
        {children}
      </body>
    </html>
  );
}
