# Photos for the figure billboards (WHAT_WE_NEED item 18)

Checked on Wikimedia Commons on 22 Nov 2026. All three are free to use on our site **with the credit line**, under Creative Commons Attribution-ShareAlike (CC BY-SA). If we crop or edit a photo, the edited version must be shared under the same licence, so the credit line should say "cropped" when we crop.

| Person | Commons page | Licence | Credit line to show |
| --- | --- | --- | --- |
| John McCarthy | https://commons.wikimedia.org/wiki/File:John_McCarthy_Stanford.jpg | CC BY-SA 2.0 | Photo: "null0" (Flickr), 2006, CC BY-SA 2.0, via Wikimedia Commons |
| Steve Jobs | https://commons.wikimedia.org/wiki/File:Steve_Jobs_Headshot_2010-CROP_(cropped_2).jpg | CC BY-SA 3.0 | Photo: Matthew Yohe, 2010, CC BY-SA 3.0, via Wikimedia Commons |
| Yoshua Bengio | https://commons.wikimedia.org/wiki/File:Yoshua_Bengio_-_2017.jpg | CC BY-SA 2.0 | Photo: Jérémy Barande / Ecole polytechnique Université Paris-Saclay, 2017, CC BY-SA 2.0, via Wikimedia Commons |
| Professor Aqeel | (his own photo) | His written OK | Photo: courtesy of Professor Aqeel, used with permission |

Full-size files:
- McCarthy: https://upload.wikimedia.org/wikipedia/commons/4/49/John_McCarthy_Stanford.jpg (2013 × 2332)
- Jobs: https://upload.wikimedia.org/wikipedia/commons/d/dc/Steve_Jobs_Headshot_2010-CROP_%28cropped_2%29.jpg (3026 × 2929)
- Bengio: https://upload.wikimedia.org/wikipedia/commons/3/34/Yoshua_Bengio_-_2017.jpg

## For Claude Code
1. Download the three files, resize to about 800 px wide, convert to WebP, save as `public/images/mccarthy.webp`, `public/images/jobs.webp`, `public/images/bengio.webp`. Resizing and format change are fine; if you crop, add "cropped" to the credit title.
2. Add these to `content/credits.ts` (`credits` array):

```ts
{
  id: "img-mccarthy",
  kind: "image",
  title: "John McCarthy at Stanford, 2006",
  author: "\"null0\" (Flickr)",
  licence: "CC BY-SA 2.0",
  url: "https://commons.wikimedia.org/wiki/File:John_McCarthy_Stanford.jpg",
},
{
  id: "img-jobs",
  kind: "image",
  title: "Steve Jobs at the 2010 Worldwide Developers Conference",
  author: "Matthew Yohe",
  licence: "CC BY-SA 3.0",
  url: "https://commons.wikimedia.org/wiki/File:Steve_Jobs_Headshot_2010-CROP_(cropped_2).jpg",
},
{
  id: "img-bengio",
  kind: "image",
  title: "Yoshua Bengio at the Data Science Summer School, 2017",
  author: "Jérémy Barande / Ecole polytechnique Université Paris-Saclay",
  licence: "CC BY-SA 2.0",
  url: "https://commons.wikimedia.org/wiki/File:Yoshua_Bengio_-_2017.jpg",
},
```

3. Add matching `images` entries (`id: "mccarthy-portrait"`, `src: "/images/mccarthy.webp"`, real width/height, `creditId: "img-mccarthy"`, and alt text such as "John McCarthy, smiling, at Stanford in 2006"), then set `imageId` on each anchor figure in `content/eras.ts`. This is the one content edit Claude Code may make (images only).
4. Show the credit line under each billboard and on the About page credits list.

## Round 6 (23 Nov 2026): all photos to download

Every file below was checked on Wikimedia Commons on 23 Nov 2026. The project Claude's sandbox cannot reach Wikimedia, so **Claude Code downloads them** on Rayyan's laptop.

| # | Save as (`public/images/`) | Used for | Direct file URL | Commons page | Licence | Credit line |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `mccarthy.webp` | era-1 figure billboard (John McCarthy) | https://upload.wikimedia.org/wikipedia/commons/4/49/John_McCarthy_Stanford.jpg | https://commons.wikimedia.org/wiki/File:John_McCarthy_Stanford.jpg | CC BY-SA 2.0 | Photo: "null0" (Flickr), 2006, CC BY-SA 2.0, via Wikimedia Commons |
| 2 | `jobs.webp` | era-2 figure billboard (Steve Jobs) | https://upload.wikimedia.org/wikipedia/commons/d/dc/Steve_Jobs_Headshot_2010-CROP_%28cropped_2%29.jpg | https://commons.wikimedia.org/wiki/File:Steve_Jobs_Headshot_2010-CROP_(cropped_2).jpg | CC BY-SA 3.0 | Photo: Matthew Yohe, 2010, CC BY-SA 3.0, via Wikimedia Commons |
| 3 | `bengio.webp` | era-3 figure billboard (Yoshua Bengio) | https://upload.wikimedia.org/wikipedia/commons/3/34/Yoshua_Bengio_-_2017.jpg | https://commons.wikimedia.org/wiki/File:Yoshua_Bengio_-_2017.jpg | CC BY-SA 2.0 | Photo: Jérémy Barande / Ecole polytechnique Université Paris-Saclay, 2017, CC BY-SA 2.0, via Wikimedia Commons |
| 4 | `huang.webp` | era-3 figure billboard (Jensen Huang) | https://upload.wikimedia.org/wikipedia/commons/c/c8/Jensen_Huang_Stanford_2026-04-30_010_%28cropped%29.jpg | https://commons.wikimedia.org/wiki/File:Jensen_Huang_Stanford_2026-04-30_010_(cropped).jpg | CC BY-SA 4.0 | Photo: Anderseidesvik, Stanford University, 30 April 2026 (cropped), CC BY-SA 4.0, via Wikimedia Commons |
| 5 | `ibm-704.webp` | `mainframe-archive` building (era 1) | https://upload.wikimedia.org/wikipedia/commons/2/20/IBM_Electronic_Data_Processing_Machine_-_GPN-2000-001881.jpg | https://commons.wikimedia.org/wiki/File:IBM_Electronic_Data_Processing_Machine_-_GPN-2000-001881.jpg | Public domain (NASA) | Photo: NASA (NACA Langley), 21 March 1957, public domain, via Wikimedia Commons |
| 6 | `perceptron.webp` | `perceptron-cinema` building poster (era 1) | https://upload.wikimedia.org/wikipedia/commons/1/1a/330-PSA-80-60_%28USN_710739%29_%2820897323365%29.jpg | https://commons.wikimedia.org/wiki/File:330-PSA-80-60_(USN_710739)_(20897323365).jpg | Public domain (U.S. government) | Photo: U.S. Navy, via National Museum of the U.S. Navy, public domain |
| 7 | `deep-blue.webp` | `ai-winter-lab` building ("AI's quiet years and Deep Blue", era 2) | https://upload.wikimedia.org/wikipedia/commons/e/ee/IBM_Deep_Blue_at_Computer_History_Museum_%289361685537%29.jpg | https://commons.wikimedia.org/wiki/File:IBM_Deep_Blue_at_Computer_History_Museum_(9361685537).jpg | CC BY 2.0 | Photo: Anton Chiang, Computer History Museum, 2011, CC BY 2.0, via Wikimedia Commons |

Alt text suggestions:
1. John McCarthy, smiling, at Stanford in 2006
2. Steve Jobs on stage in 2010, wearing a black turtleneck
3. Yoshua Bengio speaking at a summer school in 2017
4. Jensen Huang speaking at Stanford University in April 2026
5. A man and a woman operating an IBM 704 computer at NACA Langley in 1957; the machine fills the room
6. The Mark I Perceptron, a cabinet of wires and switches, in a 1960 U.S. Navy photo
7. One of the two cabinets of IBM's Deep Blue chess computer on display at the Computer History Museum

### For Claude Code (round 6)
1. Download the 7 files (send a normal browser User-Agent; Wikimedia blocks blank ones). Resize to 800 px on the longest side, convert to WebP (quality about 80), save under the names above. Do not crop further; Huang's file is already the Commons crop, so its title keeps "(cropped)".
2. Add one `credits` entry per file (ids `img-mccarthy`, `img-jobs`, `img-bengio`, `img-huang`, `img-ibm-704`, `img-mark-i-perceptron`, `img-deep-blue`) with the author, licence and Commons page above, and one `images` entry each with the real width and height and the alt text above.
3. Set `imageId` on the four anchor figures in `content/eras.ts` (McCarthy, Jobs, Bengio, Huang) and `media.imageId` on `mainframe-archive`, `perceptron-cinema` and `ai-winter-lab` in `content/buildings.ts`. These image fields are the only content edits allowed.
4. Show each credit line under the image and on the About page credits list.
5. Do not add Apple product photos (no Apple logos per CLAUDE.md), and no other news photos.

## Jensen Huang
Found on 23 Nov 2026: item 4 above (CC BY-SA 4.0). The earlier note that no photo existed is out of date.
