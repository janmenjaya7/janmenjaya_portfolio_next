import ParticleCanvas from "../components/ParticleCanvas";
import Cursor from "../components/Cursor";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Footer from "../components/Footer";
import { PortfolioProvider } from "../components/PortfolioProvider";
import { About, Skills, Experience, Projects, Credentials, Contact } from "../components/Sections";
import { getPortfolio } from "../lib/portfolio-store";

// Refreshed immediately when the admin saves; at most 60s stale in any other case
export const revalidate = 60;

export default async function Home() {
  const data = await getPortfolio();

  return (
    <PortfolioProvider data={data}>
      <Cursor />
      <ParticleCanvas />
      <Navbar />
      <main>
        <Hero />
        <About />
        <Skills />
        <Experience />
        <Projects />
        <Credentials />
        <Contact />
      </main>
      <Footer />
    </PortfolioProvider>
  );
}
