import Link from "next/link";
import { site } from "@/lib/content";
import { NavLinks } from "./NavLinks";

/** Late Checkout studio style: round mark on the left, white pill links on the right. */
export function TopNav() {
  return (
    <header className="z-hud flex items-center justify-between gap-3 px-4 pt-5 md:px-12 md:pt-6">
      <Link
        href="/"
        aria-label={`${site.title}, home`}
        className="flex size-12 shrink-0 items-center justify-center rounded-full bg-paper shadow-[0_6px_20px_rgb(18_18_17/0.08)] transition-transform duration-300 ease-calm hover:-translate-y-0.5"
      >
        <SiteMark />
      </Link>
      <nav aria-label="Main">
        <NavLinks />
      </nav>
    </header>
  );
}

/** Three dots in the era accent colours: our own mark (no third-party logos). */
function SiteMark() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
      <circle cx="6" cy="13" r="4" fill="var(--color-era1-accent)" />
      <circle cx="13" cy="13" r="4" fill="var(--color-era2-accent)" />
      <circle cx="20" cy="13" r="4" fill="var(--color-ink)" />
      <circle cx="20" cy="13" r="2" fill="var(--color-era3-accent)" />
    </svg>
  );
}
