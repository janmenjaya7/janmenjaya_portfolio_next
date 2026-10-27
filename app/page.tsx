import ParticleCanvas from "./components/ParticleCanvas";
import Cursor from "./components/Cursor";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import { About, Skills, Experience, Projects, Credentials, Contact, Footer } from "./components/Sections";

export default function Home() {
  return (
    <>
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
    </>
  );
}
