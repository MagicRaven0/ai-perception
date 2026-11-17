import Link from "next/link";
import { site } from "@/content/site";

const links = [
  { href: "/read", label: "Read" },
  { href: "/explore", label: "Explore" },
  { href: "/listen", label: "Listen", soon: true },
  { href: "/about", label: "About", soon: true },
] as const;

/** Late Checkout studio style: round mark on the left, white pill links on the right. */
export function TopNav() {
  return (
    <header className="z-hud flex items-center justify-between gap-4 px-6 pt-6 md:px-12">
      <Link
        href="/"
        aria-label={`${site.title}, home`}
        className="flex size-12 shrink-0 items-center justify-center rounded-full bg-paper shadow-[0_6px_20px_rgb(18_18_17/0.08)] transition-transform duration-300 ease-calm hover:-translate-y-0.5"
      >
        <SiteMark />
      </Link>
      <nav aria-label="Main">
        <ul className="flex items-center gap-1 rounded-full bg-paper p-1 shadow-[0_6px_20px_rgb(18_18_17/0.08)]">
          {links.map((link) => (
            <li key={link.href}>
              {"soon" in link ? (
                <span
                  aria-disabled="true"
                  title="Coming soon"
                  className="block cursor-default rounded-full px-3 py-2 text-sm font-semibold text-muted md:px-4 md:text-base"
                >
                  {link.label}
                </span>
              ) : (
                <Link
                  href={link.href}
                  className="block rounded-full px-3 py-2 text-sm font-semibold transition-colors duration-200 hover:bg-cream md:px-4 md:text-base"
                >
                  {link.label}
                </Link>
              )}
            </li>
          ))}
        </ul>
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
