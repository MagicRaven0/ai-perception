import "server-only";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { getCredit, getImage } from "./index";
import type { Building, Credit } from "./schema";

/** Images and videos from content, resolved with their credit line. Plain serialisable data. */
export type CreditText = { text: string; url: string };
export type CreditedMedia = { src: string; alt: string; width: number; height: number; credit: CreditText };
export type BuildingVideoData = { src: string; poster?: string; title: string; credit: CreditText };

const creditText = (c: Credit): CreditText => ({ text: c.creditLine ?? `${c.author}, ${c.licence}`, url: c.url });

/** Null when the image or its credit does not exist: an uncredited image is never shown. */
export function creditedImage(imageId: string | undefined): CreditedMedia | null {
  const img = imageId ? getImage(imageId) : undefined;
  const credit = img ? getCredit(img.creditId) : undefined;
  if (!img || !credit) return null;
  return { src: img.src, alt: img.alt, width: img.width, height: img.height, credit: creditText(credit) };
}

/** A building's own video (`media.videoSrc`). Poster: its photo, else "<video>-poster.webp" beside the video. */
export function buildingVideo(b: Pick<Building, "id" | "media">): BuildingVideoData | null {
  const credit = getCredit(`video-${b.id}`);
  const src = b.media.videoSrc;
  if (!src || !credit) return null;
  const frame = src.replace(/\.mp4$/, "-poster.webp");
  const poster =
    creditedImage(b.media.imageId)?.src ?? (existsSync(join(process.cwd(), "public", frame)) ? frame : undefined);
  return { src, poster, title: credit.title, credit: creditText(credit) };
}
