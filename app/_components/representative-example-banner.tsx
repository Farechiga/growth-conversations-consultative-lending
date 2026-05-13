"use client";

/*
 * Sprint 7a-patch Block G — representative-example notation banner.
 *
 * When a banker clicks a synthetic Member name on the Insight Engine
 * dashboard, they land on one of the 4 fixture pages (Jenny / Northland
 * / Cygnus / Riverside) with `representative_of` + `example_for` query
 * parameters. This banner surfaces honestly that they're seeing a
 * sample arc, not the real Member's data. Dismissible for the session.
 */

import { useEffect, useState } from "react";

const STORAGE_KEY_PREFIX = "blaze.representative-banner-dismissed:";

const MEMBER_TYPE_LABELS: Record<string, string> = {
  event_services: "Event services",
  maintenance_services: "Maintenance services",
  specialty_manufacturer: "Specialty manufacturer",
  professional_services: "Professional services",
  healthcare_services: "Healthcare services",
  food_services: "Food services",
  retail: "Retail",
  construction: "Construction",
};

export function RepresentativeExampleBanner({
  representativeOf,
  exampleFor,
}: {
  representativeOf: string;
  exampleFor: string | null;
}) {
  const [mounted, setMounted] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  const storageKey = `${STORAGE_KEY_PREFIX}${representativeOf}`;

  useEffect(() => {
    try {
      const stored = window.sessionStorage.getItem(storageKey);
      setDismissed(stored === "1");
    } catch {
      setDismissed(false);
    }
    setMounted(true);
  }, [storageKey]);

  function handleDismiss() {
    try {
      window.sessionStorage.setItem(storageKey, "1");
    } catch {
      // Best-effort; session-only persistence.
    }
    setDismissed(true);
  }

  if (!mounted || dismissed) return null;

  const typeLabel = exampleFor
    ? MEMBER_TYPE_LABELS[exampleFor] ?? exampleFor.replace(/_/g, " ")
    : null;

  return (
    <section
      aria-label="Representative example notation"
      className="relative px-8 py-3"
      // Match ComplianceDisclaimerBanner styling (--color-blaze-grey-darker
      // #262626) so the two posture/context banners read as a consistent
      // dark band at the top of the workstation.
      style={{ backgroundColor: "var(--color-blaze-grey-darker)" }}
    >
      <div className="mx-auto flex max-w-6xl items-start justify-between gap-4">
        <p className="text-xs leading-relaxed text-white">
          <span className="font-semibold">Sample conversation arc</span>
          {typeLabel ? (
            <>
              {" "}
              — representative example for{" "}
              <span className="font-medium">{typeLabel}</span> (
              {representativeOf}).
            </>
          ) : (
            <> — representative example for {representativeOf}.</>
          )}{" "}
          <span className="text-white/70">
            The full pipeline includes 220 Members; this is a detailed example
            of a typical cultivation pattern.
          </span>
        </p>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss representative-example notation"
          className="shrink-0 text-xs text-white/70 transition-colors hover:text-white"
        >
          × Dismiss
        </button>
      </div>
    </section>
  );
}
