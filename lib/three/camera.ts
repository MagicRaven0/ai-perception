/**
 * Camera constants shared by the 3D camera rig and the 2D minimap (pure numbers, no three.js),
 * so "up" on the minimap always matches "up" on screen.
 */

/** Camera direction about Y: from the back-left, so the islands run left to right and slightly up. */
export const CAMERA_AZIMUTH = -Math.PI / 4;
/** High-angle isometric look. */
export const CAMERA_ELEVATION_DEG = 38;
/** Distance from the target (orthographic, so this only affects clipping and fog). */
export const CAMERA_DISTANCE = 150;

/** SVG rotation (degrees) that turns a north-up world map into the camera's view. */
export const MINIMAP_ROTATION_DEG = (CAMERA_AZIMUTH * 180) / Math.PI;
