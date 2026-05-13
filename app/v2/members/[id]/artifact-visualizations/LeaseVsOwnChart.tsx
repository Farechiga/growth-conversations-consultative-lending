"use client";

/*
 * Sprint 9 Block B — TRACK-003 CRE Term Loan: Lease-vs-Own wealth chart.
 *
 * Dual-line cumulative cost chart over 15 years, with an equity line
 * for the ownership scenario. Shows the crossover point where owning
 * becomes cheaper than leasing + the final equity built by year 15.
 *
 * Sprint 9 Patch B — palette refresh + annotation accuracy. The
 * ReferenceLine label now reads "Ownership pulls ahead at year X"
 * (was "Ownership ahead from year X" which over-claimed pre-crossover).
 */

import {
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

export function LeaseVsOwnChart({
  parameterValues,
}: {
  parameterValues: Record<string, string>;
}) {
  const acquisitionPrice = num(parameterValues, "acquisition_price");
  const loanAmount = num(parameterValues, "loan_amount", acquisitionPrice * 0.7);
  const amortizationYears = num(parameterValues, "amortization_years", 25);
  const interestRate = num(parameterValues, "interest_rate", 7);
  const currentMonthlyRent = num(parameterValues, "current_monthly_rent");
  const rentEscalation = num(parameterValues, "annual_rent_escalation", 3);
  const appreciation = num(parameterValues, "annual_appreciation", 3);
  const downPayment = Math.max(acquisitionPrice - loanAmount, 0);

  const monthlyDS = monthlyPayment(
    loanAmount,
    interestRate,
    amortizationYears * 12,
  );
  const annualDS = monthlyDS * 12;

  const series: Array<{
    year: number;
    cumulative_rent: number;
    cumulative_ownership_cost: number;
    equity: number;
    // Patch H Block 5+6 — "Own — net cost" = cumulative_ownership_cost
    // minus equity built. Plotted as a fourth line so the year-1
    // crossover with the leasing-total-paid line is visually obvious
    // (the existing three lines — rent, own-paid, equity — required
    // the viewer to mentally subtract). Sign convention chosen per
    // spec Option (c): keep all four lines on the same positive y-
    // axis so the chart doesn't need to swing into negatives.
    own_net_cost: number;
  }> = [];
  let cumulativeRent = 0;
  let cumulativeOwnership = downPayment;
  let principalRemaining = loanAmount;
  let propertyValue = acquisitionPrice;

  for (let year = 0; year <= 15; year++) {
    if (year === 0) {
      series.push({
        year,
        cumulative_rent: 0,
        cumulative_ownership_cost: downPayment,
        equity: downPayment,
        own_net_cost: 0, // down payment exactly equals starting equity
      });
      continue;
    }
    const yearRent =
      currentMonthlyRent * 12 * Math.pow(1 + rentEscalation / 100, year - 1);
    cumulativeRent += yearRent;
    cumulativeOwnership += annualDS;

    const r = interestRate / 100 / 12;
    let pBalance = principalRemaining;
    for (let m = 0; m < 12 && pBalance > 0; m++) {
      const interestThisMonth = pBalance * r;
      const principalThisMonth = Math.max(monthlyDS - interestThisMonth, 0);
      pBalance -= principalThisMonth;
    }
    principalRemaining = Math.max(pBalance, 0);
    propertyValue *= 1 + appreciation / 100;
    const ownedEquity = propertyValue - principalRemaining;

    series.push({
      year,
      cumulative_rent: Math.round(cumulativeRent),
      cumulative_ownership_cost: Math.round(cumulativeOwnership),
      equity: Math.round(ownedEquity),
      // Net cost = what's been paid minus what's been built. Clamp to
      // ≥ 0 so the y-axis never needs to swing negative. Most CRE
      // scenarios drive this near zero early because equity from
      // appreciation outpaces the cost-vs-equity gap.
      own_net_cost: Math.max(0, Math.round(cumulativeOwnership - ownedEquity)),
    });
  }

  // Crossover year — NET POSITION crossover (Patch G Block 1). Net
  // position for ownership = -(cumulative mortgage paid) + (equity
  // built); for leasing it's just -(cumulative rent paid) with zero
  // equity. Ownership pulls ahead the first year its net position
  // exceeds leasing's, i.e. when equity built ≥ (cum ownership cost −
  // cum rent). Equivalently: cum ownership cost − equity ≤ cum rent
  // — the form we evaluate below.
  let crossoverYear: number | null = null;
  for (const row of series) {
    const netOwnershipCost = row.cumulative_ownership_cost - row.equity;
    if (row.year > 0 && netOwnershipCost <= row.cumulative_rent) {
      crossoverYear = row.year;
      break;
    }
  }
  const last = series[series.length - 1]!;

  // Patch G Block 2 — tiered annotation wording. Frames the crossover
  // explicitly as a NET-POSITION event so the reader doesn't confuse
  // it with a cumulative-cost crossover (which may never happen — own
  // total paid often stays above lease total paid through year 15).
  const referenceLabel =
    crossoverYear === null
      ? "Net position favors ownership"
      : crossoverYear <= 3
      ? `Ownership net position pulls ahead at year ${crossoverYear}`
      : crossoverYear <= 8
      ? `Ownership net position pulls ahead at year ${crossoverYear}`
      : `Ownership net position pulls ahead at year ${crossoverYear}`;
  const supportingSentence =
    crossoverYear === null
      ? ""
      : crossoverYear <= 3
      ? ` Net position (cost minus equity) shifts in favor of ownership at year ${crossoverYear} — equity builds faster than the cost differential.`
      : crossoverYear <= 8
      ? ` Net position (cost minus equity) shifts in favor of ownership at year ${crossoverYear} once equity exceeds the cumulative cost gap.`
      : ` Net position (cost minus equity) shifts in favor of ownership at year ${crossoverYear}; until then, leasing is cheaper on paper but builds no equity.`;

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
                dataKey="cumulative_rent"
                name="Continued leasing — total paid"
                stroke={ARTIFACT_PALETTE.beforeState}
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="cumulative_ownership_cost"
                name="Own with CRE Term Loan — total paid"
                stroke={ARTIFACT_PALETTE.afterState}
                strokeWidth={2.5}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="equity"
                name="Equity built (ownership)"
                stroke={ARTIFACT_PALETTE.wealth}
                strokeWidth={2.5}
                strokeDasharray="6 3"
                dot={false}
              />
              {/*
                Patch H Block 6 — explicit "Own — net cost" line. Renders
                in the darker orange family variant so it sits in the
                same ownership-related colour grammar as the "Own total
                paid" line but reads as distinct. Visual story: this
                line dips below "Continued leasing — total paid" near
                the annotated crossover year, making the year-1 (or
                later) crossover visually honest.
              */}
              <Line
                type="monotone"
                dataKey="own_net_cost"
                name="Own — net cost (paid minus equity)"
                stroke={ARTIFACT_PALETTE.annotationText}
                strokeWidth={3}
                dot={{ r: 2.5, fill: ARTIFACT_PALETTE.annotationText }}
              />
              {crossoverYear !== null && (
                <ReferenceLine
                  x={crossoverYear}
                  stroke={ARTIFACT_PALETTE.annotation}
                  strokeDasharray="3 3"
                  label={{
                    value: referenceLabel,
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
        <strong>At year 15:</strong> leasing has paid out{" "}
        <strong>{fmtUSDLong(last.cumulative_rent)}</strong> with{" "}
        <strong>$0 equity</strong>. Owning has paid{" "}
        <strong>{fmtUSDLong(last.cumulative_ownership_cost)}</strong> and built{" "}
        <strong>{fmtUSDLong(last.equity)}</strong> in equity. Cumulative
        cost stays higher for ownership through the term — but the equity
        is the difference.{supportingSentence}
      </p>
    </div>
  );
}
