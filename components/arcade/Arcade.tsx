"use client";

import type { ArcadeConfig } from "@/lib/content/arcades";
import { PredictionsArcade } from "./PredictionsArcade";
import { FeelingsArcade } from "./FeelingsArcade";

/**
 * The interactive part of an "experience" building, in the 3D drawer and in 2D.
 */
export function Arcade({ config }: { config: ArcadeConfig }) {
  return config.kind === "predictions" ? <PredictionsArcade config={config} /> : <FeelingsArcade config={config} />;
}
