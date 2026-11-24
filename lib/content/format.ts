/**
 * Display helpers for dataset values and context. Pure (client-safe).
 * Units: "%" sits on the number ("50%"); any other unit is a word after a space ("7 months").
 */
export function formatValue(y: number, unit: string): string {
  if (unit === "%") return `${y}%`;
  return `${y} ${unit}`;
}

/** Short unit for axis ticks: "%" or nothing (the axis title carries other units). */
export const tickUnit = (unit: string) => (unit === "%" ? "%" : "");

const NOT_A_SURVEY = /^\s*Not a survey:\s*/i;
/** A description of several survey questions (e.g. "Several questions asked of both groups: ..."), not one verbatim. */
const SEVERAL_QUESTIONS = /^\s*(?:Several|Multiple|Two|Three|Four|Five) questions\b/i;

/**
 * The dataset's honest context line. One verbatim survey question is quoted ("Question"); measurements that
 * are not surveys ("Not a survey: ...") and paraphrases of several questions ("Several questions ...") are
 * shown as a note instead, so nothing paraphrased appears in quotation marks.
 */
export function datasetContext(questionWording: string): { kind: "question" | "note"; text: string } {
  if (NOT_A_SURVEY.test(questionWording)) {
    return { kind: "note", text: questionWording.replace(NOT_A_SURVEY, "").replace(/^./, (c) => c.toUpperCase()) };
  }
  if (SEVERAL_QUESTIONS.test(questionWording)) return { kind: "note", text: questionWording.trim() };
  return { kind: "question", text: questionWording };
}
