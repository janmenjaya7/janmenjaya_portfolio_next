import { PortfolioProvider } from "../components/PortfolioProvider";
import { MotionRoot, ScrollProgress } from "../components/motion/MotionKit";
import SiteNav from "../components/site/SiteNav";
import CinematicIntro from "../components/site/intro/CinematicIntro";
import SiteDock from "../components/site/SiteDock";
import VisitTracker from "../components/site/VisitTracker";
import SiteHero from "../components/site/SiteHero";
import SiteJourney from "../components/site/SiteJourney";
import SiteProof from "../components/site/SiteProof";
import JourneyStory from "../components/site/story/JourneyStory";
import StillsStory from "../components/site/stills/StillsStory";
import { SiteAbout, SiteExperience } from "../components/site/SiteStory";
import { SiteSkills } from "../components/site/SiteWork";
import { SiteProjects } from "../components/site/SiteShowcase";
import { SiteContact, SiteFooter } from "../components/site/SiteContact";
import { getPortfolio } from "../lib/portfolio-store";
import { getSiteShotIndex } from "../lib/shot-store";
import { cinzel, generalSans, instrumentSerif, pinyonScript } from "../lib/fonts";
import theme from "../styles/site/theme.module.css";
import shell from "../styles/site/shell.module.css";

// Refreshed immediately when the admin saves; at most 60s stale in any other case
export const revalidate = 60;

/* Always available: serves the resume uploaded in /admin, or the default public/resume.pdf. */
const RESUME_HREF = "/api/resume";

export default async function Home() {
  // screenshots uploaded in /admin (cached; never throws — falls back to the built-in screenshots)
  const [data, shots] = await Promise.all([getPortfolio(), getSiteShotIndex()]);

  return (
    <PortfolioProvider data={data}>
      <MotionRoot>
        <div className={`${generalSans.variable} ${instrumentSerif.variable} ${cinzel.variable} ${pinyonScript.variable} ${theme.jbRoot}`}>
          <a href="#main" className={shell.jbSkip}>
            Skip to content
          </a>
          <ScrollProgress className={shell.jbProgress} />
          <CinematicIntro resumeHref={RESUME_HREF} />
          {/* the nav strip is positioned over the hero, which no longer always starts at the top of the page */}
          <div className={shell.jbPage}>
          <SiteNav />
          <main id="main">
            <SiteHero resumeHref={RESUME_HREF} />
            <SiteProof />
            {/* renders nothing until real story assets are built (npm run journey:build) */}
            <JourneyStory />
            {/* six chapter images revealed on scroll (renders nothing until npm run stills:build) */}
            <StillsStory />
            <SiteJourney />
            <SiteAbout />
            <SiteExperience />
            <SiteSkills />
            <SiteProjects shots={shots} />
            <SiteContact />
          </main>
          </div>
          <SiteFooter />
          <SiteDock />
          {/* cookie-free visit stats for /admin → Visitors */}
          <VisitTracker />
        </div>
      </MotionRoot>
    </PortfolioProvider>
  );
}
