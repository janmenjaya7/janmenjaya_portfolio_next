import ParticleCanvas from "./components/ParticleCanvas";
import Cursor from "./components/Cursor";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Footer from "./components/Footer";
import { About, Skills, Experience, Projects, Credentials, Contact } from "./components/Sections";

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
