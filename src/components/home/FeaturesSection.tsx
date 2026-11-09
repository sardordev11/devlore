import { FolderIcon, SearchIcon, type LucideIcon } from "lucide-react";
import { createElement, type CSSProperties } from "react";

import { Container } from "@/components/home/Container";
import { Reveal } from "@/components/home/Reveal";
import { SectionHeading } from "@/components/home/SectionHeading";
import { Card } from "@/components/ui/card";
import { FEATURES, HOME_TYPES, type HomeFeature } from "@/lib/homepage";
import { getTypeIcon, getTypeTint } from "@/lib/type-icons";

const FEATURE_ICONS: Record<NonNullable<HomeFeature["icon"]>, LucideIcon> = {
  Search: SearchIcon,
  Folder: FolderIcon,
};

function FeatureCard({ feature }: { feature: HomeFeature }) {
  const type = HOME_TYPES[feature.type];
  const icon = feature.icon ? FEATURE_ICONS[feature.icon] : getTypeIcon(type.icon);

  return (
    <Card
      // The type color is dynamic, so it's passed in as a CSS variable.
      style={{ "--type-color": type.color } as CSSProperties}
      className="relative h-full gap-0 rounded-[14px] border border-white/8 bg-home-surface-2 p-7 ring-0 transition-[border-color,translate,box-shadow] duration-300 before:absolute before:inset-x-0 before:top-0 before:h-0.5 before:bg-(--type-color) before:opacity-70 hover:-translate-y-0.75 hover:border-(--type-color)/45 hover:shadow-[0_16px_40px_color-mix(in_srgb,var(--type-color)_14%,transparent)]"
    >
      <div
        className="mb-5 grid size-11 place-items-center rounded-[11px] shadow-[0_0_24px_color-mix(in_srgb,var(--type-color)_22%,transparent)]"
        style={getTypeTint(type.color)}
      >
        {createElement(icon, { "aria-hidden": true, className: "size-5.5" })}
      </div>
      <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
      <p className="text-[15px] leading-relaxed text-zinc-400">{feature.description}</p>
    </Card>
  );
}

export function FeaturesSection() {
  return (
    <section
      id="features"
      className="scroll-mt-16 border-y border-white/8 bg-home-features py-20 md:py-28"
    >
      <Container>
        <Reveal className="mb-14">
          <SectionHeading
            eyebrow="Features"
            title="Everything you reach for, in one place"
            subtitle="Every kind of developer knowledge gets a home, a color and a shortcut."
          />
        </Reveal>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <Reveal key={feature.title}>
              <FeatureCard feature={feature} />
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
