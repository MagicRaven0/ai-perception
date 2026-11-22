# Chatbot test results

Tests: `docs/CHATBOT_TESTS.md` (70 questions: 60 original + 10 round 5 rows). Runner: `npm run test:chatbot -- out.json`.

## 22 Nov 2026: local model run stopped, no valid results yet

- Model: `local/qwen3:8b` through Ollama on the laptop (RTX 5070, 8 GB).
- Stopped after 40 of 70 questions. The results are not valid tests of the chatbot: the model never saw its
  instructions or the research notes. Answers were empty, or said things like "I am Qwen" and "the provided text
  does not mention any workshop".
- Cause: the chat instructions include the whole research corpus, about 30,000 tokens after round 5. Ollama's
  default context window cuts that off, and an 8B model with a 32k window does not fit in 8 GB of GPU memory.
  Qwen 3 also often spends its whole token budget "thinking", which left 41 of 48 stored summaries empty.
- Fixes made: the runner now finds the 10 round 5 rows (it skipped them before); `npm run gen-ai` never stores an
  empty summary or answer; the blank entries were removed from `content/generated/`.

## Next run

Run with the production model (Vercel AI Gateway or DeepSeek), which is also what visitors will use:

1. In `.env.local`, set `AI_PROVIDER=gateway` and `AI_GATEWAY_API_KEY=<key from Vercel → AI Gateway → API Keys>`
   (or `AI_PROVIDER=deepseek` and `DEEPSEEK_API_KEY=...`).
2. `npm run gen-ai`, then `npm run test:chatbot -- chatbot-test-results.json`.
3. Record ✓ / ✗ / ? per question below. Analyst test 25 checks a common mistake: the Centre for Long-Term
   Resilience ran the scheming study; the AI Security Institute funded it.
