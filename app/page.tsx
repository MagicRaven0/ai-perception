import Link from "next/link";
import { eras, site } from "@/lib/content";
import { TopNav } from "@/components/layout/TopNav";
import { Footer } from "@/components/layout/Footer";
import { ContentText } from "@/components/content/ContentText";
import { IslandsPreview } from "@/components/landing/IslandsPreview";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-[linear-gradient(180deg,var(--color-sky-top)_0%,var(--color-sky-bottom)_45%,var(--color-cream)_80%)]">
      <TopNav />

      <main id="main" className="mx-auto flex w-full max-w-[1280px] flex-1 flex-col px-6 pt-14 pb-16 md:px-12 md:pt-20">
        <h1 className="max-w-4xl font-display text-5xl leading-[1.02] font-medium tracking-headline md:text-7xl lg:text-8xl">
          {site.title}
        </h1>

        <p className="mt-6 max-w-3xl text-xl leading-snug md:text-2xl">
          <ContentText value={site.thesis} />
        </p>

        <div className="mt-12 w-full max-w-5xl md:mt-16">
          <IslandsPreview eras={eras} />
        </div>

        <div className="mt-12 flex flex-wrap items-center gap-3">
          <Link
            href="/explore"
            className="rounded-full bg-orange px-6 py-3 font-semibold text-ink transition-transform duration-300 ease-calm hover:-translate-y-0.5"
          >
            Explore in 3D
          </Link>
          <Link
            href="/read"
            className="rounded-full border border-ink bg-paper px-6 py-3 font-semibold transition-transform duration-300 ease-calm hover:-translate-y-0.5"
          >
            Read the long version
          </Link>
          <Link href="/listen" className="px-3 py-3 font-semibold underline underline-offset-2">
            Listen
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
