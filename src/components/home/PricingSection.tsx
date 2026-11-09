import { Container } from "@/components/home/Container";
import { PricingToggle } from "@/components/home/PricingToggle";
import { Reveal } from "@/components/home/Reveal";
import { SectionHeading } from "@/components/home/SectionHeading";

export function PricingSection({ planHref }: { planHref: string }) {
  return (
    <section id="pricing" className="scroll-mt-16 py-20 md:py-28">
      <Container>
        <Reveal className="mb-7">
          <SectionHeading
            eyebrow="Pricing"
            title="Start free, upgrade when you need more"
          />
        </Reveal>
        <PricingToggle planHref={planHref} />
      </Container>
    </section>
  );
}
