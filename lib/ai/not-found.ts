/** Marker the model writes at the end of an answer that is not in the research; the chat shows a label for it. */
export const NOT_FOUND = "[NONE]";

/** Wording a model uses when it says something is not in the research. */
const REFUSAL =
  /\b(?:not|no|nothing|cannot)\b[^.!?]{0,80}\b(?:our|the) (?:provided )?(?:research|notes|corpus)\b|\b(?:our|the) (?:provided )?(?:research|notes|corpus)\b[^.!?]{0,60}(?:\b(?:not|no|nothing)\b|n['’]t\b)|(?:\bcannot|\bcan['’]t|\bcould not|\bcouldn['’]t|\bunable to)\b[^.!?]{0,30}\b(?:find|answer|provide|predict)\b/i;

/**
 * Whether to show "Not found in our research". Models sometimes add [NONE] to an answer that does answer the question,
 * so the marker only counts when the answer cites nothing or says in words that something is not in the research.
 */
export function isNotFound(text: string, citesSomething: boolean): boolean {
  return text.includes(NOT_FOUND) && (!citesSomething || REFUSAL.test(text));
}
