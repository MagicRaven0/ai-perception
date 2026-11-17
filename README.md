# The Evolution of AI Perception

WRI-101 adaptation project, American University of Sharjah. An explorable 3D world of three islands, a 2D long-read, podcasts and interviews, and an AI research guide.

**Live site:** https://ai-perception.vercel.app

## For the group: adding content (no coding needed)

All words, numbers, people and media live in the `content/` folder. Change a file there and the whole site updates.

| File | What it holds |
| --- | --- |
| `content/site.ts` | Title, **thesis**, team names, AI disclosure |
| `content/eras.ts` | The 3 eras / islands: titles, years, people, summaries |
| `content/buildings.ts` | Every building (one piece of content each): podcast, interview, documents, research, video, animation, experience |
| `content/insights.ts` | Benefit / risk / danger quick points for each island |
| `content/sources.ts` | Works cited (APA 7, with links) |
| `content/datasets.ts` | Survey numbers for charts (stay "placeholder" until real numbers and a source exist) |
| `content/comparisons.ts` | "Then vs now" comparisons |
| `content/episodes.ts` | Podcasts and interviews (MP3s go in `public/audio/`, transcripts in `content/transcripts/`) |
| `content/credits.ts` | Credits for images, models, music, fonts; image list |
| `content/about.ts` | Rhetorical situation table for the About page |

Each file starts with a short comment explaining how to add an entry.

**Placeholders:** anything that isn't final starts with `TODO:`. It shows on the site as a striped box so nobody mistakes it for a real claim. To replace one, overwrite the whole text, including `TODO:`.

**On GitHub, without installing anything:**
1. Open the file in the repo and click the pencil icon.
2. Edit the text between the quotes, keeping the quotes and commas.
3. Click **Commit changes**, choose **Create a new branch**, and open a pull request. Vercel builds a preview link so you can check it before it goes live.

## For developers

```bash
npm install
npm run dev            # http://localhost:3000
npm run verify         # typecheck + lint + content check
npm run check-content  # list every remaining placeholder
```

Plans: `PLAN.md` (full architecture) and `docs/VISION.md` (group decisions, which override PLAN.md). Rules for Claude Code: `CLAUDE.md`. A shareable summary is in `docs/AI_Perception_Project_Summary.pdf`.
