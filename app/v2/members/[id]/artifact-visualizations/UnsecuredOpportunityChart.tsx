"use client";

/*
 * Sprint 9 Block I — TRACK-011 Unsecured Loan: opportunity-cost decision chart.
 *
 * Sprint 9 Patch D — restructured into a three-bar proportional
 * comparison (Interest cost / Opportunity value / Net benefit). The
 * scale disparity ("cost tiny, opportunity large") is the primary
 * visual signal; the math + decision framing carry the reasoning.
 *
 * Sprint 9 Patch F — range bars now anchor at zero (Choice A2). The
 * original Patch D range mode rendered Recharts `[low, high]` tuples
 * for the opportunity + net-benefit bars, which produced floating
 * bands hovering above the baseline. The reframed pattern: each
 * range-mode bar splits into a SOLID portion ($0 → central estimate)
 * and a TRANSLUCENT upside portion (central → high). The eye reads
 * "definite + uncertain upside" instead of "floating range."
 *
 * Mode 2 fallback: when banker captured low + high but no central,
 * the midpoint = (low + high) / 2 is used as the implicit central for
 * the solid portion. Translucent upside spans midpoint → high.
 *
 * Risk flag: when `net_benefit_low` is at or below zero, the net-
 * benefit solid bar gets a dashed cost outline — the math-card
 * callout below the chart reinforces with red text.
 *
 * Color palette (Patch G — orange-family adherence per locked
 * decision: Unsecured = "loan is the enabler" = orange family):
 *   - interest cost:       ARTIFACT_PALETTE.cost           (dark grey)
 *   - opportunity value:   ARTIFACT_PALETTE.afterState     (Blaze orange)
 *   - net benefit:         ARTIFACT_PALETTE.annotationText (orange-800,
 *                          darker variant — same family, visually
 *                          distinct from the opportunity bar by hue
 *                          intensity rather than introducing a new
 *                          accent)
 *   - translucent upside:  same color as solid, at 35% fillOpacity
 *   - risk flag:           dashed cost outline on the solid bar
 */

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
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
} from "./shared";

export function UnsecuredOpportunityChart({
  parameterValues,
}: {
  parameterValues: Record<string, string>;
}) {
  const loanAmount = num(parameterValues, "loan_amount");
  const termMonths = num(parameterValues, "term_months", 24);
  const interestRate = num(parameterValues, "interest_rate", 11);
  const opportunityValue = num(parameterValues, "opportunity_value");
  const opportunityValueLow = num(parameterValues, "opportunity_value_low");
  const opportunityValueHigh = num(parameterValues, "opportunity_value_high");

  const monthlyPmt = monthlyPayment(loanAmount, interestRate, termMonths);
  const totalInterest = Math.max(0, monthlyPmt * termMonths - loanAmount);

  // Mode resolution. Range mode requires both low and high; either or
  // both may be paired with a central `opportunity_value`. When low +
  // high are captured but central is missing (Mode 2), the midpoint
  // stands in as central for the solid-bar geometry.
  const hasRange = opportunityValueLow > 0 && opportunityValueHigh > 0;
  const oppLow = hasRange ? opportunityValueLow : opportunityValue;
  const oppHigh = hasRange ? opportunityValueHigh : opportunityValue;
  const oppCentral =
    opportunityValue > 0
      ? opportunityValue
      : hasRange
      ? (oppLow + oppHigh) / 2
      : 0;

  const netBenefitLow = oppLow - totalInterest;
  const netBenefitHigh = oppHigh - totalInterest;
  const netBenefitCentral = oppCentral - totalInterest;
  const hasRiskAtLowEnd = hasRange && netBenefitLow <= 0;

  // Solid bar geometry — anchored at zero. Clamps negative centrals
  // to zero so the bar still anchors cleanly (the risk-flag dashed
  // outline + math card communicate the negative-tail risk).
  const opportunitySolid = Math.max(0, Math.round(oppCentral));
  const opportunityUpside = hasRange
    ? Math.max(0, Math.round(oppHigh - oppCentral))
    : 0;
  const netBenefitSolid = Math.max(0, Math.round(netBenefitCentral));
  const netBenefitUpside = hasRange
    ? Math.max(0, Math.round(netBenefitHigh - Math.max(0, netBenefitCentral)))
    : 0;

  type Row = {
    category: string;
    solid: number;
    upside: number;
    annotation: string;
    solidFill: string;
    upsideFill: string;
    riskStroke: boolean;
  };

  const data: Row[] = [
    {
      category: "Interest cost",
      solid: Math.round(totalInterest),
      upside: 0,
      annotation: fmtUSD(totalInterest),
      solidFill: ARTIFACT_PALETTE.cost,
      upsideFill: ARTIFACT_PALETTE.cost,
      riskStroke: false,
    },
    {
      category: "Opportunity value",
      solid: opportunitySolid,
      upside: opportunityUpside,
      annotation: hasRange
        ? `${fmtUSD(oppLow)} – ${fmtUSD(oppHigh)}`
        : fmtUSD(oppCentral),
      solidFill: ARTIFACT_PALETTE.afterState,
      upsideFill: ARTIFACT_PALETTE.afterState,
      riskStroke: false,
    },
    {
      category: "Net benefit",
      solid: netBenefitSolid,
      upside: netBenefitUpside,
      annotation: hasRange
        ? `${fmtUSD(netBenefitLow)} – ${fmtUSD(netBenefitHigh)}`
        : fmtUSD(netBenefitCentral),
      // Patch G — restored to the orange family (annotationText =
      // orange-800, an existing palette constant). Visually distinct
      // from the opportunity bar's brighter orange-700 while keeping
      // Unsecured in the locked orange-family grammar.
      solidFill: ARTIFACT_PALETTE.annotationText,
      upsideFill: ARTIFACT_PALETTE.annotationText,
      riskStroke: hasRiskAtLowEnd,
    },
  ];

  const opportunityDisplay = hasRange
    ? `${fmtUSDLong(oppLow)} – ${fmtUSDLong(oppHigh)}` +
      (opportunityValue > 0 ? ` (central ${fmtUSDLong(opportunityValue)})` : "")
    : fmtUSDLong(oppCentral);
  const netBenefitDisplay = hasRange
    ? `${fmtUSDLong(netBenefitLow)} – ${fmtUSDLong(netBenefitHigh)}`
    : fmtUSDLong(netBenefitCentral);

  return (
    <div className="space-y-3">
      <div className="rounded border border-blaze-rule bg-white p-3">
        <div style={{ width: "100%", height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 28, right: 16, bottom: 16, left: 12 }}
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
                width={72}
                label={{
                  value: "Dollar value ($)",
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
                formatter={(value, name) => {
                  const label =
                    name === "solid"
                      ? "Central / point estimate"
                      : "Upside to high estimate";
                  return [fmtUSDLong(Number(value)), label];
                }}
              />
              <ReferenceLine y={0} stroke={ARTIFACT_PALETTE.axis} />
              <Bar
                dataKey="solid"
                stackId="band"
                barSize={64}
                isAnimationActive={false}
              >
                {data.map((entry, i) => (
                  <Cell
                    key={`solid-${i}`}
                    fill={entry.solidFill}
                    stroke={
                      entry.riskStroke ? ARTIFACT_PALETTE.cost : undefined
                    }
                    strokeDasharray={entry.riskStroke ? "4 3" : undefined}
                    strokeWidth={entry.riskStroke ? 1.5 : 0}
                  />
                ))}
              </Bar>
              <Bar
                dataKey="upside"
                stackId="band"
                barSize={64}
                isAnimationActive={false}
              >
                {data.map((entry, i) => (
                  <Cell
                    key={`upside-${i}`}
                    fill={entry.upsideFill}
                    fillOpacity={0.35}
                  />
                ))}
                <LabelList
                  dataKey="annotation"
                  position="top"
                  style={{ fontSize: 11, fill: ARTIFACT_PALETTE.annotationText }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        {hasRange && (
          <p className="mt-1 text-[11px] text-blaze-grey-body">
            Solid bars show the central estimate. Translucent fill shows
            upside to the high estimate. Bars anchor at zero — definite
            outcome plus uncertain upside.
          </p>
        )}
      </div>

      <div className="rounded border border-blaze-rule bg-white p-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-blaze-grey-soft">
          Decision framing
        </p>
        <p className="mt-2 text-[12px] text-blaze-charcoal">
          <strong>Without the loan:</strong> the opportunity passes. Cost
          $0. Value captured $0. Net $0.
        </p>
        <p className="mt-1 text-[12px] text-blaze-charcoal">
          <strong>With the loan:</strong> you pay{" "}
          <strong>{fmtUSDLong(totalInterest)}</strong> in interest over{" "}
          {termMonths} months. You capture <strong>{opportunityDisplay}</strong>{" "}
          in opportunity value. Net benefit:{" "}
          <strong>{netBenefitDisplay}</strong>.
        </p>
        {hasRiskAtLowEnd && (
          <p className="mt-2 text-[12px] text-blaze-danger">
            <strong>Note:</strong> at the low end of the opportunity range,
            the net benefit is small or negative. Worth confirming the
            opportunity value with the Member before committing.
          </p>
        )}
      </div>

      <p className={annotationLineClass()}>
        {hasRange
          ? hasRiskAtLowEnd
            ? "At the high end the loan is clearly worth it; at the low end the math is marginal. Tighten the opportunity estimate with the Member before committing."
            : "Even at the low end of the opportunity range, net benefit is positive — the loan likely pays for itself across the range."
          : `Opportunity value exceeds interest cost by ${fmtUSDLong(netBenefitCentral)} — the loan pays for itself.`}
      </p>
    </div>
  );
}
