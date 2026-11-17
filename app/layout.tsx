import type { Metadata, Viewport } from "next";
import { Fustat, Inter_Tight, JetBrains_Mono } from "next/font/google";
import { site } from "@/lib/content";
import { AudioDock } from "@/components/audio/AudioDock";
import { THEME_SCRIPT } from "@/components/layout/ThemeToggle";
import { ChatLauncher } from "@/components/ai/ChatLauncher";
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
        <a
          href="#main"
          className="sr-only z-skip rounded-full bg-paper px-4 py-2 font-semibold focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Skip to content
        </a>
        {children}
        <ChatLauncher
          refs={getChunkRefs()}
          questions={suggestedQuestions}
          answers={storedAnswers(textHash(corpusForPrompt()))}
          corpusSize={getCorpus().length}
        />
        <AudioDock />
      </body>
    </html>
  );
}
