"use client";

/*
 * Sprint 4.6 Block D — Compliance disclaimer banner.
 *
 * Per COMPLIANCE.md §10.1 / §3.3 and Sprint 4.6 §D, this banner makes
 * the load-bearing posture commitment visible: Member Signals supports
 * consultative banker conversations; it does not make credit decisions
 * or substitute for formal underwriting. The framing is repeated in
 * the COMPLIANCE document, marketing material, and internal training;
 * this banner is the in-product surface.
 *
 * Visibility rules per §D.2:
 *   - Visible on first session visit (per browser session)
 *   - Dismissible — banker click → collapsed for the session
 *   - Subtle styling, neutral tone (cream, not coral, not orange)
 *   - Sits above the Macro context banner if present, below the page
 *     header
 *
 * The dismissed state is tracked in sessionStorage (not persistent).
 * Refreshing the browser brings the banner back; closing the tab and
 * returning later also brings it back. This matches the §D "first
 * session visit per banker" intent — the banner re-asserts on each
 * fresh session so its load-bearing framing isn't tuned out.
 *
 * Component is reusable for v2 (Sprint 4.7) — `/v2/members/[id]` will
 * import the same component.
 */

import { useEffect, useState } from "react";

const STORAGE_KEY = "blaze.compliance-disclaimer-dismissed";

export function ComplianceDisclaimerBanner() {
  // Render guarded by mount: the banner depends on sessionStorage,
  // which isn't available during SSR. Initial state hides the banner
  // until the post-mount effect determines whether to show it.
  const [mounted, setMounted] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      const stored = window.sessionStorage.getItem(STORAGE_KEY);
      setDismissed(stored === "1");
    } catch {
      // sessionStorage may be unavailable (privacy mode, etc.); show
      // the banner in that case.
      setDismissed(false);
    }
    setMounted(true);
  }, []);

  function handleDismiss() {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // Best-effort; persistence is session-only by design.
    }
    setDismissed(true);
  }

  if (!mounted || dismissed) return null;

  return (
    <section
      aria-label="Compliance disclaimer"
      className="relative px-8 py-3"
      // Sprint 4.7.1 follow-up Issue 1 — explicit CSS-variable
      // reference to `--color-blaze-grey-darker` (#262626) via inline
      // style. Direct var() reference instead of Tailwind class resolves
      // any class-generation race; matches BLAZE_STYLE_GUIDE token.
      style={{ backgroundColor: "var(--color-blaze-grey-darker)" }}
    >
      <div className="mx-auto flex max-w-6xl items-start justify-between gap-4">
        <p className="text-xs leading-relaxed text-white">
          {/* Sprint 4.7.1 Block F — sharpened copy. Plain business
              English, two sentences. Drops "adverse action determinations"
              (regulator-audience phrasing) and "relationship management"
              (consultese). The structural protection still works. */}
          Growth Conversations captures consultative notes from members.
          Lending decisions and formal underwriting occur in the lending
          decisioning system.
        </p>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss compliance disclaimer for this session"
          className="shrink-0 text-xs text-white/70 transition-colors hover:text-white"
        >
          × Dismiss
        </button>
      </div>
    </section>
  );
}
