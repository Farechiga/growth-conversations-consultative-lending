"use client";

/*
 * Sprint 9 Patch F → Patch G → Patch H — TRACK-002 Business Vehicle
 * Loan visualization. Dispatch key + filename preserved across the
 * three redesigns for stability (`structural_content.type ===
 * "vehicle_capacity_uplift"`).
 *
 * Patch H redesign — vertical stacked bars with capacity ceilings.
 * The earlier horizontal three-row layout (Patch G) communicated the
 * temporal progression but didn't visualize the loan's relationship
 * to fleet capacity, and showed monthly debt service only as text.
 * The new chart structure makes both readable at a glance:
 *
 *   Three vertical bars side-by-side (Today / Month 1 / Month 12
 *   projected), each stacked from the bottom up with:
 *     - base       : current monthly revenue (slate)
 *     - recaptured : declined revenue captured back (Blaze orange)
 *     - induced    : projected growth from the expanded capacity
 *                    (light orange with dashed border — flags this
 *                    as a banker estimate, not realized yet)
 *     - debtService: monthly debt service overlay (transparent fill,
 *                    slate dashed outline; appears only on Bars 2+3)
 *
 *   Two dotted horizontal reference lines span the chart:
 *     - Current capacity ceiling   (slate dashed) — what the fleet
 *       could serve today if no jobs were declined
 *     - Expanded capacity ceiling  (Blaze orange dashed) — the new
 *       ceiling post-loan
 *
 *   Visual reading: Bar 1 reaches just below the current ceiling
 *   (the gap = declined demand). Bar 2 reaches the current ceiling
 *   exactly (recapture closes the gap). Bar 3 grows toward the
 *   expanded ceiling (induced demand fills the new headroom).
 *
 * Color discipline: slate + orange family only. No green anywhere.
 * Induced segment's dashed border communicates "projected, not yet
 * realized" without breaking the orange-family grammar.
 */

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Label,
  LabelList,
  Legend,
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
  num,
  tooltipUSD,
} from "./shared";

export function VehicleCapacityUpliftChart({
  parameterValues,
}: {
  parameterValues: Record<string, string>;
}) {
  const vehicleType =
    parameterValues.vehicle_type?.toString().trim() || "vehicle";
  const vehicleCount = Math.max(1, num(parameterValues, "vehicle_count", 1));
  const monthlyDebtService = num(parameterValues, "monthly_debt_service");
  const declined = num(parameterValues, "current_declined_revenue_monthly");
  const currentRevenue = num(parameterValues, "current_monthly_revenue");
  const induced = num(parameterValues, "projected_induced_demand_monthly");
  const horizonMonths = num(
    parameterValues,
    "induced_demand_realization_months",
    12,
  );
  // Sprint 4/9 — capacity_utilization_now is source-linked to FACTOR-006.
  // No literal fallback: an absent value renders as "not captured" in the
  // narrative below, never as a fabricated percentage (the prior `80`
  // silently masked Northland's captured 88%).
  const utilizationRaw = parameterValues.capacity_utilization_now;
  const utilizationKnown =
    utilizationRaw !== undefined && String(utilizationRaw).trim() !== "";
  const utilization = num(parameterValues, "capacity_utilization_now");
  const uplift = Math.max(
    0,
    num(parameterValues, "expected_capacity_uplift", 0),
  );

  // Capacity ceilings (Block 1.2 computed parameters).
  const currentCapacityCeiling = currentRevenue + declined;
  const expandedCapacityCeiling = currentCapacityCeiling * (1 + uplift / 100);

  const vehiclePluralSuffix = vehicleCount === 1 ? "" : "s";
  const vehicleLabel = `${vehicleType.toLowerCase()}${vehiclePluralSuffix}`;

  // Per-bar totals for the LabelList annotation above each bar.
  const totalToday = currentRevenue;
  const totalMonth1 = currentRevenue + declined;
  const totalMonth12 = currentRevenue + declined + induced;

  const data = [
    {
      category: "Today",
      base: Math.round(currentRevenue),
      recaptured: 0,
      induced: 0,
      debtService: 0,
      total: Math.round(totalToday),
      totalLabel: fmtUSD(totalToday),
    },
    {
      category: "Month 1",
      base: Math.round(currentRevenue),
      recaptured: Math.round(declined),
      induced: 0,
      debtService: Math.round(monthlyDebtService),
      total: Math.round(totalMonth1),
      totalLabel: fmtUSD(totalMonth1),
    },
    {
      category: `Month ${horizonMonths} projected`,
      base: Math.round(currentRevenue),
      recaptured: Math.round(declined),
      induced: Math.round(induced),
      debtService: Math.round(monthlyDebtService),
      total: Math.round(totalMonth12),
      totalLabel: fmtUSD(totalMonth12),
    },
  ];

  const month1Coverage =
    monthlyDebtService > 0 ? declined / monthlyDebtService : 0;
  const month12Coverage =
    monthlyDebtService > 0
      ? (declined + induced) / monthlyDebtService
      : 0;

  // Reserve a y-domain that comfortably accommodates the expanded
  // capacity ceiling + a hair of headroom so its label doesn't crash
  // into the top of the chart.
  const yMax = Math.ceil(expandedCapacityCeiling * 1.08);

  return (
    <div className="space-y-3">
      <div className="rounded border border-blaze-rule bg-white p-3">
        <div style={{ width: "100%", height: 360 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 36, right: 24, bottom: 16, left: 12 }}
            >
              <CartesianGrid
                stroke={ARTIFACT_PALETTE.referenceGrid}
                vertical={false}
              />
              <XAxis
                dataKey="category"
                tick={{ fontSize: 11, fill: ARTIFACT_PALETTE.axis }}
              />
              <YAxis
                tickFormatter={fmtUSD}
                tick={{ fontSize: 11, fill: ARTIFACT_PALETTE.axis }}
                domain={[0, yMax]}
                width={72}
                label={{
                  value: "Monthly revenue ($)",
                  position: "insideLeft",
                  angle: -90,
                  offset: 4,
                  fontSize: 11,
                  fill: ARTIFACT_PALETTE.axis,
                  style: { textAnchor: "middle" },
                }}
              />
              <Tooltip
                contentStyle={{ fontSize: 11, borderRadius: 4 }}
                formatter={tooltipUSD}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <ReferenceLine
                y={currentCapacityCeiling}
                stroke={ARTIFACT_PALETTE.beforeState}
                strokeDasharray="3 3"
                ifOverflow="extendDomain"
              >
                <Label
                  value="current capacity"
                  position="insideTopLeft"
                  fill={ARTIFACT_PALETTE.beforeState}
                  fontSize={10}
                  offset={4}
                />
              </ReferenceLine>
              <ReferenceLine
                y={expandedCapacityCeiling}
                stroke={ARTIFACT_PALETTE.afterState}
                strokeDasharray="3 3"
                ifOverflow="extendDomain"
              >
                <Label
                  value="expanded capacity"
                  position="insideTopLeft"
                  fill={ARTIFACT_PALETTE.afterState}
                  fontSize={10}
                  offset={4}
                />
              </ReferenceLine>
              <Bar
                dataKey="base"
                stackId="rev"
                name="Current monthly revenue"
                fill={ARTIFACT_PALETTE.beforeState}
                isAnimationActive={false}
              />
              <Bar
                dataKey="recaptured"
                stackId="rev"
                name="Recaptured (previously declined)"
                fill={ARTIFACT_PALETTE.afterState}
                isAnimationActive={false}
              />
              <Bar
                dataKey="induced"
                stackId="rev"
                name="Induced demand (banker estimate)"
                isAnimationActive={false}
              >
                {data.map((d, i) => (
                  <Cell
                    key={`ind-${i}`}
                    fill={ARTIFACT_PALETTE.afterStateLight}
                    stroke={
                      d.induced > 0 ? ARTIFACT_PALETTE.afterState : "transparent"
                    }
                    strokeDasharray="4 3"
                    strokeWidth={d.induced > 0 ? 1.5 : 0}
                  />
                ))}
              </Bar>
              <Bar
                dataKey="debtService"
                stackId="rev"
                name="Monthly debt service (subtracted)"
                isAnimationActive={false}
              >
                {data.map((d, i) => (
                  <Cell
                    key={`ds-${i}`}
                    fill="transparent"
                    stroke={
                      d.debtService > 0
                        ? ARTIFACT_PALETTE.beforeState
                        : "transparent"
                    }
                    strokeDasharray="3 3"
                    strokeWidth={d.debtService > 0 ? 1.5 : 0}
                  />
                ))}
                <LabelList
                  dataKey="totalLabel"
                  position="top"
                  style={{
                    fontSize: 11,
                    fill: ARTIFACT_PALETTE.annotationText,
                    fontWeight: 600,
                  }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Per-bar captions — three equal columns matching the bars. */}
        <div className="mt-2 grid grid-cols-3 gap-2 text-[11px] text-blaze-grey-body">
          <p>
            ↳{" "}
            <strong className="text-blaze-charcoal">
              {fmtUSDLong(declined)}/mo
            </strong>{" "}
            declined (lost capacity)
          </p>
          <p>
            ↳ +
            <strong className="text-blaze-charcoal">
              {fmtUSDLong(declined)}/mo
            </strong>{" "}
            captured (previously declined)
          </p>
          <p>
            ↳ +
            <strong className="text-blaze-charcoal">
              {fmtUSDLong(induced)}/mo
            </strong>{" "}
            projected growth{" "}
            <span className="italic text-blaze-grey-soft">
              (banker estimate)
            </span>
          </p>
        </div>
      </div>

      <p className={annotationLineClass()}>
        Today, the fleet of {vehicleCount} {vehicleLabel} serves
        approximately{" "}
        <strong>{fmtUSDLong(currentRevenue)}/month</strong>, with another{" "}
        <strong>{fmtUSDLong(declined)}/month</strong> declined because
        the fleet is at capacity (utilization:{" "}
        <strong>
          {utilizationKnown ? `${Math.round(utilization)}%` : "not captured"}
        </strong>
        ). Adding{" "}
        <strong>{vehicleCount}</strong> new {vehicleLabel} expands
        capacity by <strong>{Math.round(uplift)}%</strong>. Immediate
        effect (month 1): the{" "}
        <strong>{fmtUSDLong(declined)}/month</strong> previously declined
        is now serviceable. Over the next{" "}
        <strong>{horizonMonths}</strong> months: expanded capacity
        unlocks new growth — banker estimate of approximately{" "}
        <strong>{fmtUSDLong(induced)}/month</strong> in new revenue from
        larger contracts, geographic reach, and contracts previously not
        pursued. Monthly debt service of{" "}
        <strong>{fmtUSDLong(monthlyDebtService)}</strong> is covered by
        the recaptured revenue alone (
        <strong>{month1Coverage.toFixed(1)}×</strong> coverage at
        month 1). With induced demand at month {horizonMonths}, debt
        service coverage exceeds{" "}
        <strong>{month12Coverage.toFixed(1)}×</strong>.
      </p>
    </div>
  );
}
