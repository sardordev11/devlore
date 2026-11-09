import Link from "next/link";

import { Container } from "@/components/home/Container";
import { Logo } from "@/components/home/Logo";
import { FOOTER_COLUMNS } from "@/lib/homepage";

export function HomeFooter({ year }: { year: number }) {
  return (
    <footer className="border-t border-white/8 bg-home-bg-alt pt-16 pb-8">
      <Container className="flex flex-col justify-between gap-12 md:flex-row">
        <div>
          <Logo />
          <p className="mt-3 text-sm text-zinc-500">One hub for all your developer knowledge.</p>
        </div>
        <div className="flex flex-wrap gap-10 md:gap-18">
          {FOOTER_COLUMNS.map((column) => (
            <div key={column.title} className="flex flex-col text-sm md:gap-2.5">
              <h2 className="mb-1 text-[13px] font-semibold">{column.title}</h2>
              {column.links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="w-fit rounded-sm py-2.5 text-zinc-500 md:py-0 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-home-accent"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          ))}
        </div>
      </Container>
      <Container className="mt-12">
        <p className="border-t border-white/8 pt-6 text-[13px] text-zinc-500">
          &copy; {year} DevLore. All rights reserved.
        </p>
      </Container>
    </footer>
  );
}
