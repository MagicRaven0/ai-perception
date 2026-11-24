import type { CreditText } from "@/lib/content/media";

/** The credit under an image or video, linked to its licence page when that is an outside page. */
export function CreditLine({ credit }: { credit: CreditText }) {
  return (
    <p className="mt-1.5 text-xs leading-snug text-muted">
      {/^https?:\/\//.test(credit.url) ? (
        <a href={credit.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
          {credit.text}
        </a>
      ) : (
        credit.text
      )}
    </p>
  );
}
