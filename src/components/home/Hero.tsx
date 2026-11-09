import { ArrowRightIcon } from "lucide-react";
import type { ReactNode } from "react";

import { ChaosVisual } from "@/components/home/ChaosVisual";
import { Container } from "@/components/home/Container";
import { CtaLink } from "@/components/home/CtaLink";
import { DashboardPreview } from "@/components/home/DashboardPreview";
import { Reveal } from "@/components/home/Reveal";
import { SectionHeading } from "@/components/home/SectionHeading";
import { GET_STARTED_FREE } from "@/lib/homepage";

function Panel({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex w-full min-w-0 flex-col gap-3">
      <p className="font-mono text-[13px] text-zinc-500">{label}</p>
      {children}
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-30 pb-18 md:pt-38 md:pb-24">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-50 left-1/2 h-150 w-225 -translate-x-1/2 bg-[radial-gradient(closest-side,rgb(59_130_246/0.22),transparent)]"
      />
      <Container className="relative">
        <Reveal>
          <SectionHeading
            as="h1"
            eyebrow="Your developer knowledge hub"
            className="max-w-190"
            title={
              <>
                Stop Losing Your
                <br />
                <span className="bg-home-gradient bg-clip-text text-transparent">
                  Developer Knowledge
                </span>
              </>
            }
            subtitle="Snippets in VS Code, prompts in old chats, commands in bash history, links in a hundred browser tabs. DevLore brings it all into one fast, searchable place."
          >
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <CtaLink href={GET_STARTED_FREE.href} size="lg">
                {GET_STARTED_FREE.label}
              </CtaLink>
              <CtaLink href="#features" variant="outline" size="lg">
                See Features
              </CtaLink>
            </div>
          </SectionHeading>
        </Reveal>

        <Reveal className="mt-14 grid grid-cols-1 justify-items-center gap-5 md:mt-18 md:grid-cols-[1fr_auto_1fr] md:items-center md:gap-6">
          <Panel label="Your knowledge today...">
            <ChaosVisual />
          </Panel>
          <div
            aria-hidden
            className="grid size-14 rotate-90 place-items-center rounded-full bg-home-gradient text-white motion-safe:animate-arrow-pulse md:mt-7 md:rotate-0"
          >
            <ArrowRightIcon className="size-6.5" strokeWidth={2.2} />
          </div>
          <Panel label="...with DevLore">
            <DashboardPreview />
          </Panel>
        </Reveal>
      </Container>
    </section>
  );
}
