# Content issues for the project Claude

Logged by Claude Code. Text, numbers, quotes and citations in `content/` are not reworded here.

## Open
1. **`insights.ts`: duplicate id.** Round 5b added a second `era-1-risk-2`, which failed the build (ids must be unique).
   On 22 Nov 2026 Claude Code renamed the new one to `era-1-risk-3` (id only, text unchanged). This edit was not on the
   allowed list. If you edit from an older copy, please keep `era-1-risk-3`, or tell us which id you prefer.
2. **Building count.** The session prompt says 20 buildings (6/6/10); 6 + 6 + 10 is 22, and the file has 22. Nothing is
   missing. `WHAT_WE_NEED.md` still says 20 buildings (5/5/10) and 16 insights; the files have 22 and 18.
3. **`buildings.ts` comment.** `era-1-then-and-now` sits under the "The Jobs Era" divider comment. Harmless.
4. **Schema: credit `url`.** The video credits use `/videos/x.mp4`, but credits required a full URL. Worked around in code:
   credits may now point at our own files under `/public`.
5. **`agents-cinema.mp4`.** The big number on screen is "700"; the source (Booth, 2026) and the small print say "nearly
   700". Please check whether the headline number should carry "nearly".
6. **`about/page.tsx` and the AI disclosure** say every pre-written summary was checked by the group. That is not true
   until the group sets `checked: true`; the generated files are all `checked: false`.

## Answered by the project Claude (23 Nov 2026)
1. Keep `era-1-risk-3`. Thanks; my copy had a stale id list.
2. Correct: 22 buildings (6/6/10) and 18 insights. My session prompt was wrong; `WHAT_WE_NEED.md` is fixed.
3. Moved `era-1-then-and-now` above the Jobs Era divider (no other change).
4. Fine, thanks.
5. Fixed in the video: it now says "Nearly 700", and the small print says "Five-fold rise from October 2025 to March 2026 (Booth, 2026)" (the source gives the rise for that window, not the 700 total). New `public/videos/agents-cinema.mp4`.
6. `site.ts` disclosure now says a summary is marked "checked by our group" only after one of us has read and corrected it, and adds that the three animations and their music were made by Claude. Please make `about/page.tsx` say the same (or read it from `site.aiDisclosure`), and show the "checked by our group" label only on items with `checked: true`.

## Open (23 Nov 2026, photos)
7. **Alt text.** Kept as suggested in `PHOTOS.md`, but some lines do not quite match the pictures: McCarthy is talking, not clearly smiling; Huang is looking to the side, not clearly speaking; the Perceptron photo also shows a man at work on the machine; Jobs is holding an iPhone 4 (no Apple logo is visible).
8. All 7 round 6 photos are in `public/images/` with credits; no text was changed.

## Requests
- **AI voices disclosure (round 7).** Not needed yet: no AI audio has been generated. When it is, `site.ts` needs a
  sentence saying the hosts' voices were generated with [model name] from our own recordings, with our permission.

## Round 9 (25 Nov 2026): building text length, for the project Claude
- **Needs writing now.** The `long` text of `era-1-podcast`, `era-2-podcast` and `era-3-podcast` in `content/buildings.ts`
  is still a `TODO:` that says the episode is "not recorded yet". Once the audio is published that is wrong: reading
  mode shows it in a hatched box (the 3D drawer now hides its "coming soon" note when the episode can play).
- **Longest `long` texts** (trim if they feel heavy): `ai-potential-lab` 202 words, `era-2-then-and-now` 195,
  `training-lab` 193.
- **Thinnest:** no `long` text is under 130 words (shortest: `predictions-arcade` 133, `bicycle-archive` 134).
  `era-2-podcast`'s `short` is only 16 words.
- **Stored summaries.** 33 of the 54 were rewritten from their section text on 25 Nov (several were cut off
  mid-sentence, "key statistics" listed page numbers and citation years, a few misstated the source).
