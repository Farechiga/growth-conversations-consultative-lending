"use client";

/*
 * Sprint 9 Block E — TRACK-007 Equipment & Machinery: cost-of-doing-nothing chart.
 *
 * Cumulative-cost dual-line chart over 36 months comparing:
 *   - Aging equipment: monthly maintenance + downtime + declined-job
 *     revenue (the hidden cost of inaction), accumulating with a slight
 *     month-over-month degradation slope.
 *   - New equipment financed: monthly debt service + a small
 *     maintenance baseline. Net cost still grows but at a slower rate.
 *
 * Sprint 9 Patch B Block 1 + 5 — palette + annotation fix. Aging line
 * is now muted slate (`beforeState`), not bright red — the visual
 * grammar is "status quo" not "danger." Annotation wording adapts to
 * whether new equipment is cumulatively cheaper from month 1 (slope
 * advantage) or only after a later breakeven point.
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
import {
  annotationLineClass,
  fmtUSD,
  fmtUSDLong,
  monthlyPayment,
  num,
  tooltipUSD,
} from "./shared";

export function CostOfDoingNothingChart({
  parameterValues,
}: {
  parameterValues: Record<string, string>;
}) {
  const loanAmount = num(parameterValues, "loan_amount");
  const termMonths = num(parameterValues, "term_months", 60);
  const interestRate = num(parameterValues, "interest_rate", 8);
  const agingMaintenance = num(
    parameterValues,
    "current_monthly_maintenance",
  );
  const downtimeCost = num(parameterValues, "monthly_downtime_cost");
  const declinedRevenue = num(parameterValues, "monthly_declined_revenue");
  const newMaintenance = num(
    parameterValues,
    "new_equipment_monthly_maintenance",
    200,
  );

  const monthlyDS = monthlyPayment(loanAmount, interestRate, termMonths);

  const agingDegradationRate = 0.012;
  const declinedGrowthRate = 0.008;

  const series: Array<{
    month: number;
    aging_cumulative: number;
    new_cumulative: number;
    savings_band: number;
  }> = [];
  let agingTotal = 0;
  let newTotal = 0;
  for (let month = 0; month <= 36; month++) {
    if (month === 0) {
      series.push({
        month,
        aging_cumulative: 0,
        new_cumulative: 0,
        savings_band: 0,
      });
      continue;
    }
    const agingMonthly =
      (agingMaintenance + downtimeCost) *
        Math.pow(1 + agingDegradationRate, month - 1) +
      declinedRevenue * Math.pow(1 + declinedGrowthRate, month - 1);
    const newMonthly = monthlyDS + newMaintenance;
    agingTotal += agingMonthly;
    newTotal += newMonthly;
    series.push({
      month,
      aging_cumulative: Math.round(agingTotal),
      new_cumulative: Math.round(newTotal),
      savings_band: Math.max(0, Math.round(agingTotal - newTotal)),
    });
  }

  // Breakeven month — first month where cumulative new < cumulative aging.
  // When this is month 1, the visual story is "new equipment's slope is
  // lower from day one" rather than a discrete crossover event.
  let crossoverMonth: number | null = null;
  for (const row of series) {
    if (row.month > 0 && row.new_cumulative < row.aging_cumulative) {
      crossoverMonth = row.month;
      break;
    }
  }
  const last = series[series.length - 1]!;
  const netSavings = last.aging_cumulative - last.new_cumulative;
  const slopeAdvantageFromStart = crossoverMonth === 1;
  const breakevenLabel = slopeAdvantageFromStart
    ? "Cumulative savings widen from month 1"
    : crossoverMonth !== null
    ? `Breakeven at month ${crossoverMonth}`
    : null;
  const sentenceTail = slopeAdvantageFromStart
    ? "From month 1, new equipment's cumulative cost rises more slowly — the gap widens every month."
    : crossoverMonth !== null
    ? `Breakeven hits around month ${crossoverMonth}; from there forward, new equipment is cumulatively cheaper.`
    : "";

  return (
    <div className="space-y-3">
      <div className="rounded border border-blaze-rule bg-white p-3">
        <div style={{ width: "100%", height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={series}
              margin={{ top: 12, right: 12, bottom: 12, left: 12 }}
            >
              <CartesianGrid stroke={ARTIFACT_PALETTE.referenceGrid} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: ARTIFACT_PALETTE.axis }}
                label={{
                  value: "Month",
                  position: "insideBottom",
                  offset: -2,
                  fontSize: 11,
                  fill: ARTIFACT_PALETTE.axis,
                }}
              />
              <YAxis
                tickFormatter={fmtUSD}
                tick={{ fontSize: 11, fill: ARTIFACT_PALETTE.axis }}
                width={68}
              />
              <Tooltip
                contentStyle={{ fontSize: 11, borderRadius: 4 }}
                formatter={tooltipUSD}
                labelFormatter={(month) => `Month ${month}`}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area
                type="monotone"
                dataKey="savings_band"
                name="Cumulative savings"
                stroke="transparent"
                fill={ARTIFACT_PALETTE.afterStateFill}
                isAnimationActive={false}
                legendType="none"
              />
              <Line
                type="monotone"
                dataKey="aging_cumulative"
                name="Aging equipment — cumulative cost"
                stroke={ARTIFACT_PALETTE.beforeState}
                strokeWidth={2.5}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="new_cumulative"
                name="New equipment financed — cumulative cost"
                stroke={ARTIFACT_PALETTE.afterState}
                strokeWidth={2.5}
                dot={false}
              />
              {crossoverMonth !== null && !slopeAdvantageFromStart && (
                <ReferenceLine
                  x={crossoverMonth}
                  stroke={ARTIFACT_PALETTE.annotation}
                  strokeDasharray="3 3"
                  label={{
                    value: breakevenLabel ?? "",
                    position: "top",
                    fill: ARTIFACT_PALETTE.annotationText,
                    fontSize: 10,
                  }}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
      <p className={annotationLineClass()}>
        Over 36 months: aging equipment costs{" "}
        <strong>{fmtUSDLong(last.aging_cumulative)}</strong> in maintenance,
        downtime, and declined jobs. New equipment financed costs{" "}
        <strong>{fmtUSDLong(last.new_cumulative)}</strong> in debt service +
        maintenance. <strong>Net savings: {fmtUSDLong(netSavings)}</strong>
        {sentenceTail ? ` ${sentenceTail}` : "."}
      </p>
    </div>
  );
}
