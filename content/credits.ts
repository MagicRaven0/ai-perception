import type { z } from "zod";
import type { Credit, Image } from "@/lib/content/schema";

/**
 * Credits for every image, 3D model, sound, font and video used on the site (class rule).
 * AI-generated assets must set aiTool to the tool's name.
 */
export const credits: z.input<typeof Credit>[] = [
  {
    id: "font-fustat",
    kind: "font",
    title: "Fustat",
    author: "Mohamed Gaber, Khaled Hosny",
    licence: "SIL Open Font License 1.1",
    url: "https://fonts.google.com/specimen/Fustat",
  },
  {
    id: "font-inter-tight",
    kind: "font",
    title: "Inter Tight",
    author: "Rasmus Andersson",
    licence: "SIL Open Font License 1.1",
    url: "https://fonts.google.com/specimen/Inter+Tight",
  },
  {
    id: "font-jetbrains-mono",
    kind: "font",
    title: "JetBrains Mono",
    author: "JetBrains",
    licence: "SIL Open Font License 1.1",
    url: "https://fonts.google.com/specimen/JetBrains+Mono",
  },
];

/**
 * Images: put the file in public/images/ (WebP preferred), then add an entry here with its credit.
 * Example: { id: "mccarthy-portrait", src: "/images/mccarthy.webp", alt: "...", width: 800, height: 1000, creditId: "img-mccarthy" }
 */
export const images: z.input<typeof Image>[] = [];
