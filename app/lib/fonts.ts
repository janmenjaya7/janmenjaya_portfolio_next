import localFont from "next/font/local";
import { Cinzel, DM_Sans, Instrument_Serif, Pinyon_Script, Syne } from "next/font/google";

/* General Sans (Fontshare, ITF Free Font License), self-hosted. Used by both the main site and /newone. */
export const generalSans = localFont({
  src: [
    { path: "../fonts/GeneralSans-300.woff2", weight: "300", style: "normal" },
    { path: "../fonts/GeneralSans-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/GeneralSans-500.woff2", weight: "500", style: "normal" },
    { path: "../fonts/GeneralSans-600.woff2", weight: "600", style: "normal" },
    { path: "../fonts/GeneralSans-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--no-font-sans",
  display: "swap",
});

/* Editorial serif for accents and large numerals on the main site. */
export const instrumentSerif = Instrument_Serif({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--jb-font-serif",
  display: "swap",
});
/* Roman inscriptional capitals for the cinematic intro (name, chapter numerals). */
export const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--jb-font-display",
  display: "swap",
});

/* Copperplate hand for the quill-written signature at the end of the intro (not needed for first paint). */
export const pinyonScript = Pinyon_Script({
  weight: "400",
  subsets: ["latin"],
  variable: "--jb-font-script",
  display: "swap",
  preload: false,
});

/* Syne: the footer wordmark (the original watermark lettering) and the admin panel's headings.
   Self-hosted and not preloaded: it never blocks the first paint and only downloads where it is used. */
export const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  display: "swap",
  preload: false,
});

/* DM Sans: the admin panel's text face (the public site uses General Sans). */
export const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-dm-sans",
  display: "swap",
  preload: false,
});
