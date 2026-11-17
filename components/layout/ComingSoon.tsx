import Link from "next/link";
import { TopNav } from "./TopNav";

export function ComingSoon({ title, phase, body }: { title: string; phase: string; body: string }) {
  return (
    <div className="flex flex-1 flex-col">
      <TopNav />
      <main id="main" className="mx-auto w-full max-w-[1280px] flex-1 px-6 pt-16 pb-16 md:px-12">
        <h1 className="font-display text-4xl font-medium tracking-headline md:text-6xl">{title}</h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">{body}</p>
        <p className="mt-2 text-muted">Arrives in {phase}.</p>
        <Link
          href="/"
          className="mt-8 inline-block rounded-full border border-ink bg-paper px-5 py-2.5 font-semibold"
        >
          Back to start
        </Link>
      </main>
    </div>
  );
}
