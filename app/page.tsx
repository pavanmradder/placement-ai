import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import HowItWorks from "@/components/landing/HowItWorks";
import AboutSection from "@/components/landing/AboutSection";
import CtaSection from "@/components/landing/CtaSection";
import Footer from "@/components/landing/Footer";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-[#07090e] text-slate-100">
      {/* Navigation */}
      <Navbar />

      {/* Main Landing Sections */}
      <main className="flex-1">
        {/* 1. Hero & Dashboard Preview */}
        <Hero />

        {/* 2. Core Features (6 Cards) */}
        <Features />

        {/* 3. How It Works (4 Steps) */}
        <HowItWorks />

        {/* 4. About PlacementAI */}
        <AboutSection />

        {/* 5. Final Call To Action */}
        <CtaSection />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
