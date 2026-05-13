"use client";

/*
 * Tracks-supported-by-current-evidence panel — Sprint 4.7 Block M.
 *
 * Surfaces inside the Land objective. Click "Land" objective name on the
 * sidebar → this panel opens in-place.
 *
 * Compliance-careful framing per ARCHITECTURE_V2 §10.2 / COMPLIANCE.md
 * §10.2 (verbatim, non-negotiable):
 *
 *   ✓ "Tracks supported by current evidence"
 *   ✓ "Strong support / moderate support / insufficient evidence yet"
 *   ✓ "The banker considers and decides"
 *
 * Banned (compliance-fraught):
 *   ❌ "Candidate tracks"
 *   ❌ "Recommended for this Member"
 *   ❌ "Eligible for"
 *   ❌ "Bumped to candidate track"
 *
 * Demo data is hand-curated per fixture in seed.ts with FIXME annotations
 * (Q-M1 resolution); Francisco reviews and refines. Per
 * ARCHITECTURE_V2 §10.4 — at three Members, true cross-portfolio
 * anonymized intelligence is not feasible.
 */

export type TrackEvidenceItem = {
  track_name: string;
  evidence_count?: number;
  rationale: string;
};

export type TrackEvidenceCohort = {
  strong: TrackEvidenceItem[];
  moderate: TrackEvidenceItem[];
  insufficient: TrackEvidenceItem[];
};

export function TracksSupportedPanel({
  cohort,
  onClose,
}: {
  cohort: TrackEvidenceCohort | null;
  onClose: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tracks-supported-title"
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 px-4 pt-20"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl rounded border border-blaze-rule bg-white p-6 shadow-xl"
      >
        <div className="flex items-baseline justify-between">
          <h2
            id="tracks-supported-title"
            className="text-base font-semibold text-blaze-charcoal"
          >
            Tracks supported by current evidence
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-blaze-grey-body hover:text-blaze-charcoal"
            aria-label="Close panel"
          >
            × Close
          </button>
        </div>
        <p className="mt-1 text-xs italic text-blaze-grey-soft">
          The banker considers and decides. Evidence strength reflects
          captured signals, magnitudes, and reactions only.
        </p>

        {cohort ? (
          <div className="mt-5 space-y-5">
            {cohort.strong.length > 0 && (
              <Cohort
                heading="Strong support"
                rows={cohort.strong}
                strengthLabel="strong support"
              />
            )}
            {cohort.moderate.length > 0 && (
              <Cohort
                heading="Moderate support"
                rows={cohort.moderate}
                strengthLabel="moderate support"
              />
            )}
            {cohort.insufficient.length > 0 && (
              <Cohort
                heading="Insufficient evidence yet"
                rows={cohort.insufficient}
                strengthLabel="insufficient evidence yet"
              />
            )}
          </div>
        ) : (
          <p className="mt-5 text-sm italic text-blaze-grey-body">
            No Tracks identified for this Member yet. Capture more evidence
            via the activities above.
          </p>
        )}
      </div>
    </div>
  );
}

function Cohort({
  heading,
  rows,
  strengthLabel,
}: {
  heading: string;
  rows: TrackEvidenceItem[];
  strengthLabel: string;
}) {
  return (
    <section>
      <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-blaze-grey-body">
        {heading}
      </p>
      <ul className="mt-2 space-y-2">
        {rows.map((row) => (
          <li
            key={row.track_name}
            className="rounded border border-blaze-rule bg-white p-3"
          >
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-sm font-medium text-blaze-charcoal">
                {row.track_name}
              </p>
              <p className="text-[11px] text-blaze-grey-body">
                {strengthLabel}
                {typeof row.evidence_count === "number" && (
                  <span className="ml-1 text-blaze-grey-soft">
                    ({row.evidence_count} evidence{" "}
                    {row.evidence_count === 1 ? "dot" : "dots"})
                  </span>
                )}
              </p>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-blaze-grey-body">
              {row.rationale}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
