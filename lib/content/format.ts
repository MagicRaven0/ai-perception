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

/**
 * The dataset's honest context line. Survey questions are quoted ("Question"); measurements that are not
 * surveys ("Not a survey: ...") are shown as a note instead.
 */
export function datasetContext(questionWording: string): { kind: "question" | "note"; text: string } {
  return NOT_A_SURVEY.test(questionWording)
    ? { kind: "note", text: questionWording.replace(NOT_A_SURVEY, "").replace(/^./, (c) => c.toUpperCase()) }
    : { kind: "question", text: questionWording };
}
