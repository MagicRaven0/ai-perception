"use client";

import type { ArcadeConfig } from "@/lib/content/arcades";
import { PredictionsArcade } from "./PredictionsArcade";
import { FeelingsArcade } from "./FeelingsArcade";

/**
 * The interactive part of an "experience" building, in the 3D drawer and in 2D. In 2D the building's own
 * source line already sits below, so `showSources={false}` avoids printing it twice.
 */
export function Arcade({ config, showSources = true }: { config: ArcadeConfig; showSources?: boolean }) {
  return config.kind === "predictions" ? (
    <PredictionsArcade config={config} showSources={showSources} />
  ) : (
    <FeelingsArcade config={config} showSources={showSources} />
  );
}
