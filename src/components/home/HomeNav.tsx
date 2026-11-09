import Link from "next/link";

import { Container } from "@/components/home/Container";
import { CtaLink } from "@/components/home/CtaLink";
import { Logo } from "@/components/home/Logo";
import { MobileNavMenu } from "@/components/home/MobileNavMenu";
import { NavScrollBackground } from "@/components/home/NavScrollBackground";
import { NAV_GET_STARTED, NAV_SIGN_IN, SECTION_LINKS } from "@/lib/homepage";

export function HomeNav() {
  return (
    <NavScrollBackground>
      {/* From md the equal outer columns keep the section links centered on the page. */}
      <Container className="flex h-16 items-center gap-4 md:grid md:grid-cols-[1fr_auto_1fr] md:justify-items-start md:gap-8">
        <Logo compact />
        <nav aria-label="Main" className="hidden gap-6 text-sm text-zinc-400 md:flex">
          {SECTION_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-sm hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-home-accent"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1.5 md:justify-self-end md:gap-2">
          <CtaLink href={NAV_SIGN_IN.href} variant="outline" className="px-3 md:px-4">
            {NAV_SIGN_IN.label}
          </CtaLink>
          <CtaLink href={NAV_GET_STARTED.href} className="px-3 md:px-4">
            {NAV_GET_STARTED.label}
          </CtaLink>
          <MobileNavMenu links={SECTION_LINKS} />
        </div>
      </Container>
    </NavScrollBackground>
  );
}
