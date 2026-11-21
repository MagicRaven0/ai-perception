/**
 * Camera constants shared by the 3D camera rig and the 2D minimap (pure numbers, no three.js),
 * so "up" on the minimap always matches "up" on screen.
 */

/** Camera direction about Y: from the back-left, so the islands run left to right and slightly up. */
export const CAMERA_AZIMUTH = -Math.PI / 4;
/** High-angle isometric look (latecheckout.studio): high enough to see the road ahead and a few buildings. */
export const CAMERA_ELEVATION_DEG = 42;
/** Distance from the target (orthographic, so this only affects clipping and fog). */
export const CAMERA_DISTANCE = 160;

/**
 * How much ground the orthographic view shows (metres across, at the target), latecheckout-style overview.
 * Desktop: the wider of `wide` across or `tall` down (1440 x 900 shows about 104 x 65 m). Narrow portrait
 * phones: `phone` across, so the car (about 4 m) stays roughly 29 px long at 375 px.
 */
export const CAMERA_SPAN = { wide: 104, tall: 65, phone: 52 } as const;

/** SVG rotation (degrees) that turns a north-up world map into the camera's view. */
export const MINIMAP_ROTATION_DEG = (CAMERA_AZIMUTH * 180) / Math.PI;
