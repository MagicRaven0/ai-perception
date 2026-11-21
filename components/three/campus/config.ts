/**
 * AUS mini campus settings (campus owner's file).
 *
 * LOGO SLOT: renders nothing while `AUS_LOGO` is null. The university's logo needs the university's written
 * permission and a credit before it ships (docs/VISION.md, CLAUDE.md "every image gets a credit entry").
 * To show it:
 *   1. Get permission, then put the file in public/images/aus/ (PNG or WebP with a transparent or white
 *      background, square, about 512 x 512 px).
 *   2. Append an entry with an "aus-" id (for example "aus-logo") at the END of content/credits.ts
 *      (that file is shared: never edit or reorder other entries).
 *   3. Set AUS_LOGO below, for example { src: "/images/aus/logo.png", alt: "American University of Sharjah logo" }.
 * The logo then appears on the left of the entrance sign and the name text moves right to make room.
 * It loads inside its own <Suspense>, so a slow or missing file never blocks the world from loading.
 */
export const AUS_LOGO: { src: string; alt: string } | null = null;

/**
 * Plot radius the campus was designed for (The Future: ring road radius 31.36 m - half road 3.5 m - 6 m).
 * A smaller plot scales the whole campus down to fit; a bigger one keeps it at full size (centred).
 */
export const DESIGN_RADIUS = 21.86;

/**
 * Turn of the campus axis away from facing the camera head-on (radians). 0 = the main building's facade
 * faces the camera square-on (a flat elevation); a little skew shows two faces of every building, like the
 * isometric town it sits in, while the mall still reads as one symmetrical axis.
 */
export const AXIS_SKEW = 0.3;
