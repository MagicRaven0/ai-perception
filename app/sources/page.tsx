import type { Metadata } from "next";
import { eras, sources } from "@/lib/content";
import { TopNav } from "@/components/layout/TopNav";
import { Footer } from "@/components/layout/Footer";
import { ContentText } from "@/components/content/ContentText";
import { isPlaceholder } from "@/lib/content/placeholder";

export const metadata: Metadata = { title: "Works cited" };

/** APA strings end with their URL; it is shown once, as the clickable link after the text. */
function withoutTrailingUrl(apa: string, url: string): string {
  const trimmed = apa.trimEnd();
  return /^https?:\/\//.test(url) && trimmed.endsWith(url) ? trimmed.slice(0, -url.length).trimEnd() : apa;
}

export default function SourcesPage() {
  // One APA 7 reference list, alphabetical by first author. Placeholders go last as "coming soon" boxes.
  const list = [...sources].sort(
    (a, b) => Number(isPlaceholder(a.apa)) - Number(isPlaceholder(b.apa)) || a.apa.localeCompare(b.apa),
  );
  const eraNames = (ids: string[]) =>
    eras
      .filter((e) => ids.includes(e.id))
      .map((e) => e.islandName)
      .join(" · ");

  return (
    <div className="flex flex-1 flex-col">
      <TopNav />
      <main id="main" className="mx-auto w-full max-w-[1280px] px-6 pt-14 pb-16 md:px-12 md:pt-20">
        <h1 className="font-display text-5xl font-medium tracking-headline md:text-7xl">Works cited</h1>
        <p className="mt-4 max-w-2xl text-lg text-muted">
          APA 7. Every fact, number and quote on this site links back to one of these sources.
        </p>

        {list.length === 0 ? (
          <p className="mt-12 border-t border-ink pt-6 text-muted">Sources are being added.</p>
        ) : (
          <ul className="mt-14 border-t border-ink">
            {list.map((s) => (
              <li
                key={s.id}
                id={s.id}
                className="scroll-mt-24 border-b border-rule py-4 pl-8 -indent-8 leading-relaxed target:bg-paper"
              >
                {isPlaceholder(s.apa) ? <ContentText value={s.apa} /> : withoutTrailingUrl(s.apa, s.url)}{" "}
                {!isPlaceholder(s.apa) && /^https?:\/\//.test(s.url) && (
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="break-all underline underline-offset-2"
                  >
                    {s.url}
                  </a>
                )}
                {s.eraIds.length > 0 && (
                  <span className="mt-1 block indent-0 text-sm text-muted">{eraNames(s.eraIds)}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </main>
      <Footer />
    </div>
  );
}
