"use client";

/*
 * Sprint 9 Block C — TRACK-004 SBA 7(a): Growth trajectory chart.
 *
 * Two-line revenue trajectory over the loan term — organic growth
 * (without financing) vs. expansion-fueled growth (with SBA 7(a)) —
 * with a modest debt-service overlay so the cost of financing reads
 * as small next to the revenue uplift it unlocks.
 *
 * Sprint 9 Patch B — palette refresh. Debt-service area uses the
 * muted `cost` red rather than bright danger red.
 */

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
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

export function GrowthTrajectoryChart({
  parameterValues,
}: {
  parameterValues: Record<string, string>;
}) {
  const currentRevenue = num(parameterValues, "current_annual_revenue");
  const loanAmount = num(parameterValues, "loan_amount");
  const termYears = num(parameterValues, "term_years", 10);
  const interestRate = num(parameterValues, "interest_rate", 8);
  const year1Uplift = num(parameterValues, "expected_year_1_revenue_uplift");
  const withGrowthRate = num(
    parameterValues,
    "expected_annual_growth_rate_with_loan",
    12,
  );
  const organicGrowthRate = num(parameterValues, "organic_growth_rate", 6);

  const annualDS =
    monthlyPayment(loanAmount, interestRate, termYears * 12) * 12;

  const series: Array<{
    year: number;
    organic: number;
    with_loan: number;
    debt_service: number;
  }> = [];
  for (let year = 0; year <= termYears; year++) {
    const organic =
      currentRevenue * Math.pow(1 + organicGrowthRate / 100, year);
    let withLoan: number;
    if (year === 0) {
      withLoan = currentRevenue;
    } else {
      const base = currentRevenue + year1Uplift;
      withLoan = base * Math.pow(1 + withGrowthRate / 100, year - 1);
    }
    series.push({
      year,
      organic: Math.round(organic),
      with_loan: Math.round(withLoan),
      debt_service: year === 0 ? 0 : Math.round(annualDS),
    });
  }
  const cumulativeUplift = series.reduce(
    (sum, row) => sum + (row.with_loan - row.organic),
    0,
  );
  const cumulativeDebtService = annualDS * termYears;
  const netGain = cumulativeUplift - cumulativeDebtService;

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
                dataKey="year"
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
                width={68}
              />
              <Tooltip
                contentStyle={{ fontSize: 11, borderRadius: 4 }}
                formatter={tooltipUSD}
                labelFormatter={(year) => `Year ${year}`}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line
                type="monotone"
                dataKey="organic"
                name="Organic growth (no loan)"
                stroke={ARTIFACT_PALETTE.beforeState}
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="with_loan"
                name="With SBA 7(a) expansion"
                stroke={ARTIFACT_PALETTE.afterState}
                strokeWidth={2.5}
                dot={{ r: 2.5, fill: ARTIFACT_PALETTE.afterState }}
              />
              <Area
                type="monotone"
                dataKey="debt_service"
                name="Annual debt service"
                stroke={ARTIFACT_PALETTE.cost}
                fill={ARTIFACT_PALETTE.costFill}
                strokeWidth={1}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
      <p className={annotationLineClass()}>
        Over {termYears} years the loan adds{" "}
        <strong>{fmtUSDLong(cumulativeUplift)}</strong> in cumulative revenue
        over organic growth against{" "}
        <strong>{fmtUSDLong(cumulativeDebtService)}</strong> in debt service — a
        net gain of <strong>{fmtUSDLong(netGain)}</strong>.
      </p>
    </div>
  );
}
