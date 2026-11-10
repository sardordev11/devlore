import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";

import { auth } from "@/auth";
import { AiSection } from "@/components/home/AiSection";
import { CtaSection } from "@/components/home/CtaSection";
import { FeaturesSection } from "@/components/home/FeaturesSection";
import { Hero } from "@/components/home/Hero";
import { HomeFooter } from "@/components/home/HomeFooter";
import { HomeNav } from "@/components/home/HomeNav";
import { PricingSection } from "@/components/home/PricingSection";
import { ScrollToHash } from "@/components/home/ScrollToHash";

export const metadata: Metadata = {
  title: "DevLore — Your Developer Knowledge Hub",
  description:
    "One fast, searchable, AI-enhanced hub for your snippets, prompts, commands, notes, files, images and links.",
};

async function HomeContent() {
  // The session is per request, so this part isn't prerendered.
  await connection();
  const session = await auth();
  const isSignedIn = Boolean(session?.user?.id);

  return (
    <>
      <HomeNav />
      <main>
        <Hero />
        <FeaturesSection />
        <AiSection />
        <PricingSection isSignedIn={isSignedIn} />
        <CtaSection />
      </main>
      <HomeFooter year={new Date().getFullYear()} />
      <ScrollToHash />
    </>
  );
}

export default function HomePage() {
  return (
    <div className="flex-1 overflow-x-clip bg-home-bg text-zinc-100">
      <Suspense>
        <HomeContent />
      </Suspense>
    </div>
  );
}
