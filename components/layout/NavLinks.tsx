"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStore } from "@/lib/store";

const LINKS = [
  { href: "/read", label: "Read" },
  { href: "/explore", label: "Explore" },
  { href: "/listen", label: "Listen" },
  { href: "/about", label: "About" },
] as const;

/** Pill navigation. "Read" and "Explore" are the 2D/3D mode switch and carry the active era across. */
export function NavLinks() {
  const pathname = usePathname();
  const activeEra = useStore((s) => s.activeEra);

  return (
    <ul className="flex items-center gap-0.5 rounded-full bg-paper p-1 shadow-[0_6px_20px_rgb(18_18_17/0.08)] md:gap-1">
      {LINKS.map((link) => {
        const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
        const href = link.href === "/explore" ? `/explore?era=${activeEra}` : link.href;
        return (
          <li key={link.href}>
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              className={`block rounded-full px-2.5 py-2 text-sm font-semibold transition-colors duration-200 md:px-4 md:text-base ${
                active ? "bg-ink text-paper" : "hover:bg-cream"
              }`}
            >
              {link.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
