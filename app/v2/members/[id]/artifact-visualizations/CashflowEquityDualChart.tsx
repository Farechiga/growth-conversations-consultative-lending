"use client";

/*
 * Sprint 9 Block D — TRACK-006 Investment Property: dual cashflow + equity chart.
 *
 * Two stacked panels:
 *   1. Monthly cashflow breakdown — rent flows in, mortgage + opex flow
 *      out, net cashflow remains. Stacked bar visualization.
 *   2. Wealth accumulation over 10 years — total equity (principal
 *      paydown + appreciation) on the orange line, starting from the
 *      down payment baseline.
 *
 * Sprint 9 Patch B — palette refresh. Top panel: rent=benefit (green),
 * mortgage=cost (red), opex=costLight, net=afterState (Blaze).
 * Bottom panel: equity=afterState (primary line), cumulative cashflow
 * =wealth (teal), initial-investment baseline=reference.
 */

import {
  Bar,
  BarChart,
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

export function CashflowEquityDualChart({
  parameterValues,
}: {
  parameterValues: Record<string, string>;
}) {
  const purchasePrice = num(parameterValues, "purchase_price");
  const loanAmount = num(parameterValues, "loan_amount", purchasePrice * 0.75);
  const downPayment = Math.max(purchasePrice - loanAmount, 0);
  const monthlyRent = num(parameterValues, "monthly_rent");
  const monthlyOpex = num(parameterValues, "monthly_operating_expenses");
  const interestRate = num(parameterValues, "interest_rate", 7.5);
  const termYears = num(parameterValues, "term_years", 30);
  const appreciation = num(parameterValues, "annual_appreciation", 4);
  const monthlyMortgage = monthlyPayment(
    loanAmount,
    interestRate,
    termYears * 12,
  );
  const netCashflow = monthlyRent - monthlyMortgage - monthlyOpex;

  const cashflowSeries = [
    {
      bucket: "Monthly",
      rent: Math.round(monthlyRent),
      mortgage: -Math.round(monthlyMortgage),
      opex: -Math.round(monthlyOpex),
      net: Math.round(netCashflow),
    },
  ];

  const wealthSeries: Array<{
    year: number;
    equity: number;
    cumulative_cashflow: number;
  }> = [];
  let principalRemaining = loanAmount;
  let propertyValue = purchasePrice;
  let cumulativeCashflow = 0;
  wealthSeries.push({
    year: 0,
    equity: Math.round(downPayment),
    cumulative_cashflow: 0,
  });
  for (let year = 1; year <= 10; year++) {
    const r = interestRate / 100 / 12;
    let pBalance = principalRemaining;
    for (let m = 0; m < 12 && pBalance > 0; m++) {
      const interestThisMonth = pBalance * r;
      const principalThisMonth = Math.max(monthlyMortgage - interestThisMonth, 0);
      pBalance -= principalThisMonth;
    }
    principalRemaining = Math.max(pBalance, 0);
    propertyValue *= 1 + appreciation / 100;
    const equity = propertyValue - principalRemaining;
    cumulativeCashflow += netCashflow * 12;
    wealthSeries.push({
      year,
      equity: Math.round(equity),
      cumulative_cashflow: Math.round(cumulativeCashflow),
    });
  }
  const year10 = wealthSeries[wealthSeries.length - 1]!;
  const totalReturn = year10.equity - downPayment + year10.cumulative_cashflow;
  const roiPct =
    downPayment > 0 ? Math.round((totalReturn / downPayment) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="rounded border border-blaze-rule bg-white p-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-blaze-grey-soft">
          Monthly cashflow breakdown
        </p>
        <div style={{ width: "100%", height: 160 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={cashflowSeries}
              layout="vertical"
              margin={{ top: 12, right: 12, bottom: 12, left: 12 }}
            >
              <CartesianGrid
                stroke={ARTIFACT_PALETTE.referenceGrid}
                horizontal={false}
              />
              <XAxis
                type="number"
                tickFormatter={fmtUSD}
                tick={{ fontSize: 11, fill: ARTIFACT_PALETTE.axis }}
              />
              <YAxis
                type="category"
                dataKey="bucket"
                tick={{ fontSize: 11, fill: ARTIFACT_PALETTE.axis }}
                width={68}
              />
              <Tooltip
                contentStyle={{ fontSize: 11, borderRadius: 4 }}
                formatter={tooltipUSD}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <ReferenceLine x={0} stroke={ARTIFACT_PALETTE.axis} />
              <Bar
                dataKey="rent"
                name="Rent received"
                fill={ARTIFACT_PALETTE.benefit}
              />
              <Bar
                dataKey="mortgage"
                name="Mortgage payment"
                fill={ARTIFACT_PALETTE.cost}
              />
              <Bar
                dataKey="opex"
                name="Operating expenses"
                fill={ARTIFACT_PALETTE.costLight}
                stroke={ARTIFACT_PALETTE.cost}
                strokeWidth={1}
              />
              <Bar
                dataKey="net"
                name="Net cashflow"
                fill={ARTIFACT_PALETTE.afterState}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-2 text-[12px] text-blaze-charcoal">
          <strong>Net cashflow per month:</strong> {fmtUSDLong(netCashflow)}
        </p>
      </div>

      <div className="rounded border border-blaze-rule bg-white p-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-blaze-grey-soft">
          Wealth accumulation over 10 years
        </p>
        <div style={{ width: "100%", height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={wealthSeries}
              margin={{ top: 12, right: 12, bottom: 12, left: 12 }}
            >
              <CartesianGrid stroke={ARTIFACT_PALETTE.referenceGrid} />
              <XAxis
                dataKey="year"
                tick={{ fontSize: 11, fill: ARTIFACT_PALETTE.axis }}
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
              <ReferenceLine
                y={downPayment}
                stroke={ARTIFACT_PALETTE.reference}
                strokeDasharray="3 3"
                label={{
                  value: `Initial investment ${fmtUSD(downPayment)}`,
                  position: "insideTopLeft",
                  fill: ARTIFACT_PALETTE.reference,
                  fontSize: 10,
                }}
              />
              <Line
                type="monotone"
                dataKey="equity"
                name="Total equity"
                stroke={ARTIFACT_PALETTE.afterState}
                strokeWidth={2.5}
                dot={{ r: 2.5, fill: ARTIFACT_PALETTE.afterState }}
              />
              <Line
                type="monotone"
                dataKey="cumulative_cashflow"
                name="Cumulative net cashflow"
                stroke={ARTIFACT_PALETTE.wealth}
                strokeWidth={2}
                strokeDasharray="6 3"
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <p className={annotationLineClass()}>
        Initial investment: <strong>{fmtUSDLong(downPayment)}</strong>. Year 10
        equity: <strong>{fmtUSDLong(year10.equity)}</strong>. Cumulative
        cashflow: <strong>{fmtUSDLong(year10.cumulative_cashflow)}</strong>.
        Total return: <strong>{fmtUSDLong(totalReturn)}</strong>{" "}
        ({roiPct}% on initial investment).
      </p>
    </div>
  );
}
