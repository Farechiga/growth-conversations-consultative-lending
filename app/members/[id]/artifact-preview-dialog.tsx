"use client";

/*
 * Artifact preview modal — borderless typography-led treatment per
 * BLAZE_STYLE_GUIDE.md §4.5. Dialog itself keeps a subtle elevation (the
 * §14 "no drop shadows on default state" rule applies to in-flow page
 * panels, not modals — modals are an active state). Sub-sections inside the
 * modal use the same orange-rectangle section labels and chip pattern as
 * the main page.
 *
 * Per Semantic Discipline Principle 4: prose comes from the Artifact's
 * description field, not from inlined strings. Banker-facing register
 * throughout (this surface is banker-only).
 */

import { useRef } from "react";
import { SeasonalSmoothingChart } from "./seasonal-smoothing-chart";
import { FleetRoiProjectionChart } from "./fleet-roi-projection-chart";
import { CapitalEventPartnershipMap } from "./capital-event-partnership-map";

export type ArtifactPreviewData = {
  title: string;
  description: string;
  type: "chart" | "comparison" | "calculator";
  template: string;
  parameters_used: Record<string, unknown>;
  shared_on_iso: string;
  // member_reaction removed in Sprint 1 review fix #4 — see lib/enum-descriptions.ts
  // RECOMMENDATION_RESPONSE_DESCRIPTIONS for the canonical home of "how the member
  // responded." The dialog still surfaces the share-record fact (date + takeaway)
  // but the engagement-quality signal lives on Recommendation.response now.
  shared_afterward: boolean;
  conversation_date_iso: string;
};

function ModalSectionLabel({ label }: { label: string }) {
  // Modal sub-sections use the compact-size mark (18×16) and label text
  // (19px) — proportionally smaller than the main page's section labels
  // so the modal feels of-a-piece without competing with the main column.
  // Title case per BLAZE_STYLE_GUIDE §4.5; orange rectangle does the
  // anchoring work without typographic shouting.
  return (
    <div className="flex items-baseline">
      <span aria-hidden className="inline-block h-4 w-[18px] mr-2 bg-blaze-orange" />
      <span className="text-[19px] font-semibold tracking-[0.02em] text-blaze-charcoal leading-none">
        {label}
      </span>
    </div>
  );
}

export function ArtifactPreviewDialog({ artifact }: { artifact: ArtifactPreviewData }) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  function open() {
    dialogRef.current?.showModal();
  }
  function close() {
    dialogRef.current?.close();
  }

  return (
    <>
      <button
        type="button"
        onClick={open}
        className="text-left font-medium text-blaze-orange-deep underline-offset-2 hover:underline"
      >
        {artifact.title}
      </button>

      <dialog
        ref={dialogRef}
        className="m-auto bg-blaze-paper p-0 shadow-2xl backdrop:bg-blaze-grey-darker/70 max-w-2xl w-full"
        // Native <dialog> uses ::backdrop; close on outside-click as a fallback.
        onClick={(e) => {
          if (e.target === dialogRef.current) close();
        }}
      >
        <div className="flex items-start justify-between border-b border-blaze-rule px-6 py-4">
          <div>
            <p className="text-xs font-medium text-blaze-grey-body">
              Artifact preview · {artifact.type}
            </p>
            <h2 className="mt-1 text-lg font-semibold text-black">{artifact.title}</h2>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="p-1 text-blaze-grey-body hover:text-blaze-charcoal"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden>
              <path
                d="M5 5l10 10M15 5l-10 10"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className="space-y-6 px-6 py-5 text-sm text-blaze-charcoal">
          <section>
            <ModalSectionLabel label="Description" />
            <p className="mt-3 leading-relaxed">{artifact.description}</p>
          </section>

          <section>
            <ModalSectionLabel label="Parameters used (this rendering)" />
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1">
              {Object.entries(artifact.parameters_used).map(([key, val]) => (
                <div key={key} className="contents">
                  <dt className="text-xs text-blaze-grey-body">{key}</dt>
                  <dd className="text-xs font-mono text-blaze-charcoal">
                    {typeof val === "string" ? val : JSON.stringify(val)}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <section>
            <ModalSectionLabel label="Share record" />
            <p className="mt-3 text-xs text-blaze-grey-body">
              Shown in the conversation on{" "}
              <span className="font-medium text-blaze-charcoal">
                {new Date(artifact.conversation_date_iso).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
.
              {artifact.shared_afterward
                ? " Sent as takeaway after the meeting."
                : " Not sent as takeaway."}
            </p>
          </section>

          <section>
            {/* Sprint 3 §C/§D — Artifact renderer dispatches on template.
                Three templates currently registered: Jenny's seasonal
                smoothing chart, Northland's fleet ROI projection, Cygnus's
                capital event partnership map (custom SVG schematic, not a
                Recharts chart). Section label adapts to the artifact type
                so "Chart" doesn't appear above a relationship diagram. */}
            <ModalSectionLabel
              label={artifact.type === "comparison" ? "Schematic" : "Chart"}
            />
            <div className="mt-3">
              {artifact.template === "seasonal_smoothing_chart_v1" ? (
                <SeasonalSmoothingChart />
              ) : artifact.template === "fleet_roi_composed_chart_v1" ? (
                <FleetRoiProjectionChart />
              ) : artifact.template === "capital_event_map_v1" ? (
                <CapitalEventPartnershipMap />
              ) : (
                <div className="border border-dashed border-blaze-rule p-6 text-center">
                  <p className="text-xs font-semibold text-blaze-grey-body">
                    Renderer not registered
                  </p>
                  <p className="mt-1 text-sm text-blaze-grey-body">
                    No registered renderer for template{" "}
                    <code className="font-mono text-blaze-charcoal">
                      {artifact.template}
                    </code>
                    .
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="flex justify-end gap-3 border-t border-blaze-rule px-6 py-3">
          <button
            type="button"
            onClick={close}
            className="bg-transparent px-4 py-1.5 text-sm font-medium text-blaze-charcoal transition-colors hover:bg-blaze-orange-pale"
          >
            Close
          </button>
        </div>
      </dialog>
    </>
  );
}
