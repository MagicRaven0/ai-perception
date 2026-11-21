import type { Metadata, Viewport } from "next";
import { Fustat, Inter_Tight, JetBrains_Mono } from "next/font/google";
import { eras, site } from "@/lib/content";
import type { EraId } from "@/lib/content/schema";
import { AudioDock } from "@/components/audio/AudioDock";
import { CustomCursor } from "@/components/ui/CustomCursor";
import { Analytics } from "@vercel/analytics/next";
import { THEME_SCRIPT } from "@/components/layout/ThemeToggle";
import { ChatLauncher } from "@/components/ai/ChatLauncher";
import { SkipLink } from "@/components/layout/SkipLink";
import { Toaster } from "@/components/layout/Toaster";
import { corpusForPrompt, getChunkRefs, getCorpus } from "@/lib/ai/corpus";
import { storedAnswers, textHash } from "@/lib/ai/summaries";
import { suggestedQuestions } from "@/content/suggested-questions";
import "./globals.css";

// Three font families only (class design rule). See CLAUDE.md.
const fustat = Fustat({ variable: "--font-fustat", subsets: ["latin"] });
const interTight = Inter_Tight({ variable: "--font-inter-tight", subsets: ["latin"] });
const jetbrainsMono = JetBrains_Mono({ variable: "--font-jetbrains-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: site.title,
    template: `%s · ${site.shortTitle}`,
  },
  description:
    "An explorable 3D world and long-read on how public perception of artificial intelligence changed, from 1956 to today. A WRI-101 adaptation project at the American University of Sharjah.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfaf6" },
    { media: "(prefers-color-scheme: dark)", color: "#121211" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${fustat.variable} ${interTight.variable} ${jetbrainsMono.variable} h-full antialiased`}
      data-theme="light"
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col pb-14 md:pb-[72px]">
        <SkipLink eraSlugs={Object.fromEntries(eras.map((e) => [e.id, e.slug])) as Record<EraId, string>} />
        {children}
        <ChatLauncher
          refs={getChunkRefs()}
          questions={suggestedQuestions}
          answers={storedAnswers(textHash(corpusForPrompt()))}
          corpusSize={getCorpus().length}
        />
        <AudioDock />
        <CustomCursor />
        <Analytics />
        <Toaster />
      </body>
    </html>
  );
}
