/** Literal prefix that marks unfinished content. Kept zod-free so client components can import it. */
export const PLACEHOLDER_PREFIX = "TODO:";

export function isPlaceholder(value: string | undefined | null): boolean {
  return typeof value === "string" && value.trimStart().startsWith(PLACEHOLDER_PREFIX);
}

/** The human-readable part of a placeholder, e.g. "TODO: thesis sentence" -> "thesis sentence". */
export function placeholderLabel(value: string): string {
  return value.trimStart().slice(PLACEHOLDER_PREFIX.length).trim();
}
