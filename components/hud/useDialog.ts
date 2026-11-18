"use client";

import { useEffect, useRef, type KeyboardEvent, type RefObject } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Last focused element, so a control removed in the same commit that opened a dialog is still known. */
let lastFocused: HTMLElement | null = null;
if (typeof document !== "undefined") {
  document.addEventListener("focusin", (e) => {
    if (e.target instanceof HTMLElement) lastFocused = e.target;
  });
}

/**
 * A closing dialog gives focus back one frame later. A dialog opening in the meantime (e.g. Options opened
 * with a click while the drawer was open, which closes the drawer) cancels that, so the late restore cannot
 * pull focus out of the new dialog or land after the new one has already closed and restored its own.
 * Each restore belongs to a generation; opening any dialog starts a new one, which stops older restores
 * (including one still waiting for its target to appear, below).
 */
let restoreGeneration = 0;

/**
 * How long a restore waits for a target that is not in the document yet. A ?b= deep link can open the
 * drawer before the car's sensor has reported the building, so the prompt's Open button (the fallback)
 * only appears a few frames after an early Escape. Waiting stops as soon as focus goes anywhere else.
 */
const RESTORE_WAIT_MS = 3000;

/**
 * Focus management for HUD dialogs (drawer, options, controls): moves focus in on open, keeps Tab inside,
 * closes on Escape, and gives focus back to whatever had it before. Spread `onKeyDown` on the dialog.
 * If that control was re-rendered meanwhile (e.g. the prompt's Open button, hidden while the drawer is open),
 * focus goes to the element that now has the same `id`, so give such controls a stable id.
 * `fallbackId`: where focus goes when there was no opener (focus was on the page, or a deep link opened it).
 */
export function useDialog(
  ref: RefObject<HTMLElement | null>,
  open: boolean,
  onClose: () => void,
  initial?: RefObject<HTMLElement | null>,
  fallbackId?: string,
) {
  const returnTo = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    restoreGeneration++;
    const active = document.activeElement;
    const dialog = ref.current;
    // Focus already inside the dialog means this effect re-ran (React Strict Mode): keep the first opener.
    // The opener may have unmounted in the commit that opened this dialog (the prompt's Open button):
    // focus then already fell to <body>, so remember that removed control and find it again by id on close.
    if (!(active && dialog?.contains(active))) {
      returnTo.current =
        active instanceof HTMLElement && active !== document.body
          ? active
          : lastFocused && !lastFocused.isConnected && lastFocused.id
            ? lastFocused
            : null;
    }
    const el = initial?.current ?? dialog?.querySelector<HTMLElement>(FOCUSABLE) ?? dialog;
    el?.focus({ preventScroll: true });
    return () => {
      const saved = returnTo.current;
      const generation = ++restoreGeneration;
      const started = performance.now();
      const attempt = () => {
        if (generation !== restoreGeneration) return;
        // Still in the document: the effect only re-ran (Strict Mode), the dialog did not close.
        if (dialog?.isConnected) return;
        // Return focus only if it is still inside the closing dialog (or nowhere): closing from outside
        // (e.g. a fast-travel pill) leaves focus on the control the visitor just used.
        const active = document.activeElement;
        if (active && active !== document.body && !dialog?.contains(active)) return;
        const back =
          (saved && document.contains(saved) ? saved : saved?.id ? document.getElementById(saved.id) : null) ??
          (fallbackId ? document.getElementById(fallbackId) : null);
        if (back) back.focus({ preventScroll: true });
        else if (performance.now() - started < RESTORE_WAIT_MS) requestAnimationFrame(attempt);
      };
      requestAnimationFrame(attempt);
    };
  }, [open, ref, initial, fallbackId]);

  // Escape also closes when focus has left every dialog (e.g. the visitor clicked the world behind it).
  // Inside a dialog (this one, or the chat panel), only that dialog's own handler reacts.
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  });
  useEffect(() => {
    if (!open) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented) return;
      const active = document.activeElement;
      if (active instanceof Element && active.closest("[role='dialog']")) return;
      close.current();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      onClose();
      return;
    }
    if (e.key !== "Tab" || !ref.current) return;
    const items = Array.from(ref.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (x) => x.offsetParent !== null || x === document.activeElement,
    );
    if (items.length === 0) return;
    const first = items[0]!;
    const last = items[items.length - 1]!;
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return { onKeyDown };
}
