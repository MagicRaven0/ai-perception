import * as THREE from "three";
import type { PlacedBuilding, PlacedFigure, WorldLayout } from "./layout";
import { ERA_ORDER } from "./layout";

/**
 * Click-to-move picking (round 9). A click is tested against invisible, generous hit areas, never against the
 * decorative meshes: one box per building (a bit bigger than its plot) and one cylinder per anchor figure.
 * Pure maths + three.js vectors; runs only on a click or a hover, not per frame.
 */

/** Height of a building's hit box, metres (models are 4-9 m tall). */
const BUILDING_HIT_HEIGHT = 9;
/** How much bigger than the plot a building's hit area is, metres on each side. */
const BUILDING_HIT_MARGIN = 1;
/** Figure hit radius and height, metres. */
const FIGURE_HIT_RADIUS = 1.6;
const FIGURE_HIT_HEIGHT = 2.6;

export type Pick =
  | { kind: "building"; id: string; building: PlacedBuilding; distance: number }
  | { kind: "figure"; id: string; figure: PlacedFigure; distance: number };

const inverse = new THREE.Matrix4();
const matrix = new THREE.Matrix4();
const rayLocal = new THREE.Ray();
const box = new THREE.Box3();
const point = new THREE.Vector3();
const euler = new THREE.Euler();
const position = new THREE.Vector3();
const quat = new THREE.Quaternion();
const unit = new THREE.Vector3(1, 1, 1);

/** Nearest building or figure under `ray` on the given island, or null. */
export function pickWorldObject(world: WorldLayout, eraId: (typeof ERA_ORDER)[number], ray: THREE.Ray): Pick | null {
  const island = world.islands[eraId];
  let best: Pick | null = null;

  for (const b of island.buildings) {
    // Boards in the island's centre (References) have no house; they are picked by their footprint too.
    const halfW = b.plot.width / 2 + BUILDING_HIT_MARGIN;
    const halfD = b.plot.depth / 2 + BUILDING_HIT_MARGIN;
    position.set(b.position[0], b.position[1], b.position[2]);
    quat.setFromEuler(euler.set(0, b.rotationY, 0));
    matrix.compose(position, quat, unit);
    inverse.copy(matrix).invert();
    rayLocal.copy(ray).applyMatrix4(inverse);
    box.min.set(-halfW, 0, -halfD);
    box.max.set(halfW, BUILDING_HIT_HEIGHT, halfD);
    if (!rayLocal.intersectBox(box, point)) continue;
    const distance = point.applyMatrix4(matrix).distanceTo(ray.origin);
    if (!best || distance < best.distance) best = { kind: "building", id: b.id, building: b, distance };
  }

  for (const f of island.figures) {
    const cx = f.position[0];
    const cz = f.position[2];
    // Ray vs a vertical cylinder: solve in the XZ plane, then check the height of the hit.
    const ox = ray.origin.x - cx;
    const oz = ray.origin.z - cz;
    const dx = ray.direction.x;
    const dz = ray.direction.z;
    const a = dx * dx + dz * dz;
    if (a < 1e-9) continue;
    const bq = ox * dx + oz * dz;
    const c = ox * ox + oz * oz - FIGURE_HIT_RADIUS * FIGURE_HIT_RADIUS;
    const disc = bq * bq - a * c;
    if (disc < 0) continue;
    const t = (-bq - Math.sqrt(disc)) / a;
    if (t < 0) continue;
    const y = ray.origin.y + ray.direction.y * t - f.position[1];
    if (y < -0.2 || y > FIGURE_HIT_HEIGHT) continue;
    if (!best || t < best.distance) best = { kind: "figure", id: f.id, figure: f, distance: t };
  }
  return best;
}
