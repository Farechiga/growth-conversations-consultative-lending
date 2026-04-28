"use client";

/*
 * Fleet expansion ROI projection chart — Sprint 3 §C.
 *
 * Northland's Show-step Artifact, per MEMBER_FIXTURE_BRIEF.md §4.5.
 * A Recharts ComposedChart with two synchronized read paths:
 *
 *   1. Lower section — line comparison of cumulative cash position over a
 *      36-month horizon. Two paths:
 *        - "Continue cash-buy" (current path, body grey #4F5052): Northland
 *          continues paying cash for used vehicles, growing fleet slowly,
 *          declining ~70 service calls per peak season.
 *        - "Fleet financing path" (orange #B45F26): two new vehicles
 *          financed at $180K total, 60-month term, 7.5% rate. Captured
 *          revenue from previously-declined calls outweighs debt service
 *          by month ~14, breakeven by ~Q5–Q6 cumulative.
 *
 *   2. Upper section — quarterly stacked bar showing captured vs. declined
 *      revenue under the financing path. Captured revenue (orange) grows
 *      as the new vehicles ramp; declined revenue (grey) shrinks
 *      proportionally as the dispatch capacity expands.
 *
 * Data values are illustrative and hardcoded for the demo; production
 * version would parameterize from the artifact's parameter_schema and
 * Northland's actual revenue data. Values used are documented in
 * BUILD_LOG so they're traceable for the demo review.
 *
 * Inputs from the seed (parameters_used per Conversation captured_data):
 *   revenue_band: "$3M-$5M"
 *   current_fleet_size: 8
 *   proposed_addition: 2
 *   service_call_avg_value: $700
 *   financing_term_months: 60
 *   financing_rate_pct: 7.5
 *
 * Derived monthly debt service: ~$3,600 (per Northland's rationale_text).
 * Derived monthly captured-revenue uplift at full ramp: ~$4,083 (70 calls
 * × $700 ÷ 12 months × ~$8.5K average) — but that's annualized; for the
 * monthly chart the operative figure is ~$3,500–$5,000/mo of captured
 * revenue rising as the new trucks reach full utilization.
 */

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// 36-month horizon, plotted at quarterly resolution (12 quarters) so the
// bar+line composite reads cleanly. Cumulative figures in dollars; values
// chosen so the breakeven crossing lands ~Q5 (mid-year-2), matching the
// brief's "typically by year 2" reframe.
//
// Captured / declined: under the financing path. Q1 has small captured
// revenue (vehicles still ramping); steady growth as both trucks reach
// full dispatch utilization by Q4–Q5.
const DATA = [
  { quarter: "Q1", continueCash: 0, financing: -180000, captured: 8000, declined: 49000 },
  { quarter: "Q2", continueCash: 0, financing: -158000, captured: 18000, declined: 39000 },
  { quarter: "Q3", continueCash: 0, financing: -130000, captured: 32000, declined: 25000 },
  { quarter: "Q4", continueCash: 0, financing: -95000, captured: 42000, declined: 15000 },
  { quarter: "Q5", continueCash: 0, financing: -50000, captured: 49000, declined: 8000 },
  { quarter: "Q6", continueCash: 0, financing: 5000, captured: 50000, declined: 7000 },
  { quarter: "Q7", continueCash: 0, financing: 65000, captured: 51000, declined: 6000 },
  { quarter: "Q8", continueCash: 0, financing: 130000, captured: 52000, declined: 5000 },
  { quarter: "Q9", continueCash: 0, financing: 200000, captured: 52000, declined: 5000 },
  { quarter: "Q10", continueCash: 0, financing: 275000, captured: 52000, declined: 5000 },
  { quarter: "Q11", continueCash: 0, financing: 355000, captured: 52000, declined: 5000 },
  { quarter: "Q12", continueCash: 0, financing: 440000, captured: 52000, declined: 5000 },
];

function fmtDollarTick(v: number): string {
  if (v === 0) return "$0";
  if (Math.abs(v) >= 1000) return `$${(v / 1000).toFixed(0)}K`;
  return `$${v}`;
}

function fmtTooltipValue(value: number): string {
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  if (abs >= 1000) return `${sign}$${(abs / 1000).toFixed(1)}K`;
  return `${sign}$${abs}`;
}

const AXIS_STYLE = {
  fill: "#4F5052",
  fontSize: 12,
  fontFamily: "Inter, system-ui, sans-serif",
};

export function FleetRoiProjectionChart() {
  return (
    <div
      className="rounded border border-blaze-dust bg-white"
      style={{ fontFamily: "Inter, system-ui, sans-serif" }}
    >
      <ResponsiveContainer width="100%" height={360}>
        <ComposedChart data={DATA} margin={{ top: 24, right: 24, left: 16, bottom: 24 }}>
          <CartesianGrid stroke="rgba(232, 224, 212, 0.6)" strokeDasharray="3 3" />
          <XAxis
            dataKey="quarter"
            tick={AXIS_STYLE}
            axisLine={{ stroke: "#888780" }}
            tickLine={{ stroke: "#888780" }}
            label={{
              value: "Quarter (over 36 months)",
              position: "insideBottom",
              offset: -10,
              style: { ...AXIS_STYLE, fontSize: 11 },
            }}
          />
          <YAxis
            tick={AXIS_STYLE}
            tickFormatter={fmtDollarTick}
            axisLine={{ stroke: "#888780" }}
            tickLine={{ stroke: "#888780" }}
            label={{
              value: "Cumulative cash impact ($)",
              angle: -90,
              position: "insideLeft",
              offset: 0,
              style: { ...AXIS_STYLE, fontSize: 11, textAnchor: "middle" },
            }}
          />
          <Tooltip
            formatter={(value, name) => [
              fmtTooltipValue(typeof value === "number" ? value : Number(value ?? 0)),
              String(name),
            ]}
            contentStyle={{
              fontFamily: "Inter, system-ui, sans-serif",
              fontSize: 12,
              border: "1px solid #D7D3D0",
              borderRadius: 6,
              backgroundColor: "rgba(255, 255, 255, 0.96)",
            }}
            labelStyle={{ color: "#262626", fontWeight: 500 }}
          />
          <Legend
            wrapperStyle={{
              fontFamily: "Inter, system-ui, sans-serif",
              fontSize: 12,
              color: "#4F5052",
              paddingTop: 8,
            }}
            verticalAlign="top"
            align="right"
          />
          {/* Stacked bars: declined revenue (grey, "what's being left on the
              table") and captured revenue (orange, "what financing unlocks"),
              quarterly. The two stack on top of each other so the visual is
              "this is the total addressable pool; orange is what we capture
              and grey is what we still leave on the table" — and the grey
              shrinks as the new trucks reach full utilization. */}
          <Bar
            dataKey="declined"
            name="Declined (lost to capacity)"
            stackId="revenue"
            fill="#888780"
            opacity={0.6}
          />
          <Bar
            dataKey="captured"
            name="Captured (new dispatch capacity)"
            stackId="revenue"
            fill="#B45F26"
            opacity={0.85}
          />
          {/* Line comparison: continue-cash baseline (flat at $0 — Northland
              breaks even on cash but doesn't grow) vs. financing path
              (negative early as debt service hits, crosses breakeven around
              Q5–Q6, accelerates as trucks reach full utilization). */}
          <Line
            type="monotone"
            dataKey="continueCash"
            name="Continue cash-buy baseline"
            stroke="#4F5052"
            strokeWidth={2}
            dot={false}
            strokeDasharray="6 3"
          />
          <Line
            type="monotone"
            dataKey="financing"
            name="With $180K Vehicle/Fleet Loan"
            stroke="#B45F26"
            strokeWidth={2.5}
            dot={{ r: 3, fill: "#B45F26", strokeWidth: 0 }}
            activeDot={{ r: 5, fill: "#B45F26", strokeWidth: 0 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
