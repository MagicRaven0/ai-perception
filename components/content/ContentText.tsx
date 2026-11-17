import { isPlaceholder, placeholderLabel } from "@/lib/content/placeholder";

type Props = {
  value: string;
  className?: string;
};

/**
 * Renders a content string. Placeholders ("TODO: ...") show as a clearly marked hatched box,
 * so missing content is obvious on screen and never looks like a real claim.
 */
export function ContentText({ value, className }: Props) {
  if (!isPlaceholder(value)) return <span className={className}>{value}</span>;

  return (
    <span
      className={`${className ?? ""} rounded-[4px] border border-dashed border-current px-[0.25em] opacity-75`}
      style={{
        backgroundImage:
          "repeating-linear-gradient(135deg, transparent 0 6px, color-mix(in srgb, currentColor 14%, transparent) 6px 7px)",
      }}
      data-placeholder="true"
    >
      <span className="sr-only">Placeholder: </span>
      {placeholderLabel(value)}
    </span>
  );
}
