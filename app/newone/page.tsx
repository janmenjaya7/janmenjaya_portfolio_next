import type { Metadata } from "next";
import { getPortfolio } from "../lib/portfolio-store";
import { generalSans } from "../lib/fonts";
import { mailtoHref, resolveView, safeHref } from "./_lib/newone-utils";
import NoIntro from "./_components/NoIntro";
import NoHeader from "./_components/NoHeader";
import NoHero from "./_components/NoHero";
import NoDock from "./_components/NoDock";
import NoScrollFx from "./_components/NoScrollFx";
import NoMarquee from "./_components/NoMarquee";
import { NoAbout, NoExperience, NoContact, NoFooter } from "./_components/NoSections";
import NoServices from "./_components/NoServices";
import NoWorkDeck from "./_components/NoWorkDeck";
import NoCursor from "./_components/NoCursor";
import NoScrollRail, { type RailSection } from "./_components/NoScrollRail";

const RAIL: readonly RailSection[] = [
  { id: "about", label: "About", index: "01" },
  { id: "services", label: "What I do", index: "02" },
  { id: "work", label: "Selected work", index: "03" },
  { id: "experience", label: "Experience", index: "04" },
  { id: "contact", label: "Contact", index: "05" },
];
import tokens from "./_styles/tokens.module.css";
import fx from "./_styles/fx.module.css";

const ROOT_ID = "no-root";

export const metadata: Metadata = {
  title: "A new look",
  description:
    "Janmenjaya Biswal — Frontend Developer in Pune building fast, scalable React & Next.js products for 50,000+ learners. A calm, focused tour of my work.",
  alternates: { canonical: "/newone" },
  openGraph: { url: "/newone" },
};

type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

/*
  /newone          → intro: "How would you like to explore my work?"
  /newone?v=site   → the new site view
*/
export default async function NewonePage({ searchParams }: PageProps) {
  const [params, data] = await Promise.all([searchParams, getPortfolio()]);
  const view = resolveView(params?.v);

  const name = data.name?.trim() || "Janmenjaya Biswal";
  const role = data.role?.trim() || "Frontend Developer";
  const email = data.email?.trim() || "";
  const emailHref = mailtoHref(email);
  const linkedinHref = safeHref(data.linkedin);
  const githubHref = safeHref(data.github);
  const city = (data.location?.split(",")[0] ?? "").trim() || "Pune";

  return (
    <div id={ROOT_ID} className={`${generalSans.variable} ${tokens.noRoot}`}>
      <a href="#no-main" className={tokens.noSkipLink}>
        Skip to content
      </a>

      {view === "intro" ? (
        <NoIntro name={name} role={role} email={email} emailHref={emailHref} linkedinHref={linkedinHref} />
      ) : (
        <>
          <NoScrollFx rootId={ROOT_ID} />
          <div className={fx.noProgress} aria-hidden="true" />
          <NoHeader name={name} role={role} available />
          <main id="no-main">
            <NoHero name={name} city={city} contactHref="#contact" />
            <NoMarquee items={Array.isArray(data.techPills) ? data.techPills : []} />
            <NoAbout data={data} />
            <NoServices index="02" />
            <NoWorkDeck data={data} index="03" />
            <NoExperience data={data} index="04" />
            <NoContact links={{ emailHref, email, linkedinHref, githubHref }} />
          </main>
          <NoFooter name={name} />
          <NoDock githubHref={githubHref} />
          <NoCursor />
          <NoScrollRail sections={RAIL} />
        </>
      )}
    </div>
  );
}
