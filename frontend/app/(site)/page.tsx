import Hero from "@/components/home/Hero";
import Stats from "@/components/home/Stats";
import Features from "@/components/home/Features";
import SocietiesShowcase from "@/components/home/SocietiesShowcase";
import CTA from "@/components/home/CTA";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Stats />
      <Features />
      <SocietiesShowcase />
      <CTA />
    </>
  );
}
