"use client";

import { useEffect } from "react";
import { ExperienceProvider, useExperience } from "@/components/experience/store";
import { scrollToTarget } from "@/components/ui/SmoothScroll";
import { Nav } from "@/components/sections/Nav";
import { Hero } from "@/components/sections/Hero";
import { DestinationPanel } from "@/components/destination/DestinationPanel";
import { ExploreRail } from "@/components/sections/ExploreRail";
import { Footer } from "@/components/sections/Footer";

function ScrollBridge() {
  const { selected } = useExperience();
  useEffect(() => {
    if (!selected) return;
    const timer = setTimeout(() => scrollToTarget("#dossier"), 120);
    return () => clearTimeout(timer);
  }, [selected]);
  return null;
}

export function Experience() {
  return (
    <ExperienceProvider>
      <Nav />
      <ScrollBridge />
      <main>
        <Hero />
        <DestinationPanel />
        <ExploreRail />
      </main>
      <Footer />
    </ExperienceProvider>
  );
}
