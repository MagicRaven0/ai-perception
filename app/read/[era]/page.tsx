import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { eras, getEraBySlug } from "@/lib/content";
import { TopNav } from "@/components/layout/TopNav";
import { Footer } from "@/components/layout/Footer";
import { EraSection } from "@/components/editorial/EraSection";
import { EraObserver } from "@/components/editorial/EraObserver";

/** Single-era page, for deep links and QR codes (e.g. /read/the-past). */
export function generateStaticParams() {
  return eras.map((e) => ({ era: e.slug }));
}

export async function generateMetadata({ params }: PageProps<"/read/[era]">): Promise<Metadata> {
  const era = getEraBySlug((await params).era);
  return era ? { title: era.islandName } : {};
}

export default function EraPage({ params }: PageProps<"/read/[era]">) {
  return (
    <div className="flex flex-1 flex-col">
      <TopNav />
      <main id="main" className="mt-8">
        <Suspense fallback={<div className="min-h-[60vh]" />}>
          <EraContent params={params} />
        </Suspense>
      </main>
      <Footer />
      <EraObserver />
    </div>
  );
}

async function EraContent({ params }: { params: PageProps<"/read/[era]">["params"] }) {
  const era = getEraBySlug((await params).era);
  if (!era) notFound();

  const i = eras.indexOf(era);
  const prev = eras[i - 1];
  const next = eras[i + 1];

  return (
    <>
      <EraSection era={era} headingLevel={1} />
      <nav
        aria-label="Other eras"
        className="mx-auto flex max-w-[1280px] flex-wrap justify-between gap-3 px-6 py-12 md:px-12"
      >
        {prev ? (
          <Link href={`/read/${prev.slug}`} className="rounded-full border border-ink bg-paper px-6 py-3 font-semibold">
            ← {prev.islandName}
          </Link>
        ) : (
          <span />
        )}
        <Link href="/read" className="rounded-full px-6 py-3 font-semibold underline underline-offset-2">
          Read all three eras
        </Link>
        {next ? (
          <Link href={`/read/${next.slug}`} className="rounded-full border border-ink bg-paper px-6 py-3 font-semibold">
            {next.islandName} →
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </>
  );
}
