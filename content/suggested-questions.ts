import type { PersonaId } from "@/lib/ai/personas";

/**
 * Starter questions shown in the chat panel, 4 per persona.
 * `npm run gen-ai` pre-generates an answer for each (content/generated/answers.json) so the chatbot still
 * demos well if the AI service is down or the class budget runs out. Re-run it after changing questions.
 *
 * Updated 22 Nov 2026 (CONTENT_PROMPTS Prompt 9): every question is answerable from content/ and the corpus.
 * Test set with expected answers: docs/CHATBOT_TESTS.md.
 * Round 5 (22 Nov 2026): two questions swapped to cover the teammates' essays; re-run gen-ai.
 */
export const suggestedQuestions: Record<PersonaId, string[]> = {
  guide: [
    "What is this project arguing?",
    "How did people's view of AI change from the 1950s to today?",
    "What do your three essays each argue?",
    "Where should I start exploring?",
  ],
  "researcher-1956": [
    "What were you hoping thinking machines could do?",
    "What were computers like in your day?",
    "How long did you expect it to take?",
    "What would surprise you about AI today?",
  ],
  "analyst-2026": [
    "Are people more excited or more concerned about AI now?",
    "How much control do people feel they have over AI?",
    "How often does AI deceive in safety tests?",
    "Is AI out of control, or just badly trained?",
  ],
};
