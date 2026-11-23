# Prompt for the next Claude Code session (23 Nov 2026)

Paste everything below the line into Claude Code in the project folder (a fresh chat is best if the old one is over 70% context).

---

Continue the integration. You finished up to phase 5 last time. Since then the project Claude added more content, photos, videos and a voice pipeline. Your job now is to get **everything** onto the site and ship a preview.

**First:** read `CLAUDE.md`, `docs/VISION.md`, then every "For Claude Code" section in `docs/NOTES_FROM_PROJECT_CLAUDE.md`, rounds 5, 5b, 6, 7 and 8 especially. Then read `docs/PHOTOS.md` ("Round 6"), `tools/voices/README.md` and `docs/WHAT_WE_NEED.md`. Check `git log` and `git status` to see exactly where you stopped. Then give me a short step list and start. Don't wait for approval unless something is unclear.

**Ground rules (unchanged)**
- Never reword text, numbers, quotes or citations in `content/`. If content breaks a schema, check or layout, log it in `docs/CONTENT_ERRORS.md` and work around it in code.
- The only content edits allowed are the ones the notes list:
  - image fields;
  - `credits`/`images` entries;
  - `origin` on sources;
  - `media.videoSrc`/`media.datasetId`;
  - episode audio fields once audio exists.
- Re-read any `content/` file right before you edit it. The project Claude edits these files too.
- Everything else in `CLAUDE.md` still applies.

**Remaining work, in this order**
1. Finish whatever is left of your phase 5. Then run `npm run check-content` and `npm run verify` against the new content: 20 buildings (6/6/10), 18 insights, 4 comparisons, 9 datasets, 23 sources and 22 corpus notes.
2. **Round 5 and 5b content:**
   - the 6 new buildings, including the two "then and now" ones;
   - the Jensen Huang figure;
   - the `experts-vs-public` grouped bar chart and the `shutdown-resistance` chart, both inside their buildings via `media.datasetId`;
   - the `lab-vs-everyday` comparison;
   - the 3-host episode 3 (`thirdHostLook`);
   - the `origin` field on sources, with reference lists split into "From our essays" first, then "Added for the history".
3. **Round 6 photos:**
   - download the 7 files in `docs/PHOTOS.md` and convert them to WebP;
   - add the credits, images and `imageId` on the 4 figures and 3 buildings;
   - show the credit line under each image and on the About page.
4. **Round 7 and 8 videos:**
   - add `media.videoSrc` to the Building schema;
   - put `public/videos/interface-gallery.mp4`, `perceptron-cinema.mp4` and `agents-cinema.mp4` in their buildings;
   - they loop, load only when the visitor is near (`preload="none"`), have sound only when the visitor is inside, and duck the island music;
   - in the long-read they play with controls;
   - show the credit line "made with Claude (Anthropic)" under each video and in the About credits.
5. **Round 7 voices:**
   - add `tools/voices/samples/` and `tools/voices/out/` to `.gitignore` first;
   - set up one local voice-cloning model on the RTX 5070 and write `tools/voices/generate.py`;
   - test it on the first 3 lines of episode 3 with whatever sample exists. If no samples exist yet, stop this step and tell me.
   - Don't generate the full episodes until all three samples are in.
6. **Chatbot:**
   - make sure all 22 corpus notes and the new suggested questions load;
   - run `npm run gen-ai` and `npm run test:chatbot` with the production provider (`AI_PROVIDER=gateway` or `deepseek` in `.env.local`), not local Ollama. If no key is set, tell me exactly which variable to add and skip this step;
   - write the results for all 70 questions into `docs/CHATBOT_TEST_RESULTS.md`;
   - leave every generated item `checked: false`.
7. **VISION features, if not done in phase 5:**
   - a References building on each island;
   - faceless NPC figures;
   - the free-look camera with a Recenter button.
8. **Check:**
   - `npm run verify` and `npm run test:e2e`;
   - screenshots at 375 px and 1440 px of `/`, `/read`, each era page, `/sources`, `/about` and `/listen`, plus one drawer with a chart, one with a video and one with a photo;
   - fix any overflow (the new grouped bar labels are long).
9. Commit on a branch, push, and give me the **Vercel preview URL**. Don't touch production.

**When you finish**, update `docs/SESSION_REPORT.md`:
- what you built;
- the preview URL;
- test and chatbot results;
- remaining `TODO:` placeholders;
- anything in `CONTENT_ERRORS.md`;
- what is still blocked on the group: voice samples, the Aqeel interview, Rayyan's revised essay, the voice-assistant video, and group approval of the drafted text.
