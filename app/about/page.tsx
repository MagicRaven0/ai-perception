import type { Metadata } from "next";
import { about, citations, credits, images, site } from "@/lib/content";
import { TopNav } from "@/components/layout/TopNav";
import { Footer } from "@/components/layout/Footer";
import { ContentText } from "@/components/content/ContentText";
import { Markdown } from "@/components/content/Markdown";

export const metadata: Metadata = { title: "About" };

const KIND_LABEL = {
  image: "Images",
  model: "3D models",
  audio: "Audio",
  music: "Music",
  font: "Fonts",
  video: "Video",
} as const;

export default function AboutPage() {
  const kinds = (Object.keys(KIND_LABEL) as (keyof typeof KIND_LABEL)[]).filter((k) =>
    credits.some((c) => c.kind === k),
  );

  return (
    <div className="flex flex-1 flex-col">
      <TopNav />
      <main id="main" className="mx-auto w-full max-w-[1280px] px-6 pt-14 pb-16 md:px-12 md:pt-20">
        <h1 className="font-display text-5xl font-medium tracking-headline md:text-7xl">About this project</h1>
        <p className="mt-6 max-w-3xl text-xl leading-snug md:text-2xl">
          <ContentText value={site.thesis} />
        </p>

        {/* Rhetorical situation (Handout 12.1) */}
        <section aria-labelledby="situation" className="mt-16">
          <h2 id="situation" className="text-2xl font-medium">
            Rhetorical situation
          </h2>
          <table className="mt-4 w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-ink">
                <th scope="col" className="mono-label w-1/4 py-3 pr-4 font-normal">
                  Element
                </th>
                <th scope="col" className="mono-label py-3 font-normal">
                  Our answer
                </th>
              </tr>
            </thead>
            <tbody>
              {about.rhetoricalSituation.map((r) => (
                <tr key={r.element} className="border-b border-ink align-top">
                  <th scope="row" className="py-4 pr-4 text-lg font-medium">
                    {r.element}
                  </th>
                  <td className="py-4 text-lg leading-relaxed text-muted">
                    <ContentText value={r.answer} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section aria-labelledby="genre" className="mt-16 grid gap-6 md:grid-cols-12">
          <h2 id="genre" className="text-2xl font-medium md:col-span-4">
            Why this genre
          </h2>
          <div className="flex flex-col gap-4 text-lg leading-[1.6] text-muted md:col-span-8">
            <Markdown value={about.genreRationale} citations={citations} />
          </div>
        </section>

        <section aria-labelledby="team" className="mt-16 grid gap-6 md:grid-cols-12">
          <h2 id="team" className="text-2xl font-medium md:col-span-4">
            Team
          </h2>
          <ul className="border-t border-ink md:col-span-8">
            {site.team.map((m, i) => (
              <li key={i} className="flex justify-between gap-4 border-b border-ink py-3">
                <span className="font-medium">
                  <ContentText value={m.name} />
                </span>
                <span className="text-muted">
                  <ContentText value={m.role} />
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="ai" className="mt-16 grid gap-6 md:grid-cols-12">
          <h2 id="ai" className="text-2xl font-medium md:col-span-4">
            How we used AI
          </h2>
          <div className="flex flex-col gap-4 text-lg leading-[1.6] text-muted md:col-span-8">
            <Markdown value={site.aiDisclosure} />
          </div>
        </section>

        <section aria-labelledby="credits" className="mt-16">
          <h2 id="credits" className="text-2xl font-medium">
            Credits
          </h2>
          {kinds.map((k) => (
            <div key={k} className="mt-6">
              <h3 className="mono-label border-b border-ink pb-2">{KIND_LABEL[k]}</h3>
              <ul>
                {credits
                  .filter((c) => c.kind === k)
                  .map((c) => (
                    <li key={c.id} className="flex flex-wrap justify-between gap-x-6 gap-y-1 border-b border-rule py-3">
                      <span>
                        <span className="font-medium">{c.title}</span>
                        <span className="text-muted">{c.creditLine ? `. ${c.creditLine}` : ` by ${c.author}`}</span>
                        {c.aiTool && !c.author.includes("AI-generated") && <span className="text-muted"> · AI-generated</span>}
                      </span>
                      <span className="text-muted">
                        {/^https?:\/\//.test(c.url) ? (
                          <a
                            href={c.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline underline-offset-2"
                          >
                            {c.licence}
                          </a>
                        ) : (
                          c.licence
                        )}
                      </span>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
          {images.length === 0 && (
            <p className="mt-6 text-muted">Image and 3D model credits are added as assets arrive.</p>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
