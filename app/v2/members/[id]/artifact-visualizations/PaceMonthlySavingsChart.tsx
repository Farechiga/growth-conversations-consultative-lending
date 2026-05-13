"use client";

/*
 * Sprint 9 Block G — TRACK-009 PACE: monthly savings vs assessment chart.
 *
 * Sprint 9 Patch C — structural redesign. The earlier chart rendered
 * assessment as negative bars BELOW zero and savings as positive bars
 * ABOVE; the visual emphasis read "this product costs a lot" rather
 * than "this product turns expense into ongoing positive cashflow."
 *
 * New structure (all bars positive):
 *
 *   During PACE term (years 1..pace_term_years):
 *     - Bottom segment: annual PACE assessment (cost — muted red)
 *     - Top segment:    net energy savings benefit (savings minus
 *                       assessment — muted green)
 *     - Total bar height = annual energy savings (the full benefit
 *       before subtracting the assessment)
 *
 *   Post-PACE term (years pace_term_years+1..pace_term_years+5):
 *     - Single segment: full annual energy savings, entirely green
 *     - Same total height as during-PACE bars, but ALL of it is now
 *       cashflow (no assessment slice)
 *
 * The contrast between "mostly green with small red base" and "all
 * green" reveals the after-PACE cliff effect — the demo punchline:
 * during PACE you net most of the savings; after PACE you net all of
 * them.
 *
 * Patch C decisions (documented in BUILD_LOG):
 *   - Year 0 "do nothing" baseline NOT included. A zero-height bar
 *     adds no signal; the chart starts at year 1 (during PACE).
 *   - "Net annual benefit" line DROPPED. With the new stacking, the
 *     green segment of each bar IS the net benefit — a separate line
 *     traces redundant information.
 *   - XAxis type="number" so the term-end ReferenceLine can sit at
 *     pace_term_years + 0.5 (between bars), not on a bar centerline.
 *
 * Color palette (post-Patch-E refresh):
 *   - assessment:        ARTIFACT_PALETTE.cost       (darker grey)
 *   - net benefit:       ARTIFACT_PALETTE.afterState (warm Blaze orange)
 *   - term-end annotation: ARTIFACT_PALETTE.annotation
 *
 * PACE local override: the post-Patch-E palette pushed `benefit` to
 * near-black, which would have left PACE reading as black-on-grey with
 * no warm accent in the bars (only the dashed term-end line carried
 * orange). For PACE specifically, the net-benefit segment IS the
 * loan-enabled outcome — the hero — so it's painted with the
 * `afterState` warm-Blaze orange rather than `benefit`. Assessment
 * stays grey. The term-end ReferenceLine label uses `annotationText`
 * (orange-800), which reads as slightly darker than the bar orange so
 * the cliff annotation still pops over the post-PACE solid-orange
 * bars.
 */

import {
  Bar,
  BarChart,
  CartesianGrid,
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
  monthlyPayment,
  num,
  tooltipUSD,
} from "./shared";

// PACE-only accent override. The global ARTIFACT_PALETTE.afterState
// uses orange-700 (#C2410C); PACE renders with the slightly warmer
// brand Blaze orange so the savings bars and term-end annotation
// read in the same hue per Francisco's locked decision. Scoped to
// this chart only — other Sprint 9 visualizations keep the global
// afterState.
const PACE_ACCENT = "#B45F26";
const PACE_ACCENT_DEEP = "#9A4818"; // slightly darker for label text

export function PaceMonthlySavingsChart({
  parameterValues,
}: {
  parameterValues: Record<string, string>;
}) {
  const improvementCost = num(parameterValues, "improvement_cost");
  const paceTermYears = num(parameterValues, "pace_term_years", 20);
  const interestRate = num(parameterValues, "interest_rate", 6);
  const monthlySavings = num(parameterValues, "monthly_energy_savings");
  const monthlyAssessment =
    num(parameterValues, "monthly_assessment") ||
    monthlyPayment(improvementCost, interestRate, paceTermYears * 12);

  const annualSavings = monthlySavings * 12;
  const annualAssessment = monthlyAssessment * 12;
  const annualNetBenefit = annualSavings - annualAssessment;

  // 5 years past the term-end so the post-PACE cliff is unmistakable.
  const horizonYears = paceTermYears + 5;
  const series: Array<{
    year: number;
    assessment: number;
    net_benefit: number;
  }> = [];
  let cumulativeNet = 0;
  for (let year = 1; year <= horizonYears; year++) {
    const isDuringPace = year <= paceTermYears;
    const assessment = isDuringPace ? Math.round(annualAssessment) : 0;
    const netBenefit = isDuringPace
      ? Math.round(annualNetBenefit)
      : Math.round(annualSavings);
    cumulativeNet += isDuringPace ? annualNetBenefit : annualSavings;
    series.push({ year, assessment, net_benefit: netBenefit });
  }
  const totalCumulativeNet = Math.round(cumulativeNet);

  // Tick positions: every 5 years plus the term-end year so the
  // reader can read it off the x-axis directly.
  const ticks = [1, 5, 10, 15, 20, 25].filter(
    (t) => t >= 1 && t <= horizonYears,
  );
  if (!ticks.includes(paceTermYears) && paceTermYears <= horizonYears) {
    ticks.push(paceTermYears);
    ticks.sort((a, b) => a - b);
  }

  return (
    <div className="space-y-3">
      <div className="rounded border border-blaze-rule bg-white p-3">
        <div style={{ width: "100%", height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={series}
              margin={{ top: 28, right: 16, bottom: 16, left: 12 }}
            >
              <CartesianGrid
                stroke={ARTIFACT_PALETTE.referenceGrid}
                vertical={false}
              />
              <XAxis
                dataKey="year"
                type="number"
                domain={[0.5, horizonYears + 0.5]}
                ticks={ticks}
                tick={{ fontSize: 11, fill: ARTIFACT_PALETTE.axis }}
                label={{
                  value: "Year",
                  position: "insideBottom",
                  offset: -2,
                  fontSize: 11,
                  fill: ARTIFACT_PALETTE.axis,
                }}
              />
              <YAxis
                tickFormatter={fmtUSD}
                tick={{ fontSize: 11, fill: ARTIFACT_PALETTE.axis }}
                width={72}
                label={{
                  value: "Annual cashflow ($)",
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
                labelFormatter={(year) => `Year ${year}`}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <ReferenceLine
                x={paceTermYears + 0.5}
                stroke={PACE_ACCENT}
                strokeDasharray="3 3"
                label={{
                  value: "PACE paid off — savings flow through entirely",
                  position: "top",
                  fill: PACE_ACCENT_DEEP,
                  fontSize: 10,
                }}
              />
              {/*
                Sprint 9 Patch F Block 4 — stacking order reversed.
                Net benefit (the keeper) sits at the bottom of each
                bar so it reads as the floor of cashflow that lands
                in the business; the assessment (the subtraction)
                sits on top so it reads as "taken from the top" of
                the gross savings. Recharts renders bars in the
                array order — the first Bar paints from the
                baseline up; the second stacks on top. Keeping
                annual_savings as the total bar height means
                post-PACE bars (assessment=0) remain solid orange
                at the same height, which is exactly the cliff
                effect.
              */}
              <Bar
                dataKey="net_benefit"
                stackId="cashflow"
                name="Net energy savings benefit"
                fill={PACE_ACCENT}
              />
              <Bar
                dataKey="assessment"
                stackId="cashflow"
                name="Annual PACE assessment"
                fill={ARTIFACT_PALETTE.cost}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <p className={annotationLineClass()}>
        Annual energy savings:{" "}
        <strong>{fmtUSDLong(annualSavings)}</strong>. The annual PACE
        assessment of{" "}
        <strong>{fmtUSDLong(annualAssessment)}</strong> is taken from the
        top of those savings (paid through your property tax for{" "}
        {paceTermYears} years), leaving net annual benefit of{" "}
        <strong>{fmtUSDLong(annualNetBenefit)}</strong>. After year{" "}
        {paceTermYears}, the assessment ends — the full{" "}
        <strong>{fmtUSDLong(annualSavings)}</strong> in annual savings
        flows to cashflow. Cumulative net benefit over {horizonYears}{" "}
        years: <strong>{fmtUSDLong(totalCumulativeNet)}</strong>.
      </p>
    </div>
  );
}
