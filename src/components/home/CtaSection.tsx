import { Container } from "@/components/home/Container";
import { CtaLink } from "@/components/home/CtaLink";
import { Reveal } from "@/components/home/Reveal";
import { SectionHeading } from "@/components/home/SectionHeading";
import { GET_STARTED_FREE } from "@/lib/homepage";

export function CtaSection() {
  return (
    <section className="pb-20 md:pb-28">
      <Container>
        <Reveal className="py-14 text-center md:py-18">
          <SectionHeading
            title="Ready to Organize Your Knowledge?"
            subtitle="Bring your snippets, prompts and commands home. It takes a minute."
          >
            <CtaLink href={GET_STARTED_FREE.href} size="lg" className="mt-8">
              {GET_STARTED_FREE.label}
            </CtaLink>
          </SectionHeading>
        </Reveal>
      </Container>
    </section>
  );
}
