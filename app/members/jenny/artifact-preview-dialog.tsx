"use client";

/*
 * Artifact preview modal scaffolding (Day-2 step b.4).
 *
 * Wraps the native HTML <dialog> element, which gives us free-of-charge focus
 * trapping, ESC-to-close, and backdrop styling via ::backdrop. The Recharts
 * chart rendering itself is deferred to Day 3 — for now the modal body shows
 * the artifact metadata, the parameters used, and a "Chart rendering — Day 3"
 * placeholder.
 *
 * Per Semantic Discipline Principle 4: prose in the modal comes from the
 * Artifact's description field, not from inlined strings. Banker-facing
 * register throughout (this surface is banker-only).
 */

import { useRef } from "react";
import { SeasonalSmoothingChart } from "./seasonal-smoothing-chart";

export type ArtifactPreviewData = {
  title: string;
  description: string;
  type: "chart" | "comparison" | "calculator";
  template: string;
  parameters_used: Record<string, unknown>;
  shared_on_iso: string;
  member_reaction: string;
  shared_afterward: boolean;
  conversation_date_iso: string;
};

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
        className="m-auto rounded-lg border border-blaze-frost-edge bg-white/95 p-0 shadow-2xl backdrop:bg-blaze-grey-darker/70 max-w-2xl w-full"
        // Native <dialog> uses ::backdrop, but in case of older browsers we close on outside click too.
        onClick={(e) => {
          if (e.target === dialogRef.current) close();
        }}
      >
        <div className="flex items-start justify-between border-b border-blaze-dust px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-blaze-grey-soft">
              Artifact preview · {artifact.type}
            </p>
            <h2 className="mt-1 text-lg font-semibold text-blaze-grey-darker">{artifact.title}</h2>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="rounded p-1 text-blaze-grey-soft hover:bg-blaze-cream hover:text-blaze-grey-darker"
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

        <div className="space-y-4 px-6 py-5 text-sm text-blaze-grey-darker">
          <section>
            <p className="text-xs font-semibold uppercase tracking-wide text-blaze-grey-soft">
              Description
            </p>
            <p className="mt-1 leading-relaxed">{artifact.description}</p>
          </section>

          <section>
            <p className="text-xs font-semibold uppercase tracking-wide text-blaze-grey-soft">
              Parameters used (this rendering)
            </p>
            <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
              {Object.entries(artifact.parameters_used).map(([key, val]) => (
                <div key={key} className="contents">
                  <dt className="text-xs text-blaze-grey-soft">{key}</dt>
                  <dd className="text-xs font-mono text-blaze-grey-darker">
                    {typeof val === "string" ? val : JSON.stringify(val)}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <section>
            <p className="text-xs font-semibold uppercase tracking-wide text-blaze-grey-soft">
              Share record
            </p>
            <p className="mt-1 text-xs text-blaze-grey-body">
              Shown in the conversation on{" "}
              <span className="font-medium text-blaze-grey-darker">
                {new Date(artifact.conversation_date_iso).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
              . Member reaction:{" "}
              <span className="font-medium text-blaze-grey-darker">{artifact.member_reaction}</span>
              .
              {artifact.shared_afterward
                ? " Sent as takeaway after the meeting."
                : " Not sent as takeaway."}
            </p>
          </section>

          <section>
            <p className="text-xs font-semibold uppercase tracking-wide text-blaze-grey-soft">
              Chart
            </p>
            <div className="mt-2">
              {artifact.template === "seasonal_smoothing_chart_v1" ? (
                <SeasonalSmoothingChart />
              ) : (
                <div className="rounded border-2 border-dashed border-blaze-frost-edge bg-blaze-cream/40 p-6 text-center">
                  <p className="text-xs uppercase tracking-wide text-blaze-grey-soft">
                    Chart rendering
                  </p>
                  <p className="mt-1 text-sm text-blaze-grey-body">
                    Renderer for template{" "}
                    <code className="rounded bg-white px-1 py-px text-[0.85em]">
                      {artifact.template}
                    </code>{" "}
                    plugs in alongside the seasonal smoothing chart on a future day.
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="flex justify-end gap-3 border-t border-blaze-dust px-6 py-3">
          <button
            type="button"
            onClick={close}
            className="rounded border border-blaze-grey-soft bg-transparent px-4 py-1.5 text-sm font-medium text-blaze-grey-dark transition-colors hover:bg-blaze-cream"
          >
            Close
          </button>
        </div>
      </dialog>
    </>
  );
}
