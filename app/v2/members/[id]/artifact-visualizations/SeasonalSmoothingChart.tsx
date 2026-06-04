"use client";

/*
 * Seasonal cashflow smoothing — parameterized 12-month projection.
 *
 * TRACK-001 Working Capital LOC outcome visualization. Fills the Sprint 9
 * gap for TRACK-001 and replaces the legacy hardcoded SeasonalSmoothingChart
 * on the v2 template-render path: this version is driven entirely by the
 * member's captured / confirmed essentials, so it regenerates whenever the
 * banker enters or changes the numbers.
 *
 * Inputs (resolved parameterValues):
 *   annual_revenue_band     — annual revenue (overall cash scale)
 *   seasonal_variance       — % peak-to-trough swing
 *   slow_season_gap         — slow-season cash shortfall (trough depth)
 *   requested_credit_limit  — LOC size (smoothing capacity + label)
 *   draw_pattern            — which season is slow (Q1 / Q4 / Mid-year / Mixed)
 *   repayment_window        — months over which the draws are repaid
 *
 * Without LOC: cash position dips below zero during the slow season.
 * With LOC: draws — bounded by the credit limit — hold cash above a small
 * positive floor through the slow months, then repay over the repayment
 * window, so the line stays positive all year. Illustrative, not a claim.
 */

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ARTIFACT_PALETTE } from "./palette";
import { fmtUSD, num, tooltipUSD } from "./shared";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// Slow-season month indices by draw pattern (when the member draws the LOC).
function slowMonthsFor(pattern: string): number[] {
  const p = (pattern ?? "").toLowerCase();
  if (p.includes("q4")) return [9, 10, 11]; // Oct–Dec
  if (p.includes("mid")) return [5, 6, 7]; // Jun–Aug
  if (p.includes("mixed")) return [0, 1, 8, 9]; // Jan–Feb + Sep–Oct
  return [0, 1, 2]; // Q1 heavy (default) — Jan–Mar
}

export function SeasonalSmoothingChart({
  parameterValues,
}: {
  parameterValues: Record<string, string>;
}) {
  const annual = num(parameterValues, "annual_revenue_band", 600000);
  const variancePct = num(parameterValues, "seasonal_variance", 25);
  const slowGap = num(parameterValues, "slow_season_gap", 0);
  const creditLimit = num(parameterValues, "requested_credit_limit", 0);
  const drawPattern = parameterValues.draw_pattern || "Q1 heavy";
  const repaymentWindow = Math.max(
    1,
    Math.round(num(parameterValues, "repayment_window", 6)),
  );

  const monthlyBase = annual / 12;
  const variance = Math.min(0.9, Math.max(0.05, variancePct / 100));
  const peakSurplus = Math.round(monthlyBase * variance);

  const slow = slowMonthsFor(drawPattern);
  const slowSet = new Set(slow);
  // Trough depth per slow month from the captured slow-season gap; falls
  // back to the seasonal swing when no explicit gap is supplied.
  const troughDepth = Math.round(
    (slowGap > 0 ? slowGap : peakSurplus * slow.length) / slow.length,
  );

  // Seasonal factor per month in [-1, +1]: −1 nearest a slow month, +1
  // farthest from every slow month (peak season). Nearest-cluster distance
  // keeps multi-cluster patterns (e.g. Mixed) reading correctly.
  const factor = (m: number) => {
    let dmin = 6;
    for (const s of slow) {
      let d = Math.abs(m - s);
      if (d > 6) d = 12 - d;
      if (d < dmin) dmin = d;
    }
    return -Math.cos((Math.PI * Math.min(dmin, 6)) / 6);
  };

  // Without-LOC cash position: factor −1 → −troughDepth, +1 → +peakSurplus.
  const withoutLoc = MONTHS.map((_, m) => {
    const f = factor(m);
    const mid = (peakSurplus - troughDepth) / 2;
    const amp = (peakSurplus + troughDepth) / 2;
    return Math.round(mid + amp * f);
  });

  // With-LOC: draw during slow months (bounded by the credit limit) to hold
  // a small positive floor, then repay over the repayment window.
  const floor = Math.max(Math.round(peakSurplus * 0.12), 1000);
  const withLoc = withoutLoc.slice();
  let drawn = 0;
  for (const m of slow) {
    if (withoutLoc[m] < floor) {
      const draw = Math.min(floor - withoutLoc[m], Math.max(0, creditLimit - drawn));
      withLoc[m] = withoutLoc[m] + draw;
      drawn += draw;
    }
  }
  if (drawn > 0) {
    const lastSlow = Math.max(...slow);
    const repayPer = Math.round(drawn / repaymentWindow);
    for (let k = 1; k <= repaymentWindow; k++) {
      const m = (lastSlow + k) % 12;
      if (!slowSet.has(m)) withLoc[m] = withoutLoc[m] - repayPer;
    }
  }

  const data = MONTHS.map((month, m) => ({
    month,
    withoutLoc: withoutLoc[m],
    withLoc: withLoc[m],
  }));
  const locLabel =
    creditLimit > 0
      ? `Cash position with ${fmtUSD(creditLimit)} LOC`
      : "Cash position with LOC";
  const minDip = Math.min(...withoutLoc);

  return (
    <div className="space-y-3">
      <div className="rounded border border-blaze-rule bg-white p-3">
        <div style={{ width: "100%", height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={data}
              margin={{ top: 24, right: 20, left: 12, bottom: 16 }}
            >
              <CartesianGrid
                stroke={ARTIFACT_PALETTE.referenceGrid}
                strokeDasharray="3 3"
              />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: ARTIFACT_PALETTE.axis }}
                label={{
                  value: "Month",
                  position: "insideBottom",
                  offset: -4,
                  fontSize: 11,
                  fill: ARTIFACT_PALETTE.axis,
                }}
              />
              <YAxis
                tickFormatter={fmtUSD}
                width={64}
                tick={{ fontSize: 11, fill: ARTIFACT_PALETTE.axis }}
                label={{
                  value: "Cash position",
                  angle: -90,
                  position: "insideLeft",
                  offset: 6,
                  fontSize: 11,
                  fill: ARTIFACT_PALETTE.axis,
                  style: { textAnchor: "middle" },
                }}
              />
              <Tooltip
                contentStyle={{ fontSize: 11, borderRadius: 4 }}
                formatter={tooltipUSD}
              />
              <Legend
                wrapperStyle={{ fontSize: 11 }}
                verticalAlign="top"
                align="right"
              />
              <ReferenceLine y={0} stroke={ARTIFACT_PALETTE.reference} />
              <Area
                type="monotone"
                dataKey="withLoc"
                name={locLabel}
                stroke="none"
                fill="rgba(194, 65, 12, 0.10)"
                isAnimationActive={false}
                legendType="none"
              />
              <Line
                type="monotone"
                dataKey="withoutLoc"
                name="Cash position without LOC"
                stroke={ARTIFACT_PALETTE.beforeState}
                strokeWidth={2}
                dot={{ fill: ARTIFACT_PALETTE.beforeState, r: 3 }}
                activeDot={{ r: 5 }}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="withLoc"
                name={locLabel}
                stroke={ARTIFACT_PALETTE.afterState}
                strokeWidth={2.5}
                dot={{ fill: ARTIFACT_PALETTE.afterState, r: 3 }}
                activeDot={{ r: 5 }}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
      <p className="text-[12px] leading-relaxed text-blaze-grey-body">
        Without a line of credit, cash position dips to{" "}
        <strong>{fmtUSD(minDip)}</strong> during the slow season. A{" "}
        <strong>{fmtUSD(creditLimit)}</strong> LOC — drawn during the slow
        months and repaid over {repaymentWindow} months as strong-season
        revenue flows in — holds cash positive all year, smoothing the{" "}
        {drawPattern.toLowerCase()} cycle.
      </p>
    </div>
  );
}
