"use client";

/*
 * Sprint 7a Block F — phase funnel drill-down.
 * Sprint 7a-patch Block A — subhead clarifies bar semantics; closed
 * bar visually distinct (muted, gap above); 90-day progression
 * sparkline removed.
 *
 * Funnel shape with flow-rate arrows. Click a phase → Member list.
 * Filter-responsive.
 */

import { useMemo, useState } from "react";
import type { DailyActivity, Phase, SyntheticMember } from "@/lib/synthetic-data/types";
import { PHASE_LABELS, TRACK_LABELS } from "@/lib/synthetic-data/types";
import { SyntheticMemberLink } from "../components/MemberLink";

const PHASE_ORDER: Phase[] = ["discover", "measure", "consult", "navigate"];

export function PhaseFunnelView({
  members,
  daily,
  closedCount12mo,
}: {
  members: SyntheticMember[];
  daily: DailyActivity[];
  closedCount12mo: number;
}) {
  const [selectedPhase, setSelectedPhase] = useState<Phase | null>(null);

  const counts = useMemo(() => {
    const out: Record<Phase, number> = {
      discover: 0,
      measure: 0,
      consult: 0,
      navigate: 0,
    };
    for (const m of members) out[m.current_phase] += 1;
    return out;
  }, [members]);

  const flows = useMemo(() => {
    let dToM = 0,
      mToC = 0,
      cToN = 0,
      nToClosed = 0;
    for (const d of daily) {
      dToM += d.discover_to_measure;
      mToC += d.measure_to_consult;
      cToN += d.consult_to_navigate;
      nToClosed += d.navigate_to_closed;
    }
    return { dToM, mToC, cToN, nToClosed };
  }, [daily]);

  const maxCount = Math.max(counts.discover, counts.measure, counts.consult, counts.navigate, 1);

  const phaseMembers = selectedPhase
    ? members
        .filter((m) => m.current_phase === selectedPhase)
        .sort((a, b) => b.days_in_current_phase - a.days_in_current_phase)
        .slice(0, 12)
    : [];

  return (
    <div className="space-y-6">
      <div className="rounded border border-blaze-rule bg-white p-6">
        <h2 className="text-lg font-semibold text-blaze-charcoal">Phase funnel</h2>
        <p className="mt-1 text-[12px] text-blaze-grey-body">
          Members currently at each phase. Closed bar shows 12-month total.
        </p>
        <p className="mt-1 text-[11px] text-blaze-grey-soft">
          Click a phase to drill into the Member list.
        </p>

        <ol className="mt-5 space-y-3">
          {PHASE_ORDER.map((phase, i) => {
            const count = counts[phase];
            const widthPct = Math.max(8, (count / maxCount) * 100);
            const nextFlow =
              i === 0
                ? flows.dToM
                : i === 1
                ? flows.mToC
                : i === 2
                ? flows.cToN
                : null;
            return (
              <li key={phase}>
                <button
                  type="button"
                  onClick={() => setSelectedPhase(selectedPhase === phase ? null : phase)}
                  className={`flex w-full items-baseline gap-3 text-left transition-colors ${
                    selectedPhase === phase ? "opacity-100" : "hover:opacity-80"
                  }`}
                  aria-pressed={selectedPhase === phase}
                >
                  <span className="w-24 shrink-0 text-[10px] font-semibold uppercase tracking-[0.08em] text-blaze-grey-soft">
                    {PHASE_LABELS[phase]}
                  </span>
                  <span
                    className={`block h-10 rounded ${
                      selectedPhase === phase
                        ? "bg-blaze-orange-deep"
                        : "bg-blaze-orange/70"
                    }`}
                    style={{ width: `${widthPct}%` }}
                    aria-hidden
                  />
                  <span className="ml-2 text-base font-semibold text-blaze-charcoal">{count}</span>
                </button>
                {nextFlow !== null && i < 3 && (
                  <p className="ml-24 pl-3 text-[11px] italic text-blaze-grey-soft">
                    ↓ {nextFlow} moved in 90 days
                  </p>
                )}
              </li>
            );
          })}
          <li className="pt-3 mt-2 border-t border-blaze-rule">
            <div className="flex items-baseline gap-3">
              <span className="w-24 shrink-0 text-[10px] font-semibold uppercase tracking-[0.08em] text-blaze-grey-soft">
                Closed (last 12 months)
              </span>
              <span
                className="block h-10 rounded bg-blaze-grey-soft/40"
                style={{ width: `${Math.max(8, (closedCount12mo / Math.max(maxCount, closedCount12mo)) * 100)}%` }}
                aria-hidden
              />
              <span className="ml-2 text-base font-semibold text-blaze-charcoal">{closedCount12mo}</span>
            </div>
          </li>
        </ol>
      </div>

      {selectedPhase && (
        <div className="rounded border border-blaze-rule bg-white p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-blaze-grey-soft">
            Members in {PHASE_LABELS[selectedPhase]} (top 12 by days-in-phase)
          </p>
          <ul className="mt-2 divide-y divide-blaze-rule text-[12px]">
            {phaseMembers.map((m) => (
              <li key={m.id} className="flex items-baseline gap-3 py-2">
                <SyntheticMemberLink member={m} className="flex-1 font-medium text-blaze-charcoal hover:text-blaze-orange-deep hover:underline" />
                <span className="w-32 text-blaze-grey-soft">{m.member_type.replace(/_/g, " ")}</span>
                <span className="w-40 text-blaze-grey-soft">
                  {TRACK_LABELS[m.current_track_id as keyof typeof TRACK_LABELS] ?? m.current_track_id}
                </span>
                <span className="w-16 text-right text-blaze-charcoal">{m.days_in_current_phase} d</span>
                <span className="w-20 text-right text-blaze-charcoal">
                  ${(m.sized_opportunity_amount / 1000).toFixed(0)}K
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
