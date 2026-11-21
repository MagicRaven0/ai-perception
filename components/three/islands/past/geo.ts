import * as THREE from "three";
import { PAST } from "@/lib/three/palettes/past";

/**
 * THE PAST: tiny procedural "geometry builder". Everything on this island is made of primitives (boxes,
 * cylinders, cones, low spheres, extruded shapes) appended into ONE vertex-coloured BufferGeometry per
 * draw-call bucket, so a whole building or the whole island decor costs a single draw call (two on High,
 * where the shadow pass draws casters again). No React meshes, no StaticMerge signature polling.
 *
 * It also records, in the same frame of reference:
 * - colliders (fixed cuboids, yaw only) for the things the car should bump;
 * - light spots (phosphor lamps) and tape reels, drawn by the island as instanced meshes (blinking / spinning).
 *
 * Templates (unit primitives) are cached at module level: plain CPU arrays, never uploaded to the GPU, the
 * same for every mount, so nothing needs cleaning up when /explore unmounts.
 */

export type V3 = [number, number, number];

export type ColliderSpec = { half: V3; position: V3; rotationY: number };
/** A lamp: a small plane facing local +Z of its frame. `steady` lamps never blink (screens, scopes). */
export type LightSpot = { matrix: THREE.Matrix4; steady: boolean; seed: number };
/** A tape reel: a disc facing local +Z of its frame, spinning about that axis. */
export type ReelSpot = { matrix: THREE.Matrix4; speed: number };

type Template = { position: Float32Array; normal: Float32Array };

const templates = new Map<string, Template>();

function template(key: string, make: () => THREE.BufferGeometry): Template {
  let t = templates.get(key);
  if (!t) {
    const src = make();
    const geo = src.index ? src.toNonIndexed() : src;
    if (!geo.attributes.normal) geo.computeVertexNormals();
    t = {
      position: (geo.attributes.position as THREE.BufferAttribute).array as Float32Array,
      normal: (geo.attributes.normal as THREE.BufferAttribute).array as Float32Array,
    };
    templates.set(key, t);
    src.dispose();
    if (geo !== src) geo.dispose();
  }
  return t;
}

const colourCache = new Map<string, [number, number, number]>();
function linear(hex: string): [number, number, number] {
  let c = colourCache.get(hex);
  if (!c) {
    const col = new THREE.Color(hex);
    c = [col.r, col.g, col.b];
    colourCache.set(hex, c);
  }
  return c;
}

const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _s = new THREE.Vector3();
const _p = new THREE.Vector3();
const _n = new THREE.Matrix3();
const _v = new THREE.Vector3();

export class Geo {
  private pos: number[] = [];
  private nor: number[] = [];
  private col: number[] = [];
  private stack: { m: THREE.Matrix4; yaw: number }[];
  /** When false, only lights / reels / colliders are recorded (geometry skipped). */
  readonly withGeometry: boolean;
  readonly colliders: ColliderSpec[] = [];
  readonly lights: LightSpot[] = [];
  readonly reels: ReelSpot[] = [];
  /** When set, reels are baked as static geometry instead of being recorded (Low tier: no extra draw call). */
  bakeReels = false;

  constructor(opts: { origin?: V3; rotationY?: number; withGeometry?: boolean } = {}) {
    const m = new THREE.Matrix4();
    const o = opts.origin ?? [0, 0, 0];
    m.makeRotationY(opts.rotationY ?? 0).setPosition(o[0], o[1], o[2]);
    this.stack = [{ m, yaw: opts.rotationY ?? 0 }];
    this.withGeometry = opts.withGeometry ?? true;
  }

  private get top() {
    return this.stack[this.stack.length - 1]!;
  }

  /** Run `fn` in a child frame (translate, then rotate about Y, then uniform scale). */
  at(position: V3, rotationY: number, fn: () => void, scale = 1) {
    const parent = this.top;
    const m = new THREE.Matrix4()
      .makeRotationY(rotationY)
      .scale(_s.set(scale, scale, scale))
      .setPosition(position[0], position[1], position[2]);
    this.stack.push({ m: parent.m.clone().multiply(m), yaw: parent.yaw + rotationY });
    fn();
    this.stack.pop();
  }

  private local(position: V3, rotation?: V3, scale?: V3) {
    _e.set(rotation?.[0] ?? 0, rotation?.[1] ?? 0, rotation?.[2] ?? 0);
    _q.setFromEuler(_e);
    _s.set(scale?.[0] ?? 1, scale?.[1] ?? 1, scale?.[2] ?? 1);
    _p.set(position[0], position[1], position[2]);
    return _m.compose(_p, _q, _s).premultiply(this.top.m);
  }

  private append(t: Template, matrix: THREE.Matrix4, colour: string) {
    if (!this.withGeometry) return;
    const [r, g, b] = linear(colour);
    _n.getNormalMatrix(matrix);
    const { position, normal } = t;
    for (let i = 0; i < position.length; i += 3) {
      _v.set(position[i]!, position[i + 1]!, position[i + 2]!).applyMatrix4(matrix);
      this.pos.push(_v.x, _v.y, _v.z);
      _v.set(normal[i]!, normal[i + 1]!, normal[i + 2]!)
        .applyMatrix3(_n)
        .normalize();
      this.nor.push(_v.x, _v.y, _v.z);
      this.col.push(r, g, b);
    }
  }

  /* ---------------------------------------------------------- primitives */

  box(size: V3, position: V3, colour: string, rotation?: V3) {
    const t = template("box", () => new THREE.BoxGeometry(1, 1, 1));
    this.append(t, this.local(position, rotation, size), colour);
  }

  /** Cylinder (or cone / frustum) standing on its centre. */
  cyl(rTop: number, rBottom: number, h: number, position: V3, colour: string, segments = 8, rotation?: V3) {
    // Unit height, radii normalised to the bottom radius so one template serves every size of that ratio.
    const base = Math.max(rTop, rBottom);
    const key = `cyl:${(rTop / base).toFixed(3)}:${(rBottom / base).toFixed(3)}:${segments}`;
    const t = template(key, () => new THREE.CylinderGeometry(rTop / base, rBottom / base, 1, segments, 1));
    this.append(t, this.local(position, rotation, [base, h, base]), colour);
  }

  /** Part of a sphere (dome by default) with low segment counts. */
  sphere(r: number, position: V3, colour: string, opts: { w?: number; h?: number; dome?: boolean; scale?: V3 } = {}) {
    const w = opts.w ?? 10;
    const hs = opts.h ?? 5;
    const dome = opts.dome ?? false;
    const t = template(
      `sph:${w}:${hs}:${dome}`,
      () => new THREE.SphereGeometry(1, w, hs, 0, Math.PI * 2, 0, dome ? Math.PI / 2 : Math.PI),
    );
    const s = opts.scale ?? [1, 1, 1];
    this.append(t, this.local(position, undefined, [r * s[0], r * s[1], r * s[2]]), colour);
  }

  /** Low-poly blob (tree crowns, shrubs). */
  ico(r: number, position: V3, colour: string, scale: V3 = [1, 1, 1], rotationY = 0) {
    const t = template("ico", () => new THREE.IcosahedronGeometry(1, 0));
    this.append(t, this.local(position, [0, rotationY, 0], [r * scale[0], r * scale[1], r * scale[2]]), colour);
  }

  /** Flat ring (or full disc when inner = 0) lying on the ground, facing up. */
  ring(
    inner: number,
    outer: number,
    y: number,
    colour: string,
    segments = 32,
    thetaStart = 0,
    thetaLength = Math.PI * 2,
  ) {
    if (!this.withGeometry) return;
    // Rings are big and few: build them directly (no template).
    const geo = new THREE.RingGeometry(inner, outer, segments, 1, thetaStart, thetaLength).toNonIndexed();
    geo.rotateX(-Math.PI / 2);
    this.raw(geo, [0, y, 0], colour);
    geo.dispose();
  }

  /** Flat circle facing local +Z (clock faces, dials, portholes). */
  disc(r: number, position: V3, colour: string, segments = 12, rotation?: V3) {
    const t = template(`disc:${segments}`, () => new THREE.CircleGeometry(1, segments));
    this.append(t, this.local(position, rotation, [r, r, 1]), colour);
  }

  /** Open cylinder wall (cliffs, fountain basin rim) with given radii, centred at y. */
  tube(rTop: number, rBottom: number, h: number, y: number, colour: string, segments: number) {
    if (!this.withGeometry) return;
    const geo = new THREE.CylinderGeometry(rTop, rBottom, h, segments, 1, true).toNonIndexed();
    this.raw(geo, [0, y, 0], colour);
    geo.dispose();
  }

  /**
   * Extruded 2D shape (drawn in the XY plane at unit size), extruded along Z and centred in Z.
   * `scale` is [x, y, depth]. Templates are cached by `key`, so one key = one shape.
   */
  shape(key: string, make: () => THREE.Shape, scale: V3, position: V3, colour: string, rotation?: V3) {
    const t = template(`shape:${key}`, () => {
      const g = new THREE.ExtrudeGeometry(make(), { depth: 1, bevelEnabled: false, curveSegments: 4 });
      g.translate(0, 0, -0.5);
      return g;
    });
    this.append(t, this.local(position, rotation, scale), colour);
  }

  /** Triangular prism (gable roof / pediment): base `w` wide at y, apex `h` above, `d` deep along local Z. */
  gable(w: number, h: number, d: number, position: V3, colour: string, rotationY = 0) {
    this.shape("tri", triangle, [w, h, d], position, colour, [0, rotationY, 0]);
  }

  /** Append any geometry (positions + normals) in the current frame. */
  raw(geo: THREE.BufferGeometry, position: V3, colour: string, rotation?: V3) {
    if (!this.withGeometry) return;
    const g = geo.index ? geo.toNonIndexed() : geo;
    if (!g.attributes.normal) g.computeVertexNormals();
    const t: Template = {
      position: (g.attributes.position as THREE.BufferAttribute).array as Float32Array,
      normal: (g.attributes.normal as THREE.BufferAttribute).array as Float32Array,
    };
    this.append(t, this.local(position, rotation), colour);
    if (g !== geo) g.dispose();
  }

  /* ------------------------------------------------- recorded extras */

  /** Fixed cuboid collider (half extents) in the current frame (yaw only). */
  collider(half: V3, position: V3, rotationY = 0) {
    _v.set(position[0], position[1], position[2]).applyMatrix4(this.top.m);
    this.colliders.push({ half, position: [_v.x, _v.y, _v.z], rotationY: this.top.yaw + rotationY });
  }

  /** Phosphor lamp (w x h plane facing local +Z, slightly in front of the surface at `position`). */
  light(position: V3, w: number, h: number, steady = false, rotation?: V3) {
    const m = this.local(position, rotation, [w, h, 1]).clone();
    this.lights.push({ matrix: m, steady, seed: this.lights.length * 7.31 + position[0] * 3.7 + position[1] * 1.3 });
  }

  /** Tape reel of radius r facing local +Z. */
  reel(position: V3, r: number, speed: number, rotation?: V3) {
    if (this.bakeReels) {
      reelGeometry(this, position, r, rotation);
      return;
    }
    const m = this.local(position, rotation, [r, r, r]).clone();
    this.reels.push({ matrix: m, speed });
  }

  /* ------------------------------------------------------------ output */

  get triangles() {
    return this.pos.length / 9;
  }

  build(): THREE.BufferGeometry | null {
    if (!this.withGeometry || this.pos.length === 0) return null;
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute("normal", new THREE.Float32BufferAttribute(this.nor, 3));
    g.setAttribute("color", new THREE.Float32BufferAttribute(this.col, 3));
    g.computeBoundingSphere();
    g.computeBoundingBox();
    return g;
  }
}

function triangle() {
  const s = new THREE.Shape();
  s.moveTo(-0.5, 0);
  s.lineTo(0.5, 0);
  s.lineTo(0, 1);
  s.closePath();
  return s;
}

/** Reel colours (shared with the instanced reels so High and Low look the same). */
export const REEL_COLOURS = { flange: PAST.reelFlange, hub: PAST.iron, tape: PAST.tape };

/** Static reel (Low tier) built from the same parts as the instanced reel template. */
function reelGeometry(g: Geo, position: V3, r: number, rotation?: V3) {
  g.at(position, rotation?.[1] ?? 0, () => {
    g.cyl(1 * r, 1 * r, 0.12 * r, [0, 0, 0], REEL_COLOURS.flange, 14, [Math.PI / 2, 0, 0]);
    g.cyl(0.62 * r, 0.62 * r, 0.16 * r, [0, 0, 0.01 * r], REEL_COLOURS.tape, 14, [Math.PI / 2, 0, 0]);
    g.cyl(0.18 * r, 0.18 * r, 0.24 * r, [0, 0, 0.02 * r], REEL_COLOURS.hub, 8, [Math.PI / 2, 0, 0]);
  });
}

/** Instanced reel template: flange disc + tape pack + hub + three spoke windows, vertex-coloured, unit radius. */
export function makeReelTemplate(): THREE.BufferGeometry {
  const g = new Geo();
  g.cyl(1, 1, 0.12, [0, 0, 0], REEL_COLOURS.flange, 14, [Math.PI / 2, 0, 0]);
  g.cyl(0.62, 0.62, 0.16, [0, 0, 0.01], REEL_COLOURS.tape, 14, [Math.PI / 2, 0, 0]);
  g.cyl(0.18, 0.18, 0.24, [0, 0, 0.02], REEL_COLOURS.hub, 8, [Math.PI / 2, 0, 0]);
  // Spoke windows (dark slots that show the spin).
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    g.box([0.16, 0.36, 0.2], [Math.cos(a) * 0.82, Math.sin(a) * 0.82, 0.03], REEL_COLOURS.hub, [0, 0, a + Math.PI / 2]);
  }
  return g.build()!;
}
