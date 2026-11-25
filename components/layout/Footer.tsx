import Link from "next/link";
import { site } from "@/lib/content";
import { ContentText } from "@/components/content/ContentText";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-rule">
      <div className="mx-auto flex w-full max-w-[1280px] flex-wrap items-baseline justify-between gap-x-6 gap-y-3 px-6 py-6 text-sm text-muted md:px-12">
        <p className="flex flex-wrap gap-x-4 gap-y-1">
          <span>
            {site.course} · {site.university}
          </span>
          <span>
            {site.team.map((m, i) => (
              <span key={i}>
                {i > 0 && ", "}
                <ContentText value={m.name} />
              </span>
            ))}
          </span>
        </p>
        <nav aria-label="Footer" className="flex gap-4">
          <Link href="/sources" className="hover:text-ink hover:underline">
            Works cited
          </Link>
          <Link href="/about" className="hover:text-ink hover:underline">
            About
          </Link>
        </nav>
      </div>
    </footer>
  );
}
