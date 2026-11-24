import Image from "next/image";
import type { CreditedMedia } from "@/lib/content/media";
import { CreditLine } from "./CreditLine";

/** A licensed photo with its exact credit line right under it (class rule: every image is credited). */
export function CreditedImage({ image, sizes, className }: { image: CreditedMedia; sizes: string; className?: string }) {
  return (
    <figure className={className}>
      <Image
        src={image.src}
        alt={image.alt}
        width={image.width}
        height={image.height}
        sizes={sizes}
        className="h-auto w-full rounded-[4px] bg-cream"
      />
      <figcaption>
        <CreditLine credit={image.credit} />
      </figcaption>
    </figure>
  );
}
