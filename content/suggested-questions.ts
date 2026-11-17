import type { PersonaId } from "@/lib/ai/personas";

/**
 * Starter questions shown in the chat panel, 4 per persona.
 * `npm run gen-ai` pre-generates an answer for each (content/generated/answers.json) so the chatbot still
 * demos well if the AI service is down or the class budget runs out. Re-run it after changing questions.
 */
export const suggestedQuestions: Record<PersonaId, string[]> = {
  guide: [
    "What is this project arguing?",
    "Where should I start exploring?",
    "How did people's view of AI change over time?",
    "What are the biggest risks you found?",
  ],
  "researcher-1956": [
    "What were you hoping thinking machines could do?",
    "What were computers like in your day?",
    "How long did you think it would take?",
    "What would surprise you about AI today?",
  ],
  "analyst-2026": [
    "Do people trust AI more or less now?",
    "What do the polls say about AI and jobs?",
    "How reliable are these surveys?",
    "How do 1956 predictions compare with today?",
  ],
};
