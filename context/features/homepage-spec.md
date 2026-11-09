# Homepage

## Overview

Replace the placeholder `src/app/page.tsx` with the real marketing homepage, built from the static prototype in `prototypes/homepage/` (`index.html`, `styles.css`, `script.js`). Match its layout, copy and animations, rebuilt with Tailwind CSS v4 and shadcn/ui like the rest of the app. The prototype stays in place as a reference.

## Requirements

### Structure

- `/` stays public (not in the `src/proxy.ts` matcher)
- `src/app/page.tsx` is a server component that composes the sections and sets page `metadata` (title and description from the prototype)
- Sections as components in `src/components/home/`: `HomeNav`, `Hero`, `ChaosVisual`, `DashboardPreview`, `FeaturesSection`, `AiSection`, `PricingSection`, `CtaSection`, `HomeFooter`
- Server components by default; `'use client'` only for the interactive pieces:
  - `HomeNav` scroll state (or a small `NavScrollBackground` wrapper) — becomes opaque after scrolling
  - `ChaosVisual` — the floating icon animation
  - `PricingToggle` — monthly/yearly switch and the Pro price it controls
  - `Reveal` — fade-in-on-scroll wrapper used by every section
  - `AiTags` — "AI Generated Tags" staggered entrance (can be CSS-only inside `Reveal` if simpler)
- Footer year from `new Date().getFullYear()` on the server

### Styling

- Tailwind utilities only; no port of `styles.css` and no inline styles beyond the dynamic transforms in `ChaosVisual` and type colors that must be dynamic
- Use shadcn `Button` (with `render={<Link />}` for links, as in `TopBar`), `Badge`, `Card` and `Switch` (pricing toggle) where they fit
- App fonts (Geist / Geist Mono from the root layout) instead of Inter / JetBrains Mono
- Dark theme from the root layout; homepage-only colors (accent blue `#3b82f6`, `#2563eb` hover, light-to-blue gradient, section backgrounds) as `@theme` tokens in `src/app/globals.css`
- Keyframes (arrow pulse, reveal fade, tag pop-in) in `globals.css`; respect `prefers-reduced-motion` (`motion-safe:` / `motion-reduce:` variants, `ChaosVisual` stays static)
- Responsive as in the prototype: hero visual stacks with the arrow pointing down, grids go single column, no horizontal scroll at 390px

### Clean and DRY

- Data-driven sections: features, chaos icons, preview sidebar/cards, AI checklist, pricing plans and footer links as typed constant arrays in `src/lib/homepage.ts` (or next to their component), rendered with `.map()`
- Reuse the app's type colors and Lucide icons via `getTypeIcon` / `getTypeTint` from `src/lib/type-icons.ts` for feature cards and the dashboard preview instead of the prototype's separate palette, so the homepage matches the product
- Prices from one `PLAN_PRICES` constant (`$8/month`, `$72/year` — "$6/month, billed yearly", "Save 25%") shared by the toggle and the plan cards
- Shared `SectionHeading` (eyebrow, title, subtitle) and `Checklist` components; one `Logo` component for nav and footer
- Brand SVGs that Lucide doesn't have (Notion, GitHub, Slack, VS Code) in one `chaos-icons.tsx` file
- `ChaosVisual` animation in a `useChaosAnimation` hook (`src/hooks/`): `requestAnimationFrame` loop with drift, wall bounces, rotation/scale pulse and cursor repulsion; pauses off screen (`IntersectionObserver`) and in hidden tabs; re-measures on resize; cleans up all listeners and the frame on unmount; writes transforms through refs, not React state

### Links and Buttons

Session read in `page.tsx` via `auth()` and passed down as `isSignedIn`:

| Element                                   | Signed out         | Signed in    |
| ----------------------------------------- | ------------------ | ------------ |
| Logo (nav, footer)                        | `/`                | `/`          |
| Nav "Features" / "Pricing", footer same   | `#features` / `#pricing` | same   |
| Nav "Sign In"                             | `/sign-in`         | hidden       |
| Nav "Get Started"                         | `/sign-up`         | "Dashboard" → `/dashboard` |
| Hero "Get Started Free", CTA button       | `/sign-up`         | "Go to Dashboard" → `/dashboard` |
| Hero "See Features"                       | `#features`        | same         |
| Free plan "Get Started"                   | `/sign-up`         | `/dashboard` |
| Pro plan "Upgrade to Pro"                 | `/sign-up`         | `/dashboard` (billing not built yet) |

- Smooth scrolling for anchor links (`scroll-smooth` on `html`) with `scroll-mt` on sections so the fixed nav doesn't cover headings
- Footer: drop placeholder links with no page (Changelog, Docs, Blog, Support, About, Privacy, Terms); keep Features, Pricing, Sign In, Sign Up

## Out of Scope

- Stripe checkout / billing page
- Light-mode variant of the homepage
- Changes to `prototypes/homepage/`

## Testing

- Unit tests only if new utilities land in `src/lib` (e.g. price/link helpers)
- Check in the browser at 1440px and 390px, signed out and signed in: every link target, pricing toggle, chaos animation and cursor repulsion, reveals, nav opacity on scroll, reduced motion
