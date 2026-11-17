import type { Metadata } from "next";
import { eras, sources } from "@/lib/content";
import { TopNav } from "@/components/layout/TopNav";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = { title: "Works cited" };

export default function SourcesPage() {
  const groups = [
    ...eras.map((e) => ({ id: e.id, title: e.islandName, items: sources.filter((s) => s.eraIds.includes(e.id)) })),
    { id: "general", title: "General", items: sources.filter((s) => s.eraIds.length === 0) },
  ].filter((g) => g.items.length > 0);

  return (
    <div className="flex flex-1 flex-col">
      <TopNav />
      <main id="main" className="mx-auto w-full max-w-[1280px] px-6 pt-14 pb-16 md:px-12 md:pt-20">
        <h1 className="font-display text-5xl font-medium tracking-headline md:text-7xl">Works cited</h1>
        <p className="mt-4 max-w-2xl text-lg text-muted">
          APA 7. Every fact, number and quote on this site links back to one of these sources.
        </p>

        {groups.length === 0 ? (
          <p className="mt-12 border-t border-ink pt-6 text-muted">Sources are being added.</p>
        ) : (
          groups.map((g) => (
            <section key={g.id} aria-labelledby={`src-${g.id}`} className="mt-14">
              <h2 id={`src-${g.id}`} className="border-b border-ink pb-3 text-2xl font-medium">
                {g.title}
              </h2>
              <ul>
                {[...g.items]
                  .sort((a, b) => a.apa.localeCompare(b.apa))
                  .map((s) => (
                    <li key={s.id} id={s.id} className="border-b border-rule py-4 pl-8 -indent-8 leading-relaxed">
                      {s.apa}{" "}
                      {/^https?:\/\//.test(s.url) && (
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="break-all underline underline-offset-2"
                        >
                          {s.url}
                        </a>
                      )}
                    </li>
                  ))}
              </ul>
            </section>
          ))
        )}
      </main>
      <Footer />
    </div>
  );
}
