"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useStore } from "@/lib/store";
import type { EraId } from "@/lib/content/schema";
import type { ExploreData } from "@/lib/three/explore-data";
import { isTypingTarget } from "@/lib/three/transient";
import { Ambience } from "@/components/three/Ambience";
import { BuildingDrawer } from "./BuildingDrawer";
import { ControlsPanel } from "./ControlsPanel";
import { FastTravelBar } from "./FastTravelBar";
import { InteractPrompt } from "./InteractPrompt";
import { Minimap } from "./Minimap";
import { MobileControls } from "./MobileControls";
import { OptionsPanel } from "./OptionsPanel";
import { ProgressCounter } from "./ProgressCounter";
import { respawn } from "./actions";

/**
 * HUD over the canvas (normal DOM; z-hud, drawer z-drawer, panels z-modal). Mounted only once the world is
 * ready (ExploreClient shows the loading screen until then). "Ask the guide" is the root layout's chat pill,
 * which stays on screen here too, so the HUD has no second button with the same name. Bruno-style round 44px icon
 * buttons top-left, Late Checkout white pills for fast travel, minimap + progress top-right, prompt and
 * touch controls above the audio dock. Sibling of the canvas: its re-renders never touch the 3D tree.
 */
export function Hud({ data }: { data: ExploreData }) {
  const [panel, setPanel] = useState<"options" | "controls" | null>(null);
  const [mapOpen, setMapOpen] = useState(true);
  const fade = useRef<HTMLDivElement>(null);
  const activeEra = useStore((s) => s.activeEra);
  const ambienceOn = useStore((s) => s.ambienceOn);
  const drawerOpen = useStore((s) => s.openBuildingId !== null);
  const ids = useMemo(() => Object.keys(data.buildings), [data.buildings]);
  const eraNames = useMemo(
    () => Object.fromEntries(data.eras.map((e) => [e.id, e.islandName])) as Record<EraId, string>,
    [data.eras],
  );
  const slug = data.eras.find((e) => e.id === activeEra)?.slug;

  // One modal at a time: a building opening closes Options / Controls, and opening a panel closes the drawer.
  const [drawerWasOpen, setDrawerWasOpen] = useState(drawerOpen);
  if (drawerOpen !== drawerWasOpen) {
    setDrawerWasOpen(drawerOpen);
    if (drawerOpen) setPanel(null);
  }
  const togglePanel = (which: "options" | "controls") => {
    useStore.getState().closeBuilding();
    setPanel((p) => (p === which ? null : which));
  };

  // R = "I'm stuck". (E lives in InteractPrompt, driving keys in lib/three/transient.)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "KeyR" || e.repeat || e.metaKey || e.ctrlKey || e.altKey || isTypingTarget(e.target)) return;
      respawn(data.world);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [data.world]);

  return (
    <>
      {/* Fast-travel fade (pointer-events none; opacity driven by actions.fastTravel) */}
      <div
        ref={fade}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-hud bg-coal opacity-0 transition-opacity duration-300 ease-calm"
      />

      <div className="pointer-events-none fixed inset-x-0 top-0 z-hud flex flex-wrap items-start justify-between gap-3 p-3 md:p-5">
        <div className="pointer-events-auto flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="World controls">
            <IconLink href="/" label="Home">
              <path d="M4 11.5 12 5l8 6.5V20h-5.5v-5h-5v5H4z" />
            </IconLink>
            <Link
              href={slug ? `/read/${slug}` : "/read"}
              className="flex h-11 items-center rounded-full bg-paper px-4 font-semibold text-ink shadow-pill transition-transform duration-300 ease-calm hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              Read
            </Link>
            <IconButton label="Map" pressed={mapOpen} onClick={() => setMapOpen((v) => !v)}>
              <path d="M4 6.5 9 4l6 2.5L20 4v13.5L15 20l-6-2.5L4 20z M9 4v13.5 M15 6.5V20" />
            </IconButton>
            <IconButton label="Options" pressed={panel === "options"} onClick={() => togglePanel("options")}>
              <path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z M12 3v2.5 M12 18.5V21 M3 12h2.5 M18.5 12H21 M5.6 5.6l1.8 1.8 M16.6 16.6l1.8 1.8 M5.6 18.4l1.8-1.8 M16.6 7.4l1.8-1.8" />
            </IconButton>
            <IconButton
              label="Controls"
              pressed={panel === "controls"}
              onClick={() => togglePanel("controls")}
              className="hidden sm:flex"
            >
              <path d="M3 8h18v9H3z M7 11v3 M5.5 12.5h3 M15 11.5h.01 M17.5 13.5h.01" />
            </IconButton>
            <IconButton
              label="World sound"
              pressed={ambienceOn}
              onClick={() => useStore.getState().setAmbienceOn(!ambienceOn)}
              className="hidden sm:flex"
            >
              {ambienceOn ? (
                <path d="M4 9.5h4L13 5v14l-5-4.5H4z M16 9a4 4 0 0 1 0 6 M18.5 6.5a7.5 7.5 0 0 1 0 11" />
              ) : (
                <path d="M4 9.5h4L13 5v14l-5-4.5H4z M16.5 9.5l5 5 M21.5 9.5l-5 5" />
              )}
            </IconButton>
          </div>
          <div className="lg:hidden">
            <FastTravelBar world={data.world} eras={data.eras} fade={fade} />
          </div>
        </div>

        <div className="pointer-events-auto absolute top-5 left-1/2 hidden -translate-x-1/2 lg:block">
          <FastTravelBar world={data.world} eras={data.eras} fade={fade} />
        </div>

        <div className="pointer-events-auto ml-auto flex flex-col items-end gap-2">
          {mapOpen && <Minimap world={data.world} eraNames={eraNames} />}
          <ProgressCounter ids={ids} />
        </div>
      </div>

      <InteractPrompt buildings={data.buildings} signs={data.signs} />
      <MobileControls />
      <BuildingDrawer buildings={data.buildings} eras={data.eras} />
      {panel === "options" && <OptionsPanel world={data.world} onClose={() => setPanel(null)} />}
      {panel === "controls" && <ControlsPanel onClose={() => setPanel(null)} />}
      <Ambience />
    </>
  );
}

const iconClass =
  "size-11 items-center justify-center rounded-full bg-paper text-ink shadow-pill transition-transform duration-300 ease-calm hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink aria-pressed:bg-ink aria-pressed:text-paper";

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function IconButton({
  label,
  pressed,
  onClick,
  className,
  children,
}: {
  label: string;
  pressed?: boolean;
  onClick: () => void;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      title={label}
      onClick={onClick}
      className={`${iconClass} ${className ?? "flex"}`}
    >
      <Icon>{children}</Icon>
    </button>
  );
}

function IconLink({ href, label, children }: { href: string; label: string; children: ReactNode }) {
  return (
    <Link href={href} aria-label={label} title={label} className={`${iconClass} flex`}>
      <Icon>{children}</Icon>
    </Link>
  );
}
