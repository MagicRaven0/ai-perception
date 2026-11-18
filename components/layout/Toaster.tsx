"use client";

import { useEffect } from "react";
import { useStore } from "@/lib/store";

/**
 * Site-wide toast (z-modal), mounted in the root layout so a message survives a route change
 * (e.g. "3D stopped, switched to reading mode" when /explore falls back to /read). Polite live region.
 */
export function Toaster() {
  const toast = useStore((s) => s.toast);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => useStore.getState().clearToast(toast.id), 6000);
    return () => clearTimeout(t);
  }, [toast]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-4 z-modal flex justify-center px-4"
    >
      {toast && (
        <p className="pointer-events-auto flex items-center gap-3 rounded-full bg-ink py-2 pr-2 pl-5 font-semibold text-paper shadow-card-strong">
          {toast.message}
          <button
            type="button"
            onClick={() => useStore.getState().clearToast(toast.id)}
            aria-label="Dismiss"
            className="flex size-8 items-center justify-center rounded-full bg-paper text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paper"
          >
            <span aria-hidden="true">×</span>
          </button>
        </p>
      )}
    </div>
  );
}
