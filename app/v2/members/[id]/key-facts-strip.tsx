/*
 * v2 Key Facts Strip — Sprint 4.7 Block D / ARCHITECTURE_V2 §6.2.
 *
 * Horizontal strip of 3-5 hand-curated facts per Member, rendered as
 * glance-able key/value pairs. Lightest-coral background fill
 * (`bg-blaze-coral-pale` if defined, else fallback to a softer cream).
 *
 * Source: `Member.key_facts` Json column populated by seed.ts. Schema:
 *   [{ label, value, source_type, source_id }, ...]
 *
 * Click handler scaffolded with placeholder console.log in Turn 1.
 * Turn 2 wires source-evidence detail panel resolution.
 */

"use client";

export type KeyFact = {
  label: string;
  value: string;
  source_type: string;
  source_id: string | null;
};

export function KeyFactsStrip({ facts }: { facts: KeyFact[] }) {
  if (!facts || facts.length === 0) return null;
  return (
    <div className="border-b border-blaze-rule bg-blaze-cream/60">
      <div className="mx-auto flex max-w-6xl flex-wrap items-baseline gap-x-5 gap-y-2 px-8 py-3">
        {facts.map((fact, i) => (
          <button
            key={i}
            type="button"
            onClick={() => {
              // Sprint 4.7 Block D — placeholder click handler. Turn 2
              // wires this to a source-evidence detail panel.
              // eslint-disable-next-line no-console
              console.log("[v2 key-fact click]", fact);
            }}
            className="text-left transition-opacity hover:opacity-70"
          >
            <span className="text-xs uppercase tracking-[0.04em] text-blaze-grey-body">
              {fact.label}
            </span>{" "}
            <span className="text-sm font-medium text-blaze-charcoal">
              {fact.value}
            </span>
            {i < facts.length - 1 && (
              <span aria-hidden className="ml-5 text-blaze-grey-soft">
                ·
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
