import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Janmenjaya Biswal — Frontend Developer",
  description: "Frontend Developer with 3 years of experience building scalable React.js, Next.js & TypeScript applications. Based in Pune, Maharashtra.",
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
        {children}
      </body>
    </html>
  );
}
