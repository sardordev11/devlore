import { SparklesIcon } from "lucide-react";

import { Checklist } from "@/components/home/Checklist";
import { Container } from "@/components/home/Container";
import { Reveal } from "@/components/home/Reveal";
import { SectionHeading } from "@/components/home/SectionHeading";
import { Badge } from "@/components/ui/badge";
import { AI_FEATURES, AI_TAGS, HOME_TYPES } from "@/lib/homepage";

const PRO_COLOR = HOME_TYPES.prompt.color;

// Syntax colors from VS Code's Dark+ theme.
const K = "text-[#c586c0]";
const F = "text-[#dcdcaa]";
const S = "text-[#ce9178]";
const N = "text-[#b5cea8]";

// Staggered entrance once the editor's Reveal is visible (CSS only).
const TAG_DELAYS = [
  "[animation-delay:0.5s]",
  "[animation-delay:0.7s]",
  "[animation-delay:0.9s]",
  "[animation-delay:1.1s]",
  "[animation-delay:1.3s]",
];

function CodeSample() {
  return (
    <pre className="overflow-x-auto p-5 font-mono text-[13px] leading-[1.7] text-[#d4d4d4]">
      <code>
        <span className={K}>import</span> {"{ useEffect, useState }"}{" "}
        <span className={K}>from</span> <span className={S}>&quot;react&quot;</span>;
        {"\n\n"}
        <span className={K}>export function</span> <span className={F}>useDebounce</span>
        {"<T>(value: T, delay = "}
        <span className={N}>300</span>
        {") {\n  "}
        <span className={K}>const</span> {"[debounced, setDebounced] = "}
        <span className={F}>useState</span>
        {"(value);\n\n  "}
        <span className={F}>useEffect</span>
        {"(() => {\n    "}
        <span className={K}>const</span> {"id = "}
        <span className={F}>setTimeout</span>
        {"(() => "}
        <span className={F}>setDebounced</span>
        {"(value), delay);\n    "}
        <span className={K}>return</span> {"() => "}
        <span className={F}>clearTimeout</span>
        {"(id);\n  }, [value, delay]);\n\n  "}
        <span className={K}>return</span> {"debounced;\n}"}
      </code>
    </pre>
  );
}

function AiTags() {
  return (
    <div className="border-t border-white/6 px-5 pt-4 pb-5">
      <span
        className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold"
        style={{ color: PRO_COLOR }}
      >
        <SparklesIcon aria-hidden className="size-3.5" />
        AI Generated Tags
      </span>
      <div className="flex flex-wrap gap-2">
        {AI_TAGS.map((tag, index) => (
          <span
            key={tag}
            className={`rounded-full border border-home-accent/40 bg-home-accent/12 px-2.5 py-0.5 font-mono text-xs text-blue-300 motion-safe:group-data-visible/reveal:animate-tag-in ${TAG_DELAYS[index]}`}
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

export function AiSection() {
  return (
    <section className="border-y border-white/8 bg-home-bg-alt py-20 md:py-28">
      <Container className="grid items-center gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
        <Reveal>
          <Badge className="mb-5 h-auto gap-1.5 bg-orange-300 px-3 py-1 text-xs font-semibold text-black">
            <SparklesIcon aria-hidden />
            Pro Feature
          </Badge>
          <SectionHeading
            align="left"
            title="Let AI do the busywork"
            subtitle="DevLore reads what you save and helps you keep it organized and useful."
          />
          <Checklist items={AI_FEATURES} className="mt-8" />
        </Reveal>

        <Reveal className="min-w-0 overflow-hidden rounded-[14px] border border-white/14 bg-[#1e1e1e] shadow-[0_24px_64px_rgb(0_0_0/0.5)]">
          <div className="flex items-center gap-2 bg-[#2d2d2d] px-4 py-3">
            <span className="size-2.75 rounded-full bg-[#ff5f57]" />
            <span className="size-2.75 rounded-full bg-[#febc2e]" />
            <span className="size-2.75 rounded-full bg-[#28c840]" />
            <span className="ml-3 font-mono text-xs text-zinc-500">useDebounce.ts</span>
          </div>
          <CodeSample />
          <AiTags />
        </Reveal>
      </Container>
    </section>
  );
}
